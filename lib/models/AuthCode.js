//--// Model: AuthCode

//
// Defines a short-lived access code that must be exchanged for a long-lived access token
//  (@see ./Token.js) in order to access user data.
//

const mongoose = require('mongoose');
const uuid = require('node-uuid');
const _ = require('lodash');
const scopeType = require('../scopeType');

const schema = mongoose.Schema({
  // 'expires' will cause the database entry to be auto-deleted after the specified duration
  //  from when the record gets created
  createdAt: {type: Date, default: Date.now, expires: '10m'}, // 10 min TTL

  // generated auth code to be exchanged for an access token using the client's secret key
  code: {type: String, default: uuid.v4, unique: true},

  // 'clientId' and 'userId' are not unique, which means multiple auth tokens for a given
  //  pair may exist at any given time; ALL should be removed upon the first one being
  //  consumed
  clientId: {type: String, required: true}, // ID of the client that requested access
  userId: {type: String, required: true}, // ID of the user that authorized access to a client

  // resource access scope granted by user
  scope: {type: String, enum: _.values(scopeType), required: true}
});

module.exports = mongoose.model('AuthCode', schema);
