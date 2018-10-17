//--// main app

const debug = require('debug')('try-oauth2:app');
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const sanitizeHtml = require('sanitize-html');
const mongoose = require('mongoose');

const indexRouter = require('./routes/index');
const authorizeRouter = require('./routes/authorize');
const tokenRouter = require('./routes/token');
const bookRouter = require('./routes/book');

const authAccessMidware = require('./middleware/authAccess');

var app = express();

//
// Mongoose Initialization
//

mongoose.Promise = global.Promise; // use native ES6 Promises
mongoose.connect('mongodb://localhost/book');
mongoose.connection.on('error', (err) => {
  debug(`ERROR (db connection): ${err.message}`);
});
mongoose.connection.once('open', () => {
  debug('connected to db');
});

//
// sanitize-html Initialization
//

// TODO: These allowed tags should be Client Model-specific since the app itself
//  may require different sanitization lists for different contexts... At the
//  moment, this satisfies the Client.description model property requirements.
sanitizeHtml.allowedTags = ['b', 'i', 'em', 'strong', 'p', 'ol', 'ul', 'li', 'br', 'pre', 'code'];
sanitizeHtml.allowedAttributes = {}; // none
sanitizeHtml.selfClosing = ['br'];

//
// App Initialization
//

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// NOT AUTHENTICATED
app.use('/', indexRouter);
app.use('/oauth2/authorize', authorizeRouter);
app.use('/oauth2/token', tokenRouter);
// AUTHENTICATED
app.use(authAccessMidware);
app.use('/book', bookRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
