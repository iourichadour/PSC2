// ==UserScript==
// @name Content Script
// @exclude     http*://*.paypal.com/*
// @include https://ssl.google-analytics.com/*
// @include http*://*/psc/*
// @include http*://*/psp/*tab*
// @include http*://*/psp/*
// @include http*://*.pschrome.com/chrome/PSChrome/logs.htm
// @include http://www.google-analytics.com/*
// @include https://www.google-analytics.com/*
// @require jquery-1.11.2.min.js
// @require monitor.full.1.0.0.js
// @run-at document-end
// @all-frames true
// ==/UserScript==
//	User Script Required for content script

/**	TODO:
2014.10.30	Replace setTimeout( (), 20 ) for the Chrome Auth Domain fix with a callback upon request and not just a constant wait cycle
2014.10.31  Add tab on options about help.  LInk to screen recording, turn on debug, etc.
			https://chrome.google.com/webstore/detail/screencastify-screen-vide/mmeijimgabbpbgpdklnllpncmdofkcpn?hl=en
**/

function simulate(element, eventName)
{
    var options = extend(defaultOptions, arguments[2] || {});
    var oEvent, eventType = null;

    for (var name in eventMatchers)
    {
        if (eventMatchers[name].test(eventName)) { eventType = name; break; }
    }

    if (!eventType)
        throw new SyntaxError('Only HTMLEvents and MouseEvents interfaces are supported');

    if (document.createEvent)
    {
        oEvent = document.createEvent(eventType);
        if (eventType == 'HTMLEvents')
        {
            oEvent.initEvent(eventName, options.bubbles, options.cancelable);
        }
        else
        {
            oEvent.initMouseEvent(eventName, options.bubbles, options.cancelable, document.defaultView,
            options.button, options.pointerX, options.pointerY, options.pointerX, options.pointerY,
            options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, element);
        }
        element.dispatchEvent(oEvent);
    }
    else
    {
        options.clientX = options.pointerX;
        options.clientY = options.pointerY;
        var evt = document.createEventObject();
        oEvent = extend(evt, options);
        element.fireEvent('on' + eventName, oEvent);
    }
    return element;
}

function extend(destination, source) {
    for (var property in source)
      destination[property] = source[property];
    return destination;
}

var eventMatchers = {
    'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
    'MouseEvents': /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/
}
var defaultOptions = {
    pointerX: 0,
    pointerY: 0,
    button: 0,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    bubbles: true,
    cancelable: true
}


var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-405173-30']);


/** Only load if needing to do an update    **/
function initGoogle()
{
    (function() {
      var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
      ga.src = 'https://ssl.google-analytics.com/ga.js';
      var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
    })();
}

//Element.prototype.getWidth = function(){if (typeof this.clip !== "undefined") {return this.clip.width;} else {if (this.style.pixelWidth) {return this.style.pixelWidth;} else {return this.offsetWidth;}}};
function sort( obj ){var sorter = [];var sorterAlpha = [];var newObj = {};for( o in obj ){if( sorter.length > 0 ){for( s = 0; s < sorter.length; s++ ){if( sorter[s] && obj[o] )if( !(sorter[s].toString().toLowerCase() < obj[o].toString().toLowerCase()) )break;}sorter.splice( s, 0, obj[o] );sorterAlpha.splice( s, 0, o );} else {sorter.splice( 0, 0, obj[o] );sorterAlpha.splice( 0, 0, o );}}for( s = 0; s < sorterAlpha.length; s++ )newObj[sorterAlpha[s]] = sorter[s];return newObj;}
window.performance = window.performance || {};
performance.now = (function() {
  return performance.now       ||
         performance.mozNow    ||
         performance.msNow     ||
         performance.oNow      ||
         performance.webkitNow ||
         function() { return new Date().getTime(); };
})();

var debugEnabled;
var PSChrome = function()
{
    var self = this;
    PSChrome.iconBase = 'https://www.pschrome.com/chrome/PSChrome2/icons/';
    PSChrome.envURLListID = 'envURLList';
    PSChrome.procMonRefreshEnabled = 'setting_proc_mon_refresh_enabled';
    PSChrome.procMonRefreshTime = 'setting_proc_mon_refresh_time';
    PSChrome.procMonRefreshStatuses = 'setting_proc_mon_refesh_statuses';
    
    PSChrome.process_update = 'process_update';
    PSChrome.debugEnabled = 'debug_enabled';
    PSChrome.globalFavorites = 'global_favorites';
    PSChrome.globalFavoritesTemp = 'global_favorites_temp';
    PSChrome.noTimeoutID = 'no_timeout_enabled';
    PSChrome.correctHistoryDef = 'correct_history_def';
    PSChrome.advancedSearchDef = 'advanced_search_def';
    PSChrome.optionsPageChange = 'optionsPageChange';
    PSChrome.envPSChromeAppPackageID = 'PSChromeEnabled';
    PSChrome.envPSChromeAppPackageIDResponse = 'PSChromeEnabled_Response';
    PSChrome.envPSChromeAppPackageIDIBEnabled = 'PSChromeEnabled_IBEnabled';
    PSChrome.showPopupNotification = 'popupNotificationShown';
    PSChrome.def = {
        debugEnabled: false
        ,proc_mon_refresh_enabled: true
        ,proc_mon_refresh_time: 30
        ,proc_mon_refresh_min: 10
        ,weblibTimer: 1
        ,weblibTimerRetry: 5
        ,procMonAutoRefresh: [18,1,6,10,16,7,5,19,99]
        ,correct_history_def: false
        ,advanced_search_def: false
    };
    
    PSChrome.statusList = {
             18: 'Blocked'
            , 1: 'Cancel'
            , 8: 'Cancelled'
            , 3: 'Error'
            , 4: 'Hold'
            , 6: 'Initiated'
            ,10: 'No Success'
            ,16: 'Pending'
            , 7: 'Processing'
            , 5: 'Queued'
            ,19: 'Restart'
            , 9: 'Success'
            ,17: 'Warning'
            ,99: 'Unposted' //  Custom Setting    
        };
    
    self.type = '';
        
     debugEnabled = PSChrome.def.debugEnabled;
        
    if( document.location.toString().match('background.html$') ){self.type = 'background';self.initBackground();}
    else{
        PSChrome.storage.getItem( PSChrome.debugEnabled, function(data)
        {
            if( data.data )
                debugEnabled = data.data == true ? true : false;
            if( document.location.toString().match('popup.html$') ){self.type = 'popup';self.initPopup();} 
            else if( document.location.toString().split("#")[0].split("?")[0].match('options.html$') ){self.type = 'options';self.initOptions();} 
            else {self.type = 'content';self.initContent();}
        });
    }

    
    this.changes = {
        '2.0.x':  [
            'Process Monitor Quicklinks', 'Process Monitor Auto-Refresh'
        ]
		,'2.4.13': [
			'Chrome Nesting Navigation Bug' 
		]
    };
};

PSChrome.ENVUpdateItem = function( envID, setting, value ){var ENVList = kango.storage.getItem( PSChrome.envURLListID );ENVList[envID][setting] = value;kango.storage.setItem( PSChrome.envURLListID, ENVList );}
PSChrome.ENVGetItem = function( envID, setting ){return kango.storage.getItem( PSChrome.envURLListID )[envID][setting];}
PSChrome.ENVGetEnv = function( envID, setting ){return kango.storage.getItem( PSChrome.envURLListID )[envID];}

PSChrome.env = {};
PSChrome.env.removeItem = function( url, name ){kango.dispatchMessage( 'envRemoveItem', {'url':url, 'name':name} );};
PSChrome.env.setItem = function( url, name, value ){kango.dispatchMessage( 'envSetItem', {'url':url, 'name':name, 'value':value} );};
PSChrome.env.getItem = function( url, name, callback )
{
    var thisName = name + window.performance.now().toString().replace(".",'');
    function thisCallback(event)
    {
        callback(event.data[url.id][name])
        kango.removeMessageListener( thisName, thisCallback );
    }
    kango.addMessageListener( thisName, thisCallback );
    kango.dispatchMessage( 'getItem', {name:PSChrome.envURLListID,name2:thisName} );
};
PSChrome.env.get = function( url, callback )
{
    var thisName = 'getEnv' + window.performance.now().toString().replace(".",'');
    function thisCallback(event)
    {
        callback(event.data[url.id])
        kango.removeMessageListener( thisName, thisCallback );
    }
    kango.addMessageListener( thisName, thisCallback );
    kango.dispatchMessage( 'getItem', {name:PSChrome.envURLListID,name2:thisName} );
};


PSChrome.prototype.psftURL = function(url, DOM)
{
    var urlObject;
    var url = url.toString();
    if( 'http' != url.substr(0,4) )
        return false;
    var urlStack = url.split("?")[0].split("/");
    
    urlParams = function(url) {
		var data = {};
		if (url.split("?")[1]) {
			d = url.split("?")[1].split("&");
			for (x in d) {
				item = d[x].split("=");
				if (item[1])
					data[item[0]] = item[1];
			}
		}
		return data;
	};
	var window = 0;
    function nodeString() {
        var s = '';
        nodes = urlStack[4].split("_");
        if (parseInt(nodes[nodes.length - 1]) > 0)
            window = nodes.splice(nodes.length - 1, 1);
        for ( var i = 0; i < nodes.length; i++)
            s += (s == '' ? '' : "_") + nodes[i];
        return s;
    }

    var transportMethod = urlStack[0].split(":")[0];
    var domain = urlStack[2].split(":")[0];
    var port = (urlStack[2].split(":")[1] ? urlStack[2].split(":")[1] : transportMethod == 'http' ? 80 : 443 );
    var uri = urlStack[3];
    var node = nodeString();
    var portal = urlStack[5];
    var portal2 = urlStack[6];
    var urlType = urlStack[7];
    var path = '';
    var web = urlStack[2];
    for (i in urlStack)
        if (i > 2)
            path += "/" + urlStack[i];
    if( ( !portal || !portal2 ) && !url.indexOf('cmd=')  )
	{
		if( !url.indexOf('singon.html' ) )
			return false;
		urlType = 'o';
	}
    if (transportMethod.substring(0, 4).toLowerCase() == "http") {
        try {
            urlStack[8] += "...........";
            var contentConstructor = urlStack[8].split("?")[0].split("\.");
            var menu = contentConstructor[0];
            var component = contentConstructor[1];
            var market = contentConstructor[2];
            var page, tools, toolsMajor, user, db, appServer = '';

            /**
             */
            if (DOM)
            {
                var htmlDocument = DOM.getElementsByTagName('HTML')[0].innerHTML;
                try
                {
                    var hDoc = htmlDocument.match("^<!--.*ToolsRel.*-->");
                    if( !hDoc )
                        hDoc = htmlDocument.match("ToolsRel.*-->")
					if( !hDoc )
					{
						M = htmlDocument.toString().match( /strCurrUrl='(.*)';/m );
                        if( M )
                        {
                            if(debugEnabled)kango.console.log( 'M' );
                            if(debugEnabled)kango.console.log( M );
                            URL = new PSChrome.prototype.psftURL( M[1] );
                            /*URL.toolsMajor = '8.52';
                            URL.toolsRel = '8.52';
                            URL.tools = '8.52';
							*/
                            try{
                                if( URL.data.page )
                                    URL.page = URL.data.page;
                            }catch(e){if(debugEnabled) kango.console.log( "Caught on URL.data.page" );kango.console.log( URL ); }
                            return URL;
                        }
					}
                    
                    var comments = hDoc ? hDoc[0] : '';
                    var items = comments.replace(/:/g, "=").replace(/\s/g, ";").split(";");
                    
                    for (i in items)
                    {
                        try{
                            itemObject = items[i].split("=");
                            if( itemObject[1] )
                            {
                                switch (itemObject[0]) {
                                case "ToolsRel":
                                    tools = itemObject[1];
                                    tr = tools.split(".");
                                    toolsMajor = eval(tr[0] +'.'+ tr[1]);
                                    break;
                                case "Page":
                                    page = itemObject[1].replace(" ","");
                                    break;
                                case "User":
                                    user = itemObject[1];
                                    break;
                                case "DB":
                                    db = itemObject[1];
                                    break;
                                case "AppServ":
                                    appServer = itemObject[1];
                                    break;
                                }
                            }
                        } catch(e){
                            if(debugEnabled)kango.console.log( "Unable to find information on page" );
                        }
                    }
					
					
                } catch (e) {
                    if(debugEnabled)kango.console.log( '------------------------------' );
					if(debugEnabled)kango.console.log( "document.location: " + document.location.toString() );
                    if(debugEnabled)kango.console.log( "Unable to find Component/Page information");
                    if(debugEnabled)kango.console.log( e.toString() );
                    if(debugEnabled)kango.console.log( '------------------------------' );
                }
            }
            
            urlObject = {
                'type' : urlType
                ,'method' : transportMethod
                ,'domain' : domain
                ,'port' : port
                ,'uri' : uri
                ,'node' : node
                ,'portal' : portal
                ,'portal2' : portal2
                ,'menu' : menu
                ,'component' : component
                ,'market' : market
                ,'page' : page
                ,'tools' : tools
                ,'toolsMajor' : toolsMajor
                ,'user' : user
                ,'app' : appServer
                ,'db' : db
                ,'path' : path
                ,'web' : web
                ,'id' : transportMethod + domain + port + node
                ,'data' : urlParams(url)
                ,'url':  url
                ,'script': {'record':''}
				,'window': window
            };
			/**	Tools 8.52 shows Page/Componenet/Menue in another place	**/
            if( urlObject.toolsMajor >= 8.52 )
                $(DOM.getElementsByTagName('body')[0]).find('div').filter(function(){
                    return this.id.match(/pt_pageinfo_win([\d+])/);
                }).each(function(){
                    var pageInfoDiv = $(this);
                    function pageMonitor()
                    {
                        urlObject.page = pageInfoDiv.attr('page');
                        setTimeout( pageMonitor, 10 );
                    };
                    pageMonitor();
                });
			
            urlObject.newWinURL = function( uri )
            {
                u = $.extend( {}, urlObject );
                if( uri )
                    u.uri = 'psp';
                return PSChrome.prototype.generateURL( u, true );
            }
            if (urlType == 'c')
                urlObject['type'] = 'component';
            else if (urlType == 's') {
                urlObject['type'] = 'script';
                urlObject['script'] = {
                    'record' : contentConstructor[0],
                    'field' : contentConstructor[1],
                    'event' : contentConstructor[2],
                    'script' : contentConstructor[3]
                };
            } else if (urlType == 'h') {
                urlObject['type'] = 'tab';
            } else if (urlType == 'o') {
                urlObject['type'] = 'signon';
            } else if (urlType == 'w') {
                urlObject['type'] = 'worklist';
                urlObject['component'] = 'WORKLIST';
            } else if ( !urlType && urlObject.data.cmd ) {
                urlObject['type'] = 'cmd';
            } else {
                return false;
            }
            return urlObject;

        } catch (e) {
            if(debugEnabled)kango.console.log("Caught Exception URL Info");
            if(debugEnabled)kango.console.log( e.toString() );
            if(debugEnabled)kango.console.log( e );
        }
    }
    return false;
};

PSChrome.prototype.generateURL = function(u, newwin ) 
{
    this.makeBaseURL = function()
    {
        return u.method + "://" + u.domain
            + (u.port == "" ? "" : ":" + u.port) + "/" + u.uri + "/"
            + u.node + (newwin ?"_newwin" : '') + "/" + u.portal + "/" + u.portal2 + "/";
            //TODO: SHould this be newwin
    }

    this.makeGetData = function() {
        getData = "";
        if (!u.data)
            return "";
        for (d in u.data) {
            getData += ( getData == '' ? '' : '&' ) + d + "=" + u.data[d];
        }
        return getData;
    };

    this.makeScriptURL = function() {
        return this.makeBaseURL() + "s" + "/" + u.script.record + "."
            + u.script.field + "." + u.script.event + "."
            + u.script.script + "?" + this.makeGetData();
    };

    this.makeComponentURL = function() {
        return this.makeBaseURL() + "c" + "/" + u.menu + "." + u.component
            + "." + u.market + "?" + this.makeGetData();
    };

    this.makeTabURL = function() {
        return this.makeBaseURL() + "h" + "/?" + this.makeGetData();
    }
	this.makeSignonURL = function(){
        return u.method + "://" + u.domain + (u.port == "" ? "" : ":" + u.port) + "/" + u.node + "/signon.html";
	};

    if (u.type && u.domain && u.port && u.uri && u.node && u.method
            && u.portal //&& u.portal2
			){
        switch (u.type) {
		case "signon":
			return this.makeSignonURL();
			break;
        case "script":
            if( u.script.record )
            if (u.script.record && u.script.field && u.script.event
                    && u.script.script)
                return this.makeScriptURL();
            else
                return false;
            break;
        case "component":
            return this.makeComponentURL();
            break;
        case "tab":
            return this.makeTabURL();
            break;
        }
    } else {
		kango.console.log( u )
        return false;
    }
};


