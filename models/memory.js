/**
  * Memory: A string of words, belonging to an Account
  *
  */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    troop = require('mongoose-troop'),
    moment = require('moment');

var Memory = new Schema({
    text: {type: String, required: true},
    link: {type: String},
    accountId: {type: String, required: true},
    image: {type: String, default: ''},
    searchableTime: {type: String},
    searchableUrl: {type: String}
});

Memory.plugin(troop.timestamp);
Memory.plugin(troop.keywords, {
  source: ['text', 'searchableTime', 'searchableUrl'],
  naturalize: true
})
Memory.statics.createMemory = function(data, io){
  var newMemory = new this;
  newMemory.text = data.text;
  newMemory.link = data.link;
  newMemory.accountId = data.accountId;
  newMemory.searchableTime = moment(data.time).format('dddd MMMM Do YYYY h:mm:ss A');
  newMemory.searchableUrl = data.searchableUrl;
  newMemory.save(function(err,result){
    if(err){
      console.log(err);
      io.sockets.emit('error', {details: err});
    }
    if(result){io.sockets.emit('newMemory', { text: result.text, link: result.link, date: result.modified, accountId: result.accountId });}
  });
};
module.exports = mongoose.model('Memory', Memory);
