var express = require('express');
var session = require('express-session');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');

var passport = require('passport');
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;

passport.use('provider', new OAuth2Strategy({
    authorizationURL: 'https://github.com/login/oauth/authorize/',
    tokenURL: 'https://github.com/login/oauth/access_token/',
    clientID: '9383eeff63778d471150',
    clientSecret: '2b21bc00e32f7b2e65738042fbf0ce9b7d5fe4ad',
    callbackURL: '127.0.0.1:4568/auth/github/callback/'
  },

  function(accessToken, refreshToken, profile, done) {
    User.findOrCreate({appid: profile.id}, function(err, user) {
      done(err, user);
    });
  }
));


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.use(session({
  secret: 'nyan cat',
  resave: false,
  saveUninitialized: false
  // cookie: { secure: true },
}));

app.get('/auth/github/',
  passport.authenticate('provider'));

app.get('/auth/github/callback/',
  passport.authenticate('provider', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

app.get('/',
function(req, res) {
  res.render('index');
});

app.get('/create',
function(req, res) {
  res.render('index');
});

app.get('/links',
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links',
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri}).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

app.post('/signup', function (req, res) {
  var username = req.body.username;
  var password = req.body.password;

  new User({ username: username }).fetch().then(function(found){
    if (found) {
      res.send(404);
      // Add case for duplicate username later
    } else {

      bcrypt.genSalt(null, function (err, salt) {

        bcrypt.hash(password, salt, null, function (error, hashed) {

          var newUser = new User({
            username: username,
            password: hashed,
            salt: salt
          });
          console.log("SALT",salt);
          console.log("HASHED",hashed);

          newUser.save().then(function(newUser){
            Users.add(newUser);
            res.status(200).redirect('/');
          });
        });
      });
    }
  });
});

app.post('/login', function (req, res) {
  var username = req.body.username;
  var password = req.body.password;

  new User({ username: username}).fetch().then( function (found) {
    if (found) {
      bcrypt.hash(password, found.get('salt'), null, function (err, hashed) {
        if ( hashed === found.get('password')){
          req.session.regenerate( function(){
            req.session.user = found.get('username');
            res.redirect('/');
          });
        } else {res.redirect('/login');}
      });
    } else {res.redirect('/login');}
  });
});

app.get('/logout', function (req, res) {
  req.session.destroy( function(){
    res.redirect('/');
  });

});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/login', function (req, res) {
  res.status(200).render('login');
});

app.get('/signup', function (req, res) {
  res.status(200).render('signup');
});


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);

db.knex.schema.dropTable('users');
