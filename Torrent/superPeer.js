var logger = require("../util/log.js");
// superPeer is the entity responsible for downloading pieces from the server
var superPeer = function(){
  var thinkTriggered = false;
  var that = this;
  var requestFree = true;
  // This function creates a new request
  // Performs the following steps:
  // gets a new piece
  // adds it to requestList
  // sends the ranged request for the piece
  var request = function(){
    logger.INFO("Creating new super peer request")
    var newPiece = that.getNewPiece();
    if (!newPiece)
      return;
    var req = new XMLHttpRequest();
    requestFree = false;
    req.onreadystatechange = function(){
      if( req.readyState == 4 )
      {
        logger.DEBUG("State is 4");
        if( req.status == 206)
        {
          onResponse(req.response, newPiece[0],newPiece[1]);
        }
      }
    }
    req.open('GET',newPiece[0].url);
    req.responseType = "arraybuffer";
    var rangeVal = 'bytes='+newPiece[2][0]+'-'+newPiece[2][1];
    logger.DEBUG("requested for range "+rangeVal);
    req.setRequestHeader('Range',rangeVal);
    req.send();

  }

  var onResponse = function(response, file, pieceIndex){
    logger.INFO("Received response")
    requestFree = true;
    // Here we should add error handling
    if(response.byteLength == 0)
    {
      logger.ERROR("Could not retrieve piece");
    }
    var responseUint8 = new Uint8Array(response);
    logger.DEBUG(responseUint8.byteLength);
    var result = that.onPiece(responseUint8, file, pieceIndex);
    logger.DEBUG("result of setting piece is "+result)
    if(result)
    {
      that.triggerThink();
    }

  }

  this.triggerThink = function(){
    logger.DEBUG("Super peer in thought")
    if(thinkTriggered)
    return;
    thinkTriggered = true;
    setTimeout(think,0);
  }

  var think = function(){

    thinkTriggered = false;
    if(requestFree)
      request();
  }
}
superPeer.prototype.getNewPiece = function(){
  logger.ERROR("Super Peer not implemented");
}
superPeer.prototype.onPiece = function(response, file, pieceIndex){
  logger.ERROR("Received piece but for no reason");
}
module.exports = superPeer;
