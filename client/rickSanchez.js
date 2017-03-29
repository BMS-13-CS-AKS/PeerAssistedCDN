var logger = require("../util/log.js");
var thor = require("../Torrent/thor.js");

// Our Man-of-The hour. Function to do anything and everything.
window.rickySan = function(enable_server= true,progress = true){

  var body = document.getElementsByTagName("body")[0]
  var page_hash = null;
  if(body.hasAttribute("page-hash"))
  {
    page_hash = body.getAttribute("page-hash");
  }
  var staticFiles = {}; // infoHash dictionary
  var num_files_remaining; // num of files left to retrieve metainfo
  var progressDicts = {};
  // TODO : remove this once done
  window.staticFiles = staticFiles

  function updateProgress(){
    for(var infoHash in progressDicts)
    {
      var total = progressDicts[infoHash].total;
      var server = progressDicts[infoHash].serverCount;
      var peer = progressDicts[infoHash].peerCount;

      var pProg = total!=-1?(peer/total):0;
      var sProg = total!=-1?(server/total):0;
      logger.INFO(server/total)
      logger.INFO(peer/total)
      logger.INFO("Running progress "+infoHash+""+sProg+""+pProg);
      for(var e in staticFiles[infoHash].element)
      {
        staticFiles[infoHash].element[e].progress.value = pProg;
        staticFiles[infoHash].element[e].progress2.value = sProg;
      }
    }
  }
  // Function to fetch static image elements from webpage
  function findImgTags() {
    var i=0;
    var imgelements= document.getElementsByTagName('img');
    return imgelements;
  }
  var onDownload = function(event){
    var infoHash = event.infoHash;
    if(!staticFiles[infoHash])
    {
      log.ERROR("Invalid File");
    }
    for(var e in staticFiles[infoHash].element)
    {
      staticFiles[infoHash].element[e].src = event.event.result;
    }
  }
  var onComplete = function(){
    var a = new thor("ws://127.0.0.1:9090",enable_server);
    if(page_hash)
      a.setPageWise(page_hash)
    window.a = a;
    for(var infoHash in staticFiles)
    {
      var progressDict = a.addFileToDownload(staticFiles[infoHash].metainfo);
      progressDicts[infoHash] = progressDict;
    }
    a.onload = onDownload;
    a.start();
    setInterval(updateProgress,500);
  }
  // this function takes in the file name and uses it to make
  // a server request to get the respetive metafile (json file)
  function ajaxReq(fileName1, imelem) {

    var linkArr = fileName1.split("/");
    var lastElem = (linkArr.length)-1;
    var x = linkArr[lastElem];// 'x' holds file name with extenion
    var y = x.lastIndexOf(".");
    var fileName = x.substr(0,y);
    var jtext = fileName + ".json";
    var abspath = window.location.origin;// Fetching absolute path
    var req = [abspath, "/metaInfo/", jtext].join("");

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET",req, true);
    xmlhttp.send("");
    xmlhttp.onreadystatechange = function(){
     if(xmlhttp.readyState==4 && xmlhttp.status==200){
       {
         var x = JSON.parse(xmlhttp.responseText);
         // Add other attributes to metaInfo
         if(imelem.tagName == 'IMG')
         {
          x.type = "blob";
         }
         else
         {
          x.type = "stream";
         }
         x.url = imelem.data_src;
         if(!staticFiles[x.infoHash])
           staticFiles[x.infoHash]= { "element": [imelem], "metainfo": x};
         else
           staticFiles[x.infoHash].element.push(imelem);
         // TODO : add error handling if we don't receive valid metainfo
         logger.DEBUG(xmlhttp.responseText)
         num_files_remaining--;
         if(num_files_remaining == 0)
          onComplete();
       }
       //return metOb;
     }
    }
    logger.DEBUG("Sending "+req);
    myval = xmlhttp.onreadystatechange;
  }

  imelem = findImgTags();
  l = imelem.length;
  num_files_remaining = imelem.length;
  for(i=0;i<l;i++)
  {
    if(imelem[i].hasAttribute('data-src'))
    {
      var x = imelem[i].getAttribute('data-src');// Fetching img url
      imelem[i].data_src = x;// Setting url value for new attribute 'data-src'
      if(progress)
      {
        var pb = document.createElement("progress");
        var pb2 = document.createElement("progress");
        imelem[i].progress = pb;
        imelem[i].progress2= pb2;
        imelem[i].parentElement.appendChild(pb);
        imelem[i].parentElement.appendChild(pb2);
      }
    }
    ajaxReq(imelem[i].data_src , imelem[i]);
  }
}
