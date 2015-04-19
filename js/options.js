// Saves options to localStorage.

var myFixedName = "Fatkun图片批量下载";
var optionOp = {
    bind: function() {
        var me = this;
        $('#btnSave').click(function() {
            me.save_options();
        });

        $("#btnRuleUpdate").click(function() {
            me.updateRule();
        });

        $("#btnAddUserRule").click(function() {
            me.addUserRule('', '', '');
        });

        $("#btnImportUserRule").click(function() {
            //导入
        });

        $("#user_rule_wrap .btn_del").live('click', function() {
            var thiz = $(this).parent().parent();
            thiz.remove();
        });

        $("#user_rule_wrap .btn_test").live('click', function() {
            var thiz = $(this).parent().parent();
            me.testUserRule(thiz);
        });

        window.addEventListener('message', function(event) {
          if (event.data.ret != null) {
            var url = event.data.ret;
            window.open(url);
          }
        });
    },
    testUserRule: function(thiz) {
        var rule = this.getUserRuleByHtml(thiz);
        if (this.vaildateUserRule(rule)) {
            var thumb_url = prompt("缩略图的网址","");
            if (thumb_url) {
                var srcPattern = new RegExp(rule.srcPattern);
                var replaceRule = rule.replaceRule;
                if (srcPattern && srcPattern.test(thumb_url)) {
                    var iframe = document.getElementById('sandboxFrame');
                    var message = {
                        command: 'eval',
                        content: replaceRule.replace(/@/g, thumb_url)
                    };
                    iframe.contentWindow.postMessage(message, '*');
                } else {
                    alert('图片链接匹配不正确');
                }
            }
        } else {
            alert('请先填写完整');
        }
    },
    updateRule: function() {
        $("#ruleUpdateInfo").text("更新中...");
        var me = this;
        G_CONFIG.updateCommonRule({
            callback: function() {
                me.showRuleInfo();
            }
        });
    },
    save_options: function() {
        localStorage["min_width"] = document.getElementById("min_width").value;
        localStorage["min_height"] = document.getElementById("min_height").value;

        var useTitle = $("#useTitle").attr("checked");
        var useFixedName = $("#useFixedName").attr("checked");

        if (useTitle) {
            localStorage.savePathType = "useTitle";
        } else if (useFixedName) {
            localStorage.savePathType = "useFixedName";
        }
        if ($("#pathName").val() == "")
            $("#pathName").val(myFixedName);
        localStorage.fixedName = $("#pathName").val();

        localStorage.showUrl = $("#showUrl").attr("checked") ? "1" : "0";
        localStorage.useHotkey = $("#useHotkey").attr("checked") ? "1" : "0";
        localStorage.oneOutput = $("#oneOutput").attr("checked") ? "1" : "0";

        this.saveUserRule();

        // Update status to let user know options were saved.
        var status = document.getElementById("status");
        status.style.display = "block";
        status.innerHTML = MSG("settings_already_save", "设置已经保存了！");
        setTimeout(function() {
            status.innerHTML = "";
            status.style.display = "none";

        }, 2000);
    },
    // Restores select box state to saved value from localStorage.
    restore_options: function() {
        $("#min_width").val(parseInt(localStorage["min_width"] || 0));
        $("#min_height").val(parseInt(localStorage["min_height"] || 0));

        $("#" + localStorage.savePathType).attr("checked", "checked");
        if (localStorage.showUrl == "1" || localStorage.showUrl == undefined) {
            $("#showUrl").attr("checked", "checked");
        }

        if (localStorage.useHotkey == "1" || localStorage.useHotkey == undefined) {
            $("#useHotkey").attr("checked", "checked");
        }

        if (localStorage.oneOutput == "1" || localStorage.oneOutput == undefined) {
            $('#oneOutput').attr("checked", "checked");
        }

        if (localStorage.fixedName == undefined || localStorage.fixedName == "") {
            $("#pathName").val(myFixedName);
        } else {
            $("#pathName").val(localStorage.fixedName);
        }
        this.showRuleInfo();
        this.showUserRuleInfo();
    },
    showRuleInfo: function() {
        // 公共规则
        var bigImageList = $('#bigImageList');
        bigImageList.html('');
        $.each(G_CONFIG.getCommonRules(), function(i, item) {
            bigImageList.append('<span title="图片替换代码：'+ item.replaceRule+'">'+item.site+'</span>');
            bigImageList.append(', ');
        });

        try{
            $("#ruleUpdateInfo").text(MSG("settings_rule_last_update_time", "最后更新时间：") 
                + (localStorage.ruleLastUpdateTime == undefined? MSG("settings_rule_last_update_time_none", "无") : new Date(localStorage.ruleLastUpdateTime).toLocaleString()));
        } catch (err) {
            console.log('ruleUpdateInfo err', err);
        }
    }, 
    showUserRuleInfo: function() {
        var me = this;
        // 用户规则
        $("#user_rule_wrap tbody").html("");
        var rules = G_CONFIG.getUserRules();
        if (rules.length == 0) {
            $("#user_rule_wrap tbody").html("无用户规则");
        }
        $.each(rules, function(i, item) {
            me.addUserRule(item.site, item.srcPattern, item.replaceRule);
        });
    },
    addUserRule: function(site, srcPattern, replaceRule) {
        var dataStart = "<tr>";
        var dataEnd = "</tr>";
        var dataBody = "<td><textarea placeholder='名称'>" + site + "</textarea></td>";
        dataBody += "<td><textarea placeholder='图片链接匹配'>" + srcPattern + "</textarea></td>";
        dataBody += "<td><textarea placeholder=\"@代表图片链接，用'@'.replace('a','b')替换\">" + replaceRule + "</textarea></td>";
        dataBody += "<td class='text_center'><span class=\"link_btn btn_test\">测试</span> <span class=\"link_btn btn_export hidden\">导出</span> <span class=\"link_btn btn_del\">删除</span></td>";
        var content = dataStart + dataBody + dataEnd;
        $("#user_rule_wrap tbody").append(content);
    },
    getUserRuleByHtml: function(item) {
        var textareas = $(item).find("textarea");
        var site = this.escapeRule($(textareas[0]).val().trim());
        var srcPattern = this.escapeRule($(textareas[1]).val().trim());
        var replaceRule = this.escapeRule($(textareas[2]).val().trim());
        return {site: site, srcPattern: srcPattern, replaceRule: replaceRule};
    },
    vaildateUserRule: function(rule) {
        if (rule.site != '' && rule.srcPattern != '' && rule.replaceRule != '') {
            return true;
        }
        return false;
    },
    saveUserRule: function() {
        var rules = [];
        var me = this;
        $("#user_rule_wrap tbody").find('tr').each(function(i, item) {
            var rule = me.getUserRuleByHtml(item);
            if (me.vaildateUserRule(rule)) {
                rules.push(rule);
            }
        });

        G_CONFIG.saveUserRule(rules);
        me.showUserRuleInfo();
        console.log('user_rules', rules);
    },
    escapeRule: function(value) {
        return value;
    },
    unescapeRule: function(value) {
        return value;
    }
};


$(function() {

    optionOp.restore_options();
    optionOp.bind();

});
