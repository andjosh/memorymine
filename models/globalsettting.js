/**
  * Global Setting: A configuration variable
  *
  */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    troop = require('mongoose-troop');

var GlobalSetting = new Schema({
    name: {type: String, required: true},
    bool: {type: Boolean, required: true},
    value: {type: String, default: ''}
});

GlobalSetting.plugin(troop.timestamp);

module.exports = mongoose.model('GlobalSetting', GlobalSetting);