PSChrome.prototype.scrollManager = function( id, level )
{
    var procWatcher;
    level = level || 0;
    var thisScroll = this;
    thisScroll.url = PSChrome.prototype.psftURL( document.location, document );
    thisScroll.scrollName = 'table.' + id + "$scroll$" + (level = level || 0).toString();
    thisScroll.len = function(o){return Object.keys(o).length};
    thisScroll.length = function(){return Object.keys(thisScroll.data).length};
    thisScroll.headerLenth = function(){return Object.keys(thisScroll.headers).length};
    thisScroll.value = function (row, name ){ return thisScroll.data[row][thisScroll.headers[name.replace(/\s/gi, '')]].value; };
    thisScroll.innerHTML = function( row, name ){ return thisScroll.data[row][thisScroll.headers[name.replace(/\s/gi, '')]].innerHTML; };
    thisScroll.obj = function( row, name ){ return thisScroll.data[row][thisScroll.headers[name.replace(/\s/gi, '')]]; };
    thisScroll.callback_0 = function(){};
    thisScroll.callback_1 = function(){};
    thisScroll.reset = function()
    {
        if( procWatcher )
            procWatcher.monitor('stop');
        thisScroll.headers =  {};
        thisScroll.data = {};
        
    };
    thisScroll.reset();
    
    thisScroll.reapplyCallbacks = function()
    {
        $($('#toolbarMessage:first')[0]).html('');
        thisScroll.reset();
        thisScroll.init();
        if( thisScroll.callbacks )
            thisScroll.callbacks();
        thisScroll.doWatcher();
    };
    
    /**********************************/
    /** Scroll: Add Header  ***********/
	thisScroll.addHeader = function(scrollName, insertColumnNumber )
    {
        if( thisScroll.headers[scrollName.toString().replace(/\s/gi,"")] )
            return false;
        if( thisScroll.url.toolsMajor < 8.5 )
        {
            tbody = tableElement.find('tbody:first');
        } else {
            tbody = tableElement;
        }
        tr = $(tbody.find('tr')[headerIndexStart]);
        th = tr.find('th');

        //  TODO: Need to allow for inserting in specific positions
        newTH = $('<th></th>').attr({'class': 'PSLEVEL1GRIDCOLUMNHDR','scope': 'col','nowrap': true} ).appendTo(tr);
        newA = $('<a></a>').attr({'class': 'PSLEVEL1GRIDCOLUMNHDR', href: '#' }).appendTo( newTH );
        newA.html(scrollName);
        
        thisScroll.headers[scrollName.toString().replace(/\s/gi,"")] = thisScroll.headerLenth();
        a = tbody.find('tr:first').find('td:first');
        
        colContainer = tbody.find('tr:first').find('td');
        colSpanTD = $(colContainer[0]);
        if( colSpanTD ) 
        {
            colSpan = colSpanTD.attr('colSpan');
            if (colSpan)
            {
                colSpan++;
                colSpanTD.attr( 'colspan', colSpan );
                $(colContainer[1]).attr( 'colspan', colSpan );
            }
        }
        for( row in thisScroll.data )
            thisScroll.data[row][thisScroll.len(thisScroll.data[row])] = {innerHTML: '' , obj: thisScroll.addColumn( thisScroll.data[row][thisScroll.len(thisScroll.data[row])-1].obj, 'td', row )[0] , value: ''};
        return true;
	};
    /** END-Scroll: Add Header  ***********/
    /**********************************/
    
    thisScroll.addColumn = function(sibling, tagType, i)
    {
		return $($('<'+tagType+'></'+tagType+'>' )[0]).attr(
            { 'class': 'PSLEVEL1GRID'+ (i % 2 ? 'EVEN' : 'ODD') + 'ROW', align: 'center', nowrap: true }
            ).appendTo(sibling.parentNode);
	};
    thisScroll.addSpan = function(p){ return $($('<span></span>' )[0]).attr('class','PSHYPERLINK').appendTo(p); };
    thisScroll.addLink = function(p){ return $($('<a></a>' )[0]).attr({ class: 'PSHYPERLINK' }).html('').appendTo(p); };
    /*
    thisScroll.addRow = function(r)
    {
		var data = {};
		var rowContainer = $('<tr></tr>' ).get()[0];
		tableElement.find('tbody')[0].appendChild(rowContainer);
		var item;
		var i = 0;
		for (x in r) 
        {
			item = thisScroll.addColumn(rowContainer, 'td', thisScroll.dataLength() );
			if (r[x].innerHTML) {
				data[i] = {
					value : r[x].innerHTML,
					innerHTML : r[x].innerHTML,
					obj : item
				}
				item.innerHTML = r[x].innerHTML;
			} else {
				data[i] = {
					value : r[x],
					innerHTML : r[x],
					obj : item
				}
				item.innerHTML = r[x];
			}
			i++;
		}
		thisScroll.data[thisScroll.dataLength()] = data;

	};
    */
    
    
    //  TODO: Track custom fields so they can be removed on refresh click and reloaded when done
    //  TODO: Look at the header and watch header change to see when things have been refreshed
    //  TODO: When a header is added then a callback needs to be passed so it can be called to read column data
    //  TODO: Set RefreshCallbacks for anything you do to a scroll
    //  TODO: When adding a new header on greater tools version the width needs to be expanded
    
    /*
    if( thisScroll.url.toolsMajor < 8.5 )
        tableElement = $("table[id$='"+id + "$scroll$" + (level = level || 0).toString()+"']");
    else {
//            tableElement = $("tr[id$='trPMN_PRCSLIST$0_row1']");//find('tbody')[4];
            tableElement = $($("tr[id$='trPMN_PRCSLIST$0_row1']")[0].parentNode);//find('tbody')[4];
        }*/

    var tableElement, indexPadding, headerIndexStart, blank;
    
    thisScroll.init = function()
    {
        if( thisScroll.url.toolsMajor < 8.5 )
        {
            indexPadding = 1;
            headerIndexStart = 2;
            tableElement = $("table[id$='"+id + "$scroll$" + level.toString()+"']");
        } else 
        {
            indexPadding = -1;
            headerIndexStart = 0;
            try{
                tableElement = $($("tr[id^='tr"+id+"$0_row']")[0].parentNode);
            } catch(e)
            {
                setTimeout( thisScroll.init, 200 );
            }
        }
        
        blank = 0;
        tableElement.find('tr').each(function(index)
        {
            if( index > indexPadding )
            {
                /*************************************/
                /*****  This Is The Header Row  ******/
                if( index == headerIndexStart )
                {
                    try{
                        $(this).find('th').each(function(index)
                        {   
                            headerElement = $(this).find('*')[0];
                            if( headerElement )
                            {
                                thisScroll.headers[headerElement.innerHTML.toString().replace(/\s/gi,"")] = index;
                            } else {
                                thisScroll.headers['blank_'+(blank++)] = index;
                            }
                        });
                    } catch(e){
                        if(debugEnabled)kango.console.log( "error finding scroll headers" );
                        if(debugEnabled)kango.console.log( e.toString() );
                    }
                /*********************************************/
                /*****  Process Each Row of the Scroll  ******/
                } else {
                    var newData = {};
                    thisScroll.data[Object.keys(thisScroll.data).length] = newData;
                    $(this).find('td').each(function(index)
                    {
                        var cellElement;
                        $(this).find("a").each(function(index){ cellElement = this; });
                        if( !cellElement )
                            $(this).find("span").each(function(index){ cellElement = this; });
                        if( !cellElement ){  //  No cell data found
                            cellElement = $("<span></span>").get()[0];
                            this.appendChild( cellElement );
                        }
                        newData[index] = {
                            innerHTML: this.innerHTML
                            //, obj: cellElement
                            , obj: this
                            , value: cellElement.innerHTML
                        };
                    });
                }
                /*********************************************/
            }
        });
    };
    
    thisScroll.doWatcher = function()
    {
        
        if( thisScroll.url.toolsMajor < 8.5 )
            return;
        if( procWatcher )
            procWatcher.monitor( 'stop' );
        watchID = id + '$scroll$' + level;
        //watchString = "table[id$='"+watchID+"']";
        watchString = "span[id$='PMN_PRCSLIST_PRCSINSTANCE$0']";
        /*function addWatcher(){ $('<span>watcher</span>').appendTo( $($(watchString)[0]) ); };
        procWatcher = new $.itemMonitor();
        procWatcher.setTime( 200 );
        procWatcher.monitor( 'add', function()
        {
			var scrollFinder = $(("table[id$='PMN_PRCSLIST$scroll$0']"));
            return $(scrollFinder[scrollFinder.length-1]).html().replace(/\s(class=.*)[\s>]/gi, '' );
        }, thisScroll.reapplyCallbacks);*/
    };
    thisScroll.init();
    thisScroll.doWatcher();
};


function sortList( data )
{

    /** Sort Environment List   **/
    newList = [];
    for( env in data )
    {
        if( !data[env].node || data[env].domain == 'www.paypal.com' )
            delete newList[env];
        else if( env != 'undefined' && data[env].node )
            newList[env] = data[env].name;
    }
    newList = sort(newList);
    newListObject = {};
    for( env in newList )
        newListObject[env] = data[env];
    return newListObject;
    /** END: Sort Environment List   **/
}
PSChrome.prototype.initOptions = function()
{

    PSChrome.prototype.browserShow();   
    $('#trace_log_doAnalysis').click( runTrace );
    $('#trace_reset').click( function()
    {
        //$('#traceLogManual').focus().click();
        $('#traceLogManual').val('');
        $('#myTrace').html('');
    });
    
    
    var anchorTabs = {
        'tabs-general': 0
        ,'tabs-settings': 1
        ,'tabs-environments': 2
        ,'tabs-global-favorites': 3
        ,'tabs-help': 4
    };
    /*
    anchorObject = {active:1};
    if( anchor = document.location.toString().split("#")[1] )
    {
        if( anchorTabs[anchor] )
            anchorObject.active = anchorTabs[anchor];
    }*/
    $( "#tabs" ).tabs();
    //$( "#tabs" ).tabs('option','active',2);
    $( "#environmentContainer" ).accordion();
    $( "#environmentContainer" ).accordion( "option", "heightStyle", "content" );

    /** Create New Environment Area **/
    var envCount = 0;
    var activeObject = { active: 0};
    
    function createRadioSet( parentObj, fieldName, labelObj, opts, thisENV )   //  [ id, label, checked, value, clickCallback ]
    {
        var parent = parentObj;
        var label = labelObj;
        var thisEnvData = thisENV ? thisENV : {};
        var thisEnvDataOrig = thisENV;
        var options = opts;
        var PSChromeField = fieldName;
        var radioForm = $('<form></form>');
        var radioDiv = $('<div></div>').attr({id:label});
        
        function valueChange(thisInput, thisX){
        
            thisInput.click( function(){
                if( options[thisX].value != null ){
                    if( thisEnvDataOrig )
                        PSChrome.env.setItem( thisEnvData, PSChromeField, options[thisX].value );
                    else
                        PSChrome.storage.setItem( PSChromeField, options[thisX].value );
                } else {
                    if( thisEnvDataOrig )
                        PSChrome.env.removeItem( thisEnvData, PSChromeField );
                    else
                        PSChrome.storage.removeItem( PSChromeField );
                }
            });
        }
        function doOptions(){
            for( x = 0; x < options.length; x++ ){
                var thisX = x;
                var newInput = $('<input></input>').attr({type:'radio',id:options[x].id?options[x].id:label+x,name:label}).appendTo( radioDiv );
                if( thisEnvData[PSChromeField]==options[x].value )
                    newInput.attr({checked:'checked'});
                if( options[x].value ) newInput.val(options[x].value);
                if( options[x].clickCallback ) newInput.click( clickCallback );
                if( PSChromeField )
                    valueChange( newInput, x);
                $('<label></label>').html( options[x].label ).attr({'for':options[x].id?options[x].id:label+x}).appendTo( radioDiv );
            }
            radioDiv.appendTo( parent );
            radioDiv.buttonset();
        }
        if( thisEnvDataOrig ){
            doOptions();
        } else {
            PSChrome.storage.getItem( PSChromeField, function(data){
                thisEnvData[PSChromeField] = (data.data == null ? PSChrome.def[PSChromeField] : data.data);
                doOptions();
            });
        }
        
    }
        
    function addEnvironment( envData )
    {
        var groupAttributes = {position:'relative',width:"350px", float:'left'};
        
        var header = $('<h3></h3>').html(envData.name||envData.node).appendTo( $( "#environmentContainer" ) );
        $('<a></a>').attr({name:envData.id}).appendTo( header );
        var divContainer = $('<div></div>').appendTo( $( "#environmentContainer" ) );
        var settingsContainer = $('<p><!--enable backend tools--></p>').appendTo( divContainer );
        //$('<p></p>').html('Name: "' + (envData.name?envData.name:envData.node) + '"').appendTo( divContainer );
        //$('<p></p>').html('Node: ' + envData.node ).appendTo( divContainer );
        //$('<p></p>').html('Server: ' + envData.method + "://" + envData.domain + ":" + envData.port ).appendTo( divContainer );
		envData.type = 'tab';
		envData.data = { tab: 'DEFAULT' };
        var homepageP = $('<p></p>').html('Homepage URL: ').appendTo( divContainer );
		var homepageURL = PSChrome.prototype.generateURL( envData );
		var homepageLink = $('<a></a>').html( homepageURL ).attr({href:homepageURL,target:'_blank'}).appendTo( homepageP );
        var urlP = $('<p></p>').html('Signon URL: ').appendTo( divContainer );
		envData.type = 'signon';
		var signonURL = PSChrome.prototype.generateURL( envData );
		var signonLink = $('<a></a>').html( signonURL ).attr({href:signonURL,target:'_blank'}).appendTo( urlP );
		
        $('<hr>').appendTo( divContainer );
        $('<p><h2>Process Monitor</h2></p>').appendTo( divContainer );
        
        var groupDiv = $('<p></p>').attr({width:'800px'}).appendTo( divContainer );
        
        
        
        
        /** Auto Refresh    **/
        

        $('<span><b>Auto-Refresh</b></span>').appendTo( groupDiv );
        createRadioSet( groupDiv, PSChrome.procMonRefreshEnabled, 'autoRefresh'+envData.id, [
            {label:'On',value:true},
            {label:'Off',value:false},
            {label:'Use Global', value: null}
        ], envData );
        
        
        /** Process Monitor Process Status    **/
        var autoRefreshStatusesDiv = $('<div>Refresh Statuses</div>').css(groupAttributes).appendTo( groupDiv );
        $('<br>').appendTo( autoRefreshStatusesDiv );
        var options = envData[PSChrome.procMonRefreshStatuses] ? $.map(envData[PSChrome.procMonRefreshStatuses].split(","), function(value){return parseInt(value);}) : PSChrome.def.procMonAutoRefresh;
        var seltecor = $("<select multiple></select>")
            .attr({size:14})
            .change(function(){
                var options = "";
                for( x = 0; x < this.options.length; x++  )
                {
                    item = this.item(x);
                    if( item.selected === true )
                        options += ( options == '' ? '' : ',' ) + item.value;
                }
                PSChrome.env.setItem( envData, PSChrome.procMonRefreshStatuses, options );
            })
            .appendTo( autoRefreshStatusesDiv );
        function addOption(id, value){
            optn = $("<option></option>").html(value).attr({value:id}).appendTo( seltecor );
            if( $.inArray(parseInt(id), options) > -1 )
                optn.attr({selected:'selected'});
        };
        for( x in PSChrome.statusList )
            addOption( x, PSChrome.statusList[x] );
        $('<br>').appendTo( autoRefreshStatusesDiv );
        $('<button></button>').html('reset').appendTo( autoRefreshStatusesDiv ).click(function(){
            for( x = 0; x < seltecor[0].options.length; x++  )
            {
                $(seltecor[0][x]).removeAttr('selected');
                if( $.inArray(parseInt(seltecor[0][x].value), PSChrome.def.procMonAutoRefresh) > -1 )
                    $(seltecor[0][x]).attr({selected:'selected'});
            }
            PSChrome.env.removeItem( envData, PSChrome.procMonRefreshStatuses );
            seltecor.focus();
        });
        
        
        
      
        $('<hr>').appendTo( divContainer );
        
        /** Remove  **/
        var removeButtonID = 'removeButton'+envData.id;
        var removeDialogButtonID = 'removeDialog'+envData.id;
        var removeButton = $("<button></button>").html('Remove').attr({id:removeButtonID}).appendTo( divContainer )
            .css({position:'relative', 'float':'right'});
        var removeDialogBox = $("<div></div>").html('Remove').attr({id:removeDialogButtonID,title:'Remove Environment'}).appendTo( settingsContainer )
            .html("All settings and associated data will be removed from PSChrome for the environment '" + envData.name + "'.");
        removeDialogBox.dialog({ autoOpen: false 
            ,buttons: [
                {
                  text: "Remove Environment",
                  click: function() {
                    PSChrome.storage.getItem( PSChrome.envURLListID, function(data){
                        var env_list = data.data;
                        for( x in env_list )
                            if( env_list[x].id == envData.id )
                            {
                                delete env_list[x];
                                PSChrome.storage.setItem( PSChrome.envURLListID, env_list );
                                header.remove();
                                divContainer.remove();
                            }
                    });
                    $( this ).dialog( "close" );
                  }
                }
              ]
        });
        removeButton.click(function() {
            removeDialogBox.dialog( "open" );
        });
        
        
        /** Rename  **/    
        var renameButtonID = 'renameButton'+envData.id;
        var renameDialogButtonID = 'renameDialog'+envData.id;
        var renameButton = $("<button></button>").html('Rename').attr({id:renameButtonID}).appendTo( divContainer )
            .css({position:'relative', 'float':'left'});
         var renameDialogBox = $("<div></div>").html('Rename').attr({id:renameDialogButtonID,title:'Rename Environment'}).appendTo( settingsContainer )
            .html("Origional Name:<br>'" + envData.name + "'");
            
        var renameInput = $("<input></input>").attr({type:'text'}).appendTo(renameDialogBox).val(envData.name);        
        
        renameDialogBox.dialog({ autoOpen: false 
            ,buttons: [
                {
                  text: "Save",
                  click: function() {
                    PSChrome.storage.getItem( PSChrome.envURLListID, function(data){
                        var env_list = data.data;
                        for( x in env_list )
                            if( env_list[x].id == envData.id )
                            {
                                envData.name = renameInput.val();
                                env_list[x] = envData;
                                PSChrome.storage.setItem( PSChrome.envURLListID, env_list );
                                PSChrome.storage.setItem( PSChrome.optionsPageChange, envData.id );
                                kango.invokeAsync( 'kango.ui.optionsPage.open', 'tabs-environments' );
                                window.close();
                            }
                    });
                    $( this ).dialog( "close" );
                  }
                }
              ]
        });
        renameButton.click(function() {
            renameDialogBox.dialog( "open" );
        });
        
        /** General Settings Container  **/
        /** For all these we need to switch to Global/yes/No    **/
        var generalSettingsDiv = $('<div><h2>General Settings</h2></div>').appendTo( groupDiv );
        
        thisParent = $('<span><b>Timeout Evasion</b></span>').appendTo( generalSettingsDiv );
        createRadioSet( thisParent, PSChrome.noTimeoutID, 'noTimeout'+envData.id, [
            {label:'On',value:true},
            {label:'Off',value:null},
        ], envData );
        $('<br>').appendTo( generalSettingsDiv );
        
        thisParent = $('<span><b>Correct History mode by default</b></span>').appendTo( generalSettingsDiv );
        createRadioSet( thisParent, PSChrome.correctHistoryDef, 'correctHistory'+envData.id, [
            {label:'On',value:true},
            {label:'Off',value:false},
            {label:'Use Global', value: null}
        ], envData );
        $('<br>').appendTo( generalSettingsDiv );

        thisParent = $('<span><b>Advanced Search by default</b></span>').appendTo( generalSettingsDiv );
        createRadioSet( thisParent, PSChrome.advancedSearchDef, 'advancedSearch'+envData.id, [
            {label:'On',value:true},
            {label:'Off',value:false},
            {label:'Use Global', value: null}
        ], envData );

        
        
        var checkFocus = function( thisCounter ){
            PSChrome.storage.getItem( PSChrome.optionsPageChange, function(data){
                if( data.data ){
                    if( data.data == envData.id ){
                        activeObject.active = thisCounter;
                            $( "#environmentContainer" ).accordion("refresh");
                            $( "#environmentContainer" ).accordion(activeObject);
                            PSChrome.storage.removeItem( PSChrome.optionsPageChange );
                    }
                }
            });
        }
        
        checkFocus( envCount );
        envCount++;
    };
    
    
    PSChrome.storage.getItem( PSChrome.envURLListID, function(data)
    {
        if( !data.data )
        {
            $( "#environmentContainer" ).html( "No environment data found" );
            return;
        }
        data.data = sortList(data.data);
        for( x in data.data )addEnvironment( data.data[x] );
        $( "#environmentContainer" ).accordion("refresh");
        $( "#environmentContainer" ).accordion(activeObject);
        $('#viewSettings').click(function(){
            
            $('#jsonSettingsData').html( this.checked?JSON.stringify( data.data, null, 2 ):'' );
            $('#jsonSettingsDiv').css({display:'block'});
        });
        
    });
    
     var saveDialogBox = $("<div></div>")
            .attr({id:'test',title:'Remove Environment'}).appendTo( $('#jsonSettingsSave')[0] )
            .html("<p>By clicking update you could mess up your PSChrome saved environments</p><p>Please save a copy of your previous settings before updating.</p>" );
        saveDialogBox.dialog({ autoOpen: false 
            ,buttons: [
                {
                  text: "Overwrite Existing",
                  click: function() {
                  jsString = $('#jsonSettingsData').val();
                  var newJSON = eval( "(" + jsString + ")" );
                  PSChrome.storage.setItem( PSChrome.envURLListID, newJSON );
                  $( this ).dialog( "close" );
                    kango.invokeAsync( 'kango.ui.optionsPage.open', 'tabs-settings' );
                    window.close();
                  }
                }
              ]
        });
    $('#jsonSettingsSave').click(function(){
        saveDialogBox.dialog( "open" );
    });
    
    /** Set Global Values in settings page  **/
    PSChrome.storage.getItem( PSChrome.debugEnabled, function(data)
    {
        var isChecked = data?data.data:PSChrome.def.debugEnabled;
        $('#setting_debug_logs').prop({checked:isChecked==true?'checked':''})
            .change(function(){
                PSChrome.storage.setItem( PSChrome.debugEnabled, $(this).prop('checked')?true:false );
            });
    });
    
    PSChrome.storage.getItem( PSChrome.procMonRefreshTime, function(data)
    {
        var refreshTime = data?data.data:PSChrome.def.proc_mon_refresh_time;
        $('#settings_process_monitor_default_refresh').val(refreshTime);
        $('#settings_process_monitor_default_refresh_button')
            .click(function(){
                var newVal = $('#settings_process_monitor_default_refresh');
                if( newVal.val() < PSChrome.def.proc_mon_refresh_min )
                    newVal.val( PSChrome.def.proc_mon_refresh_min );
                PSChrome.storage.setItem( PSChrome.procMonRefreshTime, $('#settings_process_monitor_default_refresh').val() );
            });
    });
    
    PSChrome.storage.getItem( PSChrome.procMonRefreshEnabled, function(data)
    {
        var isChecked = data?data.data:PSChrome.def.proc_mon_refresh_enabled;
        $('#setting_proc_mon_refresh_enabled').prop({checked:isChecked==true?'checked':''})
            .change(function(){
                PSChrome.storage.setItem( PSChrome.procMonRefreshEnabled, $(this).prop('checked')?true:false );
            });
    });
    
    
    
    
    var settingsDynamic = $('#globalSettingsDynamic' );
    
    test = $('<span><b>Correct History mode by default</b></span>').appendTo( settingsDynamic );
    createRadioSet( test, PSChrome.correctHistoryDef, 'correctHistory', [
        {label:'On',value:true},
        {label:'Off',value:false}
    ]  );
    $('<br>').appendTo( settingsDynamic );

    test = $('<span><b>Advanced Search Global Setting</b></span>').appendTo( settingsDynamic );
    createRadioSet( test, PSChrome.advancedSearchDef, 'advancedSearch', [
        {label:'On',value:true},
        {label:'Off',value:false}
    ] );
        
        
        
        
        
    /*
    
    PSChrome.storage.getItem( PSChrome.procMonRefreshEnabled, function(data)
    {
        var sendObj = {};
        sendObj[PSChrome.procMonRefreshEnabled] = data.data ? data.data : PSChrome.def[PSChrome.procMonRefreshEnabled];
        $('<span><b>Auto-Refresh</b></span>').appendTo( groupDiv );
        createRadioSet( $('#setting_procMonRefreshContainer'), null, 'autoRefreshGlobal', [
            {id:'setting_procMonRefreshContainer1', label:'On',value:true},
            {id:'setting_procMonRefreshContainer2', label:'Off',value:false},
            ], sendObj );
    });
    */
    
    //  PSChrome.correctHistoryDef = 'correct_history_def';
    //  PSChrome.advancedSearchDef = 'advanced_search_def';
    
        
    /*********************************************/
    /** Global Favorites                         */
    /*********************************************
    var globalFavoritesTemp = kango.storage.getItem( PSChrome.globalFavoritesTemp );
    if( globalFavoritesTemp )
    {
        //kango.storage.removeItem( PSChrome.globalFavoritesTemp );
        
        console.log( globalFavoritesTemp );
        
        var editContainer = $('#global_favotires_edit').css({
            display: 'block'
        })
        .html( "Edit Update Container " +  globalFavoritesTemp.component );
        
        var gfMenu, gfComponet, gfPage, gfData;
        var gfString;
        
        gfMenu = $('<input></input>').val( globalFavoritesTemp.menu ).appendTo( $('<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Menu: </p>') .appendTo( editContainer ) );
        
        gfComponet = $('<input></input>').val( globalFavoritesTemp.component ).appendTo( $('<p>Component: </p>') .appendTo( editContainer ) );
        
        gfPage = $('<input></input>').val( globalFavoritesTemp.page ).appendTo( $('<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Page: </p>') .appendTo( editContainer ) );
        
        console.log( globalFavoritesTemp.data );
        gfData = $('<input></input>').val( globalFavoritesTemp.data.toString() ).appendTo( $('<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Data: </p>') .appendTo( editContainer ) );
        
        //gfString = globalFavoritesTemp.menu + '.' + globalFavoritesTemp.componet
        
        
        
        
    }
    /*********************************************/
    $('#loading').hide();
    $('#tabs').show();
}



