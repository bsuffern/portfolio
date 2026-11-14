# Decisions

Newest first. Each entry: what was decided, what was rejected, and why.

## 2026-11-14: The coffee shop in low poly, built in layers

- **Decided:** keep the coffee-shop brief, but render it as low-poly 3D (flat-shaded, faceted geometry, real-time
  lights) instead of splats. Organise it in layers, both in the scene (room, bar, furniture, props, cutaway, near and
  far outside, people, cars, rain, glass, post-processing) and in the code (one module each).
- **Rejected:** splats for this scene. Broden: "While I love the Gaussian splat style it's not the style I imagined.
  What I imagine is the cafe scene I described but in low poly." The splat coffee shop stays at `/proto/coffee/`.

## 2026-11-14: Park the splat café; build the real scene, a modern coffee shop

- **Decided:** keep the splat café as a reference ("This is really nice ... keep this somewhere and park it"). It stays
  at `/proto/splat/`, is tagged `proto-splat-cafe-v1`, and is listed on the `/proto/` index. Prototypes are now
  left out of production builds (`eleventy.config.js`).
- **Decided:** the scene for the site is a modern coffee shop, built with the same splat technique. Brief in
  `research/scene.md` ("The coffee shop").

## 2026-11-14: Try scenes written as code and baked to pixel-art splats

- **Decided:** explore composing scenes in code from simple 3D shapes, sampled into coloured points ("splats"),
  snapped to a voxel grid and a palette, with a shader on top. Everything can be tweaked with live dials.
- **Rejected:** image-model art as the source of scenes. Broden: "I'm really not liking what we are coming up with ...
  it most likely won't match and we only have 1 shot. We need something we can tweak."
- **Inspiration:** two X posts (2026-11-11/12). @JungleSilicon: "fable 5.2 is *sooo* good at making pixel art gaussian
  splats". @Samueltates: "little scenes written as code, baked to splats, voxel-snapped to a palette. the lighthouse
  scatters into its splats and flies home." Both show small floating dioramas (lighthouse, mushroom, well, anchor)
  in a pixel-art splat style.
- **Model:** Broden mentioned Fable 5.2 being good at this; trying it on the current model first.

## 2026-11-09: Stop drawing scenes in code

- **Rejected:** generating the scene art procedurally (canvas/SVG shapes), after the woodblock prototype.
- **Why:** Broden: "The quality is not the greatest of this ... we need to think of something else to generate these
  scenes."
- **Kept:** the effects code (rain, reflections, light flicker, paper texture), the four palettes as colour references,
  and the role-based palette idea.
- **Next:** choose where the art comes from; see `research/scene.md`.

## 2026-11-09: Scene art comes from an image model, animated by code

- **Decided:** generate the scene art with an image model, as two still plates (outside street, inside window frame).
  Code animates rain, lights, reflections, steam and passers-by between and over them.
- **Rejected:** Broden painting the plates, commissioning an illustrator, rendering in Blender.
- **Why:** the fastest way to explore many scenes at print quality. Broden chose it when given the four options.

## 2026-11-09: Inside looking out; a 3D scene with a stylising shader on top

- **Decided:** the viewer sits inside the café looking out, as in the original brief. Scenes are built as small 3D
  scenes, and a post-process shader turns them into the look: A Short Hike's "3D translated into pixel art" route,
  but warm and in woodblock-print colours.
- **Rejected:** outside looking in (four of the five moodboard Loves are framed that way, but Broden: "I still want it
  to be inside looking out of a cafe"); drawing scenes as flat 2D layers.
- **Why:** Broden's note on A Short Hike: "It is like 3d that is translated into pixel art ... maybe with a shader on
  top of it ... We need to lose the brightness and go for warmth." (The moodboard note said "dagger"; he meant
  "shader".) Building scenes from 3D parts also suits composing them layer by layer with a tool later.

## 2026-11-09: Japanese woodblock prints anchor the aesthetic

- **Decided:** the scene style starts from Japanese prints (Hasui, Yoshida): flat layered colour, graded skies and
  water, a small palette of night blues with warm lamplight. Grimshaw and Hopper add the motif of lit windows against
  the dark.
- **Rejected:** literal pixel art, photography, painted-3D game looks, saturated brushwork (Van Gogh), grey
  daytime rain (Caillebotte, Hassam).
- **Why:** the moodboard. All five Loves were paintings or prints; Broden: "I particularly love the Japanese paintings
  for their style and use of colors, it makes for beautiful scenes." Details in `research/scene.md`.
- **Still open:** viewpoint (outside looking in?) and rendering route (2D layered print or low-res 3D diorama).

## 2026-11-09: Find the aesthetic from references before building more scenes

- **Decided:** stop iterating on prototypes and gather visual references (games, paintings, prints, photography)
  for Broden to react to first. Published as a moodboard; see `research/scene.md`.
- **Why:** the prototypes showed that the vision is hard to describe in words. In Broden's words: "it's hard to
  explain exactly what I want, so the best thing ... is for you to find examples of scenes ... so we can start to
  hone in on an aesthetic we like."
- **Also agreed in principle:** scenes should be built layer by layer, eventually with a tool for composing them.
  Not started; it waits on the aesthetic.

## 2026-11-09: None of the three prototype styles as-is

- **Rejected:** Pixel, Paper and Fogged glass renderings of the rainy café (`/proto/cafe/`).
- **Why:** "Aesthetically the paper one is the best, but [it] is nowhere near the scene that I am envisioning."
- **Kept:** Paper is the closest on look, so treat it as the baseline to beat.

## 2026-11-09: One consistent style across all scenes

- **Decided:** every scene will share one locked style (how it's drawn, palette rules, framing, motion, interaction),
  so the site feels like one place.
- **Still open:** which style. See `research/scene.md`.

## 2026-11-09: The centrepiece is a music scene, starting with a rainy café

- **Decided:** the homepage centrepiece is "a place you sit while listening": ambient scenes that invite visitors
  to stay a moment and find some peace, built around the site's persistent music player. First scene: the warmth
  of a café on a rainy day, the contrast between inside and outside.
- **Rejected:** a southern night sky (projects as stars), a desk/shelf of objects, decoding ciphertext text.
- **Why:** Broden loves music and "aesthetic scenes where the music hits right"; the player that keeps playing across
  pages is already the site's most distinctive feature. Inspired by the koi pond on shwn.design: alive, calm,
  optional to interact with, and personal.
