module.exports = function (n) {
  var i
  numbers = []

  //initializes list
  for (i = 0; i < n; i++) numbers[i] = i
  
  //random shuffle logic
  for (i = 0; i < n; i++) {
    var pos = n - i - 1;
    var spos = parseInt(Math.random() * (pos + 1))
    var tmp = numbers[spos]
    numbers[spos] = numbers[pos]
    numbers[pos] = tmp
  } 
  return numbers
}

