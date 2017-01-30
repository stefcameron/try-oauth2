//--// Route: /authorize

const debug = require('debug')('try-oauth2:routes:authorize');
const _ = require('lodash');
const express = require('express');
const router = express.Router();
const uuid = require('node-uuid');
const ClientModel = require('../lib/models/Client');
const AuthCodeModel = require('../lib/models/AuthCode');
const scope = require('../lib/scope');

// GET /: allow a user to authorize a client to access their data with the requested
//  access scope/permissions; parameters:
// - response_type:string Must be 'code'.
// - client_id:string ID of the client requesting authorization.
// - redirect_uri:string URI to redirect this request with the authorization code.
//   Must use the 'http' or 'https' protocol and must be within the client's
//   configured domain.
// - [scope:string] Permission scope (defaults to PUBLIC)
router.get('/', (req, res, next) => {
  const responseType = req.query.response_type || undefined;
  const clientId = req.query.client_id || undefined;
  const redirectUri = req.query.redirect_uri || undefined;
  const scope = req.query.scope || scope.PUBLIC;
  const state = req.query.state || undefined;

  if (!responseType) {
    debug('INVALID: missing response_type');
    res.status(400).send('bad request: missing response_type');
    return;
  }

  if (responseType !== 'code') {
    debug(`INVALID: unsupported response type: "${responseType}"`);
    res.status(400).send('bad request: unsupported response_type');
    return;
  }

  if (!clientId || !_.isString(clientId)) {
    debug('INVALID: missing client_id');
    res.status(400).send('bad request: missing client_id');
    return;
  }

  if (!redirectUri || !_.isString(redirectUri) || !redirectUri.match(/^https?\:/)) {
    // TODO: validate this is a properly-formatted URL, perhaps limit to 'https'
    //  and other reasonable secure protocols (excluding 'ftps' for example...)
    debug('INVALID: missing or invalid redirect_uri: %s', redirectUri);
    res.status(400).send('bad request: missing or invalid redirect_uri');
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

    if (redirectUri.includes(client.domain) < 0) {
      // TODO: MUST harden this check...
      debug(`INVALID: redirect_uri "${redirectUri}" is not within client.domain "${client.domain}"`);
      res.status(400).end();
      return;
    }

    // TODO: render the authorization page here with requested scope... or redirect to another
    //  route to do it?
    res.status(500).end();
  });
});

// POST /: user either authorizes or denies access to the client
router.post('/', (req, res, next) => {
  // TODO: did user grant or deny access? issue auth code if they did, redirect with error if not...
  res.status(500).end();
  return;

  // generate a unique auth code for this request
  const authCode = new AuthCodeModel({
    clientId,
    userId: client.userId,
    redirectUri
  });

  authCode.save((err) => {
    if (err) {
      debug(`ERROR: failed to generate auth code: ${err.message}`);
      next(new Error('failed to generate authorization code'));
    }

    if (redirectUri) {
      const authRedirectUri = `${redirectUri}?code=${authCode.code}`;
      if (state) {
        authRedirectUri += `&state=${state}`;
      }
      res.redirect(authRedirectUri);
    } else {
      res.json({state, code: authCode.code});
    }
  });
});

// TODO: token exchange
router.post('/token', (req, res, next) => {
  res.status(404).send();
});

module.exports = router;
