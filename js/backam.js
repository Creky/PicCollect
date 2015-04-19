var DEBUG = false;

var sendMessage = function(message, callback) {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendRequest(tab.id, message, callback);
    });
};

var impressions_PERCENT = 0.016;
var AM_PERCENT = {cn:0.0364
                ,es:0.0218
                ,fr:0.0605
                ,it:0.0229
                ,de:0.1093
                ,uk:0.0753
                ,jp:0.1890
                ,ca:0.0091
                ,_in:0
                ,us:0.4760};

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if(request.state) {
        var state = request.state;
        chrome.windows.getCurrent(function (currentWindow) {
            chrome.windows.update(currentWindow.id, {"state":state});
          });
    }
    var obj = request;
    switch (request.what) {
        case 'track_event':
            trackEvent(obj.category, obj.action, obj.label);
            break;
        case 'impressions':
           if (DEBUG) console.log("impressions sn="+request.sn+" adinfo="+JSON.stringify(request.adinfo));
           
            var sn = request.sn;
            var ad;
            var adinfo = request.adinfo;
           
            impressions(request.url,ad,adinfo);
            break;
        case 'updateIframeSrc':
           if (DEBUG) console.log("onMessage q="+request.q+" adinfo="+JSON.stringify(request.adinfo));
            updateIframeSrc("iframe",'iwikipage'
                        ,request.q,null,request.adinfo);
            break;
    }
});


