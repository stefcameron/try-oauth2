//--// Route: /

const debug = require('debug')('try-oauth2:routes:index');
const _ = require('lodash');
const express = require('express');
const router = express.Router();
const ClientModel = require('../lib/models/Client');
const libUtil = require('../lib/util');

// GET /: creates a new client based on 'client_name:String', 'user_id:String',
//  and 'domain:String' query parameters
router.get('/', (req, res, next) => {
  if (_.size(req.query) > 0) {
    const name = req.query.client_name || undefined;
    const userId = req.query.user_id || undefined;
    const domain = req.query.domain || undefined;

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

    const client = new ClientModel({name, userId, domain});

    client.save((err) => {
      if (err) {
        debug('ERROR: %o', err);
        next(new Error('client name exists already'));
      } else {
        debug('new client created: %o', client);
        res.json(client);
      }
    });
  } else {
    // show home page
    res.render('index', {title: 'try-oath2'});
  }
});

// GET /client: get one client or list client names; optional parameters:
//  'client_name:String'
// TODO: this isn't proper REST... should be refactored later
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
