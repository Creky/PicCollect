// 兼容性
var chromeExtensionSender = chrome.extension.sendMessage;
if (typeof chromeExtensionSender != 'function') {
    chromeExtensionSender = chrome.extension.sendRequest;
}

chromeExtensionSender({"cmd": "IS_USE_HOTKEY"}, function(response){
    if(response.on){
       document.addEventListener("keydown", function (event) { 
           var key = event.keyCode;
           if(!event.ctrlKey && event.altKey){
               switch(key){ 
                   case 90: // Z:90
                       chromeExtensionSender({"cmd": "GET_CURRENT_TAB_IMAGE"});
                       break;
               }
           }
       }, false); 
    }
});
