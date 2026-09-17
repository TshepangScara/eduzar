# EduZar

A free educational platform that aggregates thousands of hand-curated YouTube courses and tutorials — learn anything, anytime, with no sign-up required.

## Features

- **Course catalog** — browsable/searchable courses across categories (programming, design, data, marketing, business, language, music) with filters by level and tags
- **Learning paths** — structured, multi-course tracks for guided learning
- **Featured courses** — curated highlights on the homepage
- **Progressive Web App** — installable, with an offline-capable service worker
- **Responsive design** — works across desktop and mobile

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
