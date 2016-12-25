(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
      that.onDataChannelCreation();

  }
  var acceptDataChannel = function(){
    that.peerConnection.ondatachannel = function(event){
      that.dataChannel = event.channel;
      that.onDataChannelCreation();
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
peerChannel.prototype.toString = function () {
  return this.peerName;
};
module.exports = peerChannel;

},{}],2:[function(require,module,exports){
var peerChannel = require("./peerChannel.js");

// TODO : Properly hide all functions
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
}
window.thor = thor;

},{"./peerChannel.js":1}]},{},[2]);
