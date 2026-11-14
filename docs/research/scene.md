# Homepage scene

The centrepiece at the top of the homepage (the placeholder dot field in `src/assets/js/app.js` for now).

## Brief

- A place to sit while listening: ambient scenes that ask the visitor to stay and listen for a moment.
- First scene: a café on a rainy day. The draw is the contrast between warm inside and cold, wet outside.
- More scenes later, all in one locked style.
- Like the shwn.design koi pond: alive on its own, calm, interaction optional, personal. It shouldn't compete with
  the projects, which "speak for themselves".
- The player is a Bandcamp embed with no JavaScript API, so a scene can't react to the music itself.

## What a locked style has to settle

- Where the viewer sits (so far: inside, looking out at weather).
- Palette rule (so far: warm inside, cool outside).
- How it's drawn: pixel, flat shapes, painterly, diorama, photographic.
- Motion: slow loops, nothing sudden.
- At most one small optional interaction per scene.

## Prototypes, 2026-11-09

`/proto/cafe/` (`src/proto/cafe.njk`, `src/assets/js/proto/cafe-*.js`): the same rainy café in three styles behind a
picker (keys 1–3, ←/→, R to replay). Canvas 2D, pauses off-screen, respects reduced motion.

| Style | What it was | Verdict |
| --- | --- | --- |
| Pixel | 192×120 pixel art, ordered dithering, steam, flickering windows | Not it |
| Paper | Flat cut-paper layers at dusk, arched window, person with a red umbrella, pointer parallax, grain | Best looking, but "nowhere near the scene that I am envisioning" |
| Fogged glass | Out-of-focus city lights through misted glass you can wipe; it fogs back | Not it |

## Moodboard, 2026-11-09

- **Rain & Lamplight:** https://claude.ai/artifact/Y6fk5ccWBGddL3x4kE6u3m (private claude.ai artifact).
- 45 references in six groups; Broden marks each Love, Maybe or No and can add a note. Picks save to the artifact's
  database (`reactions/<id>`, `notes/general`), which Claude can read back.
- Full list with sources: `scene-references.md`. Credits and years were not double-checked against the stores.
- **Status:** completed 2026-11-09. Raw picks: `data/moodboard-picks.json`.

## Moodboard results, 2026-11-09

5 love, 17 maybe, 22 no, 1 unrated with a note.

**Love:** every one is a painting or print.
- Hasui, *Evening at Ushibori* (1930)
- Yoshida, *Kagurazaka Street after a Night Rain* (1929)
- Grimshaw, *Boar Lane, Leeds, by Lamplight* (1881)
- Grimshaw, *Liverpool Quay by Moonlight* (1887)
- Hopper, *Nighthawks* (1942)

Broden's words: "I particularly love the Japanese paintings for their style and use of colors, it makes for beautiful
scenes."

**Maybe:** mostly dioramas and toy worlds (The Gardens Between, Townscaper, Tiny Glade, Cloud Gardens, TOEM), graphic
flat games (Night in the Woods, Sable, INSIDE, GRIS, Spiritfarer), Kind Words 1 and 2, Hiroshige's rain print.

**No:**
- every pixel-art game (Coffee Talk, A Space for the Unbound, Unpacking, Spirit City);
- the painted-3D games (Behind the Frame, Dordogne, Wanderstop, Mutazione);
- Firewatch, Old Man's Journey, Venba, Kentucky Route Zero, Paper Trail;
- almost all the photos;
- among the paintings: Van Gogh's café, Caillebotte, Hassam, Hammershøi and Hasui's *Night at Shinkawa*.

**A Short Hike** (unrated), Broden's note: "I really like this maybe with a dagger on top of it? It is like 3d that is
translated into pixel art to give it this sort of vibe. We need to lose the brightness and go for warmth."
(He meant "shader", not "dagger": a shader on top of a 3D scene.)

### What the picks point to

- **Japanese woodblock prints (shin-hanga) are the anchor:**
  - flat layered colour;
  - soft graded skies and water (bokashi);
  - a small palette of deep blues and greens with warm amber light;
  - paper texture.
- **Light against dark is the subject.** Every Love is dusk or night, lit by a few warm windows or lamps, often doubled
  in wet ground or still water. Daytime and grey rain scenes (Caillebotte, Hassam) were rejected.
- **The viewpoint flips.** Four of the five Loves stand outside in the dark looking at warm lit windows (Nighthawks,
  Grimshaw, Yoshida). The brief and all three prototypes were inside looking out.
