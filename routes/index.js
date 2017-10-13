var express = require('express');
var router = express.Router();
var User = require('../models/user');
var bcrypt = require('bcrypt');
var Promise = require('bluebird');
var Post = require('../models/post');
var multiparty = require('multiparty');
var format = require('util').format;
var multer = require('multer');
var fs = require("fs");
var path = require('path');
var formidable = require('formidable'), readChunk = require('read-chunk'), fileType = require('file-type');
var Storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, "../public/user-images/");
    },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    }
});
var upload = multer({ storage: Storage }).array("imgUploader", 1); //Field name and max count

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
        if(req.query.toggleLikeOn) {
            var checkIfLiked = false;
            var numOfLikes = 0;
            res.setHeader('Content-Type', 'text/plain');
            console.log("Adding like to: " + req.query.toggleLikeOn);
            Post.findOne({_id: req.query.toggleLikeOn}, function (err, post) {
                var arr = post.likes;
                var likeToRemove;
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
                numOfLikes = arr.length;
                post.save(function(err, result) {
                    res.json(numOfLikes.toString());
                });
                if(err) {
                    console.log("DDNT SAVE");
                }
                else
                    console.log("FOOKIN SAVED");
            });
            return;
        }
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
        if(req.query.newCommentOn) {
            res.setHeader('Content-Type', 'text/plain');
            console.log("Adding comment to: " + req.query.newCommentOn);
            Post.findOne({_id: req.query.newCommentOn}, function (err, post) {
                var arr = post.comments;
                arr.push({author: req.session.user, authorName: req.session.user.username, body: req.query.comment});
                //console.log(JSON.stringify(post));
                numOfComments = arr.length;
                post.save(function(err, result) {
                    res.json({'num': numOfComments.toString(), 'authorName': req.session.user.username});
                });
                if(err) {
                    console.log("DDNT SAVE");
                }
                else
                    console.log("A NEW COMMENT WAS MADE!");
            });
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

router.get('/uploads', function(req, res, next) {
    console.log("entering GET");
    var filesPath = path.join(__dirname, '..public/uploads/');
    fs.readdir(filesPath, function (err, files) {
        if (err) {
            console.log(err);
            return;
        }

        files.forEach(function (file) {
            fs.stat(filesPath + file, function (err, stats) {
                if (err) {
                    console.log(err);
                    return;
                }

                var createdAt = Date.parse(stats.ctime),
                    days = Math.round((Date.now() - createdAt) / (1000*60*60*24));

                if (days > 1) {
                    fs.unlink(filesPath + file);
                }
            });
        });
    });
    console.log("exiting GET");
    res.sendFile(path.join(__dirname, '../views/index.hbs'));

});

router.post('/PostWithImage', function(req, res, next) {
    var photos = [];
    var form = new formidable.IncomingForm();
    console.log("entering POST");
    // Tells formidable that there will be multiple files sent.
    form.multiples = true;
    // Upload directory for the images
    form.uploadDir = path.join(__dirname, '../tmp_uploads');
    // Invoked when a file has finished uploading.
    form.on('file', function (name, file) {
        // Allow only 3 files to be uploaded.
        if (photos.length === 3) {
            fs.unlink(file.path);
            return true;
        }

        var buffer = null,
            type = null,
            filename = '';

        // Read a chunk of the file.
        buffer = readChunk.sync(file.path, 0, 262);
        // Get the file type using the buffer read using read-chunk
        type = fileType(buffer);

        // Check the file type, must be either png,jpg or jpeg
        if (type !== null && (type.ext === 'png' || type.ext === 'jpg' || type.ext === 'jpeg')) {
            // Assign new file name
            filename = Date.now() + '-' + file.name;

            // Move the file with the new file name
            fs.rename(file.path, path.join(__dirname, '../public/uploads/' + filename));


            // Add to the list of photos
            photos.push({
                status: true,
                filename: filename,
                type: type.ext,
                publicPath: 'uploads/' + filename
            });
        } else {
            photos.push({
                status: false,
                filename: file.name,
                message: 'Invalid file type'
            });
            fs.unlink(file.path);
        }
    });

    form.on('error', function(err) {
        console.log('Error occurred during processing - ' + err);
    });

    // Invoked when all the fields have been processed.
    form.on('end', function() {
        console.log('All the request fields have been processed.');
    });

    // Parse the incoming form fields.
    form.parse(req, function (err, fields, files) {
        var ret = {};
        // console.log("title : " + fields.title);
        // console.log("body : " + fields.message);
        // console.log("privacy : " + fields.private);
        // console.log("user : " + req.session.user.username);
        new Post({
            header: fields.title,
            author: req.session.user,
            authorName: req.session.user.username,
            body: fields.message,
            comments: [],
            likes: [],
            private: fields.private,
            imgs: photos
        }).save(function(err, result) {
            if(!err){
                //console.log("SHOMER TO DB: " + result);
                ret = result;
                //res.json(req.body);
                res.status(200).json(result);
            }
            else {
                console.log("Niggered, because there is a " + err);
            }
        });

    });
});

router.post('/newPost', function(req, res, next) {
    req.body.authorName = req.session.user.username;
    new Post({
        header: req.body.title,
        author: req.session.user,
        authorName: req.session.user.username,
        body: req.body.message,
        comments: [],
        likes: [],
        private: req.body.private,
        imgs: []
    }).save(function(err, result) {
        //console.log("SHOMER TO DB: " + result);
        //console.log("ID: " + result._id);
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
