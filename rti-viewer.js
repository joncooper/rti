// See http://www.html5rocks.com/en/tutorials/file/xhr2/

var binaryFileBuffer;

function getBinaryFile(path) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', path, true);
  xhr.responseType = 'arraybuffer';
  xhr.onload = function(e) {
    binaryFileBuffer = xhr.response;
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
    console.log(binaryFileBuffer.length);
    return binaryFileBuffer;
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