- **Not literal pixel art or photography.** Both were rejected across the board. The only "pixel" interest is A Short Hike's
  3D-rendered-low-res look, toned warmer.
- **Dioramas are a strong maybe.** A scene as a small object fits "build scenes layer by layer".
- **Too much isn't liked:** Van Gogh's saturated brushwork and Hasui's near-black *Night at Shinkawa* were both
  rejected, so: rich colour, but restrained and readable.

### Confirmed with Broden, 2026-11-09

- **Viewpoint:** inside the café looking out ("I still want it to be inside looking out of a cafe"), even though most
  Loves look in from outside.
- **Rendering:** a 3D scene with a shader on top, as in his A Short Hike note.

## 3D prototype, 2026-11-09

`/proto/cafe3d/` (`src/proto/cafe3d.njk`, `src/assets/js/proto/cafe3d.js`). three.js 0.170 from jsDelivr.

- **Scene:** low-poly café interior with toon shading (three-band gradient):
  - a table with a mug, steam and an open book;
  - a pendant lamp and a plant on the sill;
  - a window with mullions.
- **Outside:**
  - a dusk sky graded darker overhead, and fog for depth;
  - two rows of buildings with lit windows;
  - a café across the street with a vermilion awning;
  - two street lamps, with warm reflections shimmering on the wet road;
  - rain, and a person with a vermilion umbrella walking past.
- **Shader on top:**
  1. Renders the scene at 1/pixel-size resolution.
  2. Snaps each pixel to the nearest of a 16-colour woodblock palette (OKLab distance), with an optional ordered dither between the two nearest.
  3. Draws ink lines where depth jumps.
  4. Adds paper grain and fibres at screen resolution, plus a slight vignette.
- **Sliders:** pixel size, palette strength, dither, ink lines, paper grain, rain, lamp warmth, motion speed. "Copy
  settings" copies the values as text.
- **Starting values:** pixel 3px, palette 100%, dither 20%, ink 60%, grain 50%, rain 60%, warmth 1×.
- Gentle camera drift, and a lean toward the mouse on desktop.
- **Status:** waiting for Broden's reaction and settings.

Dev note: this server's headless Chromium crashes on any `<select>` (no system fonts), so the panel uses buttons.

## Woodblock prototype, 2026-11-09

Broden: "Can we try some other styles closer to the woodblock that are separate from the pixel style we have? Layer it
similarly to the Japanese paintings I liked. Focus on really solid color combinations."

`/proto/woodblock/` (`src/proto/woodblock.njk`, `src/assets/js/proto/woodblock.js`, reuses `cafe-harness.js`).
2D canvas at full resolution (no pixels).

- **Built like a print:** every colour is a flat "block".
  - Each block is printed slightly off-register with its own fixed offset.
  - An ink key block draws the outlines.
  - Sky, street, shoji light and lamplight are graded (bokashi).
  - Paper fibre and horizontal woodgrain sit over everything.
- **Composition:** inside the café, looking through a three-pane wooden window with a kumiko lattice strip.
  - **Outside:** a row of shop fronts with glowing shoji, the café opposite with an awning, banners and swaying
    lanterns.
  - **Behind and above:** far rooftops and a watchtower, a telegraph pole with sagging wires.
  - **The street:** wet and graded, with Yoshida-style broken vertical reflections. Hiroshige-style straight rain, and
    someone crossing under an umbrella.
  - **Inside:** a noren curtain with a crest, a paper lantern, an iron kettle, a cup, and a vase with a blossom branch
    against the glass.
- **One composition, four colour combinations** (picker, keys 1–4):

| Palette | From | Colours |
| --- | --- | --- |
| Indigo night | Yoshida, *Kagurazaka after a night rain* | Prussian blue night, amber shoji light, vermilion |
| Teal dusk | Hasui, *Evening at Ushibori* | teal water and roofs, peach sky, one warm light |
| Moonlit gold | Grimshaw | olive-gold sky, umber walls, gold windows |
| Diner green | Hopper, *Nighthawks* | deep teal night, cream-yellow light, brick-red shop fronts |

- **Sliders:** ink key lines, off-register, paper & woodgrain, rain. Starting values 70%, 40%, 60%, 60%.
- The scene is data-shaped (palette roles such as `skyTop`, `light`, `accent`, `ink` mapped onto shared shapes), which
  is a first step toward composing scenes from layers with a tool.
- **Status:** rejected on quality, 2026-11-09. Broden: "The quality is not the greatest of this. I think svg we will
  struggle with, we need to think of something else to generate these scenes." (It's canvas, not SVG, but the point
  stands: shapes drawn from code can't reach the richness of the prints.)

