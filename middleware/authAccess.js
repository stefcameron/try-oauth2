//--// Authenticated Access Middleware

const debug = require('debug')('try-oauth2:middleware:authAccess');
const _ = require('lodash');
const TokenModel = require('../lib/models/Token');

/**
 * Checks for bearer token authentication. If not found, responds with 401.
 *  If found but invalid, responds with 400. Otherwise, adds an 'authAccess'
 *  object to the request and hands-off to the next middleware.
 *
 * authAccess object has these properties:
 * - scope:String (@see scopeType) resource access scope granted by user
 */
const middleware = function(req, res, next) {
  let accessToken;

  // check the authorization header for the bearer token
  if (req.get('authorization')) {
    const parts = req.get('authorization').split(' ');
    accessToken = parts.length >= 2 ? parts[1] : undefined;
  } else {
    // access token must be either in request parameters or post body
    accessToken = (req.params && req.params.accessToken) ||
        (req.body && req.body.accessToken);
  }

  if (!accessToken || !_.isString(accessToken)) {
    // no access token: request bearer token authentication
    debug('access token not provided: requesting bearer token authentication');
    res.set('WWW-Authenticate', 'Bearer');
    res.status(401).end();
    return;
  }

  TokenModel.findOne({accessToken}, (err, token) => {
    if (err) {
      debug(`ERROR: failed to find access token: invalid or expired: ${err.message}`);
      res.status(403).end();
      return;
    }

    if (!token) {
      debug('invalid access token: invalid or expired');
      res.status(403).end();
      return;
    }

    // NOTE: Some OAuth2 implementations would invalidate (i.e. delete or marked
    //  'consumed') the access token here, requiring the caller to use their
    //  longer-lived refresh token on the very next API access in order to
    //  get a new access token. In this case, the access token has a short TTL
    //  and remains valid until it expires.

    // add special object to the request
    req.authAccess = {
      scope: token.scope
    }

    next(); // hand-off to next middleware
  });
};

module.exports = middleware;
