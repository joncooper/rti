(function() {
  var BinaryFile, _ref;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  BinaryFile = (function() {

    function BinaryFile(url) {
      var _this = this;
      this.url = url;
      this.onLoaded = __bind(this.onLoaded, this);
      this.xhr = new XMLHttpRequest();
      this.xhr.open('GET', this.url, true);
      this.xhr.responseType = 'arraybuffer';
      this.xhr.onload = function(e) {
        return _this.buffer = _this.xhr.response;
      };
    }

    BinaryFile.prototype.onLoaded = function() {
      this.dataStream = new DataView(this.buffer);
      console.log("Loaded file: " + this.buffer.byteLength + " bytes");
      return this.completionHandler();
    };

    BinaryFile.prototype.load = function(completionHandler) {
      this.completionHandler = completionHandler;
      this.xhr.addEventListener('load', this.onLoaded, false);
      return this.xhr.send(null);
    };

    return BinaryFile;

  })();

  if ((_ref = window.jdc) == null) window.jdc = {};

  window.jdc.BinaryFile = BinaryFile;

}).call(this);