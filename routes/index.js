//--// Route: /

const debug = require('debug')('try-oauth2:routes:index');
const _ = require('lodash');
const express = require('express');
const router = express.Router();
const ClientModel = require('../lib/models/Client');

// GET /: creates a new client based on 'client_name:String', 'user_id:String',
//  and 'domain:String' query parameters
router.get('/', (req, res, next) => {
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
  if (!domain || !_.isString(domain) || /^\w+(?:\:\d{1-5})$/.test(domain)) {
    debug('INVALID: missing redirect_uri');
    res.status(400).send('bad request: missing domain');
    return;
  }

  const client = new ClientModel({name, userId, domain});

  client.save((err) => {
    if (err) {
      next(new Error('client name exists already'));
    } else {
      res.json(client);
    }
  });

  // TODO: bring this back later?
  // res.render('index', {title: 'Express'});
});

module.exports = router;
