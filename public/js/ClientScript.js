
function isEmpty(str) {
    return (!str || 0 === str.length);
}

function makePostPublic(postId, isPublic) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange=function() {
        if (this.readyState == 4 && this.status == 200) {
            var posts = document.getElementsByClassName("caption");
            for(var i = 0; i < posts.length; i++) {
                if(postId == $('.message-id', posts[i]).text()){
                    console.log("found: " + $('.message-id', posts[i]).text());
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
    console.log("post id sent : " + postId);
}

$(function(){
    $('#submit-post').click(function(e){
        e.preventDefault();
        var data = {};
        data.title = $('#title-holder').val();
        data.message = $('#body-holder').val();
        data.private = $('#private-check').is(':checked');
        console.log(JSON.stringify(data));

        if(!isEmpty(data.title) && !isEmpty(data.message)) {
            $.ajax({
                type: 'POST',
                data: JSON.stringify(data),
                contentType: 'application/json',
                cache: false,
                url: 'https://localhost:8443/newPost',
                success: function (data) {
                    if (data.title !== "" && data.message !== "")
                        console.log('success');
                    console.log(JSON.stringify(data));
                    var buttonText = data.private ? "Make Public" : "Make Private";
                    $("#post-form").after(
                        "<div class=\"row\"> " +
                        "<div class=\"col-md-12\"> " +
                        "<div class=\"thumbnail\">" +
                        "<div class=\"caption\">" +
                        "<p class=\"message-id\" hidden>" + data.id + "</p>" +
                        "<h3 class=\"message-header\"><i class=\"fa fa-comment\" aria-hidden=\"true\"></i> " + data.title + "</h3>" +
                        "<h6 class=\"message-author\">By: " + data.authorName + "</h6>" +
                        "<p class=\"message-body\">" + data.message + "</p>" +
                        "<div class=\"button-group-2\">" +
                        "<button class=\"btn btn-primary\" >Comment (0)</button> " +
                        "<button class=\"btn btn-success\" onclick=\"toggleLike(\'" + data.id + "\',true)\">Like (0)</button> " +
                        "<button class=\"btn btn-warning\" onclick=\"makePostPublic(\'" + data.id + "\'," + data.private + ")\">" +
                        buttonText + "</button>" +
                        "</div>" +
                        "</div>" +
                        "</div>" +
                        "</div>" +
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
    });
});

function toggleLike(postId, isLiked) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange=function() {
        if (this.readyState == 4 && this.status == 200) {
            var posts = document.getElementsByClassName("caption");
            for(var i = 0; i < posts.length; i++) {
                if(postId == $('.message-id', posts[i]).text()){
                    var likeNum = !posts[i].likes ? 0 : Object.keys(posts[i].likes).length;
                    console.log("found: " + $('.message-id', posts[i]).text());
                    console.log("likes on post : " + likeNum);
                    if(isLiked) {
                        $('.btn-success', posts[i]).attr('onClick', 'toggleLike("' + postId + '", false)');
                        $('.btn-success', posts[i]).html("Unlike (" + (likeNum+1) + ")");
                        console.log("Liked: " + postId);
                    }
                    else {
                        $('.btn-success', posts[i]).attr('onClick', 'toggleLike("' + postId + '", true)');
                        $('.btn-success', posts[i]).html('Like (' + likeNum + ')');
                        console.log("Unliked: " + postId);
                    }
                }
            }
        }
    };
    xhttp.open("GET", "/?toggleLikeOn=" + postId, true);
    xhttp.send();
    console.log("post id sent : " + postId);
}