var fs = require('fs')
var vdom = require('virtual-dom')
var createElement = require('virtual-dom/create-element')
var hyperx = require('hyperx')
var hx = hyperx(vdom.h)
var path = require('path')
var http = require('http')
var hyperstream = require('hyperstream')
var ecstatic = require('ecstatic')
var st = ecstatic('.')

//state of the program
var tags = []

var server = http.createServer( function (req, res) { 
  // reads contents of directory provided from command line

  if (req.url === '/main') {
    fs.createReadStream('./index.html')
      .pipe(hyperstream({
        '#container': tags.join('\n')
      }))
      .pipe(res)
  }
  else if (req.url === '/') {
    fs.readdir(process.argv[2], function (err, files) {
      //creates image tag out of each file name
      files.forEach(function (fileName) {
        var myPath = path.join(process.argv[2],fileName)
        myPath = './'+ myPath
        var imgSrc = hx
          `<img src="${myPath}" alt="${fileName.split('.')[0]}" />`
        tags.push(createElement(imgSrc).toString())
      })
      res.write(tags.length+'\n')
      res.end()
    })
  }
  else {
    //serves static folder
    st (req,res)
  }
})


server.listen(5000)
