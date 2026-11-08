// Bottom-right music controller wrapping Bandcamp's embedded player.
// Bandcamp's iframe has no JS API: we choose what loads into it (shuffled), and
// playback itself happens on the iframe's own play button.
(() => {
  const root = document.getElementById("player");
  if (!root) return;

  const tracks = JSON.parse(document.getElementById("playlist-data").textContent);
  const embed = document.getElementById("player-embed");
  const list = document.getElementById("player-list");
  const toggle = document.getElementById("player-toggle");
  const next = document.getElementById("player-next");
  const KEY = "player:track";

  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  let queue = [];
  let current = null;

  const store = (fn) => { try { return fn(sessionStorage); } catch { return null; } };

  function embedUrl(track) {
    const dark = matchMedia("(prefers-color-scheme: dark)").matches;
    const bg = dark ? "2b2826" : "ffffff";
    const link = dark ? "e8a27c" : "c4541f";
    return `https://bandcamp.com/EmbeddedPlayer/track=${track}/size=small/bgcol=${bg}/linkcol=${link}/transparent=true/`;
  }

  function markCurrent() {
    document.querySelectorAll("[data-play-track]").forEach((b) => {
      if (b.dataset.playTrack === current?.track) b.setAttribute("aria-current", "true");
      else b.removeAttribute("aria-current");
    });
  }

  function load(track) {
    current = track;
    queue = queue.filter((t) => t.track !== track.track);
    store((s) => s.setItem(KEY, track.track));
    let frame = embed.querySelector("iframe");
    if (!frame) {
      frame = document.createElement("iframe");
      frame.setAttribute("seamless", "");
      embed.append(frame);
    }
    frame.title = `${track.title} by ${track.artist} on Bandcamp`;
    frame.src = embedUrl(track.track);
    const title = document.getElementById("player-title");
    title.textContent = track.title;
    title.href = track.url;
    title.title = "Open on Bandcamp";
    document.getElementById("player-artist").textContent = track.artist;
    markCurrent();
  }

  function playNext() {
    if (!queue.length) queue = shuffle(tracks.filter((t) => t.track !== current?.track));
    if (queue.length) load(queue[0]);
  }

  function setOpen(open) {
    list.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Hide playlist" : "Show playlist");
  }

  toggle.addEventListener("click", () => setOpen(list.hidden));
  next.addEventListener("click", playNext);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !list.hidden) { setOpen(false); toggle.focus(); }
  });
  document.addEventListener("pointerdown", (e) => {
    if (!list.hidden && !root.contains(e.target)) setOpen(false);
  });
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-play-track]");
    if (!btn) return;
    const t = tracks.find((x) => x.track === btn.dataset.playTrack);
    if (t) load(t);
  });

  queue = shuffle(tracks);
  const saved = store((s) => s.getItem(KEY));
  const start = tracks.find((t) => t.track === saved) ?? queue[0];
  // Let the page render first; the embed is third-party.
  (window.requestIdleCallback ?? ((f) => setTimeout(f, 200)))(() => load(start));

  window.player = { markCurrent };
})();
