
function isEmpty(str) {
    return (!str || 0 === str.length);
}

function makePostPublic(postId, isPublic) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange=function() {
        if (this.readyState == 4 && this.status == 200) {
            var posts = document.getElementsByClassName("post");
            for(var i = 0; i < posts.length; i++) {
                if(postId == $('.message-id', posts[i]).text()){
                    //console.log("found: " + $('.message-id', posts[i]).text());
                    if(isPublic) {
                        $('.btn-warning', posts[i]).attr('onClick', 'makePostPublic("' + postId + '", false)');
                        $('.btn-warning', posts[i]).html('Make Private');
                        console.log("made public: " + postId);
                    }
                    else {
                        $('.btn-warning', posts[i]).attr('onClick', 'makePostPublic("' + postId + '", true)');
                        $('.btn-warning', posts[i]).html('Make Public');
                        console.log("made private: " + postId);
                    }
                }
            }
        }
    };
    xhttp.open("GET", "/?changePrivacyOn=" + postId, true);
    xhttp.send();
    //console.log("post id sent : " + postId);
}

$(function(){
    $('#submit-post').click(function(e){
        e.preventDefault();

        if(!$('#image-uploader').val()){
            var data = {};
            data.title = $('#title-holder').val();
            data.message = $('#body-holder').val();
            data.private = $('#private-check').is(':checked');
            console.log("no images here...");
            console.log(JSON.stringify(data));
            if(!isEmpty(data.title) && !isEmpty(data.message)) {
                $.ajax({
                    type: 'POST',
                    data: JSON.stringify(data),
                    contentType: 'application/json',
                    cache: false,
                    url: 'https://localhost:8443/newPost',
                    success: function (data) {
                        console.log('success');
                        console.log(JSON.stringify(data));
                        var buttonText = data.private ? "Make Public" : "Make Private";
                        $("#post-form").after(
                            "<div class=\"post\"> " +
                            "<div class=\"row\"> " +
                            "<div class=\"col-md-12\"> " +
                            "<div class=\"thumbnail\">" +
                            "<div class=\"caption\">" +
                            "<p class=\"message-id\" hidden>" + data.id + "</p>" +
                            "<h3 class=\"message-header\"><i class=\"fa fa-comment\" aria-hidden=\"true\"></i> " + data.title + "</h3>" +
                            "<h6 class=\"message-author\">By: " + data.authorName + "</h6>" +
                            "<p class=\"message-body\">" + data.message + "</p>" +
                            "</div>" +
                            "</div>" +
                            "</div>" +
                            "</div>" +
                            "<div class=\"button-group-2\">" +
                            "<button class=\"btn btn-primary\" onclick=\"postNewComment(\'" + data.id + "\')\">Comment (0)</button> " +
                            "<button class=\"btn btn-success\" onclick=\"toggleLike(\'" + data.id + "\',true)\">Like (0)</button> " +
                            "<button class=\"btn btn-warning\" onclick=\"makePostPublic(\'" + data.id + "\'," + data.private + ")\">" +
                            buttonText + "</button>" +
                            "</div>" +
                            "<textarea class=\"form-control comment-holder\" rows=\"2\" placeholder=\"comment\" ></textarea>" +
                            "<div class='last-comment'></div>" +
                            "</div>"
                        );
                        $("#title-holder").val("");
                        $("#title-holder").attr('placeholder', 'Title');
                        $("#body-holder").val("");
                        $("#body-holder").attr('placeholder', 'What is up today?');
                    }
                });
            }
            else if(data.title === "")
                $("#title-holder").attr('placeholder', 'Dont leave me empty..');
            else
                $("#body-holder").attr('placeholder', 'Dont leave me empty..');
        }
        else {
            console.log("sending: " + $('#image-uploader').val());
            uploadImage('C:\Users\Daniel\Desktop\FaceAfeka\public\fa-logo.png', 'image/png')
        }

        //
        //
        // var data = {};
        //
        // data.title = $('#title-holder').val();
        // data.message = $('#body-holder').val();
        // data.private = $('#private-check').is(':checked');
        // //data.image = $('#image-uploader');
        // console.log(JSON.stringify(data));
        //
        // $.ajax({
        //             type: 'POST',
        //             data: JSON.stringify(data),
        //             contentType: 'application/json',
        //             cache: false,
        //             url: 'https://localhost:8443/newPost',
        //             success: function (data) {
        //                 console.log(JSON.stringify(data));
        //             }
        // });


    });
});

function toggleLike(postId, isLiked) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange=function() {
        if (this.readyState == 4 && this.status == 200) {
            var numOfLikes = this.responseText.slice(1,this.responseText.length-1);
            //console.log("refined num of likes: " + numOfLikes);
            var posts = document.getElementsByClassName("post");
            for(var i = 0; i < posts.length; i++) {
                if(postId == $('.message-id', posts[i]).text()){
                    console.log("found: " + $('.message-id', posts[i]).text());
                    if(isLiked) {
                        $('.btn-success', posts[i]).attr('onClick', 'toggleLike("' + postId + '", false)');
                        $('.btn-success', posts[i]).html("Unlike <span class=\"badge\"> "+ numOfLikes + "</span>");
                        console.log("Liked: " + postId);
                    }
                    else {
                        $('.btn-success', posts[i]).attr('onClick', 'toggleLike("' + postId + '", true)');
                        $('.btn-success', posts[i]).html("Like <span class=\"badge\"> "+ numOfLikes + "</span>");
                        console.log("Unliked: " + postId);
                    }
                    break;
                }
            }
        }
    };
    xhttp.open("GET", "/?toggleLikeOn=" + postId, true);
    xhttp.send();
    //console.log("post id sent : " + postId);
}

function postNewComment(postId) {
    var posts = document.getElementsByClassName("post");
    for (var i = 0; i < posts.length; i++)
        if (postId == $('.message-id', posts[i]).text()) {
            var desiredPost = posts[i];
            var comment = $('.comment-holder', desiredPost).val();
            console.log("Found the comment->" + comment)
        }

    if(isEmpty(comment)) {
        console.log("bassa..")
        $('.comment-holder', desiredPost).attr('placeholder', 'Dont leave me empty..');
        return;
    }

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange=function() {
        if (this.readyState == 4 && this.status == 200) {
            console.log("responseText: " + this.responseText);
            var args = JSON.parse(this.responseText);
            $('.comment', desiredPost).html("Comment <span class=\"badge\"> "+ args.num + "</span>");
            $('.last-comment', desiredPost).before(
                "<div class=\"comment-box\"> " +
                "<h6 class=\"comment-author\">Comment by: " + args.authorName + "</h6>" +
                "<p class=\"comment-body\">" + comment + "</p>" +
                "</div>"
            );
            $('.comment-holder', desiredPost).val('');
        }
    };
    xhttp.open("GET", "/?newCommentOn=" + postId + "&comment=" + comment, true);
    xhttp.send();
//console.log("post id sent : " + postId);
}
