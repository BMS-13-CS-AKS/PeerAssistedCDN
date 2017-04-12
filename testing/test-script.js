//embed this script while 

var websocket = require('websocket-stream')
var ws = websocket('ws://localhost:8500')


//global variables
var count = 0
var imageElements

//count the number of image elements
setTimeout(function () {
  imageElements = document.querySelectorAll('.imgPar')
  count = imageElements.length
  console.log('COUNT', count)
},4000)


//run after 10 seconds and clears after total = no. of images
var testloop = setInterval(function () {
  var pprogress = 0
  var sprogress = 0
  var total = 0
  for (var i = 0; i < count ; i++) {
    pBar = imageElements[i].childNodes[1]
    pprogress += Number(pBar.getAttribute('value')) 
    sBar = imageElements[i].childNodes[2]
    sprogress += Number(sBar.getAttribute('value')) 
    console.log ('peer progress', pprogress)
    console.log ('server progress', sprogress)
    total = pprogress + sprogress
    total = Math.round(total)
    console.log('TOTAL: ', total)
  }

  if (total === count){
    var el = document.createElement('p')
    el.setAttribute('id', 'finalprogress')
    //el.style.visibility = 'hidden'
    var finalProgress = pprogress + ' '+ sprogress
    ws.end(finalProgress)
    el.textContent = finalProgress
    document.body.appendChild(el)
    console.log('Done')
    clearInterval(testloop)
  }
}, 5000)

