//--// Model: RefreshToken

const mongoose = require('mongoose');
const uuid = require('node-uuid');

const schema = mongoose.Schema({
  // ID of the user that authorized access to a client; can be used to easily delete/invalidate
  //  all active access tokens in a single operation (i.e. when consuming one of their
  //  issued tokens in case many were generated for some reason)
  userId: {type: String},

  token: {type: String, default: uuid.v4},
  createdAt: {type: Date, default: Date.now},
  consumed: {type: Boolean, default: false}
});

module.exports = mongoose.model('RefreshToken', schema);
