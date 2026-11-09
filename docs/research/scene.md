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
("dagger" is probably "dither"; to confirm.)

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

## Next

1. Confirm with Broden: viewpoint (outside looking in, as the picks suggest?) and the A Short Hike note.
2. Prototype the rainy café as a woodblock-print scene.
3. Then design how scenes are built layer by layer, and the tool for composing them.

## Open questions

- Outside looking in (as the Loves suggest), inside looking out (the original brief), or both across scenes?
- Rendering route: 2D layered print (flat shapes, bokashi gradients, paper grain) or a small 3D diorama rendered
  low-res and quantised to a print palette (the A Short Hike note)?
- Should scenes change with the time of day, or rotate?
- What should the scene-building tool be: a data format for layers, a visual editor, or both?
