/*
Copyright (c) 2010 Morgan Roderick http://roderick.dk
- Edited to remove token constraint 2011

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
/*jslint evil: false, strict: false, undef: true, white: false, onevar:false, plusplus:false */
/*global setTimeout:true */
/** section: PubSub
 *  PubSubJS is a dependency free library for doing ['publish/subscribe'](http://en.wikipedia.org/wiki/Publish/subscribe)
 *  messaging in JavaScript.
 *  
 *  In order to not have surprising behaviour where the execution chain generates more than one message, 
 *  publication of messages with PubSub are done asyncronously (this also helps keep your code responsive, by 
 *  dividing work into smaller chunkcs, allowing the event loop to do it's business).
 *
 *  If you're feeling adventurous, you can also use syncronous message publication, which can lead to some very
 *  confusing conditions, when one message triggers publication of another message in the same execution chain.
 *  Don't say I didn't warn you.
 * 
 *  ##### Examples
 *  
 *      // create a function to receive the message
 *      var mySubscriber = function( msg, data ){
 *          console.log( msg, data );
 *      };
 * 
 *      // add the function to the list of subscribers to a particular message
 *      // we're keeping the returned token, in order to be able to unsubscribe from the message later on
 *      PubSub.subscribe( 'MY MESSAGE', mySubscriber );
 *
 *      // publish a message asyncronously
 *      PubSub.publish( 'MY MESSAGE', 'hello world!' );
 *      
 *      // publish a message syncronously, which is faster by orders of magnitude, but will get confusing
 *      // when one message triggers new messages in the same execution chain
 *      // USE WITH CATTION, HERE BE DRAGONS!!!
 *      PubSub.publishSync( 'MY MESSAGE', 'hello world!' );
 *      
 *      // unsubscribe from further messages, using setTimeout to allow for easy pasting of this code into an example :-)
 *      setTimeout(function(){
 *          PubSub.unsubscribe( 'MY MESSAGE', mySubscriber );
 *      }, 0)
**/ 
var PubSub = {};
(function(p){
    "use strict";
    
    var messages = [];

    var throwException = function(e){
        return function() { throw e; };
    }; 
    
    var publish = function( message, data, sync ){
        
        // dont let undefined messages through
        if(typeof(message) === "undefined" || message === "") { 
            var errorMessage = "Cannot allow empty/undefined messages to be published [" + data + " ]";
            setTimeout(throwException(errorMessage), 0);
            return;
        }
        
        // if there are no subscribers to this message, just return here
        if ( !messages.hasOwnProperty( message ) ){
            return false;
        }
        
        var deliverMessage = function(){
            var subscribers = messages[message];
            for ( var i = 0, j = subscribers.length; i < j; i++ ){
                try {
                    subscribers[i]( message, data );
                } catch( e ){
                    var errorMessage = "Cannot find any subscribers for [" + message + "] - ";
                    errorMessage += "Internal Error = {" + e + "}";
                    setTimeout( throwException(errorMessage), 0);
                }
            }
        };
        
        if ( sync === true ){
            deliverMessage();
        } else {
            setTimeout( deliverMessage, 0 );
        }
        return true;
    };

    p.version = '0.1.5';
    
    /**
     *  PubSub.publish( message[, data] ) -> Boolean
     *  - message (String): The message to publish
     *  - data: The data to pass to subscribers
     *  - sync (Boolean): Forces publication to be syncronous, which is more confusing, but faster
     *  Publishes the the message, passing the data to it's subscribers
    **/
    p.publish = function( message, data ){
        return publish( message, data, false );
    };
    
    /**
     *  PubSub.publishSync( message[, data] ) -> Boolean
     *  - message (String): The message to publish
     *  - data: The data to pass to subscribers
     *  - sync (Boolean): Forces publication to be syncronous, which is more confusing, but faster
     *  Publishes the the message synchronously, passing the data to it's subscribers
    **/
    p.publishSync = function( message, data ){
        return publish( message, data, true );
    };

    /**
     *  PubSub.subscribe( message, func )
     *  - message (String): The message to subscribe to
     *  - func (Function): The function to call when a new message is published
     *  Subscribes the passed function to the passed message.
    **/
    p.subscribe = function( message, func ){

        // dont let undefined messages through
        if(typeof(message) === "undefined" || message === "") { 
            var messageErrorMessage = "Cannot allow subscribing to empty/undefined messages for callback [" + func + "]";
            setTimeout(throwException(messageErrorMessage), 0);
            return;
        }
        
        // dont let undefined functions through
        if(typeof(func) === "undefined") { 
            var functionErrorMessage = "Cannot allow subscribing of undefined function callback for message [" + message + "] ";
            setTimeout(throwException(functionErrorMessage), 0);
            return;
        }

        // message is not registered yet
        if ( !messages.hasOwnProperty( message ) ){
            messages[message] = [];
        }

		// Modified to just pass in function
        messages[message].push( func );
    };

    /**
     *  PubSub.unsubscribe( token ) -> String | Boolean
     *  - message (String): The message type to unsubscribe from
     *  - func (Function): The function currently subscribed that needs removing
     *  Unsubscribes a specific subscriber from a specific message
    **/
    p.unsubscribe = function( message, func ){

		if ( messages.hasOwnProperty( message ) ){
			for ( var i = 0, j = messages[message].length; i < j; i++ ){
				if ( messages[message][i] === func ){
					// Remove the element
					messages[message].splice( i, 1 );
					return true;
				}
			}
		}
        return false;
    };

    p.getSubscribersForMessage = function(message) {
        if ( messages.hasOwnProperty( message ) ){
            return messages[message];
        }
    };

}(PubSub));