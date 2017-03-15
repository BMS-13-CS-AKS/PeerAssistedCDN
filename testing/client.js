//Client

var net = require('net')
var jsonStream = require('duplex-json-stream')
require('lookup-multicast-dns/global')

//socket stream
var socket = jsonStream(net.connect(8088, 'server.local'))

//handle command received from the server
socket.on('data', function(data) {
  console.log('Recieved command from ', data.from)
  console.log('Command is ' , data.command)
  
  //TODO Use selenium to create 5 different instances of chrome and perform actions   

  //TODO Perform same/different (?) action on each instance according to command received

  //TODO Send the  data from chrome  after above actions are performed
})



