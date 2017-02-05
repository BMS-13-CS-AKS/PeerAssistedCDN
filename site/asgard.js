(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var peerChannel = function(peerName,signal,configuration){
  this.peerName = peerName;
  this.signal = signal;
  this.configuration = configuration;
  this.dataChannel;
  // TODO : rethink about options
  this.options;
  var that = this;
  var peerConnection;

  // Creating new peer connection object
  var createNewConnection = function(){
    console.log("Creating new Peer Connection Object for " + that);
    that.peerConnection =
      new RTCPeerConnection(that.configuration,that.options);
    that.peerConnection.onicecandidate = onIceCandidate;
  }

  // onicecandidate event handler
  var onIceCandidate = function(event){
    console.log("Ice candidate event");
    if(event.candidate)
      that.signal.sendJSON({
        name:that.peerName,
        type:"candidate",
        candidate:event.candidate
      });
  }

  // Sending offer
  var sendOffer = function(){
    that.peerConnection.createOffer().then(function(offer1){
      console.log("Offer created");
      console.log(offer1);
      that.signal.sendJSON({
        type:"offer",
        name:that.peerName,
        offer:offer1
      });
      that.peerConnection.setLocalDescription(offer1).then(
                                                localSuccess,
                                                localUnsuccess );
    });
  };

  // TODO : make data channel more customizable
  // Creating data channel on offering side
  var createDataChannel = function(){
    that.dataChannel =
      that.peerConnection.createDataChannel(
      "Something", {reliable:false} );
    onDataChannelCreation();

  }
  var acceptDataChannel = function(){
    that.peerConnection.ondatachannel = function(event){
      that.dataChannel = event.channel;
      onDataChannelCreation();
    };
  }
  var sendAnswer = function(){
    that.peerConnection.createAnswer().then(function(answer1){

      that.signal.sendJSON({
        type:"answer",
        name:that.peerName,
        answer:answer1
      });
      console.log("Answer created");
      console.log(answer1);
      that.peerConnection.setLocalDescription(answer1).then(
                                                  localSuccess,
                                                  localUnsuccess);
    });
  }

  this.offerConnection = function(){
    createNewConnection();
    createDataChannel();
    sendOffer();
  };
  this.acceptAnswer = function(answer){
    setRemoteDescription(answer);
  }
  this.acceptConnection = function(offer){
    console.log("Received Offer");
    createNewConnection();
    acceptDataChannel();
    setRemoteDescription(offer);
    sendAnswer();
  };
  this.remoteIceCandidate = function(candidate)
  {
    this.peerConnection.addIceCandidate(
      new RTCIceCandidate(candidate)).then(
                                      iceAddedSuccess,
                                      iceAddedUnsuccess);
  }
  var setRemoteDescription = function(something){
    that.peerConnection.setRemoteDescription(something).then(
                                                remoteSuccess,
                                                remoteUnsuccess);
  }

  var onDataChannelCreation = function () {
    console.log("Data Channel Created");
    var par = that;
    that.dataChannel.onopen = function(event){
      par.onopen(event);
    }
    that.dataChannel.onmessage = function(event){
      par.onmessage(event);
    }

  }

  var iceAddedSuccess = function(event){
    console.log("Added Ice Successfully");
  }
  var iceAddedUnsuccess = function(event){
    console.log("Add Ice Unsuccessfull");
  }
  var localSuccess = function(event){
    console.log("Local description set successfully");
  }
  var localUnsuccess = function(event){
    console.log("Local description not set successfully");
  }
  var remoteSuccess = function(event){
    console.log("Remote description set Successfully");
  }
  var remoteUnsuccess = function(event){
    console.log("Remote description set Successfully");
  }
}
peerChannel.prototype.onopen = function(event){
  console.log("Data Channel Is Now Open");
}
peerChannel.prototype.onmessage = function(event){
  console.log("Received Message",event.data);
}

peerChannel.prototype.toString = function () {
  return this.peerName;
}
module.exports = peerChannel;

},{}],2:[function(require,module,exports){
var peerChannel = require("./peerChannel.js");
var thorFile = require("./thorFile.js")
var logger = require("../util/log.js")
// TODO : Properly hide all functions
// Thor
// parameters:
// address - address of websocket connection
var thor = function(address){

  var that = this;
  var thorFiles = {}; // dictionary of thorFiles
  var peerList = {};  // dictionary of peers

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
  // TODO: This must be put inside a function
  // NOTE: I might use ST and trackerServer terms.Both are the same
  var trackerServer = new WebSocket(this.address);

  // How to respond when we get a message from the ST server
  // TODO: only signaling done here. Must also add logic when we receive peer
  // lists etc.
  trackerServer.onmessage = function(message){

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
      case 'response':onResponse();
      break;
      default:logger.ERROR("Could not parse:" + data);
    }

  }

  // Capture a username and login
  this.start = function(){
    if(!this.name)
    {
      this.name = randomUserName();
    }
    login();
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

  // server responded after we sent login
  // TODO: In case of unsuccesfull login we might want to retry a given number of
  // times
  var onLogin  = function(success){
    if(success)
    {
      logger.INFO("Captured Username");
      startControlLoop();
    }
    else
    {
      logger.ERROR("Failed to capture username");
    }
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
    logger.WARN("Actual Trigger");
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

},{"../util/log.js":4,"./peerChannel.js":1,"./thorFile.js":3}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
if(typeof(window) != "undefined")
isBrowser = true
else
isBrowser = false
logger = {}
logger.INFO = function (message){
  printColor("INFO:",message,"green");
}
logger.DEBUG = function (message){
  printColor("DEBUG:",message,"blue");
}
logger.ERROR = function (message){
  printColor("ERROR:",message,"red");
}
logger.WARN = function (message){
  printColor("WARN:",message,"magenta");
}
function printColor(head, msg, color){
  if(!isBrowser)
  {
    colStr = ''
    switch(color)
    {
      case "red": colStr = '\x1b[31m';
                  break;
      case "blue": colStr = '\x1b[34m';
                  break;
      case "green": colStr = '\x1b[92m';
                  break;
      case "magenta": colStr = '\x1b[95m';
                  break;
      default:colStr = '\x1b[39m'
    }
    console.log(colStr+head+'\x1b[0m'+msg);
  }
  else
  {
    console.log("%c"+head+msg,"color:"+color);
  }
}
module.exports = logger

},{}]},{},[2]);
