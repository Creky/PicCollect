// 临时使用
var chromeTabSender = chrome.tabs.sendMessage;
if (typeof chromeTabSender != 'function') {
    chromeTabSender = chrome.tabs.sendRequest;
}

// webRequest的缓存
// var webRequestCache = {};

// function addToWebRequestCache(tabId, imgArray) {
//     if (typeof webRequestCache[tabId] == 'object') {
//         webRequestCache[tabId] = $.merge(webRequestCache[tabId], imgArray);
//     } else {
//         webRequestCache[tabId] = imgArray;
//     }
    

//     //console.log('webRequestCache', webRequestCache); 
// }


// chrome.webRequest.onCompleted.addListener(function(details) { 
//     var url = details.url;
//     var tabId = details.tabId;
//     if (tabId == -1) return;

//     // 百度相册
//     // if (url.indexOf("xiangce.baidu.com/picture/gallery/data/list/") != -1) {
//     //     //console.log('details', details); 
//     //     $.getJSON(url, function(data) {
//     //         var imgArray = [];
//     //         var imgList = data.data.picture_list;
//     //         console.log('data', data);
//     //         for (var i = 0; i < imgList.length; i++) {
//     //             var img = imgList[i];
//     //             imgArray.push(img.img_src_1600);
//     //         }
//     //         addToWebRequestCache(tabId, imgArray);
//     //     });
//     // }
// },{urls:["<all_urls>"]}, ["responseHeaders"]);

// function clearCache() {
//     chrome.tabs.query({
//     }, function(tabs) {
//         var tabIds = [];
//         for (var i = 0; i < tabs.length; i++) {
//             tabIds.push(tabs[i].id);
//         }

//         for (var tabId in webRequestCache) {
//            // console.log('tabId',tabId);
//             if (webRequestCache.hasOwnProperty(tabId)) {
//                 if ($.inArray(parseInt(tabId), tabIds) == -1) {
//                     delete webRequestCache[tabId];
//                 }
//             }
//         }
//         //console.log('tabs', tabs);
//     });
// }

// setInterval(clearCache, 10 * 60 * 1000); // 10 min


var GET_IMAGE_TYPE = {
    CURRENT: 0,
    ALL_TAB: 1
};

// 取得输出TAB
function getOuputTab(config) {
    chrome.tabs.query({
        url: chrome.extension.getURL("output.html"),
        windowId: chrome.windows.WINDOW_ID_CURRENT
    }, function(outputTabs) {
        //console.log('outputTabs', outputTabs);
        if (outputTabs.length == 0 || localStorage.oneOutput == '0') {
            chrome.tabs.create({
                url: chrome.extension.getURL("output.html")
            }, function(outputTab) {
                //console.log('outputTab', outputTab);
                config.callback(outputTab);
            });
        } else {
            config.callback(outputTabs[0]);
        }
    });
}

function getTabImage(config) {
    // 获取图片
    var tabConf = {};
    if (config.type == GET_IMAGE_TYPE.CURRENT) {
        tabConf = {
            active: true,
            windowId: chrome.windows.WINDOW_ID_CURRENT
        };
    } else if (config.type == GET_IMAGE_TYPE.ALL_TAB) {
        tabConf = {
            windowId: chrome.windows.WINDOW_ID_CURRENT
        };
    } else {
        console.log('出错啦！');
        return;
    }

    chrome.tabs.query(tabConf, function(tabs) {
        if (tabs.length == 0) {
            console.log('没有标签啊？！');
            return;
        }
        localStorage["title"] = tabs[0].title;
        localStorage["url"] = tabs[0].url;
        
        var urlHost = getHost(tabs[0].url);
        
        chrome.browserAction.setBadgeText({
            text: 'load'
        });

        getOuputTab({
            callback: function(outputTab) {
                // 标签变为激活
                chrome.tabs.highlight({
                    windowId: outputTab.windowId,
                    tabs: [ outputTab.index ]
                }, function() {
                });

                var outputTabId = outputTab.id;
                console.log('outputTabId and tabs:', outputTabId,tabs);
                for ( var i = 0; i < tabs.length; i++) {
                    var tab = tabs[i];
                    getImage(tab, outputTabId);
                }
            }
        });

    });
}

