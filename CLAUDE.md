# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

Early-stage Arkanoid/Breakout game for the browser (HTML5 canvas, plain JS, no bundler). At the time of writing the repo contains only `assets/` plus an empty `README.md`: there is no `index.html`, game loop, `package.json`, build, lint, or test setup yet. Don't assume any tooling exists; if you add some, update this file with the commands.

## Assets (`assets/`)

- `spritesheet-breakout.png` — single spritesheet for all graphics.
- `spritesheet.js` — a classic (non-module) script that defines globals. It must be loaded via `<script>` before game code:
  - `SPRITES` — source rects (`sx, sy, sw, sh`) for `paddle`, `ball`, and `blocks.<color>` (gray, red, yellow, cyan, magenta, hotpink, green).
  - `EXPLOSION_FRAMES` — 4-frame break animation per block color (frames sit at x=256..352 in the sheet, same rows as the block colors); `gray` reuses the red frames. `EXPLOSION_DURATION` is 150 (ms, presumably for the full animation).
  - `loadSpritesheet(cb)` — async loader; queues callbacks and fires them all once loaded. The image is copied into an offscreen canvas (`ssImg` is a canvas, not an `Image`). The path `'assets/spritesheet-breakout.png'` is relative to the HTML page, so the page must be served from the project root.
  - `drawSprite(ctx, name, x, y, w, h)` — `name` is `'paddle'`, `'ball'`, or `'block_<color>'`. `drawFrame(ctx, frame, x, y, w, h)` draws an explosion frame. Both silently no-op until the sheet is loaded.
- `sounds/ball-bounce.mp3`, `sounds/break-sound.mp3` — sound effects.

Native sprite sizes: blocks 32x16, ball 16x16, paddle 162x14; draw them scaled via the `w, h` args.

Because the page loads an image into canvas and audio, open it through a local static server (e.g. `python -m http.server`) rather than `file://`, to avoid canvas/CORS and audio restrictions.
