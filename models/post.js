var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var comment = new Schema({
    header: {type: String, required: true},
    author: {type: String, required: true},
    body: {type: String, required: true}
});

var like = new Schema({
    author: {type: String, required: true}
});

var schema = new Schema({
    header: {type: String, required: true},
    author: {type: String, required: true},
    body: {type: String, required: true},
    comments: [comment],
    likes: [like]
});

module.exports = mongoose.model('post', schema);
// module.exports = mongoose.model('comment', comment);
// module.exports = mongoose.model('like', like);