## Approaches to generating the art (open, 2026-11-09)

Lesson so far: drawing every shape in code (canvas or SVG) caps the quality well below the prints. Better: the art
is made as images, and code only adds what moves.

- **Painted plates plus code-animated layers.** Each scene is a stack of image layers (sky, far, street, interior
  frame...). Code adds rain, flickering lights, rippling reflections, steam and passers-by, with the paper texture on top.
  The "tool" becomes a composer: layer images plus a small JSON file for depth and effects.
- **Where the plates come from:**
  1. An image model (Midjourney, Flux, GPT-image, etc.) prompted for shin-hanga style, then split into layers and
     cleaned up.
  2. Broden paints them himself (e.g. Procreate with woodblock brushes).
  3. Commissioning an illustrator.
  4. Blender with a toon/print look, rendered to layers.
- Public-domain prints (pre-1930 Yoshida, for example) could be test plates for the composer, but not the final scenes.

**Chosen 2026-11-09: an image model.** Broden runs the generator; prompts and the layer spec are in
`scene-art-prompts.md`.

## Image-model round 1, 2026-11-09

Generated on the server through Codex's image tool (see `scene-art-prompts.md`): the step-1 full-scene prompt with
each of the four palette lines, one image each.
- Files are in `~/work/scene-art/round1/` (indigo, teal, gold, green), outside the repo.
- The gallery is at `/proto/art/`.
- **First read:** a big jump in quality over every code-drawn prototype. All four follow the brief (noren, lantern,
  kettle, cup, blossom vase, lattice strip, wet reflective street, café with a vermilion awning). Indigo has the
  strongest woodblock texture. Sizes vary (1774×887 for most; gold came back closer to 3:2).
- **Status:** rejected 2026-11-14. Broden: "I'm really not liking what we are coming up with ... we only have 1 shot.
  We need something we can tweak." Codex is still signed in on the server; `codex logout` undoes it.

## Pixel-art splats (from 2026-11-14)

References:
- https://x.com/samueltates/status/2120840967356059846 (lighthouse, well and mushroom dioramas; the scene scatters
  into splats and flies home)
- https://x.com/junglesilicon/status/2120452158961397975 (a reel of splat dioramas)

Technique as described: little scenes written as code → baked to splats (points) → voxel-snapped → palette-snapped.
Floating island dioramas on a dark background, chunky pixel look, rain as falling pixel streaks, warm glowing lamps.

Why it fits: every part is tweakable (shapes, colours, density, grid size, palette, shader). It sits between the
3D-plus-shader route Broden liked (A Short Hike note) and the diorama Maybes on the moodboard (Gardens Between,
Townscaper, Tiny Glade). The scene file itself becomes the "tool" for composing scenes layer by layer.

### Splat prototype, 2026-11-14

`/proto/splat/` (`src/proto/splat.njk`, `src/assets/js/proto/splat.js`). three.js 0.170 + OrbitControls via an
import map.

- **The scene is code** (`buildScene()`): `box`, `cyl`, `sphere`, `quad`, `stroke` and `arc` helpers, each with a colour
  *role*. Role can be a function of position, for patterns such as lantern ribs, shoji lattice, the noren crest and
  wet patches.
  - **Café corner:** floor, back wall with a lattice-topped window, left wall, counter, stools, kettle, cup, vase with
    a blossom branch, paper lantern, noren, shelf with jars, a plant.
  - **Outside:** a street lamp, shop row with lit shoji, awning and lanterns, taller buildings, a telegraph pole and
    wires, and a wet street with shimmering reflections, all on a floating island.
- **Baking:** surfaces are sampled on a jittered grid at about 1700 splats/m², roughly 260k in total. Lighting (lantern,
  street lamp, shop windows, ambient) is baked into the colours in toon bands, with woodgrain on wood.
- **Shader:** voxel snap in the vertex shader. Splats run from square to round. Each colour snaps to the active
  palette (OKLab) with an ordered dither. The scene renders at 1/pixel size.
- **Extra layers:** soft additive glows, rain as falling pixel streaks, steam that fades by screen-door dither.
- **Tap to scatter:** the scene bursts into its splats and flies home. This also plays once on load.
- **Views:** Diorama (slow auto-orbit, drag to rotate) and Seat (inside looking out, small look-around).
- **Palettes:** the four from the woodblock prototype (keys 1–4).
- **Sliders:** voxel snap 3cm, splat size 1.4×, square↔round 30%, palette snap 100%, dither 30%, pixel size 2px,
  lamp warmth 0.75×, rain 60%.
