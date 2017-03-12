if(typeof(window) != "undefined")
isBrowser = true
else
isBrowser = false
logger = {}
logger.INFO = function (message){
  message = message;
  printColor(arguments.callee.caller.name + "\tINFO:",message,"green");
}
logger.DEBUG = function (message){
  message = message;
  printColor(arguments.callee.caller.name + " \tDEBUG:",message,"blue");
}
logger.ERROR = function (message){
  message = message;
  printColor(arguments.callee.caller.name + " \tERROR:",message,"red");
}
logger.WARN = function (message){
  message = message;
  printColor(arguments.callee.caller.name + " \tWARN:",message,"magenta");
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
