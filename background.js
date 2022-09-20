$('#myModal').on('shown.bs.modal', function () {
  $('#myInput').trigger('focus')
})

let videoId = "";
let lastSecond = 0;

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
          let subSnippet = result.items[i].snippet.topLevelComment.snippet;
          console.log(subSnippet.authorDisplayName, ":", subSnippet.textDisplay);
        }
      }
    })
    .catch(error => console.log('error', error));
}

if (location.pathname == "/watch" && location.host == "www.youtube.com") {
  console.log("Starting Youtube Live Comments Extension");
  const urlParams = new URLSearchParams(location.search);
  videoId = urlParams.get("v");
}

const video = document.querySelector('video');

video.ontimeupdate = (event) => {
  if (lastSecond != parseInt(video.currentTime)) {
    lastSecond = parseInt(video.currentTime);
    let minute = parseInt(lastSecond / 60);
    let second = lastSecond % 60;
    let timestamp = "" + minute + (second < 10 ? ":0" : ":") + second;
    console.log(timestamp);
    getCommentThreadsAPI(timestamp);
  }
};

var contextMenuItem = {
  "id": "TestId",
  "title": "TestTitle",

};
chrome.contextMenus.create(contextMenuItem);

chrome.contextMenus.onClicked.addListener(function (clickData) {
  alert("Test");
})