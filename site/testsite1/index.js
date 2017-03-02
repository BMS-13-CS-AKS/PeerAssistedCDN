var fs = require('fs')
var path = require('path')
var http = require('http')
var hyperstream = require('hyperstream')
var ecstatic = require('ecstatic')
var st = ecstatic('.')

//state of the program
var server = http.createServer( function (req, res) { 
  // reads contents of directory provided from command line

  if (req.url === '/') {
    var prefix = (process.argv[2] === undefined) ? '': process.argv[3] + '-'
    var tags = []
    fs.readdir("input", function (err, files) {
      //creates image tag out of each file name
      files.forEach(function (fileName) {
        var myPath = path.join("input",fileName)
        myPath = './'+ myPath
        var imgSrc = `<img ${prefix}src="${myPath}" alt="${fileName.split('.')[0]}" />`
        tags.push(imgSrc)
      })
      console.log(tags.length)
      fs.createReadStream('./index.html')
        .pipe(hyperstream({
          '#container': tags.join('\n')
        }))
        .pipe(res)
      //res.write(tags.length+'\n')
      //res.end()
    })
  }
  else {
    //serves static folder
    st (req,res)
  }
})


server.listen(5000)
