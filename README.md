# EduZar

A free educational platform that aggregates thousands of hand-curated YouTube courses and tutorials — learn anything, anytime, with no sign-up required.

## Features

- **Course catalog** — search, category, level filter and sort that all combine; the filtered view lives in the URL so it can be bookmarked or shared
- **Resume where you left off** — watch progress is saved through the YouTube IFrame API; cards show a progress bar and courses resume at the right timestamp
- **Continue Learning** — the homepage shows courses you've started but not finished
- **Completion tracking** — mark courses complete from the player (auto-completes at 90% watched); progress flows into learning paths
- **Learning paths** — ordered multi-course tracks with an "Up next" marker and a free downloadable certificate
- **Shareable links** — `courses.html?watch=VIDEO_ID` opens a course directly; `paths.html?path=PATH_ID` opens a path
- **Favorites**, dark mode (follows system preference), data-saver thumbnails, keyboard shortcut `/` to search
- **Progressive Web App** — installable; network-first service worker so updates ship immediately and pages still work offline
- **Responsive design** — works across desktop and mobile

All progress is stored in the browser (localStorage) — no accounts, no server.

## Tech stack

- HTML5, CSS3, vanilla JavaScript (no framework/build step)
- Data-driven rendering — courses and learning paths are defined once in `courses-data.js` / `learning-paths-data.js` and rendered into both the homepage and full course grid
- Service worker + Web App Manifest for PWA support

## Project structure

```
index.html                 # homepage
courses.html                # full course catalog
paths.html                  # learning paths
courses-data.js              # single source of truth for all courses
learning-paths-data.js       # learning path definitions
main.js                      # rendering, filtering, and UI logic
styles.css                   # site styling
manifest.json                 # PWA manifest
service-worker.js            # offline caching
images-eduzar/                # logos and assets
```

## Running locally

No build step required — it's a static site.

```bash
py -3 -m http.server
```

Then open `http://localhost:8000` in your browser.

## Adding a course

Add a new entry to the `EDUZAR_COURSES` array in `courses-data.js` — it will automatically appear in both the homepage (if `featured: true`) and the full course catalog.

**Verify the video first.** Open `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=VIDEO_ID&format=json` — if it says "Not Found" the video is gone. Copy the real title and channel from that response, and set `duration` in hours from the actual video length. (In Oct 2026, 8 of the original 32 IDs were dead and several pointed at unrelated videos.)
