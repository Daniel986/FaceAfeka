var Post = require('../models/post');
var mongoose = require('mongoose');
console.log('../models/post');

mongoose.connect('mongodb://localhost:27017/faceafeka', {useMongoClient: true});

var posts = [
    new Post({
        header: 'Post#1',
        author: '59c54054428e6819743493b9',
        body: 'ma kore',
        comments: [],
        likes: [],
        private: false
    }),
    new Post({
        header: 'Post#2',
        author: '59c54054428e6819743493b9',
        body: 'ma nishma',
        comments: [],
        likes: [],
        private: false
    }),
    new Post({
        header: 'Post#3',
        author: 'Yaacov Cohen',
        body: 'ma ha inyanim',
        comments: [],
        likes: [],
        private: false
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