function getHost(url) { 
    var host = null;
    var regex = /.*\:\/\/([^\/]*).*/;
    var match = url.match(regex);
    if(typeof match != "undefined"&& null != match)
            host = match[1];
    return host;
};

// 执行脚本
function getImage(tab, outputTabId) {
    //console.log('tab', tab);
    var config = {
        rules: G_CONFIG.getRules(),
        outputTabId: outputTabId
    };
    var configStr = JSON.stringify(config, null, null);

    var tabId = tab.id;

    chrome.tabs.executeScript(tabId, {
        file: 'js/content2.js',
        allFrames: true
    }, function() {
        var code = "imageManager.getImage(" + configStr + ");";
        chrome.tabs.executeScript(tabId, {
            code: code,
            allFrames: true
        }, function() {
            
            // 加入webRequestCache的内容
            // var thisTabCache = webRequestCache[tabId];
            // if (typeof thisTabCache == "object") {
            //     var tmpImgList = [];
            //     $.each(thisTabCache, function(i, item) {
            //         tmpImgList.push({'type': 'IMG', 'src': item, 'width': 0, 'height': 0});
            //     });

            //     chromeTabSender(outputTabId, {
            //         cmd: 'ADD_PIC',
            //         imgList: tmpImgList
            //     }, function(response) {
            //     });

            //     // 清除
            //     delete webRequestCache[tabId];
            // }

            chrome.browserAction.setBadgeText({
                text: ''
            });
        });
    });

}

function getCurrentTabImage() {
    getTabImage({
        type: GET_IMAGE_TYPE.CURRENT
    });
}

function getAllTabImage() {
    getTabImage({
        type: GET_IMAGE_TYPE.ALL_TAB
    });
}

// 还原url
function translateUrl(urlText) {
    var urls = [];
    var pages = [];
    var urlPattern = /^https?:\/\/.*$/;
    var pattern = /^(.*)\[(.*?)\](.*)$/;
    var numPattern = /\d+-\d+/;
    var zeroN
    var matchs = urlText.match(pattern);
    if (matchs) {
        var prefix = matchs[1];
        var middle = matchs[2];
        var end = matchs[3];

        var middleArr = middle.split(","); //a-z,2,4-9
        for (var i=0; i < middleArr.length; i++) {
            var rule = middleArr[i];
            if (rule.indexOf("-") > 0) {
                var rule0 = rule.split("-")[0];
                var rule1 = rule.split("-")[1];
                if (numPattern.test(rule)) { // 01-12
                    for (var num=parseInt(rule0); num <= parseInt(rule1); num++) {
                        pages.push("00000".substr(0, rule0.length - (""+num).length) + num);
                    }
                } else { // a-z
                    for (var achar=rule0.charCodeAt(0); achar<=rule1.charCodeAt(0); achar++) {
                        pages.push(String.fromCharCode(achar));
                    }
                }
            } else { // 1,4,a
                pages.push(rule);
            }
        }

        for (var i=0; i < pages.length; i++) {
            urls.push(prefix + pages[i] + end);
        }

    } else if (urlText.match(urlPattern)) {
        urls.push(urlText);
    }
    return urls;
}


