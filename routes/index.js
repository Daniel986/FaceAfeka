var express = require('express');
var router = express.Router();
var User = require('../models/user');
var bcrypt = require('bcrypt');
var Promise = require('bluebird');
var Post = require('../models/post');
var multiparty = require('multiparty');
var format = require('util').format;
var multer = require('multer');
var upload = multer({ storage: Storage }).array("imgUploader", 1); //Field name and max count
var Storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, "../public/images/");
    },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    }
});

/* GET home page. */
router.get('/', function(req, res, next) {
    if (req.session.user==null) {
        Post.find({private : false})
            .populate({path:'author', select:'-_id username'})
            .sort({created: 'desc'})
            .limit(5)
            .exec(function(err, posts) {
                return res.render('index', {title: 'FaceAfeka', user: req.session.user,
                    posts: posts, logged: false});
            });
    }
    else {
        if(req.query.changePrivacyOn) {
            console.log("Changing privacy on: " + req.query.changePrivacyOn);
            Post.findOne({_id: req.query.changePrivacyOn}, function (err, post) {
                if(post != null){
                    if(post.private)
                        post.private = false;
                    else
                        post.private = true;
                    post.save();
                    if(err) {
                        console.log("DDNT SAVE");
                    }
                    else
                        console.log("FOOKIN SAVED");
                }
            });
            res.send();
            return;
        }
        if(req.query.toggleLikeOn) {
            console.log("Adding like to: " + req.query.toggleLikeOn);
            Post.findOne({_id: req.query.toggleLikeOn}, function (err, post) {
                var checkIfLiked = false;
                var arr = post.likes;
                var likeToRemove;
                //console.log("BDIKA: " + arr.length);
                //if(arr.length)
                for(var i = 0; i < arr.length; i++)
                {
                    //console.log("author: " + arr[i].author + " user: " + req.session.user._id);
                    if(arr[i].author == req.session.user._id)
                    {
                        checkIfLiked = true;
                        likeToRemove = i;
                        console.log("checkIfLiked: " + checkIfLiked + ",i: " + likeToRemove);
                        break;
                    }
                }
                if(checkIfLiked){
                    console.log("Found IT!");
                    post.likes.splice(likeToRemove, 1);
                    //console.log(JSON.stringify(post));
                }
                else{
                    console.log("FLOCKING NEW LIKE!");
                    post.likes.push({author: req.session.user, authorName: req.session.user.username});
                    //console.log(JSON.stringify(post));
                }
                post.save();
                if(err) {
                    console.log("DDNT SAVE");
                }
                else
                    console.log("FOOKIN SAVED");
            });
            res.send();
            return;
        }
        Post.find({$or: [{$and: [{private : true}, {authorName: { $eq: req.session.user.username }}]}, {private : false}]})
            .populate({path:'author', select:'-_id username'})
            .sort({created: 'desc'})
            .limit(5)
            .exec(function(err, posts) {
                for(var i = 0; i < posts.length; i++)
                {

                    if(posts[i].likes) {
                        console.log("numOfLikes: " + posts[i].likes.length);
                        for (var j = 0; j < posts[i].likes.length; j++) {
                            //console.log("author: " + posts[i].likes[j].author + " user: " + req.session.user._id);
                            if (posts[i].likes[j].author == req.session.user._id) {
                                //console.log("Found it");
                                posts[i].liked = true;
                                break;
                            }
                        }
                    }
                    console.log(JSON.stringify(posts[i]));
                }
                return res.render('index', {title: 'FaceAfeka', user: req.session.user,
                    posts: posts, logged: true});
            });
    }
});

router.get('/wall', function(req, res, next) {
    if (!req.query.username || req.session.user==null) {
        return res.render('index');
    }
    else {
        console.log('requested ' + req.query.username + '\'s wall');
        Post.find({$and: [{authorName: { $eq: req.query.username }}]})
            .populate({path:'author', select:'-_id username'})
            .sort({created: 'desc'})
            .limit(5)
            .exec(function(err, posts) {
                return res.render('wall', {
                    title: req.query.username + '\'s wall',
                    user: req.session.user,
                    posts: posts,
                    logged: true,
                    wallOwner: req.query.username
                });
            });
    }

});

router.post('/newPost', function(req, res, next) {
    var obj = {};
    console.log('body: ' + JSON.stringify(req.body));
    upload(req, res, function (err) {
        if (err) {
            console.log("Something went wrong!");
        }
        console.log("File uploaded sucessfully!.");
    });
    req.body.authorName = req.session.user.username;
    new Post({
        header: req.body.title,
        author: req.session.user,
        authorName: req.session.user.username,
        body: req.body.message,
        comments: [],
        likes: [],
        private: req.body.private
    }).save(function(err, result) {
        console.log("SHOMER TO DB: " + result);
        console.log("ID: " + result._id);
        req.body.id = result._id;
        res.send(req.body);
    });
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

router.get('/friends', function(req, res, next) {
    if (req.session.user==null) {
        console.log('user not logged in');
        res.render('friends', {
            title: 'FaceAfeka',
            user: req.session.user,
            logged: false
        });
    }
    else {
        User.findOne({username: req.session.user.username}, function (err, currentUser) {
            res.render('friends', {
                    title: 'Your stoopid friends',
                    friends: currentUser.friends,
                    logged: true,
                    user: req.session.user
                }
            );
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
