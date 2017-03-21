var info = document.getElementById("infoHash");
var metainfo = document.getElementById("metainfo");
var add = document.getElementById("download");
var seed = document.getElementById("seed");
add.addEventListener("click",onadd);
seed.addEventListener("click",onseed);
document.getElementById('myfile').addEventListener('change', handleFileSelect, false);
var currFile = null;
var images ={ };
thor.prototype.onload = function (event) {
  images[event.infoHash].src = event.event.result;
};
a = new thor("ws://127.0.0.1:9090");

function handleFileSelect(event)
{
  console.log(event.target.files);
  var q = event.target.files[0];
  if(q)
  {
    currFile = q;
  }
  var infoHash = info.value;

  if(q && infoHash!="")
  {
    if(!images[infoHash])
    {
      console.log("seeding file");
      images[infoHash] = addNewImage(q.size,infoHash);
      a.seedFile(q,infoHash);
      console.log();
    }
  }
}
function onseed(event)
{
  var infoHash = info.value;
  if(currFile && infoHash!="")
  {
    if(!images[infoHash])
    {
      console.log("Seeding",infoHash);
      images[infoHash] = addNewImage(currFile.size,infoHash);
      a.seedFile(currFile,infoHash);
      console.log();
    }
  }
}
function onadd(event)
{
  var obj = metainfo.value;
  var meta;
  try
  {
    meta = JSON.parse(obj);
    if(!meta.infoHash || !meta.size)
    {
      throw 'Invalid MetaInfo.follow format- { "infoHash":"[infoHash]" , "size":[size] }'
    }
    if(images[meta.infoHash])
    {
      throw 'Redundant infoHash';
    }
    images[meta.infoHash] = addNewImage(meta.size,meta.infoHash);
    meta["type"] = "blob";
    meta["url"] = ""
    a.addFileToDownload(meta);
  }
  catch(err)
  {
    console.log("Error",err);
  }

}
function addNewImage( size ,infoHash ){
var tempImg = document.createElement("IMG");
var div1 = document.createElement("div");
var p1 = document.createElement("p");
div1.setAttribute("class","outerdiv");
p1.textContent = '{"size": '+size+',"infoHash":"'+infoHash + '"}';
div1.appendChild(tempImg);
div1.appendChild(p1);
document.body.appendChild(div1);
return tempImg;
}
