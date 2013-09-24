/*
 * Front End routes
 */
var passport = require('passport')
    , Account = require('../models/account')
    , Memory = require('../models/memory')
    , moment = require('moment')
    , twitter = require('twitter')
    , fb = require('fb')
    , twHandler = require('../lib/twitterHandler')
    , fs = require('fs')
    , config = JSON.parse(fs.readFileSync('./config.json'));

module.exports = function (app, ensureAuthenticated) {
  app.get('/', function(req, res) {
    if(req.user){
      Memory.find({ accountId: req.user._id, modified: {$gte: moment().subtract('days', 1).format()} }, null, {sort:{modified: -1}}).lean().exec(function(err, memories){
        for(i=0;i<memories.length;i++){
          memories[i].modified = moment(memories[i].modified).fromNow();
        }
        res.render('index', { title: 'Atomist', user: req.user, memories: memories, message: req.flash('message'), error: req.flash('error') });
      });
    }else{
      res.render('index', { title: 'Atomist', user: req.user, memories: [], message: req.flash('message'), error: req.flash('error') });
    }
  });
  app.get('/register', function(req, res) {
    res.render('register', { title: 'Register', user: req.user, message: req.flash('message'), error: req.flash('error') });
  });
  app.post('/register', function(req, res) {
    if (req.body.password != req.body.password_conf) {
      req.flash('error', 'Password and password confirmation must match.')
      res.redirect('/register');
    }
    Account.register(new Account({ username: req.body.username }), req.body.password, function(err, account) {
        if (err) {
            req.flash('error', 'That username is already in use.')
            return res.redirect('/register');
        }
        passport.authenticate('local')(req, res, function () {
          req.flash('message', 'Welcome, '+req.body.username+'!')
          res.redirect('/');
        })
    });
  });
  app.get('/sign-in', function(req, res) {
    res.render('signin', { title: 'Sign In', user: req.user, message: req.flash('message'), error: req.flash('error') });
  });
  app.post('/sign-in', passport.authenticate('local', { failureRedirect: '/', failureFlash: 'Invalid email or password.' }), function(req, res) {
    res.redirect('/');
  });
  app.get('/sign-out', function(req, res) {
    req.logout();
    req.flash('message', 'You have been signed out.');
    res.redirect('/');
  });
  app.get('/account', ensureAuthenticated, function(req, res) {
    res.render('account', { title: 'Your account', user: req.user, message: req.flash('message'), error: req.flash('error') });
  });
  app.post('/account', ensureAuthenticated, function(req, res) {
    if (req.body.password != req.body.password_conf) {
      req.flash('error', 'New password and password confirmation must match.')
      res.redirect('/account');
    } else if(!req.body.username || !req.body.email){
      req.flash('error', 'Please supply username and email.')
      res.redirect('/account');
    } else {
      Account.findById(req.user._id, function(err,account){
        if(err){req.flash('error', 'Updates were unsuccessful: '+err);res.redirect('/account');}
        account.setPassword(req.body.password, function setPassword(err, resetAccount){
          if(err) {
            req.flash('error', 'There was a problem in saving that information: '+err)
            res.redirect('/account');
            throw err;
          }
          if(req.body.username !== req.user.username){
            resetAccount.username = req.body.username;
          }
          resetAccount.save(function(err, saved){
            if(err) {
              req.flash('error', 'There was a problem in saving that information: '+err)
              res.redirect('/account');
              throw err;
            }
            req.flash('message', 'Updates were successful.');
            res.redirect('/');
          })
        });
      });
    };
  });
  app.get('/memory/:id', ensureAuthenticated, function(req, res){
    Memory.findOne({accountId: req.user._id, _id:req.params.id}, '-__v').lean().exec(function(err, memory){
      res.render('memoryEdit', { user: req.user, title : "Edit "+memory.text.slice(0,20), memory: memory, message: req.flash('message'), error: req.flash('error') });
    });
  });
  app.post('/memory/:id', ensureAuthenticated, function(req, res) {
    var conditions = { 
      text: req.body.text, 
      image: (req.body.image || '')
    };
    Memory.findOne({accountId: req.user._id, _id: req.params.id}, function(err, memory){
      if(err) {
        req.flash('error', 'There seems to be a problem with that: '+err)
        res.redirect('/memory/'+req.params.id);
      }
      memory.text = req.body.text;
      memory.link = req.body.link;
      memory.searchableUrl = req.body.searchableUrl;
      memory.searchableTime = moment(req.body.time).format('dddd MMMM Do YYYY h:mm:ss A');
      memory.image = (req.body.image || '');
      memory.save(function(err, updated){
        if(err) {
          req.flash('error', 'There seems to be a problem with that: '+err)
          res.redirect('/memory/'+req.params.id);
          console.log(err);
        }
        req.flash('message', 'Updated your memory successfully.')
        res.redirect('/');
      });
    });
  });
  app.post('/search', ensureAuthenticated, function(req,res){
    Memory.find({ accountId: req.user._id, keywords: { $all: Memory.extractKeywords(req.body.text) } }, null, {sort:{modified: -1}}).lean().exec(function(err, memories) {
      res.render('search', { title: 'Searched: '+req.body.text, user: req.user, memories: memories, searchText: req.body.text, message: req.flash('message'), error: req.flash('error') });
    })
  });

  app.get('/auth/twitter', passport.authenticate('twitter'));
  app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/account' }), function(req, res) {
    req.flash('message', 'Connected to Twitter!');
    res.redirect('/account');
  });
  app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['user_status', 'user_checkins', 'read_stream'] }));
  app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/account' }), function(req, res) {
    req.flash('message', 'Connected to Facebook!');
    res.redirect('/account');
  });
}
