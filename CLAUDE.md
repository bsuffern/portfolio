# Portfolio

Broden's personal site: Eleventy 3, plain CSS and JS, deployed to Cloudflare later. `README.md` covers commands and
where content lives. v2 work happens on the `v2` branch.

## Keep the thinking in `docs/`

Conversations end, but the reasoning behind this site should not. Anything we learn or decide that the code doesn't
show goes into Markdown under `docs/` (outside `src/`, so Eleventy never publishes it). Update the notes in the same
session as the work, and commit them with it.

- `docs/decisions.md` is a dated log, newest first. Add an entry whenever a direction is chosen *or rejected*: what we
  chose, the options we didn't, and why. The rejections save the most time later.
- `docs/research/<topic>.md` holds research and exploration: references, prototypes and what the owner said about
  them, open questions. One file per topic; add to it rather than starting a new one.
- `docs/README.md` is the index. Add a line for every new file.

What to write down:
- The owner's own words when they react to something ("aesthetically the best, but nowhere near what I'm
  envisioning"). Paraphrase loses the signal.
- Links to anything outside the repo: artifacts, moodboards, references, tools. Say what each one is and its status.
- Prototype results: what was built, where it lives, what worked, what didn't.
- Open questions and the next step, so the next session can pick up without asking.

How to write it:
- Absolute dates (2026-11-09), never "yesterday" or "last week".
- Short and plain. Headings and lists over long paragraphs; no filler.
- Correct or delete notes that turn out wrong instead of letting them contradict newer ones.
- No secrets, tokens or private details in `docs/`: the repo is pushed to GitHub.

## Prototypes

Exploration code lives in its own throwaway place (currently `src/proto/` and `src/assets/js/proto/`) and nothing
in the real site imports it. When a direction is picked, record it in `docs/decisions.md`, build it properly into the
site, then delete the prototype.
