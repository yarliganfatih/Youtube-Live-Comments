if (typeof browser === 'undefined') {
    browser = typeof chrome !== 'undefined' ? chrome : null;
}

const settings = {
    "active": { defaultValue: true, eventType: 'click' },

    "delay": { defaultValue: -3, eventType: 'change' },
    "max_comments_per_second": { defaultValue: 5, eventType: 'change' },
    "api_key": { defaultValue: 'AIzaSyApdeF5XnARtbWx_-j_05pvPvoc8DVyyLY', eventType: 'change' },
};

const cache = {};
try {
    browser.storage.local.get(localSettings => {
        Object.entries(settings).forEach(([key, { defaultValue }]) => {
            cache[key] = localSettings[key] ?? defaultValue;
        });
    });
} catch (e) {
    console.log(e);
}

function urlControl() {
    if (!cache['active']) return;
    if (location.host == "www.youtube.com" && location.pathname == "/watch") {
        prepareCommentBar();
        const urlParams = new URLSearchParams(location.search);
        watching(urlParams.get("v"));
    }
}

// wait for cached settings before starting
setTimeout(urlControl, 200);

// navigation detection
let lastUrl = location.href;
var observer = new MutationObserver(mutations => {
    if (lastUrl == location.href) return;
    console.log("New URL detected");
    lastUrl = location.href;
    urlControl();
});
observer.observe(document.body, { childList: true, subtree: true });

const prepareCommentBar = () => {
    let videoContainer = document.querySelector('.html5-video-container');
    let commentBar = document.createElement('div');
    commentBar.classList.add('commentBar');
    videoContainer.appendChild(commentBar);
}

let watchingOnYoutube = 0;
const watching = (_videoId) => {
    watchingOnYoutube = 1;
    console.log("starting Live Comments with delay", cache['delay'], "s");
    var video = document.querySelector('video');
    video.ontimeupdate = (event) => {
        let currentSecond = parseInt(video.currentTime) - parseInt(cache['delay']);
        if (currentSecond < 0) currentSecond = 0;
        if (lastSecond != currentSecond) {
            if (!watchingOnYoutube) return;
            lastSecond = currentSecond;
            let minute = parseInt(lastSecond / 60);
            let second = lastSecond % 60;
            let timestamp = "" + minute + (second < 10 ? ":0" : ":") + second;
            console.log(timestamp);
            getCommentThreadsAPI(_videoId, timestamp);
        }
    };
}

let lastSecond = 0;
let commentThread = [];
const getCommentThreadsAPI = (_videoId, _timestamp = "0:00") => {
    var requestOptions = {
        method: 'GET',
        redirect: 'follow'
    };
    fetch(`https://www.googleapis.com/youtube/v3/commentThreads?key=${cache['api_key']}&textFormat=plainText&part=snippet&videoId=${_videoId}&maxResults=${cache['max_comments_per_second']}&searchTerms=${_timestamp}`, requestOptions)
        .then(response => response.text())
        .then(result => {
            result = JSON.parse(result);
            result.items.forEach((item) => {
                let commentId = item.id;
                let subSnippet = item.snippet.topLevelComment.snippet;
                subSnippet.time = _timestamp;
                if (commentThread.includes(commentId)) {
                    let LinesInComment = subSnippet.textOriginal.split("\n"); // TODO can be different
                    LinesInComment.forEach((line) => {
                        if (line.includes(_timestamp)) {
                            subSnippet.textDisplay = "... " + line + " ...";
                        }
                    });
                } else {
                    commentThread.push(commentId);
                }
                addChat(subSnippet);
            });
        })
        .catch(error => {
            console.log('error', error);
            watchingOnYoutube = 0; // stop scanning
        });
}

const addChat = (data) => {
    console.log(data.authorDisplayName, ":", data.textDisplay);

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