PSChrome.prototype.initPopup = function()
{
    var popup = this;
    doLoadPopup = function() 
    {
        if(debugEnabled)kango.console.log( "Popup Loaded");

        if( !kango.storage.getItem(PSChrome.showPopupNotification) )
    	{
        	kango.storage.setItem(PSChrome.showPopupNotification,true)
            kango.ui.browserButton.setBadgeValue( '' );
    		$("#showNotify").show();
    	}
        
        
       
        env_list = kango.storage.getItem( PSChrome.envURLListID ) || {};
        
        /** Sort Environment List   **
        newList = [];
        for( env in env_list )
            if( env != 'undefined' )
                newList[env] = env_list[env].name;
        newList = sort(newList);
        newListObject = {};
        for( env in newList )
            newListObject[env] = env_list[env];
        env_list = newListObject;
        /** END: Sort Environment List   **/
        var settingsContainer;
        
        envList = $('#ENV_LIST:first').html('');
     
        for( env in env_list )
        {
            if( env.toString() == 'undefined' || !env )
            {
                delete env_list[env];
                kango.storage.setItem( PSChrome.envURLListID, env_list );
            }
        }
     
        env_list = sortList( env_list );
        for( env in env_list )
        {
            thisEnv = env_list[env];
            if( !thisEnv.node )
            {
                kango.storage.setItem( PSChrome.envURLListID, env_list );
            } else {
                function doEnvironmentItem( eList )
                {
                    envContainer = $('<div></div>').css({'white-space':'nowrap'}).appendTo( envList );
                    RenameLink = $('<a></a>').attr({'href':'#','alt':'Rename','title':'Rename'}).css({'padding':'5px'}).click(function()
                    {
                        if( promptValue = prompt('Rename to what?', eList.name ) )
                        {
                            eList.name = promptValue;
                            for( x in env_list )
                                if( env_list[x] == eList )
                                {
                                    env_list[x] = eList;
                                }
                            kango.storage.setItem( PSChrome.envURLListID, env_list );
                            doLoadPopup();
                        }
                    });
                    $('<img></img>').attr({'src':PSChrome.iconBase+'rename.png'}).appendTo( RenameLink );
                    RenameLink.appendTo( envContainer );
                    DeleteLink = $('<a></a>').attr({'href':'#','alt':'Delete','title':'Delete'}).css({'padding':'5px'}).click(function()
                    {
                        if( confirm('Please confirm you want to delete "' +eList.name+ '"' ) )
                        {
                            for( x in env_list )
                                if( env_list[x] == eList )
                                    delete env_list[x];
                            kango.storage.setItem( PSChrome.envURLListID, env_list );
                            doLoadPopup();
                        }
                    });
                    $('<img></img>').attr({'src':PSChrome.iconBase+'delete.png'}).appendTo( DeleteLink );
                    DeleteLink.appendTo( envContainer );
                    
                    
                    /** Need to see if IB Monitor is enabled.
                          var PSChromeEnabled = currentEnv[PSChrome.envPSChromeAppPackageID];
                          var IBEnabled = currentEnv[PSChrome.envPSChromeAppPackageIDIBEnabled];
                        */
                    var SettingsLink = $('<a></a>')
                        .attr({'href':'#','alt':'Settings','title':'Settings'})
                        .css({'padding':'5px'})
                        .appendTo( envContainer );
                    var currentEnv = thisEnv;
                    $('<img></img>').attr({'src':PSChrome.iconBase+'gear.png'}).appendTo( SettingsLink );
                    SettingsLink.click(function()
                    {
                        PSChrome.storage.setItem( PSChrome.optionsPageChange, currentEnv.id );
                        kango.invokeAsync( 'kango.ui.optionsPage.open', 'tabs-environments' );
                    });
                    
					var newTab = function( currentURL, tab ){
						if( 'chrome://newtab/' == currentURL || 'about:newtab' == currentURL )
							tab.close();
					};
                    EnvLink = $('<a></a>').attr({'href':'#'}).html(eList.name).click(function(){
                        kango.browser.tabs.getCurrent(function(tab)
                        {
                            var currentURL = tab.getUrl();
							var currentTab = tab;
                            kango.browser.tabs.create({url:PSChrome.prototype.generateURL( eList )}); 
							newTab( currentURL, tab );
                        });
                    }); 
                    EnvLink.appendTo( envContainer );
                }
                doEnvironmentItem( thisEnv );
            }
        }
        
        /************************************/
        /** Popup Page Links
        /************************************/
        
        
        body = document.getElementsByTagName('body')[0];
        $('#opentab_facebook:first').click(function(){kango.browser.tabs.create({url:"https://www.facebook.com/PSChrome"});});
        $('#opentab_googleplus').click(function(){kango.browser.tabs.create({url:"https://plus.google.com/109521097236814874679/posts"});});
        $('#opentab_suggestions').click(function(){kango.browser.tabs.create({url:"mailto:shelby@melban.me?subject=PSChrome Suggestion"});});
        $('#opentab_googlegroup').click(function(){kango.browser.tabs.create({url : "https://groups.google.com/forum/#!forum/pschrome"});});
        $('#opentab_linkedin').click(function(){kango.browser.tabs.create({url : "http://www.linkedin.com/groups/PSChrome-Fans-4672559"});});
        $('#opentab_github').click(function(){kango.browser.tabs.create({url : "https://github.com/melban/PSChrome-Helper-Extension/issues"});});
        $('#opentab_google_webstore').click(function(){kango.browser.tabs.create({url : 'mailto:?Subject=PSChrome: PeopleSoft Browser Extension&body='+escape('I am inviting you to checkout PSChrome.  It is a Chrome browser extension that adds helpful features to your existing PeopleSoft browsing expreience!\n\nGoogle Chrome\nhttps://chrome.google.com/webstore/detail/pschrome-peoplesoft-helpe/cpgoncheakfjhldfbebekijoeaabnfeb\n\nMozilla Firefox\nhttps://addons.mozilla.org/en-US/firefox/addon/PSChrome-PeopleSoft-Addon/\n\n' ) });});
        $('#opentab_FFBeta').click(function(){kango.browser.tabs.create({url:"mailto:shelby@melban.me?subject=Firefox Beta&body=" + escape("I want to participate in the Firefox Beta test of PSChrome !!!") });});
        $('#opentab_live_chat').click(function(){kango.browser.tabs.create({url : "http://melban.me/extensions/peoplesoft-chrome-helper-extension/"});});
        $('#optionsLink').click(function(){kango.invokeAsync( 'kango.ui.optionsPage.open' ); });
        $('#opentab_email_tools_version').click(function(){kango.browser.tabs.create({url:"mailto:shelby@melban.me?subject=PIA Tools 8.52+&body=" + escape("Below is a URL to access our 8.52+ PeopleTools system.\n\n") });});
		$('#opentab_email_tools_version2').click(function(){kango.browser.tabs.create({url:"mailto:shelby@melban.me?subject=PSChrome Development and Sponsors+&body=" + escape("Please include some information on your interest in helping develope ideas or code for PSChrome.\n\n") });});
		
		
        
        
        
        /************************************/
        PSChrome.prototype.browserShow();
        $('#opentab_pschrome').click(function(){
            if( storeURL != '' ){
                kango.browser.tabs.create({url : storeURL});
            }
        });
        
    }
    
    
    KangoAPI.onReady(doLoadPopup);
};

PSChrome.prototype.browserShow = function(){
    
        var browser = kango.browser.getName();
        var storeURL = '';
        $('.'+browser).css({'display':'inline'});
        if( browser == 'chrome' )
        {
            storeURL = "https://chrome.google.com/webstore/detail/pschrome/cpgoncheakfjhldfbebekijoeaabnfeb/reviews?hl=en";
            $('#opentab_pschrome').show();
        } else if ( browser == 'firefox' )
        {
            //storeURL = "https://addons.mozilla.org/en-US/firefox/addon/PSChrome-PeopleSoft-Addon/";
            storeURL = "https://www.pschrome.com/chrome/PSChrome2/versions/pschromeforfirefox_2.4.6.xpi";
            $('#opentab_pschrome').show();
        }
};

