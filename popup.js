var theButton = document.querySelector("button");

function updateButton() {
    // update button based on storage
    chrome.storage.local.get(['onOrOff'], result => {
        theButton.innerHTML = result.onOrOff ? "OFF" : "ON";
        theButton.className = result.onOrOff ? "buttonON" : "buttonOFF";
    })
}

function toggleButton(e) {
    // check className of button
    var bool = e.target.className === 'buttonON' ? false : true
    chrome.storage.local.set({ 'onOrOff': bool }, result => {
        updateButton()
    })

}

updateButton()
theButton.onclick = toggleButton