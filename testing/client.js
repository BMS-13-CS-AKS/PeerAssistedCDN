//Client

var webdriver = require('selenium-webdriver'),
  By = webdriver.By,
  until = webdriver.until
  
var net = require('net')
var jsonStream = require('duplex-json-stream')
require('lookup-multicast-dns/global')

//socket stream
var socket = jsonStream(net.connect(8088, 'server.local'))

var browsers = []
//handle command received from the server
socket.on('data', function(data) {
  console.log('To', data.to)
  console.log('Number of Browsers ' , data.command)

  var count = 0
  var n = parseInt(data.command)
  if (data.to == process.argv[2]) {
    setInterval( function () {
      count ++
      var driver = new webdriver.Builder()
        .forBrowser('chrome')
        .build()
      browsers.push(driver)
      driver.get('http://localhost:5000/testsite1/')
      if (count == n)
        clearInterval(this)
    }, 5000)
  }
})



