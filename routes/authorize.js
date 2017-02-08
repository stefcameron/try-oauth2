//--// Route: /authorize

const debug = require('debug')('try-oauth2:routes:authorize');
const _ = require('lodash');
const express = require('express');
const uuid = require('node-uuid');
const ClientModel = require('../lib/models/Client');
const AuthCodeModel = require('../lib/models/AuthCode');
const scopeType = require('../lib/scopeType');

const router = express.Router();

// GET /: allow a user to authorize a client to access their data with the requested
//  access scope/permissions, responding with a temporary authorization code that
//  must then be exchanged for a permanent access token; parameters:
// - responseType:string Must be 'code'.
// - clientId:string ID of the client requesting authorization.
// - [redirectUri:string] Optional URI to redirect this request with the
//   authorization code. When specified, nust use the 'http' or 'https' protocol
//   and must be within the client's configured domain. Otherwise, the request
//   must be within the configured domain and the response is JSON.
// - [scope:string] Optional requested permission scope (defaults to PUBLIC)
// - [state:string] Optional app state, returned in redirect if specified (any value)
router.get('/', (req, res, next) => {
  const responseType = req.query.responseType || undefined;
  const clientId = req.query.clientId || undefined;
  const redirectUri = req.query.redirectUri || undefined;
  const state = req.query.state || undefined;

  // default to PUBLIC scope if not specified or invalid
  const scope = _.values(scopeType).includes(req.query.scope) ?
      req.query.scope : scopeType.PUBLIC;

  if (!responseType) {
    debug('INVALID: missing responseType');
    res.status(400).send('bad request: missing responseType');
    return;
  }

  if (responseType !== 'code') {
    debug(`INVALID: unsupported response type: "${responseType}"`);
    res.status(400).send('bad request: unsupported responseType');
    return;
  }

  if (!clientId || !_.isString(clientId)) {
    debug('INVALID: missing clientId');
    res.status(400).send('bad request: missing clientId');
    return;
  }

  // TODO: Should the redirect URI really be optional, resulting in a JSON response
  //  when not specified? How would user approval be obtained?
  if (redirectUri && (!_.isString(redirectUri) || !redirectUri.match(/^https?\:\/\//))) {
    // TODO: validate this is a properly-formatted URL, perhaps limit to 'https'
    //  and other reasonable secure protocols (excluding 'ftps' for example...)
    debug('INVALID: invalid redirectUri: %s', redirectUri);
    res.status(400).send('bad request: missing or invalid redirectUri');
    return;
  }

  ClientModel.findOne({clientId: clientId}, (err, client) => {
    if (err) {
      debug(`ERROR: failed to find client "${clientId}": ${err.message}`);
      next(err);
      return;
    }

    if (!client) {
      debug(`ERROR: unknown client "${clientId}"`);
      res.status(404).end();
      return;
    }

    const validateUri = redirectUri || req.hostname; // use request's hostname if no redirect
    if (validateUri && validateUri.includes(client.domain) < 0) { // TODO: MUST harden this check...
      if (redirectUri) {
        debug(`INVALID: redirectUri "${redirectUri}" is not within client.domain "${client.domain}"`);
      } else {
        debug(`INVALID: request hostname is not within client.domain "${client.domain}"`);
      }
      res.status(400).end();
      return;
    }

    // TODO: Render the authorization page here with requested 'scope' (or redirect to another
    //  route to do it?) instead of just issuing the auth code right away without the user's
    //  permission...
    // TODO: If the user denies access, redirect with 'error=access_denied' instead of 'code=123'
    //  but always include the 'state' param if specified.

    // generate a unique auth code for this request
    // NOTE: we may end-up generating more than one auth code for a given user/client pair,
    //  but we'll clean them all up (consume them) upon the first one used in exchange for
    //  an access token
    const authCode = new AuthCodeModel({
      clientId,
      userId: client.userId,
      scope // scope granted by user
    });

    authCode.save((err) => {
      if (err) {
        debug(`ERROR: failed to generate auth code: ${err.message}`);
        next(new Error('failed to generate authorization code'));
      }

      if (redirectUri) {
        let authRedirectUri = `${redirectUri}?code=${authCode.code}`;
        if (state) {
          authRedirectUri += `&state=${state}`;
        }
        debug('redirecting to: %s', authRedirectUri);
        res.redirect(authRedirectUri);
      } else {
        // TODO: this response may be non-applicable if line 50 is changed to require a
        //  redirect URI in order to obtain user approval...
        const payload = {
          state, // {string}
          code: authCode.code // {string}
        };
        debug('responding with JSON: %o', payload);
        res.json(payload);
      }
    });
  });
});

module.exports = router;
