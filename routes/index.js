var express = require('express');
var router = express.Router();
var User = require('../models/user');
var bcrypt = require('bcrypt');
var Promise = require('bluebird');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'FaceAfeka' });
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

module.exports = router;
