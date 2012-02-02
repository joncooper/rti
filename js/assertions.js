(function() {
  var assertEqual;

  assertEqual = function(tested, expected, errorMessage) {
    if (tested !== expected) throw "Failed assertion: " + errorMessage;
  };

}).call(this);