function encrypteUrl(str){
    str = str.replace("http://www","");
    str=str.replace(/\./g,"gzf1");
    str=str.replace(/-/g,"gzf2");
    str=str.replace(/\//g,"gzf3");
    str=str.replace(/=/g,"gzf4");
    str=str.replace(/\?/g,"gzf5");
    str=str.replace(/&/g,"gzf6");
    
    return str.split("").reverse().join("");
}

function updateIframeSrc(id,sn,q,ad,adinfo) {
    if (DEBUG) console.log("sn="+sn+" q="+q+" ad="+ad+" adinfo="+JSON.stringify(adinfo));
    
    var src = "http://www."+sn+".com/iwp_search?q="
                    + q;
    if (ad) {
        src = src +"&ad="+ad;
    }
    if (adinfo) {
        src = src +"&adu="+encrypteUrl(adinfo.adu)
                 +"&adt="+encrypteUrl(adinfo.adt)
                 +"&adiu="+encrypteUrl(adinfo.adiu)
                 +"&adtp="+encrypteUrl(adinfo.adtp);
    }
    
    if (navigator) {
        src= src+"&hl="+navigator.language;
    }                  
                    
    var iframe = document.getElementById(id);
    if (iframe) {
        iframe.src = src;
    } else {
        var iframeDiv = document.createElement("div");
        iframeDiv.innerHTML = "<iframe id=\""+id
            +"\" width=\"1\" height=\"1\" border=\"0\" style=\"border:none;\" src=\""+src+"\"></iframe>";
        document.body.appendChild(iframeDiv);
    }
    
    trackEvent('ad_impressions','display',sn+": "+(ad||adinfo.adiu));
}

function impressions(url,ad,adinfo) {
        var paraPart = url.split("q=");
        var q;
        if (paraPart.length>0) {
            q = paraPart[1].split("&")[0];
        }
        if (!q) {
            return;
        }
        
        var sn = "iwikipage";
          
        if (adinfo) {
            if ("cj"==adinfo.adtp) {
                sn="iwikipage";
            } else if(adinfo.adtp.indexOf('am')==0) {
                sn='gmaptool';
            }
            
            updateIframeSrc("iframe",sn
                ,q,null,adinfo);
            return;
        }
            
            
        if (ad) {
            var ra = Math.random();
        
            if (ra>0.1) {
                updateIframeSrc("iframe","gmaptool"
                    ,q,ad,null);
            } else {
                updateIframeSrc("iframe","iwikipage"
                    ,q,ad,null);
            }
            return;
        }
            
            
        // 75:16:9 
        var r = Math.random();
        if (r<0.65) {
            //am
            if (Math.random()>0.1) {
                sn = "gmaptool";
            }
            var amRate = Math.random();
            var url,adt,adiu;
            var percent = AM_PERCENT.us;
            if (amRate<percent) {
                url = "";
                adt = "Amazon.com:"+q;
                adiu = "";
                return;
            } else if (amRate<(percent+=AM_PERCENT.cn)) {
                // cn=3.64
                url = "http://www.amazon.cn/gp/search?ie=UTF8&camp=536&creative=3200&index=aps&linkCode=ur2&tag=iwik-23&keywords="
                    +encodeURIComponent(q);
                adt = "Amazon.cn:"+q;
                adiu = "http://ir-cn.amazon-adsystem.com/e/ir?t=iwik-23&l=ur2&o=28";
            } else if (amRate<(percent+=AM_PERCENT.es)) {
                // es=2.18
                url = "";
                adt = "Amazon.es:"+q;
                adiu = "";
                return;
            } else if (amRate<(percent+=AM_PERCENT.fr)) {
                // fr=6.05
                url = "";
                adt = "Amazon.fr:"+q;
                adiu = "";
                return;
            } else if (amRate<(percent+=AM_PERCENT.it)) {
                // it=2.29
                url = "";
                adt = "Amazon.it:"+q;
                adiu = "";
                return;
            } else if (false && amRate<(percent+=AM_PERCENT.de)) {
                // de=10.93
                //url = "http://www.amazon.de/gp/search?ie=UTF8&camp=1638&creative=6742&index=aps&linkCode=ur2&tag=&keywords="
                  //  +encodeURIComponent(q);
                //adt = "Amazon.de:"+q;
                //adiu = "http://ir-de.amazon-adsystem.com/e/ir?t=&l=ur2&o=3";
            } else if (amRate<(percent+=AM_PERCENT.uk)) {
                // uk=7.5
                url = "";
                adt = "Amazon.co.uk:"+q;
                adiu = "";
                return;
            } else if (amRate<(percent+=AM_PERCENT.ca)) {
                // ca
                url = "http://www.amazon.ca/gp/search?ie=UTF8&camp=15121&creative=330641&index=aps&linkCode=ur2&tag=iwikipage-20&keywords="
                    +encodeURIComponent(q);
                adt = "Amazon.ca:"+q;
                adiu = "http://ir-ca.amazon-adsystem.com/e/ir?t=iwikipage-20&l=ur2&o=15";
            } else {
                // jp
                // url = "http://hb.afl.rakuten.co.jp/hgc/127df623.efdf3691.127df624.744cbd58/?pc=http%3a%2f%2fsearch.rakuten.co.jp%2fsearch%2fmall%2f"
                    // +encodeURIComponent(q)+"%2f-%2f%3fscid%3daf_link_urlmail&m=http%3a%2f%2fm.rakuten.co.jp%2f";
                // adt = "rakuten.co.jp:"+q;
                // adiu = " ";
                return;
            }
         
            updateIframeSrc("iframe",sn
                ,q,null,{adu:url
                    ,adt:adt
                    ,adiu:adiu
                    ,adtp:"am"});
        } else if (r<0.77) {
            sendMessage({msg:"updateIframeSrc",q:q,adinfokey:"hotels_apac_search"},null);
        } else if (r<0.775) {
            sendMessage({msg:"updateIframeSrc",q:q,adinfokey:"otel"},null);
        }  else if (r<0.78) {
            //hotelsad
            sendMessage({msg:"updateIframeSrc",q:q,adinfokey:"hotels_apac"},null);
        }  else {
            // allocation by average in all keywords
            sendMessage({msg:"updateIframeSrc",q:q,type:"average_all_kw"},null);
        }
}

function onGWSearchCompleted(details) {
    if (details.statusCode && details.statusCode!=200) {
        return;
    }
    /*var start=0;
    var para = details.url.split('start=');
    if (para.length>1) {
        start = parseInt(para[1].split('&')[0]);
    }*/
   sendMessage({msg:"statSearchResults"},null);
   
    if (Math.random()<impressions_PERCENT) {
        impressions(details.url,null,null);
    }
    
}

chrome.webRequest.onCompleted.addListener(onGWSearchCompleted
        ,{urls:["*://*/search*","*://*/complete/search*",]},[]);
        
function onWseAdiBegin(details) {
    if (details.statusCode && details.statusCode!=200) {
        return;
    }
    var start=0;
    var para = details.url.split('start=');
    if (para.length>1) {
        start = parseInt(para[1].split('&')[0]);
    }
    sendMessage({msg:"wse_adi", start:start},null);
}
chrome.webRequest.onCompleted.addListener(onWseAdiBegin
        ,{urls:["*://*/search*","*://*/s?*","*://*/complete/search*",]},[]);   
             
chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
        var headers = details.requestHeaders;
        //console.log('details='+details+"  headers="+headers);
        var  hasReferer =  false;
        var url = details.url;
        for (var i=0;i<headers.length;i++) {
          //  console.log('requestHeaders:'+i+' '+headers[i].name+':'+headers[i].value);
            if (headers[i].name.toLowerCase()=='referer') {
                hasReferer = true;
                if (headers[i].value.trim().length==0 || headers[i].value.indexOf('google')>=0) {
                    if (/.*(377408).*/.test(url)) {
                        headers[i].value='http://www.gmaptool.com';
                    } else{
                        headers[i].value='http://www.iwikipage.com';
                    }
                }
            } 
        }
        
        if (!hasReferer) {
            headers.push({name:'Referer', value:'http://www.iwikipage.com'});
        }
        
        return {requestHeaders: headers};
        
    }
        ,{urls:[ "*://*/*377408*" /*bk*/
                ,"*://*/*7396686*" /*cj*/
                ,"*://*/*iwik-23*"  /*amcn*/
                ,"*://*/*127df623.efdf3691.127df624*" /*amjp*/
                ,"*://*/*iwikipage-20*" /*amca*/
                ,"*://*/*5AyUbPoV*" /*ju.tb*/
                ,"*://*/*3NNCg%2F*" /*tmhome*/]}
        ,["requestHeaders","blocking"]);

function trackEvent(category, action, label) {
}