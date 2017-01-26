//--// Model: Client

const mongoose = require('mongoose');
const uuid = require('node-uuid');

const schema = mongoose.Schema({
  clientId: {type: String, default: uuid.v4(), unique: true},
  clientSecret: {type: String, default: uuid.v4(), unique: true},
  createdAt: {type: Date, default: Date.now()},
  name: {type: String, unique: true},
  scope: {type: String},
  userId: {type: String, required: true},

  // authorization callback domain (and optional port): redirect_uri given during
  //  auth request must be within this domain (or a subdomain thereof), with
  //  'localhost' and '127.0.0.1' (at any port) being whitelisted to support local
  //  testing
  domain: {type: String, required: true}
});

module.exports = mongoose.model('Client', schema);
