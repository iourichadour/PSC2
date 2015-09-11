// ==UserScript==
// @name Google Analytics
// @include https://ssl.google-analytics.com/*
// @include http://melban.me/chrome/PSChrome2/track_installs.html


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

var stateWatcher = setInterval(function()
{
    if (document.readyState === "complete")
    {
        
        
        PSChromeVersion = kango.getExtensionInfo();
        if( PSChromeVersion.version )
        {
            try{
                version = PSChromeVersion.version.toString().split(".");
                versionMajor = version[0] + "." + version[1];
                versionMinor = versionMajor + "." + ( version[2] ? version[2] : '0' );
                
                browser = kango.browser.getName();
                installed = kango.storage.getItem( 'installed' );
                installedVersionMajor = kango.storage.getItem( 'installedVersionMajor' );
                installedVersionMinor = kango.storage.getItem( 'installedVersionMinor' );
      
                if( installedVersionMinor != versionMinor.toString() )
                {
                    kango.console.log( "Sent event for versionMinor" );
                    _gaq.push([ '_trackEvent', 'PSChrome Version', versionMinor, kango.browser.getName() ]);
                    kango.storage.setItem( 'installedVersionMinor', versionMinor );
                    
                    //if( browser == 'firefox' && installedVersionMajor.toString() != '2.4' )kango.browser.tabs.create( {url : 'https://www.pschrome.com/chrome/PSChrome2/AMO-to-hosted.html' } );
                    
                    if( installedVersionMajor != versionMajor.toString() )
                    {
                        kango.console.log( "Sent event for versionMajor" );
                        _gaq.push([ '_trackEvent', 'PSChrome Version', versionMajor, kango.browser.getName() ]);
                        kango.storage.setItem( 'installedVersionMajor', versionMajor );
                        
                    }
                    if( !installed )
                    {
                        kango.console.log( "Sent event for installed" );
                        _gaq.push([ '_trackEvent', 'PSChrome Install', versionMinor, kango.browser.getName() ]);
                        kango.storage.setItem( 'installed', true );
                        kango.browser.tabs.create( {url : 'http://pschrome.com/chrome/PSChrome2/features.html' } );
                        
                    }
                    
                    if( browser != 'chrome' )
                    {
                        if( installedVersionMajor == versionMajor.toString() )
                            versionMajor = '';
                        installString = 'browser='+browser+'&versionMajor='+versionMajor+'&versionMinor='+versionMinor;
                        if( !installed )
                            installString += '&install=true';
                        window.open( 'http://melban.me/chrome/PSChrome2/track_installs.html?' + installString );
                    } else {
                        initGoogle();
                    }
                }

            } catch(e){ kango.console.log( e.toString() ); }
        }
        clearInterval(stateWatcher);
    }
}, 1000);