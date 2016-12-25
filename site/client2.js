var peerChannel = function(peerName,sendMSGSignaling,configuration){
  this.peerName = peerName;
  this.sendMSGSignaling = sendMSGSignaling;
  this.configuration = configuration;
  this.dataChannel;
  this.options;
  var that = this;
  var peerConnection;

  // Creating new peer connection object
  var createNewConnection = function(){
    console.log("Creating new Peer Connection Object for " + that);
    that.peerConnection =
      new RTCPeerConnection(that.configuration,that.options);
    that.peerConnection.onicecandidate = onIceCandidate;
  }

  // onicecandidate event handler
  var onIceCandidate = function(event){
    console.log("Ice candidate event");
    if(event.candidate)
      that.sendMSGSignaling({
        name:that.peerName,
        type:"candidate",
        candidate:event.candidate
      });
  }

  // Sending offer
  var sendOffer = function(){
    that.peerConnection.createOffer().then(function(offer1){
      console.log("Offer created");
      console.log(offer1);
      that.sendMSGSignaling({
        type:"offer",
        name:that.peerName,
        offer:offer1
      });
      that.peerConnection.setLocalDescription(offer1).then(
                                                localsuccess,
                                                localunsuccess );
    });
  };

  // TODO : make data channel more customizable
  // Creating dataChannel on offering side
  var createDataChannel = function(){
    that.dataChannel =
      that.peerConnection.createDataChannel(
      "Something", {reliable:false} );
      that.onDataChannelCreation();

  }

  // Setting dataChannel on receiving side
  var acceptDataChannel = function(){
    that.peerConnection.ondatachannel = function(event){
      that.dataChannel = event.channel;
      that.onDataChannelCreation();
    };
  }
  this.onDataChannelCreation = function(){
    console.log("Data Channel Created");
    this.dataChannel.onopen = function(event){
      console.log("Data Channel is now open");
    }
  }

  this.offerConnection = function(){
    createNewConnection();
    createDataChannel();
    sendOffer();
  };
  this.acceptConnection = function(offer){

  };
}
//TODO : Create tostring


//module.exports = peerChannel;
