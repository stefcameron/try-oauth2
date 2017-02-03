//--// Model: RefreshToken

const mongoose = require('mongoose');
const uuid = require('node-uuid');
const _ = require('lodash');
const scopeType = require('../scopeType');

const schema = mongoose.Schema({
  // NOTE: to 'consume' a refresh token, delete it! (then issue a new one with
  //  the same 'userId' and 'clientId')

  // TODO: We could add an 'issueNum:Number' field which is set to the issue number
  //  of this token for the userId/clientId pair and stop issuing new access tokens
  //  once the issue number reachs a certain maximum, forcing the client to get
  //  re-authorized by the user through the normal authorization process.

  // ID of the user that authorized access to a client; can be used to easily delete/invalidate
  //  all active access tokens in a single operation (i.e. when consuming one of their
  //  issued tokens in case many were generated for some reason)
  userId: {type: String, required: true},

  // ID of the client to whom this refresh token was issued (there can only ever be
  //  one active/valid refresh token for one userId/clientId pair)
  clientId: {type: String, required: true, unique: true},

  // resource access scope granted by user
  scope: {type: String, enum: _.values(scopeType), required: true},

  token: {type: String, default: uuid.v4},
  createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model('RefreshToken', schema);
