---
title: Space Fighter — Progress Log
status: living
last_updated: 2026-04-11
---

# Space Fighter — Progress Log

A running record of how this game was built. Captures the original spec, every shipped version with the change and the reason behind it, and the key decisions that aren't obvious from the code.

For the full implementation plan see [`docs/plans/2026-04-11-001-feat-vertical-shmup-space-fighter-plan.md`](plans/2026-04-11-001-feat-vertical-shmup-space-fighter-plan.md).

## Original Spec

A vertical-scrolling top-down shoot-'em-up in the late-1990s arcade tradition (Raiden, Strikers 1945, DonPachi, Battle Garegga). Pure 2D pixel art on a fixed 384×216 canvas using procedural Canvas drawing and Web Audio procedural sound — zero image or audio assets.

**Core gameplay (as originally requested):**

- Player controls a small fighter ship viewed top-down, locked to a fixed Y position near the bottom of the screen, moves only left and right with arrow keys or A/D
- Fire with spacebar, bomb with shift
- Vertical auto-scroll with a tiled terrain background (start over ocean, transition to an enemy carrier or island base)
- Enemies spawn from the top in classic arcade wave patterns: V-formations, sine sweeps, popcorn enemies that drift in from the sides, turrets bolted to the scrolling terrain
- Three enemy types: basic popcorn fighter (1 hit), gun turret (3 hits, aimed shots), heavy bomber (5 hits, drops spread bullets)
- Bullet-hell-lite: enemies fire visible glowing pink and blue bullets in readable patterns; player hitbox is a single pixel at the ship's center
- Power-ups: red (vulcan spread), blue (laser), gold (score), P (power up), B (extra bomb)
- Bombs clear all on-screen bullets and damage everything
- Lives, score, high score, power level, and bomb count shown in a chunky arcade HUD
- Screen flash on bomb, screen shake on player death, big pixel explosions

**Visual style requirements:**

- Hand-pixel-art sprites, roughly 16×16 to 32×32 for ships
- Bright saturated palette: deep ocean blue, hot pink bullets, neon green explosions, white muzzle flashes
- Scrolling terrain made of tiled pixel art (water with foam, metal carrier deck, runways)
- Optional CRT scanline overlay toggleable with a key
- Title screen with flashing "PRESS START", high score table, attract mode loop
- Chunky pixel arcade font for HUD and score popups

The original spec assumed a naval setting (ocean → carrier → runway). This evolved into space (starfield → nebula → asteroids → alien station) in v3 based on feedback.

## Version Log

Versions are bumped on every push per the template's `CLAUDE.md` rule (start commit message with the new version).

### v1 — Initial Space Fighter implementation

Replaced the template's "Block Dodge" example with the full shmup in one pass, all in `src/game.js` plus `src/game-config.js` and `src/game-sounds.js` (engine in `src/engine/*` left untouched per `CLAUDE.md`).

Shipped systems: scrolling tiled terrain (ocean → shore → carrier deck → runway), player ship with vulcan/laser weapons across 5 power levels, three enemy types (popcorn/turret/bomber), data-driven `WAVE_SCHEDULE` that loops with rising difficulty, single-pixel hitbox, power-ups, bombs with white flash and bullet clear, screen shake on death, lives via the engine HUD with extras (high score top-center, power meter bottom-left, bomb count bottom-right), CRT scanline overlay toggleable with `C`, attract-mode demo loop, and a frozen world render on game over.

**Bug caught during build:** the gold power-up label was `'$'` and `String.prototype.replace()` in `build.js` interprets `$'` as a special replacement token (the portion of the string after the match), eating the character and breaking the bundle. Switched the label to `'G'`. The template's `build.js` was later hardened to use the function-callback form of `replace()` so no future game can hit the same trap.

### v2 — Easier early-game tuning + plan doc checked in

The opening seconds felt like a wall. Added a `warmupFactor()` that ramps from 55% → 100% over the first 1600 scroll units, multiplying every enemy speed and every enemy-bullet speed at spawn time so early enemies stay slow forever and later enemies ramp up. Also lowered base popcorn/V-formation/sine/bomber speeds, dropped `ENEMY_BULLET_BASE_SPEED` from 1.7 to 1.25, roughly doubled popcorn fire cooldowns, pushed the wave schedule later, trimmed early counts, and dropped the per-loop difficulty multiplier from 0.08 to 0.07.

