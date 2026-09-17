# familypng

a plain grey page for making little family guy scenes. put characters on a stage, add speech bubbles, thought bubbles and captions, and make a few scenes in a row.

no build step and no dependencies. open `index.html` in a browser.

HEAD
## files

```
index.html        the page
style.css         all styling
js/data.js        character and place lists
js/scene.js       building items on the stage and reading them back
js/editor.js      selection, mouse, keyboard
js/app.js         scenes, undo, saving, sidebar
pngs/             character images
places/           background images
.peter/           local dev server config (python -m http.server 8123)
```

the scripts are plain `<script>` tags, not modules, so the page works straight from disk.

## images

characters are listed in `js/data.js` as `[name, file]`, with files in `pngs/`. places work the same way, with files in `places/`. to add one, drop the image in the folder and add a line:

```js
["herbert's dog jesse", "jesse.png"],
```

use `null` for the file to get a grey placeholder card.

you can also add images while the page is open with **add png**, or by dragging image files onto the stage. those only last until you reload, unless they're in a saved scene.

the bundled images came from the [family guy wiki](https://familyguy.fandom.com). they are webp files, and most are screenshots rather than cutouts, so they show up as rectangles. to replace one, put a transparent png in `pngs/` and point its line in `data.js` at it. a few show more than one person: jillian with derek, mickey mcfinnigan with peter, and james woods with peter.
=======
## Running it locally

Open `index.html` in a browser. That's it.

## controls

| action | how |
| --- | --- |
| add a character | click it in the sidebar, or drag it onto the stage |
| set a background | click a place in the **places** tab, use **background** for your own image, or pick a color |
| select | click. shift+click adds or removes. drag on empty space to box select. ctrl+a selects everything |
| move | drag, or arrow keys (shift = 10px). moves everything selected |
| resize | drag the dark square (bottom right), or scroll over the item |
| rotate | drag the light square (bottom left). shift snaps to 15°. r / shift+r also rotates |
| flip | **flip**, or f |
| front / back | **front** / **back**, or ] / [ |
| copy | **copy** or ctrl+d. ctrl+c, ctrl+x, ctrl+v also work |
| delete | **x**, delete or backspace |
| add text | **speech**, **thought** or **caption** |
| edit text | double-click, or select and press enter. escape or click away when done |
| text size | **a+** / **a-** |
| undo / redo | **undo** / **redo**, ctrl+z / ctrl+y |
| deselect | escape, or click empty space |

resize, rotate and text editing only show up when one thing is selected.

items snap to a 10px grid while you drag them. hold alt to place them freely.

## scenes

the strip under the stage holds the scenes.

- click a number to switch, or use pageup / pagedown
- **+** adds an empty scene with the same background
- **copy** duplicates the current scene
- **<** / **>** move the current scene left or right
- **remove** deletes it (undo brings it back)

## saving

- everything saves to the browser automatically and comes back when you reopen the page
- **save** (ctrl+s) downloads `scene.json` with every scene. **open** loads it back
- scenes with a lot of uploaded images can be too big to autosave. the status bar will say so. use **save** instead
- saved files refer to `pngs/` and `places/` by path, so keep them next to `index.html`
- **print** prints the current scene only

## notes

family guy and its characters belong to 20th television / fox. the images are for personal use. don't publish them with this page.

## license

the code is under the mit license, see [LICENSE](LICENSE). the license doesn't cover the images in `pngs/` and `places/`, which belong to fox.

## support :)
all projects r open source! please donate to my bitcoin address: bc1qs4z04ltddh6vaqd4stu3p4vekv253ht4cwqma4 :3
all other projects: https://github.com/onononoo
my socials! (and other crypto addresses): https://guns.lol/karaeklund
