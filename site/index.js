var fs = require('fs')
var path = require('path')
var http = require('http')
var hyperstream = require('hyperstream')
var ecstatic = require('ecstatic')
var st = ecstatic('.')
var logger = require("../util/log.js")
//state of the program
var server = http.createServer( function (req, res) {
  // reads contents of directory provided from command line

  if (req.url === '/testsite1/') {
    var prefix = (process.argv[2] === undefined) ? '': process.argv[2] + '-'
    var tags = []
    fs.readdir("test_images", function (err, files) {
      //creates image tag out of each file name
      files.forEach(function (fileName) {
        var myPath = path.join("..","test_images",fileName)
        myPath = './'+ myPath
        var par = '<div class="imgPar">'
        var imgSrc = `<img ${prefix}src="${myPath}" alt="${fileName.split('.')[0]}" />`
        var parClose = '</div>'
        tags.push(par+imgSrc+parClose)
      })
      console.log(tags.length)

      //templating using hyperstream
      fs.createReadStream(path.join("testsite1","index.html"))
        .pipe(hyperstream({
          '#container': tags.join('\n')
        }))
        .pipe(res)
        .on('end', function() {
          res.end()
        })
    })
  }
  else {
    //serves static folder
    st (req,res)
  }
})


server.listen(5000,function() {
  console.log('listeining on port 5000')
})
