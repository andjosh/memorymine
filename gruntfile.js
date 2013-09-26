module.exports = function(grunt) {

  var Account = require('./models/account')
    , Memory = require('./models/memory')
    , mongoose = require('mongoose')
    , moment = require('moment')
    , twitter = require('twitter')
    , fb = require('fb')
    , Mailgun = require('mailgun').Mailgun
    , twHandler = require('./lib/twitterHandler')
    , fbHandler = require('./lib/facebookHandler')
    , fs = require('fs')
    , config = JSON.parse(fs.readFileSync('./config.json'))
    , MailComposer = require("mailcomposer").MailComposer;
  // Define what/which mongo to yell at
  var mongoUri = process.env.MONGOLAB_URI
                || process.env.MONGOHQ_URL
                || config.mongo.url;
  var mg = new Mailgun(config.mailgun.key),
      mailcomposer = new MailComposer();

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json')
  });
  grunt.registerTask('pullFacebook', 'Pull fb for all the users', function() {
    // Invoke async mode
    var done = this.async();
    // Connect mongoose
    mongoose.connect(mongoUri);
    Account.find().lean().exec(function(err,accounts){
      var i=0;last=accounts.length;
      (function loop() {
        if(i<last){
          if(accounts[i].facebookToken){
            fb.setAccessToken(accounts[i].facebookToken);
            fb.api(accounts[i].facebookUid, { fields: ['id', 'posts'] }, function(resp) {
              fbHandler.postsHandler({accountId:accounts[i]._id}, resp.posts.data, function(){
                fb.api(accounts[i].facebookUid, { fields: ['id', 'tagged'] }, function(resp) {
                  fbHandler.taggedHandler({accountId:accounts[i]._id}, resp.tagged.data, function(){
                    i++;loop();
                  })
                });
              })
            });
          }
        }else{done();}
      })();
    })
  });
  grunt.registerTask('pullTwitter', 'Pull tweets for all the users', function() {
    // Invoke async mode
    var done = this.async();
    // Connect mongoose
    mongoose.connect(mongoUri);
    Account.find().lean().exec(function(err,accounts){
      var i=0;last=accounts.length;
      (function loop() {
        if(i<last){
          if(accounts[i].twitterToken){
            var twit = new twitter({
              consumer_key: process.env.TWITTER_CONSUMER_KEY || config.twitter.consumer_key,
              consumer_secret: process.env.TWITTER_CONSUMER_SECRET || config.twitter.consumer_secret,
              access_token_key: accounts[i].twitterToken,
              access_token_secret: accounts[i].twitterTokenSecret
            });
            twit.get('/favorites/list.json', {user_id:accounts[i].twitterUid,count:50,include_entities:true}, function(data) {
              twHandler.favesHandler({accountId:accounts[i]._id}, data,function(){
                twit.get('/statuses/user_timeline.json', {user_id:accounts[i].twitterUid,count:50,include_entities:true}, function(data) {
                  twHandler.tweetsHandler({accountId:accounts[i]._id}, data, function(){
                    i++;loop();
                  });
                });
              });
            });
          }else{console.log('token absent for '+accounts[i].email);i++;loop();}
        }else{done();}
      })();
    })
  });
  grunt.registerTask('pushEmails', 'Push emails to all the users', function() {
    // Invoke async mode
    var done = this.async();
    // Connect mongoose
    mongoose.connect(mongoUri);
    Account.find().lean().exec(function(err,accounts){
      var i=0;last=accounts.length;
      (function loop() {
        if(i<last){
          if(accounts[i].emailActive){
            Memory.find({ accountId: accounts[i]._id, modified: {$gte: moment().subtract('days', 1).format()} }, null, {sort:{modified: -1}}).lean().exec(function(err, memories){
              var plainBody = 'Hello '+accounts[i].username+'! Here are your previous 24 hours, atomized: ',
                  htmlBody = '<h3>Hello '+accounts[i].username+'!</h3><p>Here are your previous 24 hours, atomized:</p><ul>';
              for(j=0;j<memories.length;j++){
                if(memories[j].link){
                  plainBody += memories[j].text+": "+memories[j].link;
                  htmlBody  += "<li><a href='"+memories[j].link+"'>"+memories[j].text+"</a></li>";
                }else{
                  plainBody += memories[j].text;
                  htmlBody  += "<li>"+memories[j].text+"</li>";
                }
              }
              plainBody += '- Atomist.co';
              htmlBody  += '</ul><p>- Your friends at <a href="http://atomist.co"><img src="http://atomist.co/images/favicon.png" width="20" height="20" alt="Atomist" style="vertical-align:middle;"/> Atomist.co</a></p>';
              mailcomposer.setMessageOption({
                from: 'daily@atomist.co',
                to: accounts[i].email,
                subject: 'Daily Atomist, '+moment().format("MMM Do 'YY"),
                body: plainBody,
                html: htmlBody
              }); 
              mailcomposer.buildMessage(function(err, messageSource){
                mg.sendRaw('daily@atomist.co', 
                  accounts[i].email,
                  messageSource,
                  'atomist.mailgun.org',
                  function(err) {
                    if (err) {console.log('Oh noes: ' + err);i++;loop();}
                    else     {console.log('Successful email to '+accounts[i].email);i++;loop();}
                  }
                );
              });
            });
          }else{i++;loop();}
        }else{done();}
      })();
    })
  });
};