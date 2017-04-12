var http = require('http')
var websocket = require('websocket-stream')

var httpServer = http.createServer( function (req, res) {

})

httpServer.listen(8500, function () {
  console.log('listening at port 8500')
})

var wss = websocket.createServer({server: httpServer}, function (stream) {
  stream.on('data', function (data) {
    console.log('DATA', data.toString())
  })
})

