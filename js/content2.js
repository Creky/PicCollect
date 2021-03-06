var DEBUG = false;
String.prototype.endWith = function(str) {
    if (str == null || str == "" || this == null || this.length == 0
            || str.length > this.length)
        return false;
    if (this.substring(this.length - str.length).toLowerCase() == str
            .toLowerCase())
        return true;
    else
        return false;
    return true;
};

var ImageType = {
    IMG: 'IMG',
    TEXT: 'TEXT',
    LINK: 'LINK',
    INPUT_IMG: 'INPUT_IMG'
};

// 兼容性
var chromeSender = chrome.extension.sendMessage;
if (typeof chromeSender != 'function') {
    chromeSender = chrome.extension.sendRequest;
}

var ImageManager = function() {};

ImageManager.prototype = {
    imgList: [],
    getImage: function(config) {
        this.imgList = [];
        this.config = eval(config);
        //console.log("ImageManager.getImage", this.config );
        // this.config = {'rules': []};
        // 普通图片
        var imgs = document.getElementsByTagName("img");
        for ( var i = 0; i < imgs.length; i++) {
            var img = imgs[i];
            var newImg = new Image();// 新建立一个图片图象
            newImg.src = img.src;// 设置图象对象的src
            var width = 0, height = 0;
            width = parseInt(img.naturalWidth);
            height = parseInt(img.naturalHeight);
            nwidth = parseInt(newImg.width);
            nheight = parseInt(newImg.height);
            width = nwidth > width ? nwidth : width;
            height = nheight > height ? nheight : height;
            newImg = null;

            this.addImg(ImageType.IMG, img.src, width, height);
        }

        // input type=image 图片
        var inputs = document.getElementsByTagName("input");
        for ( var i = 0; i < inputs.length; i++) {
            var input = inputs[i];
            var type = input.type;
            if (type.toUpperCase() == 'IMAGE') {
                var src = input.src;
                this.addImg(ImageType.INPUT_IMG, src, 0, 0);
            }
        }

        // 链接图片
        var links = document.getElementsByTagName("a");
        for ( var i = 0; i < links.length; i++) {
            var link = links[i];
            // var tagName = link.firstChild.nodeName;
            var href = link.href;
            if (href.endWith(".jpg") || href.endWith(".jpeg")
                    || href.endWith(".bmp") || href.endWith(".ico")
                    || href.endWith(".gif") || href.endWith(".png")) {
                this.addImg(ImageType.LINK, href, 0, 0);
            }
        }

        // 文本图片
        //var textImgRe = /(file:[/]|https?:|ftp:)[/]{2}[^/][^'"\s]*\.(bmp|gif|ico|jpeg|jpg|png)($|(?=\s))/gi;
        // var textImgRe = /(file:[/]|https?:|ftp:)[/]{2}[^/][^'"\s]*\.(bmp|gif|ico|jpeg|jpg|png)($|(?=\s)|(?=[)]))/gi;
        // var source = document.body.innerHTML;
        // var match = source.match(textImgRe);
        // if (match) {
            // for ( var i = 0; i < match.length; i++) {
                // this.addImg(ImageType.TEXT, match[i], 0, 0);
            // }
        // }
        console.log("Content2取到的图片列表：",this.imgList);

        var _this=this;
        var countTime=0;
        var interval=0;
        var sendImgList=function(){
            if(_this.imgList.length<=0){
                return;
            }
            countTime++;
            console.log("发送图片列表~~~~");
            chromeSender({
                cmd: 'ADD_PIC',
                outputTabId: _this.config.outputTabId,
                imgList: _this.imgList
            },function(obj){
                console.log("收到的返回值：",obj,countTime);
                if(obj && obj.retCode==1){
                    countTime=0;
                    clearInterval(interval);
                }
            });
            if(countTime++>=50){
                countTime=0;
                clearInterval(interval);
            }
        }
        sendImgList();
        interval=setInterval(sendImgList,200);
        
        return this.imgList;
    },
    addImg: function(type, src, width, height) {
        var me = this;
        var bigImgSrc = this.getBigImgUrl(src);
        if (bigImgSrc != src) {
            src = bigImgSrc;
            width = 0;
            height = 0;
        }

        this.imgList.push({
            type: type,
            src: src,
            width: width,
            height: height
        });
    },
    getBigImgUrl: function(src) {
        var rules = this.config.rules;
        //console.log('src:', src );
        for ( var i = 0; i < rules.length; i++) {
            var rule = rules[i];
            var srcPattern = new RegExp(rule.srcPattern);
            var replaceRule = rule.replaceRule;

            if (srcPattern && srcPattern.test(src)) {
                var ret = src;
                try {
                    ret = eval(replaceRule.replace(/@/g, src));
                    if (DEBUG) {
                        console.log('ret:',ret );
                    }
                    return ret;
                } catch(e) {
                    console.log('image rule error:', e);
                }
                

            }
        }
        return src;

    }
};

var imageManager = new ImageManager();