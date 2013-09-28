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
var postsHandler = exports.postsHandler = function(options, posts, cb){
  if(!options){options = {};}
  var i = 0,last = posts.length;
  (function loop() {
    if(i<last){
      Memory.findOne({facebookId:posts[i].id,accountId: options.accountId}, function(err,mem){
        if(err){
          console.log('error: '+err);
        }
        if(!mem){
          var newMemory = new Memory;
          newMemory.text = posts[i].message || posts[i].story;
          newMemory.facebookId = posts[i].id;
          newMemory.facebookType = 'post';
          newMemory.link = posts[i].link;
          newMemory.accountId = options.accountId;
          newMemory.searchableTime = moment(posts[i].created_time).format('dddd MMMM Do YYYY h:mm:ss A');
          newMemory.save(function(err,result){
            if(err){
              console.log(err);i++;loop();
            }
            if(result){console.log('Imported post');i++;loop();}
          })
        }else{console.log('Extant post');i++;loop();}
      })
    }else{cb();}
  })();
}
var taggedHandler = exports.taggedHandler = function(options, posts, cb){
  if(!options){options = {};}
  var i = 0,last = posts.length;
  (function loop() {
    if(i<last){
      Memory.findOne({facebookId:posts[i].id,accountId: options.accountId}, function(err,mem){
        if(err){
          console.log('error: '+err);
        }
        if(!mem){
          var newMemory = new Memory;
          newMemory.text = posts[i].message || posts[i].story;
          newMemory.facebookId = posts[i].id;
          newMemory.facebookType = 'tag';
          newMemory.link = posts[i].link;
          newMemory.facebookLink = posts[i].actions[0].link;
          newMemory.accountId = options.accountId;
          newMemory.searchableTime = moment(posts[i].created_time).format('dddd MMMM Do YYYY h:mm:ss A');
          newMemory.keywordBin = posts[i].from.name;
          newMemory.save(function(err,result){
            if(err){
              console.log(err);i++;loop();
            }
            if(result){console.log('Imported post');i++;loop();}
          })
        }else{console.log('Extant post');i++;loop();}
      })
    }else{cb();}
  })();
}