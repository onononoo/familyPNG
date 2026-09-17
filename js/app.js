// scenes, undo history, saving, and the sidebar

var SAVE_KEY = "familypng";
var OLD_SAVE_KEY = "familyPNG-scene";
var HISTORY_LIMIT = 100;

var project = { scenes: [emptyScene()], active: 0 };
var uploads = [];

function $(id) {
  return document.getElementById(id);
}

// ---- status bar ----

var statusTimer;
function status(msg, ms) {
  $("statusText").textContent = msg.toLowerCase();
  clearTimeout(statusTimer);
  statusTimer = setTimeout(function () { $("statusText").textContent = "ready"; }, ms || 2000);
}

function updateCount() {
  var n = allItems().length;
  $("count").textContent = "scene " + (project.active + 1) + " of " + project.scenes.length +
    " · " + n + (n === 1 ? " object" : " objects");
}

// ---- history ----

var past = [];
var future = [];
var current = "";

function snapshot() {
  return JSON.stringify(project.scenes);
}

function commit() {
  project.scenes[project.active] = readScene();
  var s = snapshot();
  updateCount();
  if (s === current) return;
  past.push(current);
  if (past.length > HISTORY_LIMIT) past.shift();
  future = [];
  current = s;
  persist();
}

function restoreSnapshot(s) {
  current = s;
  project.scenes = JSON.parse(s);
  project.active = Math.min(project.active, project.scenes.length - 1);
  selection = [];
  drawScene(project.scenes[project.active]);
  refreshSelection();
  drawSceneTabs();
  persist();
}

function undo() {
  if (!past.length) return status("nothing to undo");
  future.push(current);
  restoreSnapshot(past.pop());
  status("undo");
}

function redo() {
  if (!future.length) return status("nothing to redo");
  past.push(current);
  restoreSnapshot(future.pop());
  status("redo");
}

// ---- saving ----

function persist() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ scenes: project.scenes, active: project.active }));
  } catch (err) {
    status("too big to autosave, use save", 4000);
  }
}

function loadProject(data) {
  // a single scene from an older version
  if (data && data.items) data = { scenes: [data], active: 0 };
  if (!data || !Array.isArray(data.scenes) || !data.scenes.length) throw new Error("not a familypng file");
  project.scenes = data.scenes;
  project.active = Math.max(0, Math.min(+data.active || 0, data.scenes.length - 1));
  selection = [];
  drawScene(project.scenes[project.active]);
  refreshSelection();
  drawSceneTabs();
}

