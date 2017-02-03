//--// Grant types

/**
 * Access token grant types.
 * @readonly
 * @enum {string}
 * @property {string} AUTH_CODE Request to grant access token based on authorization code.
 * @property {string} REFRESH_TOKEN Request to grant access token based on refresh token.
 */
module.exports = Object.freeze({
  AUTH_CODE: 'authorization_code',
  REFRESH_TOKEN: 'refresh_token'
});
