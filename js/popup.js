// 临时使用
var chromeSender = chrome.extension.sendMessage;
if (typeof chromeSender != 'function') {
    chromeSender = chrome.extension.sendRequest;
}    


$('#btnGetCurrentTab').click(function() {
    chromeSender({"cmd": "GET_CURRENT_TAB_IMAGE"});
});

$('#btnGetAllTab').click(function() {
    chromeSender({"cmd": "GET_ALL_TAB_IMAGE"});
});

$('#btnOpenPage').click(function() {
	var pageUrls = $("#textPage").val().split("\n");
	localStorage.pageUrls = $("#textPage").val();
	chromeSender({"cmd": "OPEN_PAGE", pageUrls: pageUrls});
});

$(function() {
	$("#textPage").val(localStorage.pageUrls);
});