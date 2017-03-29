/**********************************************/
var blessed = require('blessed');
// Create a screen object.
var screen = blessed.screen({
  smartCSR: true
});
screen.title = "Signaling Server";

var infoBox = blessed.box({
  parent: screen,
  //padding: 2,
  scrollable: true,
  left: '0px',
  top: '2%',
  width: '48%',
  height: '47%',
  content: "",
  tags:true,
  keys: true,
  vi: true,
  scrollbar: {
    ch: ' ',
    inverse: true
  },
  style: {
    fg: 'black',
    bg: 'white',
    hover:{bg:"black",fg:"green"}
  }
});

var userBox = blessed.box({
  parent: screen,
  //padding: 2,
  scrollable: true,
  left: '0px',
  top: '50%',
  width: '48%',
  height: '50%',
  content: "",
  keys: true,
  vi: true,
  alwaysScroll: true,
  scrollbar: {
    ch: ' ',
    inverse: true
  },
  style: {
    fg: 'black',
    bg: 'white',
    hover:{bg:"black",fg:"green"}
  }
});

var logBox = blessed.Log({
  parent: screen,
  //padding: 2,
  scrollable: true,
  left: '51%',
  top: '0px',
  width: '48%',
  height: '100%',
  content: "",
  keys: true,
  alwaysScroll:true,
  scrollbar: {
    ch: ' ',
    inverse: true
  },
  style: {
    fg: 'black',
    bg: 'white',
    hover:{bg:"black",fg:"green"}
  }
});

screen.render();
// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});
console.log = function(){
  message = "";
  for(key in arguments)
  {
    message = message + arguments[key];
  }
  logBox.log(message);
}
/**********************************************/
var randPerm = require('../util/random.js')
// require our websocket library
var WebSocketServer = require('ws').Server;
// creating a websocket server at port 9090
var wss = new WebSocketServer({port: 9090});

// all connected to the server users
var users = {};
var trackers = {};
console.log("server starting")
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
      signal(onOffer)
      break;

      case "answer":
      signal(onAnswer)
      break;

      case "candidate":
      signal(onCandidate)
      break;

      case "leave":
      onLeave()
      break;

      case "status":
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

    function signal(callback) {
      if(!users[data.name])
      {
        removePeer(data.name);
        return;
      }
      else
      {
        callback();
      }
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
      var result = {};
      result.type = 'response';
      result.answer = {};
      console.log("Received request for"+data.infoHashes[0][0]);
      // Page wise mode
      if(data.mode == 1)
      {
        var reqInfoHash= data.infoHashes[0][0]
        var resultPeers = getPeers(reqInfoHash)
        var myIndex = resultPeers.indexOf(connection.name)
        if (myIndex !== -1)
          resultPeers.splice(myIndex, 1)
        result.answer[data.infoHashes[0][0]] = resultPeers;
        addPeer(data.infoHashes[0][0], connection.name);
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
      removePeer(connection.name)
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
    trackers[infohash].push(peer);
  }
  if(users[peer].infoHash.indexOf(infohash) < 0)
  {
    users[peer].infoHash.push(infohash);
  }
}

// Function to remove peer if dead
function removePeer(name) {
  if(users[name])
  {
    console.log("Removing peer",name,"from infoHashes")
    ihofPeer = users[name].infoHash

    for(var ind in ihofPeer)
    {
      console.log("Removing peer",name,"from",ihofPeer[ind])
      removePeerFromInfoHash(ihofPeer[ind], name);
    }
    delete users[name]
  }
}
function removePeerFromInfoHash(infoHash, peer) {
  if(!trackers[infoHash])
    return;
  else
  {
    var ind = trackers[infoHash].indexOf(peer)
    if ( ind > -1 )
    {
      trackers[infoHash].splice(ind,1);
    }
  }
}
// Get list of peers from infohash
function getPeers(infoHash) {
  if (!trackers[infoHash])
    return []
  //total no. of peers available
  var count = trackers[infoHash].length

  // if no of peers is less than 10 then return all peers
  var result  = [] //stores final value

  //randPerm(n) returns array with value 0 to n shuffled randomly
  var permTable = randPerm(count)

  //sends all peers if count is less than 10
  if (count < 10) {
    permTable.forEach(function (val) {
      result.push(trackers[infoHash][val])
    })
    return result
  }
  else {
    //selecting and sending 10 random peers
    slectedPerm = permTable.slice(0, 10)
    slectedPerm.forEach(function (val) {
      result.push(trackers[infoHash][val])
    })
    return result
  }
}

// Adds infohash to tracker list
function addInfohash(infoHash) {
  return;
}

function showInfo(){
  infoBoxHeader = "INFOHASH TO USERS MAP\n";
  infoBoxHeader+= "---------------------\n";
  userBoxHeader = "USERS MAP\n";
  userBoxHeader+= "---------------------\n";
  infoBox.setContent(infoBoxHeader+JSON.stringify(trackers,null,2));
  var temp_d = {}
  for(var user in users)
  {
    temp_d[user] = users[user].infoHash;
  }
  userBox.setContent(userBoxHeader+JSON.stringify(temp_d,null,2));
  screen.render();
}

setInterval(showInfo,100);
