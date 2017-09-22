var User = require('../models/user');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var Promise = require('bluebird');

mongoose.connect('mongodb://localhost:27017/faceafeka', {useMongoClient: true});

var logins = ['123', 'aaa', 'abc', '666'];
var passes = ['123', 'aaa', 'abc', '666'];

var done = 0;
logins.forEach(function (username, index) {
    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(passes[index], salt, function (err, hash) {
            var user = new User();
            user.username = username;
            user.password = hash;
            user.save(function (err, savedUsed) {
                if (err) {
                    console.log(err);
                }
                done++;
                console.log("User saved to db");
                if (done === logins.length)
                    exit();
            });
        });
    });
});


function exit() {
    console.log('zehu...');
    mongoose.disconnect();
}