- **Status:** liked and parked, 2026-11-14 ("This is really nice"). Tagged `proto-splat-cafe-v1`.

## The coffee shop (the real scene, from 2026-11-14)

Broden's brief, in his words: "a modern coffee shop where I am in a corner table and I can see the window from a few
meters away and there is a bar stool section on the window and people coming and sitting there occasionally. The cafe
is warmly lit and it contrasts with the coldness outside. Part of what I want is the animation of the scene with people
occasionally walking into view, people going to sit down at the bar stools with coffees etc."

What that means for the build:
- **Viewpoint:** seated at a corner table, a few metres from a big modern window, looking at it on a diagonal.
- **At the window:** a bar counter with stools.
- **Light:** warm inside (pendants, wood), cold outside (blue-grey street, cool street lights, drizzle).
- **People inside:** they come in carrying coffees, sit at free stools, sip, and later leave.
- **People outside:** they walk past, some under umbrellas.
- **Technique:** the same as the splat café (scene as code → splats → voxel and palette snap), plus animated people
  built from splat body parts.

### First build, 2026-11-14

`/proto/coffee/` (`src/proto/coffee.njk`, `src/assets/js/proto/coffee.js`).

- **Room:** about 6.8 × 6 m.
  - **Window wall:** floor-to-ceiling glass with black steel mullions, and a wood bar along it with five stools and
    three pendant lights.
  - **Left wall:** a doorway to the (off-screen) counter, a menu board, and a shelf of cups. A tall plant stands in the
    window corner.
  - **Tables:** a middle table where someone works on a laptop, and my corner table in the foreground with a
    steaming cup.
- **Outside:**
  - wet street, kerbs, cold street lamps and their shimmering reflections, bare trees;
  - a row of buildings with cold and warm windows, a bakery and a corner store;
  - a distant skyline, drizzle.
- **Splat density follows distance from the seat:** surfaces are tiled, and each tile's density is 900/m² × (4 m ÷
  distance)², with a per-splat size to match. Splats then land at an even size on screen, using about 300k splats where
  a uniform density needed about 530k. People use a fixed density.
- **Light:** baked per side of the glass. Inside gets warm pendants, a doorway glow and a warm fill. Outside gets cold
  ambient, street lamps and shop windows, and inside light doesn't leak out. "Warmth inside" and "Cold outside" re-bake
  it.
- **People:** rigs of splat parts (torso, head with hair, arms, two-part legs, shoes; optional cup or umbrella).
  Poses: walk cycle, sit, sip. Inside people are tinted warm and outside people cold.
  - **Customers:** come in through the doorway with a coffee, walk to a free stool, turn to the window and sit, sip
    now and then, stay 25–65 s, then leave the way they came. At most four sit at once, and two are already seated when
    the page loads.
  - **Outside:** walkers on both pavements, most with umbrellas.
  - **Cars:** pass both ways with headlights and tail lights.
- **Views:** "Corner table" (the intended view, small look-around) and "Diorama" (orbit; ceiling and right wall cut
  away). Tap to scatter.
- **Sliders:** voxel snap 2cm, splat size 1.7×, square↔round 35%, palette snap 100%, dither 12%, pixel 2px, warmth
  1×, cold 1×, rain 60%, how busy 1×, time speed 1×.
- **Status:** first look sent to Broden. The corner-table view still reads rough up close (blotchy ceiling, dark
  foreground shapes). On the server it renders at about 0.5–0.7 s per frame in software; it hasn't been measured on a
  real GPU or phone yet.

- **Status:** liked as a style but not the one imagined (2026-11-14). It stays at `/proto/coffee/`.

## The coffee shop in low poly (from 2026-11-14)

Broden: "What I imagine is the cafe scene I described but in low poly ... layer everything properly so that the scene
comes to life with animations."

`/proto/lowpoly/` (`src/proto/lowpoly.njk`). The code is split one module per layer in
`src/assets/js/proto/lowpoly/`:

