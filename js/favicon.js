// the tab icon is peter's head, cut out of his image in pngs/
// the square below is where his head sits in that image
var HEAD = { x: 725, y: 300, size: 560 };

(function () {
  var link = document.querySelector("link[rel=icon]");
  var img = new Image();

  img.onload = function () {
    var canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    var ctx = canvas.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, HEAD.x, HEAD.y, HEAD.size, HEAD.size, 0, 0, 64, 64);
    try {
      link.href = canvas.toDataURL("image/png");
    } catch (err) {
      // opened straight from disk: the browser won't let us read the pixels,
      // so the link keeps pointing at the whole image
    }
  };

  img.src = link.href;
})();
