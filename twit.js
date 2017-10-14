var TwitterPackage = require('twitter');
var sentiment = require('sentiment');
var fetch = require('node-fetch');
var DOMParser = require('xmldom').DOMParser;
var Promise = require('bluebird');
var _ = require('lodash');
var mongoose = require('mongoose');
var Post = require('./models/post');
var User = require('./models/user');

var secret = {
    consumer_key: 'Ha8tiwTIzP7qZblqhwyKPs4hr',
    consumer_secret: 'KBoCNmnl5taAC0gI5qMClPyWQh2QcP5VvM8U2FApT3pSlxuTXu',
    access_token_key: '868398942966484992-EzvbMyReqwpM5XRdaJgLIA5f31bfERo',
    access_token_secret: 'n6le9K0BYY3DoKwKCrfLXlU4z95hyVsOMe64rNPnmLBtM'
};
var Twitter = new TwitterPackage(secret);
var filterAmount = 20;
var tweetsRecievedAmnt = 0;
var twitUser;
var subjectsToFollow = 'god, bible, jesus';

mongoose.connect('mongodb://localhost:27017/faceafeka', {useMongoClient: true});

return User.findOne({username:'twit'})
    .exec(function(err, user) {
        if (err) throw 'database offline';
        if (!user) throw 'bot user not found(twit)';
        twitUser = user;

        startTwitterStream();
});

function startTwitterStream() {
    Twitter.stream('statuses/filter', {track: subjectsToFollow}, function(stream) {
        stream.on('data', function(event) {
            if (tweetsRecievedAmnt++ % filterAmount === 0) {
                console.log(event.text);
                var tweetSentiment = sentiment(event.text);
                console.dir(tweetSentiment);
                if (tweetSentiment.words)
                    return searchGoogleImages(tweetSentiment.words.join(' '))
                        .then(function (images) {
                            console.log(images);
                            console.log('Adding new post to FaceAfeka with 3 of the retrieved images');
                            images.splice(3,1);
                            savePostDirectlyToDb(tweetSentiment, images, event.user.name);
                        });
            }
        });

        stream.on('error', function(error) {
            throw error;
        });
    });
}

function savePostDirectlyToDb(tweetSentiment, images, theRetardWhoPostedThis) {
    var sentiment;
    if (tweetSentiment.score >= 1) sentiment = 'a happy';
    else if (tweetSentiment.score <= -1) sentiment = 'an intense';
    else sentiment = 'a boring';
    var postBody = 'I found ' + sentiment + ' post about ' + tweetSentiment.words.join(' and ') + '.\nBy ' + theRetardWhoPostedThis;
    var photos = _.map(images, function(linkToImage) {
        return {
            status: true,
            filename : '',
            type: '',
            publicPath: linkToImage,
            message: 'who wants to be king'
        }
    });
    new Post({
        header: 'Another one',
        author: twitUser,
        authorName: twitUser.username,
        body: postBody,
        comments: [],
        likes: [],
        private: false,
        imgs: photos
    }).save(function(err, result) {
        console.log("SHOMER TO DB: " + result);
        console.log("ID: " + result._id);
    });
}

var headers = {
    'Connection': 'keep-alive',
    'Origin': 'null',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36 Accept: */*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.8,he;q=0.6,th;q=0.4'
};

function searchGoogleImages(query) {
    query = "https://www.google.com.ua/search?source=lnms&sa=X&gbv=1&tbm=isch&q="+encodeURIComponent(query);
    return new Promise( function (resolve, reject) {

        // Fetches Items from Google Image Search URL
        fetch(query, {headers: headers})
            .then(function (res) {
                return res.text()
                    .then(function (res) {
                        console.log(res);
                        
                        var parser = new DOMParser();
                        parser = parser.parseFromString(res, "text/html");
                        console.log('parsed');
                        var images = parser.getElementById("ires").childNodes[0];

                        if (images.nodeName === "div") {

                            resolve(googleGetMobile(images))
                        } else if (images.nodeName === "table") {

                            resolve(googleGetDesktop(images))
                        } else {
                            reject("Unknown System")
                        }
                    })
            });
    })
}

function googleGetMobile(images) {
    // OUT OF DATE

    // Transforms DOM NodeList of images into Array.
    // Needed to use .map method
    images = Array.from(images.childNodes);

    // Maps Image Sources
    return images.map(function (imgDiv) {
        console.log(imgDiv.getAttribute("href"));
        return imgDiv.childNodes[0].src
    })
}

function googleGetDesktop(images) {
    // NodeList of table rows
    images = images.childNodes[0].childNodes;

    // Empty List of image URLs
    var imgSrc = _.map(images, function(image) {
        return image.childNodes[0].childNodes[0].attributes[1].value;
    });

    return imgSrc
}