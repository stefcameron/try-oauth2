//--// Route: / (index)

const debug = require('debug')('try-oauth2:routes:index');
const _ = require('lodash');
const express = require('express');
const sanitizeHtml = require('sanitize-html');
const ClientModel = require('../lib/models/Client');
const libUtil = require('../lib/util');

const router = express.Router();

// for this example, assume the following users exist
const existingUsers = ['user1', 'user2', 'user3'];

// GET /: render home page
router.get('/', (req, res, next) => {
  res.render('index', {title: 'try-oath2'});
});

// POST /client: creates a new client given these properties:
// - clientName:String Unique client (application) name.
// - userId:String ID of the user who owns the client/application (NOT the user
//   granting this client access to their data upon authorization...)
// - domain:String Domain of the client/application (must be 'host[:port]'). The
//   redirectUri specified during the authorization process must be within this domain.
// - [description:String] Optional client/application description to display to
//   the user during the authorization process.
router.post('/client', (req, res, next) => {
  const name = req.body.clientName || undefined;
  const userId = req.body.userId || undefined;
  const domain = req.body.domain || undefined;
  let description = req.body.description || undefined;

  if (!name || !_.isString(name)) {
    debug('INVALID: missing name');
    res.status(400).send('bad request: missing name');
    return;
  }

  if (!userId || !_.isString(userId) || !existingUsers.includes(userId)) {
    debug('INVALID: missing/invalid userId: %s', userId);
    res.status(400).send('bad request: missing/invalid userId');
    return;
  }

  // limit domain to 'host[:port]' for now
  // TODO: check proper format (NOT a URI, just a domain name), run through
  //  blacklist, allow 'localhost' and '127.0.0.1' for local testing
  if (domain !== 'localhost' && domain !== '127.0.0.1' && !libUtil.verifyFQDN(domain)) {
    debug('INVALID: missing or invalid domain');
    res.status(400).send('bad request: missing or invalid domain');
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
      debug('ERROR: failed to create client "%s": %s', name, err.message);
      next(new Error('client name exists already'));
    } else {
      debug('new client "%s" created', client.name);
      res.json(libUtil.sanitizeModel(client));
    }
  });
});

// GET /client: get one client or list client names; optional query parameters:
//  'name:String'
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
  } else if (req.query.name && _.isString(req.query.name)) {
    // get one client
    ClientModel.find({name: req.query.name}, (err, clients) => {
      if (err) {
        debug('ERROR: failed to search for clients: %o', err);
        res.status(500).end();
      } else if (clients.length !== 1) {
        debug(`client "${req.query.name}" not found`);
        res.status(404).end();
      } else {
        let json = libUtil.sanitizeModel(clients[0]);
        json.createdAt = json.createdAt.getTime(); // convert to number (ms)
        res.json(json);
      }
    });
  }
});

module.exports = router;
