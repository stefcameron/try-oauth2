//--// book router

const debug = require('debug')('try-oauth2:routes:book');
const _ = require('lodash');
const express = require('express');

const router = express.Router();

// TODO: make a schema and add this to the DB if doesn't already exists...
// for this example, assume the following books exist
const booksDB = {
  0: {
    id: 0,
    title: 'Book 1 title',
    description: 'Book 1 description...',
    authors: ['Bob'],
    pageCount: 100
  },
  1: {
    id: 1,
    title: 'Book 2 title',
    description: 'Book 2 description...',
    authors: ['Fred', 'Wilma'],
    pageCount: 150
  },
  2: {
    id: 2,
    title: 'Book 3 title',
    description: 'Book 3 description...',
    authors: ['Barney'],
    pageCount: 50
  }
};

// GET /: return partials
router.get('/', (req, res) => {
  // TODO: Look at the req.authAccess.scope property (added by the authAccess middleware)
  //  to determine if the requestor has access to this data...

  const partials = _.map(booksDB, (book) => _.pick(book, ['id', 'title']));
  res.json(partials);
});

module.exports = router;