function saveFile() {
  project.scenes[project.active] = readScene();
  var blob = new Blob([JSON.stringify({ scenes: project.scenes, active: project.active }, null, 1)], { type: "application/json" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "scene.json";
  a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  status("saved scene.json");
}

$("openIn").onchange = function (e) {
  var f = e.target.files[0];
  e.target.value = "";
  if (!f) return;
  f.text().then(function (text) {
    loadProject(JSON.parse(text));
    commit();
    status("opened " + f.name);
  }).catch(function () {
    status("couldn't open " + f.name, 4000);
  });
};

// ---- scenes ----

function switchScene(i) {
  if (i < 0 || i >= project.scenes.length || i === project.active) return;
  if (isEditingText()) document.activeElement.blur();
  project.scenes[project.active] = readScene();
  project.active = i;
  selection = [];
  drawScene(project.scenes[i]);
  refreshSelection();
  drawSceneTabs();
  persist();
}

function addScene(copy) {
  project.scenes[project.active] = readScene();
  var scene = copy ? JSON.parse(JSON.stringify(project.scenes[project.active])) : emptyScene();
  if (!copy) scene.bg = JSON.parse(JSON.stringify(project.scenes[project.active].bg));
  project.scenes.splice(project.active + 1, 0, scene);
  project.active++;
  selection = [];
  drawScene(scene);
  refreshSelection();
  drawSceneTabs();
  commit();
  status(copy ? "scene copied" : "scene added");
}

function removeScene() {
  if (project.scenes.length === 1) return clearScene();
  project.scenes.splice(project.active, 1);
  project.active = Math.min(project.active, project.scenes.length - 1);
  selection = [];
  drawScene(project.scenes[project.active]);
  refreshSelection();
  drawSceneTabs();
  commit();
  status("scene removed (ctrl+z to undo)", 4000);
}

function moveScene(dir) {
  var to = project.active + dir;
  if (to < 0 || to >= project.scenes.length) return;
  project.scenes[project.active] = readScene();
  var s = project.scenes.splice(project.active, 1)[0];
  project.scenes.splice(to, 0, s);
  project.active = to;
  drawSceneTabs();
  commit();
}

function drawSceneTabs() {
  var bar = $("scenes");
  bar.innerHTML = "";

  project.scenes.forEach(function (_, i) {
    var b = document.createElement("button");
    b.textContent = i + 1;
    b.title = "scene " + (i + 1) + " (pageup / pagedown)";
    if (i === project.active) b.className = "on";
    b.onclick = function () { switchScene(i); };
    bar.appendChild(b);
  });

  [
    ["+", "new scene", function () { addScene(false); }],
    ["copy", "copy this scene", function () { addScene(true); }],
    ["<", "move scene left", function () { moveScene(-1); }],
    [">", "move scene right", function () { moveScene(1); }],
    ["remove", "remove this scene", removeScene]
  ].forEach(function (t) {
    var b = document.createElement("button");
    b.textContent = t[0];
    b.title = t[1];
    b.onclick = t[2];
    bar.appendChild(b);
  });

  updateCount();
}

// ---- adding things ----

function freeSpot(w) {
  return {
    x: Math.max(10, stage.clientWidth / 2 - w / 2 + (Math.random() * 120 - 60)),
    y: Math.max(30, stage.clientHeight / 2 - 120 + (Math.random() * 80 - 40))
  };
}

function addCharacter(name, src, x, y) {
  var w = 160;
  var p = x === undefined ? freeSpot(w) : { x: x, y: y };
  selectOnly(createItem({ kind: "char", name: name, src: src, x: p.x, y: p.y, w: w }));
  commit();
}

function addText(kind) {
  var w = kind === "caption" ? 240 : 200;
  var p = freeSpot(w);
  var el = createItem({ kind: kind, x: p.x, y: p.y, w: w });
  commit();
  editText(el);
}

function clearScene() {
  if (!allItems().length) return;
  allItems().forEach(function (el) { el.remove(); });
  selectOnly(null);
  commit();
  status("cleared (ctrl+z to undo)", 4000);
}

function setPlace(name, src) {
  setBackground(stage.dataset.color || DEFAULT_BG, src);
  commit();
  status("background: " + name);
}

function readImageFile(file, done) {
  if (!/^image\//.test(file.type)) return status(file.name + " isn't an image");
  var reader = new FileReader();
  reader.onload = function () { done(file.name.replace(/\.[^.]+$/, "").toLowerCase(), reader.result); };
  reader.readAsDataURL(file);
}

$("pngIn").onchange = function (e) {
  Array.prototype.forEach.call(e.target.files, function (f) {
    readImageFile(f, function (name, src) {
      uploads.push([name, src]);
      if (activeTab === "characters") drawList();
      addCharacter(name, src);
    });
  });
  e.target.value = "";
};

$("bgIn").onchange = function (e) {
  var f = e.target.files[0];
  e.target.value = "";
  if (f) readImageFile(f, function (name, src) { setPlace(name, src); });
};

$("bgColor").oninput = function () {
  setBackground($("bgColor").value, "");
};
$("bgColor").onchange = function () {
  commit();
  status("background changed");
};

stage.addEventListener("dragover", function (e) { e.preventDefault(); });
stage.addEventListener("drop", function (e) {
  e.preventDefault();
  var p = stagePoint(e);
  var files = e.dataTransfer.files;

  if (files.length) {
    Array.prototype.forEach.call(files, function (f, i) {
      readImageFile(f, function (name, src) {
        uploads.push([name, src]);
        if (activeTab === "characters") drawList();
        addCharacter(name, src, p.x - 80 + i * 30, p.y - 100);
      });
    });
    return;
  }

  var data;
  try { data = JSON.parse(e.dataTransfer.getData("text/plain")); } catch (err) { return; }
  if (data.place) setPlace(data.name, data.src);
  else addCharacter(data.name, data.src, p.x - 80, p.y - 100);
});

// ---- sidebar ----

var activeTab = "characters";
var list = $("list");

function pickTile(name, src, isPlace) {
  var tile = document.createElement("div");
  tile.className = "pick";
  tile.title = name;
  tile.draggable = true;
  tile.appendChild(imageFor(name, src));
  tile.appendChild(document.createTextNode(name));
  tile.onclick = function () {
    if (isPlace) setPlace(name, src);
    else addCharacter(name, src);
  };
  tile.ondragstart = function (e) {
    e.dataTransfer.setData("text/plain", JSON.stringify({ name: name, src: src, place: isPlace }));
  };
  return tile;
}

function drawList() {
  var q = $("filter").value.toLowerCase();
  var isPlaces = activeTab === "places";
  var entries = isPlaces
    ? PLACES.map(function (p) { return [p[0], "places/" + p[1]]; })
    : CHARACTERS.map(function (c) { return [c[0], c[1] ? "pngs/" + c[1] : ""]; }).concat(uploads);

  list.className = activeTab;
  list.innerHTML = "";
  entries
    .filter(function (entry) { return entry[0].indexOf(q) !== -1; })
    .forEach(function (entry) { list.appendChild(pickTile(entry[0], entry[1], isPlaces)); });
}

Array.prototype.forEach.call(document.querySelectorAll("#tabs button"), function (b) {
  b.onclick = function () {
    activeTab = b.dataset.tab;
    Array.prototype.forEach.call(document.querySelectorAll("#tabs button"), function (other) {
      other.classList.toggle("on", other === b);
    });
    list.scrollTop = 0;
    drawList();
  };
});

$("filter").oninput = drawList;

// ---- start ----

(function start() {
  try {
    var saved = localStorage.getItem(SAVE_KEY) || localStorage.getItem(OLD_SAVE_KEY);
    if (saved) loadProject(JSON.parse(saved));
  } catch (err) {
    project = { scenes: [emptyScene()], active: 0 };
  }
  drawScene(project.scenes[project.active]);
  drawSceneTabs();
  drawList();
  project.scenes[project.active] = readScene();
  current = snapshot();
  status("double-click text to edit · scroll to resize · ctrl+z to undo", 6000);
})();
