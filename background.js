// Inject
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (
        changeInfo.status == 'complete' &&
        tab.url.startsWith('https://www.instagram.com')
    ) {
        chrome.tabs.executeScript(tabId, { file: 'foreground.js' }, () => {
            // Injected
        });
        chrome.tabs.insertCSS(tabId, { file: 'insta.css' });
    }
});

let urlsDownloaded = new Set();

// Downloader
const processDownloadMessage = (msg) => {
    if (msg.success) {
        // This prevents that the same url gets downloaded multiple times
        // This behavior can occure when the fontent/content script is injected
        // multiple times. That happens when react navigates to a new page.
        const alreadyDownloaded = urlsDownloaded.has(msg.url);
        urlsDownloaded.add(msg.url);
        setTimeout(() => {
            urlsDownloaded.delete(msg.url);
        }, 1000);

        if (!alreadyDownloaded) {
            const urlObj = new URL(msg.url);
            const urlPathArray = urlObj.pathname.split('/');
            const fileName = urlPathArray[urlPathArray.length - 1];
            console.log(msg.username);

            chrome.downloads.download({
                url: msg.url,
                filename: msg.username + '_' + fileName,
            });
        } else {
            console.log('Already downloaded');
        }
    } else {
        console.log(msg);
    }
};

// Story

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request) {
        processDownloadMessage(request);
    }
});

// Normal

const idImg = chrome.contextMenus.create({
    title: 'Download this Img',
    contexts: ['all'],
    id: 'downloadImg',
});

const idVid = chrome.contextMenus.create({
    title: 'Download this Video',
    contexts: ['all'],
    id: 'downloadVideo',
});

chrome.contextMenus.onClicked.addListener((menuItem, tab) => {
    if (
        menuItem.pageUrl === 'https://www.instagram.com/' ||
        menuItem.pageUrl.startsWith('https://www.instagram.com/p/')
    ) {
        let target = undefined;
        if (menuItem.menuItemId === 'downloadImg') {
            target = 'img';
        } else if (menuItem.menuItemId === 'downloadVideo') {
            target = 'video';
        }

        if (target) {
            chrome.tabs.sendMessage(tab.id, { target: target }, (resp) => {
                processDownloadMessage(resp);
            });
        }
    }
});
