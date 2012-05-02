<!doctype html>
<html>
  <head>
    <title>GLSL RTI Viewer</title>
    <link href="assets/bootstrap/css/bootstrap.css" rel="stylesheet">
    <style>
      body {
        background: url(assets/little_pluses.png)
      }
      .navbar
      .navbar-fixed-bottom {
        position: fixed;
        bottom: 0px;
        left: -10px;
        right: -10px;
        margin-top: 18px;
        margin-bottom: 0px;
      }
      .navbar-fixed-bottom .navbar-inner .container a {
        float: none;
        text-align: center;
      }
      #three {
        min-height: 400px;
        margin-top: 84px;
      }
      #three.loading {
        background: url(assets/loading.gif) center center no-repeat;
      }
      #three > canvas {
        margin-left: auto;
        margin-right: auto;
        position: relative;
        display: block;
      }
    </style>
    <script src="js/extern/jquery.min.js"></script>
    <script src="assets/bootstrap/js/bootstrap.min.js"></script>
    <script src="js/extern/rAF.js"></script>
    <script src="js/rtiviewer.js"></script>
    --GA--

  <body>
    <div class="navbar navbar-fixed-top">
      <div class="navbar-inner">
        <div class="container">
          <a class="brand" href="#">GLSL RTI Viewer</a>
        --FILES--
          <ul class="nav">
            <li>
              <a href="">Loading: <progress></progress></a>
            </li>
          </ul>
          <ul class="nav pull-right">
            <li>
              <a href="http://www.hpl.hp.com/research/ptm/papers/ptm.pdf">The Paper</a>
            </li>
            <li>
              <a href="docs/rtiviewer.html">Source</a>
            </li>
          </ul>
        </div><!-- .container -->
      </div>
    </div>
    <div class="container">
      <div id="three" class="loading">
      </div>
    </div>
    <div class="navbar navbar-fixed-bottom">
      <div class="navbar-inner">
        <div class="container">
          <a class="brand" href="#">Move mouse to relight - Wheel to zoom - Drag to pan</a>
        </div>
      </div>
    </div>
    <!-- <script>document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1"></' + 'script>')</script> -->
  </body>
</html>
