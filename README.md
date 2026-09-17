# familyPNG

A plain, grey, single-file web page for making little Family Guy scenes. Drag characters around, add speech bubbles, thought bubbles and captions, and arrange them however you like.

No build step, no dependencies. Just `index.html`.

## Running it

Open `index.html` in a browser. That's it.

## Adding character images

The page looks for images in the `pngs/` folder, named after the character in lowercase with dashes:

```
pngs/peter-griffin.png
pngs/stewie-griffin.png
pngs/glenn-quagmire.png
```

`.png` is tried first, then `.jpg`, then `.gif`. If there's no image, a grey placeholder card with the character's name is shown instead.

The images in `pngs/` came from the [Family Guy Wiki](https://familyguy.fandom.com). Most are screenshots rather than transparent cutouts, so they show up as rectangles. Swap in cutout PNGs with the same file name to replace them. Carl, Jillian, Dr Hartman, Donna Tubbs and Mayor West have no image yet.

You can also add any image while the page is open:

- click **add png** in the sidebar, or
- drag image files straight onto the scene.

Images added this way are added to the sidebar list for the rest of the session.

The character list lives at the top of the `<script>` block in `index.html` (`CHARACTERS`). Add or remove names there.

## Controls

| Action | How |
| --- | --- |
| Add a character | Click it in the sidebar, or drag it onto the scene |
| Move | Drag it, or use the arrow keys (Shift = 10px) |
| Resize | Drag the small grey square in the bottom-right corner |
| Flip / front / back / copy / delete | Toolbar above the selected item |
| Text size | `a+` / `a-` on a selected text box |
| Add text | **speech**, **thought** or **caption** buttons |
| Edit text | Double-click a text box, press Escape or click away when done |
| Delete | Delete or Backspace key, or `x` in the toolbar |
| Find a character | Type in the **filter** box |
| Background | Color picker, or **background** to use an image |
| Start over | **clear** |

Items snap to a 10px grid when you let go of them. The status bar at the bottom shows what's selected and how many objects are in the scene.

## Notes

- Scenes aren't saved. Reloading the page clears everything, so take a screenshot to keep one.
- Family Guy and its characters belong to 20th Television / Fox. Character images are for personal use only; don't publish them with this page.
