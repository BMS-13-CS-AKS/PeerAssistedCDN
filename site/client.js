// This is our connection with the websocket server
var connection = new WebSocket("ws://192.168.0.104:9090");
var username = '';

// Our various inputs and buttons
var userText = document.querySelector("#user");
var peerText = document.querySelector("#peer");
var messageText = document.querySelector("#message");
var rcvText = document.querySelector("#rcv");
var sendButton = document.querySelector("#sendbutton");
var userButton = document.querySelector("#userbutton");
var peerButton = document.querySelector("#peerbutton");

sendButton.addEventListener("click",sendButtonClicked);
userButton.addEventListener("click",userButtonClicked);
peerButton.addEventListener("click",peerButtonClicked);

// This is our webRTC peer connection
var peerConnection;
var peername = '';

// The data channel corresponding to our webRTC peerConnection
var dataChannel;

// Defining what happens when we receive a message from the signaling server
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
// Function to send JSON to signaling server
function sendMessage(message){
  connection.send(JSON.stringify(message));
}

// Step 1:Both users will have to provide a username and send it to the server
// Signaling server will return success if username didnt exist
function userButtonClicked(event){
  var text = userText.value;
  if(text.length > 0){
    sendMessage({type:"login",name:text});
    username = text;
  }
}
// This is called when we get login success msg from server
function onLogin(success){
  if(success)
  {
    console.log("Successfully logged username");
  }
}

// Step 2:One of the peers will type in the other peers name and establish conn.
// This involves:
// creating new RTCPeerConnection object
// Setting onicecandidate handler for the object
// creating data channel for the object
// creating sdp offer using the object
// setting local description to that offer
// sending offer to the peer via signaling server
function peerButtonClicked(event){
  peername = peerText.value;
  if(peername.length>0)
  {
    createPeerConnection();
    createDataChannel("offerer");
    sendOffer(peername);
  }
}
// Creating a new peer connection object
// we set the ice servers here
// we also set the onicecandidate handler here
function createPeerConnection(){
  console.log("creating peer connection");
  var configuration = {
    "iceServers": [{ "url": "stun:stun.1.google.com:19302" }]
  };
  //configuration = null;
  some = null;
  peerConnection = new RTCPeerConnection(configuration,some/*{
           optional: [{RtpDataChannels: true}]
        }*/);
  peerConnection.onicecandidate = onIceCandidate;
}
// icecandidate handler
// whenever we receive a Ice candidate event ...
// ....we send the ice candidate to the peer
function onIceCandidate(event){
  console.log("Sending ice candidate");
  if((event.candidate && peername))
    sendMessage({
      name:peername,
      type:"candidate",
      candidate:event.candidate
    });
}

// Sending an offer to another peer via signaling serve
function sendOffer(peername){
  peerConnection.createOffer().then(function(offer1){
    console.log("Offer created");
    console.log(offer1);
    sendMessage({
      type:"offer",
      name:peername,
      offer:offer1
    });
    peerConnection.setLocalDescription(offer1).then(
                                              localsuccess,
                                              localunsuccess );
  });
}
// Step 3: The other peer receives the offer
// He the creates a new RTCPeerConnection object
// creates data channel
// NOTE: he doesnt have to recreate a dataChannel object,but just set ..
// ..ondatachannel handler.Read the createDataChannel function for more details
// He sets remote description to offer
// He then creates an answer and sets local description to the answer and ...
// ... sends the answer
function onOffer(offer,name){
  console.log("Received offer");
  console.log(offer);
  peername = name;
  createPeerConnection();
  createDataChannel("receiver");
  peerConnection.setRemoteDescription(offer).then(
    remotesuccess,
    remoteunsuccess);
    sendAnswer(peername);
  }

// Sending an Answer to another peer via signaling server
function sendAnswer(peername){
  peerConnection.createAnswer().then(function(answer1){

    sendMessage({
      type:"answer",
      name:peername,
      answer:answer1
    });
    console.log("Answer created");
    console.log(answer1);
    peerConnection.setLocalDescription(answer1).then(
                                                localsuccess,
                                                localunsuccess);

  });
}
// Step 4:Initial peer gets the answer and sets remote description to answer
// On reply from another peer
function onAnswer(answer){
  console.log("Received Answer");
  console.log(answer);
  peerConnection.setRemoteDescription(answer).then(
    remotesuccess,
    remoteunsuccess);
  }


// The above steps show the exchange of the descriptions
// During this we keep sending ice candidates to the other peer
// Following functions define what happens when we receive candidate from peer
function onReceiveCandidate(candidate){
  console.log("Received Ice candidate");
  console.log(candidate);
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).then(
                                                            iceAddedSuccess,
                                                            iceAddedUnsuccess);
}

// Just logging functions
function iceAddedSuccess(event){
  console.log("Added Ice Successfully");
}

function iceAddedUnsuccess(event){
  console.log("Add Ice Unsuccessfull");
}
function localsuccess(event){
  console.log("Local description set successfully");
}
function localunsuccess(event){
  console.log("Local description not set successfully");
}
function remotesuccess(event){
  console.log("Remote description set Successfully");
}
function remoteunsuccess(event){
  console.log("Remote description set Successfully");
}

// This function creates a data channel
// The person who first offers creates a new object
// The person who receives the offer just sets a handler for data channel event
function createDataChannel(who){
  if(who == "offerer")
  {
    dataChannel = peerConnection.createDataChannel("O",{reliable:false});
    attachListeners(dataChannel);
  }
  else if(who == "receiver")
  {
    console.log("Setting receiver call back for data channel");
    peerConnection.ondatachannel = receiveDataChannel;
  }
}
// Handler for receiving data channel event
function receiveDataChannel(event){
  dataChannel = event.channel;
  attachListeners(dataChannel);
}

// Attaching listeners to the datachannel
function attachListeners(something){
  console.log(something);
  something.onopen = function(event){
    console.log("DataChannel open");
  }
  something.onmessage = receiveMessage;
}
function receiveMessage(event){
  console.log(event.data);
rcvText.textContent = event.data;
}
// Send Message to another peer
function sendButtonClicked(event){
  var text = messageText.value;
  if(dataChannel.readyState == "open" && text.length>0)
  {
    console.log("sending" + text);
    dataChannel.send(text);
  }
}
