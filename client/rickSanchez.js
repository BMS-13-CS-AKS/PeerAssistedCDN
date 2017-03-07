var logger = require("../util/log.js");
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

  var onComplete = function(){
    for(var infoHash in staticFiles)
    {
      console.log(staticFiles[infoHash]);
    }
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