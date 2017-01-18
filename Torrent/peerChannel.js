var peerChannel = function(peerName,signal,configuration){
  this.peerName = peerName;
  this.signal = signal;
  this.configuration = configuration;
  this.dataChannel;
  // TODO : rethink about options
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
      that.signal.sendJSON({
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
      that.signal.sendJSON({
        type:"offer",
        name:that.peerName,
        offer:offer1
      });
      that.peerConnection.setLocalDescription(offer1).then(
                                                localSuccess,
                                                localUnsuccess );
    });
  };

  // TODO : make data channel more customizable
  // Creating data channel on offering side
  var createDataChannel = function(){
    that.dataChannel =
      that.peerConnection.createDataChannel(
      "Something", {reliable:false} );
    onDataChannelCreation();

  }
  var acceptDataChannel = function(){
    that.peerConnection.ondatachannel = function(event){
      that.dataChannel = event.channel;
      onDataChannelCreation();
    };
  }
  var sendAnswer = function(){
    that.peerConnection.createAnswer().then(function(answer1){

      that.signal.sendJSON({
        type:"answer",
        name:that.peerName,
        answer:answer1
      });
      console.log("Answer created");
      console.log(answer1);
      that.peerConnection.setLocalDescription(answer1).then(
                                                  localSuccess,
                                                  localUnsuccess);
    });
  }

  this.offerConnection = function(){
    createNewConnection();
    createDataChannel();
    sendOffer();
  };
  this.acceptAnswer = function(answer){
    setRemoteDescription(answer);
  }
  this.acceptConnection = function(offer){
    console.log("Received Offer");
    createNewConnection();
    acceptDataChannel();
    setRemoteDescription(offer);
    sendAnswer();
  };
  this.remoteIceCandidate = function(candidate)
  {
    this.peerConnection.addIceCandidate(
      new RTCIceCandidate(candidate)).then(
                                      iceAddedSuccess,
                                      iceAddedUnsuccess);
  }
  var setRemoteDescription = function(something){
    that.peerConnection.setRemoteDescription(something).then(
                                                remoteSuccess,
                                                remoteUnsuccess);
  }

  var onDataChannelCreation = function () {
    console.log("Data Channel Created");
    var par = that;
    that.dataChannel.onopen = function(event){
      par.onopen(event);
    }
    that.dataChannel.onmessage = function(event){
      par.onmessage(event);
    }

  }

  var iceAddedSuccess = function(event){
    console.log("Added Ice Successfully");
  }
  var iceAddedUnsuccess = function(event){
    console.log("Add Ice Unsuccessfull");
  }
  var localSuccess = function(event){
    console.log("Local description set successfully");
  }
  var localUnsuccess = function(event){
    console.log("Local description not set successfully");
  }
  var remoteSuccess = function(event){
    console.log("Remote description set Successfully");
  }
  var remoteUnsuccess = function(event){
    console.log("Remote description set Successfully");
  }
}
peerChannel.prototype.onopen = function(event){
  console.log("Data Channel Is Now Open");
}
peerChannel.prototype.onmessage = function(event){
  console.log("Received Message",event.data);
}

peerChannel.prototype.toString = function () {
  return this.peerName;
}
module.exports = peerChannel;
