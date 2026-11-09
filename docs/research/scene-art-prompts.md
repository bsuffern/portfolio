# Scene art: prompts and layer spec

Decided 2026-11-09: the scene art comes from an image model, and code animates it. Broden runs the generator; Claude
writes prompts, splits the results into layers and builds the composer. See `scene.md` for the background.

## How it fits together

The page stacks two image plates, and code fills in everything that moves:

1. **Outside plate:** the street seen through the window. It sits behind everything and drifts a little for depth.
2. **Code:** rain, light flicker in the shoji and lanterns, shimmer on the reflections, someone walking past.
3. **Inside plate:** the café window frame, counter and props, with the glass area cut out.
4. **Code:** lantern glow, steam from the cup, paper texture over everything.

Because rain and people are added by code, the plates should be **still**: no falling rain and no people. A wet street
with reflections is good.

## Step 1: find the look (full scenes)

Generate whole scenes first, inside looking out, to find the look before making clean plates. Aim for 10–20 images
and keep the ones you love, even partly.

> Shin-hanga Japanese woodblock print in the style of Kawase Hasui and Hiroshi Yoshida. View from inside a small dim
> wooden café at night, looking out through a large three-pane window with a lattice strip at the top. On the wooden
> counter in the foreground: an iron kettle, a cup of coffee, a small vase with a blossoming branch. A paper lantern
> hangs at top right, an indigo noren curtain at top left. Through the window: a narrow street of two-storey wooden
> shop fronts after rain, warm amber light glowing through paper shoji screens, hanging lanterns, a café opposite with
> a vermilion awning, a telegraph pole and sagging wires, wet street with long broken reflections. Deep Prussian-blue
> sky graded lighter toward the horizon. Flat areas of colour, crisp black key-block outlines, visible woodgrain and
> washi paper texture, limited palette. No people, no text, no signature, no border.

Swap the colour line to try the four palettes from the woodblock prototype:

| Palette | Replace "Deep Prussian-blue sky..." with |
| --- | --- |
| Indigo night | Deep Prussian-blue night sky graded lighter at the horizon; amber, vermilion and cream accents |
| Teal dusk | Dusk sky graded from teal to soft peach; teal roofs and water; one warm amber light |
| Moonlit gold | Moonlit olive-gold sky; umber walls; glowing gold windows |
| Diner green | Deep teal night; cream-yellow light; brick-red shop fronts |

**Midjourney:** add `--ar 16:10 --style raw`, and point a style reference at a public-domain print:
- `--sref https://commons.wikimedia.org/wiki/Special:FilePath/Kagurazaka_Street_at_Night_after_Rain,_from_the_Series_%22Twelve_Scenes_of_Tokyo%22._Hiroshi_Yoshida.jpg`
- or Hasui's Ushibori: `--sref https://commons.wikimedia.org/wiki/Special:FilePath/Kawase_Hasui_(1930s)_Evening_of_Ushibori.jpg`

**GPT-image / Flux / others:** use the prompt as is, landscape 16:10 (or 3:2), at the largest size available.

## Step 2: clean plates for the chosen look

Once a look is chosen, generate the two plates separately, with the same palette line and style reference.

**Outside plate:**

> Shin-hanga Japanese woodblock print in the style of Kawase Hasui and Hiroshi Yoshida. A narrow street of two-storey
> wooden shop fronts at night just after rain, seen straight-on from across the street at eye level. Warm amber light
> through paper shoji screens on the ground floors, a few lit upper windows, hanging paper lanterns, cloth shop
> banners, a café opposite with a vermilion awning. Wet street in the foreground with long broken vertical reflections.
> Telegraph pole and sagging wires against a deep Prussian-blue sky graded lighter toward the horizon. No rain falling,
> no people. Flat colour, black key-block outlines, woodgrain and washi paper texture. No text, no border.

**Inside plate:**

> Shin-hanga Japanese woodblock print. View from inside a small dim wooden café at night toward a large three-pane
> window with a lattice strip at the top. Wooden counter in the foreground with an iron kettle, a cup of coffee, and a
> small vase with a blossoming branch on the windowsill. A paper lantern at top right gives warm light; an indigo noren
> curtain hangs at top left. The window glass is flat solid bright green (#00FF00) with nothing visible through it.
> Warm umber wood, amber lantern light, indigo cloth. Flat colour, black key-block outlines, woodgrain and paper
> texture. No people, no text, no border.

If the model won't leave the glass plain green, that's fine: Claude can mask the window by hand.

## Getting the images to Claude

Either of these works:
- Upload the PNGs (originals, full size) on the GitHub app to `art/incoming/` on the `v2` branch.
- Or share a folder link (Google Drive, Dropbox) that can be opened without signing in.

Keep the prompt and settings for any image you like: they go in this file so the look can be reproduced.

## Kept prompts and seeds

_(Add the prompts behind chosen images here.)_
