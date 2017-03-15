//Server 

var net = require('net')
var streamSet = require('stream-set')
var jsonStream = require('duplex-json-stream')
var register = require('register-multicast-dns')

register(process.argv[2])

//maintain sets of clients (5 in our case)
var clients = streamSet()

var server = net.createServer(function(socket){
  //make socket  support json
  socket = jsonStream(socket)

  //tracking the clients
  clients.add(socket)

  //sending the commands to clients
  process.stdin.on('data', function (data) {
    var message = {
      from: 'server',
      command : data.toString()
    }
    socket.write(message)
  })

  /*
  //reading response from client 
	socket.on('data', function (data) {
    clients.forEach(function (client) {
      //if (friend !== socket) 
      client.write(data)
    })
	})
  */
})

server.listen(8088)
