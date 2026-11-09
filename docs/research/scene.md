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
- **Status:** waiting for Broden's picks.

## Next

1. Read the moodboard picks, look for patterns across the Loves (drawing style, palette, framing, texture), and write
   a style direction here.
2. Prototype one scene in that direction.
3. Then design how scenes are built layer by layer, and the tool for composing them.

## Open questions

- Is the camera always inside looking out, or can scenes be outdoors too?
- Should scenes change with the time of day, or rotate?
- What should the scene-building tool be: a data format for layers, a visual editor, or both?