PSChrome.components = {};
PSChrome.components.processMonitor = function( contentObject ){
    var content = contentObject;
    var self = this;
    var thisURL = content.url;
    
    
	var resetTimer = false;
	var cancelCountdown = false;
	var timeLeft = PSChrome.def.proc_mon_refresh_time;
    var monitor;
    
    /***************************************
    ****************************************
    ****************************************
    ****************************************
    ***************************************/
    
    var reset, timeoutWaiter, doRefreshButtonWatcher, doRefresh, monitorStatuses;
    //doRefresh = true;    // This is set by process states so for testing set to true always
    
    var watchInit = false;
	var processingImg = $('#processing');
	var spinWatcher = function(start){
	}
	var refreshButtonEvent = function(){
		$($('#REFRESH_BTN:first')[0]).click(function(){
			cancelCountdown = true;
		});
	};
	var refreshWatcher = function(){
		setTimeout( refreshWatcher, 1000 );
		if( cancelCountdown == true || !doRefresh )
		{
			content.toolbar.message.html( "" );
			return;
		}
		var thisWatcher = this;
		timeLeft--;
		if( resetTimer == true ){
			timeLeft = PSChrome.def.proc_mon_refresh_time;
		}
		
		if( timeLeft < 0 )
		{
            /* TODO Does clickWait() do anything?   **/
			var clickWait = function(){
				if( resetTimer == false )
					setTimeout( clickWait, 1000 );
			};
			content.toolbar.message.html( "Refreshing now ..." );
			//clickWait();
			//spinWatcher(true);
			try{
				simulate( $('#REFRESH_BTN:first')[0] , "click");
			} catch(eSim){};
			return;
		}
		
		content.toolbar.message.html( "Refreshing in " + timeLeft + " seconds" );
		resetTimer = false;
	};
	PSChrome.storage.getItem( {name:'setting_proc_mon_refresh_time',name2:'setting_proc_mon_refresh_time2'}, function( data )
	{
		if( data.data )
			PSChrome.def.proc_mon_refresh_time = data.data;
        //  setting_proc_mon_refresh_enabled
        PSChrome.storage.getItem( {name:'setting_proc_mon_refresh_enabled',name2:'setting_proc_mon_refresh_enabled2'}, function( globalEnabled )
        {
            PSChrome.env.getItem( content.url, 'setting_proc_mon_refresh_enabled', function( localEnabled )
            {
                if ( localEnabled === false )
                    return;
                
                if( globalEnabled.data === false )
                {
                    if( !localEnabled )
                        return;
                }
                refreshWatcher();
            });
        });
	});
    
    /*PSChrome.env.getItem( content.url, PSChrome.procMonRefreshStatuses, function( data )
    {
        monitorStatuses = data;
    });*/
    this.envData = {};
    /***************************************
    ****************************************
    ****************************************
    ****************************************
    ***************************************/
    
    
    
    var messageAction = function(){
		PSChrome.storage.getItem( PSChrome.process_update, function(updateStatus){
            
            ok = $("input[id$='#ICSave']")[0];
            if( ok )
            {
                if( updateStatus.data != null )
                    PSChrome.storage.setItem( PSChrome.process_update, 'ok_button' );
                try{
                    switch( updateStatus.data )
                    {
                        case "message":
                            $('#PMN_DERIVED_MESSAGELOG_BTN:first')[0].click();
                            break;
                        case "logs":
                            $('#PMN_DERIVED_INDEX_BTN:first')[0].click();
                            break;
                        case "cancel":
                            $('#PMN_DERIVED_CANCELREQUEST:first')[0].click();
                            break;
                        case "hold":
                            $('#PMN_DERIVED_HOLDREQUEST:first')[0].click();
                            break;
                        case "delete":
                            $('#PMN_DERIVED_DELETEREQUEST:first')[0].click();
                            break;
                        case "restart":
                            $('#PMN_DERIVED_RESTARTREQUEST:first')[0].click();
                            break;
                        case "repost":
                            $('#PMN_DERIVED_RESENDCONTENT:first')[0].click();
                            setTimeout( function(){
                                ok.click();
                            }, 500 );   //  TODO need to test reposting and if it actually needs to wait because deferred processing isn't enabled
                            break;
                        case "ok_button":
                            PSChrome.storage.removeItem( PSChrome.process_update );
                            ok.click();
                            break;
                    }
                } catch(e){
                    if(debugEnabled)kango.console.log( 'Error trying to click radio button or processing request' );
                    PSChrome.storage.removeItem( 'process_update' );
                    ok.click();
                }
            }
        
        
		});
    }
    
    var addQuickLink = function( ql, lid, status, text, icon, position )
    {
		if( thisURL.toolsMajor == 8.53 )return; //	TODO: Not working for tools 8.53
		
        $(ql).attr({align:'left'});
        var thisStatus = status;
        s = monitor.addSpan( ql ).css({padding:'0px 7px 0px 0px'});
        if( $(ql).find('a').length > 0 )
            s.innerHTML += "&nbsp;";
        a = monitor.addLink( s ).html( icon ? '' : text ).click(function()
        {
			cancelCountdown = true;
            if( thisStatus == 'delete' || thisStatus == 'cancel' )
                if( !confirm("Are you sure you want to "+thisStatus+" this process?") )
                    return;
            PSChrome.storage.setItem( PSChrome.process_update, thisStatus );
            window.location = lid.href;
        } );
        if( icon )
            $('<img></img>').attr({ src:PSChrome.iconBase + icon, title: text, border:0}).appendTo( a );
    }
    
    var canDoRefresh = function( status )
    {
        for( var x in monitorStatuses )
        {
            if( PSChrome.statusList[monitorStatuses[x]] == status )
            {
                resetTimer = true;
                cancelCountdown = false;
                doRefresh = true;
            }
        }
    };
    var applyQuickLinks = function(){
	
		try{
            monitorStatuses = self.envData[PSChrome.procMonRefreshStatuses];
            monitorStatuses = monitorStatuses ? monitorStatuses.split(","):PSChrome.def.procMonAutoRefresh;
		} catch(ee){ if(PSChrome.debugEnabled) kango.console.log( "Caught exception on monitorStatus although unsure why" ); }	//	TODO Figure this out
        
        monitor = new PSChrome.prototype.scrollManager( 'PMN_PRCSLIST', 0 );
		if( monitor.headers['QuickLinks'] )return;	//	Don't reapply if nothing has changed
		
        doRefresh = false;
        
        if( monitor.addHeader( 'Quick Links' ) )
        if( !monitor.data.obj )
        {
            doRefresh = true;
            //  TODO: Need to check for statuses allowing for refresh
        }
        for( x in monitor.data )
        {
            if( monitor.obj( x, 'Instance' ).value != '&nbsp;' )
            {
                var isJob = false;
                if( monitor.value( x, "Process Type" ) == 'Process' )
                    isJob = true;
                
                quickLinks = $(monitor.obj( x, 'Quick Links' ).obj);
                linkID = $(monitor.obj( x, 'Details' ).obj).find('a:first')[0];
                
                addQuickLink( quickLinks, linkID, 'message', 'Message Log', 'message.jpg', 1 );
                
                /** Add Delete to all processes **/
                if( !monitor.value( x, "Run Status" ).match( /Hold|Queued|Cancel|Delete|Processing|Initiated/g ) && !isJob )
                    addQuickLink( quickLinks, linkID, 'delete', 'Delete', 'delete.png', 2 );
                
                var thisRunStatus = monitor.value( x, "Run Status" );
                switch( thisRunStatus )
                {
                    case "Cancelled":
                        if( monitor.value( x, "Distribution Status" ) == 'Posted' && !isJob )
                            addQuickLink( quickLinks, linkID, 'delete', 'Delete', 'delete.png', 2 );
                        canDoRefresh( thisRunStatus );
                        break;
                    case "Error":
                        if( monitor.value( x, "Distribution Status" ) != 'Posted' )
                            canDoRefresh( 'Unposted' );
                        canDoRefresh( thisRunStatus );
                        break;
                    case "Processing":
                        addQuickLink( quickLinks, linkID, 'cancel', 'Cancel', 'cancel.png', 3 );
                        canDoRefresh( thisRunStatus );
                        break;
                    case "Queued":
                        addQuickLink( quickLinks, linkID, 'cancel', 'Cancel', 'cancel.png', 3 );
                        addQuickLink( quickLinks, linkID, 'hold', 'Hold', 'stop.png', 4 );
                        canDoRefresh( thisRunStatus );
                        break;
                    case "Hold":
                        addQuickLink( quickLinks, linkID, 'cancel', 'Cancel', 'cancel.png', 3 );
                        addQuickLink( quickLinks, linkID, 'restart', 'Restart', 'restart.png', 4 );
                        canDoRefresh( thisRunStatus );
                        break;
                    case "No Success":
                        if( monitor.value( x, "Distribution Status" ) != 'Posted' )
                            canDoRefresh( 'Unposted' );
                        addQuickLink( quickLinks, linkID, 'restart', 'Restart', 'restart.png', 4 );
                        canDoRefresh( thisRunStatus );
                        break;
                    case "Initiated":
                        addQuickLink( quickLinks, linkID, 'cancel', 'Cancel', 'cancel.png', 3 );
                        canDoRefresh( thisRunStatus );
                        break;
                    case "Error":
                        if( monitor.value( x, "Distribution Status" ) != 'Posted' )
                            canDoRefresh( 'Unposted' );
                        canDoRefresh( thisRunStatus );
                        break;
                    case "Success":
                        canDoRefresh( thisRunStatus );
                        if( monitor.value( x, "Distribution Status" ) != 'Posted' )
                            canDoRefresh( 'Unposted' );
                        break;
                    case "Delete":
                        canDoRefresh( thisRunStatus );
                        break;
                }
                
                if( monitor.value( x, "Distribution Status" ) == 'Posted' && monitor.value( x, "Process Type" ) != 'PSJob'  )
                    addQuickLink( quickLinks, linkID, 'logs', 'View Logs', 'log.png', 4);
                    
                if( isJob && !monitor.value( x, "Run Status" ).match( /Hold|Queued|Cancel|Delete|Processing|Initiated/g )  )
                    addQuickLink( quickLinks, linkID, 'logs', 'View Logs', 'log.png', 4);
                
                /** Repost Content  **/
                if( monitor.value( x, "Distribution Status" ) == "Not Posted" )
                    addQuickLink( quickLinks, linkID, 'repost', 'Repost', 'repost.png', 4 );
            }
            
                
        };
    }
    
/*	PT8.53 Research
<iframe frameborder="0" id="ptModFrame_0" name="ptModFrame_0" src="http://fn92dmo.zanett.com/psc/fn92dmo/EMPLOYEE/ERP/c/PROCESSMONITOR.PROCESSMONITOR.GBL?ICType=Panel&amp;ICElementNum=0&amp;ICStateNum=17&amp;ICResubmit=1&amp;ICAJAX=1&amp;" width="1" height="1" style="width: 689px; height: 483px;"></iframe>

<iframe frameborder="0" id="ptModFrame_1" name="ptModFrame_1" src="http://fn92dmo.zanett.com/psc/fn92dmo/EMPLOYEE/ERP/c/PROCESSMONITOR.PROCESSMONITOR.GBL?ICType=Panel&amp;ICElementNum=0&amp;ICStateNum=18&amp;ICResubmit=1&amp;ICAJAX=1&amp;" width="1" height="1" style="width: 679px; height: 358px;"></iframe>

if a PT8.53 page then window.name like 'modWin0'

*/
    var createJobScroll = function()
    {
        var scrollName = 'PMN_PRCSLIST'
        var jobParent = $('#ACE_width tbody tr');
        $(jobParent[6]).hide();
        $(jobParent[5]).after( $('<tr><td colspan=2></td><td id="jobContainer" colspan=3 valign="top" alilgn="left"></td></tr>') );
        
        var jobTree = $('<table></table>')
            .attr({cellspacing:'0', 'class':'PSLEVEL1GRIDNBO', id: scrollName +'$scroll$0', cellpadding:2, cols:10, width:675})
            .appendTo( $('#jobContainer') );
            
        var jobTBody = $("<tbody><tr><td class='PSLEVEL1GRIDLABEL' colspan=12><table class='PSLEVEL1GRIDLABEL'><tr><td width='675'>Job Details</td></tr></table></td></tr></tbody>").appendTo( jobTree );
        
        jobTree.after( $("<p>&nbsp;</p>") );
        
        var headerContainer = $('<tr valign="center"></tr>').appendTo( jobTBody ); 
        
        var headers = ['Select','Instance','Seq.','Process Type','Process Name','User','Run Date','Run Status','Distribution Status','Details'];
        var hideColumns = ['Seq.','User','Run Date'];
        for( var x = 0; x < headers.length; x++ )
        {
            var thisColumn = $('<th scope="col" align="left" class="PSLEVEL1GRIDCOLUMNHDR"><a class="PSLEVEL1GRIDCOLUMNHDR" href="#">'+headers[x]+'</a></th>').appendTo( headerContainer );
            if( $.inArray(headers[x], hideColumns) > -1 )thisColumn.hide();
        }
        
    
        /***    Maybe we can just search page for <a>   **/
        var jobDataLinks = $($('#ACE_width')[0]).find('a');
        var rowNumber = 0;
        function addRow( row, data ){
            if( data.attr('class') == 'PSHYPERLINK' )
            {
                rowNumber++;
                var isJob = false;
                
                var thisRow = $('<tr vlaign="center"></tr>').appendTo(jobTree);
                
                function createColumn()
                {
                    return $('<td></td>')
                        .attr({
                            'class':   (rowNumber%2) === 0 ? 'PSLEVEL1GRIDEVENROW' : 'PSLEVEL1GRIDODDROW'
                            ,'nowrap': 'nowrap'
                            ,'height': '20'
                            ,'align':  'left'
                        })
                        .appendTo(thisRow);
                }
                function addSpan( v )
                {
                    if( v == '' )
                        v = '&nbsp;';
                    return $('<span></span>').html( v );
                }
                processData = data.html().match(/^(\d+) - ([a-zA-Z_0-9]+) (.*)/m);
                
                if( jobDataLinks[row-1].getAttribute( 'class' ) != 'PSHYPERLINK' )
                {
                    $(jobDataLinks[row-1]).appendTo( createColumn().html('<span> </span>') );  //  Select
                    isJob = true;
                } else {
                    createColumn().html( addSpan('') );                   //  Select
                }       
                createColumn().html( addSpan(processData[1]) );          //  Process Instance
                createColumn().html( addSpan('') ).hide();                       //  Seq.
                createColumn().html( addSpan(isJob ? 'Job':'Process')  ); //  Process Type
                createColumn().html( addSpan(processData[2]) );         //  Process/Job Name
                createColumn().html( addSpan('') ).hide();                       //  User
                createColumn().html( addSpan('') ).hide();                       //  Run Date
                createColumn().html( addSpan(processData[3]) );          //  Run Status
                createColumn().html( addSpan('N/A') );                     //  Distribution Status
                data.appendTo( createColumn() ).html('Details');
            }
        }
        for( var x =1; x < jobDataLinks.length; x++ )
        {
            addRow( x, $(jobDataLinks[x]) );
        }
    
        return;
        
        
        
    }
    this.doComponent = function(){
        this.doPage( thisURL.page )
    };
    this.doPage = function( pageName ){
        
        if( thisURL.page != 'PMN_PRCSLIST' && thisURL.page != 'PMN_PRCSLISTTREE' 
        )
		{
			cancelCountdown = true;
            messageAction();
			return;
		}
        /** Create Regular Process Grid ??? **/
        if( thisURL.page == 'PMN_PRCSLISTTREE' )
            createJobScroll();
        
        PSChrome.storage.removeItem( PSChrome.process_update );
        resetTimer = true;
        cancelCountdown = false;
        refreshButtonEvent();
		applyQuickLinks();
    };
    return this;
};

