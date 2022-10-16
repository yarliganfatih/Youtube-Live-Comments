var isExtensionOn = false;
let previousUrl = '';
let watchingOnYoutube = 0;
let delay = 3; // able to change
let videoId = "";
let lastSecond = 0;
let commentThread = [];

chrome.storage.local.get('onOrOff', function (result) {
  setExtensionStatus(result.onOrOff);
});

chrome.storage.onChanged.addListener(function (changes, area) {
  if (area === 'local' && changes.onOrOff) {
    setExtensionStatus(changes.onOrOff.newValue);
  }
});

const setExtensionStatus = (status) => {
  isExtensionOn = status;
  if (status) {
    console.log("Youtube Live Comments is ON");
    chrome.browserAction.setBadgeText({ text: 'ON' });
    chrome.browserAction.setBadgeBackgroundColor({ color: [0, 128, 0, 1] });
  } else {
    console.log("Youtube Live Comments is OFF");
    chrome.browserAction.setBadgeText({ text: 'OFF' });
    chrome.browserAction.setBadgeBackgroundColor({ color: [128, 128, 128, 1] });
  }
}

// manifest.json > content_scripts > matches is not useful
var observer = new MutationObserver(function (mutations) {
  if (location.href !== previousUrl) {
    previousUrl = location.href;
    console.log(`URL changed to ${location.href}`);
    chrome.storage.local.get('onOrOff', function (result) {
      isExtensionOn = result.onOrOff;
    });
    if (location.host == "www.youtube.com" && isExtensionOn) {
      if (location.pathname == "/watch") {
        const urlParams = new URLSearchParams(location.search);
        watching(urlParams.get("v"));
      } else if (location.pathname.includes("/shorts")) {
        watching(location.pathname.replace("/shorts/", ""));
        // TODO #5 videoContainer.appendChild Error
      }
    }
  }
});
const observerConfig = { subtree: true, childList: true };
observer.observe(document, observerConfig);

const watching = (_videoId = videoId) => {
  watchingOnYoutube = 1;
  console.log("Starting Youtube Live Comments Extension");
  console.log("delay", delay, "s");
  var videoContainer = document.querySelector('.html5-video-container');
  let commentBar = document.createElement('div');
  commentBar.classList.add('commentBar');
  videoContainer.appendChild(commentBar);
  var video = document.querySelector('video');
  video.ontimeupdate = (event) => {
    if (watchingOnYoutube && lastSecond != (parseInt(video.currentTime) + delay)) {
      lastSecond = parseInt(video.currentTime) + delay;
      let minute = parseInt(lastSecond / 60);
      let second = lastSecond % 60;
      let timestamp = "" + minute + (second < 10 ? ":0" : ":") + second;
      console.log(timestamp);
      getCommentThreadsAPI(timestamp, _videoId);
    }
  };
}

const getCommentThreadsAPI = (_timestamp = "0:00", _videoId = videoId) => {
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
                subSnippet.textDisplay = "... " + line;
                console.log("-", subSnippet.authorDisplayName, ":", subSnippet.textDisplay);
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

  let subTitleElement = document.createElement('span');
  subTitleElement.classList.add('subTitle');

  let timeElement = document.createElement('span');
  timeElement.classList.add('time');

  let nameElement = document.createElement('span');
  nameElement.classList.add('name');

  let dateElement = document.createElement('i');
  dateElement.classList.add('createdAt');

  let textElement = document.createElement('a');
  textElement.classList.add('text');


  iconElement.appendChild(iconImage);
  subTitleElement.appendChild(nameElement);
  subTitleElement.appendChild(dateElement);
  titleElement.appendChild(subTitleElement);
  titleElement.appendChild(timeElement);
  contentElement.appendChild(titleElement);
  contentElement.appendChild(textElement);

  backgroundElement.appendChild(shimmerElement);

  chatElement.appendChild(backgroundElement);
  chatElement.appendChild(iconElement);
  chatElement.appendChild(contentElement);

  nameElement.textContent = data.authorDisplayName;
  dateElement.textContent = data.publishedAt.substring(0, 10);
  textElement.innerHTML = data.textDisplay.replaceAll("\n", "<br>");
  timeElement.textContent = data.time;

  chatElement.classList.add('subscriber');

  document.body.querySelector('.commentBar').appendChild(chatElement);
  setTimeout(() => {
    backgroundElement.setAttribute("style", "animation: 2s ease bgTime;");
    chatElement.setAttribute("style", "animation: 2s ease chatTime;");
    timeElement.setAttribute("style", "animation: 2s ease timeTime;");
    setTimeout(() => {
      chatElement.classList.add('fadeout');
      setTimeout(() => {
        chatElement.remove();
      }, 200);
    }, 4800);
  }, 2000);
}