Also checked in [`docs/plans/2026-04-11-001-feat-vertical-shmup-space-fighter-plan.md`](plans/2026-04-11-001-feat-vertical-shmup-space-fighter-plan.md) — the original `ce-plan` output that drove v1.

### v3 — Space-themed terrain

The original naval theme felt off-brand. Replaced ocean → shore → carrier → runway with starfield → nebula → asteroids → alien station:

- **space**: deep black with sparse mid-layer stars; the canvas now clears to `#02040d` and a parallax far starfield drifts behind everything at quarter scroll speed
- **nebula**: translucent purple/pink/cyan washes layered over the base, with brighter foreground stars peeking through
- **asteroids**: dark void scattered with chunky rocks (highlights, shadows, debris pebbles) and stars between them
- **station**: alien hull panels with rivets and a flickering neon centerline alternating cyan and magenta

Subtitle changed from `DEFEND THE SKIES` to `GUARD THE GALAXY`.

After v3 the feature branch was merged into `main` with a `--no-ff` merge commit.

### v4 — Scroll terrain DOWN + delay first waves

The terrain was scrolling the wrong way. The original mapping (`screenY = row*TILE - offsetY`) made fixed `worldY` values move UP the screen as `scrollY` grew, which read as if the ship were flying backward. Rewrote `renderTerrain` and `renderFarStars` so a fixed `worldY` moves DOWN toward the player at the bottom. New mapping:

```
screenY = h + scrollY - worldY
worldY  = h + scrollY - screenY
```

So the topmost visible tile is the largest `worldY` (newest content the player is approaching) and the bottom edge is the world directly under the ship.

Also pushed the first wave from `at: 180` to `at: 320` and shrunk early counts so the opening seconds feel like a real warm-up.

### v5 — All enemies enter from the top + brighter silhouettes

**Side-entering enemies were unfair.** The `popcornStream` waves spawned popcorn fighters from the left/right edges with a horizontal velocity component. With the player limited to left/right movement (still true in v5), a horizontally drifting popcorn would sweep the entire dodge axis with nowhere to escape to. Removed `popcornStream` from `WAVE_SCHEDULE` entirely and deleted the `case 'popcornStream'` branch from `spawnWave`. Replaced those slots with vFormation and sineSweep entries so every enemy now enters from the top.

**Enemy contrast:** the dark turret and bomber sprites were blending into the dark space biomes. Brightened the palette across the board (popcorn red, turret silver, bomber magenta) and added a translucent colored halo + 1px white outline behind every enemy sprite.

### v6 — Pull the first wave forward

After v4 pushed everything later and v5 cleaned up the bad waves, the opening felt empty for too long. Pulled the first wave from `at: 320` to `at: 140` (~3 seconds in instead of ~7) and shifted every subsequent entry forward by 180 to keep the same spacing between waves.

### v7 — Drop the rectangular halo + outline

The v5 halo + outline was a bounding-box rectangle, not a shape-following silhouette. On the small popcorn ships (~14×14) the outline box was almost the same size as the actual sprite, so they read as blocky glow boxes instead of clean ship outlines. Removed all halos and all 1px outlines; kept the brighter v5 palette as the only contrast tool. Sprites read better against the dark space background through pure color saturation.

### v8 — 8-direction player movement

Locked-Y movement felt too restrictive once the bullet patterns ramped up. Added `up` and `down` to `GAME.controls` (ArrowUp/ArrowDown + W/S), updated `updatePlayer` to read all four direction inputs, normalized the diagonal vector by `1/sqrt(2)` so diagonals aren't √2 faster than orthogonals, and clamped `player.y` between 30 and `height - 16` so the ship can't drift behind the top score HUD or below the bottom power/bomb HUD. The respawn position stayed near the bottom (`RESPAWN_Y = 178`).

This is a deliberate departure from the original spec ("locked to a fixed Y position near the bottom of the screen, moves only left and right"). Justified because it gives the player a real way to dodge dense bullet patterns.

### v9 — D-pad style touch layout

