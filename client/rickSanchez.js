var logger = require("../util/log.js");
var thor = require("../Torrent/thor.js");

// Our Man-of-The hour. Function to do anything and everything.
window.rickySan = function(){

  var staticFiles = {}; // infoHash dictionary
  var num_files_remaining; // num of files left to retrieve metainfo
  // TODO : remove this once done
  window.staticFiles = staticFiles

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
    staticFiles[infoHash].element.src = event.event.result;
  }
  var onComplete = function(){
    var a = new thor("ws://127.0.0.1:9090");
    window.a = a;
    for(var infoHash in staticFiles)
    {
      a.addFileToDownload(staticFiles[infoHash].metainfo);
    }
    a.onload = onDownload;
    a.start();
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
         staticFiles[x.infoHash]= { "element": imelem, "metainfo": x};
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
    }
    ajaxReq(imelem[i].data_src , imelem[i]);
  }
}