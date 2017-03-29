var crypto = require('crypto-browserify')
var log = require('../util/log.js')
var fileUtils  = require('../util/fileUtils.js')

var thorFile = function(){
  var that = this;
  this.url;
  // ArrayBuffer and corresponding typed arrays
  this.file;
  this.views = {};
  this.type;
  this.peerCount = 0;
  this.serverCount = 0;
  // Information about the file
  this.infoHash = new Uint16Array(10);
  this.infoHashStr;
  this.size;

  // Derived from size property
  // numPieces   - number of pieces in the file
  // pieceLength - size of each piece in bytes
  // numBlocks   - number of blocks in each piece
  // defaultBlockSize - number of bytes in each block
  // lastPieceLength  - length of the last piece in the file
  // lastBlockIndex   - the index of the last block in the last piece
  this.numPieces;
  this.pieceLength;
  this.numBlocks;
  this.defaultBlockSize;
  this.lastPieceLength;
  this.lastBlockIndex;

  // Information about each piece

  // Number of pieces remaining;
  this.remainingPieces;
  // haveArray - ArrayBuffer,each bit indicates whether we have
  // the piece at that offset
  // haveArrayInt8 - typed array used to manipulate the haveArray
  this.haveArray;
  this.haveArrayInt8;

  // requestArray - Each bit indicates whether the piece is in request phase
  // requestArrayInt8 - typed  array used to manipulate requestArray
  this.requestArray;
  this.requestArrayInt8;

  // Availability Array
  // Each byte represents number of peers having that piece
  this.availArray;
  this.availArrayInt8;

  // In case we already have the file as a file or blob object and would like to seed it
  // Parameters: file - file or blob object
  this.getFromBlob = function( file , infoHash){
    var fileReader = new FileReader();
    var par = this;
    fileReader.onload = function(event){
      if((typeof this.result) != "string")
      {
        par.file = this.result;
        par.type = "blob";
        par.file.complete = true;
        par.views.arr8 = new Int8Array(par.file);
        par.size = par.file.byteLength;
        console.log("File retreived from blob and views set");
        deriveInfo();
        this.readAsDataURL(file);
      }
      else
      {
        par.onload({
          event:event,
          result:this.result
        });
      }
    }
    setInfoHash(infoHash);
    fileReader.readAsArrayBuffer(file);
  }
  this.getFromInfo = function( metaInfo ){

    // Extract from metaInfo
    this.size = metaInfo.size;
    setInfoHash(metaInfo.infoHash);
    this.url = metaInfo.url;
    this.type = metaInfo.type;
    this.infoHashes = metaInfo.pieceHash

    // Derive the other attributes
    this.calculateDetails();
    this.file = new ArrayBuffer(this.size);
    this.views.arr8 =new Int8Array(this.size);
    this.createPiecesArray();

  }
  this.havePiece = function(index){
    return this.haveArrayInt8[Math.floor(index/8)]&(1<<index%8);
  }
  this.setHavePiece = function(index){
    if(this.havePiece(index))
    return false;
    this.haveArrayInt8[Math.floor(index/8)] |= (1<<index%8);
    this.remainingPieces--;
    this.onPieceComplete(index)
    if(!this.remainingPieces)
    {
      this.oncompletion();
    }
    return true;
  }
  this.setRequestPiece = function(index){
    this.requestArrayInt8[Math.floor(index/8)] |= (1<<index%8);
  }
  this.unsetRequestPiece = function(index){
    this.requestArrayInt8[Math.floor(index/8)] &= ~(1<<index%8);
  }
  // Called on completing download
  // NOTE: not to be called when seeding already completed files
  this.oncompletion = function(){
    if(this.type == "blob")
    {
    this.blob = new Blob([this.views.arr8]);
    var fileReader = new FileReader();
    var par = this;
    fileReader.onload = function( event ){
      par.onload({
        event:event,
        result:this.result
      });
    }
    fileReader.readAsDataURL(this.blob);
    }
  }

  var setInfoHash = function(infoHash){
    that.infoHashStr = infoHash;
    for(var i=0;i<10;i++)
    {
      that.infoHash[i] = infoHash.charCodeAt(i);
    }
  }
  // Rederives file info assuming file is complete
  // Needs to be called when creating from blob
  // Parameters: None
  var deriveInfo = function(){

      that.calculateDetails();
      that.createPiecesArray(1);

  }

  this.createPiecesArray = function(value){

    this.haveArray = new ArrayBuffer(Math.ceil(this.numPieces/8));
    this.haveArrayInt8 = new Int8Array(this.haveArray);
    this.requestArray = new ArrayBuffer(Math.ceil(this.numPieces/8));
    this.requestArrayInt8 = new Int8Array(this.requestArray);
    this.availArray = new ArrayBuffer(this.numPieces);
    this.availArrayInt8 = new Uint8Array(this.availArray);
    if(value){
      for(var i=0;i<this.numPieces;i++)
      this.haveArrayInt8[Math.floor(i/8)] |= 1<<(i%8);
    }
  }

  // Function to update the Availability array
  // Takes as input a bitfield
  this.updateAvailability = function(bitfield){

    for(var i=0;i<bitfield.byteLength;i++)
    {
      var t = bitfield[i];
      var off = i*8;
      while(t)
      {
        var t1 = t & ~(t-1);
        var n = Math.log2(t1) + off;
        this.availArrayInt8[n]++;
        t = t & ~(t1);
      }
    }
  }

  this.updateAvailPiece = function(pieceIndex){
    this.availArrayInt8[pieceIndex]++;
  }
  // Function to find the rarest free piece
  // Returns array: index of rarest piece
  //                (startOff, endOff) of piece
  //                availability of that piece
  // returns null if no piece
  this.chooseRarestPiece = function(){
    var minInd = -1;
    var min = 255;
    for(var i=0;i<this.haveArrayInt8.byteLength;i++)
    {
      var t = (~(this.haveArrayInt8[i])) & (~(this.requestArrayInt8[i]));
      var off = i*8;
      while(t)
      {
        var t1 = t & ~(t-1);
        var n  = Math.log2(t1) + off;
        if(this.availArrayInt8[n] < min)
        {
          min = this.availArrayInt8[n];
          minInd = n;
        }
        t = t & ~(t1);
      }
    }
    if (minInd == -1)
      return null;
    return [minInd, getPieceOffset(minInd), min];
  }
  // This file calculates information on the file
  // The size of the file needs to be known before hand
  this.calculateDetails = function(){
    fileUtils.getDetailsFromSize( this );
    /*
    if(this.size < 268435456)
    {
      this.pieceLength = 262144;
    }
    else if(this.size < 1073741824)
    {
      this.pieceLength = 524288;
    }
    else
    {
      this.pieceLength = 1048576;
    }
    this.numPieces = Math.ceil(this.size / this.pieceLength);
    this.remainingPieces = this.numPieces;
    this.defaultBlockSize = 16*1024;
    this.numBlocks = this.pieceLength / this.defaultBlockSize;
    this.lastPieceLength = this.size % this.pieceLength;
    if(this.lastPieceLength == 0)
    {
      this.lastPieceLength = this.pieceLength;
    }
    this.lastBlockIndex =
    Math.ceil(this.lastPieceLength/this.defaultBlockSize) - 1;
    this.lastBlockSize = this.lastPieceLength%this.defaultBlockSize;
    if(this.lastBlockSize == 0)
    {
      this.lastBlockSize = this.defaultBlockSize
    }
    */
  }
  // Return a specific block if we have it
  // Parameters :
  // pieceIndex - index of piece
  // blockIndex - index of block inside the piece
  // numBlocksReq - number of blocks required
  this.getBlocks = function( pieceIndex , blockIndex , numBlocksReq ){
    if( !this.havePiece(pieceIndex) )
    {
      console.log("Do not have");
      return null;
    }

    var range = getArrayOffsets( pieceIndex , blockIndex , numBlocksReq );
    if(range == null)
    return null;
    return this.views.arr8.subarray(range[0],range[1]+1);

  }
  var getPieceNoVal = function( pieceIndex){
    //find number of blocks
    var lastPiece = that.numPieces - 1
    var numBlocks =
    (pieceIndex === lastPiece) ? that.lastBlockIndex + 1 : that.numBlocks;
    log.DEBUG([that.lastBlockIndex,that.numBlocks].join());
    log.INFO([lastPiece,numBlocks,pieceIndex].join());
    var range = getArrayOffsets( pieceIndex , 0, numBlocks );
    if(range == null)
    {
      log.ERROR("Could not get piece"+pieceIndex);
      return null;
    }
    return that.views.arr8.subarray(range[0],range[1]+1);
  }

  // Function to get the offset of a certain piece
  // Pass as parameter the piece index
  // Returns (startOff ,endOff ) list
  var getPieceOffset = function(pieceIndex){
    var lastPiece = that.numPieces - 1
    var numBlocks =
    (pieceIndex === lastPiece) ? that.lastBlockIndex + 1 : that.numBlocks;
    var range = getArrayOffsets( pieceIndex , 0, numBlocks );
    if(range == null)
    {
      log.ERROR("Could not get piece"+pieceIndex);
      return null;
    }
    return range
  }
  // Setting specific block range in a piece
  // Parameters :
  // pieceIndex - index of piece
  // blockIndex - index of block inside the piece
  // numBlocksSet - number of blocks
  this.setBlocks = function( pieceIndex , blockIndex , numBlocksSet , Blocks ){
    if( this.havePiece(pieceIndex) )
    {
      return null;
    }
    var range = getArrayOffsets( pieceIndex , blockIndex , numBlocksSet );
    if(range == null || ( Blocks.byteLength != range[1] - range[0] + 1 ) )
    return null;
    this.views.arr8.set( Blocks , range[0] );
    return true;
  }

  this.setPiece = function( pieceIndex , blocks){
    var lastPiece = that.numPieces - 1
    var numBlocks =
    (pieceIndex === lastPiece) ? that.lastBlockIndex + 1 : that.numBlocks;
    this.setBlocks( pieceIndex , 0 ,numBlocks,blocks)
  }
  this.checkPieceIntegrity = function( pieceIndex ){
    var iH = null;
    // find infoHashs
    var piece = getPieceNoVal( pieceIndex )
    log.INFO("checking integrity for piece "+pieceIndex)
    iH = crypto.createHash('sha1').update(piece).digest('hex')
    if(iH != this.infoHashes[pieceIndex])
    {
      logger.ERROR(iH +"!="+this.infoHashes[pieceIndex])
      this.unsetRequestPiece(pieceIndex);
      return false;
    }
    logger.INFO("Piece "+pieceIndex +" integrity verified");
    return this.setHavePiece(pieceIndex);
  }
  // Returns the range of the bytes for set of blocks ..
  // .. in a piece in the form:
  // [ startOffset , endOffset ]
  // Parameters:
  // pieceIndex - index of piece
  // blockIndex - index of block inside the piece
  // numBlocksSet - number of blocks
  var getArrayOffsets = function( pieceIndex , blockIndex , numBlocksReq ){
    var pieceOffset =  pieceIndex * that.pieceLength;

    var startOffset;
    var endOffset;
    if( blockIndex < 0 ||
        pieceIndex < 0 ||
        numBlocksReq <= 0 ||
        pieceIndex > (that.numPieces -1) )
    return null;

    // If it is the last piece
    if(pieceIndex == that.numPieces - 1)
    {
      startOffset = pieceOffset + blockIndex*that.defaultBlockSize;
      if( (blockIndex + numBlocksReq - 1) < that.lastBlockIndex )
      {
        endOffset = pieceOffset + (blockIndex + numBlocksReq )*that.defaultBlockSize -1;
      }
      else if( (blockIndex + numBlocksReq - 1) == that.lastBlockIndex )
      {
        endOffset = that.size - 1;
      }
      else
      return null;
    }
    else
    {
      if( (blockIndex + numBlocksReq - 1) > that.numBlocks -1 )
      return null;
      startOffset = pieceOffset + blockIndex*that.defaultBlockSize;
      endOffset = pieceOffset + (blockIndex + numBlocksReq )*that.defaultBlockSize -1;
    }
    return [startOffset,endOffset];
  }

}
thorFile.prototype.onload = function(event){
  console.log("Complete",event);
}
thorFile.prototype.toString = function(){
  return this.infoHashStr;
}
thorFile.prototype.onPieceComplete = function(pieceIndex){
  return;
}
module.exports = thorFile;
