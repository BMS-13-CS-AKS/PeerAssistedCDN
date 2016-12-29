var peerChannel = require("./peerChannel.js");
var thorFile = require("./thorFile.js")

// TODO : Properly hide all functions
var thor = function(address){
  var thorFiles = {};
  var that = this;
  var peerList = {};
  var configuration = {
    "iceServers": [{ "url": "stun:stun.1.google.com:19302" }]
  };

  this.name;
  this.address = address;

  WebSocket.prototype.sendJSON = function(message){
    this.send(JSON.stringify(message));
  }
  var trackerServer = new WebSocket(this.address);

  trackerServer.onmessage = function(message){
    //Parse the message to get the JS object
    data = JSON.parse(message.data);
    switch(data.type)
    {
      case 'login':onLogin(data.success);
      break;
      case 'offer':onOffer(data.offer,data.name);
      break;
      case 'answer':onAnswer(data.answer,data.name);
      break;
      case 'candidate':onReceiveCandidate(data.candidate,data.name);
      break;
      default:console.log("Could not parse:" + data);
    }

  }
  this.start = function(){
    if(!this.name)
    {
      this.name = randomUserName();
    }
    login();
  }
  this.connect = function(name){
    console.log("Offering connection to "+ name);
    peerList[name] = new peerChannel(
                                name,
                                trackerServer,
                                configuration);
    peerList[name].offerConnection();
  }

  var randomUserName = function(){
    var chars = "abcdefghijklmnopqrstuvwxyz0123456789"
    var res = "";
    for(i=0;i<20;i++){
      res += chars[Math.floor(Math.random()*36)];
    }
    return res;
  }
  var login = function(){
    console.log(
      "Attempting to capture username "+ that.name );
    trackerServer.sendJSON({
      type:"login",
      name:that.name
    });
  }
  var onLogin  = function(success){
    if(success){
      console.log("Captured Username");
    }
  }
  var onOffer = function(offer,name){
    if(!peerList[name])
    {
      console.log("Accepting connection from "+ name);
      peerList[name] = new peerChannel(
                                  name,
                                  trackerServer,
                                  configuration);
      peerList[name].acceptConnection(offer);
    }
    else console.log(
          "Peer Connection Exists:"+
          "Rejecting connection from "
          + name)
  }
  var onAnswer = function(answer,name){
    if(peerList[name])
    {
      peerList[name].acceptAnswer(answer);
    }
  }
  var onReceiveCandidate = function(candidate,name){
    console.log("candidate received");
    if(peerList[name]){
      peerList[name].remoteIceCandidate(candidate);
    }
  }

  // Extending the peerChannel prototype
  peerChannel.prototype.onDataChannelCreation = function () {
    console.log("Data Channel Created");
    this.dataChannel.onopen = function(event){
      console.log("Data channel is open");
    }
  };
  
  // Let the handshake include the following:
  // Bitfield message for each file
  peerChannel.prototype.sendHandShake = function () {

  };

  // Sending the have message
  // Parameters
  // file - A thor file object
  // pieceIndex - index of the piece you have
  peerChannel.prototype.sendHave = function ( file , pieceIndex ) {

  };

  // Sending a request
  // Parameters
  // file - A thor file object
  // pieceIndex - index of the piece
  // blockIndex - index of the block
  // numBlocks - number of blocks
  peerChannel.prototype.sendRequest = function(
                                      file,
                                      pieceIndex,
                                      numBlocks ){

  };

  // Sending a block
  // Parameters
  // file - A thor file object
  // pieceIndex - index of the piece
  // blockIndex - index of the block
  // numBlocks - number of blocks
  // block - the block itself,this will be an Int8Array object
  peerChannel.prototype.sendBlock  = function(
                                      file1
                                      pieceIndex,
                                      numBlocks,
                                      block){


  };


}
window.thor = thor;
