//--// Model: Client

const mongoose = require('mongoose');
const uuid = require('node-uuid');

const schema = mongoose.Schema({
  clientId: {type: String, default: uuid.v4, unique: true},
  clientSecret: {type: String, default: uuid.v4, unique: true},
  createdAt: {type: Date, default: Date.now},
  name: {type: String, unique: true},

  // TODO: consider limiting the number of clients per user to 1 by making this field 'unique'
  userId: {type: String, required: true},

  // optional field to describe the client, presented to the user when they're
  //  directed to the authorization page to grant the client access to their data
  // only simple tags are allowed (see app.js)
  // TODO: make this required?
  description: {type: String},

  // authorization callback domain (and optional port): redirect_uri given during
  //  auth request must be within this domain (or a subdomain thereof), with
  //  'localhost' and '127.0.0.1' (at any port) being whitelisted to support local
  //  testing
  domain: {type: String, required: true}
});

module.exports = mongoose.model('Client', schema);
