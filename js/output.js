var DefaultMinWidth = 0, DefaultMinHeight=0;
var OutputManger = function() {
};
OutputManger.prototype = {
    allImgList: [],
    uniDict: {},
    init: function() {
        this.commonInit();
        this.bindObj();
    },
    commonInit: function() {
        var me = this;
        //removeGA();
        String.prototype.trim = function() {
            return this.replace(/(^\s*)|(\s*$)/g, "");
        };

        $('body').on('keydown',function(event){
            var k=event.keyCode;
            if(event.ctrlKey){
                if(k==83){
                    removeGA();
                }
            }
        });

        if (!localStorage["min_height"] || !localStorage["min_width"]) {
            localStorage["min_width"] = DefaultMinWidth;
            localStorage["min_height"] = DefaultMinHeight;
        }

        // 保存标题
        if (localStorage.savePathType == "useTitle") {
            document.title = localStorage.title;
        } else if (localStorage.savePathType == "useFixedName") {
            document.title = localStorage.fixedName;
        } else {
            // 默认值
            document.title = localStorage.title;
        }

        // 导出格式
        $("#outputTextFormat").val(G_CONFIG.getOutputTextFormat());
        // 重命名规则
        $("#renameRule").val(G_CONFIG.getRenameRule());
        // 是否重命名
        $("#renamePanel input[name='radioRename']").each(function(i, item) {
            if ($(item).val() == G_CONFIG.getRenameMode()) {
                $(item).click();
            }
        });

        var min_width = parseInt(localStorage["min_width"]);
        var min_height = parseInt(localStorage["min_height"]);
        
        var sliderConfig = function(type) {
            var value = 0;
            if (type == "min_width") {
                value = min_width;
            } else if (type == "min_height") {
                value = min_height;
            }
            return {
                range: "min",
                value: value,
                min: 0,
                max: 1000,
                step: 10,
                animate: "fast",
                create: function( event, ui ) {
                    $(this).find(".ui-slider-handle").text(value);
                },
                slide: function( event, ui ) {
                    $(this).find(".ui-slider-handle").text(ui.value);
                },
                stop: function( event, ui ) {
                    var min_width = $("#minWidthSlider").slider("value");
                    var min_height = $("#minHeightSlider").slider("value");
                    //localStorage["min_width"] = min_width;
                    //localStorage["min_height"] = min_height;
                    me.filter({min_width: min_width, min_height: min_height});
                }
            };
        };
        
        $("#minWidthSlider").slider(sliderConfig('min_width'));
        $("#minHeightSlider").slider(sliderConfig('min_height'));


        // 下载队列启动
        var queneEnginer = new QueneEnginer();
        queneEnginer.outputManager = this;
        queneEnginer.start();
        this.queneEnginer = queneEnginer;
    },
    reset: function() {
        $("#list").html("");
    },
    addImgList: function(imgList, reset) {
        var me = this;
        console.log('imgList', imgList);
        this.showNum();
        var totalCount = me.allImgList.length;
        var count = 0;
        $.each(imgList, function(i, item) {
            if (!reset) {
                // 排重
                if (me.uniDict[item.src] == undefined && item.src != '') {
                    count++;
                    item['index'] = totalCount + count;
                    me.uniDict[item.src] = true;
                    me.allImgList.push(item);
                } else {
                    return true;
                }
            }
            var width = item.width;
            var height = item.height;
            if (width * height == 0) {
                me.queneEnginer.add(item);
            } else {
                me.addToList({
                    item: item
                });
            }
        });
    },
    checkFilter: function(config) {
        var urlstr = $("#linktxt").val();
        var min_width = config.min_width;
        var min_height = config.min_height;
        var src = config.src;
        var width = config.width;
        var height = config.height;
        if (width < min_width || height < min_height
            || (urlstr != "" && src.indexOf(urlstr) < 0)) {
            return false;
        }
        return true;
    },
    addToList: function(config) {
        var item = config.item;
        var src = item.src;
        var width = item.width;
        var height = item.height;
        var whsum = width * height;
        
        var min_width = $("#minWidthSlider").slider("value");
        var min_height = $("#minHeightSlider").slider("value");
        if (this.checkFilter({width: width, height: height, src: src, min_width: min_width, min_height: min_height})) {
        //if (this.checkFilter({width: width, height: height, src: src, min_width: localStorage["min_width"], min_height: localStorage["min_height"]})) {
            var listStr = '<li class="selectedimg">'
                + '<img class="aimg" title="'+chrome.i18n.getMessage("aimg_tooltip")+'" src="' + src + '" '
                + 'data-src="'+src+'" '
                + 'data-wh="'+width+'x'+height+'" '
                + 'data-whsum="'+whsum+'" '
                + 'data-index="'+item.index+'" '
                + '/>'
                + '<span class="picurl">'
                + src
                + '</span>'
                + '<span class="info"><img class="share_sina simple_tool" src="../img/sina.png" title="分享到新浪微博"/><img class="open_link simple_tool" src="../img/link.png" title="Open Image in New Tab"/><span class="wh">'
                + width + 'x' + height + '<span></span>' + '</li>';
            $("#list").append(listStr);
            this.resizeImage();
        }
        this.showNum();
    },
    bindObj: function() { // 绑定一些资源
        var me = this;

        $("#btnInverse").click(function() {
            me.inverseSelect();
        });

        // 视图
        $("#btnView").click(function() {
            me.view();
        });

        $("#btnSave").click(function() {
            me.save();
        });

        // 一些按键
        $("#linktxt").keypress(function(e) {
            if (e.keyCode == 13) {
                var min_width = $("#minWidthSlider").slider("value");
                var min_height = $("#minHeightSlider").slider("value");
                me.filter({min_width: min_width, min_height: min_height});
            }
        });

        // 鼠标移入移出
        $("#list").find("li").live({
            mouseenter: function() {
                $(this).find(".simple_tool").css("display", "inline");
                if (localStorage.showUrl == "1") {
                    $(this).find(".picurl").css("display", "block");
                }
            },
            mouseleave: function() {
                $(this).find(".simple_tool").css("display", "none");
                if (localStorage.showUrl == "1") {
                    $(this).find(".picurl").css("display", "none");
                }
            }
        });

        // 点击时
        $("#list").find("li").live("click", function() {
            var li = $(this);
            var visible = li.hasClass("delimg");
            me.setImageVisible(li, visible);
            me.showNum();
        });

        // 新窗口打开图片
        $("#list").find(".open_link").live("click", function() {
            var src = $(this).parent().parent().find(".aimg").attr("data-src");
            window.open(src);
            return false;
        });

        // 新浪微博分享
        $("#list").find(".share_sina").live("click", function() {
            var src = $(this).parent().parent().find(".aimg").attr("src");
            me.share({
                url: src,
                title: '#Fatkun批量下载图片#',
                pic: src
            });
            return false;
        });

        //$("#btnSaveHelpSetting").click(function() {
        //    window.open('chrome://settings/advanced');
        //});

        $("#btnSaveHelpOk").click(function() {
            $("#saveHelp").hide();
            me.saveDirect();
        });
        
        //$("#chrome_download_settings_link").attr("href","chrome://settings/search#"+chrome.i18n.getMessage("chrome_download_settings_url"));
        
        $("#chrome_download_settings_link").click(function() {
            chrome.tabs.create({ url: "chrome://settings/search#"+chrome.i18n.getMessage("chrome_download_settings_url")});
        });
        
        $("#btnSaveHelpCancel").click(function() {
            $("#saveHelp").hide();
        });

        $("#sortSelect").change(function() {
            me.sortBySelect();
        });

        $("#btnMoreOption").toggle(function () {
            $(".tools").animate({height: "60px"}, 100);
            $("#proPanel").slideDown(100);
        }, function () {
            $(".tools").animate({height: "30px"}, 100);
            $("#proPanel").slideUp(100);
        });

        // 导出
        $("#btnOutputTextShow").click(function() {
            me.output();
            $("#outputTextPanel").show();
        });

        $("#btnOutputTextClose").click(function() {
            $("#outputTextPanel").hide();
        });

        $("#outputTextFormat").keyup(function() {
            G_CONFIG.setOutputTextFormat($("#outputTextFormat").val());
            me.output();
        });

        $("#renameRule").keyup(function() {
            G_CONFIG.setRenameRule($("#renameRule").val());
        });


    },
    inverseSelect: function() {
        var me = this;
        $("#list>li").each(function(i, item) {
            var itemObj = $(item);
            var visible = itemObj.hasClass("delimg");
            me.setImageVisible(itemObj, visible);
        });
    },
    filter: function(config) {
        var me = this;
        
        me.reset();
        me.addImgList(me.allImgList, true);

        // $("#list>li").each(function(i, item) {
            // var itemObj = $(item);
            // var src = itemObj.find(".aimg").attr("data-src");
            // var data_wh = itemObj.find(".aimg").attr('data-wh').split('x');
            // var width = parseInt(data_wh[0]); // 图片宽度
            // var height = parseInt(data_wh[1]); // 图片高度
            // var min_width = config.min_width;
            // var min_height = config.min_height;
            // var visible = me.checkFilter({width: width, height: height, src: src, min_width: min_width, min_height: min_height});
            // me.setImageVisible(itemObj, visible);
        // });



    },
    setImageVisible: function(li, visible) {
        var img=li.find("img.aimg");
        if (visible && li.hasClass("delimg")) {
            li.removeClass('delimg');
            img.attr("src",img.attr("data-src"));
        } else if (!visible && !li.hasClass("delimg")) {
            li.addClass('delimg');
            var src=img.attr("src");
            var bgSize=img.width()+"px "+img.height()+"px";
            img.attr("src","")
            .css({"background-image":"url("+src+")","background-repeat":"no-repeat","background-size":bgSize});
        }
        this.showNum();
    },
    sortBySelect: function() {
        var me = this;
        var val = $("#sortSelect").val().split(";");
        me.sort(val[0], val[1]);
    },
    sort: function(attr, dir) {
        $("#list>li").tsort('.aimg',{attr: attr, order: dir});
    },
    share: function(config) {
        // 新浪微博分享
        var temp = [];
        for ( var p in config) {
            temp.push(p + '=' + encodeURIComponent(config[p] || ''));
        }
        window.open("http://service.weibo.com/share/share.php?"
                + temp.join("&"), "_blank",
                "width=615,height=405");
    },
    showNum: function() {
        // 显示有多少张图片
        var me = this;
        var show_img = $("#list li:not(.delimg)").size();
        var total_img = this.allImgList.length;
        var str = MSG("process_show_start","") + show_img + "/" + total_img + MSG("process_end","图");
        var unknownImgNum = this.queneEnginer.processLeftNum;
        if (unknownImgNum > 0) {
            me.beforeLoad();
            str += ", " + unknownImgNum + MSG("process_unknow_image","图正在获取大小");
        } else {
            me.afterLoad();
        }
        $("#imgnum").html(str);

        // 进度条
        // var main_progress = $("#main_progress");
        // var progressval = parseInt(main_progress.attr('max')) -
        // unknownImgNum;
        // if (!isNaN(progressval)) {
        // main_progress.attr('value', progressval);
        // }

    },
    beforeLoad: function () {
        $("#loadding").show();
    },
    afterLoad: function () { //图片全部显示后促发
        $("#loadding").hide();
        this.sortBySelect();
    },
    view: function() {
        // 切换视图
        var list = $('#list');
        var class_name = 'theme_view';
        var hasClass = list.hasClass(class_name);
        if (hasClass) {
            list.removeClass(class_name);
            this.imgCenter($("#list .aimg"));
        } else {
            list.addClass(class_name);
            $.each($('#list .aimg'), function(i, item) {
                item.style.height = 'auto';
                item.style.width = 'auto';
                item.style.left = 0;
                item.style.top = 0;
            });
        }
    },
    resizeImage: function() {
        this.imgCenter($("#list .aimg:not(.resize)"));
    },
    imgCenter: function(obj) {
        obj.each(function() {
            var $this = $(this);
            var data_wh = $this.attr('data-wh').split('x');
            var width = parseInt(data_wh[0]); // 图片宽度
            var height = parseInt(data_wh[1]); // 图片高度
            if (width * height > 0) {
                var parentHeight = $this.parent().height(); // 图片父容器高度
                var parentWidth = $this.parent().width(); // 图片父容器宽度
                var ratio = height / width;
                if (height > parentHeight && width > parentWidth) {
                    if (height > width) { // 赋值宽高
                        width = parentWidth;
                        height = parentWidth * ratio;
                        $(this).css("top", (parentHeight - height) / 2);
                    } else {
                        width = parentHeight / ratio;
                        height = parentHeight;
                        $(this).css("left", (parentWidth - width) / 2);
                    }
                    $this.width(width);
                    $this.height(height);
                } else { // 当图片宽高小于父容器宽高
                    if (width > parentWidth) { // 当图片宽大于容器宽，小于时利用csstext-align属性居中
                        $(this).css("left", (parentWidth - width) / 2);
                    }
                    $(this).css("top", (parentHeight - height) / 2);
                }
                $(this).addClass("resize");
            }
        });
    },
    getFilename: function(url, index, radioRename, renameRule) { //获取文件名
        var me = this;

        var pos = url.lastIndexOf("/");
        var ret = url.substr(pos+1,url.length);
        pos = ret.lastIndexOf("?");
        if (pos >= 0) {
            ret = ret.substr(0, pos);
        }
        if (radioRename == '1') {

        } else if (radioRename == '2') { //重命名
            pos = ret.lastIndexOf(".");

            var ext = 'jpg';
            var name = '';
            if (pos >= 0) {
                ext = ret.substr(pos + 1, ret.length);
            }
            name = ret.substring(0, ret.lastIndexOf(".") || ret.length);

            ret = me.replaceVarible({text: renameRule, index: index, ext: ext, name: name});

        }

        if (ret.lastIndexOf(".") < 0) {
            ret = ret + ".jpg"; //如果没有扩展名，补上一个
        }

        return ret;
    },
    save: function() {
        var me = this;

        if (localStorage.notFirstUseSave == "1") {
            me.saveDirect();
        } else {
            $("#saveHelp").show();
        }
        
    },
    saveDirect: function() {
        var me = this;
        if ($("#cbSaveHelp").attr("checked")) {
            localStorage.notFirstUseSave = "1";
        }

        var radioRename = $("#renamePanel input[name='radioRename']:checked").val();
        var renameRule = $("#renameRule").val();
        G_CONFIG.setRenameMode(radioRename);

        $("#list li:not(.delimg) .aimg").each(function(i, item) {
            me.saveAs(item.src, me.getFilename(item.src, i, radioRename, renameRule));
        });
    },
	getSafeDir: function(str) {
		return str.replace(/[|\\-\\/:*?"'<>=%$@#+-;,!\^]/g, '_');
	},
    saveAs: function(url, filename) {
        if (chrome.downloads != null) {
            var dir = document.title;
			
            var full_filepath = this.getSafeDir(dir) + "/" + filename;

			console.log('full_filepath', full_filepath);
			
            chrome.downloads.download({url: url, filename: full_filepath, saveAs: false, conflictAction: 'uniquify'}, function(downloadId) {
                console.log('downloadId', downloadId, url);
            });
        } else {
            var save_link = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
            save_link.href = url;
            save_link.download = filename;
            save_link.click();
        }
    },
    replaceVarible: function(config) {
        var text = config.text;

        if (config.name != null) {
            text = text.replace(/\{NAME\}/g, config.name);
        }

        if (config.ext != null) {
            text = text.replace(/\{EXT\}/g, config.ext);
        }

        if (config.link != null) {
            text = text.replace(/\{LINK\}/g, config.link);
        }

        if (config.index != null) {
            text = text.replace(/\{NO\}/g, config.index);
            // {NO001}处理
            var match = text.match(/\{NO([\d]+)\}/);
            if (match) {
                var num = match[1];
                var numlen = num.length;
                var newIndex = config.index + 1;
				if ((""+ (config.index + 1)).length < numlen) {
					newIndex = ("000000000000000000000000000000" + (config.index + 1)).substr(-numlen);
				}
                text = text.replace(/\{NO([\d]+)\}/g, newIndex);
            }
        }

        return text;
    },
    output: function() {
        var format = $("#outputTextFormat").val();
        var tmpList = [];
        var me = this;
        $("#list li:not(.delimg) .aimg").each(function(index, item) {
            var link = item.src;
            var tmpText = me.replaceVarible({text: format, index: index, link: link});
            tmpList.push(tmpText);
        });

        $("#outputTextArea").val(tmpList.join('\n'));
    }
};

var QueneEnginer = function() {
    this.Quene = [];
};

QueneEnginer.prototype = {
    outputManager: null,
    processTime: 100,
    loadNum: 0,
    processLeftNum: 0, // 剩余多少图片
    maxDownloadNum: 5,
    add: function(item) {
        this.processLeftNum++;
        this.Quene.push(item);
    },
    start: function() {
        var me = this;
        setTimeout(function() {
            me.process();
        }, me.processTime);
    },
    process: function() {
        var me = this;
        if (this.Quene.length > 0) {
            while (this.loadNum < this.maxDownloadNum) { // 如果有空位，就加载图片吧
                var item = this.Quene.shift(); // 从数组取一个出来吧
                if (item == null) {
                    break;
                }
                this.loadNum++;// 标记一下，我要开始下载咯

                this.loadPic(item, function(response) {
                    me.loadNum--; // 加载完图片记得减一哦
                    me.processLeftNum--;
                    if (response.success) {
                        var item = response.item;
                        // imgList[item.index].width = item.width;
                        // imgList[item.index].height = item.height;
                        me.outputManager.addToList({
                            item: item
                        });
                    } else {
                        // 失败
                    }
                    me.outputManager.showNum();
                });
            }
        }
        this.start(); // 这里是重点，利用了setTimeout，不断的循环
    },
    loadPic: function(item, callback) { // 加载图片，实现callback为了回调计数
        var img = new Image();
        img.onload = function() {
            var width = parseInt(this.naturalWidth);
            var height = parseInt(this.naturalHeight);
            // 设置正确高宽度
            item.width = width;
            item.height = height;
            callback({
                success: true,
                item: item
            });
        };

        img.onerror = function() {
            console.log('onerror', this.src);
            item.width = 1;
            item.height = 1;
            callback({
                success: false,
                item: item
            });
        };

        img.src = item.src;
    }
};

$(function() {
    var outputManger = new OutputManger();
    outputManger.init();

    function myOnMessage(request, sender, sendResponse) {
        if (request.cmd == 'ADD_PIC') {
            outputManger.addImgList(request.imgList);
        }
    }


    var reciver = chrome.extension.onMessage;
    if (reciver  == undefined) {
        reciver = chrome.extension.onRequest;
    }

    reciver.addListener(function(request, sender,
            sendResponse) {
        myOnMessage(request, sender, sendResponse);
    });
});
