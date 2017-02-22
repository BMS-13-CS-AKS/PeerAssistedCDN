var fs = require('fs')
var path = require('path')
var crypto = require('crypto')
var hasher = require('fixed-size-chunk-hashing')
var fileUtils = require('../util/fileUtils.js')

//var fileName =  process.argv[2]

var outputMeta = function (fileName , callback) {
  var stats = fs.statSync(fileName)
  var fileInfo = {
    size: stats.size
  }

  var file = fs.createReadStream(fileName)
  fileUtils.getDetailsFromSize(fileInfo)
  var CHUNK_SIZE = fileInfo.pieceLength

  console.log("SAdsadad");
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
var createMeta = function () {
  var argv = require('minimist')(process.argv.slice(2))

  var odirectory = argv.o
  var idirectory = argv.i
  fs.readdir(idirectory, function (err, files) {
    files.forEach(function (file) {
      var writeToFile = function( filename , outputJSON ){
        var oFileName = path.join(odirectory, file.split('.')[0]+'.json')
        var outputFile = fs.createWriteStream(oFileName)
        console.log(outputJSON)
        outputFile.end(JSON.stringify(outputJSON))
      }
      //console.log(file)
      outputMeta(path.join(idirectory,file),writeToFile )
    })
  })
}
if ( require.main === module ) {
  createMeta()
}
else {
  module.exports = outputMeta
}
