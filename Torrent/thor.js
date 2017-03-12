var peerChannel = require("./peerChannel.js");
var thorFile = require("./thorFile.js")
var superPeer = require("./superPeer.js")
var logger = require("../util/log.js")
// TODO : Properly hide all functions
// Thor
// parameters:
// address - address of websocket connection
var thor = function(address){

  var that = this;

  var thorFiles = {}; // dictionary of thorFiles
  var peerList = {};  // dictionary of peers
  var mode = 0;  // 0 for pagewise , 1 for itemwise
  var pageInfoHash = null; // page id
  var pageComplete = 0; // whether page is completed or not
  // Timer ids for central loops
  var lastStatusLoop = null;
  var lastControlLoop = null;
  var statusInterval = 60;
  var controlInterval = 30;
  // Should be removed ,added for debugging
  // exposes the peerlist and thorFiles dictionary
  this.pubpeers = peerList;
  this.pubfiles = thorFiles;

  // default configuration for webRTC connections
  // TODO: might want to make this a public function
  // so that users can configure themselves
  var configuration = {
    "iceServers": [{ "url": "stun:stun.1.google.com:19302" }]
  };

  this.name; // Our name
  this.address = address; // address of the WebSocket

  // extending the websocket object
  WebSocket.prototype.sendJSON = function(message){
    this.send(JSON.stringify(message));
  }

  // creating a new websocket connection to the ST server
  // NOTE: I might use ST and trackerServer terms.Both are the same
  var trackerServer;

  // How to respond when we get a message from the ST server
  // TODO: only signaling done here. Must also add logic when we receive peer
  // lists etc.
  var onmessage = function(message){

    //Parse the message to get the JS object
    data = JSON.parse(message.data);
    switch(data.type)
    {
      case 'login':onLogin(data.success);
      break;
      case 'offer':onOffer(data.offer,data.name);
      break;
      case 'answer':onAnswer(data.answer,data.name);
      break;
      case 'candidate':onReceiveCandidate(data.candidate,data.name);
      break;
      case 'response':onResponse(data.answer);
      break;
      default:logger.ERROR("Could not parse:" + data);
    }

  }

  // Start thor
  // This will:
  // start the tracker server
  // on connection will login
  this.start = function(){

    trackerServer = new WebSocket(this.address);
    trackerServer.onmessage = onmessage;
    trackerServer.onopen = function(){
      if(!that.name)
      {
        that.name = randomUserName();
      }
      login();
    }

  }

  // Connect to a particular peer
  // TODO: make sure we are connected to the websocket server first before
  // attempting connection
  this.connect = function(name){
    logger.INFO("Offering connection to "+ name);
    peerList[name] = new peerChannel(
                                name,
                                trackerServer,
                                configuration);
    peerList[name].offerConnection();
  }

  // generate a random username
  var randomUserName = function(){
    var chars = "abcdefghijklmnopqrstuvwxyz0123456789"
    var res = "";
    for(i=0;i<20;i++){
      res += chars[Math.floor(Math.random()*36)];
    }
    return res;
  }

  // send a login message to the server
  var login = function(){
    logger.INFO(
      "Attempting to capture username "+ that.name );
    trackerServer.sendJSON({
      type:"login",
      name:that.name
    });
  }

  // Used to set pagewise mode
  this.setPageWise = function(infoHash){
    pageInfoHash = infoHash;
    mode = 1;
  }

  // server responded after we sent login
  // TODO: In case of unsuccesfull login we might want to retry a given number of
  // times
  var onLogin  = function(success){
    if(success)
    {
      logger.INFO("Captured Username");
      triggerStatusLoop(1);
      triggerControlLoop(1);
    }
    else
    {
      logger.ERROR("Failed to capture username");
    }
  }
  // For every file in file dictionary send a seed/request dict to the
  // server.If pagewise send pagewise data also
  var statusLoop = function(){
    logger.DEBUG("Running status loop");
    var req = { type:"status", infoHashes:[] ,mode: mode};
    if (mode)
    {
      req.infoHashes.push([pageInfoHash, pageComplete]);
    }
    for (var file in thorFiles)
    {
      req.infoHashes.push([file, thorFiles[file].remainingpieces == 0]);
    }
    trackerServer.sendJSON(req);
    triggerStatusLoop();
  }
  var controlLoop = function(){
    logger.DEBUG("Running control loop");
    triggerControlLoop();
  }
  var triggerStatusLoop = function(now = 0){
    if(lastStatusLoop != null)
      clearInterval(lastStatusLoop);
    if ( !now )
      lastStatusLoop = setTimeout(statusLoop, statusInterval*1000);
    else
      lastStatusLoop = setTimeout(statusLoop, 0);
  }
  var triggerControlLoop = function(now = 0){
    if(lastControlLoop != null)
      clearInterval(lastControlLoop);
    if( !now )
      lastControlLoop = setTimeout(controlLoop, controlInterval*1000);
    else
      lastControlLoop = setTimeout(controlLoop, 0);
  }
  // How to react when we receive an offer from another client
  var onOffer = function(offer,name){
    if(!peerList[name])
    {
      logger.INFO("Accepting connection from "+ name);
      peerList[name] = new peerChannel(
                                  name,
                                  trackerServer,
                                  configuration);
      peerList[name].acceptConnection(offer);
    }
    else logger.WARN(
          "Peer Connection Exists:"+
          "Rejecting connection from "
          + name)
  }

  // When we receive answer from another client
  var onAnswer = function(answer,name){
    if(peerList[name])
    {
      peerList[name].acceptAnswer(answer);
    }
  }

  // When we receive a candidate from another client
  var onReceiveCandidate = function(candidate,name){
    logger.INFO("candidate received");
    if(peerList[name]){
      peerList[name].remoteIceCandidate(candidate);
    }
  }
  // When we receive a response from the server after we send a request for
  // the peer list
  var onResponse = function(answer){
    console.log(answer);
  }
  /***************************************************************************/
  // Extending the superPeer
  var startSuper = function(){

  }
  superPeer.prototype.onPiece = function(pieceString,file,pieceIndex){

  }
  superPeer.prototype.getNewPiece = function(){
    var min = 255;
    var minRes = null;
    var fileRes = null;
    for(var infoHash in thorFiles)
    {
      var res = thorFiles[file].chooseRarestPiece();
      if( res == null )
        continue;
      if(res[2] < min)
      {
        min = res[2];
        minRes = res;
        fileRes = thorFiles[file];
      }
    }
    if( min == 255)
    {
      return null;
    }
    return [thorFiles[infoHash], res[0], res[1]];
  }

  /***************************************************************************/
  /***************************************************************************/
  // Extending the thorFile prototype

  // onload - function is called when file has finsihed loading
  // this function will in turn trigger the thor objects onload function
  thorFile.prototype.onload = function(event){
    var extEvent = { infoHash:this.infoHashStr ,event: event };
    that.onload(extEvent);
  }
  thorFile.prototype.onHave = function(pieceIndex){

  }
  /***************************************************************************/
  // Extending the peerChannel prototype

  // Four state parameters
  peerChannel.prototype.meChoked;
  peerChannel.prototype.choked;
  peerChannel.prototype.meInterested;
  peerChannel.prototype.interested;

  // Set of files that we have in common with the peer
  peerChannel.prototype.theirFiles;

  // Have we introduces ourselves yet
  peerChannel.prototype.introduced;
  peerChannel.prototype.requestList;

  peerChannel.prototype.onopen = function(event){

    this.introduced = 0;
    this.meChoked = true;
    this.choked = true;
    this.meInterested = false;
    this.interested = false;
    this.theirFiles = { };
    this.requestList = {
      file : null,
      pieceIndex : -1,
      blockList :[],
      requested :[]
    }

    this.sendHandShake();
  }

  peerChannel.prototype.onmessage = function(event){

    var message = event.data;
    if(this.introduced == 0)
    {
      logger.INFO("Received Handshake");
      this.onHandshake(message);
    }
    else
    if(this.introduced == 1)
    {
      logger.INFO("Received bitfield");
      this.onBitfield(message);
    }
    else
    if(message.byteLength == 24)
    {
      logger.INFO("Received request");
      this.onRequest(message);
    }
    else
    {
      logger.INFO("Received response")
      this.onResponse(message);
    }
  }

  // Send bitfield for all files that both peers have in common
  peerChannel.prototype.sendBitfield = function () {
    var length = 0;
    for(var key in this.theirFiles)
    {
      var some = 20 + Math.ceil((thorFiles[key].numPieces)/8);
      if(some%2 == 1)
      some++;
      length +=some;
    }
    var message = new ArrayBuffer(length);
    var offset = 0;
    for(var key in this.theirFiles)
    {
      var infoHash16 = new Uint16Array(message,offset,10);
      var bitfield = new Uint8Array(message,offset+20,thorFiles[key].haveArray.byteLength);
      infoHash16.set(thorFiles[key].infoHash);
      logger.INFO("setting bitfield"+thorFiles[key].haveArrayInt8);
      bitfield.set(thorFiles[key].haveArrayInt8);
      var some = (20 + thorFiles[key].haveArray.byteLength);
      if(some%2 == 1)
      some++;
      offset += some;
    }
    logger.INFO("sending bitfield");
    this.dataChannel.send(message);
  };

  // Received bitfield
  // On receiving the bitfield array we must:
  // - verify bitfields
  // - decide if we are interested in the peer
  // TODO : validate the bitfield ,break conn if invalid
  //      : test if working with multiple files
  //      : add error handling
  peerChannel.prototype.onBitfield = function ( message ) {
    var offset=0;
    while( offset < message.byteLength )
    {
      var infoHash16 = new Uint16Array(message,offset,10);
      var infoHash = "";
      for( var i=0 ;i<10;i++)
      {
        infoHash += String.fromCharCode(infoHash16[i]);
      }
      if(!( thorFiles[infoHash] && this.theirFiles[infoHash] ) )
      {
        logger.WARN("Received invalid infohash",infoHash);
        break;
      }
      var bitfield = new Uint8Array(message,offset+20,thorFiles[infoHash].haveArray.byteLength);
      thorFiles[infoHash].updateAvailability(bitfield);
      for(var i = 0;i<bitfield.length;i++)
      {
          bitfield[i] = bitfield[i] & ~(thorFiles[infoHash].haveArrayInt8[i]);
          if(bitfield[i] > 0)
          this.meInterested = true;
      }
      this.theirFiles[infoHash].set(bitfield);
      var some = 20 + bitfield.length;
      if(some%2 == 1)
      some++;
      offset += some;
    }
    this.introduced = 2;
    this.triggerThink();
  };

  // Invokes the think function if not already invoked
  peerChannel.prototype.triggerThink = function () {
    if(!this.triggerThink.triggered)
    {
      this.triggerThink.triggered = true;
      setTimeout(this.think());
    }
  };
  peerChannel.prototype.triggerThink.triggered = false;

  // Decision making function
  // Logic for sending requests here
  // the think function should only be triggered via the triggerThink function
  //
  peerChannel.prototype.think = function () {
    this.triggerThink.triggered = false;

    // If we are not interested in this peer theres no point making a new
    // request
    if(!this.meInterested)
    return;

    // Check if current piece in requestList is empty
    if(!this.requestList.blockList.length && !this.requestList.requested.length)
    {

      // Check if the previous piece was downloaded correctly
      // -1 indicates that there was no previous piece
      if(this.requestList.pieceIndex != -1)
      {
        this.requestList.file.checkPieceIntegrity(this.requestList.pieceIndex);
      }

      // Choose a new piece
      var newPiece = this.choosePiece();
      if(newPiece == null)
      {
        this.meInterested = false;
        return;
      }
      this.requestList.file = newPiece.file;
      logger.DEBUG("peer "+this.peerName+" is downloading "+
                  newPiece.pieceIndex+newPiece.file);
      this.requestList.pieceIndex = newPiece.pieceIndex;
      this.requestList.blockList = [];
      this.requestList.requested = [];
      var l;
      if(this.requestList.file.numPieces - 1 == this.requestList.pieceIndex)
      {
        l = this.requestList.file.lastBlockIndex+1;
      }
      else
      {
        l = this.requestList.file.numBlocks;
      }
      for(var i=0;i<l;i++)
      {
        this.requestList.blockList[i] = i;
      }
    }

    // At this point there would be a piece we have to download
    // we check the number of blocks currently requested for
    // if this is less than four we request for new blocks if there are any
    if(this.requestList.requested.length < 4 && this.requestList.blockList.length)
    {
      var num = Math.min(4 - this.requestList.requested.length,this.requestList.blockList.length);
      while(num--)
      {
        var block = this.requestList.blockList.shift();
        this.sendRequest(this.requestList.file,this.requestList.pieceIndex,block,1);
        this.requestList.requested.push(block);
      }
    }
  };

  // choosePiece - chooses a piece that we dont have and is not in the
  // requestList queue
  // TODO : Here I have implemented a linear search
  // we should make it such that the piece is chosen at random
  // If we cant find a piece then :
  // - try checking the download queue
  // - if nothing again,then return null indicating no interest
  peerChannel.prototype.choosePiece = function(){
    for(var key in this.theirFiles)
    {
      for(var i=0;i<thorFiles[key].haveArrayInt8.length;i++)
      {
        var t = (~thorFiles[key].requestArrayInt8[i]) & (~thorFiles[key].haveArrayInt8[i]) & (this.theirFiles[key][i])
        if(t)
        {
          var piece = Math.log2(t & ~(t-1)) + i*8;
          thorFiles[key].setRequestPiece(piece);
          return {pieceIndex:piece,file:thorFiles[key]};
        }
      }
    }
    return null;
  }

  // sendHandShake - send a handshake to the peer
  // Let the handshake include the following:
  // For each file that is in our thorFiles dictionary send a:
  // - 20 byte infohash
  peerChannel.prototype.sendHandShake = function () {

    var length = 20*(Object.keys(thorFiles).length);
    var message = new ArrayBuffer(length);
    var infoHash16 = new Uint16Array(message);
    var i=0;
    for(var file in thorFiles)
    {
      infoHash16.set(thorFiles[file].infoHash,i);
      i+=10;
    }
    this.dataChannel.send(message);
  };

  // onHandshake - called when we receive a handshake
  // TODO:make sure it is a valid handshake
  // Filter out all files that we have in common
  peerChannel.prototype.onHandshake = function ( message ) {

    // TODO: Wtf does this do??
    if(!this.count)
    this.count=0;
    this.count++;
    var infoHash16 = new Uint16Array(message);
    var i=0;
    while( i < infoHash16.length )
    {
      var infoHash = "";
      for(var i1 = 0;i1<10;i1++)
      infoHash += String.fromCharCode(infoHash16[i+i1]);
      if(thorFiles[infoHash])
      {
        this.theirFiles[infoHash] = new Uint8Array(Math.ceil(thorFiles[infoHash].numPieces/8));
      }

      i+=10;
    }
    this.introduced = true;
    this.sendBitfield();
  };

  // Sending the have message
  // Parameters
  // file - A thor file object
  // pieceIndex - index of the piece you have
  // TODO
  peerChannel.prototype.sendHave = function ( file , pieceIndex ) {

  };

  // Sending a request
  // Parameters
  // file - A thor file object
  // pieceIndex - index of the piece
  // blockIndex - index of the block
  // numBlocks - number of blocks
  peerChannel.prototype.sendRequest = function(
                                      file,
                                      pieceIndex,
                                      blockIndex,
                                      numBlocks ){

    this.dataChannel.send(constructRequest(file,pieceIndex,blockIndex,numBlocks));
  };

  // Sending a block
  // Parameters
  // file - A thor file object
  // pieceIndex - index of the piece
  // blockIndex - index of the block
  // numBlocks - number of blocks
  peerChannel.prototype.sendBlock  = function(
                                      file1,
                                      pieceIndex,
                                      blockIndex,
                                      numBlocks){

    var resBlocks = file1.getBlocks(pieceIndex,blockIndex,numBlocks);
    if(resBlocks)
    {
      this.dataChannel.send(constructResponse(file1,pieceIndex,blockIndex,numBlocks,resBlocks));
      return ;
    }
    else
    {
      return null;
    }

  };

  peerChannel.prototype.onRequest = function(message){

    var infoHashArr = new Uint16Array(message,0,10);
    var pieceIndex1 = new Uint16Array(message,20,1);
    var restArr = new Uint8Array(message,22);

    var infoHash = "";
    var file;
    var pieceIndex;
    var blockIndex;
    var numBlocks;
    for(var i=0;i<10;i++)
    infoHash += String.fromCharCode(infoHashArr[i]);

    pieceIndex = pieceIndex1[0];
    blockIndex = restArr[0];
    numBlocks  = restArr[1];

    logger.INFO("Received request for "+infoHash+pieceIndex+blockIndex+numBlocks);

    if(thorFiles[infoHash])
    {
      this.sendBlock(thorFiles[infoHash] ,pieceIndex ,blockIndex ,numBlocks);
    }

  }

  peerChannel.prototype.onResponse = function(message){

    var infoHash16 = new Uint16Array(message,0,10);
    var pieceIndex1 = new Uint16Array(message,20,1);
    var rest = new Uint8Array(message,22);

    var infoHash = "";
    for(var i=0;i<10;i++)
    {
      infoHash += String.fromCharCode(infoHash16[i]);
    }
    var pieceIndex = pieceIndex1[0];
    var blockIndex = rest[0];
    var numBlocks  = rest[1];
    var blocks = rest.subarray(2);
    if(thorFiles[infoHash])
    {
      logger.INFO("received"+pieceIndex+blockIndex);
      var val = (this.requestList.pieceIndex == pieceIndex);
      var ind = this.requestList.requested.indexOf(blockIndex);
      if((ind != -1) && val)
      {
        this.requestList.requested.splice(ind,1);
        window.blocks = blocks;
        if(this.requestList.file.setBlocks(pieceIndex, blockIndex, numBlocks, blocks))
          logger.INFO("set"+pieceIndex+blockIndex);
        else
          logger.WARN("Could not set");
        this.triggerThink();
      }
    }
  }
  var constructRequest = function(file, pieceIndex, blockIndex, numBlocks ){
    var length = 24;
    var message = new ArrayBuffer(length);
    var infoHash = new Uint16Array(message,0,10);
    var pieceIndex1 = new Uint16Array(message,20,1);
    var rest = new Uint8Array(message,22);

    infoHash.set(file.infoHash);
    pieceIndex1[0] = pieceIndex;
    rest[0] = blockIndex;
    rest[1] = numBlocks;

    return message;
  }

  var constructResponse =function(
                              file, pieceIndex, blockIndex, numBlocks, blocks){
    var length = 24 + blocks.length;
    var message = new ArrayBuffer(length);
    var infoHash = new Uint16Array(message,0,10);
    var pieceIndex1 = new Uint16Array(message,20,1);
    var rest = new Uint8Array(message,22);

    infoHash.set(file.infoHash);
    pieceIndex1[0] = pieceIndex;
    rest[0] = blockIndex;
    rest[1] = numBlocks;
    rest.set(blocks,2);

    return message;
  }

  /****************************************************************************/
  // To seed an already existing file
  // Parameters
  // infoHash - infohash of the file
  // blob - the file or blob object
  this.seedFile = function(blob ,infoHash ){
    thorFiles[infoHash] = new thorFile();
    thorFiles[infoHash].getFromBlob(blob,infoHash);
    logger.INFO("Seeded thor file");
  }

  // To add file to download list
  // TODO:Right now this function must be called before connecting to peers
  // We should write it so that we can add files even after we are already
  // connected to peers
  // metaInfo - dictionary of the form {
  //                                    infoHash : "10CHARHASH",
  //                                    size : 120000 // size in bytes
  //                                   }
  this.addFileToDownload = function(metaInfo ){
    thorFiles[metaInfo.infoHash] = new thorFile();
    thorFiles[metaInfo.infoHash].getFromInfo(metaInfo);
  }
}

// Function should be overloaded
// This function is called when we have successfully loaded a file
thor.prototype.onload = function(event)
{
  logger.INFO(event);
}

window.thor = thor;
