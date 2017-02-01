//--// Model: Token

const mongoose = require('mongoose');
const uuid = require('node-uuid');

const schema = mongoose.Schema({
  // ID of the user that authorized access to a client; can be used to easily delete/invalidate
  //  all active access tokens in a single operation (i.e. when consuming one of their
  //  issued tokens in case many were generated for some reason)
  userId: {type: String},

  refreshToken: {type:String, unique: true},
  accessToken: {type: String, default: uuid.v4},
  expiresIn: {type: String, default: '10800'}, // TODO: why String and not Number?
  tokenType: {type: String, default: 'bearer'},
  consumed: {type: Boolean, default: false},

  // 'expires' will cause the database entry to be auto-deleted after the specified duration
  //  from when the record gets created
  createdAt: {type: Date, default: Date.now, expires: '3m'}
});

module.exports = mongoose.model('Token', schema);
