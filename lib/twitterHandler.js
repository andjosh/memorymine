/**
 * Module dependencies.
 */
var Account = require('../models/account')
  , Memory = require('../models/memory')
  , moment = require('moment')
  , fs = require('fs')
  , config = JSON.parse(fs.readFileSync('./config.json'));
/**
 * Exports.
 */
var tweetsHandler = exports.tweetsHandler = function(options, tweets, cb){
  if(!options){options = {};}
  var i = 0,last = tweets.length;
  (function loop() {
    if(i<last){
      Memory.findOne({tweetId:tweets[i].id_str, accountId: options.accountId}, function(err,mem){
        if(err){
          console.log('error: '+err);
        }
        if(!mem){
          var newMemory = new Memory;
          newMemory.text = tweets[i].text;
          newMemory.tweetId = tweets[i].id_str;
          newMemory.tweetType = 'personal';
          if(tweets[i].entities.urls.length > 0){
            newMemory.link = tweets[i].entities.urls[0].url;
          }
          newMemory.accountId = options.accountId;
          newMemory.searchableTime = moment(tweets[i].created_at).format('dddd MMMM Do YYYY h:mm:ss A');
          newMemory.save(function(err,result){
            if(err){
              console.log(err);i++;loop();
            }
            if(result){console.log('Imported tweet');i++;loop();}
          })
        }else{console.log('Extant tweet');i++;loop();}
      })
    }else{cb();}
  })();
}
var favesHandler = exports.favesHandler = function(options, tweets, cb){
  if(!options){options = {};}
  var i = 0,last = tweets.length;
  (function loop() {
    if(i<last){
      Memory.findOne({tweetId:tweets[i].id_str,accountId: options.accountId}, function(err,mem){
        if(err){
          console.log('error: '+err);
        }
        if(!mem){
          var newMemory = new Memory;
          newMemory.text = tweets[i].text;
          newMemory.tweetId = tweets[i].id_str;
          newMemory.tweetType = 'favorite';
          if(tweets[i].entities.urls.length > 0){
            newMemory.link = tweets[i].entities.urls[0].url;
          }
          newMemory.keywordBin = tweets[i].user.screen_name+' '+tweets[i].user.name;
          newMemory.accountId = options.accountId;
          newMemory.searchableTime = moment(tweets[i].created_at).format('dddd MMMM Do YYYY h:mm:ss A');
          newMemory.save(function(err,result){
            if(err){
              console.log(err);i++;loop();
            }
            if(result){console.log('Imported favorite');i++;loop();}
          })
        }else{console.log('Extant favorite');i++;loop();}
      })
    }else{cb();}
  })();
}