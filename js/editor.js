// selecting, moving, resizing, rotating and keyboard shortcuts

var selection = [];
var clipboard = [];
var GRID = 10;

function isEditingText() {
  return document.activeElement && document.activeElement.isContentEditable;
}

function isTyping() {
  return isEditingText() || document.activeElement.tagName === "INPUT";
}

function refreshSelection() {
  allItems().forEach(function (el) {
    el.classList.remove("sel", "primary", "only");
  });
  selection = selection.filter(function (el) { return el.parentNode === stage; });
  selection.forEach(function (el) { el.classList.add("sel"); });

  var primary = selection[selection.length - 1];
  if (primary) {
    primary.classList.add("primary");
    if (selection.length === 1) primary.classList.add("only");
  }

  if (selection.length === 1) {
    var k = kindOf(primary);
    status((k === "char" ? primary.dataset.name : k) + " selected");
  } else if (selection.length > 1) {
    status(selection.length + " selected");
  }
}

function selectOnly(el) {
  selection = el ? [el] : [];
  refreshSelection();
}

function toggleSelected(el) {
  var i = selection.indexOf(el);
  if (i === -1) selection.push(el);
  else selection.splice(i, 1);
  refreshSelection();
}

function selectAll() {
  selection = allItems();
  refreshSelection();
}

// ---- actions on the selection ----

function flipSelected() {
  selection.forEach(function (el) {
    el.classList.toggle("flip");
    applyTransform(el);
  });
}

function rotateSelected(deg) {
  selection.forEach(function (el) {
    el.dataset.rot = ((+el.dataset.rot + deg) % 360 + 360) % 360;
    applyTransform(el);
  });
}

function moveSelected(dx, dy) {
  selection.forEach(function (el) {
    el.style.left = px(el.style.left) + dx + "px";
    el.style.top = px(el.style.top) + dy + "px";
  });
}

function bringToFront() {
  var z = topZ();
  inZOrder(selection).forEach(function (el) { el.style.zIndex = ++z; });
  normalizeZ();
}

function sendToBack() {
  var sel = inZOrder(selection);
  sel.forEach(function (el, i) { el.style.zIndex = i - sel.length; });
  normalizeZ();
}

function inZOrder(list) {
  return list.slice().sort(function (a, b) { return a.style.zIndex - b.style.zIndex; });
}

function textSize(delta) {
  selection.forEach(function (el) {
    if (kindOf(el) === "char") return;
    var body = el.querySelector(".body");
    var size = parseInt(getComputedStyle(body).fontSize, 10);
    body.style.fontSize = Math.max(8, Math.min(96, size + delta)) + "px";
  });
}

function deleteSelected() {
  selection.forEach(function (el) { el.remove(); });
  selection = [];
  normalizeZ();
  refreshSelection();
}

function copySelected() {
  clipboard = inZOrder(selection).map(readItem);
  if (clipboard.length) status("copied " + clipboard.length);
}

function paste(items, offset) {
  var z = topZ();
  selection = items.map(function (d) {
    var copy = JSON.parse(JSON.stringify(d));
    copy.x += offset;
    copy.y += offset;
    copy.z = ++z;
    return createItem(copy);
  });
  refreshSelection();
}

function duplicateSelected() {
  paste(inZOrder(selection).map(readItem), 20);
}

function editText(el) {
  if (kindOf(el) === "char") return;
  var body = el.querySelector(".body");
  selectOnly(el);
  el.classList.add("editing");
  body.contentEditable = true;
  body.focus();
  document.getSelection().selectAllChildren(body);
  body.onblur = function () {
    body.contentEditable = false;
    body.onblur = null;
    el.classList.remove("editing");
    commit();
  };
}

// ---- toolbar ----

stage.addEventListener("pointerdown", function (e) {
  if (e.target.closest(".tools")) e.stopPropagation();
}, true);

stage.addEventListener("click", function (e) {
  var btn = e.target.closest(".tools button");
  if (!btn) return;
  var action = btn.dataset.action;
  if (action === "flip") flipSelected();
  else if (action === "front") bringToFront();
  else if (action === "back") sendToBack();
  else if (action === "copy") duplicateSelected();
  else if (action === "a+") textSize(2);
  else if (action === "a-") textSize(-2);
  else if (action === "x") deleteSelected();
  commit();
});

// ---- mouse ----

var drag = null;
var marquee = document.getElementById("marquee");

