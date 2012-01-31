
  DataView.prototype.pos = 0;

  DataView.prototype.stringFromUint8Slice = function(startOffset, endOffset) {
    var getCharStr, i;
    var _this = this;
    getCharStr = function(i) {
      return String.fromCharCode(_this.getUint8(i));
    };
    return ((function() {
      var _results;
      _results = [];
      for (i = startOffset; startOffset <= endOffset ? i < endOffset : i > endOffset; startOffset <= endOffset ? i++ : i--) {
        _results.push(getCharStr(i));
      }
      return _results;
    })()).join('');
  };

  DataView.prototype.mark = function() {
    return this.markedPos = this.pos;
  };

  DataView.prototype.reset = function() {
    return this.pos = this.markedPos;
  };

  DataView.prototype.peekLine = function() {
    var line;
    this.mark();
    line = this.readLine();
    this.reset();
    return line;
  };

  DataView.prototype.readLine = function() {
    var end, start;
    if (this.pos >= this.byteLength) return null;
    start = this.pos;
    end = -1;
    while ((this.pos < this.byteLength) && (end < start)) {
      if (this.getUint8(this.pos) === 0x0a) {
        if ((this.pos > 0) && (this.getUint8(this.pos - 1) === 0x0d)) {
          end = this.pos - 1;
        } else {
          end = this.pos;
        }
        this.pos = this.pos + 1;
        return this.stringFromUint8Slice(start, end);
      } else {
        this.pos = this.pos + 1;
      }
    }
    return null;
  };

  DataView.prototype.readFloat = function() {
    var ret;
    ret = this.getFloat32(this.pos, true);
    this.pos = this.pos + 4;
    return ret;
  };

  DataView.prototype.readUint8 = function() {
    var ret;
    ret = this.getUint8(this.pos);
    this.pos = this.pos + 1;
    return ret;
  };
