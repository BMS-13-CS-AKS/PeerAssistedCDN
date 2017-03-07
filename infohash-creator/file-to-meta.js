var fs = require('fs')
var path = require('path')
var crypto = require('crypto')
var hasher = require('fixed-size-chunk-hashing')
var fileUtils = require('../util/fileUtils.js')


//creates metainfo from name of the file
var outputMeta = function (fileName , callback) {
  var stats = fs.statSync(fileName)
  var fileInfo = {
    size: stats.size
  }

  var file = fs.createReadStream(fileName)
  fileUtils.getDetailsFromSize(fileInfo)
  var CHUNK_SIZE = fileInfo.pieceLength

  file.pipe(hasher(CHUNK_SIZE,{hash: 'sha1'}, function (err, hashes) {
    if (err) throw err

    var id = crypto.createHash('sha1')
      .update(hashes.join('\n'))
      .digest()
      .toString('hex')

    var outputJSON = {}

    outputJSON.size = fileInfo.size
    outputJSON.infoHash = id
    outputJSON.fileName = fileName
    outputJSON.pieceHash = hashes
    callback(fileName , outputJSON)
  }))

}

//if running using node (Example: node thisprogram.js) 
if ( require.main === module ) {
  // createMeta function called
  createMeta()
}
//if required as a module
else {
  module.exports = outputMeta
}


//function that uses outputMeta function defined above
//Does three things:
//create k
function createMeta() {
  var argv = require('minimist')(process.argv.slice(2))

  // can call program as node program.js -o argument1 -i argument2
  var odirectory = argv.o
  var idirectory = argv.i

  fs.readdir(idirectory, function (err, files) {
    files.forEach(function (file) {
      //console.log(file)
      outputMeta(path.join(idirectory,file),writeToFile )

      function writeToFile( filename , outputJSON ){
        console.log(file, " ====", filename)
	var fNameArr = file.split('.').slice(0,-1).join('.')
        var oFileName = path.join(odirectory, fNameArr + '.json')
        var outputFile = fs.createWriteStream(oFileName)
        console.log(outputJSON)
        outputFile.end(JSON.stringify(outputJSON))
      }
    })
  })
}
