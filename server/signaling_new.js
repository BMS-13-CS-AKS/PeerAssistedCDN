
// require our websocket library
var WebSocketServer = require('ws').Server;
// creating a websocket server at port 9090
var wss = new WebSocketServer({port: 9090});

// all connected to the server users
var users = {};
var trackers = {};

// when new user connects to our sever
wss.on('connection', function(connection) {

  console.log("New user connected");

  //when server gets a message from a connected user
  connection.on('message', function(message) {
    var data;
    //accepting only JSON messages
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.log("Invalid JSON");
      data = {};
    }
    if(!connection.name && (data.type!='login'))
    {
      sendTo(connection,{type:"error",
                         message:"Havent captured username"});
      return;
    }
    //switching type of the user message
    switch (data.type) {
      //when a user tries to login

      case "login":
      onLogin();
      break;
      case "offer":
      onOffer()
      break;

      case "answer":
      onAnswer()
      break;

      case "candidate":
      onCandidate()
      break;

      case "leave":
      onLeave()
      break;

      case "request":
      onRequest()
      break;

      case "seed":
      onSeed();
      break;

      default:
      onDefault();
      break;
    }

    //functions handling above cases
    function onDefault() {
      sendTo(connection, {
        type: "error",
        message: "Invalid message type: " + data.type
      });
    }

    function onOffer() {
      //for ex. UserA wants to call UserB
      //if UserB exists then send him offer details
      var conn = users[data.name].connection;
      if(conn != null) {
        console.log("Sending offer from ", connection.name," to ",data.name);
        sendTo(conn, {type: "offer",
                      offer: data.offer,
                      name: connection.name});
      }
      else
      {
        console.log("Received offer for invalid peer");
      }
    }

    function onAnswer() {
      console.log("Sending answer to: ", data.name,"from "
      ,connection.name);
      //for ex. UserB answers UserA
      var conn = users[data.name].connection;

      if(conn != null) {
        connection.otherName = data.name;
        sendTo(conn, {
          type: "answer",
          answer: data.answer,
          name: connection.name
        });
      }
    }

    function onCandidate() {
      console.log("Sending candidate to:",data.name);
      var conn = users[data.name].connection;
      if(conn != null) {
        sendTo(conn, {
          type: "candidate",
          candidate: data.candidate,
          name:connection.name
        });
      }
    }

    function onLeave() {
      console.log("Disconnecting from", data.name);
    }

    function onRequest() {
      var result = {}
      result.type = 'response'
      // Page wise mode
      if(data.mode == 1)
      {
        result.answer[infoHash] = getPeers(infoHash);
        addPeer(infoHash, connection.name);
      }
      else
      {
        for (i  = 0; i < data.infoHashes.length; i++) {
          var infohash = data.infoHashes[i];
          result.answer[infohash] = getPeers(infohash);
          addPeer(infohash, connection.name);
        }
      }
      sendTo(connection, result);
    }


    function onLogin() {
      console.log("User requested for ", data.name);
      var newPeer = addNewPeer(data.name, connection);
      if(newPeer)
      {
        sendTo(connection, {type: "login",success: true});
        console.log("Added new peer:",data.name);
      }
      else
      {
        sendTo(connection, {type: "login",success: false});
        console.log("Failed to add new peer:",data.name);
      }
    }

    function onSeed() {
      for (i  = 0; i < data.infoHashes.length; i++) {
        var infohash = data.infoHashes[i];
        addPeer(infohash, connection.name)
      }
    }

  });

  connection.on("close", function() {
    if(connection.name)
    {
      delete users[connection.name];
    }
  });

  function sendTo(connection, message) {
    connection.send(JSON.stringify(message));
  }
});

// Add a new peer
function addNewPeer(peer,connection){
  if(users[peer])
    return null;
  connection.name = peer;
  users[peer] = { connection:connection ,infoHash:[] };
  return users[peer]
}

// Adds peer to infohash
// If infohash doesnt exist start tracking it
function addPeer(infohash, peer) {
  if(!trackers[infohash])
  {
    trackers[infohash] = [];
  }
  if(trackers[infohash].indexOf(peer) < 0)
  {
    trackers[infoHash].push(peer);
  }
  if(users[peer].indexOf(infohash) < 0)
  {
    users[peer].push(infohash);
  }
}

// Get list of peers from infohash
function getPeers(infoHash) {
  return trackers[infoHash];
}

// Adds infohash to tracker list
function addInfohash(infoHash) {
  return;
}

// Remove peer if it's dead
function removePeer(peer) {

}
