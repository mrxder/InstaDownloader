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
        console.log(imgNode);
        const srcArray = imgNode.attributes['srcset'].textContent.split(' ');
        const srcToDownload = srcArray[0];
        return srcToDownload;
    };

    /**
     * @deprecated
     * @param {*} videoNode
     * @returns
     */
    const getVideoUrlFromStory = (videoNode) => {
        return videoNode.childNodes[0].attributes['src'].textContent;
    };

    const getObjectsFromStory = () => {
        const imgObj = document.querySelector('section section img');
        const videoObj = document.querySelector('section section video');
        const userName = getUserNameOfStory();

        return {
            imgObj,
            videoObj,
            userName,
        };
    };

    const clickOnDownloadOriginalStory = () => {
        const { imgObj, videoObj, userName } = getObjectsFromStory();

        if (videoObj) {
            //const videoUrl = getVideoUrlFromStory(videoObj);

            chrome.runtime.sendMessage({
                success: true,
                downloadFromNetwork: true,
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
        const { imgObj, videoObj, userName } = getObjectsFromStory();

        if (videoObj) {
            downloadFrameOfVide(videoObj, userName, 0.1);
        } else if (imgObj) {
            const imgUrl = getImgUrlFromStory(imgObj);

            chrome.runtime.sendMessage({
                success: true,
                url: imgUrl,
                username: userName,
            });
        }
    };

    const clickOnDownloadImgStoryPos = () => {
        const { imgObj, videoObj, userName } = getObjectsFromStory();

        if (videoObj) {
            downloadFrameOfVide(videoObj, userName);
        } else if (imgObj) {
            clickOnDownloadImgStory();
        }
    };

    document.addEventListener('click', (e) => {
        setTimeout(() => {
            const oldDownOrigBtn = document.getElementById('story-down-orig');
            const oldDownImgBtn = document.getElementById('story-down-img');
            const oldDownImgBtnPos =
                document.getElementById('story-down-img-pos');
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
                    console.log('Added download button', downloadBtn);
                }
                // Download Img

                if (oldDownImgBtn == null) {
                    const downloadBtn = document.createElement('BUTTON');
                    downloadBtn.innerHTML = 'Download img';
                    downloadBtn.id = 'story-down-img';
                    downloadBtn.onclick = clickOnDownloadImgStory;
                    document.body.appendChild(downloadBtn);
                }

                // Download Video at current pos
                if (oldDownImgBtnPos == null) {
                    const downloadBtn = document.createElement('BUTTON');
                    downloadBtn.innerHTML = 'Snapshot';
                    downloadBtn.id = 'story-down-img-pos';
                    downloadBtn.onclick = clickOnDownloadImgStoryPos;
                    document.body.appendChild(downloadBtn);
                }
            } else {
                if (oldDownOrigBtn) {
                    oldDownOrigBtn.parentNode.removeChild(oldDownOrigBtn);
                }

                if (oldDownImgBtn) {
                    oldDownImgBtn.parentNode.removeChild(oldDownImgBtn);
                }

                if (oldDownImgBtnPos) {
                    oldDownImgBtnPos.parentNode.removeChild(oldDownImgBtnPos);
                }
            }
        }, 100);
    });

    // Normal

    let lastContextMenuClick = undefined;

    // Keybord short cut start
    let isDPressed = false;
    document.addEventListener('keydown', (e) => {
        if (e.key === 'd') {
            isDPressed = true;
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'd') {
            isDPressed = false;
        }
    });

    document.addEventListener('click', (e) => {
        if (isDPressed) {
            lastContextMenuClick = e.target;
            handleNormalDownload({ target: 'img' }, {}, undefined);
        }
    });
    // Keybord short cut end

    document.addEventListener('contextmenu', (e) => {
        lastContextMenuClick = e.target;
    });

    const downloadFrameOfVide = (videoObj, userName, pos = undefined) => {
        const generateFrame = (videoObj) => {
            let canvas = document.createElement('canvas');
            canvas.width = videoObj.offsetWidth * 10;
            canvas.height = videoObj.offsetHeight * 10;

            console.log(videoObj.offsetWidth);
            console.log(videoObj.offsetHeight);

            let ctx = canvas.getContext('2d');
            ctx.drawImage(videoObj, 0, 0, canvas.width, canvas.height);

            return {
                image: canvas.toDataURL('image/jpeg'),
                currentTime: videoObj.currentTime,
            };
        };

        if (pos) {
            videoObj.addEventListener('seeked', function () {
                const image = generateFrame(videoObj).image;

                const actualHrefParts = window.location.href.split('/');
                chrome.runtime.sendMessage({
                    success: true,
                    url: image,
                    fileName:
                        actualHrefParts[actualHrefParts.length - 2] + '.jpg',
                    username: userName,
                });
            });
            videoObj.currentTime = pos;
        } else {
            const image = generateFrame(videoObj);

            const actualHrefParts = window.location.href.split('/');
            chrome.runtime.sendMessage({
                success: true,
                url: image.image,
                fileName:
                    actualHrefParts[actualHrefParts.length - 2] +
                    '_' +
                    image.currentTime +
                    '.jpg',
                username: userName,
            });
        }
    };

    const handleNormalDownload = (request, sender, sendResponse) => {
        if (request.target) {
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
                        // Parse srcset
                        const srcArrayRaw =
                            imgNode.attributes['srcset'].textContent.split(',');
                        const srcArray = [];
                        srcArrayRaw.forEach((src) => {
                            const parts = src.split(' ');
                            srcArray.push({
                                url: parts[0],
                                width: parseInt(parts[1]),
                            });
                        });

                        // Sort by width desc
                        srcArray.sort((a, b) => {
                            return b.width - a.width;
                        });

                        // Download largest
                        console.log(
                            'Download from srcset with width: ',
                            srcArray[0].width
                        );
                        srcToDownload = srcArray[0].url;
                    } else {
                        srcToDownload = imgNode.attributes['src'].textContent;
                        console.log('Download from src: ', srcToDownload);
                    }

                    if (sendResponse) {
                        sendResponse({
                            success: true,
                            url: srcToDownload,
                            username: usernameObj.innerText,
                        });
                    } else {
                        // If the keyboard shortcut is used
                        chrome.runtime.sendMessage({
                            success: true,
                            url: srcToDownload,
                            username: usernameObj.innerText,
                        });
                    }
                } else {
                    sendResponse({ success: false });
                }
            } else if (request.target === 'video') {
                const allScriptsArray = document.querySelectorAll('script');

                let tOfScripts = 0;
                for (; tOfScripts < allScriptsArray.length; tOfScripts++) {
                    if (
                        allScriptsArray[tOfScripts].innerText.includes('.webm')
                    ) {
                        break;
                    }
                }

                const innerParts =
                    allScriptsArray[tOfScripts].innerText.split('BaseURL');

                let tOfParts = 0;
                for (; tOfParts < innerParts.length; tOfParts++) {
                    if (innerParts[tOfParts].includes('.webm')) {
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
        }
    };
    chrome.runtime.onMessage.addListener(handleNormalDownload);
}
