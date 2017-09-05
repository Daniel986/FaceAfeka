var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    header: {type: String, required: true},
    author: {type: String, required: true},
    body: {type: String, required: true},
});