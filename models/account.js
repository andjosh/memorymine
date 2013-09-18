/**
  * Account: A person, owning data
  *
  */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    troop = require('mongoose-troop'),
    passportLocalMongoose = require('passport-local-mongoose');

var Account = new Schema({
    username: {type: String, default: ''},
    email: {type: String},
    image: {type: String, default: ''},
    admin: { type: Boolean, default: false },
    fullAccess: { type: Boolean, default: false },
    key: { type: String, default: ( Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2) ) },
    twitterToken: {type: String},
    twitterTokenSecret: {type: String},
    twitterUid: {type: String},
    facebookToken: {type: String},
    facebookTokenRefresh: {type: String},
    facebookUid: {type: String},
    accessToken: String // Used for Remember Me
});

Account.plugin(passportLocalMongoose, {usernameField: 'username'});
Account.plugin(troop.timestamp);

Account.statics.generateRandomToken = function () {
  var user = this,
      chars = "_!abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
      token = new Date().getTime() + '_';
  for ( var x = 0; x < 16; x++ ) {
    var i = Math.floor( Math.random() * 62 );
    token += chars.charAt( i );
  }
  return token;
};

module.exports = mongoose.model('Account', Account);