PSChrome.prototype.doProcessMonitor = function( contentObject )
{
    return;
	var resetTimer = false;
	var cancelCountdown = false;
	var timeLeft = PSChrome.def.proc_mon_refresh_time;

    kango.invokeAsync( 'kango.storage.removeItem', 'process_update' );
            
            
    var content = contentObject;
    var monitor = new PSChrome.prototype.scrollManager( 'PMN_PRCSLIST', 0 );
    //  TODO   Add Quicklinks and logs button  
    
    var url = new PSChrome.prototype.psftURL(document.location, document );
    addQuickLink = function( ql, lid, status, text, icon, position )
    {
        $(ql).attr({align:'left'});
        var thisStatus = status;
        s = monitor.addSpan( ql ).css({padding:'0px 7px 0px 0px'});
        if( $(ql).find('a').length > 0 )
            s.innerHTML += "&nbsp;";
        a = monitor.addLink( s ).html( icon ? '' : text ).click(function()
        {
			cancelCountdown = true;
            if( thisStatus == 'delete' || thisStatus == 'cancel' )
                if( !confirm("Are you sure you want to "+thisStatus+" this proceess?") )
                    return;
            kango.invokeAsync( 'kango.storage.setItem', 'process_update', thisStatus );
            window.location = lid.href;
        } );
        if( icon )
            $('<img></img>').attr({ src:PSChrome.iconBase + icon, title: text, border:0}).appendTo( a );
    }
        
	var reset, timeoutWaiter, doRefreshButtonWatcher, doRefresh, monitorStatuses;
    monitor.callback_0 = function()
    {
        
        monitorStatuses = monitorStatuses ? monitorStatuses.split(","):null;
        function canDoRefresh(statusValue){
            //monitorStatuses
            //doRefresh = true;
            //  Maybe this is to check of this status is in the list of statuses eligable for refreshes
        }
        
        //doRefresh = false;
        if( monitor.addHeader( 'Quick Links' ) )
        for( x in monitor.data )
        {
            if( monitor.obj( x, 'Instance' ).value != '&nbsp;' )
            {
                quickLinks = $(monitor.obj( x, 'Quick Links' ).obj);
                linkID = $(monitor.obj( x, 'Details' ).obj).find('a:first')[0];
                
                addQuickLink( quickLinks, linkID, 'message', 'Message Log', 'message.jpg', 1 );
                            
                /** Add Delete to all processes **/
                if( !monitor.value( x, "Run Status" ).match( /Hold|Queued|Cancel|Delete|Processing|Initiated/g ) )
                    addQuickLink( quickLinks, linkID, 'delete', 'Delete', 'delete.png', 2 );
                
                switch( monitor.value( x, "Run Status" ) )
                {
                    case "Cancelled":
                        if( monitor.value( x, "Distribution Status" ) == 'Posted' )
                            addQuickLink( quickLinks, linkID, 'delete', 'Delete', 'delete.png', 2 );
                        break;
                    case "Error":
                        break;
                    case "Processing":
                        addQuickLink( quickLinks, linkID, 'cancel', 'Cancel', 'cancel.png', 3 );
                        //canDoRefresh( 'cancel' );
                        doRefresh = true;
                        break;
                    case "Queued":
                        addQuickLink( quickLinks, linkID, 'cancel', 'Cancel', 'cancel.png', 3 );
                        addQuickLink( quickLinks, linkID, 'hold', 'Hold', 'stop.png', 4 );
                        doRefresh = true;
                        break;
                    case "Hold":
                        addQuickLink( quickLinks, linkID, 'cancel', 'Cancel', 'cancel.png', 3 );
                        addQuickLink( quickLinks, linkID, 'restart', 'Restart', 'restart.png', 4 );
                        break;
                    case "No Success":
                        if( monitor.value( x, "Distribution Status" ) != 'Posted' )
                            doRefresh = true;
                        addQuickLink( quickLinks, linkID, 'restart', 'Restart', 'restart.png', 4 );
                        break;
                    case "Initiated":
                        addQuickLink( quickLinks, linkID, 'cancel', 'Cancel', 'cancel.png', 3 );
                        doRefresh = true;
                        break;
                    case "Error":
                        break;
                    case "Success":
                        if( monitor.value( x, "Distribution Status" ) != 'Posted' )
                            doRefresh = true;
                        break;
                    case "Delete":
                        doRefresh = true;
                        break;
                }
                
                if( monitor.value( x, "Distribution Status" ) == 'Posted' && monitor.value( x, "Process Type" ) != 'PSJob'  )
                    addQuickLink( quickLinks, linkID, 'logs', 'View Logs', 'log.png', 4);
                
                /** Repost Content  **/
                if( monitor.value( x, "Distribution Status" ) == "Not Posted" )
                {
                    addQuickLink( quickLinks, linkID, 'repost', 'Repost', 'repost.png', 4 );
                }
            }
                
                
        };
            
        
        
        
    };
	
	
	
	/*
	refresh function runs outside of change monitor
	process to watch refreshButtonClick and make sure there is always an onclick event.
		maybe the monitor callback can add the button event addition
	*/
	
	
	var watchInit = false;
	var processingImg = $('#processing');
	var spinWatcher = function(start){
		if( start )
			watchInit = true;
		if( watchInit == false && processingImg.css('visibility')  == 'hidden' )
		{
			resetTimer = true;
			cancelCountdown = false;
			refreshButtonEvent();
			return;
		}
		if( watchInit == true && processingImg.css('visibility')  != 'hidden' )
			watchInit = false;
		setTimeout( spinWatcher, 100 );
	}
	var refreshButtonEvent = function(){
		$($('#REFRESH_BTN:first')[0]).click(function(){
			cancelCountdown = true;
			spinWatcher(true);
		});
	};
	var refreshWatcher = function(){
		setTimeout( refreshWatcher, 1000 );
		if( cancelCountdown == true || !doRefresh )
		{
			content.toolbar.message.html( "" );
			return;
		}
		var thisWatcher = this;
		timeLeft--;
		if( resetTimer == true ){
			timeLeft = PSChrome.def.proc_mon_refresh_time;
		}
		
		if( timeLeft < 0 )
		{
			var clickWait = function(){
				if( resetTimer == false )
					setTimeout( clickWait, 1000 );
			};
			content.toolbar.message.html( "Refreshing now ..." );
			clickWait();
			spinWatcher(true);
			simulate( $('#REFRESH_BTN:first')[0] , "click");
			return;
		}
		
		content.toolbar.message.html( "Refreshing in " + timeLeft + " seconds" );
		resetTimer = false;
	};
	PSChrome.storage.getItem( {name:'setting_proc_mon_refresh_time',name2:'setting_proc_mon_refresh_time2'}, function( data )
	{
		if( data.data )
			PSChrome.def.proc_mon_refresh_time = data.data;
        //  setting_proc_mon_refresh_enabled
        PSChrome.storage.getItem( {name:'setting_proc_mon_refresh_enabled',name2:'setting_proc_mon_refresh_enabled2'}, function( globalEnabled )
        {
            PSChrome.env.getItem( url, 'setting_proc_mon_refresh_enabled', function( localEnabled )
            {
                if ( localEnabled === false )
                    return;
                
                if( globalEnabled.data === false )
                {
                    if( !localEnabled )
                        return;
                }
                refreshWatcher();
            });
        });
	});
	monitor.callbacks = function()
    {
		resetTimer = true;
		cancelCountdown = false;
		monitor.callback_0();
    }
    
    PSChrome.env.getItem( url, PSChrome.procMonRefreshStatuses, function( data )
    {
        monitorStatuses = data;
        refreshButtonEvent();
        monitor.callbacks();
    });
    
    /***    Create Icons    **/
    var settingsDiv, refreshTimeSpan, settingsContainer;
    
    settings = content.toolbar.createIcon( 'gear.png', 'Settings' );
    
   
    /**********************************/
    /***    Settings Container      ***/
    settingsContainer = $("<div></div>").appendTo( content.toolbar.container );
    $('<div>Settings</div>').css({'background-color':'black','color':'white','padding':'10px', 'width': '100%'}).appendTo( settingsContainer );
    content.toolbar.settingsContainer = settingsContainer;
    settingsContainer.css({
        'display':'none'
        ,padding:'10px'
        ,'border-color':'#c0c0c0'
        ,'background-color':'#FFFFFF'
        ,'spacing':'25px'
        ,border:'2px'
        ,'border-style':'solid'
        ,width:'300px'
    });
    settingsContainer.hover( function(){}, function(){ settingsContainer.fadeOut('slow'); } );
    
    $(settings).click( function ()
    {
        settingsContainer.fadeIn('slow');
        //  TODO: Enable Change of Settings for quicklinks enabled, refresh time
        //  TODO: Button for auto-repost (should shutoff when done)
        
        if( !settingsDiv )
        {
            //console.log( toolbar.container );
            //settingsDiv = $('<div></div>').appendTo(settings);
            //refreshContainer = $('<p>Refresh Time: </p>').appendTo( settingsDiv );
            //refreshTimeSpan = $('<span>ttt</span>').appendTo( refreshContainer );
        };
        
    });
    
    var url = PSChrome.prototype.psftURL( document.location, document );
    
    PSChrome.storage.getItem( 'setting_proc_mon_refresh_time', function( data )
    {   
        h = $('<p></p>').appendTo( content.toolbar.settingsContainer );
        h.html( 'Auto-Refresh Time<br>' );
        if( data.data )
           refreshTime = data.data
        else 
           refreshTime = PSChrome.def.proc_mon_refresh_time;
        
        saveChange = function(){
            newTime = parseInt( inputData.val() <  PSChrome.def.proc_mon_refresh_min ? PSChrome.def.proc_mon_refresh_min : inputData.val() );
            PSChrome.storage.setItem('setting_proc_mon_refresh_time', newTime );
        }
        inputData = $('<input></input>').appendTo( h );
        inputData.prop({
            value: refreshTime
            , type: 'text'
            , size: '8'
            /** If other options are allowed then need to remove the auto-refresh on change **/
        }).change( function(){saveChange();$($('#REFRESH_BTN:first')[0]).click();} ).click(function(){this.select();}).keyup(saveChange);
        /*
        inputSave = $('<input></input>').prop({type:'button',value:'update'}).insertAfter( inputData );
        inputSave.click( saveChange );
        */
    });
    
    
    PSChrome.storage.getItem( 'setting_proc_mon_refresh_enabled', function( data )
    {
        h = $('<p></p>').appendTo( content.toolbar.settingsContainer );
        var enabled = true;
        if( data.data == false )
           enabled = data.data;
        var inputData = $('<input></input>').appendTo( h );
        var saveChange = function(){
            PSChrome.storage.setItem('setting_proc_mon_refresh_enabled', inputData.prop('checked') );
            $($('#REFRESH_BTN:first')[0]).click();
        }
        inputData.prop({
            value: 'Y'
            , type: 'checkbox'
        }).prop({
            checked: enabled ? 'checked' : '' 
        }).change( function(){saveChange();} );
        $( '<span>Auto-Refresh Enabled</span><br>' ).appendTo( h );
    });
    
    
    PSChrome.env.getItem( url, 'setting_proc_mon_refresh_enabled', function( data )
    {
        h = $('<p>Auto-Refresh (only this environment)<br></p>').appendTo( content.toolbar.settingsContainer );
        var enabled = true;
        if( data == false )
           enabled = data;
        var radio1 = $('<input></input>').appendTo( h ).attr({'class':'procMonLocal'});
        $("<span>On</span>").appendTo(h).css({width:'55px'});
        var radio2 = $('<input></input>').appendTo( h ).attr({'class':'procMonLocal'});
        $("<span>Off</span>").appendTo(h);
        var radio3 = $('<input></input>').appendTo( h ).attr({'class':'procMonLocal'});
        $("<span>use global</span>").appendTo(h);
        $('.procMonLocal').prop({type: 'radio' , name: 'enableProcRefresh[]'}).click(function(){
            if( url.toolsMajor >= 8.51 )
                document.location = document.location;
            else
                $($('#REFRESH_BTN:first')[0]).click();
        });
        radio1.click(function(){PSChrome.env.setItem( url, 'setting_proc_mon_refresh_enabled',true); }).prop({checked:data===true});
        radio2.click(function(){PSChrome.env.setItem( url, 'setting_proc_mon_refresh_enabled',false); }).prop({checked:data===false});
        radio3.click(function(){PSChrome.env.removeItem( url, 'setting_proc_mon_refresh_enabled'); }).prop({checked:typeof(data)=='undefined'});
    });
    
    PSChrome.env.getItem( url, PSChrome.procMonRefreshStatuses, function( data )
    {
        var statusList = PSChrome.statusList;
        var defaultSelected = PSChrome.def.procMonAutoRefresh;
        var p = $('<p></p>').html('Refresh on Process Statuses').appendTo( h );
        var selecor = $("<select multiple></select>")
            .attr({size:5})
            .change(function(){
                var options = "";
                for( x = 0; x < this.options.length; x++  )
                {
                    item = this.item(x);
                    if( item.selected === true )
                        options += ( options == '' ? '' : ',' ) + item.value;
                }
                PSChrome.env.setItem( url, PSChrome.procMonRefreshStatuses, options );
            })
            .appendTo( p );
        var options = !data ? defaultSelected : data.split(",");
        function addOption(id, value){
            optn = $("<option></option>").html(value).attr({value:id}).appendTo( selecor );
            if( $.inArray(id, options) > -1 )
                optn.attr({selected:'selected'});
        };
        for( x in statusList )
            addOption( x, statusList[x] );
        $('<input></input>').attr({type:'button',value:'reset'}).click(function(){
            PSChrome.env.removeItem( url, PSChrome.procMonRefreshStatuses );
            selecor.find('option').each(function(){
                if( $.inArray(parseInt($(this).val()), defaultSelected) > -1 )
                {
                    $(this).attr({selected:'selected'});
                } else {
                    $(this).removeAttr('selected');
                    }
            });
        }).appendTo( p );
    });
        
    /**********************************/
    this.doComponent = function(){
    };
    this.dopage = function( pageName ){
    };
    return this;
};

PSChrome.prototype.MSGBox = function(title)
{
    var Model = {};
    
    Model.body = $('<div></div>');
    Model.title = $('<p></p>').css({
        'font-size':'14px'
        ,'font-weight': 'bold'
        ,'padding': '4px 4px 4px 4px'
    }).html(title).appendTo(Model.body);
    
    
    return Model;
};


PSChrome.prototype.doProcessMonitorActions = function( contentObject )
{
    var content = contentObject;
    
    kango.invokeAsync('kango.storage.getItem', 'process_update', function(action)
    {
        setTimeout( function()
        {
            ok = $("input[id$='#ICSave']")[0];
            if( ok )
            {
                if( action != null )
                    PSChrome.storage.setItem( 'process_update', 'ok_button' );
                try{
                    switch( action )
                    {
                        case "message":
                            $('#PMN_DERIVED_MESSAGELOG_BTN:first')[0].click();
                            break;
                        case "logs":
                            $('#PMN_DERIVED_INDEX_BTN:first')[0].click();
                            break;
                        case "cancel":
                            $('#PMN_DERIVED_CANCELREQUEST:first')[0].click();
                            break;
                        case "hold":
                            $('#PMN_DERIVED_HOLDREQUEST:first')[0].click();
                            break;
                        case "delete":
                            $('#PMN_DERIVED_DELETEREQUEST:first')[0].click();
                            break;
                        case "restart":
                            $('#PMN_DERIVED_RESTARTREQUEST:first')[0].click();
                            break;
                        case "repost":
                            $('#PMN_DERIVED_RESENDCONTENT:first')[0].click();
                                ok.click();
                            break;
                        case "ok_button":
                            PSChrome.storage.removeItem( 'process_update' );
                            ok.click();
                            break;
                    }
                } catch(e){
                    if(debugEnabled)kango.console.log( 'Error trying to click radio button or processing request' );
                    PSChrome.storage.removeItem( 'process_update' );
                    ok.click();
                }
            }
        }, 500 );
    });
};


PSChrome.doHighlightFields = function() 
{
    var myURL = new PSChrome.prototype.psftURL(document.location, document );
    
    function doHighlight(e, info)
    {
        e = $(e);
        if( e.parent().prop('class').match(/input_field_container/gim) )
            return;
        var inputContainer = $('<span></span>');
        var infoBox, infoBoxContainer, infoBoxField, infoBoxValue, infoBoxOptions;
        var infoIcon = $('<img></img>')
            .prop('src',PSChrome.iconBase + 'info12.png')
            .attr('style','padding-right: 5px;')
            .prop('title','Field Information');
        
        if( !infoBox )
        {
            infoBox = $('<div></div>').mouseout( function( event ){this.style.display = 'none';} )
                .mouseover( function(){this.style.display = 'block';} )
                .appendTo( document.body )
                .prop('class','input_field_info_box');
            infoBoxField = $('<p style="white-space:nowrap;"></p>').appendTo(infoBox);
            infoBoxValue = $('<p></p>').appendTo(infoBox);
            infoBoxOptions = $('<p></p>').appendTo(infoBox);
        }
        function infoCopyBox( obj, v )
        {
            var value = v;
            var infoObject = obj;
            var copyLink = $('<a></a>').attr({href:"javascript:;",title:'copy to clipboard'}).click(function(){
                    kango.dispatchMessage( 'copyText', value );
                });
            $('<img></img').prop({src:kango.io.getResourceUrl( 'res/copy.png' )}).appendTo( copyLink );
            infoObject.html( infoObject.html() + "&nbsp;" );
            copyLink.appendTo( infoObject );
            
        };
        
        infoIcon.click( function()
        {
            $('.input_field_info_box').each(function(){this.style.display = 'none';});
            itemPosition = $(e).position();
            infoBox.attr( 'style', 'z-index:100;background-color:white;border-color:blue; border-style:solid; border-width:1px; padding:8px;display:block; position:absolute; top:' + (itemPosition.top+10) + ';left:' + (itemPosition.left-20) + ';');

            if( e.type )
                if( e.type == 'checkbox' )
                {
                    onCheckValue = e.getAttribute('onclick');
                    if( m = onCheckValue.match( /\(this\.checked\?'.*':'.*'\);/gim ) )
                        info.value = eval("{"+m[0].replace('this.','e.')+"}");
                }
            
            infoBoxField.html("<b>Field</b>: " + info.field);
            infoCopyBox( infoBoxField, info.field );
            infoBoxValue.html("<b>Value</b>: " + info.value);
            infoCopyBox( infoBoxValue, info.value );
            infoBoxOptions.css('display', info.options ? 'block' : 'none');
            if( info.options )
            {
                infoBoxOptions.html("<b>Options:</b><br/>");
                for( var x = 0; x < info.options.length; x++ )
                {
                    if( info.options[x].value != '' || info.options[x].innerHTML.toString().replace(" ", '').replace("&nbsp;", '') != '' )
                        infoBoxOptions.html( infoBoxOptions.html() + info.options[x].value + ": " + info.options[x].innerHTML + "<br/>" );
                }
            }
            
        });
        infoIcon.appendTo(inputContainer)
        //inputContainer.setAttribute('style', 'border-color:red; border-style:dashed; border-width:1px; padding:2px;width:' + (e.getWidth()+40) + 'px;white-space:nowrap;' );
        inputContainer.attr({'style': 'width:' + (e.width()+40) + 'px;white-space:nowrap;' });
        inputContainer.attr({'class': 'input_field_container'});
        $(inputContainer).insertAfter(e);
        e.appendTo( inputContainer )
    }
        
    function processSnapshot( snapshot )
    {
        numItems = snapshot.snapshotLength - 1;
        for ( var i = numItems; i >= 0; i--)
        {
            try{
                item = $(snapshot.snapshotItem(i));
                if( item.find('.input_field_container').length > 0 )
                    continue;
                 
                /********************************************************/
                /** Find all spans with fields that aren't input items **/
                fieldNameMatch = /<!--\s([a-zA-Z0-9_]+)([\$\d\s])+-->/gim
                fieldNameFilter = /<!--\s([a-zA-Z0-9_]+)([\$\d\s])+-->/m
                if (item.html().match(fieldNameMatch) )
                {
                    
                    m = item.html().match(fieldNameFilter);
                    if( item.find('span:first').length > 0 )
                    if( span = item.find('span:first')[0] )
                    {
                        doHighlight(span, {field : m[1], value : span.innerHTML});
                    }
                }
                /********************************************************/
                fieldNameMatch = /([a-zA-Z0-9_]+)([\$\d\s])+/gim
                fieldNameFilter = /([a-zA-Z0-9_]+)([\$\d\s])+/m
                if (item.id )
                {
                    if( item.id.match( fieldNameMatch ) )
                    {
                        if( m = item.id.match(fieldNameFilter) )
                            doHighlight(item, {field : m[1], value : item.innerHTML});
                    }
                }
                /********************************************************/
                /** Find all inputs/selects that are withing TD tags * */
                if( inputs = item.find('input') )
                {
                    if( inputs.length > 0 )
                    {
                        for( n = 0; n < inputs.length; n++ )
                        {
                            inputField = inputs[n];
                            if( inputField.type == 'hidden' )
                                continue;
                            doHighlight(inputField, {field : inputField.name, value: inputField.value});
                        }
                    }
                }
                /********************************************************/
                /** Find all inputs/selects that are withing TD tags * */
                if( inputs = item.find('select') )
                {
                    if( inputs.length > 0 )
                    {
                        for( n = 0; n < inputs.length; n++ )
                        {
                            inputField = inputs[n];
                            doHighlight(inputField, {field : inputField.name, value: inputField.options[inputField.selectedIndex].value, options: inputField.options});
                        }
                    }
                }
                /********************************************************/
                
                /********************************************************/
                /** Find all inputs/selects that are withing TD tags * */
                if( inputs = item.find('.PSPUSHBUTTON') )
                {
                    if( inputs.length > 0 )
                    {
                        for( n = 0; n < inputs.length; n++ )
                        {
                            inputField = inputs[n];
                            doHighlight(inputField, {field : inputField.name, value: inputField.options[inputField.selectedIndex].value, options: inputField.options});
                        }
                    }
                }
                
                /********************************************************/
                continue;
                
                if( inputs = item.find('input') )
                {
                    if( inputs.length === 0 )
                        continue;
                    for( i in inputs )
                    {
                        input = inputs[i];
                        if( input.type == 'hidden' || !input.id )
                            continue;
                        idFind = /([a-zA-Z0-9_]+)([\$\d])/m;
                        if( input.id.match( idFind ) != null )
                        {
                            doHighlight(input, {field: input.id.match( idFind )[1],value: input.value});
                        }
                    }
                }
            } catch( tryCatch )
            {
            }
        }
    }

    snapShots = [
        "//td/div[span|input|select]"
        ,"//td[span|input|select]"
        ,"//td/span/a"
        ,"//span[input]"
    ];
    for( s = 0; s < snapShots.length; s++ )
    {
        try{
            processSnapshot( document.evaluate(snapShots[s], document.body, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null) );
        } catch( te ){
        }
    }
    
    //console.log( "Need action here.  Shouldn't this be somewhere else " );
    return;
};

