// $.ajaxSetup({
//     contentType: "application/x-www-form-urlencoded; charset=utf-8"
// });

function MSG(msg,str) {return chrome.i18n.getMessage(msg, str)};

$(function() {
    //i18n
    
    $("span[data-msg],option[data-msg]").each(function(i, item) {
        var msgId = $(item).attr("data-msg");
        var text = MSG(msgId);
        if (text) $(item).html(text);
    });

    $("input:button[data-msg],input:radio[data-msg]").each(function(i, item) {
        var msgId = $(item).attr("data-msg");
        var text = MSG(msgId);
        if (text) $(item).val(text);
    });

    $("[data-msg][data-msg-attr]").each(function(i, item) {
        var msgId = $(item).attr("data-msg");
        var attr = $(item).attr("data-msg-attr");
        $(item).attr(attr, MSG(msgId));
    });

    // 所有有title的
    $("[data-msg-title]").each(function(i, item) {
    	var msgId = $(item).attr("data-msg-title");
    	$(item).attr("title", MSG(msgId));
    });
    
});

function removeGA() {
    
}

var G_CONFIG = {
    commonRuleUrl: function(){
        return chrome.extension.getURL("rules.json");
        //return "http://bath-image-download.googlecode.com/files/rules.json";
    }(),
    getRules: function() {
        var userRules = this.getUserRules();
        var commonRules = this.getCommonRules();
        return $.merge(userRules, commonRules);        

    },
    getCommonRules: function() {
        var rules = [];
        if (localStorage.commonRules != undefined && localStorage.commonRules != '') {
            try {
                commonRules = JSON.parse(localStorage.commonRules);
                $(commonRules).each(function(i, rule) {
                    rules.push(rule);
                });
            } catch (error) {
                console.log('parse CommonRule error!!', error);
            }
        }
        console.log('rules', rules);
        return rules;
    },
    getUserRules: function() {
        var rules = [];
        if (localStorage.userRules == undefined) {
            localStorage.userRules == '[]';
        }

        try {
            userRules = JSON.parse(localStorage.userRules);
            $(userRules).each(function(i, rule) {
                rules.push(rule);
            });
        } catch (error) {
            console.log('parse UserRule error!!', error);
        }

        return rules;
    },
    saveUserRule: function(rules) {
        var rulesStr = JSON.stringify(rules, null, null);
        localStorage.userRules = rulesStr;
    },
    updateCommonRule: function(config) {
        $.get(this.commonRuleUrl + '?rnd=' + Math.random(), function(data) {
            console.log('updateCommonRule', data);
            try {
                config = config || {};
                JSON.parse(data);// 测试
                localStorage.commonRules = data;
                localStorage.ruleLastUpdateTime = new Date();
                if (typeof config.callback == 'function') {
                    config.callback(data);
                }
            } catch (error) {
                console.log('updateCommonRule error!!', error);
            }
        });
    },
    setOutputTextFormat: function(format) {
        localStorage.outputTextFormat = format;
    },
    getOutputTextFormat: function() {
        return localStorage.outputTextFormat || '<img src="{LINK}"/>';
    },
    setRenameRule: function(format) {
        localStorage.renameRule = format;
    },
    getRenameRule: function() {
        return localStorage.renameRule || 'pic_{NO001}.{EXT}';
    },
    setRenameMode: function(mode) {
        localStorage.renameMode = mode;
    },
    getRenameMode: function() {
        return localStorage.renameMode || '1';
    }
};
