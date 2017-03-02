<script>

function findImgTags() {
  var i=0;
  var imgelements= document.getElementsByTagName('img');
  return imgelements;
}

function rickySan() {
  var staticFiles = {}; //infoHash dictionary
  imelem = findImgTags();
  l = imelem.length;
  for(i=0;i<l;i++){

    if(imelem[i].hasAttribute('data-src')){
      var x = imelem[i].getAttribute('data-src');
      imelem[i].data_src = x;
    }

  var imLink = imelem[i].data_src.split("/");
  var lastElem = (imLink.length)-1;
  var x = imLink[lastElem];
  var y = x.indexOf(".");
  var fileName = x.substr(0,y);

  var metob = ajaxReq(fileName);//TODO need to check whether return still works

  // TODO staticFiles[metob.infoHash] = imelem[i]; //creating infohash-img element dictionary

}
}
//this function takes in the file name and uses it to make
//a server request to get the respetive metafile (json file)
function ajaxReq(a) {

  var jtext = a + ".json";
  var abspath = window.location.origin;
  var req = [abspath, "/metaInfo/", jtext].join("");

  xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET",req, true);
  xmlhttp.send("");

  console.log(myval);
  xmlhttp.onreadystatechange = function() {
     if (xmlhttp.readyState==4 && xmlhttp.status==200) {
         return xmlhttp.responseText;
         //return metOb;
     }
  }
  myval = xmlhttp.onreadystatechange;


};

</script>
