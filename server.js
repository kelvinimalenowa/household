// server.js

// set up ======================================================================
// get all the tools we need
require('dotenv').config()

const express = require('express');
const app = express(); //calling on express stored in line 5
const port = process.env.PORT || 8080; //first arg looks for an env (environment) file saved in another foler

const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');
const morgan = require('morgan');
const session = require('express-session');

// configuration ===============================================================
mongoose.connect(process.env.MONGODB_URI, { dbName: 'household' })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error(err));// connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(express.json()); // get information from html forms
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'))

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session


// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);