WebSocket.prototype.sendJSON = function(message){
  this.send(JSON.stringify(message));
}
var connection = new WebSocket("ws://192.168.0.104:9090");
var peer;
connection.onmessage = function(message){
  //Parse the message to get the JS object
  data = JSON.parse(message.data);
  switch(data.type)
  {
    case 'login':onLogin(data.success);break;
    case 'offer':onOffer(data.offer,data.name);break;
    case 'answer':onAnswer(data.answer);break;
    case 'candidate':onReceiveCandidate(data.candidate);break;
    default:console.log("Could not parse:" + data);
  }

}

function onLogin(success){
  console.log("Successfully logged");
}

function onOffer(offer,name){
  var configuration = {
    "iceServers": [{ "url": "stun:stun.1.google.com:19302" }]
  };
  peer = new peerChannel(name,connection,configuration);
  peer.acceptConnection(offer);
}
function onAnswer(answer){
  peer.acceptAnswer(answer);
}
function onReceiveCandidate(candidate){
  peer.remoteIceCandidate(candidate);
}
function sendOffer(name){
  var configuration = {
    "iceServers": [{ "url": "stun:stun.1.google.com:19302" }]
  };
  peer = new peerChannel(name,connection,configuration);
  peer.offerConnection();
}
