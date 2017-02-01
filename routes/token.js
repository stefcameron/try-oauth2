//--// Route: /token

const debug = require('debug')('try-oauth2:routes:token');
const _ = require('lodash');
const express = require('express');
const ClientModel = require('../lib/models/Client');
const AuthCodeModel = require('../lib/models/AuthCode');
const TokenModel = require('../lib/models/Token');
const RefreshTokenModel = require('../lib/models/RefreshToken');

const router = express.Router();

router.post('/', (req, res, next) => {
  const grantType = req.body.grant_type || undefined;
  const code = req.body.code || undefined;
  const redirectUri = req.body.redirect_uri || undefined;
  const clientId = req.body.client_id || undefined;

  res.status(500).send('route not operational'); // TODO: route not yet complete

  if (!grantType || !_.isString(grantType)) {
    debug('INVALID: missing/invalid grant_type: %s', grantType);
    res.status(400).end();
    return;
  }

  if (grantType === 'authorization_code') {
    AuthCode.findOne({code: code}, (err, authCode) => {
      if (err) {
        debug('ERROR: failed to find by auth code: %s', err);
        res.status(400).end();
        return;
      }

      if (!authCode) {
        debug('invalid auth code provided: no access');
        res.status(400).end();
        return;
      }

      if (authCode.consumed) {
        debug('auth code already consumed: no access');
        res.status(400).end();
      }

      authCode.consumed = true;
      authCode.save((err) => {
        debug('ERROR: failed to consume authCode "%s": %s', authCode.code, err.message);
        // TODO: how should this situation be mitigated?
      });

      if (authCode.redirectUri !== redirectUri) {
        debug('posted redirect "%s" does not match authCode.redirectUri "%s"', redirectUri,
            authCode.redirectUri);
        res.status(400).end();
        return;
      }

      // as extra security measure, validate the client ID
      ClientModel.findOne({clientId}, (err, client) => {
        if (err) {
          debug('ERROR: failed to find client by ID: %s', err.message);
          res.status(400).end();
          return;
        }

        if (!client) {
          debug('client "%s" does not exist', clientId);
          res.status(400).end();
          return;
        }

        const refreshToken = new RefreshTokenModel({userId: authCode.userId});
        refreshToken.save((err) => {
          debug('ERROR: failed to save new refresh token %o: %s', refreshToken, err.message);
          // TODO: how should this situation be mitigated?
        });

        // TODO: to be continued...
      });
    });
  }
});
