if (typeof browser === 'undefined') {
    browser = typeof chrome !== 'undefined' ? chrome : null;
}

const settings = {
    "active": { defaultValue: true, eventType: 'click' },

    "delay": { defaultValue: -3, eventType: 'change' },
    "max_comments_per_second": { defaultValue: 5, eventType: 'change' },
    "api_key": { defaultValue: 'AIzaSyApdeF5XnARtbWx_-j_05pvPvoc8DVyyLY', eventType: 'change' },
};

const fillPopupOptions = (key, value) => {
    console.log(key, value);
    const element = document.getElementById(key);
    if (!element) return;
    element.value = value;
    if ('checked' in element) element.checked = value;
}

// Load the options menu with our settings.
document.addEventListener("DOMContentLoaded", () => {
    // Defaults.
    Object.entries(settings).forEach(([key, { defaultValue: value }]) => {
        fillPopupOptions(key, value);
    });

    // Sync with local settings.
    browser && browser.storage.local.get(localSettings => {
        Object.entries(localSettings).forEach(([key, value]) => {
            fillPopupOptions(key, value);
        });
    });

    // Change settings with the options menu.
    Object.entries(settings).forEach(([key, { eventType }]) => {
        const element = document.getElementById(key);
        element.addEventListener(eventType, async e => {
            const value = (element.type == "checkbox") ? element.checked : element.value;
            let saveObj = { [key]: value };

            if (browser) {
                // Update local storage.
                browser.storage.local.set(saveObj);
                const messageObj = Object.entries(saveObj).map(([key, value]) => {
                    return { key, value };
                });

                // Update running tabs.
                if (messageObj) {
                    browser.tabs.query({}, tabs => {
                        tabs.forEach(tab => {
                            browser.tabs.sendMessage(tab.id, { settingChanges: messageObj });
                        });
                    });
                }
            }

            if (key === 'active') {
                browser && browser.runtime.sendMessage({ globalEnable: value });
                if (value) {
                    browser.browserAction.setBadgeText({ text: 'ON' });
                    browser.browserAction.setBadgeBackgroundColor({ color: [0, 128, 0, 1] });
                } else {
                    browser.browserAction.setBadgeText({ text: 'OFF' });
                    browser.browserAction.setBadgeBackgroundColor({ color: [128, 128, 128, 1] });
                }
                browser.tabs.query({ active: true, currentWindow: true }, tabs => {
                    tabs.forEach(tab => browser.tabs.reload(tab.id));
                });
            }
        });
    });
});