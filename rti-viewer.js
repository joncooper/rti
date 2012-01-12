// See http://www.html5rocks.com/en/tutorials/file/xhr2/

var uInt8Array;
var hshPixels;

function getBinaryFile(path) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', path, true);
  xhr.responseType = 'arraybuffer';
  xhr.onload = function(e) {
    console.log('making array from response');
    uInt8Array = new Uint8Array(xhr.response);
    console.log(xhr);
  }
  xhr.onreadystatechange = function(aEvt) {
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        console.log(xhr.response);
      } else {
        console.log("Error", request.statusText);
      }
    }
  };
  xhr.addEventListener("progress", function(evt) {
    if (evt.lengthComputable) {
      var percentageComplete = evt.loaded / evt.total;
      console.log("%% complete: ", percentageComplete);
    }
  }, false);
  xhr.addEventListener("load", function() {
    console.log("The transfer is complete.");
    console.log(uInt8Array.length);
    // var hshPixels = loadHSH(uInt8Array);
  }, false);
  xhr.addEventListener("error", function() {
    console.log("The transfer failed.");
  }, false);
  xhr.addEventListener("abort", function() {
    console.log("The transfer has been cancelled.");
  }, false);
  console.log('firing request.');
  xhr.send(null);
}