PSChrome.prototype.doToolbar = function( URL )
{
    var newWindowButton, fieldInfoButton, pageInfoButton, logButton, pageRefreshButton;
    var clickStatus, hasHighlighted, fieldInfoIMG;
    var pageBar = function(){ 
           return document.getElementById( 'PAGEBAR' ) 
               || document.getElementById( 'PAGECONTAINER' ) 
               || document.getElementById( 'win' + URL.window +'divPAGEBAR' )
               || document.getElementById( 'win' + URL.window +'PSPAGECONTAINER' );	 
       };
    var Toolbar = $( '<div></div>' ).css({
        'position': 'fixed'
        ,'top': '0px'
        ,'left': '10px'
        ,'z-index': '9999'
        ,'background-color': '#FFFFFF'
        ,'padding': '0px 0px 0px 5px'
    }).appendTo( pageBar() );
		
    function reaplyToolbar(){
        if( !Toolbar.parent()[0] )
            Toolbar.appendTo( pageBar() );
        setTimeout( reaplyToolbar, 100 );
    }
    reaplyToolbar();
	
	
	var myCheck = setInterval(function()
	{
		if( !$(pageBar()).find( Toolbar ).length )
		{
			Toolbar.appendTo( pageBar() );
			/**	Reset Highligh Status on tab changes	**/
			clickStatus = false;
			$($(fieldInfoButton[0]).find('img:first')[0]).prop('src', PSChrome.iconBase + ( clickStatus ? 'pen_red.png' : 'pen_blue.png' ) );
		}
	}, 500);

	console.log( 'test3' );
    
    var toolbar = {};
    toolbar.container = Toolbar;
    toolbar.createIcon = function( src, title )
    {
    	console.log( 'test' );
        var item = $( '<a></a>' ).attr( {'style': 'padding-right:10px'} );
        var img = $('<img></img>').attr('src', PSChrome.iconBase + src ).appendTo( item );
        if( title )
            img.attr('title', title );
        item.appendTo( Toolbar );

    	console.log( 'test2' );
        return item;
    }
	console.log( 'test4' );
    
    /*********************************/
    /***    Field Information       **/
    refreshButton = function()
    {
        if( clickStatus == true )
            fieldInfoButton.click();
        hasHighlighted = false;
    };
    fieldInfoButton = $(toolbar.createIcon( 'pen_blue.png', 'Field Information' )).click( function()
    {
		var fielInfoButtonFunction = this;
        clickStatus = clickStatus ? false : true;
		
        /*
		function highlighterButton()
		{
			console.log( 'highlighterButton' );
			searchClass = !clickStatus ? 'input_field_container' : 'input_field_container_hide';
			newClassValue = clickStatus ? 'input_field_container' : 'input_field_container_hide';
			if( clickStatus )
				PSChrome.doHighlightFields();
			$( 'span.' + searchClass ).each(function(){$(this).prop('class',newClassValue);});
		}
        */
		/*
		var	clickFunc;
		clickFunc = function()
		{
			console.log( 'PSHYPERLINK click' );
			//clickStatus = clickStatus ? false : true;
			
			pageChange = new $.itemMonitor();
			pageChange.setTime( 200 );
			pageChange.monitor( 'add', function()
			{ 
				console.log( 'looking for body' );
				return $('body:first').html().replace(/\s(class=.*)[\s>]/gi, '' );
			}, function()
			{
				console.log( 'stopped' );
				pageChange.monitor( 'stop' );
				
				console.log( 'clickStatus: ' + clickStatus );
				if( clickStatus )
					PSChrome.doHighlightFields();
				//fielInfoButtonFunction.click();
				console.log( $('.PSHYPERLINK') );
				$('.PSHYPERLINK').click( function(){clickFunc();} );
			});
			};
		$('.PSHYPERLINK').click( function(){clickFunc();} );
		*/
        if( !hasHighlighted )
        {
            fieldInfoIMG = $(fieldInfoButton[0]).find('img:first');
            var style = $('<style>.input_field_container { border-color:red;  border-style:dashed;  border-width:1px;  padding:2px; } .input_field_container_hide img  { display:none; }</style>').appendTo($('html > head'));
        } else {
			searchClass = !clickStatus ? 'input_field_container' : 'input_field_container_hide';
			newClassValue = clickStatus ? 'input_field_container' : 'input_field_container_hide';
			$( 'span.' + searchClass ).each(function(){$(this).prop('class',newClassValue);});
        }
		
        if( clickStatus )
			PSChrome.doHighlightFields();
        fieldInfoIMG.prop('src', PSChrome.iconBase + ( clickStatus ? 'pen_red.png' : 'pen_blue.png' ) );
        hasHighlighted = true;
        $('#REFRESH_BTN').click(refreshButton);
        
    });
    /*********************************/
    
    //  TODO: Page Information
    var pageInfoContainer, infoPage, infoComponent, infoMenu, myURL;
	myURL = new PSChrome.prototype.psftURL(document.location, document );
	
    pageInfoButton = $(toolbar.createIcon( 'info.png', 'Page Information' )).click( function()
    {
        if( !pageInfoContainer)
        {
            pageInfoContainer = $("<div><p><b>Page Information</b></p></div>").appendTo( toolbar.container );
            pageInfoContainer.css({
                'display':'none'
                ,padding:'2px'
                ,'background-color':'#9ee874'
                ,'white-space':'nowrap'
            });
            pageInfoContainer.hover( function(){}, function(){ pageInfoContainer.fadeOut('slow'); } );
            pageInfoContainer.bind( function(){
                if(debugEnabled)kango.console.log( 'bind evnet...' );
                if(debugEnabled)kango.console.log( this );
            });
            //myURL = new PSChrome.prototype.psftURL(document.location, document );
            h = "<p><b>Component</b>: <span id='infoComponent'>" + myURL.component + "</span></p>";
            h += "<p><b>Page</b>: <span id='infoPage'>" + myURL.page + "</span></p>";
            h += "<p><b>Menu</b>: <span id='infoMenu'>" + myURL.menu + "</span></p>";
            if( myURL.user ) h += "<p><b>User</b>: " + myURL.user + "</p>";
            h += "<p><b>Market</b>: " + myURL.market + "</p>";
            h += "<p><b>Path</b>: " + myURL.path + "</p>";
            h += "<p><b>Tools</b>: " + myURL.tools + "</p>";
            h += "<p><b>App Server</b>: " + myURL.app + "</p>";
            h += "<p><b>Web Server</b>: " + myURL.web + "</p>";
			
			if( !myURL.page ){
				h += "<p style='color:red'><b>Error</b>:  PSChrome was unable to gather all the information it needed. " 
				+"<ul>"
				+"<li>Please navigate to PeoleTools -> Web Profile -> Web Profile Configuration</li>"
				+"<li>Search for your environment</li>"
				+"<li>Go to the 'Debugging' tab</li>"
				+"<li>Check 'Show Connection & Sys Info' checkbox</li>"
				+"<li>Save and restart application server</li>"
				+"</ul></p>";
			}
			
            //pageInfoContainer.css('white-space','nowrap');
            //pageInfoContainer.html( '<p><b>Page Information</b></p>' );
            $('<div></div>').html(h).appendTo(pageInfoContainer).css({
                    'background-color':'white'
                    ,padding: '2px'
                    });
			infoComponent = $('#infoComponent');
			infoPage = $('#infoPage');
			infoMenu = $('#infoMenu');
            
            /*
            var copyLink = $('<a></a>').attr({href:"javascript:;"}).click(function(){
                    kango.dispatchMessage( 'copyText', $('#infoPage').html() ).after( $('#infoPage') );
                });
            $('<img></img').prop({src:kango.io.getResourceUrl( 'res/copy.png' )}).appendTo( copyLink );
            $('#infoPage').after(copyLink);
            */
            
            function addCopyLink( infoField )
            {
                var infoObject = $('#'+infoField);
                var copyLink = $('<a></a>').attr({href:"javascript:;",title:'copy to clipboard'}).click(function(){
                        kango.dispatchMessage( 'copyText', infoObject.html() ).after( $('#infoPage') );
                    });
                $('<img></img').prop({src:kango.io.getResourceUrl( 'res/copy.png' )}).appendTo( copyLink );
                //infoObject.html( infoObject.html() + "&nbsp;" );
                infoObject.after( $("<span>&nbsp;</span>") );
                infoObject.after(copyLink);
            };
            
            addCopyLink( 'infoComponent' );
            addCopyLink( 'infoPage' );
            addCopyLink( 'infoMenu' );
            
            
            //<a href='javascript:;'><img src='"+kango.io.getResourceUrl( 'copy.png' )+"'>
            
            
        } else {
			infoPage.html( myURL.page );
			infoComponent.html( myURL.component );
			infoMenu.html( myURL.menu );
		}
        pageInfoContainer.fadeIn('slow');
    });
    
    //  TODO Log Button
    /*
    logButton = $(toolbar.createIcon( 'log.png',  'Trace Logs' )).click( function()
    {
        window.open( 'http://www.melban.me/chrome/PSChrome/logs.htm', '_blank' );
    });*/
    
    
    
    /** No Timeout Refresh Button  **/
    var refreshButton;
    var noTimeoutStatus = false;
    /*  The idea is to refresh before the timeout warning shows up.  
		This can be done by finding the warningTimeoutMilliseconds setting and doing a 
			refresh 20 seconds before that happens
		Only show the status message of refreshing within 60 seconds of that refresh 
			that way someone can turn it off if they want
	var  totalTimeoutMilliseconds = 1200000; 
	var  warningTimeoutMilliseconds = 1080000; 
	*/
    
    function getRefreshButton(){ return $( "input[name$='REFRESH_BTN'], input[id$='#ICRefresh']" )[0] };
    
	var doRefreshButtonStatus = function( change )
	{
        var callbackFunction = function(data)
		{
			if( change )
			{
				noTimeoutStatus = true;
				if( data )
					noTimeoutStatus = data == true ? false : true;
				PSChrome.env.setItem( myURL, PSChrome.noTimeoutID, noTimeoutStatus );
				if( noTimeoutStatus == true )
                {
                    
					if( getRefreshButton() )
                    {
                        if( toolbar.message )
                            toolbar.message.html( ' ' );
						getRefreshButton().click();
                    }
                }
			} else {
				noTimeoutStatus = data;
				setTimeout( doRefreshButtonStatus, 1000 );
			}
			refreshButtonIMG = $(pageRefreshButton[0]).find('img:first');
			refreshButtonIMG.prop('src', PSChrome.iconBase + ( noTimeoutStatus ? 'refresh-green.png' : 'refresh-red.png' ) );
			refreshButtonIMG.attr('title', 'Timeout Evasion ' + ( noTimeoutStatus ? '[ON]' : '[OFF]' ) );
		};
		PSChrome.env.getItem( myURL, PSChrome.noTimeoutID , callbackFunction );
	}
    //  If no refresh buttons can we add a link and do "javascript:submitAction_win4(document.win4, '#ICRefresh');
    
	pageRefreshButton = $(toolbar.createIcon( 'refresh-red.png', "" )).click( function(event){doRefreshButtonStatus(true);});
    doRefreshButtonStatus(false);
                
    if( myURL.toolsMajor >= 8.52 || getRefreshButton() )
        doRefreshButtonStatus();
	

	var notificationTimeOrig = notificationTime = 30;
	//	PT8.52.11 has it in body ???	M = document.getElementsByTagName( "head" )[0].innerHTML.match(/warningTimeoutMilliseconds.*\s(\d+);/m );
	M = document.getElementsByTagName( "head" )[0].innerHTML.match(/warningTimeoutMilliseconds.*\s(\d+);/m )
		||document.getElementsByTagName( "body" )[0].innerHTML.match(/warningTimeoutMilliseconds.*\s(\d+);/m );
	if( M && M[1] )
	{
		var timeoutSeconds = M[1] - ( 60 * 1000 );
		//var timeoutSeconds = 150000 - ( 60 * 1000 );
		function doRefreshEvaluation()
		{
            if( toolbar.message )
                toolbar.message.html( ' ' );
            var notificationTimeOrig;
			var notificationTime = notificationTimeOrig = 30;
			setTimeout( function(){
				PSChrome.env.getItem( myURL, PSChrome.noTimeoutID, function(data)
				{
					if( data == true )
						if( getRefreshButton() )
							getRefreshButton().click();
				});
			}, timeoutSeconds );    //  This is 60 seconds before the timeout
            if(debugEnabled)kango.console.log( "Do restart in " + (timeoutSeconds/1000) + " Seconds which is 60 before the timeout");
            
			setTimeout( function(){
				PSChrome.env.getItem( myURL, PSChrome.noTimeoutID, function(data)
				{
					if( data == true )
					{
						function refreshMessage()
						{
							notificationTime--;
                            if( getRefreshButton() ){
                                toolbar.message.html( 'Timeout Evasion in ' + (notificationTime) + ' seconds' );
                            } else {
                                return;
                            }
							if( notificationTime > 0 )
								setTimeout( refreshMessage, 1000 );
							else
							{
                                toolbar.message.html( 'Timeout Evasion now' );
								if( myURL.toolsMajor >= 8.50 )
								{
									setTimeout( doRefreshEvaluation, timeoutSeconds - ( notificationTimeOrig * 1000 ) );
									return;
								}
							}
						}
						refreshMessage();
					}
				});
			}, timeoutSeconds - ( notificationTime * 1000 ) );
            if(debugEnabled)kango.console.log( 'refresh notification starts in ' + ((timeoutSeconds - ( notificationTime * 1000 ) ) /1000 ) + " seconds" );
			
		}
        if( myURL.toolsMajor >= 8.52 || getRefreshButton() )
            doRefreshEvaluation();
		
	}
    
    /** Global Favorites  **
    var globalFavoriteButton = $(toolbar.createIcon( 'favorite.png', "Global Favorite" )).click( function(event)
    {
        PSChrome.storage.setItem( PSChrome.globalFavoritesTemp, myURL );
        kango.invokeAsync( 'kango.ui.optionsPage.open', 'tabs-global-favorites' );
        return;
    });*/
    
    var settings = toolbar.createIcon( 'gear.png', 'Settings' );
    $(settings).click( function ()
    {
        PSChrome.storage.setItem( PSChrome.optionsPageChange, myURL.id );
        kango.invokeAsync( 'kango.ui.optionsPage.open', 'tabs-environments' );
        
    });
    
    /** New Window  **/
    newWindowButton = $(toolbar.createIcon( 'note.png', "New Window\nCtrl-Click for component only" )).click( function(event)
    {
        window.open( new PSChrome.prototype.psftURL( document.location, document ).newWinURL(!event.ctrlKey), '_blank' );
    });    
    
    toolbar.message = $('<div></div>').attr({'id':'toolbarMessage'}).css(
    {
        'position':'relative'
        ,'float':'right'
        ,'color':'#47070C'
        ,'font-weight':'bold'
    }).html('').appendTo( Toolbar );
    
    return toolbar;
};

