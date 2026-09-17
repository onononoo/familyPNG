// building items on the stage and reading them back out

var KINDS = ["char", "bubble", "thought", "caption"];
var DEFAULT_TEXT = { bubble: "hello", thought: "hmm", caption: "meanwhile" };
var DEFAULT_BG = "#d4d4d4";

var stage = document.getElementById("stage");

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function greyFor(name) {
  var n = 0;
  for (var i = 0; i < name.length; i++) n += name.charCodeAt(i);
  return "hsl(0, 0%, " + (78 + n % 10) + "%)";
}

function placeholder(name) {
  var d = document.createElement("div");
  d.className = "ph";
  d.style.background = greyFor(name);
  d.textContent = name;
  return d;
}

function imageFor(name, src) {
  if (!src) return placeholder(name);
  var img = document.createElement("img");
  img.draggable = false;
  img.alt = name;
  img.onerror = function () { img.replaceWith(placeholder(name)); };
  img.src = src;
  return img;
}

// scenes saved before the file list existed only have a name
function srcForName(name) {
  var key = name.toLowerCase();
  for (var i = 0; i < CHARACTERS.length; i++) {
    if (CHARACTERS[i][0] === key) return CHARACTERS[i][1] ? "pngs/" + CHARACTERS[i][1] : "";
  }
  return "";
}

function allItems() {
  return Array.prototype.slice.call(stage.querySelectorAll(".item"));
}

function kindOf(el) {
  for (var i = 0; i < KINDS.length; i++) if (el.classList.contains(KINDS[i])) return KINDS[i];
}

function px(v) {
  return parseFloat(v) || 0;
}

// item data: { kind, name, src, x, y, w, rot, flip, z, text, size }
function readItem(el) {
  var body = el.querySelector(".body");
  var d = {
    kind: kindOf(el),
    x: px(el.style.left),
    y: px(el.style.top),
    w: px(el.style.width),
    rot: +el.dataset.rot || 0,
    flip: el.classList.contains("flip"),
    z: +el.style.zIndex || 0
  };
  if (d.kind === "char") {
    d.name = el.dataset.name;
    d.src = el.dataset.src || "";
  } else {
    d.text = body.innerText;
    if (body.style.fontSize) d.size = parseInt(body.style.fontSize, 10);
  }
  return d;
}

function createItem(d) {
  var el = document.createElement("div");
  el.className = "item " + d.kind + (d.flip ? " flip" : "");
  el.style.left = d.x + "px";
  el.style.top = d.y + "px";
  el.style.width = d.w + "px";
  el.style.zIndex = d.z || topZ() + 1;
  el.dataset.rot = d.rot || 0;

  var body = document.createElement("div");
  body.className = "body";
  el.appendChild(body);

  if (d.kind === "char") {
    var name = (d.name || "unknown").toLowerCase();
    var src = d.src === undefined ? srcForName(name) : d.src;
    el.dataset.name = name;
    el.dataset.src = src;
    body.appendChild(imageFor(name, src));
  } else {
    body.innerText = d.text === undefined ? DEFAULT_TEXT[d.kind] : d.text;
    if (d.size) body.style.fontSize = d.size + "px";
  }

  el.appendChild(buildTools(d.kind));

  var resize = document.createElement("div");
  resize.className = "handle";
  resize.title = "resize";
  el.appendChild(resize);

  var rot = document.createElement("div");
  rot.className = "rot";
  rot.title = "rotate (shift snaps to 15)";
  el.appendChild(rot);

  stage.appendChild(el);
  applyTransform(el);
  return el;
}

function buildTools(kind) {
  var tools = document.createElement("div");
  tools.className = "tools";

  var buttons = [["flip", "f"], ["front", "]"], ["back", "["], ["copy", "ctrl+d"]];
  if (kind !== "char") buttons.push(["a+", "bigger text"], ["a-", "smaller text"]);
  buttons.push(["x", "delete"]);

  buttons.forEach(function (b) {
    var btn = document.createElement("button");
    btn.textContent = b[0];
    btn.title = b[1];
    btn.dataset.action = b[0];
    tools.appendChild(btn);
  });
  return tools;
}

function applyTransform(el) {
  var mirror = el.classList.contains("flip") && kindOf(el) === "char" ? -1 : 1;
  el.querySelector(".body").style.transform = "rotate(" + el.dataset.rot + "deg) scaleX(" + mirror + ")";
}

function topZ() {
  var z = 0;
  allItems().forEach(function (el) { z = Math.max(z, +el.style.zIndex || 0); });
  return z;
}

// keep z-index as 1..n so nothing can end up behind the stage
function normalizeZ() {
  allItems()
    .sort(function (a, b) { return a.style.zIndex - b.style.zIndex; })
    .forEach(function (el, i) { el.style.zIndex = i + 1; });
}

function setBackground(color, image) {
  stage.style.backgroundColor = color;
  stage.style.backgroundImage = image ? 'url("' + image + '")' : "none";
  stage.dataset.color = color;
  stage.dataset.image = image || "";
  document.getElementById("bgColor").value = color;
}

function emptyScene() {
  return { bg: { color: DEFAULT_BG, image: "" }, items: [] };
}

function readScene() {
  return {
    bg: { color: stage.dataset.color || DEFAULT_BG, image: stage.dataset.image || "" },
    items: allItems().map(readItem).sort(function (a, b) { return a.z - b.z; })
  };
}

function drawScene(scene) {
  allItems().forEach(function (el) { el.remove(); });
  setBackground(scene.bg && scene.bg.color || DEFAULT_BG, scene.bg && scene.bg.image || "");
  (scene.items || []).forEach(function (d) {
    if (KINDS.indexOf(d.kind) !== -1) createItem(d);
  });
  normalizeZ();
}
