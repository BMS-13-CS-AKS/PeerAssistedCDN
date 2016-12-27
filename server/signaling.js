//require our websocket library
var WebSocketServer = require('ws').Server;

//creating a websocket server at port 9090
var wss = new WebSocketServer({port: 9090});

//all connected to the server users
var users = {};

//when a user connects to our sever
wss.on('connection', function(connection) {

   console.log("User connected");

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

      //switching type of the user message
      switch (data.type) {
         //when a user tries to login

         case "login":
            console.log("User logged ", data.name);

            //if anyone is logged in with this username then refuse
            if(users[data.name]) {
               sendTo(connection, {
                  type: "login",
                  success: false
               });
            } else {
               //save user connection on the server
               users[data.name] = connection;
               connection.name = data.name;

               sendTo(connection, {
                  type: "login",
                  success: true
               });
            }

            break;

         case "offer":
            //for ex. UserA wants to call UserB
            console.log("Sending offer to: ", data.name);

            //if UserB exists then send him offer details
            var conn = users[data.name];

            if(conn != null) {
               sendTo(conn, {
                  type: "offer",
                  offer: data.offer,
                  name: connection.name
               });
            }

            break;

         case "answer":
            console.log("Sending answer to: ", data.name,"from "
                                      ,connection.name);
            //for ex. UserB answers UserA
            var conn = users[data.name];

            if(conn != null) {
               connection.otherName = data.name;
               sendTo(conn, {
                  type: "answer",
                  answer: data.answer,
                  name: connection.name
               });
            }

            break;

         case "candidate":
            console.log("Sending candidate to:",data.name);
            var conn = users[data.name];

            if(conn != null) {
               sendTo(conn, {
                  type: "candidate",
                  candidate: data.candidate,
                  name:connection.name
               });
            }

            break;

         case "leave":
            console.log("Disconnecting from", data.name);
            break;

         case "request":
            if(!connection.name)
            break;
            console.log("Received request from"+connection.name);
            var peersAnswer = Object.keys(users);
            console.log(peersAnswer);
            peersAnswer.splice(
              peersAnswer.find
              (function(element){return element == connection.name}),
              1);
            console.log("sending answer" + peersAnswer);
            sendTo(connection , peersAnswer);
            break;
         default:
            sendTo(connection, {
               type: "error",
               message: "Command not found: " + data.type
            });
            break;

      }
   });


  connection.on("close", function() {
    if(connection.name)
    {
        delete users[connection.name];
    }
  });


});

function sendTo(connection, message) {
   connection.send(JSON.stringify(message));
}
