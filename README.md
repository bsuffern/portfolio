# Portfolio v2

Static site built with [Eleventy](https://www.11ty.dev/). It will be deployed to Cloudflare with Wrangler (not set up yet).

```sh
npm install
npm run dev     # http://localhost:8080
npm run build   # outputs _site/
```

## Content

- **Writing:** a folder per post in `src/writing/<slug>/index.md`, with images beside it. The feed is at `/writing/feed.xml`.
- **Projects:** `src/_data/projects.json`.
- **Inspiration:** `src/_data/inspiration.json`. It has `books`, `music`, `photographs` and `games` lists; each entry is
  `{ "title", "by", "year"?, "note"?, "href"?, "image"? }`.
- **Playlist:** `src/_data/playlist.json`, used by the player in the bottom-right corner. To add tracks:
  `npm run add-track -- https://artist.bandcamp.com/track/name` (needs `npx playwright install chromium` once).

## The player

Bandcamp's embed has no JavaScript API, so the controller decides which track goes into the embed (shuffled, with a
playlist panel), and playback starts from the embed's own play button. Page links are handled by
[swup](https://swup.js.org/), which swaps only `<main>`, so music keeps playing while you browse.