PSChrome.prototype.doTimeoutWarning = function()
{
    //alert('closing');
    $('a:first').click();
    
};



PSChrome.prototype.initBackground = function()
{
   var background = this;
   debugEnabled = kango.storage.getItem( PSChrome.debugEnabled );
    if(debugEnabled)kango.console.log( 'PSChrome Background Process Started' );
    /*
    if(debugEnabled)kango.console.log( "Extension '" + kango.getExtensionInfo().name + "' Background Ready");
    kango.browser.addEventListener(kango.browser.event.BeforeNavigate, function(event) {
        if(debugEnabled)kango.console.log('before Nav');
    });
    kango.browser.addEventListener(kango.browser.event.TabChanged, function(event) {
        if(debugEnabled)kango.console.log('tab change');
    });
    */
    

    /****************************************************/
    /**	Global Favorites Functions
    /****************************************************/
    

    if( kango.browser.getName() == 'chrome' )
    {
		console.log( 'get chrome.storage' );
		if(chrome.storage )
		{
			/*
			console.log( 'both set ' );
			chrome.storage.sync.get( 'test2', function(data){
				kango.console.log( 'testValue return' );
				kango.console.log( data );
				
				chrome.storage.sync.set( {test2:'test2 value'} , function(){
					console.log( "Sync set() complete" );
				});
			});
			*/
		}
    }
    
    /****************************************************/
    
    
    $('<textbox></textbox>').attr({id:'copyTextArea'}).appendTo( document.body );
    kango.addMessageListener( 'copyText', function( value )
    {
        switch( kango.browser.getName() )
        {
            case "firefox":
                const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper);
                gClipboardHelper.copyString(value.data);
                break;
            case "chrome":
                document.contentEditable = true;
                $('#copyTextArea').html(value.data).focus().select();
                document.execCommand('selectall');
                document.execCommand('copy');
                break;
        }
    });
    kango.addMessageListener( 'envRemoveItem', function(data)
    {
        data = data.data;
        env = kango.storage.getItem( PSChrome.envURLListID); 
        if( env[data.url.id] )
        {
            delete env[data.url.id][data.name];
            kango.storage.setItem(PSChrome.envURLListID,env);
        }
    });
    kango.addMessageListener( 'envSetItem', function( data )
    {
        data = data.data;
        env = kango.storage.getItem( PSChrome.envURLListID); 
        if( env[data.url.id] )
        {
            env[data.url.id][data.name] = data.value;
            kango.storage.setItem(PSChrome.envURLListID,env);
        } else {
            if(debugEnabled)kango.console.log(  "Trying to set " + data.name + " but doesn't exists for " + data.url.id );
        }
    });
    kango.addMessageListener( 'setItem', function( event )
    {
        kango.storage.setItem( event.data.name, event.data.value ); 
    });
    kango.addMessageListener( 'getItem', function( event )
    {
        try
        {
            name = event.data.name || event.data;
            dispatchName = event.data.name2 || event.data;
            event.target.dispatchMessage( dispatchName, kango.storage.getItem( name ) );
        } catch(e){
            if(debugEnabled)kango.console.log( 'Exception sending item' );
            if(debugEnabled)kango.console.log( e.toString() );
        };
    });
    
    var tabCrossDomain = {};
    kango.addMessageListener( 'setCrossDomain', function(event)
	{
    	var tabid = event.target.getId();
		if( debugEnabled )
			kango.console.log( 'Set tabid: ' + tabid + ' = ' + event.data.domain );
    	tabCrossDomain[tabid]  = event.data.domain;
	});
    kango.addMessageListener( 'getCrossDomain', function(event)
	{
		var tripCounter = 0;
		var timer = 20;
    	var tabid = event.target.getId();
    	var sendCrossBack = function()
    	{
			tripCounter++;
	    	if( tabCrossDomain[tabid] )
				event.target.dispatchMessage( 'sendCrossDomain', tabCrossDomain[tabid] );
	    	else
	    		setTimeout( function(){
	    				sendCrossBack();
	    		}, timer );
			//console.log( 'getCrossDomain');
			if( tripCounter > 100 )
			{
				timer = timer*2;
				tripCounter = 0;
				//console.log( timer );
			}
    	}
    	sendCrossBack();
	});
	/*
    kango.browser.addEventListener(kango.browser.event.TAB_REMOVE, function(event)
	{
	    tabCrossDomain[event.target.getId()] = 'remove';
		
	});
	*/
	
	
/*	var env_list = kango.storage.getItem( PSChrome.envURLListID ) || {};
	if( env_list )
	{
		for( env in env_list )
		{
			thisEnv = env_list[env];
			checkForPSChromeAppPackage(thisEnv, env );
			new PSChrome.prototype.BackgroundMonitor( thisEnv );
		}
	}*/
	
    kango.browser.addEventListener(kango.browser.event.DOCUMENT_COMPLETE, function(event)
    {
        var myURL = new PSChrome.prototype.psftURL( event.url );
        var env_list = kango.storage.getItem( PSChrome.envURLListID ) || {};
        //console.log( JSON.stringify( env_list ) );

        function updateENV()
        {
            env_list[myURL.id] = {
                'type' : 'tab'
                ,'method' : myURL.method
                ,'domain' : myURL.domain
                ,'port' : myURL.port
                ,'uri' : 'psp'
                ,'node' : myURL.node
                ,'portal' : myURL.portal
                ,'portal2' : myURL.portal2
                ,'db' : myURL.db
                ,'data':    {'tab':'DEFAULT'}
                ,'name': myURL.name || myURL.node
                ,'id': myURL.id
            };
            kango.storage.setItem( PSChrome.envURLListID, env_list );
        }
        if( !env_list[myURL.id] )
        {
            if( myURL.portal && myURL.portal2 )
            {
                myURL.name = myURL.node;
                updateENV();
                //  new PSChrome.prototype.BackgroundMonitor( myURL );
            }
        } else if( !env_list[myURL.id].id )
        {
			//	TODO: Check if there are issues with portal2 or other data and correct URL
            updateENV();
        }
    });
    
    /** Context Menu item   **/
    kango.ui.contextMenuItem.addEventListener(kango.ui.contextMenuItem.event.CLICK, function(e,e2) {
        
        if( e.srcUrl ){
            URL = new PSChrome.prototype.psftURL( e.srcUrl )
            PSChrome.storage.setItem( PSChrome.optionsPageChange, URL.id );
            kango.ui.optionsPage.open('tabs-environments');
            //  TODO:  Since this is a background script we could determine the current tab
        } else {
            kango.ui.optionsPage.open();
        }
    });
    
    if( !kango.storage.getItem(PSChrome.showPopupNotification) )
	{
    	kango.ui.browserButton.setBadgeValue( "!" );
	}


    return;
    if( !kango.storage.getItem('DEV' ) )
        return;
    PSChrome.BackGroundMonitorObject = new PSChrome.prototype.BackGroundMonitorObject();
    
    
    /************************************************************************************************/
    /** Look an environment lists and see if any have PSChrome WEBLIB Turned On Installed    
    /** Needs to be turned on on the environments POPUP lists  
    /************************************************************************************************/
    
    /**
        For pulling logs we should also account for multiple app servers.  
        How do we pull those and how do we account for multiple domains on those servers
    **/
    
    var weblibTimer =  1 * 60 * 1000;    // (z minutes) x (60 seconds) x (1000 milliseconds)
    
    var sendIBRequest = function( env )
    {
        
    }
    
    var PSChromeWeblib = function()
    {
        if(debugEnabled)kango.console.log( "Start background PSChrome WEBLIB process check" );
        
        var env_list = kango.storage.getItem( PSChrome.envURLListID );
    
        function checkForPSChromeAppPackage( thisEnvObj, envID )
        {
            if(debugEnabled)kango.console.log( thisEnvObj );
            if( thisEnvObj.node == 'hrdev' || thisEnvObj.PSChromeIBEnabled )
            {
                var thisEnvName = thisEnvObj.name;
                
                var request = $.ajax({
                    type: "POST"
                    ,url: thisEnvObj.method + '://' + thisEnvObj.domain + ":" + thisEnvObj.port + '/PSIGW/HttpListeningConnector'
                    ,headers: {
                        'From': (thisEnvObj.IB_NODE || 'ANONYMOUS')
                        ,'MessageName': 'PSCHROME.v1'
                        ,'MessageType': 'Sync'
                    }
                    ,data: '<?xml version="1.0"?><PSCHROME request=\'INFO\'></PSCHROME>'
                }).done(function( msg )
                {
                    if(debugEnabled)kango.console.log( msg.getElementsByTagName('PSCHROME') );
                    if( msg.getElementsByTagName('PSCHROME').length )
                    {
                        thisEnvObj[PSChrome.envPSChromeAppPackageID] = true;
                        env_list[envID] = thisEnvObj;
                        kango.storage.setItem( PSChrome.envURLListID, env_list );
                    }
                });
            }
        }
        
        if( env_list )
        {
            for( env in env_list )
            {
                thisEnv = env_list[env];
                checkForPSChromeAppPackage(thisEnv, env );
                new PSChrome.prototype.BackgroundMonitor( thisEnv );
            }
        }
        setTimeout( PSChromeWeblib, weblibTimer );
    };
    //PSChromeWeblib();
    /************************************************************************************************/
    
}


PSChrome.badgeMonitor = (function(){
    function updateCounters()
    {
        var errors = 0;
        errors += PSChrome.BackGroundMonitorObject.errors
        kango.ui.browserButton.setBadgeValue( errors );
        setTimeout( updateCounters, 1000 );
    }
    setTimeout( updateCounters, 100 );
    
});
PSChrome.prototype.BackGroundMonitorObject = function(){
    var self = this;
    self.errors = 0;
    this.updateCount = function(i)
    {
        self.errors += i;
    };
    PSChrome.badgeMonitor();
    
};



PSChrome.prototype.BackgroundMonitor = function( environment )
{
    if(debugEnabled)kango.console.log( "Start background PSChrome WEBLIB process check" );
    var env = environment;
    env.IBerrorCount = 0;
    var weblibTimer =  PSChrome.def.weblibTimer * 60 * 1000;    // (z minutes) x (60 seconds) x (1000 milliseconds)
    var weblibTimerRetry =  PSChrome.def.weblibTimerRetry * 60 * 1000;    // (z minutes) x (60 seconds) x (1000 milliseconds)
        
    var thisEnvName = env.name;
    function updateENV()
    {
        var env_list = kango.storage.getItem( PSChrome.envURLListID ) || {};
        env_list[env.id] = env;
        kango.storage.setItem( PSChrome.envURLListID, env_list );
    }
    
    function processMessage( msg )
    {
        /** Message Monitor **/
        var Errors = false;
        if( env[PSChrome.envPSChromeAppPackageIDIBEnabled] == true )
        {
            Errors = msg.getElementsByTagName( 'MESSAGE_MONITOR' )[0].getElementsByTagName( 'ERRORS' )[0];
            if( Errors )
            {
                Messages = Errors.getElementsByTagName('message');
                newErrorCount = 0;
                for( x = 0; x < Messages.length; x++ )
                {
                    newErrorCount =+ Messages[x].getAttribute('count');
                }
                PSChrome.BackGroundMonitorObject.updateCount( newErrorCount - env.IBerrorCount );
                env.IBerrorCount = newErrorCount;
            }
        }
        if( !Errors )
        {
            PSChrome.BackGroundMonitorObject.updateCount( 0 - env.IBerrorCount );
            env.IBerrorCount = 0;
        }
        updateENV();
    }
    
    var doUpdate = function()
    {
        var request = $.ajax({
            type: "POST"
            ,url: env.method + '://' + env.domain + ":" + env.port + '/PSIGW/HttpListeningConnector'
            ,headers: {
                'From': (env.IB_NODE || 'ANONYMOUS')
                ,'MessageName': 'PSCHROME.v1'
                ,'MessageType': 'Sync'
            }
            ,data: '<?xml version="1.0"?><PSCHROME request=\'INFO,MESSAGE_MONITOR\'></PSCHROME>'
        }).done(function( msg, x )
        {
            env[PSChrome.envPSChromeAppPackageIDResponse] = request.responseText;
            if( msg.getElementsByTagName('PSCHROME').length )
            {
                if( env[PSChrome.envPSChromeAppPackageID] == true )
                {
                    if(debugEnabled)kango.console.log( env.id + ' has PSChrome Background Services installed' );
                    env[PSChrome.envPSChromeAppPackageID] = true;
                    setTimeout( doUpdate, weblibTimer );
                    processMessage( msg );
                } else {
                    if(debugEnabled)kango.console.log( 'Installed but not enabled' );
                }
            } else {
                if(debugEnabled)kango.console.log( env.id + ' Does not have PSChrome Background Services installed' );
                env[PSChrome.envPSChromeAppPackageID] = false;
                setTimeout( doUpdate, weblibTimerRetry );
            }
            
            updateENV();
        });
    }
    
    doUpdate();
};

PSChrome.prototype.watchFavorites = function( content )
{
    var favItemName = content.url.id + '_favorites';
    var sendFavs = function( favs ){kango.dispatchMessage('setItem',{name:favItemName,value:favs});};
    highlightNavDrilldownPage = function()
    {
        if( content.url.data.Folder == 'MYFAVORITES' )
            return;
        PSChrome.storage.getItem( favItemName, function( data )
        {
            favorites = data.data.split(",");
            checkItem = function()
            {
                tempURL = new PSChrome.prototype.psftURL( this.href );
                matchString = tempURL.menu + '.' + tempURL.component;
                for( x in favorites )
                {
                    if( favorites[x] == matchString )
                    {
                        switch( this.getAttribute( 'class' ) )
                        {
                            case 'EOPP_SCSECTIONCONTENTLINK':
                                $(this).css( { "fontSize": "18px", "color": "#25587E", "textDecoration": "none" } );
                                break;
                            case 'EOPP_SCCHILDCONTENTLINK':
                                $(this).css( { "fontSize": "14px", "color": "#25587E", "fontWeight": "bold", "textDecoration": "none" } );
                                break;
                            case 'PTNAVLINK':
                                $(this).css( { "fontWeight": "bold", "color": "#25587E", "textDecoration": "none" } );
                                break;
                            case 'PTNAVSELCHILDLINK':
                                $(this).css( { "fontWeight": "bold", "fontSize": "14px", "textDecoration": "none" } );
                                break;
                        };
                    };
                }
            };
            $('a.EOPP_SCSECTIONCONTENTLINK').each(checkItem);
            $('a.EOPP_SCCHILDCONTENTLINK').each(checkItem);
            $('a.PTNAVLINK', 'td.PTNAVSELPARENTBK').each(checkItem);
            $('a.PTNAVSELCHILDLINK', 'td.PTNAVSELPARENTBK').each(checkItem);
            $('table','td.PTNAVSELPARENTBK').css({'padding':'1px'});
        });
    };
    highlightDynamicMenus = function()
    {
        PSChrome.storage.getItem( favItemName, function( data )
        {
            favorites = data.data.split(",");
            $('a', 'li.pthnavcref').each(function()
            {
                el = $(this);
                if( !el.prop('watcher') )
                {
                    el.prop('watcher', 'true' );
                    el.css( { "line-height":'160%'} );
                    tempURL = new PSChrome.prototype.psftURL( this.href );
                    matchString = tempURL.menu + '.' + tempURL.component;
                    for( x in favorites )
                    {
                        if( favorites[x] == matchString )
                        {
                            el.css( { "fontSize": "14px", 'font-weight':'bold', "line-height":'160%'} );
                        }
                    }
                    
                }
            });
        });
    }
    
    /***********************************/
    /*  Tools 8.5x has a dynamic menu system Need to watch the Favorites Folder for activation
    /***********************************/
    if( content.url.toolsMajor > 8.50 )
    {
        $('#pthnavbca_MYFAVORITES:first').click(function()
        {
            $.monitor('add', function(){return $("#pthnavfly_MYFAVORITES:first").html()}, function()
            {
                var newFavList = '';
                setTimeout( function(){if( newFavList != '' )sendFavs( newFavList );}, 1000 );
                $('a','#pthnavfav','#pthnavfly_MYFAVORITES').each(function()
                {
                    tempURL = new PSChrome.prototype.psftURL( this.href );
                    if( tempURL )
                        newFavList += (newFavList==''?'':',') + tempURL.menu + "." + tempURL.component;
                });
                $.monitor('stop' );
            });
        });
        
        var watchThis = function( el )
        {
            /** Find the item selected and watch for more selections    **/
        };
        var isOn = false;
        
        navWatcher = new $.itemMonitor();
        navWatcher.setTime( 200 );
        navWatcher.monitor( 'add', function(){ return $('#pthnavcontainer').html();},function()
        {
            highlightDynamicMenus();
        });
        
        
        
    /****************************************/
    /*  Tools 8.4x need to look at the favorites folder and do left navigation coding for Favorite Highlights
    /****************************************/
    } else {
        if( content.url.script )
        {
            if( content.url.script.record == 'WEBLIB_PT_NAV' && content.url.script.field == 'ISCRIPT1' && content.url.script.event == 'FieldFormula'  && content.url.script.script == 'IScript_PT_NAV_INFRAME' )
            {
                if( content.url.data.Folder == 'MYFAVORITES' )
                {
                    var newFavList = '';
                    setTimeout( function(){if( newFavList != '' )sendFavs( newFavList );}, 1000 );
                    $('a','.PTNAVSELPARENTBK,.PTNAVSELCHILDBK').each(function()
                    {
                        tempURL = new PSChrome.prototype.psftURL( this.href );
                        if( tempURL.menu )
                            newFavList += (newFavList==''?'':',') + tempURL.menu + "." + tempURL.component;
                    });
                    selectedLink = $('.PTNAVSELCHILDLINK');
                    if( selectedLink[0] )
                    {
                        $('<img></img>')
                        .prop( {src:PSChrome.iconBase + 'cancel.png',width:'16', height:'16' } ) 
                        .css( {padding:'0px 0px 0px 10px'} )
                        .appendTo( 
                            $('<a></a>')
                            .prop({href:'javascript:;'})
                            .click(function()
                            {
                                window.open( selectedLink.prop( 'href' ).replace( "Folder=MYFAVORITES", "" ), '_top' );
                            })
                            .insertAfter( $('.PSNAVPARENTLINK:first') ) 
                            );
                    }
                }
            }
        }
        
        /***********************************/
        //  Folder/Page
        if( content.url.uri == 'psc' && content.url.script.record == 'WEBLIB_PTPP_SC' && content.url.script.field == 'HOMEPAGE' && content.url.script.event == 'FieldFormula'  && content.url.script.script == 'IScript_AppHP' )
        {
            highlightNavDrilldownPage();
        /***********************************/
        //  Left Navigation
        //  PeopleTools < 8.5x
        } else if( content.url.uri == 'psc' && content.url.script.record == 'WEBLIB_PT_NAV' && content.url.script.field == 'ISCRIPT1' && content.url.script.event == 'FieldFormula'  && content.url.script.script == 'IScript_PT_NAV_INFRAME' )
        {
            highlightNavDrilldownPage();
        }
        /***********************************/
        
        
    }
};