function stagePoint(e) {
  var r = stage.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

stage.addEventListener("pointerdown", function (e) {
  if (e.button !== 0 || e.target.closest("#credits")) return;
  var el = e.target.closest(".item");

  if (isEditingText() && e.target !== document.activeElement) document.activeElement.blur();
  if (el && e.target.isContentEditable) return;
  e.preventDefault();

  if (!el) {
    if (!e.shiftKey) selectOnly(null);
    var p = stagePoint(e);
    drag = { mode: "marquee", x: p.x, y: p.y, keep: selection.slice(), moved: false };
    return;
  }

  if (e.shiftKey) {
    toggleSelected(el);
    if (selection.indexOf(el) === -1) return;
  } else if (selection.indexOf(el) === -1) {
    selectOnly(el);
  } else {
    // clicked something already selected: make it the one with the toolbar
    selection.splice(selection.indexOf(el), 1);
    selection.push(el);
    refreshSelection();
  }

  var mode = "move";
  if (e.target.classList.contains("handle")) mode = "resize";
  if (e.target.classList.contains("rot")) mode = "rotate";

  var r = el.getBoundingClientRect();
  drag = {
    mode: mode,
    el: el,
    sx: e.clientX,
    sy: e.clientY,
    moved: false,
    w: el.offsetWidth,
    rot: +el.dataset.rot,
    cx: r.left + r.width / 2,
    cy: r.top + r.height / 2,
    start: selection.map(function (s) { return { el: s, x: px(s.style.left), y: px(s.style.top) }; })
  };
  drag.angle = Math.atan2(e.clientY - drag.cy, e.clientX - drag.cx);
});

window.addEventListener("pointermove", function (e) {
  if (!drag) return;
  drag.moved = true;

  if (drag.mode === "marquee") {
    var p = stagePoint(e);
    var box = {
      left: Math.min(p.x, drag.x), top: Math.min(p.y, drag.y),
      width: Math.abs(p.x - drag.x), height: Math.abs(p.y - drag.y)
    };
    marquee.style.display = "block";
    marquee.style.left = box.left + "px";
    marquee.style.top = box.top + "px";
    marquee.style.width = box.width + "px";
    marquee.style.height = box.height + "px";
    drag.box = box;
    return;
  }

  var dx = e.clientX - drag.sx;
  var dy = e.clientY - drag.sy;

  if (drag.mode === "resize") {
    drag.el.style.width = Math.max(30, drag.w + dx) + "px";
  } else if (drag.mode === "rotate") {
    var a = Math.atan2(e.clientY - drag.cy, e.clientX - drag.cx);
    var deg = drag.rot + (a - drag.angle) * 180 / Math.PI;
    if (e.shiftKey) deg = Math.round(deg / 15) * 15;
    drag.el.dataset.rot = Math.round(deg);
    applyTransform(drag.el);
  } else {
    // snap using the grabbed item so the whole group moves together
    if (!e.altKey) {
      var grabbed = drag.start.filter(function (s) { return s.el === drag.el; })[0];
      dx = Math.round((grabbed.x + dx) / GRID) * GRID - grabbed.x;
      dy = Math.round((grabbed.y + dy) / GRID) * GRID - grabbed.y;
    }
    drag.start.forEach(function (s) {
      s.el.style.left = s.x + dx + "px";
      s.el.style.top = s.y + dy + "px";
    });
  }
});

window.addEventListener("pointerup", function () {
  if (!drag) return;
  var d = drag;
  drag = null;

  if (d.mode === "marquee") {
    marquee.style.display = "none";
    if (!d.box || d.box.width < 3 || d.box.height < 3) return;
    var s = stage.getBoundingClientRect();
    var hits = allItems().filter(function (el) {
      var r = el.getBoundingClientRect();
      return r.right - s.left > d.box.left && r.left - s.left < d.box.left + d.box.width &&
             r.bottom - s.top > d.box.top && r.top - s.top < d.box.top + d.box.height;
    });
    selection = d.keep.concat(hits.filter(function (el) { return d.keep.indexOf(el) === -1; }));
    refreshSelection();
    return;
  }

  if (d.moved) commit();
});

stage.addEventListener("dblclick", function (e) {
  var el = e.target.closest(".item");
  if (el && !isEditingText()) editText(el);
});

// scroll over a selected item to resize it around its middle
var wheelTimer;
stage.addEventListener("wheel", function (e) {
  var el = e.target.closest(".item");
  if (!el || selection.length !== 1 || selection[0] !== el || isEditingText()) return;
  e.preventDefault();
  var w = px(el.style.width);
  var nw = Math.max(30, Math.min(2000, e.deltaY < 0 ? w * 1.08 : w / 1.08));
  el.style.width = nw + "px";
  el.style.left = px(el.style.left) - (nw - w) / 2 + "px";
  clearTimeout(wheelTimer);
  wheelTimer = setTimeout(commit, 300);
}, { passive: false });

// ---- keyboard ----

var nudgeTimer;
window.addEventListener("keydown", function (e) {
  var ctrl = e.ctrlKey || e.metaKey;
  var key = e.key.toLowerCase();

  if (isEditingText()) {
    if (key === "escape") document.activeElement.blur();
    return;
  }
  if (isTyping()) return;

  if (ctrl) {
    if (key === "z" && e.shiftKey) redo();
    else if (key === "z") undo();
    else if (key === "y") redo();
    else if (key === "s") saveFile();
    else if (key === "a") selectAll();
    else if (key === "c") copySelected();
    else if (key === "x") { copySelected(); deleteSelected(); commit(); }
    else if (key === "v" && clipboard.length) { paste(clipboard, 20); clipboard = selection.map(readItem); commit(); }
    else if (key === "d" && selection.length) { duplicateSelected(); commit(); }
    else return;
    e.preventDefault();
    return;
  }

  if (key === "pageup") { e.preventDefault(); return switchScene(project.active - 1); }
  if (key === "pagedown") { e.preventDefault(); return switchScene(project.active + 1); }

  if (!selection.length) return;

  var step = e.shiftKey ? GRID : 1;
  var arrows = { arrowleft: [-step, 0], arrowright: [step, 0], arrowup: [0, -step], arrowdown: [0, step] };
  if (arrows[key]) {
    e.preventDefault();
    moveSelected(arrows[key][0], arrows[key][1]);
    clearTimeout(nudgeTimer);
    nudgeTimer = setTimeout(commit, 300);
    return;
  }

  if (key === "delete" || key === "backspace") deleteSelected();
  else if (key === "escape") return selectOnly(null);
  else if (key === "f") flipSelected();
  else if (key === "r") rotateSelected(e.shiftKey ? -15 : 15);
  else if (key === "]") bringToFront();
  else if (key === "[") sendToBack();
  else if (key === "enter") { e.preventDefault(); return editText(selection[selection.length - 1]); }
  else return;

  e.preventDefault();
  commit();
});
