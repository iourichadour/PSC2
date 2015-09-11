/**
* @Name: jQuery Monitor plugin 
* @Version: 1.0.0
* @License: MIT
* @Copyright: Andrei Razumkou
* @Date: 07 Aug 2011
* @Author: Andrei Razumkou nix.d3v(at)gmail.com
* @Description: Simple generic monitoring plugin. Created to track changes in values
* returned by any user defined callback function.
* https://github.com/nixd3v/monitor
*/ 

(function(factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module. 
        define(['jquery'], factory);
    } else {
        // Browser globals
        factory(jQuery);
    }
}( function( $ ) {
 	var interval = 1000;//milliseconds
	var callbacks = [];
	var started = false;
	var stop = false;
	var startMainLoop = function(){
		(function() {
			/*
			 * Checking if value has changed.
			 */
			var len = callbacks.length;
			for(var i=0;i<len;i++){
				var newVal = callbacks[i][1]();
				if (callbacks[i][0] !== newVal) {
					callbacks[i][0] = newVal;
					callbacks[i][2]();
				}
			} 
			
			/*
			 * Starting the loop automatically if not yet started.
			 */
			if(!stop) {
				setTimeout(arguments.callee, interval);				
			} else {
				started = false;
			}
		})();

		started = true;
	}
	
	var methods = {
		
		/*
		 * @param execCallback - function to execute when valCallback changes
		 * @param valCallback - function that return a value to be compared to the previous value
		 */
		add : function(valCallback, execCallback) {
			var valueNow = valCallback();
			var newElem = [valueNow, valCallback, execCallback]
			callbacks.push(newElem);
			if(started === false){
				stop=false;
				startMainLoop();
			}
		},
		
		/*
		* Stort polling (if was stopped before for some reason)
		*/
		start: function() {
			stop = false;
			if(started === false){
				startMainLoop();				
			}
		},
		
		/*
		 * Clear the callbacks and stops the loop
		 */
		clear: function(){
			callbacks = [];
			stop=true;
		},
		
		/*
		* Stop polling
		*/
		stop : function() {
			stop = true;
		}
	};


	/*
	 * Entry point - generic functions
	 */
	$.monitor = function( method ) {
		if ( methods[method] ) {
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.monitor' );
		}
	};
}));


/**
* @Name: jQuery Monitor plugin 
* @Version: 1.0.0
* @License: MIT
* @Copyright: Andrei Razumkou
* @Date: 07 Aug 2011
* @Author: Andrei Razumkou nix.d3v(at)gmail.com
* @Description: Simple generic monitoring plugin. Created to track changes in values
* returned by any user defined callback function.
* https://github.com/nixd3v/monitor
*/ 

(function(factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module. 
        define(['jquery'], factory);
    } else {
        // Browser globals
        factory(jQuery);
    }
}( function( $ ) {

    $.itemMonitor = function()
    {
        var interval = 500;//milliseconds
        var callbacks = [];
        var started = false;
        var stop = false;
        var startMainLoop = function(){
            (function() {
                /*
                 * Checking if value has changed.
                 */
                var len = callbacks.length;
                for(var i=0;i<len;i++){
                    var newVal = callbacks[i][1]();
                    if (callbacks[i][0] !== newVal) {
                        callbacks[i][0] = newVal;
                        callbacks[i][2]( callbacks[i][1]() );
                    }
                } 
                
                /*
                 * Starting the loop automatically if not yet started.
                 */
                if(!stop) {
                    setTimeout(arguments.callee, interval);				
                } else {
                    started = false;
                }
            })();

            started = true;
        }
        
        var methods = {
            
            /*
             * @param execCallback - function to execute when valCallback changes
             * @param valCallback - function that return a value to be compared to the previous value
             */
            add : function(valCallback, execCallback) {
                var valueNow = valCallback();
                var newElem = [valueNow, valCallback, execCallback]
                callbacks.push(newElem);
                if(started === false){
                    stop=false;
                    startMainLoop();
                }
            },
            
            /*
            * Stort polling (if was stopped before for some reason)
            */
            start: function() {
                stop = false;
                if(started === false){
                    startMainLoop();				
                }
            },
            
            /*
             * Clear the callbacks and stops the loop
             */
            clear: function(){
                callbacks = [];
                stop=true;
            },
            
            /*
            * Stop polling
            */
            stop : function() {
                stop = true;
            }
        };


        /*
         * Entry point - generic functions
         */
         this.setTime = function(t){ interval = t;};
        this.monitor = function( method ) {
            if ( methods[method] ) {
                return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
            } else {
                $.error( 'Method ' +  method + ' does not exist on jQuery.monitor' );
            }
        };
    }
}));
