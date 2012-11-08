/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * @fileOverview A plugin to handle motion events like 'shake', 'flip' and 'fall'
 * 
 * @author Kevin AUVINET, Jerome GIRAUD
 */
define(['../../../_amd/core'], function(wink)
{   
	var a = 'accelerationIncludingGravity';
	
	var shakeSensitivity = wink.ua.isIOS?4:1;
	var shakeCount = 0;
	var shook = false;
	
	var flipSum = 0;
	
	var fallCount = 0;
	var felt = false;
	
	/**
	 * @class A plugin to listen to predefine motion events like 'shake', 'flip' or 'fall'
	 * 
	 * @example
	 * 
	 * motion = new wink.plugins.Motion();
	 * 
	 * motion.addListener('shake', { method: 'test', arguments: 'shake' });
	 * motion.addListener('flip', { method: 'test', arguments: 'flip' });
	 * motion.addListener('fall', { method: 'test', arguments: 'fall' });
	 * 
	 * @compatibility Iphone OS4, Iphone OS5, Android 3.0, Android 3.1, Android 4, BlackBerry PlayBook 2.0
	 * 
	 * @winkVersion 1.4
	 */
	wink.plugins.Motion = function()
    {
    	if (wink.isUndefined(wink.plugins.Motion.singleton))
		{
    		/**
    		 * Unique identifier
    		 * 
    		 * @property
    		 * @type integer
    		 */
    		this.uId = 1;
    		
    		/**
    		 * List of available events
    		 * 
    		 * @property
    		 * @type array
    		 */
    		this.eventsList = ['shake', 'flip', 'fall'];
    		
    		this._events =
    		{
    			shake: [],
    			flip: [],
    			fall: []
    		}
    		
    		this._lastX = null;
    		this._lastY = null;
    		this._lastZ = null;
    		
    		this._timeStamp = 0;
    		 
    		this._frequency = 50;
    		
    		this._listeners = 0;
    		
    		wink.plugins.Motion.singleton = this;
		} else
		{
			return wink.plugins.Motion.singleton;
		}
    };
    
    wink.plugins.Motion.prototype =
	{
		/**
		 * Adds a motion event listener
		 * 
		 * @param {string} eventName The name of the motion event to listen
		 * @param {object} callback  The callback to add
		 */	
    	addListener: function(eventName, callback)
    	{
    		this._events[eventName].push(callback);
    		
    		if ( this._listeners == 0 )
    		{
    			window.addEventListener('devicemotion', wink.bind(this._getData, this), false);
    		}
    		
    		this._listeners++;
    	},
    	
    	/**
		 * Removes a motion event listener
		 * 
		 * @param {string} eventName The name of the motion event
		 * @param {object} callback  The callback to remove
		 */	
    	removeListener: function(eventName, callback)
    	{
    		var _e = this._events[eventName];
    		
    		for ( var i=0, l=_e.length; i<l; i++)
    		{
    			if ( (_e[i].context == callback.context) && (_e[i].method == callback.method) )
    			{
    				_e.splice(i, 1);
    				this._listeners--;
    			}
    		}
    		
    		if ( this._listeners == 0 )
    		{
    			window.removeEventListener('devicemotion', wink.bind(this._getData, this), false);
    		}
    	},
    	
    	/**
		 * Get the data from the accelerometer
		 * 
		 * @param {object} e  The device orientation event
		 */	
    	_getData: function(e)
    	{
    		if ( (e.timeStamp - this._timeStamp) >= this._frequency ) 
    		{
    			if ( this._events.shake.length > 0 )
    			{
    				this._detectShake(e);
    			}
    			
    			if ( this._events.flip.length > 0 )
    			{
    				this._detectFlip(e);
    			}
    			
    			if ( this._events.fall.length > 0 )
    			{
    				this._detectFall(e);
    			}
 
    			this._lastX = e[a].x;
        		this._lastY = e[a].y;
        		this._lastZ = e[a].z;
        		
        		this._timeStamp = e.timeStamp;
    		}
    	},
    	
    	/**
		 * Detect a shake motion
		 * 
		 * @param {object} e  The device orientation event
		 */	
    	_detectShake: function(e)
    	{
    		if ( wink.isSet(this._lastX))
    		{
    			var deltaX = Math.abs(e[a].x - this._lastX);
    	        var deltaY = Math.abs(e[a].y - this._lastY);
    	        var deltaZ = Math.abs(e[a].z - this._lastZ);
    	        
    	        var changes = 0;
    	        
    	        if (deltaX > 3) changes++;
    	        if (deltaY > 3) changes++;
    	        if (deltaZ > 3) changes++;
    	        
    	        if (changes >= 2)
    	        {
    	        	
    	        	this._shaking = true;
    	        	
    	        	if ( shakeCount == shakeSensitivity && !shook )
    	        	{
    	        		for ( var i=0, l=this._events.shake.length; i<l; i++)
    	        		{
    	        			wink.call(this._events.shake[i]);
    	        		}
    	        		
    	        		shook = true;
    	        		shakeCount = 0;
    	        		
    	        	} else
    	        	{
    	        		if ( shakeCount < 50 )
    	        		{
    	        			shakeCount++;
    	        		}
    	        	}
    	        	
    	        } else
    	        {
    	        	if (shakeCount > 0)
    	        	{
    	        		shook = false;
    	        		shakeCount--;
    	        	}
    	        }
    		}
    	},
    	
    	/**
		 * Detect a flip motion
		 * 
		 * @param {object} e  The device orientation event
		 */	
    	_detectFlip: function(e)
    	{
    		if(e[a].z >= -12 && e[a].z < -8) 
    	    {
    			if(flipSum >= 20 && flipSum < 1000)
    	        {
    				for ( var i=0, l=this._events.flip.length; i<l; i++)
	        		{
	        			wink.call(this._events.flip[i]);
	        		}
    	        }
    				
    			flipSum = 0;
	        } else 
	        {
	        	flipSum += e[a].z;
	        }
    	},
    	
    	/**
		 * Detect a free fall motion
		 * 
		 * @param {object} e  The device orientation event
		 */	
    	_detectFall: function(e)
    	{
    		if ( (e[a].x >= -2 && e[a].x <= 2) && (e[a].y >= -2 && e[a].y <= 2) && (e[a].z >= -0.5 && e[a].z <= 0.5) )
    		{
    			if( !felt )
        		{
    				for ( var i=0, l=this._events.fall.length; i<l; i++)
            		{
            			wink.call(this._events.fall[i]);
            		}
        			
        			felt = true;
        		}
    		} else
    		{
    			felt = false;
    		}
    	}
	};
});