| Module | Holds |
| --- | --- |
| `palette.js` | every colour by name, and cached flat-shaded materials |
| `build.js` | `Builder`: box, cyl, cone, ico, plane, tube into named layers; `jitter` for hand-made shapes; `merge(layer)` merges a layer by material (about 45 top-level objects in total) |
| `layout.js` | the scene description: constants (window wall, stools, pendants, door, seat camera) and one function per layer: room, bar, window, furniture, props, cutaway, outsideNear, outsideFar |
| `lights.js` | warm lights (three pendant spots with shadows plus spill, room fill, doorway glow, corner) and cold lights (sky, street lamps, shop windows, moon); dials scale each group |
| `people.js` | low-poly person rig (hips, shoulders, knees; optional cup or umbrella), poses (walk, sit, sip), cars |
| `life.js` | behaviour: customers enter → stool → sit and sip → leave; walkers outside; cars; the laptop person |
| `effects.js` | rain (shader-animated lines), glass pane with drops sliding down a canvas texture, steam, post-processing (bloom → ACES tone mapping → grain, vignette, optional pixelation) |
| `main.js` | renderer, fog, views (corner table / diorama with cutaway hidden), panel, loop |

- **Look:** flat shading, ACES tone mapping, soft spotlight shadows under the pendants, bloom on bulbs and lit
  windows, cold fog outside.
- **Sliders:** warmth inside, cold outside, rain, how busy, time speed, glow, fog, pixel size, grain; shadows on/off.
- **Speed:** on the server it renders at about 0.2–0.4 s per frame in software. It hasn't been measured on a real GPU
  or phone.
- **Status:** first look sent to Broden.

- **Status:** Broden wants to tune the people first (2026-11-14).

## People (from 2026-11-14)

Broden: "create a common person 3d model that we can then layer with color or clothes but they will all have the same
distinct shape ... long thin legs and then I want their torso almost like a triangle with proportionate arms. We then
need to be able to setup a way to animate them easily." Then: "I don't mean triangle torso literally. Let's nail the
person with just coloured mesh and we can then do layering of clothing later."

- **`lowpoly/person.js`:** one shared body, `createPerson(colors, body)`. Proportions live in `BODY` (leg length and
  thickness, torso height, shoulder and waist width, torso depth, arm length and thickness, head size).
  - **Shape:** long thin legs (hips at 0.98 m), a six-sided torso tapering from 0.42 m shoulders to a 0.24 m waist,
    jointed arms, a low-poly head with a hair cap.
  - **Colour slots:** skin, hair, top, bottom, shoes. `paint(slot, colour)` recolours without rebuilding.
  - **Props:** a cup and an umbrella hang off the right hand (`show(name)`); the animator keeps them upright.
  - **Joints:** hips → spine → neck → head; shoulders → elbows → hands; hips → knees.
- **`lowpoly/anim.js`:** a pose is `{ joint: [rx, ry, rz], hipsY }`, and a clip is key poses on a timeline (eased).
  - **Animator layers:** `base` (whole body), `arms` and `head`. Each overlay only touches its joints. Every change
    crossfades from the pose currently on screen. One-shots can chain: `play("arms", "sip", { then: "holdCup" })`.
  - **Base clips:** idle, walk, sitStool, sitChair, sitDownStool, standUpStool.
  - **Arm clips:** holdCup, sip, umbrella, type, pocket, wave.
  - **Head clips:** lookAround, lookOutside.
  - Sitting poses are built from leg length, so they still land on the seat when proportions change.
- **Character lab:** `/proto/people/` (`lowpoly/lab.js`). Five people with body sliders, and buttons for every clip
  and layer. Views: front, side or turning. Speed control, shuffle colours, and "Copy body" (JSON to paste into
  `BODY`).
- **Feedback 2026-11-14:** "Too uniform a model. And the head is round, I want a long rectangular head."
  - **Head:** now a long rectangular block (`headW` 0.15, `headH` 0.27, `headD` 0.17), narrower at the jaw
    (`jaw` 0.86), with blocky hair over the top and back.
  - **Variety:** `varyBody(base, amount, rand)` gives each person their own height (±12%), build (±22%), waist, limb
    thickness, head size and shape, a slight posture (spine lean, head tilt; the animator adds it on top of every
    pose) and walking pace (±10%). The lab has a "Variety between people" slider (default 85%) and "New people" to
    reroll. Each slot keeps its own seed, so body sliders reshape everyone without reshuffling who is who.
- **Not yet:** clothing layers (later, by Broden's call). The café's `life.js` still uses the older `people.js` rig;
  it switches to `person.js` + `Animator` once the body is settled.

## Next

1. Broden tunes the body in the character lab.
2. Switch the café to the shared person model and animator.
2. Pick the look, then generate clean outside and inside plates.
3. Build the composer: plates plus code-animated effects.
2. Then design how scenes are built layer by layer, and the tool for composing them.
- Should scenes change with the time of day, or rotate?
- What should the scene-building tool be: a data format for layers, a visual editor, or both?
