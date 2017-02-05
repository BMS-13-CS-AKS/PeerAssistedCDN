var thorFile = function(){
  var that = this;
  this.url;
  // ArrayBuffer and corresponding typed arrays
  this.file;
  this.views = {};
  this.type;
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

  // In case we already have the file as a file or blob object and would like to seed it
  // Parameters: file - file or blob object
  this.getFromBlob = function( file , infoHash){
    var fileReader = new FileReader();
    console.log(file);
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

    this.size = metaInfo.size;
    setInfoHash(metaInfo.infoHash);
    this.calculateDetails();
    this.file = new ArrayBuffer(this.size);
    this.views.arr8 =new Int8Array(this.size);
    this.type = metaInfo.type;
    this.createPiecesArray();

  }
  this.havePiece = function(index){
    return this.haveArrayInt8[Math.floor(index/8)]&(1<<index%8);
  }
  this.setHavePiece = function(index){
    if(this.havePiece(index))
    return;
    this.haveArrayInt8[Math.floor(index/8)] |= (1<<index%8);
    this.remainingPieces--;
    if(!this.remainingPieces)
    {
      this.oncompletion();
    }
  }
  this.setRequestPiece = function(index){
    this.requestArrayInt8[Math.floor(index/8)] |= (1<<index%8);
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
    if(value){
      for(var i=0;i<this.numPieces;i++)
      this.haveArrayInt8[Math.floor(i/8)] |= 1<<(i%8);
    }
  }

  // This file calculates information on the file
  // The size of the file needs to be known before hand
  this.calculateDetails = function(){

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
    console.log(range[0],range[1]);
    return this.views.arr8.subarray(range[0],range[1]+1);

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
  this.checkPieceIntegrity = function( pieceIndex )
  {
    this.setHavePiece(pieceIndex);
    return true;
  }
  // Returns the range of the bytes for set of blocks ..
  // .. in a piece in the form:
  // [ startOffset , endOffset ]
  // Parameters:
  // pieceIndex - index of piece
  // blockIndex - index of block inside the piece
  // numBlocksSet - number of blocks
  var getArrayOffsets = function( pieceIndex , blockIndex , numBlocksReq ){
    console.log(pieceIndex,blockIndex,numBlocksReq);
    var pieceOffset = pieceIndex*that.pieceLength;

    var startOffset;
    var endOffset;
    if( blockIndex < 0 || pieceIndex < 0 || numBlocksReq <= 0 || pieceIndex > (that.numPieces -1) )
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
      console.log("here");
      if( (blockIndex + numBlocksReq - 1) > that.numBlocks -1 )
      return null;
      console.log("here");
      startOffset = pieceOffset + blockIndex*that.defaultBlockSize;
      endOffset = pieceOffset + (blockIndex + numBlocksReq )*that.defaultBlockSize -1;
    }
    console.log(startOffset);
    return [startOffset,endOffset];
  }

}
thorFile.prototype.onload = function(event){
  console.log("Complete",event);
}
thorFile.prototype.toString = function(){
  return this.infoHashStr;
}
module.exports = thorFile;
