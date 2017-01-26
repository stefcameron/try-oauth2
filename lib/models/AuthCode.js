//--// Model: AuthCode

const mongoose = require('mongoose');
const uuid = require('node-uuid');

const schema = mongoose.Schema({
  code: {type: String, default: uuid.v4()},
  createdAt: {type: Date, default: Date.now(), expires: '10m'},
  consumed: {type: Boolean, default: false},
  clientId: {type: String},
  userId: {type: String},
  redirectUri: {type: String}
});

module.exports = mongoose.model('AuthCode', schema);
