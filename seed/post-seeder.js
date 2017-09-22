var Post = require('../models/post');
var mongoose = require('mongoose');
console.log('../models/post');

mongoose.connect('mongodb://localhost:27017/faceafeka', {useMongoClient: true});

var posts = [
    new Post({
        header: 'Post#1',
        author: 'Baruch Shekelberg',
        body: 'ma kore',
        comments: [],
        likes: []
    }),
    new Post({
        header: 'Post#2',
        author: 'Yaron Shekelstein',
        body: 'ma nishma',
        comments: [],
        likes: []
    }),
    new Post({
        header: 'Post#3',
        author: 'Yaacov Cohen',
        body: 'ma ha inyanim',
        comments: [],
        likes: []
    })
];

var done = 0;
for(var i = 0; i < posts.length; i++) {
    posts[i].save(function(err, res) {
        done++;
        if(done === posts.length) {
            exit();
        }
    });
}

function exit() {
    console.log('zehu');
    mongoose.disconnect();
}