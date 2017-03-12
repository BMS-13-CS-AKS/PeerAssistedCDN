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

    var newPiece = that.getNewPiece();
    rangedRequest(newPiece[0],newPiece[2],newPiece[3]);
    var req = XMLHttpRequest();
    requestFree = false;
    req.onreadystatechange = function(){
      if( req.readyState == 4 )
      {
        if( req.status == 200)
        {
          onResponse(req.responseText);
        }
        else
        {
          onResponse("");
        }
      }
    }
    req.open('GET',newPiece[0].url);
    req.setRequestHeader('Range','bytes='+newPiece[2]+'-'+newPiece[3]);
    req.send();

  }

  var onResponse = function(response, file, pieceIndex){

    requestFree = true;
    // Here we should add error handling
    if(!response)
    {
      logger.ERROR("Could not retrieve piece");
    }
    var result = that.onPiece(response, file, pieceIndex);
    if(result)
    {
      that.triggerThink();
    }

  }

  this.triggerThink = function(){

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