The engine in `src/engine/input.js` auto-generates one touch button per `GAME.controls` entry inside `#touchControls` and lays them out as a flex row. Six buttons (UP/DOWN/LEFT/RIGHT/FIRE/BOMB) in a row is unusable on mobile and awkward on tablet. Injected a stylesheet from `gameInit` that overrides `#touchControls` into an absolute overlay and positions:

- The four directional buttons in a + cross on the bottom-left (d-pad cluster)
- FIRE oversized (160px on tablet, 100px on phone) on the bottom-right for primary-thumb ergonomics
- BOMB above FIRE on the right

Tablet sizing kicks in at `min-width: 700px` so iPad gets the larger ergonomic layout. The injection is one-shot (`dpadStyleAttached` guard) so restarts don't stack styles. All work stays in `game.js` — the engine in `src/engine/input.js` and `src/template.html` are still untouched.

## Key Decisions

These are choices that aren't obvious from the code or that are worth knowing if you ever read this in six months.

### All game code lives in three files

`src/game-config.js`, `src/game-sounds.js`, `src/game.js`. The engine in `src/engine/*` is off-limits per `CLAUDE.md` ("TEMPLATE ENGINE - Don't edit"). Any time the engine *almost* but not *quite* did what the game needed (HUD layering, touch button layout, CRT toggle) the workaround had to live in `game.js` rather than be solved in the engine.

Concrete consequences:

- The engine's `drawUI` (which draws score top-left and hearts top-right) runs **after** `gameRender` and cannot be replaced. Extra HUD elements (high score, power meter, bomb count) are drawn from `gameRender` in the regions the engine HUD doesn't touch.
- The CRT toggle uses a direct `window.addEventListener('keydown', ...)` set up in `gameInit`, guarded by `crtListenerAttached`, because `GAME.controls` entries are held-state (good for move/fire), not edge-triggered (needed for a toggle).
- The d-pad layout is a stylesheet injected from `gameInit`, guarded by `dpadStyleAttached`, that overrides `#touchControls` with absolute positioning rather than touching `input.js`.

### Lives use the engine's `health`

`Engine.state.health` = remaining lives, `Engine.state.maxHealth` = max lives (5). The engine's default heart HUD doubles as the life counter. Each death decrements `health` and triggers a brief respawn invulnerability; reaching 0 triggers the engine's game-over path automatically. We never set `Engine.state.gameOver` ourselves — the engine does it from `health === 0` next frame.

### Single-pixel hitbox

The player ship sprite is ~20×24 but collision uses one point: `player.hitboxX = player.x`, `player.hitboxY = player.y - 2` (slightly above center, near the cockpit). Bullet→player tests use point-in-circle. Enemy-body collisions use point-in-AABB. This is canonical bullet-hell-lite behavior.

### Entities are plain arrays, no pooling

`enemies`, `enemyBullets`, `playerBullets`, `powerups`, `explosions`. `splice` on death. Simpler than pools, and 384×216 is small enough that GC isn't an issue. If profiling ever shows otherwise, pool later.

### Screen coordinates, not world coordinates, for entities

The camera is fixed (player near bottom). Everything scrolls past. Enemies and bullets live in **screen space** because spawn events are driven by a global `scrollY` counter — cleaner than maintaining a virtual world.

### Data-driven `WAVE_SCHEDULE` that loops with difficulty

```js
const WAVE_SCHEDULE = [
  { at: 140, kind: 'vFormation', count: 3 },
  ...
];
```

Each entry's `at` is "scroll units since the last loop reset". `updateWaves` peels off waves whose threshold is reached. When the schedule ends, `nextWaveIndex` resets, `waveBaseY` rebases against the current `scrollY`, and `difficultyLoop++` bumps the `speedMul`/HP multipliers globally. Runs are effectively endless with smooth difficulty ramp.

### Warmup ramp on top of difficulty loop

`warmupFactor()` returns `0.55 + 0.45 * min(1, scrollY / 1600)` and is applied at enemy spawn time and at enemy-fire time. So early enemies stay slow forever (their `vy` is captured at spawn), and bullets fired by the same enemy gradually speed up as the run continues. Independent of `difficultyLoop` which only cares about loop count, not absolute time.

### Bomb is a single state flag with a lifetime

