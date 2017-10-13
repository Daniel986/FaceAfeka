var mongoose = require('mongoose');
var User = require('../models/user');
var Schema = mongoose.Schema;

var comment = new Schema({
    author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    authorName : {type: String},
    body: {type: String, required: true}
});

var like = new Schema({
    author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    authorName : {type: String}
});

var image = new Schema({
    status: {type: String},
    filename : {type: String},
    type: {type: String},
    publicPath: {type: String},
    message: {type: String}
});

var post = new Schema({
    header: {type: String, required: true},
    author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    authorName : {type: String},
    body: {type: String, required: true},
    comments: [comment],
    likes: [like],
    private: {type: Boolean, required: true, default: false},
    created: { type: Date, default: Date.now },
    liked: {type: Boolean},
    imgs: [image]
});

module.exports = mongoose.model('post', post);
// module.exports = mongoose.model('comment', comment);
// module.exports = mongoose.model('like', like);