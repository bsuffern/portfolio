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

## Next

1. Broden generates full-scene explorations (step 1 in `scene-art-prompts.md`) and shares the ones he likes.
2. Pick the look, then generate clean outside and inside plates.
3. Build the composer: plates plus code-animated effects.
2. Then design how scenes are built layer by layer, and the tool for composing them.
- Should scenes change with the time of day, or rotate?
- What should the scene-building tool be: a data format for layers, a visual editor, or both?