`bombFlash` starts at `BOMB_FRAMES` and decrements. While `> BOMB_FLASH_CUTOFF` the screen is painted white at decreasing alpha. While `> 0` enemy bullets are cleared and on-screen enemies take chunked damage every frame. The bomb also bumps `player.invuln` to `BOMB_FRAMES + 10` so the player can't die during the chaos.

### Screen shake via `ctx.save()` + `translate(dx, dy)` in `gameRender`

The save/restore wraps the world render only. The engine's `drawUI` runs **after** `gameRender` (i.e., after `ctx.restore`) so the HUD stays stable while the world shakes. This is what we want.

### Attract mode is a sandboxed parallel world

`gameTitleRender` runs every frame on the title screen but `gameUpdate` does not. A separate `demoState` object holds the demo player/enemies/bullets/explosions. The demo is ticked forward inside `gameTitleRender` using a manually computed dt from the `time` argument. Real gameplay state (`player`, `enemies`, `enemyBullets`, etc.) is never touched from the demo path. `gameInit` resets `demoState = null` so demo entities can't bleed into a real run.

### CRT overlay is a real visual style toggle, not an accessibility option

`drawCRT` paints a horizontal-line pattern on top of the world at low alpha. Toggled by `C` (edge-triggered, see above). Off by default. Drawn after the world but before the engine HUD, so the HUD stays crisp regardless.

### The build script writes both `dist/index.html` and root `index.html`

Required for GitHub Pages deployment. Pages legacy mode can publish from `/(root)` or `/docs` but not from `/dist`. Rather than reorganize the build output, `build.js` writes the bundle to both locations and the CI workflow keeps the root file in sync on every push. See [`README.md`](../README.md) for the full Pages walkthrough.

### Departure from spec: 8-direction movement (v8)

The original spec said the player is "locked to a fixed Y position near the bottom of the screen, moves only left and right". v8 broke that constraint deliberately because dodging horizontally-side-to-side dense bullet patterns wasn't fair to the player. The respawn point still anchors near the bottom; the player can roam freely now but typically lives in the bottom third anyway.

### Departure from spec: no side-entering popcorn streams (v5)

The original spec said "popcorn enemies that drift in from the sides". This was implemented in v1 as `popcornStream` waves spawning popcorn at `x = -16` or `x = width + 16` with a horizontal `vx`. v5 removed them entirely because (at the time) the player could only move left and right, so a horizontally drifting popcorn would sweep the player's entire dodge axis. Even with v8's 8-direction movement, side-streamers haven't been brought back — the data-driven schedule still covers V-formations, sine sweeps, and turret/bomber waves, which is enough variety.

## Deployment

- **Live URL:** http://www.tomalterman.com/space-fighter/
- **Hosting:** GitHub Pages (legacy mode, source `main:/`), serving root `index.html`
- **CI:** [`.github/workflows/build.yml`](../.github/workflows/build.yml) runs `node build.js` on every push to `main` and commits the regenerated `index.html` back if it changed (with `[skip ci]` so it never re-triggers itself)
- **Versioning:** bump `GAME.version` and start the commit message with `vN:` per the template's `CLAUDE.md` rule

## File Map

| File | What it is |
|---|---|
| [`src/game-config.js`](../src/game-config.js) | Game name, version, controls, instructions, Firebase keys, canvas size |
| [`src/game-sounds.js`](../src/game-sounds.js) | All procedural sounds (Web Audio) |
| [`src/game.js`](../src/game.js) | Everything else: state, lifecycle hooks, entities, rendering, HUD, d-pad CSS injection |
| [`src/engine/*`](../src/engine/) | Template engine — do not edit per `CLAUDE.md` |
| [`src/template.html`](../src/template.html) | HTML shell with `/* BUILD_INSERT_JS */` placeholder — do not edit |
| [`build.js`](../build.js) | Concatenates engine + game into `dist/index.html` and root `index.html` |
| [`.github/workflows/build.yml`](../.github/workflows/build.yml) | Auto-rebuild and commit on every push |
| [`docs/plans/2026-04-11-001-feat-vertical-shmup-space-fighter-plan.md`](plans/2026-04-11-001-feat-vertical-shmup-space-fighter-plan.md) | Original implementation plan |
| [`docs/PROGRESS.md`](PROGRESS.md) | This file |
