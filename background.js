// Sender
function addChat(_data) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { method: 'addChat', data: _data });
    });
}

// Listener
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    console.log(message.method, "method called");
    if (message.method === 'watching') {
        watching(message.videoId);
    }
});

const watching = (_videoId) => {
    // Can be Here
}