PSChrome.prototype.doMessageMonitor = function( contentObject )
{
    var content = contentObject;
    var IBScroll;
    switch( content.url.page )
    {
        case "IB_MONITOR_SUBCON":
            IBScroll = new PSChrome.prototype.scrollManager('PSIBSUBCON_VW', '0' );
            break;
        case "IB_MONITOR_PUBCON":
            //TODO:     Need to find a way to do this.  The correct FIELD to get the ID From does not exists on the scroll
            //IBScroll = new PSChrome.prototype.scrollManager('PSIBPUBCON_VW', '0' );
            break;
        case "IB_MONITOR_PUBHDR":
            IBScroll = new PSChrome.prototype.scrollManager('PSIBPUBHDR_VW', '0' );
            break;
            //  OPR INSTANCE    http://xxx:8085/psp/hrqa_20 /EMPLOYEE/HRMS/c/IB_PROFILE.IB_MONITOR_DET.GBL?Page=IB_MONITOR_DET&Action=U&IBPUBTRANSACTID=2dec027a-f1df-11e1-b356-dd6d8205b54b
            //  SUB Contract    http://xxx   /psp/hrprod_1/EMPLOYEE/HRMS/c/IB_PROFILE.IB_MONITOR_DET.GBL?Page=IB_MONITOR_DET&Action=U&IBPUBTRANSACTID=bd43b95e-f13f-11e1-81d3-caa2feb05fbe
            //  http://xxx/psp/hrprod_2/EMPLOYEE/HRMS/c                   /IB_PROFILE.IB_MONITOR_DET.GBL?0fe3de78-f17c-11e1-8033-ffa00a2878da
            break;
    }
    
    function createIBDetailsLink( args )
    {
        for( data in IBScroll.data )
        {
            rowData = IBScroll.data[data];
            obj = $(rowData[IBScroll.headers['blank_0']].obj);
            ID = IBScroll.headers['OrigTransID'] || IBScroll.headers['TransactionID'];
            PUBID = rowData[ID].value;
            if( PUBID != '' )
            {
                obj.html('');
                $('<a>Details</a>').attr({'href':'javascript:;','class':'PSHYPERLINK','onclick':'window.open(\'IB_PROFILE.IB_MONITOR_DET.GBL?Page=IB_MONITOR_DET&Action=U&IBPUBTRANSACTID='+PUBID+'\',\'_blank\');'}).appendTo(obj);
            }
        }
    }
    
    if( IBScroll )
    {
        IBScroll.addCallback( 'IBDetailsLink', createIBDetailsLink, {} );
    }
    
};

PSChrome.storage = {};
PSChrome.storage.getItem = function( name, callback, keep )
{
    var messageListenerName = name.name ? name.name2 : name;
    var callbackFunction = function(event)
    {
        callback( event );
        if( !keep ){
                kango.removeMessageListener( messageListenerName, callbackFunction );
            }
    }
    kango.addMessageListener( messageListenerName, callbackFunction );
    kango.dispatchMessage( 'getItem', name );
}
PSChrome.storage.setItem = function( itemName, itemValue ){ kango.invokeAsync( 'kango.storage.setItem', itemName, itemValue ); };
PSChrome.storage.removeItem = function( itemName ){ kango.invokeAsync( 'kango.storage.removeItem', itemName ); };
     

PSChrome.prototype.initContent = function()
{
	return;
    try
    {
    /********************************************************************/
    /** PSChrome 3.0 Page Logic                                          /
    /********************************************************************/
    var processingIcon = $($('#processing:first')[0]);
    var thisURL = new PSChrome.prototype.psftURL( document.location, document );
    var lastPage, lastComponent;
    var componentContainer = {};
    var currentComponent;

    var content = this;
    content.url = thisURL;
    //	http://pshrdev01.steaknshake.net/psc/pshrdv/EMPLOYEE/PSFT_HR_DV/s/WEBLIB_PT_NAV.ISCRIPT1.FieldFormula.IScript_PT_NAV_INFRAME?Folder=MYFAVORITES&CREF=&FolderRef=MYFAVORITES&c=YssUOw2Ue3Lut2x14fAHozYlXi4QN20o&FolderPath=PORTAL_ROOT_OBJECT.MYFAVORITES&IsFolder=true&PortalActualURL=http%3a%2f%2fpshrdev01.steaknshake.net%2fpsc%2fpshrdv%2fEMPLOYEE%2fPSFT_HR_DV%2fs%2fWEBLIB_PT_NAV.ISCRIPT1.FieldFormula.IScript_PT_NAV_INFRAME%3fFolder%3dMYFAVORITES%26CREF%3d%26FolderRef%3dMYFAVORITES%26c%3dYssUOw2Ue3Lut2x14fAHozYlXi4QN20o&PortalContentURL=http%3a%2f%2fpshrdev01.steaknshake.net%2fpsc%2fpshrdv%2fEMPLOYEE%2fPSFT_HR_DV%2fs%2fWEBLIB_PT_NAV.ISCRIPT1.FieldFormula.IScript_PT_NAV_INFRAME&PortalContentProvider=PSFT_HR_DV&PortalCRefLabel=PT%20Nav%20Frame%20CRef&PortalRegistryName=EMPLOYEE&PortalServletURI=http%3a%2f%2fpshrdev01.steaknshake.net%2fpsp%2fpshrdv%2f&PortalURI=http%3a%2f%2fpshrdev01.steaknshake.net%2fpsc%2fpshrdv%2f&PortalHostNode=PSFT_HR_DV&NoCrumbs=yes
    if( thisURL.type == 'script' && thisURL.uri == 'psc'  
    		&& thisURL.script.event == "FieldFormula"
    		&& thisURL.script.field == "ISCRIPT1"
    		&& thisURL.script.script == "IScript_PT_NAV_INFRAME"
			&& thisURL.script.record == "WEBLIB_PT_NAV"
		)
	{
		kango.console.log( 'Left nav: setCrossDomain(\'' + document.domain + '\')');
		kango.dispatchMessage( 'setCrossDomain', {domain:document.domain} );
	} else {
	    kango.addMessageListener( 'sendCrossDomain', function(event)
		{
	    	//if( document.domain != event.data )
    			document.domain = event.data;
		});
	    setTimeout( function(){kango.dispatchMessage( 'getCrossDomain', {})}, 50 );
	    /*
	     * 
    var tabCrossDomain = {};
    kango.addMessageListener( 'setCrossDomain', function(event)
	{
    	tabCrossDomain[event.data.tabid]  = event.data.domain;
	});
    kango.addmessageListener( 'getCrossDomain', function(event)
	{
    	if( tabCrossDomain[event.data.tabid] )
    		event.target.dispatchMessage( 'sendCrossDomain', tabCrossDomain[event.data.tabid] );
	});
	     */
	}
    
	if( content.url.type != 'tab' )
		content.toolbar = new PSChrome.prototype.doToolbar( content.url );
    PSChrome.prototype.watchFavorites(content);
        
	var pageMissingMessage = function(){
		content.toolbar.message.html('page information unavailable for features');
	};
    var thisENV;
    
    function watchPageChanges()
    {
        if( !currentComponent )
            switch( thisURL.component )
            {
                case "PROCESSMONITOR":
                    currentComponent = new PSChrome.components.processMonitor( content );
                    switch( content.url.page )
                    {
                        case "PMN_PRCSLIST":
                            //PSChrome.prototype.doProcessMonitor( content );
                            break;
                        case "PMN_PRCSLISTTREE":
                            //PSChrome.prototype.doProcessMonitor( content );
                            break;
                        case undefined:
                            pageMissingMessage();
                            break;
                        default: 
                            PSChrome.prototype.doProcessMonitorActions();
                            break;
                    }
                    break;
                case "PROCESSMONITOR":
                    break;
                case "PT_TIMEOUTWARNING":
                    PSChrome.prototype.doTimeoutWarning();
                    break;
                case "IB_MONITOR":
                    //currentComponent = '';//new self.IB_MONITOR( thisURL );
                    setTimeout(function()
                    {
                        PSChrome.prototype.doMessageMonitor( content );
                    }, 2000 );
                    break;
                default:
                    //if(debugEnabled)kango.console.log( "Nothing to do for this component" );
                    //if(debugEnabled)kango.console.log( content.url );
                    break;
            }
            
        if( currentComponent )
            currentComponent.envData = thisENV;
            
        if( thisURL.component != lastComponent )
        {
            if(debugEnabled)kango.console.log( "Component Changed\tWindow: " + window.name );
            if( currentComponent )
                currentComponent.doComponent();
        } else if( thisURL.page != lastPage )
        {
            if(debugEnabled)kango.console.log( "Page changed\tWindow: " + window.name );
            if( currentComponent )
                currentComponent.doPage( thisURL.page );
            
            
            
        }
        lastPage = thisURL.page;
        lastComponent = thisURL.component;
        
        /** Default Correct History **/
        var ICElementCH;
        var doCorrectHistory = thisENV[PSChrome.correctHistoryDef];
        function doCorrect()
        {
            if( doCorrectHistory === true )
                ICElementCH.prop({'checked':'checked'});
        }
        if( ICElementCH = $("input[id$='ICCorrectHistory']") )
        {
            if( typeof doCorrectHistory == 'undefined' )
                PSChrome.storage.getItem( PSChrome.correctHistoryDef, function(data){
                    doCorrectHistory = ( data.data == null ? PSChrome.def.correctHistoryDef : data.data );
                        doCorrect();
                });
            else
                doCorrect();
        }
        
        /** Default Advanced Search **/
        var ICElementAH;
        var doAdvancedSearch = thisENV[PSChrome.advancedSearchDef];
        function doAdvanced()
        {
            if( doAdvancedSearch === true )
                if( ICElementAH.html() == 'Advanced Search' )
                    document.location = ICElementAH[0].href;
        }
        if( ICElementAH = $("a[name$='ICAdvSearch']") )
        {
            if( typeof  doAdvancedSearch == 'undefined' )
                PSChrome.storage.getItem( PSChrome.advancedSearchDef, function(data){
                    doAdvancedSearch = ( data.data == null ? PSChrome.def.advancedSearchDef : data.data );
                        doAdvanced();
                });
            else
                doAdvanced();
        }
        /*********************************************/
        /**	Monitor the page for 8.52 Page Changes	**/
        if( thisURL.toolsMajor >= 8.52 && thisURL.uri == 'psc' )
        {
            var foundInProcessing = false;
            var processWatcher = function(){
                if( processingIcon.css('visibility') == 'visible' && foundInProcessing === false ){
                    foundInProcessing = true;
                } else if ( foundInProcessing === true && processingIcon.css('visibility') != 'visible' )
                {
                    lastPage = '';
                    setTimeout( watchPageChanges, 20 );	// Must alow at least 1 Page monitor process to complete before evaluating the page/component
                    return;
                }
                setTimeout( processWatcher, 10 );
            };
            processWatcher();
        }
        /*********************************************/
    }
    
    PSChrome.env.get( thisURL, function(env)
    {
        thisENV = env;
        if( thisURL.type == 'component' )
            watchPageChanges();
    });
        
    /********************************************************************/
    /** END :: PSChrome 3.0 Page Logic                                   /
    /********************************************************************/
    
    /**********************/
    if( content.url.data )
        if( content.url.data.cmd )
        {
            if( !content.url.data.cmd.match( /login|logout/ ) && content.url.data.cmd != '' )
                return;
            envContainer = $('<div><h2 style="font-weight:bold; color:000000;">Environments</div>')
            .css({
                position:'absolute'
                ,left:'0'
                ,top:'10'
                ,border:'1px solid #D6D6D6'
                ,padding:'10px'
                ,'background-color':'#F5F5F5'
                ,'display':'none'
                })
            .appendTo( document.body );
            
            showButton = $('<a></a>')
                .attr({href:'javascript:;','alt':'Show Environments'})
                .prop({'alt':'Show Environments'})
                .appendTo( $('<div></div>').appendTo( document.body ) )
                .click(function(){
                    showButton.hide();
                    envContainer.show();
                })
                .css({position:'absolute',top:0,left:0})
                .hide();
                
                $('<img></img>').attr({src:PSChrome.iconBase+'repost.png',border:0}).appendTo( showButton );
            
            PSChrome.storage.getItem( PSChrome.envURLListID, function(data)
            {
                envList = sortList(data.data);
                for( x in envList )
                {
                    envContainer.css({'display':'block'});
                    $('<a></a>')
                    .prop({href: PSChrome.prototype.generateURL( envList[x]) })
                    .html( envList[x].name )
                    .css({fontSize: "17px", color: "blue", textDecoration: "none", fontWeight: "bold", lineHeight: "1.4"})
                    .appendTo(
                        $('<div></div>').appendTo( envContainer )
                    ).hover(function(event){
                        if( event.type == 'mouseenter' )
                            $(this).css({color:"red"});
                        else
                            $(this).css({color:"blue"});
                    });
                }
                
                $('<hr>').appendTo( envContainer );
                $('<a>Settings</a>').appendTo( envContainer )
                    .css({'text-decoration':'none',size:'7px','font-weight':'bold'})
                    .attr({href:'javascript:;'}).click(function(){
                    kango.invokeAsync( 'kango.ui.optionsPage.open', 'tabs-settings' );
                });
                $('<a>close</a>').appendTo( envContainer ).css({color:'red','font-weight':'bold','text-decoration':'none',size:'7px',float:'right',position:'relative'}).attr({href:'javascript:;'}).click(function(){
                    envContainer.hide();
                    showButton.show();
                });
            });
            
            /** Add Remember Password Checkbox  **/
            /*
            $('input').each(function(){
                if( this.value == 'Sign In' )
                {
                    $("<br></br>").appendTo(this.parentNode);
                    var loginForm = $($("#login")[0]);
                    var remInput = $("<input></input>")
                        .attr({type:'checkbox',id:'rememberLogin'})
                        .click(function(){
                            if( loginForm.attr("autocomplete") == true )
                                loginForm.attr("autocomplete", false );
                            else
                                loginForm.attr("autocomplete", true );
                        }).appendTo( this.parentNode );
                    $("<label></label>")
                        .attr({for:'rememberLogin'})
                        .html("remember password")
                        .appendTo(this.parentNode);
                    
                    //$(this).appendTo( $("<div></div>").appendTo( this.parentNode )  );
                }
            });
            */
            
            $($('.PSLOGINPUSHBUTTON:first' )[0]).after( $("<a></a>").attr({href:'?cmd=login&trace=y'}).html('Trace').css({margin: '5 0 0 15'}) );
            
        }
        } catch(e ){
            if(debugEnabled)kango.console.log( "Caught exception" );
            try
            {
                if(debugEnabled)kango.console.log( e.toString() );
                if( typeof e == 'object' )
                    if(debugEnabled)kango.console.log( e.stack );
            }catch(e2){
                if(debugEnabled)kango.console.log( nsIFoo.toString.apply(e) );
            }
        }
    
};


var readyStateCheckInterval = setInterval(function()
{
    if (document.readyState == "complete")
    {
        new PSChrome();
        clearInterval(readyStateCheckInterval);
        /*
        if( content page then set domain listener
        if( WEBLIB_PT_NAV and PSC then check with content to see if domain is same
        	if not then set
    	if( no response from content after xxx MS then resent message as navigation may be loading before content
    	*/
    }
}, 10);