function openPage(pageUrls) {
    if (pageUrls.length < 1) {
        return ;
    }

    var pageArray = [];
    $(pageUrls).each(function(pageIndex, pageUrl) {
        if (pageUrl != "") {
            var tmpArr = translateUrl(pageUrl);
            for (var i=0; i < tmpArr.length; i++) {
                pageArray.push(tmpArr[i]);
            }
        }
    });

    if (pageArray.length < 1) return;

    chrome.tabs.create({url: pageArray[0], selected: true}, function(tab) {
        pageArray.shift();
        // 打开各个页面
        var navPage = "<a href='#top'>第1页</a>";
        $(pageArray).each(function(index, url) {
            var page = index + 2;
            var pageName = "_fatkunimage_"+page+"";
            navPage += "<a href='#"+pageName+"'>第"+ page +"页</a>";
            var openPageCode = "$(\"<div style='background:#ccc;color:#000;padding:10px;'><a name='"+pageName+"'/>---分隔线---地址："+url+"</div>\").appendTo(\"body\");"
                + "$(\"<iframe src='"+url+"' style='width:100%;border:0;'"
                + "onload='this.height = this.contentDocument.body.offsetHeight + 100;'></iframe>\")"
                + ".appendTo(\"body\");";
            chrome.tabs.executeScript(tab.id, {
                code: openPageCode
            }, function(){});
        });

        // 导航
        var navCode = "$(\"<style>._fatkun_nav {position: fixed;top: 0;right: 0; background: #eee;}"
            +"._fatkun_nav a{display: block;padding: 10px 20px; text-decoration: none; color: #000;}._fatkun_nav a:hover{background:#999; color:#FFF;}</style>" 
            +"<div class='_fatkun_nav'>"+navPage+"</div>\").appendTo(\"body\")";
        chrome.tabs.executeScript(tab.id, {
            code: navCode
        }, function(){});
    });
    


}


// 点击按钮
chrome.browserAction.onClicked.addListener(function(tab) {
    getCurrentTabImage();
});

function myOnMessage(request, sender, sendResponse) {
    //console.log('myOnMessage onRequest', request);
    switch (request.cmd) {
    case 'ADD_PIC':
        // console.log('Background接收到消息');
        // var imgList = request.imgList;
        // var outputTabId = request.outputTabId;
        // chromeTabSender(outputTabId, {
        //     cmd: 'ADD_PIC',
        //     imgList: imgList
        // }, function(response) {
        // });
        // sendResponse({});
        break;
    case 'IS_USE_HOTKEY':
        if (localStorage.useHotkey == undefined) {
            localStorage.useHotkey = "1";
        }
        sendResponse({
            on: localStorage.useHotkey == "1"
        });
        break;
    case 'GET_CURRENT_TAB_IMAGE':
        getCurrentTabImage();
        sendResponse({});
        break;
    case 'GET_ALL_TAB_IMAGE':
        getAllTabImage();
        sendResponse({});
        break;
    case 'OPEN_PAGE':
        var pageUrls = request.pageUrls;
        openPage(pageUrls);
        sendResponse({});
        break;
    }
}

// 是否需要更新大图规则
function isNeedUpdateRule() {
    var ruleLastUpdateTime = localStorage.ruleLastUpdateTime;
    var ruleLastUpdateTimeObj = new Date(ruleLastUpdateTime);
    var now = new Date();

    //ruleLastUpdateTimeObj.setDate(ruleLastUpdateTimeObj.getDate() + 1);
    ruleLastUpdateTimeObj.setSeconds(ruleLastUpdateTimeObj.getSeconds() + 1);
    if (ruleLastUpdateTime == undefined || ruleLastUpdateTimeObj < now) {
        return true;
    }
    return false;
}

var reciver = chrome.extension.onMessage;
if (reciver  == undefined) {
    reciver = chrome.extension.onRequest;
}

reciver.addListener(function(request, sender, sendResponse) {
    myOnMessage(request, sender, sendResponse);
});

$(function(){
    // 更新大图规则
    if (isNeedUpdateRule()) {
        console.log('updateCommonRule');
        G_CONFIG.updateCommonRule();
    }
    

    $.getJSON(chrome.extension.getURL("manifest.json"), function(data) {
        var newVersion = data.version;
        var oldVersion = localStorage["version"];
        if (oldVersion == null || oldVersion != newVersion) {
            localStorage["version"] = newVersion;
            //var url = 'http://fatkun.com/2010/09/batch-image-download.html?ver=' + newVersion;
            /*
            var url = chrome.extension.getURL("update.html");
            chrome.tabs.create({
                url: url
            }, function(tab) {
            });
            */
            
        }
    });
    
});

