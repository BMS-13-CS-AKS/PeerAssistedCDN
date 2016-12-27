var thorFile = function(){
  var that = this;
  this.url;

  // ArrayBuffer and corresponding typed arrays
  this.file;
  this.views = {};

  // Information about the file
  this.infoHash = "";
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
  // haveArray - ArrayBuffer of bytes, each indicating whether we have the piece at
  // that index
  // haveArrayInt8 - typed array used to manipulate the haveArray
  this.haveArray;
  this.haveArrayInt8;


  // In case we already have the file as a file or blob object and would like to seed it
  // Parameters: file - file or blob object
  this.getFromBlob = function(file){
    var fileReader = new FileReader();
    var par = this;
    fileReader.onload = function(event){
      par.file = this.result;
      par.file.complete = true;
      par.views.arr8 = new Int8Array(par.file);
      console.log("File retreived from blob and views set");
      deriveInfo();
    }
    fileReader.readAsArrayBuffer(file);
  }

  // Rederives file info assuming file is complete
  // Needs to be called when creating from blob
  // Parameters: None
  var deriveInfo = function(){
    if(that.file.complete)
    {
      that.size = that.file.byteLength;
      that.calculateDetails();
      that.createPiecesArray(1);
    }
  }

  this.createPiecesArray = function(value){

    this.haveArray = new ArrayBuffer(this.numPieces);
    this.haveArrayInt8 = new Int8Array(this.haveArray);
    if(value){
      for(var i=0;i<this.numPieces;i++)
      this.haveArrayInt8[i] = 1;
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
    if( !this.haveArrayInt8[pieceIndex] )
    {
      console.log("Do not have");
      return null;
    }

    var range = getArrayOffsets( pieceIndex , blockIndex , numBlocksReq );
    if(range == null)
    return null;
    console.log(range[0],range[1]);
    return this.views.arr8.slice(range[0],range[1]+1);

  }

  // Setting specific block range in a piece
  // Parameters :
  // pieceIndex - index of piece
  // blockIndex - index of block inside the piece
  // numBlocksReq - number of blocks
  this.setBlocks = function( pieceIndex , blockIndex , numBlocksSet , Blocks ){
    if( this.haveArrayInt8[pieceIndex] )
    {
      //return null;
    }
    var range = getArrayOffsets( pieceIndex , blockIndex , numBlocksSet );
    if(range == null || ( Blocks.byteLength != range[1] - range[0] + 1 ) )
    return null;

    this.views.arr8.set( Blocks , range[0] );
    return true;
  }
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

function handleFileSelect(event){
  console.log(event.target.files);
  q = new thorFile();
  q.getFromBlob(event.target.files[0]);
}
document.getElementById('myfile').addEventListener('change', handleFileSelect, false);
