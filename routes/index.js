var express = require('express');
var router = express.Router();
var User = require('../models/user');
var bcrypt = require('bcrypt');
var Promise = require('bluebird');
var Post = require('../models/post');
var multiparty = require('multiparty');
var format = require('util').format;


/* GET home page. */
router.get('/', function(req, res, next) {
    if (req.session.user==null){
        Post.find({private : false})
            .populate({path:'author', select:'-_id username'})
            .sort({created: 'desc'})
            .exec(function(err, posts) {
            return res.render('index', {title: 'FaceAfeka', user: req.session.user,
                posts: posts, logged: false, error: '', privateCheck: true});
        });
    }
    else {
        Post.find({$or: [{$and: [{private : true}, {authorName: { $eq: req.session.user.username }}]}, {private : false}]})
            .populate({path:'author', select:'-_id username'})
            .sort({created: 'desc'})
            .exec(function(err, posts) {
            // var currUser = req.session.user.username;
            // var privateVal;
            // var postUser;
            // var postsRes = posts.map(function (refined){
            //     postUser = refined.authorName;
            //     privateVal = refined.private.valueOf();
            //     if(privateVal && currUser !== postUser) {
            //         console.log(refined);
            //         delete posts[refined];
            //     }
            //     return refined;
            // });
            return res.render('index', {title: 'FaceAfeka', user: req.session.user,
                posts: posts, logged: true, error: '', privateCheck: true});
        });
    }
});
/* POST home page. */
router.post('/', function(req, res, next) {
    if(!req.body.bodyHolder || !req.body.titleHolder) {
        Post.find({$or: [{$and: [{private : true}, {authorName: { $eq: req.session.user.username }}]}, {private : false}]},
            function(err, posts){
            return res.render('index', {title: 'FaceAfeka', user: req.session.user, posts: posts,
                logged: true, error: 'Gonna need you to fill up them text areas before you post..', privateCheck: true});
        }).sort({created: 'desc'});
    }
    else {
        new Post({
            header: req.body.titleHolder,
            author: req.session.user,
            authorName: req.session.user.username,
            body: req.body.bodyHolder,
            comments: [],
            likes: [],
            private: req.body.privateCheck
        }).save(function(err, result) {
            // console.log(req.session.user);
            if(req.session.user != null)
                Post.find({$or: [{$and: [{private : true}, {authorName: { $eq: req.session.user.username }}]}, {private : false}]})
                    .populate('author', '-_id username')
                    .sort({created: 'desc'})
                    .exec(function(err, posts) {
                    return res.render('index', {title: 'FaceAfeka', user: req.session.user, posts: posts,
                        logged: true, error: 'Post published', privateCheck: true});
                });
        });

    }

});


router.get('/logout', function(req, res, next) {
    req.session.destroy();
    res.redirect('/');
});

router.get('/login', function(req, res, next) {
    res.render('login', { title: 'FaceAfeka' });
});

router.post('/login', function(req, res, next) {
    if (!req.body.login || !req.body.password) {
        return res.render('login', {error: 'Please enter your login and password.'});
    }
    User.findOne({username:req.body.login}, function (err, user) {
        if (err) return next(err);
        if (!user) return res.render('login', {error: 'Incorrect login and password combination'});
        bcrypt.compare(req.body.password, user.password, function (err, authorized) {
            if (!authorized) {
                console.log("bad login or pass");
                return res.render('login', {error: 'Incorrect login and password combination'});
            } else {
                console.log("login success");
                req.session.user = user;
                req.session.admin = user.admin;
                res.redirect('/');
            }
        });
    });
});

router.get('/signup', function(req, res, next) {
    res.render('signup', { title: 'FaceAfeka' });
});

router.post('/signup', function(req, res, next) {
    if(!req.body.username || !req.body.password) {
        return res.render('signup', {error: 'Enter username and password'});
    }
    User.findOne({username: req.body.username}, function (err, usrData) {
        if (usrData === null) {
            bcrypt.genSalt(10, function (err, salt) {
                bcrypt.hash(req.body.password, salt, function (err, hash) {
                    var user = new User();
                    user.username = req.body.username;
                    user.password = hash;
                    user.save(function (err, user) {
                        if (err) {
                            console.log(err);
                            return res.send('signup', {error: err});
                        }
                        console.log("User saved to db");
                        req.session.user = user;
                        req.session.admin = user.admin;
                        res.redirect('/');
                    });
                });
            });
        } else {
            res.render('signup', {error: 'User already exists'});
        }
    });
});

router.get('/users', function(req, res) {
    if (Object.keys(req.query).length === 0) {
        User.find(
            {},
            function (err, docs) {
                var usernames = [];
                if (docs) {
                    docs.forEach(function (doc) {
                        usernames.push(doc.username);
                    });
                    return usernames;
                }
            });
    }
    else if (req.query['term'] == "*") {
        User.find(
            {},
            function (err, docs) {
                var usernames = [];
                if (docs) {
                    docs.forEach(function (doc) {
                        usernames.push(doc.username);
                    });
                    res.send(usernames);
                }
            });
    }
    else {
        User.find(
            {"username": {"$regex": req.query['term'], "$options": "i"}},
            function (err, docs) {
                var usernames = [];
                if (docs) {
                    docs.forEach(function (doc) {
                        usernames.push(doc.username);
                    });
                    res.send(usernames);
                }
            });
    }
});

router.post('/add_friend', function(req, res, next) {
    if (req.session.user==null) {
        console.log('user not logged in');
        res.render('index', {
            friendsError: 'Must be logged in to add friends',
            title: 'FaceAfeka',
            user: req.session.user,
            posts: {}
        });
    }
    else {
        User.findOne({username: req.body.friend_name}, function(err, result) {
            if (!result) {
                res.render('index', {
                    friendsError: 'Not a registered user',
                    title: 'FaceAfeka',
                    user: req.session.user,
                    posts: {}
                });
            }
            else {
                User.findOne({username: req.session.user.username}, function(err, currentUser) {
                    if (currentUser.friends.includes(req.body.friend_name)) {
                        res.render('index', {
                            friendsError: 'You are already friends',
                            title: 'FaceAfeka',
                            user: req.session.user,
                            posts: {}
                        });
                    }
                    else if (currentUser.username == req.body.friend_name) {
                        res.render('index', {
                            friendsError: 'Cannot add self as friend',
                            title: 'FaceAfeka',
                            user: req.session.user,
                            posts: {}
                        });
                    }
                    else {
                        console.log('user ' + req.session.user.username + ' adding friend ' + req.body.friend_name);
                        currentUser.friends.push(req.body.friend_name);
                        currentUser.save();
                        res.redirect('/');
                        console.log('adding the other way around');
                        User.findOne({username: req.body.friend_name}, function(err, otherUser) {
                            otherUser.friends.push(currentUser.username);
                            otherUser.save();
                        });
                    }
                });
            }
        });


    }
});

module.exports = router;


function newPost(){

}