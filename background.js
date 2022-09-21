$('#myModal').on('shown.bs.modal', function () {
  $('#myInput').trigger('focus')
})

let previousUrl = '';
let watchingOnYoutube = 0;
let delay = 3; // able to change
let videoId = "";
let lastSecond = 0;
let commentThread = [];

function getCommentThreadsAPI(_timestamp = "0:00", _videoId = videoId) {
  var requestOptions = {
    method: 'GET',
    redirect: 'follow'
  };

  fetch("https://www.googleapis.com/youtube/v3/commentThreads?key=AIzaSyCy_lvVXddJ-l1xN5j-MUWK_TzOe_9RlHE&textFormat=plainText&part=snippet&videoId=" + _videoId + "&maxResults=5&searchTerms=" + _timestamp, requestOptions)
    .then(response => response.text())
    .then(result => {
      result = JSON.parse(result);
      if (result.pageInfo.totalResults) {
        for (let i = 0; i < result.pageInfo.totalResults; i++) {
          let commentId = result.items[i].id;
          let subSnippet = result.items[i].snippet.topLevelComment.snippet;
          if (commentThread.includes(commentId)) {
            let LinesInComment = subSnippet.textOriginal.split("\n");
            for (let j = 0; j < LinesInComment.length; j++) {
              let line = LinesInComment[j];
              if (line.includes(_timestamp)) {
                console.log("-", subSnippet.authorDisplayName, ":", line);
                break;
              }
            }
          } else {
            commentThread.push(commentId)
            console.log(subSnippet.authorDisplayName, ":", subSnippet.textOriginal);
          }
        }
      }
    })
    .catch(error => {
      console.log('error', error);
      watchingOnYoutube = 0;
    });
}

var observer = new MutationObserver(function (mutations) {
  if (location.href !== previousUrl) {
    previousUrl = location.href;
    console.log(`URL changed to ${location.href}`);
    if (location.pathname == "/watch" && location.host == "www.youtube.com") {
      watchingOnYoutube = 1;
      console.log("Starting Youtube Live Comments Extension");
      console.log("delay", delay, "s");
      var video = document.querySelector('video');
      video.ontimeupdate = (event) => {
        if (watchingOnYoutube && lastSecond != (parseInt(video.currentTime) + delay)) {
          lastSecond = parseInt(video.currentTime) + delay;
          let minute = parseInt(lastSecond / 60);
          let second = lastSecond % 60;
          let timestamp = "" + minute + (second < 10 ? ":0" : ":") + second;
          console.log(timestamp);
          const urlParams = new URLSearchParams(location.search);
          getCommentThreadsAPI(timestamp, urlParams.get("v"));
        }
      };
    }
  }
});

const config = { subtree: true, childList: true };
observer.observe(document, config);

var contextMenuItem = {
  "id": "TestId",
  "title": "TestTitle",

};
chrome.contextMenus.create(contextMenuItem);

chrome.contextMenus.onClicked.addListener(function (clickData) {
  alert("Test");
})