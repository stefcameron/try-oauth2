//--// Model: AuthCode

const mongoose = require('mongoose');
const uuid = require('node-uuid');

const schema = mongoose.Schema({
  // generated auth code to be exchanged for an access token using the client's secret key
  code: {type: String, default: uuid.v4},

  // 'expires' will cause the database entry to be auto-deleted after the specified duration
  //  from when the record gets created
  createdAt: {type: Date, default: Date.now, expires: '10m'},

  consumed: {type: Boolean, default: false}, // `true` if this code has been consumed
  clientId: {type: String}, // ID of the client that requested access
  userId: {type: String}, // ID of the user that authorized access to a client
  redirectUri: {type: String} // token exchange URI specified by the client upon authorization request
});

module.exports = mongoose.model('AuthCode', schema);
