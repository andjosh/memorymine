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
var starredHandler = exports.starredHandler = function(options, stars, cb){
  if(!options){options = {};}
  var i = 0,last = stars.length;
  (function loop() {
    if(i<last){
      Memory.findOne({GithubId:stars[i].id.toString(), accountId: options.accountId}, function(err,mem){
        if(err){
          console.log('error: '+err);
        }
        if(!mem){
          var newMemory = new Memory;
          if(stars[i].full_name){
            newMemory.text = stars[i].full_name+': '+stars[i].description;
          }else{
            newMemory.text = stars[i].description;
          } 
          if(stars[i].language){newMemory.keywordBin += ' '+stars[i].language}
          newMemory.keywordBin += ' star';
          newMemory.GithubId = stars[i].id.toString();
          newMemory.link = stars[i].html_url;
          newMemory.accountId = options.accountId;
          newMemory.searchableTime = moment(stars[i].created_at).format('dddd MMMM Do YYYY h:mm:ss A');
          newMemory.save(function(err,result){
            if(err){
              console.log(err);i++;loop();
            }
            if(result){console.log('Imported star');i++;loop();}
          })
        }else{console.log('Extant star');i++;loop();}
      })
    }else{cb();}
  })();
}
var gistsHandler = exports.gistsHandler = function(options, gists, cb){
  if(!options){options = {};}
  var i = 0,last = gists.length;
  (function loop() {
    if(i<last){
      Memory.findOne({GithubId: gists[i].id.toString(), accountId: options.accountId}, function(err,mem){
        if(err){
          console.log('error: '+err);
        }
        if(!mem){
          var newMemory = new Memory;
          newMemory.text = gists[i].description;
          if(gists[i].language){newMemory.keywordBin += ' '+gists[i].language}
          newMemory.keywordBin += ' gist';
          newMemory.GithubId = gists[i].id.toString();
          newMemory.link = gists[i].html_url;
          newMemory.accountId = options.accountId;
          newMemory.searchableTime = moment(gists[i].created_at).format('dddd MMMM Do YYYY h:mm:ss A');
          newMemory.save(function(err,result){
            if(err){
              console.log(err);i++;loop();
            }
            if(result){console.log('Imported gist');i++;loop();}
          })
        }else{console.log('Extant gist');i++;loop();}
      })
    }else{cb();}
  })();
}