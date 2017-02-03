//--// Model: Token

//
// Defines a long-lived access token issued to a client (@see ./Client.js) as a result
//  of a user granting the client access to their data.
//

const mongoose = require('mongoose');
const uuid = require('node-uuid');
const _ = require('lodash');
const scopeType = require('../scopeType');

// TODO: normally TTL might be longer, unless using refresh tokens where an auto handshake
//  can take place instead of having to ask the user to re-auth constantly...
/** @const {number} Time To Live (until expiry): 3 minutes */
const TTL = 3 * 60;

const schema = mongoose.Schema({
  // 'expires' will cause the database entry to be auto-deleted after the specified duration
  //  from when the record gets created
  // once the access token expires, the client will be required to either re-request authorization
  //  or use the refresh token to obtain a new access token
  createdAt: {type: Date, default: Date.now, expires: TTL},

  // time from creation, in ms, when this access token will expire, requiring a refresh token handshake
  // TODO: Can this field be marked as read-only (since it must match the expiry set on 'createdAt')?
  //  But really, why take DB space to store this since we just need it to return to the client
  //  when it requests an access token...? Make TTL a global const and reference here and in the
  //  /routes/token.js module as well...
  expiresIn: {type: Number, default: () => Date.now() + TTL},

  // ID of the user that authorized access to a client; can be used to easily delete/invalidate
  //  all active access tokens in a single operation (i.e. when consuming one of their
  //  issued tokens in case many were generated for some reason)
  userId: {type: String, required: true},

  // ID of the client to whom this access token was issued (there can only ever be
  //  one active/valid access token for one userId/clientId pair, but a user may
  //  grant access to multiple clients)
  clientId: {type: String, required: true, unique: true},

  accessToken: {type: String, default: uuid.v4, unique: true},

  // TODO: this field should be read-only...
  tokenType: {type: String, default: 'bearer'},

  // NOTE: we associate the refresh token here so that if a refresh token is used to
  //  get a new access token, we can easily invalidate any existing related access token
  refreshToken: {type:String, unique: true}, // optional

  // resource access scope granted by user
  scope: {type: String, enum: _.values(scopeType), required: true}
});

module.exports = mongoose.model('Token', schema);
