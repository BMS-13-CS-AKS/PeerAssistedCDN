var fileUtils = {};
fileUtils.getDetailsFromSize = function( fileObj ){
  if ( !fileObj.size )
  {
    if( !fileObj.byteLength )
      return null;
    else
      fileObj.size = fileObj.byteLength;
  }
  if(fileObj.size < 268435456)
  {
    fileObj.pieceLength = 262144;
  }
  else if(fileObj.size < 1073741824)
  {
    fileObj.pieceLength = 524288;
  }
  else
  {
    fileObj.pieceLength = 1048576;
  }
  fileObj.numPieces = Math.ceil(fileObj.size / fileObj.pieceLength);
  fileObj.remainingPieces = fileObj.numPieces;
  fileObj.defaultBlockSize = 16*1024;
  fileObj.numBlocks = fileObj.pieceLength / fileObj.defaultBlockSize;
  fileObj.lastPieceLength = fileObj.size % fileObj.pieceLength;
  if(fileObj.lastPieceLength == 0)
  {
    fileObj.lastPieceLength = fileObj.pieceLength;
  }
  fileObj.lastBlockIndex =
  Math.ceil(fileObj.lastPieceLength/fileObj.defaultBlockSize) - 1;
  fileObj.lastBlockSize = fileObj.lastPieceLength%fileObj.defaultBlockSize;
  if(fileObj.lastBlockSize == 0)
  {
    fileObj.lastBlockSize = fileObj.defaultBlockSize
  }
}
module.exports = fileUtils
