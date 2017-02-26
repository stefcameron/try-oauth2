//--// Route: /token

const debug = require('debug')('try-oauth2:routes:token');
const _ = require('lodash');
const express = require('express');
const grantKind = require('../lib/grantType');
const ClientModel = require('../lib/models/Client');
const AuthCodeModel = require('../lib/models/AuthCode');
const TokenModel = require('../lib/models/Token');
const RefreshTokenModel = require('../lib/models/RefreshToken');

const router = express.Router();

/**
 * [async] Removes all auth codes for the specified user/client pair from the database.
 * @param {String} userId
 * @param {String} clientId
 * @returns {Promise} A promise resolved once all documents have been removed.
 * @throws {Error} If userId or clientId is not a valid string.
 */
const removeAuthCodes = function(userId, clientId) {
  if (!userId || !_.isString(userId)) {
    throw new Error('invalid userId');
  }

  if (!clientId || !_.isString(clientId)) {
    throw new Error('invalid clientId');
  }

  const query = AuthCodeModel.find({userId, clientId});

  return query.exec().then((authCodes) => {
    return Promise.all(authCodes.map((authCode) => {
      return authCode.remove();
    })).then(() => {
      return undefined; // resolve outer with nothing
    }, (err) => {
      debug('ERROR: failed to remove an auth code document: %s', err.message);
      throw err; // reject outer with same error
    });
  }, (err) => {
    debug('ERROR: failed to find auth codes for userId "%s", clientId "%s": %s',
        userId, clientId, err.message);
    throw err; // reject outer with same error
  });
};

// POST /: Issue an access token in exchange for an auth code, given:
// - grantType:String Must be 'authorization_code'
// - code:String Auth code issued after successful user authorization
// - clientId:String ID of the client to whom the auth code was granted
// - clientSecret:String Client secret code issue upon client registration/creation
router.post('/', (req, res, next) => {
  const grantType = req.body.grantType || undefined;
  const clientId = req.body.clientId || undefined;
  const clientSecret = req.body.clientSecret || undefined;
  const code = req.body.code || undefined;

  if (!grantType || !_.isString(grantType)) {
    debug('INVALID: missing/invalid grantType: %s', grantType);
    res.status(400).end();
    return;
  }

  if (grantType === grantKind.AUTH_CODE) {
    AuthCodeModel.findOne({code: code}, (err, authCode) => {
      if (err) {
        debug('ERROR: failed to search for auth code: %s', err.message);
        res.status(500).end();
        return;
      }

      // NOTE: auth code document self-destructs once it reaches EOL as specified in the schema
      if (!authCode) {
        debug('INVALID: auth code not found (may have expired): no access');
        res.status(400).end();
        return;
      }

      // as extra security measure, validate the client ID and secret as a pair
      ClientModel.findOne({clientId, clientSecret}, (err, client) => {
        if (err) {
          debug('ERROR: failed to find client by ID "%s" and secret: %s', clientId, err.message);
          res.status(500).end();
          return;
        }

        if (!client) {
          debug('client ID "%s" and secret pair does not exist', clientId);
          res.status(400).end();
          return;
        }

        // we have a valid client/secret pair: remove ANY auth code(s) issued for this client
        removeAuthCodes(authCode.userId, authCode.clientId).catch((err) => {
          debug('ERROR: failed to remove at least one auth code from database: %s',
              err.message);
          // TODO: What's the mitigation strategy in this case (since we can't
          //  leave a now-consumed auth code laying around...)? Is this why we'd
          //  want a 'consumed' field in the model so that we can at least invalidate
          //  it by updating the document instead of deleting it? Is it possible that
          //  a delete is slower than a write so by relying on remove(), we leave
          //  a small window of time where the same auth code could be used again
          //  (by an attacker) and we'd think it hasn't yet been consumed?
        });

        RefreshTokenModel.findOne({
          userId: authCode.userId,
          clientId: client.clientId
        }, (err, existingRT) => {
          if (err) {
            debug('ERROR: failed to search for existing refresh token: %s', err.message);
          }

          let rtPromise; // {Promise}
          if (existingRT) {
            rtPromise = existingRT.remove();
          }

          // if `rtPromise` is undefined, the promise will resolve
          Promise.resolve(rtPromise).then(() => {
            if (rtPromise) {
              debug('removed previous refresh token "%s" for user "%s", client "%s"',
                  existingRT.token, authCode.userId, client.clientId);
            }
            // else: there was no pre-existing refresh token for this user/client pair

            // make a new refresh token for the new access token we're going to grant
            const refreshToken = new RefreshTokenModel({
              userId: authCode.userId,
              clientId: client.clientId,
              scope: authCode.scope
            });

            refreshToken.save((err) => {
              if (err) {
                debug('ERROR: failed to save new refresh token for user "%s", client "%s": %s',
                    authCode.userId, client.clientId, err.message);
                res.status(500).end();
                return;
              }

              // grant a new access token
              const token = new TokenModel({
                userId: authCode.userId,
                clientId: client.clientId,
                refreshToken: refreshToken.token,
                scope: authCode.scope
              });

              token.save((err) => {
                if (err) {
                  debug('ERROR: failed to save new access token for user "%s", client "%s": %s',
                      authCode.userId, client.clientId, err.message);

                  // delete the refresh token we just issued
                  refreshToken.remove((err) => {
                    debug('ERROR: failed to remove refresh token for user "%s", client "%s": %s',
                        authCode.userId, client.clientId, err.message);
                  });

                  res.status(500).end();
                  return;
                }

                const payload = {
                  accessToken: token.accessToken, // {string}
                  refreshToken: token.refreshToken, // {string}
                  expiresAt: token.expiresAt, // {number}
                  tokenType: token.tokenType, // {string}
                  scope: token.scope // {string}
                };

                res.json(payload);
              }); // END: token.save()
            }); // END: refreshToken.save()
          }, (err) => {
            debug('ERROR: failed to remove existing refresh token for user "%s", client "%s": %s',
                authCode.userId, client.clientId, err.message);
            res.status(500).end();
          }); // END: rtPromise resolve/reject
        }); // END: RefreshTokenModel.findOne()
      }); // END: ClientModel.findOne()
    }); // END: AuthCode.findOne()
  } else {
    // TODO: REFRESH_TOKEN
    debug('invalid grant type: %s (must be "%s")', grantType, grantKind.AUTH_CODE);
    res.status(400).end();
  }
});

module.exports = router;
