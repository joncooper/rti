<!doctype html>
<html>
  <head>
    <title>GLSL RTI Viewer</title>
    <style>
      body {
        margin: 0px;
        padding: 0px;
        background: url(assets/little_pluses.png)
      }
      header {
        width: 100%;
        height: 48px;
        position: relative;
        top: 0px;
        background-color: black;
        font-size: 36px;
        color: white;
      }
      header span {
        position: absolute;
        padding-top: 5px;
      }
      header span.title {
        left: 0px;
        margin-left: 48px;
      }
      footer span.source {
        right: 0px;
        margin-right: 48px;
        cursor: pointer;
      }
      footer {
        position: fixed;
        bottom: 0;
        width: 100%;
        height: 48px;
        background-color: black;
      }
      footer p.instructions {
        position: relative;
        bottom: 14px;
        font-size: 24px;
        color: white;
        text-align: center;
      }
      #three {
        width: 100%;
        min-height: 400px;
        position: absolute;
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
    <script src="js/extern/rAF.js"></script>
    <script src="js/extern/Three.js"></script>
    <script src="js/rtiviewer.js"></script>
    --GA--
</head>

  <body>
    <header>
      <span class="title">GLSL RTI Viewer</span>
      --FILES--
    </header>
    <div id="three" class="loading">
    </div>
    <footer>
      <p class="instructions">
        Move mouse to relight - Wheel to zoom - Drag to pan
      </p>
      <span class="source">Source</span>
    </footer>
    <!-- <script>document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1"></' + 'script>')</script> -->
  </body>
</html>
