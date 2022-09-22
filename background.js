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

  fetch("https://www.googleapis.com/youtube/v3/commentThreads?key=AIzaSyApdeF5XnARtbWx_-j_05pvPvoc8DVyyLY&textFormat=plainText&part=snippet&videoId=" + _videoId + "&maxResults=5&searchTerms=" + _timestamp, requestOptions)
    .then(response => response.text())
    .then(result => {
      result = JSON.parse(result);
      if (result.pageInfo.totalResults) {
        for (let i = 0; i < result.pageInfo.totalResults; i++) {
          let commentId = result.items[i].id;
          let subSnippet = result.items[i].snippet.topLevelComment.snippet;
          subSnippet.time = _timestamp;
          if (commentThread.includes(commentId)) {
            let LinesInComment = subSnippet.textOriginal.split("\n");
            for (let j = 0; j < LinesInComment.length; j++) {
              let line = LinesInComment[j];
              if (line.includes(_timestamp)) {
                subSnippet.textDisplay = line;
                console.log("-", subSnippet.authorDisplayName, ":", line);
                addChat(subSnippet);
                break;
              }
            }
          } else {
            commentThread.push(commentId)
            console.log(subSnippet.authorDisplayName, ":", subSnippet.textDisplay);
            addChat(subSnippet);
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
      var videoContainer = document.querySelector('.html5-video-container');
      let commentBar = document.createElement('div');
      commentBar.classList.add('commentBar');
      videoContainer.appendChild(commentBar);
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

const addChat = (data) => {
  let chatElement = document.createElement('div');
  chatElement.classList.add('chat');

  let backgroundElement = document.createElement('div');
  backgroundElement.classList.add('background');

  let shimmerElement = document.createElement('div');
  shimmerElement.classList.add('shimmer');

  let iconElement = document.createElement('div');
  iconElement.classList.add('icon');

  let iconImage = document.createElement('img');
  iconImage.setAttribute('src', data.authorProfileImageUrl);

  let contentElement = document.createElement('div');
  contentElement.classList.add('content');

  let titleElement = document.createElement('div');
  titleElement.classList.add('title');

  let timeElement = document.createElement('span');
  timeElement.classList.add('time');

  let nameElement = document.createElement('span');
  nameElement.classList.add('name');

  let textElement = document.createElement('span');
  textElement.classList.add('text');


  iconElement.appendChild(iconImage);
  titleElement.appendChild(nameElement);
  titleElement.appendChild(timeElement);
  contentElement.appendChild(titleElement);
  contentElement.appendChild(textElement);

  backgroundElement.appendChild(shimmerElement);

  chatElement.appendChild(backgroundElement);
  chatElement.appendChild(iconElement);
  chatElement.appendChild(contentElement);

  nameElement.textContent = data.authorDisplayName;
  textElement.textContent = data.textDisplay;
  timeElement.textContent = data.time;

  chatElement.classList.add('subscriber');

  document.body.querySelector('.commentBar').appendChild(chatElement);
  setTimeout(() => {
    backgroundElement.setAttribute("style", "animation: 2s ease bgTime;");
    chatElement.setAttribute("style", "animation: 2s ease chatTime;");
    setTimeout(() => {
      chatElement.classList.add('fadeout');
      setTimeout(() => {
        chatElement.remove();
      }, 200);
    }, 4800);
  }, 2000);
}

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