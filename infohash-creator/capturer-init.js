// to run node capturer-init image_dir prefix

var fs = require('fs')
var http = require('http')

var prefix = process.argv[3] || ''
if (prefix !== '') {
  prefix =  prefix + '-' 
}

var filePaths = []

var server = http.createServer(function (req,res) {
  fs.readdir(process.argv[2], onreadDir)
  if(req.url === '/') {
    filePaths.forEach(function (fileName) {
      var outputHTML = `<img ${prefix}src = "${fileName}" /> `
      res.end(outputHTML +'\n')
    })
  }
})

function onreadDir (err, files) {
  files.forEach( function (fileName) {
    filePaths.push(process.argv[2] + '/' + fileName)
  })
}


server.listen(8011)
