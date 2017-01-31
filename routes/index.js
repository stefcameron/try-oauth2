//--// Route: /

const debug = require('debug')('try-oauth2:routes:index');
const _ = require('lodash');
const express = require('express');
const router = express.Router();
const sanitizeHtml = require('sanitize-html');
const ClientModel = require('../lib/models/Client');
const libUtil = require('../lib/util');

// GET /: creates a new client given these parameters:
// - client_name:String Unique client (application) name.
// - user_id:String ID of the user who owns the client/application (NOT the user
//   granting this client access to their data upon authorization...)
// - domain:String Domain of the client/application (must be 'host[:port]'). The
//   redirect_uri specified during the authorization process must be within this domain.
// - [description:String] Optional client/application description to display to
//   the user during the authorization process.
// TODO: this should really be a JSON-based POST request...
router.get('/', (req, res, next) => {
  if (_.size(req.query) > 0) {
    const name = req.query.client_name || undefined;
    const userId = req.query.user_id || undefined;
    const domain = req.query.domain || undefined;
    let description = req.query.description || undefined;

    if (!name || !_.isString(name)) {
      debug('INVALID: missing name');
      res.status(400).send('bad request: missing name');
      return;
    }

    if (!userId || !_.isString(userId)) {
      debug('INVALID: missing user_id');
      res.status(400).send('bad request: missing user_id');
      return;
    }

    // limit domain to 'host[:port]' for now
    // TODO: check proper format (NOT a URI, just a domain name), run through
    //  blacklist, allow 'localhost' and '127.0.0.1' (any port) for local testing
    if (!domain || !_.isString(domain) || !/^\w+(?:\:\d{1,5})?$/.test(domain)) { // localhost[:<port>]
      debug('INVALID: missing redirect_uri');
      res.status(400).send('bad request: missing domain');
      return;
    }

    // make sure it's a string but ignore
    if (!_.isString(description)) {
      if (description === null || description === undefined) {
        description = undefined;
      } else {
        description = sanitizeHtml('' + description); // cast to string and sanitize
      }
    }

    const client = new ClientModel({name, userId, domain, description});

    client.save((err) => {
      if (err) {
        debug('ERROR: %o', err);
        next(new Error('client name exists already'));
      } else {
        debug('new client created: %o', client);
        res.json(libUtil.sanitizeModel(client));
      }
    });
  } else {
    // show home page
    res.render('index', {title: 'try-oath2'});
  }
});

// GET /client: get one client or list client names; optional parameters:
//  'client_name:String'
// TODO: this isn't proper CRUD... should be refactored later as '/client/<name>'
// SECURITY: A user should only be able to list their client and get its info; they
//  shouldn't be able to see all clients and their secrets!
router.get('/client', (req, res, next) => {
  if (_.size(req.query) <= 0) {
    // list clients
    ClientModel.find({name: /.+/}, 'name', (err, clients) => {
      if (err) {
        debug('ERROR: failed to list clients: %o', err);
        res.status(500).send('failed to list clients');
      } else {
        res.json(_.map(clients, 'name'));
      }
    });
  } else if (req.query.client_name && _.isString(req.query.client_name)) {
    // get one client
    ClientModel.find({name: req.query.client_name}, (err, clients) => {
      if (err) {
        debug('ERROR: failed to search for clients: %o', err);
        res.status(500).end();
      } else if (clients.length !== 1) {
        debug(`client "${req.query.client_name}" not found`);
        res.status(404).end();
      } else {
        res.json(libUtil.sanitizeModel(clients[0]));
      }
    });
  }
});

module.exports = router;
