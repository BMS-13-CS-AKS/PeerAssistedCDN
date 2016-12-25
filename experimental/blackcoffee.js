var peerChannel = require("./peerChannel.js");
var thor = function(address){
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
}
window.thor = thor;
