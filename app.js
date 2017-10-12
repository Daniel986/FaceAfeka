var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressHbs = require('express-handlebars');
var mongoose = require('mongoose');
var session = require('express-session');
var Promise = require('bluebird');
var index = require('./routes/index');
var app = express();
var Handlebars = require('handlebars');
var multer = require('multer');

// var promise = mongoose.connect('mongodb://localhost', {
//     useMongoClient: true,
//     /* other options */
// });
mongoose.connect('mongodb://localhost:27017/faceafeka', {useMongoClient: true});

// cookie management
app.use(session({
    secret: '2C44774A-D649-4D44-9535-46E296EF984F',
    resave: false,
    saveUninitialized: false}));
//authentication middleware
app.use(function (req, res, next) {
    if (req.session && req.session.admin) {
        res.locals.admin = true;
    }
    next();
});
//authorization middleware
var authorize = function (req, res, next) {
    if (req.session && req.session.admin) {
        return next();
    } else {
        return res.sendStatus(401);
    }
};
// view engine setup
app.engine('.hbs', expressHbs({defaultLayout:'layout',
    extname:'.hbs',
    layoutsDir:__dirname +'/views/layouts',
    partialsDir:__dirname +'/views/partials'}));
app.set('view engine', '.hbs');
app.set('views', __dirname + '/views');
// favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
    switch (operator) {
        case '==':
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
            return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
            return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
            return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
            return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
});

module.exports = app;
