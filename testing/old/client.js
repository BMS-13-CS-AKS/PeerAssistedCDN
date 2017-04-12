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
  console.log('Recieved command from ', data.from)
  console.log('Command is ' , data.command)

  var driver = new webdriver.Builder()
    .forBrowser('chrome')
    .build()

  browsers.push(driver)

  driver.get('http://localhost:8000') 

  /*
  setTimeout(function () {
    driver.findElement({id: 'loaded'}).then (function (el) {
      el.getText().then(function (string) {
        socket.write({result: string})
        console.log(string)
      })
      //console.log(el)
      //socket.write({result: el.getText()})
    })
  }, 2000)
  */

  console.log('checking haha')
  var element = driver.wait(until.elementLocated(By.id('loaded')));
  element.getText()
    .then(function (string) {
      socket.write({result: string})
      console.log(string)
    })

  




  //TODO Use selenium to create 5 different instances of chrome and perform actions   

  //TODO Perform same/different (?) action on each instance according to command received

  //TODO Send the  data from chrome  after above actions are performed
})



