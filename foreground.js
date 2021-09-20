window.oncontextmenu = null;

if (typeof hasAlreadyBeenDecleared === 'undefined') {
    const hasAlreadyBeenDecleared = true;
    // Stories
    const getUserNameOfStory = () => {
        const hrefOfProfilePic = document
            .querySelector('header a')
            .getAttribute('href');
        const userName = hrefOfProfilePic.substring(
            1,
            hrefOfProfilePic.length - 1
        );

        return userName;
    };
    const getImgUrlFromStory = (imgNode) => {
        const srcArray = imgNode.attributes['srcset'].textContent.split(' ');
        const srcToDownload = srcArray[0];
        return srcToDownload;
    };

    const getVideoUrlFromStory = (videoNode) => {
        return videoNode.childNodes[0].attributes['src'].textContent;
    };

    const clickOnDownloadOriginalStory = () => {
        const imgObj = document.querySelector('section section img');
        const videoObj = document.querySelector('section section video');
        const userName = getUserNameOfStory();

        if (videoObj) {
            const videoUrl = getVideoUrlFromStory(videoObj);

            chrome.runtime.sendMessage({
                success: true,
                url: videoUrl,
                username: userName,
            });
        } else if (imgObj) {
            const imgUrl = getImgUrlFromStory(imgObj);

            chrome.runtime.sendMessage({
                success: true,
                url: imgUrl,
                username: userName,
            });
        }
    };

    const clickOnDownloadImgStory = () => {
        const imgObj = document.querySelector('section section img');
        const userName = getUserNameOfStory();

        if (imgObj) {
            const imgUrl = getImgUrlFromStory(imgObj);

            chrome.runtime.sendMessage({
                success: true,
                url: imgUrl,
                username: userName,
            });
        }
    };

    document.addEventListener('click', (e) => {
        setTimeout(() => {
            const oldDownOrigBtn = document.getElementById('story-down-orig');
            const oldDownImgBtn = document.getElementById('story-down-img');
            if (
                window.location.href.startsWith(
                    'https://www.instagram.com/stories/'
                )
            ) {
                // Download Orig

                if (oldDownOrigBtn == null) {
                    const downloadBtn = document.createElement('BUTTON');
                    downloadBtn.innerHTML = 'Download Orig';
                    downloadBtn.id = 'story-down-orig';
                    downloadBtn.onclick = clickOnDownloadOriginalStory;
                    document.body.appendChild(downloadBtn);
                }

                // Download Img

                if (oldDownImgBtn == null) {
                    const downloadBtn = document.createElement('BUTTON');
                    downloadBtn.innerHTML = 'Download img';
                    downloadBtn.id = 'story-down-img';
                    downloadBtn.onclick = clickOnDownloadImgStory;
                    document.body.appendChild(downloadBtn);
                }
            } else {
                if (oldDownOrigBtn) {
                    oldDownOrigBtn.parentNode.removeChild(oldDownOrigBtn);
                }

                if (oldDownImgBtn) {
                    oldDownImgBtn.parentNode.removeChild(oldDownImgBtn);
                }
            }
        }, 100);
    });

    // Normal

    let lastContextMenuClick = undefined;

    document.addEventListener('contextmenu', (e) => {
        lastContextMenuClick = e.target;
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        let articleNode = lastContextMenuClick;
        while (articleNode.nodeName !== 'ARTICLE') {
            articleNode = articleNode.parentNode;
        }
        let aTagsInArticle = articleNode.querySelectorAll('header a');
        let usernameObj;
        for (let i = 0; i < aTagsInArticle.length; i++) {
            if (aTagsInArticle[i].innerText.length > 1) {
                usernameObj = aTagsInArticle[i];
                break;
            }
        }

        if (request.target === 'img') {
            const imgNode =
                lastContextMenuClick.parentNode.childNodes[0].childNodes[0];
            if (imgNode.nodeName === 'IMG') {
                let srcToDownload;
                // If the img has a set of srcs take the largest otherwiese only take the src
                if (imgNode.attributes['srcset']) {
                    const srcArray =
                        imgNode.attributes['srcset'].textContent.split(' ');
                    srcToDownload = srcArray[srcArray.length - 2].split(',')[1];
                    console.log('srcset', srcToDownload);
                } else {
                    srcToDownload = imgNode.attributes['src'].textContent;
                    console.log('src', srcToDownload);
                }

                sendResponse({
                    success: true,
                    url: srcToDownload,
                    username: usernameObj.innerText,
                });
            } else {
                sendResponse({ success: false });
            }
        } else if (request.target === 'video') {
            const allScriptsArray = document.querySelectorAll('script');

            let tOfScripts = 0;
            for (; tOfScripts < allScriptsArray.length; tOfScripts++) {
                if (allScriptsArray[tOfScripts].innerText.includes('.mp4')) {
                    break;
                }
            }

            const innerParts =
                allScriptsArray[tOfScripts].innerText.split('BaseURL');

            let tOfParts = 0;
            for (; tOfParts < innerParts.length; tOfParts++) {
                if (innerParts[tOfParts].includes('.mp4')) {
                    break;
                }
            }

            let targetPart = innerParts[tOfParts];
            targetPart = targetPart.replace(/.u0026amp./gi, '&');
            const urlStartsAt = targetPart.indexOf('https:');
            targetPart = targetPart.substring(
                urlStartsAt,
                targetPart.length - 7
            );

            sendResponse({
                success: true,
                url: targetPart,
                username: usernameObj.innerText,
            });
        }
    });
}
