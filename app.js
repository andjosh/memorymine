/**
  * MemoryMine
  *
  * @author Joshua Beckman <@jbckmn> || <jsh@bckmn.com>
  * @license The MIT license. 2013
  *
  */
var express = require('express')
    , load = require('express-load')
    , mongoose = require('mongoose')
    , passport = require('passport')
    , flash = require('connect-flash')
    , LocalStrategy = require('passport-local').Strategy
    , TwitterStrategy = require('passport-twitter').Strategy
    , FacebookStrategy = require('passport-facebook').Strategy
    , http = require('http')
    , path = require('path')
    , io = require('socket.io')
    , Account = require('./models/account')
    , Memory = require('./models/memory')
    , fs = require('fs')
    , config = JSON.parse(fs.readFileSync('./config.json'));

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

// For Heroku sockets to work
io.configure(function () {
  io.set("transports", ["xhr-polling"]);
  io.set("polling duration", 10);
});

// Define what/which mongo to yell at
var mongoUri = process.env.MONGOLAB_URI
                || process.env.MONGOHQ_URL
                || config.mongo.url;

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.set('view options', { layout: false });
    app.set('port', process.env.PORT || 5000);
    app.use(express.logger());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(flash());
    app.use(express.cookieParser('your secret here'));
    app.use(express.cookieSession({ secret: 'marybeth and the fox fighting bant', cookie: { maxAge: 1000*60*60*24*30 } })); // CHANGE THIS SECRET!
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});
app.configure('development', function(){
    app.use(express.errorHandler({ showStack: true }));
});
app.configure('production', function(){
    app.use(express.errorHandler());
});

passport.use(Account.createStrategy());
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());
passport.use(
  new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY || config.twitter.consumer_key,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET || config.twitter.consumer_secret,
    callbackURL: config.twitter.callbackURL,
    passReqToCallback: true
  },
  function(req, token, tokenSecret, profile, done) {
    Account.findByIdAndUpdate(req.user._id, {twitterToken: token, twitterTokenSecret: tokenSecret, twitterUid: profile.id}, function(err, account) {
      if(!err){return done(null, req.user);}
      if(err){console.log(err);}
    });
  }
));
passport.use(
  new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID || config.facebook.clientID,
    clientSecret: process.env.FACEBOOK_APP_SECRET || config.facebook.clientSecret,
    callbackURL: config.facebook.callbackURL,
    passReqToCallback: true
  },
  function(req, accessToken, refreshToken, profile, done) {
    Account.findByIdAndUpdate(req.user._id, {facebookToken: accessToken, facebookTokenRefresh: (refreshToken || ''), facebookUid: profile.id}, function(err, account) {
      if(!err){return done(null, req.user);}
      if(err){console.log(err);}
    });
  }
));

mongoose.connect(mongoUri);
server.listen(app.get('port'));

// Let's see what's going on
console.log("Express server listening on port %d in %s mode, connected to %s", app.get('port'), app.settings.env, mongoUri);

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  req.flash('error', 'Please sign in.');
  res.redirect('/sign-in');
}
function ensureApiAuth(req, res, next) {
  Account.findOne({key:req.query.key}).lean().exec(function(error,authAccount){
    if (authAccount || req.user) { return next(); }
    var error405 = {"error":{"code":405,"message":"Not allowed. You can't always get what you want."}};
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify(error405));
    res.end();
  })
}

require('./routes/frontend')(app, ensureAuthenticated, io);
require('./routes/api')(app, io, ensureApiAuth);
io.sockets.on('connection', function (socket) {
  socket.on('createMemory', function (data) {
    Memory.createMemory(data, io);
  });
  socket.on('sendSearch', function (data) {
    Memory.searchQuery(data, io);
  });
});

app.configure('development', function(){
  var repl = require('repl').start('liverepl> ');
  repl.context.Account = Account;
  repl.context.Memory = Memory;
  repl.context.io = io;
})

Account.find().lean().exec(function(err,results){
  if(err){console.log(err)}
  if(!results || results.length === 0){
    Account.register(new Account({ email:'admin@domain.com', username : 'admin' }), 'password', function(err, account) {
      if (err) {console.log(err)}
      if(account){console.log('Successfully created "admin" account.')}
    });
  }
})