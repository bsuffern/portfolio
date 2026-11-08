// Adds Bandcamp tracks to the site's playlist.
//
//   npm run add-track -- https://artist.bandcamp.com/track/name [more urls...]
//
// Bandcamp blocks plain HTTP clients, so this reads each track page in headless
// Chromium (needs `npx playwright install chromium` once).
import { readFile, writeFile } from "node:fs/promises";

const PLAYLIST = new URL("../src/_data/playlist.json", import.meta.url);
const urls = process.argv.slice(2);
if (!urls.length) {
  console.error("Usage: npm run add-track -- <bandcamp track url> [...]");
  process.exit(1);
}

const { chromium } = await import("playwright");
const playlist = JSON.parse(await readFile(PLAYLIST, "utf8"));
const browser = await chromium.launch();
const page = await browser.newPage();

for (const url of urls) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('meta[property="og:video"]', { state: "attached", timeout: 20000 });
  const meta = await page.evaluate(() => {
    const og = (p) => document.querySelector(`meta[property="og:${p}"]`)?.content ?? "";
    const tralbum = JSON.parse(document.querySelector("script[data-tralbum]")?.dataset.tralbum ?? "{}");
    return { video: og("video"), image: og("image"), title: og("title"), tralbum };
  });

  const track = meta.video.match(/track=(\d+)/)?.[1];
  if (!track) throw new Error(`No track id found for ${url}. Is it a /track/ page?`);
  const [ogTitle, ogArtist] = meta.title.split(", by ");
  const entry = {
    title: meta.tralbum.current?.title ?? ogTitle,
    artist: meta.tralbum.artist ?? ogArtist,
    url: url.split("?")[0],
    track,
    // _7 is Bandcamp's 150px square size.
    art: meta.image.replace(/_\d+\.jpg$/, "_7.jpg"),
  };

  const existing = playlist.findIndex((t) => t.track === track);
  if (existing === -1) playlist.push(entry);
  else playlist[existing] = entry;
  console.log(`${existing === -1 ? "Added" : "Updated"}: ${entry.title} by ${entry.artist}`);
}

await browser.close();
await writeFile(PLAYLIST, JSON.stringify(playlist, null, 2) + "\n");
