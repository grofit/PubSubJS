(function( global ){
    "use strict";

    // helps us make sure that the order of the tests have no impact on their succes
    var getUniqueString = function(){
        if ( this.uid === undefined ){
            this.uid = 0;
        }    
        this.uid++;

        return "my unique String number " + this.uid.toString();
    };

   TestCase( "PubSub", {
        "test publish method should return false if there are no subscribers" : function(){
            var message = getUniqueString();
            assertFalse( PubSub.publish( message ) );
        },

        "test publish method should return true if there are subscribers to a message" : function(){
            var message = getUniqueString();
            var func = function(){};

            PubSub.subscribe( message, func );
            assert( PubSub.publish( message ) );
        },

        "test publish method should call all subscribers for a message exactly once" : function(){
            var message = getUniqueString();

            var spy1 = sinon.spy();
            PubSub.subscribe( message, spy1 );

            var spy2 = sinon.spy();
            PubSub.subscribe( message, spy2 );

            PubSub.publishSync( message, 'my payload' ); // force sync here, easier to test

            assert( 'first subscriber called once', spy1.calledOnce );
            assert( 'second subscriber called once', spy2.calledOnce );        
        },

        "test publish method should call all ONLY subscribers of the published message" : function(){
            var message1 = getUniqueString();
            var message2 = getUniqueString();

            var spy1 = sinon.spy();
            PubSub.subscribe( message1, spy1 );

            var spy2 = sinon.spy();
            PubSub.subscribe( message2, spy2 );

            PubSub.publishSync( message1, 'some payload' );

            // ensure the first subscriber IS called
            assert( 'first subscriber called', spy1.called );
            // ensure the second subscriber IS NOT called
            assertEquals( 'second subscriber NOT called', 0, spy2.callCount );
        },

        "test publish method should call subscribers with message as first argument" : function(){
            var message = getUniqueString();
            var spy = sinon.spy();

            PubSub.subscribe( message, spy );        
            PubSub.publishSync( message, 'some payload' );

            assert( spy.calledWith( message ) );        
        },

        "test publish method should call subscribers with data as second argument" : function(){
            var message = getUniqueString();
            var spy = sinon.spy();
            var data = getUniqueString();

            PubSub.subscribe( message, spy );        
            PubSub.publishSync( message, data );

            assert( spy.calledWith( message, data ) );        
        },

        "test publish method should publish method asyncronously" : function(){
            var setTimeout = sinon.stub( global, 'setTimeout' );

            var message = getUniqueString();
            var spy = sinon.spy();
            var data = getUniqueString();

            PubSub.subscribe( message, spy );        
            PubSub.publish( message, data );

            assert( setTimeout.calledOnce );        

            setTimeout.restore();
        },

        "test publishSync method should allow syncronous publication" : function(){
            var setTimeout = sinon.stub( global, 'setTimeout' );

            var message = getUniqueString();
            var spy = sinon.spy();
            var data = getUniqueString();

            PubSub.subscribe( message, spy );        
            PubSub.publishSync( message, data );

            // make sure that setTimeout was never called
            assertEquals( 0, setTimeout.callCount );        

            setTimeout.restore();
        },

        "test publish method should call all subscribers, even if there are exceptions" : function(){
            var message = getUniqueString();
            var error = getUniqueString();
            var func1 = function(){
                throw('some error');
            };
            var spy1 = sinon.spy();
            var spy2 = sinon.spy();

            PubSub.subscribe( message, func1 );
            PubSub.subscribe( message, spy1 );
            PubSub.subscribe( message, spy2 );

            PubSub.publishSync( message, undefined );

            assert( spy1.called );        
            assert( spy2.called );        
        },

        "test unsubscribe method should return false when unsuccesful" : function(){

            // first, let's try a completely unknown token
			var dummyFunction = function(){};
			var dummyMessageType = getUniqueString();
			var result = PubSub.unsubscribe( dummyMessageType, dummyFunction );
            assertFalse( result );

            // now let's try unsubscribing the same method twice after subscribing it
            PubSub.subscribe( dummyMessageType, dummyFunction );

            // unsubscribe once
            PubSub.unsubscribe( dummyMessageType, dummyFunction );
            // unsubscribe again
            assertFalse( PubSub.unsubscribe( dummyMessageType, dummyFunction ) );        
        }
    });
}(this));