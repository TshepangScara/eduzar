// Always start at the top of the page on load — unless the URL points at a
// specific section (e.g. index.html#about linked from another page).
if (history.scrollRestoration) history.scrollRestoration = "manual";
if (!location.hash) window.scrollTo(0, 0);

// ── Storage helpers ────────────────────────────────────────
// localStorage can throw (private mode, blocked storage), so every access goes
// through these and the site keeps working, just without remembering things.
function readJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
}
function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}
function readString(key) {
    try { return localStorage.getItem(key); } catch { return null; }
}
function writeString(key, value) {
    try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
}

function setUrlParam(key, value) {
    const url = new URL(location.href);
    if (value == null || value === "") url.searchParams.delete(key);
    else url.searchParams.set(key, value);
    history.replaceState(history.state, "", url);
}

function courseById(id) {
    return typeof EDUZAR_COURSES !== "undefined" ? EDUZAR_COURSES.find(c => c.id === id) : undefined;
}

// Every word in the query must appear somewhere in the course's searchable text,
// so "python beginner" or "excel kevin" narrow results instead of failing.
function courseMatchesQuery(course, query) {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.length) return true;
    const haystack = [
        course.title, course.channel, course.tags, course.level,
        (typeof EDUZAR_CATEGORY_LABELS !== "undefined" && EDUZAR_CATEGORY_LABELS[course.category]) || course.category
    ].join(" ").toLowerCase();
    return tokens.every(t => haystack.includes(t));
}

// Data is expensive — when the browser's data saver is on, load ~10 KB
// thumbnails instead of full-HD ones.
const THUMB_QUALITY = navigator.connection?.saveData ? "mqdefault" : "maxresdefault";

// YouTube has no maxresdefault.jpg for some uploads and serves a 120×90 grey
// placeholder instead — swap to hqdefault, which always exists.
function fixThumbnail(e) {
    const img = e.target;
    if (img.tagName !== "IMG" || !img.src.includes("/maxresdefault.jpg")) return;
    if (e.type === "error" || img.naturalWidth <= 120) img.src = img.src.replace("maxresdefault", "hqdefault");
}
document.addEventListener("load", fixThumbnail, true);
document.addEventListener("error", fixThumbnail, true);

function showToast(message) {
    let toast = document.getElementById("eduzar-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "eduzar-toast";
        toast.setAttribute("role", "status");
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => toast.classList.remove("show"), 2600);
}

// ── Modal layers ───────────────────────────────────────────
// Modals can stack (a video opened from a path, a certificate on top of that),
// so Escape closes only the topmost one and the page stays scroll-locked until
// every layer is closed.
const layers = [];

function registerLayer(el, close) { layers.push({ el, close }); }

function syncScrollLock() {
    const anyOpen = layers.some(l => l.el.classList.contains("active")) ||
        document.getElementById("navbar")?.classList.contains("active");
    document.body.style.overflow = anyOpen ? "hidden" : "";
}

function showLayer(el, focusTarget) {
    if (!el.classList.contains("active")) el._returnFocus = document.activeElement;
    el.classList.add("active");
    el.setAttribute("aria-hidden", "false");
    syncScrollLock();
    focusTarget?.focus({ preventScroll: true });
}

function hideLayer(el) {
    el.classList.remove("active");
    el.setAttribute("aria-hidden", "true");
    syncScrollLock();
    el._returnFocus?.focus?.({ preventScroll: true });
    el._returnFocus = null;
}

document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const zIndex = (el) => parseInt(getComputedStyle(el).zIndex, 10) || 0;
    const top = layers
        .filter(l => l.el.classList.contains("active"))
        .sort((a, b) => zIndex(b.el) - zIndex(a.el))[0];
    if (top) { e.preventDefault(); top.close(); }
});

// ── Favorites (localStorage, shared across pages) ──────────
const FAVORITES_KEY = "eduzar-favorites";

// Reassigned on the courses page so favoriting re-applies the active filters
let applyCourseFilters = () => {};

function getFavorites() { return new Set(readJSON(FAVORITES_KEY, [])); }
function isFavorite(id) { return getFavorites().has(id); }

function toggleFavorite(id) {
    const favorites = getFavorites();
    const nowActive = !favorites.has(id);
    nowActive ? favorites.add(id) : favorites.delete(id);
    writeJSON(FAVORITES_KEY, [...favorites]);

    document.querySelectorAll(`[data-favorite-id="${id}"]`).forEach((btn) => {
        btn.classList.toggle("active", nowActive);
        btn.setAttribute("aria-label", nowActive ? "Remove from favorites" : "Save to favorites");
        const icon = btn.querySelector("i");
        if (icon) icon.className = nowActive ? "ri-heart-fill" : "ri-heart-line";
    });
    document.querySelectorAll(`[data-id="${id}"]`).forEach((card) => {
        card.dataset.favorite = nowActive ? "true" : "false";
    });

    showToast(nowActive ? "Added to favorites" : "Removed from favorites");
    updateFavoritesBadge();
    applyCourseFilters();
}

function updateFavoritesBadge() {
    const btn = document.querySelector('.filter-btn[data-category="favorites"]');
    if (!btn) return;
    const count = getFavorites().size;
    let badge = btn.querySelector(".filter-count");
    if (!badge) {
        badge = document.createElement("span");
        badge.className = "filter-count";
        btn.appendChild(badge);
    }
    badge.textContent = count;
    badge.style.display = count > 0 ? "" : "none";
}

// ── Completed courses (localStorage, shared across pages) ──
const COMPLETED_KEY = "eduzar-completed-courses";
const LEARNER_NAME_KEY = "eduzar-learner-name";

function getCompleted() { return new Set(readJSON(COMPLETED_KEY, [])); }
function isCompleted(id) { return getCompleted().has(id); }

// Fires "eduzar:completed" so cards, the video modal and path progress all
// update no matter where the course was marked complete.
function setCompleted(id, done, { silent = false } = {}) {
    const completed = getCompleted();
    if (completed.has(id) === done) return done;
    done ? completed.add(id) : completed.delete(id);
    writeJSON(COMPLETED_KEY, [...completed]);
    if (!silent) showToast(done ? "Marked complete!" : "Marked incomplete");
    document.dispatchEvent(new CustomEvent("eduzar:completed", { detail: { id } }));
    return done;
}
function toggleCompleted(id) { return setCompleted(id, !isCompleted(id)); }

// ── Watch progress (localStorage) ──────────────────────────
// { [videoId]: { t: secondsWatched, d: durationSeconds, at: lastOpenedMs } }
// Recorded through the YouTube IFrame API so courses resume where you left off.
const PROGRESS_KEY = "eduzar-watch-progress";

function getProgress() { return readJSON(PROGRESS_KEY, {}); }
function progressFor(id) { return getProgress()[id] || null; }

function watchedPct(id) {
    const p = progressFor(id);
    return p && p.d ? Math.min(1, p.t / p.d) : 0;
}

function saveProgress(id, patch) {
    const all = getProgress();
    all[id] = { t: 0, d: 0, ...all[id], ...patch, at: Date.now() };
    writeJSON(PROGRESS_KEY, all);
    document.dispatchEvent(new CustomEvent("eduzar:progress", { detail: { id } }));
}

function resumePoint(id) {
    const p = progressFor(id);
    if (!p || !p.d || isCompleted(id)) return 0;
    return p.t > 30 && p.t / p.d < 0.95 ? Math.floor(p.t - 5) : 0;
}

function formatTime(totalSeconds) {
    const s = Math.floor(totalSeconds);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

// ── Render courses/featured/stats from courses-data.js ─────
// Keeps index.html and courses.html in sync with a single data source
// instead of duplicating course markup by hand in two files.
if (typeof EDUZAR_COURSES !== "undefined") {
    const favoriteBtnHTML = (c) => {
        const fav = isFavorite(c.id);
        return `<button class="favorite-btn${fav ? " active" : ""}" data-favorite-id="${c.id}" aria-label="${fav ? "Remove from favorites" : "Save to favorites"}"><i class="${fav ? "ri-heart-fill" : "ri-heart-line"}"></i></button>`;
    };

    const progressWidth = (id) => isCompleted(id) ? 100 : Math.round(watchedPct(id) * 100);
    const watchLabel = (id) => isCompleted(id) ? "Watch Again" : watchedPct(id) >= 0.01 ? "Resume" : "Watch Now";

    const progressBarHTML = (c) => {
        const w = progressWidth(c.id);
        return `<div class="watch-progress"${w ? "" : " hidden"} aria-hidden="true"><div class="watch-progress-fill" style="width:${w}%"></div></div>`;
    };

    const courseCardHTML = (c, i) => `
        <div class="course-card" data-id="${c.id}" data-category="${c.category}" data-level="${c.level.toLowerCase()}" data-tags="${c.tags}" data-favorite="${isFavorite(c.id)}" data-completed="${isCompleted(c.id)}" style="--i:${i}">
            <div class="course-thumbnail" data-open-modal="${c.id}">
                <img src="https://img.youtube.com/vi/${c.id}/${THUMB_QUALITY}.jpg" alt="${c.title}" loading="lazy">
                <div class="play-overlay"><i class="ri-play-circle-fill"></i></div>
                <span class="course-badge">${c.level}</span>
                ${c.isNew ? '<span class="course-badge course-new">New</span>' : ""}
                <span class="completed-badge"><i class="ri-checkbox-circle-fill"></i> Completed</span>
                ${favoriteBtnHTML(c)}
                ${progressBarHTML(c)}
            </div>
            <div class="course-info">
                <h3 data-open-modal="${c.id}">${c.title}</h3>
                <p class="course-channel">${c.channel}</p>
                <div class="course-meta">
                    <span><i class="ri-time-line"></i> ${formatDuration(c.duration)}</span>
                    <span><i class="ri-bar-chart-line"></i> ${c.level}</span>
                </div>
                <button class="btn btn-primary watch-btn" data-open-modal="${c.id}" data-watch-label>${watchLabel(c.id)}</button>
            </div>
        </div>`;

    const featuredCardHTML = (c, i) => `
        <div class="featured-card" data-id="${c.id}" data-level="${c.level.toLowerCase()}" data-favorite="${isFavorite(c.id)}" data-completed="${isCompleted(c.id)}" style="--i:${i}">
            <div class="featured-thumb" data-open-modal="${c.id}">
                <img src="https://img.youtube.com/vi/${c.id}/${THUMB_QUALITY}.jpg" alt="${c.title}" loading="lazy">
                <div class="play-overlay"><i class="ri-play-circle-fill"></i></div>
                <span class="course-badge${c.isNew ? " course-new" : ""}">${c.isNew ? "New" : c.level}</span>
                ${favoriteBtnHTML(c)}
                ${progressBarHTML(c)}
            </div>
            <div class="featured-info">
                <span class="featured-tag">${EDUZAR_CATEGORY_LABELS[c.category] || c.category}</span>
                <h3 data-open-modal="${c.id}">${c.title}</h3>
                <p>${c.description || ""}</p>
                <button class="btn btn-primary watch-btn" data-open-modal="${c.id}">Watch Free</button>
            </div>
        </div>`;

    const relatedItemHTML = (c) => `
        <button class="related-item" data-open-modal="${c.id}">
            <img src="https://img.youtube.com/vi/${c.id}/hqdefault.jpg" alt="${c.title}" loading="lazy">
            <span><strong>${c.title}</strong><em>${c.channel}</em></span>
        </button>`;

    function refreshCourseCards(id) {
        const done = isCompleted(id);
        const width = progressWidth(id);
        document.querySelectorAll(`[data-id="${id}"]`).forEach((card) => {
            card.dataset.completed = done;
            const bar = card.querySelector(".watch-progress");
            if (bar) {
                bar.hidden = width === 0;
                bar.querySelector(".watch-progress-fill").style.width = `${width}%`;
            }
            const btn = card.querySelector("[data-watch-label]");
            if (btn) btn.textContent = watchLabel(id);
        });
    }

    const coursesGrid = document.querySelector(".courses-grid");
    if (coursesGrid) {
        coursesGrid.innerHTML = EDUZAR_COURSES.map(courseCardHTML).join("");
    }

    const featuredGrid = document.querySelector(".featured-grid");
    if (featuredGrid) {
        featuredGrid.innerHTML = EDUZAR_COURSES.filter(c => c.featured).map((c, i) => featuredCardHTML(c, i)).join("");
    }

    // ── Continue Learning (index.html) ──────────────
    // Courses you've opened but not finished, most recent first.
    const continueSection = document.getElementById("continue-learning");
    const recentGrid = continueSection?.querySelector(".recent-grid");
    let renderedRecentKey = null;

    function renderContinueLearning() {
        if (!recentGrid) return;
        const recent = Object.entries(getProgress())
            .filter(([id]) => !isCompleted(id) && courseById(id))
            .sort((a, b) => b[1].at - a[1].at)
            .slice(0, 4)
            .map(([id]) => courseById(id));

        // Only re-render when the list itself changed — card progress updates in place
        const key = recent.map(c => c.id).join(",");
        if (key === renderedRecentKey) return;
        renderedRecentKey = key;

        continueSection.hidden = recent.length === 0;
        recentGrid.innerHTML = recent.map(courseCardHTML).join("");
    }
    renderContinueLearning();

    // ── In-site video modal ─────────────────────────
    document.body.insertAdjacentHTML("beforeend", `
        <div class="video-modal" id="video-modal" aria-hidden="true">
            <div class="video-modal-backdrop" data-modal-close></div>
            <div class="video-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="video-modal-title">
                <button class="video-modal-close" data-modal-close aria-label="Close video"><i class="ri-close-line"></i></button>
                <div class="video-modal-player">
                    <div id="video-modal-slot"></div>
                </div>
                <div class="video-modal-info">
                    <div class="video-modal-heading">
                        <div>
                            <span class="video-modal-tag" id="video-modal-category"></span>
                            <h3 id="video-modal-title"></h3>
                            <p class="video-modal-channel" id="video-modal-channel"></p>
                        </div>
                        <div class="video-modal-actions">
                            <button class="complete-btn" id="video-modal-complete"><i class="ri-checkbox-circle-line"></i><span>Mark complete</span></button>
                            <button class="favorite-btn favorite-btn-lg" id="video-modal-favorite" aria-label="Save to favorites"><i class="ri-heart-line"></i></button>
                        </div>
                    </div>
                    <p class="video-modal-desc" id="video-modal-desc"></p>
                    <div class="video-modal-meta">
                        <span><i class="ri-time-line"></i> <span id="video-modal-duration"></span></span>
                        <span><i class="ri-bar-chart-line"></i> <span id="video-modal-level"></span></span>
                        <button class="video-modal-share" id="video-modal-share"><i class="ri-share-forward-line"></i> Share</button>
                        <a id="video-modal-yt" href="#" target="_blank" rel="noopener noreferrer"><i class="ri-youtube-fill"></i> Open on YouTube</a>
                    </div>
                    <h4 class="video-modal-related-title">Keep learning</h4>
                    <div class="video-modal-related" id="video-modal-related"></div>
                </div>
            </div>
        </div>`);

    const videoModal   = document.getElementById("video-modal");
    const playerWrap   = videoModal.querySelector(".video-modal-player");
    const completeBtn  = document.getElementById("video-modal-complete");

    // ── YouTube player with resume support ──────────
    // Uses the IFrame API to record how far you've watched. If the API can't
    // load (offline, blocked), falls back to a plain embed without tracking.
    let ytApi = null;
    let ytPlayer = null;
    let ytPlayerPending = false;
    let fallbackIframe = null;
    let currentVideoId = null;
    let progressTimer = null;

    function loadYouTubeAPI() {
        if (!ytApi) {
            ytApi = new Promise((resolve, reject) => {
                if (window.YT?.Player) { resolve(window.YT); return; }
                window.onYouTubeIframeAPIReady = () => resolve(window.YT);
                const script = document.createElement("script");
                script.src = "https://www.youtube.com/iframe_api";
                script.onerror = reject;
                document.head.appendChild(script);
                setTimeout(() => reject(new Error("YouTube API timed out")), 8000);
            });
        }
        return ytApi;
    }

    function recordPlayback() {
        if (!ytPlayer || !currentVideoId || typeof ytPlayer.getCurrentTime !== "function") return;
        // Right after switching videos the player can still report the old one
        if (!(ytPlayer.getVideoUrl?.() || "").includes(currentVideoId)) return;
        const t = ytPlayer.getCurrentTime();
        const d = ytPlayer.getDuration();
        if (!d || t < 1) return;

        saveProgress(currentVideoId, { t, d });
        if (t / d >= 0.9 && !isCompleted(currentVideoId)) {
            setCompleted(currentVideoId, true, { silent: true });
            showToast("Nice work — course marked complete! 🎉");
        }
    }

    function onPlayerStateChange(e) {
        clearInterval(progressTimer);
        if (e.data === window.YT.PlayerState.PLAYING) progressTimer = setInterval(recordPlayback, 5000);
        else recordPlayback();
    }

    function playVideo(id, start) {
        loadYouTubeAPI().then((YT) => {
            if (currentVideoId !== id) return; // closed or switched before the API arrived
            if (ytPlayer) { ytPlayer.loadVideoById({ videoId: id, startSeconds: start }); return; }
            if (ytPlayerPending) return; // onReady picks up whatever is current
            ytPlayerPending = true;
            new YT.Player("video-modal-slot", {
                videoId: id,
                playerVars: { autoplay: 1, rel: 0, playsinline: 1, start },
                events: {
                    onReady: (e) => {
                        ytPlayer = e.target;
                        ytPlayerPending = false;
                        if (!currentVideoId) ytPlayer.stopVideo();
                        else if (currentVideoId !== id) ytPlayer.loadVideoById({ videoId: currentVideoId, startSeconds: resumePoint(currentVideoId) });
                    },
                    onStateChange: onPlayerStateChange
                }
            });
        }).catch(() => {
            if (currentVideoId !== id) return;
            if (!fallbackIframe) {
                fallbackIframe = document.createElement("iframe");
                fallbackIframe.title = "Course video player";
                fallbackIframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
                fallbackIframe.allowFullscreen = true;
                playerWrap.replaceChildren(fallbackIframe);
            }
            fallbackIframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&start=${start}`;
        });
    }

    function updateModalCompleteBtn() {
        if (!currentVideoId) return;
        const done = isCompleted(currentVideoId);
        completeBtn.classList.toggle("active", done);
        completeBtn.querySelector("i").className = done ? "ri-checkbox-circle-fill" : "ri-checkbox-circle-line";
        completeBtn.querySelector("span").textContent = done ? "Completed" : "Mark complete";
        completeBtn.setAttribute("aria-pressed", done);
    }

    function openVideoModal(id) {
        const course = courseById(id);
        if (!course) return;

        if (currentVideoId && currentVideoId !== id) recordPlayback(); // switching via "Keep learning"
        currentVideoId = id;
        const start = resumePoint(id);
        saveProgress(id, {}); // bumps "last opened" for Continue Learning
        playVideo(id, start);
        if (start) showToast(`Resuming at ${formatTime(start)}`);

        document.getElementById("video-modal-category").textContent = EDUZAR_CATEGORY_LABELS[course.category] || course.category;
        document.getElementById("video-modal-title").textContent = course.title;
        document.getElementById("video-modal-channel").textContent = course.channel;
        document.getElementById("video-modal-desc").textContent = course.description || `A free ${course.level.toLowerCase()}-level course from ${course.channel}.`;
        document.getElementById("video-modal-duration").textContent = formatDuration(course.duration);
        document.getElementById("video-modal-level").textContent = course.level;
        document.getElementById("video-modal-yt").href = `https://www.youtube.com/watch?v=${id}${start ? `&t=${start}s` : ""}`;
        updateModalCompleteBtn();

        const favBtn = document.getElementById("video-modal-favorite");
        favBtn.dataset.favoriteId = id;
        const fav = isFavorite(id);
        favBtn.classList.toggle("active", fav);
        favBtn.setAttribute("aria-label", fav ? "Remove from favorites" : "Save to favorites");
        favBtn.querySelector("i").className = fav ? "ri-heart-fill" : "ri-heart-line";

        // Related: same category first, unfinished before finished
        const others = EDUZAR_COURSES.filter(c => c.id !== id);
        const sameCategory = others.filter(c => c.category === course.category);
        const related = (sameCategory.length ? sameCategory : others)
            .slice()
            .sort((a, b) => isCompleted(a.id) - isCompleted(b.id))
            .slice(0, 3);
        document.getElementById("video-modal-related").innerHTML = related.map(relatedItemHTML).join("");

        setUrlParam("watch", id);
        videoModal.querySelector(".video-modal-dialog").scrollTop = 0;
        showLayer(videoModal, videoModal.querySelector(".video-modal-close"));
    }

    function closeVideoModal() {
        if (!videoModal.classList.contains("active")) return;
        recordPlayback();
        clearInterval(progressTimer);
        currentVideoId = null;
        if (ytPlayer) ytPlayer.stopVideo();
        if (fallbackIframe) fallbackIframe.src = "";
        setUrlParam("watch", null);
        hideLayer(videoModal);
        renderContinueLearning();
    }
    registerLayer(videoModal, closeVideoModal);

    async function shareCourse(id) {
        const course = courseById(id);
        if (!course) return;
        const url = new URL(`courses.html?watch=${id}`, location.href).href;
        if (navigator.share) {
            try {
                await navigator.share({ title: `${course.title} | EduZar`, text: `Learn "${course.title}" free on EduZar`, url });
                return;
            } catch (err) {
                if (err.name === "AbortError") return; // user closed the share sheet
            }
        }
        try {
            await navigator.clipboard.writeText(url);
            showToast("Link copied — share it with a friend!");
        } catch {
            showToast("Couldn't copy the link automatically");
        }
    }

    document.addEventListener("click", (e) => {
        const favBtn = e.target.closest("[data-favorite-id]");
        if (favBtn) {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(favBtn.dataset.favoriteId);
            return;
        }
        if (e.target.closest("[data-modal-close]")) { closeVideoModal(); return; }
        const opener = e.target.closest("[data-open-modal]");
        if (opener) { openVideoModal(opener.dataset.openModal); return; }
    });

    completeBtn.addEventListener("click", () => { if (currentVideoId) toggleCompleted(currentVideoId); });
    document.getElementById("video-modal-share").addEventListener("click", () => shareCourse(currentVideoId));

    document.addEventListener("eduzar:progress", (e) => refreshCourseCards(e.detail.id));
    document.addEventListener("eduzar:completed", (e) => {
        refreshCourseCards(e.detail.id);
        if (e.detail.id === currentVideoId) updateModalCompleteBtn();
    });

    // Shared links: courses.html?watch=VIDEO_ID opens straight into the player
    const watchParam = new URLSearchParams(location.search).get("watch");
    if (watchParam && courseById(watchParam)) openVideoModal(watchParam);

    const seeAllLink = document.getElementById("see-all-link");
    if (seeAllLink) seeAllLink.textContent = `See All ${EDUZAR_COURSES.length} Courses`;

    // Honest, derived-from-data stats instead of hardcoded marketing numbers
    const totalHours = EDUZAR_COURSES.reduce((sum, c) => sum + c.duration, 0);
    const totalEducators = new Set(EDUZAR_COURSES.map(c => c.channel)).size;
    const totalTopics = new Set(EDUZAR_COURSES.flatMap(c => c.tags.split(" "))).size;

    const statValues = {
        "stat-courses": `${EDUZAR_COURSES.length}`,
        "stat-courses-2": `${EDUZAR_COURSES.length}`,
        "stat-topics": `${totalTopics}+`,
        "stat-topics-2": `${totalTopics}+`,
        "stat-hours": `${Math.floor(totalHours)}+`,
        "stat-educators": `${totalEducators}`
    };
    Object.entries(statValues).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });

    // Category cards (index.html) count real courses for whatever they link to
    document.querySelectorAll(".category-card[href]").forEach((card) => {
        const params = new URL(card.href).searchParams;
        const cat = params.get("category");
        const q = params.get("q") || "";
        const n = EDUZAR_COURSES.filter(c => (!cat || c.category === cat) && courseMatchesQuery(c, q)).length;
        const label = card.querySelector("span");
        if (label) label.textContent = `${n} course${n === 1 ? "" : "s"}`;
    });

    // ── Course filters (courses page) ───────────────
    // Search, category, level and sort all combine, and live in the URL so a
    // filtered view can be bookmarked or shared.
    if (coursesGrid) {
        const filterBtns   = document.querySelectorAll(".filter-btn");
        const searchInput  = document.getElementById("search-input");
        const levelSelect  = document.getElementById("level-filter");
        const sortSelect   = document.getElementById("sort-select");
        const resultsCount = document.getElementById("results-count");
        const noResults    = document.getElementById("no-results");
        const noResultsText = document.getElementById("no-results-text");

        const cardById = new Map([...coursesGrid.querySelectorAll(".course-card")].map(c => [c.dataset.id, c]));
        const sorters = {
            default: () => 0, // stable sort keeps the curated order
            short: (a, b) => a.duration - b.duration,
            long: (a, b) => b.duration - a.duration,
            new: (a, b) => b.isNew - a.isNew,
            az: (a, b) => a.title.localeCompare(b.title)
        };
        const hasOption = (select, value) => !select || [...select.options].some(o => o.value === value);

        const params = new URLSearchParams(location.search);
        const state = {
            q: params.get("q") || "",
            category: params.get("category") || "all",
            level: params.get("level") || "all",
            sort: params.get("sort") || "default"
        };
        if (![...filterBtns].some(b => b.dataset.category === state.category)) state.category = "all";
        if (!hasOption(levelSelect, state.level)) state.level = "all";
        if (!hasOption(sortSelect, state.sort) || !sorters[state.sort]) state.sort = "default";

        if (searchInput) searchInput.value = state.q;
        if (levelSelect) levelSelect.value = state.level;
        if (sortSelect) sortSelect.value = state.sort;

        let appliedSort = "default";

        applyCourseFilters = () => {
            if (state.sort !== appliedSort) {
                [...EDUZAR_COURSES].sort(sorters[state.sort]).forEach((c, i) => {
                    const card = cardById.get(c.id);
                    card.style.setProperty("--i", i);
                    coursesGrid.appendChild(card);
                });
                appliedSort = state.sort;
            }

            const favorites = getFavorites();
            let shown = 0;
            EDUZAR_COURSES.forEach((c) => {
                const inCategory = state.category === "all" ||
                    (state.category === "favorites" ? favorites.has(c.id) : c.category === state.category);
                const match = inCategory &&
                    (state.level === "all" || c.level.toLowerCase() === state.level) &&
                    courseMatchesQuery(c, state.q);
                cardById.get(c.id).style.display = match ? "" : "none";
                if (match) shown++;
            });

            filterBtns.forEach((b) => {
                const on = b.dataset.category === state.category;
                b.classList.toggle("active", on);
                b.setAttribute("aria-pressed", on);
            });

            const total = EDUZAR_COURSES.length;
            if (resultsCount) {
                resultsCount.textContent = shown === total
                    ? `Showing all ${total} courses`
                    : `Showing ${shown} of ${total} courses`;
            }
            if (noResults) {
                noResults.style.display = shown ? "none" : "block";
                if (noResultsText) {
                    noResultsText.textContent = state.category === "favorites" && !favorites.size
                        ? "You haven't saved any favourites yet — tap the ♥ on any course to save it here."
                        : "No courses match those filters. Try a different keyword or level.";
                }
            }

            setUrlParam("q", state.q.trim() || null);
            setUrlParam("category", state.category === "all" ? null : state.category);
            setUrlParam("level", state.level === "all" ? null : state.level);
            setUrlParam("sort", state.sort === "default" ? null : state.sort);
        };

        filterBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
                state.category = btn.dataset.category;
                applyCourseFilters();
            });
        });
        searchInput?.addEventListener("input", () => { state.q = searchInput.value; applyCourseFilters(); });
        searchInput?.addEventListener("keydown", (e) => { if (e.key === "Enter") searchInput.blur(); });
        document.getElementById("search-btn")?.addEventListener("click", () => { state.q = searchInput?.value || ""; applyCourseFilters(); });
        levelSelect?.addEventListener("change", () => { state.level = levelSelect.value; applyCourseFilters(); });
        sortSelect?.addEventListener("change", () => { state.sort = sortSelect.value; applyCourseFilters(); });
        document.getElementById("clear-filters")?.addEventListener("click", () => {
            Object.assign(state, { q: "", category: "all", level: "all" });
            if (searchInput) searchInput.value = "";
            if (levelSelect) levelSelect.value = "all";
            applyCourseFilters();
            searchInput?.focus();
        });

        // Course count badges on category buttons
        filterBtns.forEach((btn) => {
            const cat = btn.dataset.category;
            if (cat === "favorites") return;
            const count = cat === "all" ? EDUZAR_COURSES.length : EDUZAR_COURSES.filter(c => c.category === cat).length;
            if (count > 0) {
                const badge = document.createElement("span");
                badge.className = "filter-count";
                badge.textContent = count;
                btn.appendChild(badge);
            }
        });
        updateFavoritesBadge();

        applyCourseFilters();
    }
}

// ── Learning Paths, progress, and certificates ─────────────
// Only runs on pages that load learning-paths-data.js (paths.html,
// plus the homepage teaser on index.html).
if (typeof EDUZAR_PATHS !== "undefined" && typeof EDUZAR_COURSES !== "undefined") {
    function pathStats(path) {
        const courses = path.courses.map(courseById).filter(Boolean);
        const done = courses.filter(c => isCompleted(c.id)).length;
        const hours = courses.reduce((sum, c) => sum + c.duration, 0);
        return { courses, done, total: courses.length, hours, pct: courses.length ? done / courses.length : 0 };
    }

    const pathProgressLabel = (done, total) =>
        total > 0 && done === total ? "Complete — certificate unlocked 🎓" : `${done}/${total} complete`;
    const pathButtonLabel = (done, total) =>
        done === 0 ? "Start Path" : done === total ? "View Certificate" : "Continue Path";

    const pathCardHTML = (path, i) => {
        const { total, hours, done, pct } = pathStats(path);
        return `
        <div class="path-card" data-path-id="${path.id}" style="--i:${i}">
            <div class="path-card-icon"><i class="${path.icon}"></i></div>
            <h3>${path.title}</h3>
            <p>${path.description}</p>
            <div class="path-card-meta">
                <span><i class="ri-play-list-line"></i> ${total} courses</span>
                <span><i class="ri-time-line"></i> ${formatDuration(hours)}</span>
            </div>
            <div class="path-progress-bar"><div class="path-progress-fill" style="width:${Math.round(pct * 100)}%"></div></div>
            <div class="path-progress-label">${pathProgressLabel(done, total)}</div>
            <button class="btn btn-primary path-view-btn" data-open-path="${path.id}">${pathButtonLabel(done, total)}</button>
        </div>`;
    };

    const pathsGrid = document.querySelector(".paths-grid");
    if (pathsGrid) pathsGrid.innerHTML = EDUZAR_PATHS.map(pathCardHTML).join("");

    // Update progress on the cards in place (re-rendering would replay the entrance animation)
    function updatePathCards() {
        EDUZAR_PATHS.forEach((path) => {
            const card = document.querySelector(`.path-card[data-path-id="${path.id}"]`);
            if (!card) return;
            const { done, total, pct } = pathStats(path);
            card.querySelector(".path-progress-fill").style.width = `${Math.round(pct * 100)}%`;
            card.querySelector(".path-progress-label").textContent = pathProgressLabel(done, total);
            card.querySelector(".path-view-btn").textContent = pathButtonLabel(done, total);
        });
    }

    // ── Homepage teaser (index.html only) ──────────
    const teaserGrid = document.querySelector(".paths-teaser-grid");
    if (teaserGrid) {
        const teaserPaths = ["frontend-dev", "data-analyst", "ui-ux-design"]
            .map(id => EDUZAR_PATHS.find(p => p.id === id))
            .filter(Boolean);
        teaserGrid.innerHTML = teaserPaths.map((path) => {
            const { total, hours } = pathStats(path);
            return `
            <a href="paths.html?path=${path.id}" class="path-card path-teaser-card">
                <div class="path-card-icon"><i class="${path.icon}"></i></div>
                <h3>${path.title}</h3>
                <p>${path.description}</p>
                <div class="path-card-meta">
                    <span><i class="ri-play-list-line"></i> ${total} courses</span>
                    <span><i class="ri-time-line"></i> ${formatDuration(hours)}</span>
                </div>
            </a>`;
        }).join("");
    }

    // ── Path detail modal ───────────────────────────
    document.body.insertAdjacentHTML("beforeend", `
        <div class="path-modal" id="path-modal" aria-hidden="true">
            <div class="path-modal-backdrop" data-path-close></div>
            <div class="path-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="path-modal-title">
                <button class="path-modal-close" data-path-close aria-label="Close path"><i class="ri-close-line"></i></button>
                <div class="path-modal-header">
                    <div class="path-modal-icon"><i id="path-modal-icon"></i></div>
                    <div>
                        <h3 id="path-modal-title"></h3>
                        <p id="path-modal-desc"></p>
                    </div>
                </div>
                <div class="path-progress-bar path-modal-progress"><div class="path-progress-fill" id="path-modal-progress-fill"></div></div>
                <div class="path-progress-label" id="path-modal-progress-label"></div>
                <div class="path-rows" id="path-modal-rows"></div>
                <button class="btn btn-primary path-cert-btn" id="path-cert-btn" disabled>
                    <i class="ri-award-line"></i> Get Certificate
                </button>
            </div>
        </div>`);

    const pathModal   = document.getElementById("path-modal");
    const pathCertBtn = document.getElementById("path-cert-btn");
    let activePathId  = null;

    const pathRowHTML = (course, index, nextId) => {
        const done = isCompleted(course.id);
        const pct = Math.round(watchedPct(course.id) * 100);
        const status = done ? "" : course.id === nextId
            ? '<em class="path-row-next">Up next</em>'
            : pct >= 1 ? `<em class="path-row-watched">${pct}% watched</em>` : "";
        return `
        <div class="path-row${course.id === nextId ? " next" : ""}${done ? " done" : ""}" data-row-id="${course.id}">
            <span class="path-row-number">${index + 1}</span>
            <div class="path-row-thumb" data-open-modal="${course.id}">
                <img src="https://img.youtube.com/vi/${course.id}/hqdefault.jpg" alt="${course.title}" loading="lazy">
            </div>
            <div class="path-row-info" data-open-modal="${course.id}">
                <strong>${course.title}</strong>
                <span>${course.channel} &middot; ${formatDuration(course.duration)} ${status}</span>
            </div>
            <button class="path-row-complete${done ? " active" : ""}" data-mark-complete="${course.id}" aria-label="${done ? "Mark incomplete" : "Mark complete"}" aria-pressed="${done}">
                <i class="${done ? "ri-checkbox-circle-fill" : "ri-checkbox-blank-circle-line"}"></i>
            </button>
        </div>`;
    };

    function refreshPathModal() {
        const path = EDUZAR_PATHS.find(p => p.id === activePathId);
        if (!path) return;
        const { courses, done, total, pct } = pathStats(path);
        const nextId = courses.find(c => !isCompleted(c.id))?.id;

        document.getElementById("path-modal-progress-fill").style.width = `${Math.round(pct * 100)}%`;
        document.getElementById("path-modal-progress-label").textContent = pathProgressLabel(done, total);
        document.getElementById("path-modal-rows").innerHTML = courses.map((c, i) => pathRowHTML(c, i, nextId)).join("");

        const complete = total > 0 && done === total;
        pathCertBtn.disabled = !complete;
        pathCertBtn.classList.toggle("ready", complete);
    }

    function openPathModal(id) {
        const path = EDUZAR_PATHS.find(p => p.id === id);
        if (!path) return;
        activePathId = id;

        document.getElementById("path-modal-icon").className = path.icon;
        document.getElementById("path-modal-title").textContent = path.title;
        document.getElementById("path-modal-desc").textContent = path.description;
        refreshPathModal();

        setUrlParam("path", id);
        showLayer(pathModal, pathModal.querySelector(".path-modal-close"));
    }

    function closePathModal() {
        if (!pathModal.classList.contains("active")) return;
        activePathId = null;
        setUrlParam("path", null);
        hideLayer(pathModal);
    }
    registerLayer(pathModal, closePathModal);

    document.addEventListener("click", (e) => {
        const opener = e.target.closest("[data-open-path]");
        if (opener) { openPathModal(opener.dataset.openPath); return; }

        if (e.target.closest("[data-path-close]")) { closePathModal(); return; }

        const markBtn = e.target.closest("[data-mark-complete]");
        if (markBtn) {
            e.preventDefault();
            e.stopPropagation();
            toggleCompleted(markBtn.dataset.markComplete);
            return;
        }
    });

    document.addEventListener("eduzar:completed", () => {
        if (activePathId) refreshPathModal();
        updatePathCards();
    });

    // Deep link: paths.html?path=frontend-dev opens that path
    const pathParam = new URLSearchParams(location.search).get("path");
    if (pathParam && pathsGrid) openPathModal(pathParam);

    // ── Certificate modal ────────────────────────────
    document.body.insertAdjacentHTML("beforeend", `
        <div class="cert-modal" id="cert-modal" aria-hidden="true">
            <div class="cert-modal-backdrop" data-cert-close></div>
            <div class="cert-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="cert-modal-title">
                <button class="cert-modal-close" data-cert-close aria-label="Close certificate"><i class="ri-close-line"></i></button>
                <h3 id="cert-modal-title">Your Certificate</h3>
                <div class="cert-name-form" id="cert-name-form">
                    <label for="cert-name-input">Enter your full name</label>
                    <input type="text" id="cert-name-input" placeholder="e.g. Nomvula Dlamini" maxlength="60">
                    <button class="btn btn-primary" id="cert-generate-btn">Generate Certificate</button>
                </div>
                <div class="cert-canvas-wrap" id="cert-canvas-wrap" style="display:none">
                    <canvas id="cert-canvas" width="1600" height="1131"></canvas>
                    <div class="cert-actions">
                        <button class="btn btn-outline" id="cert-edit-name-btn"><i class="ri-edit-line"></i> Edit Name</button>
                        <button class="btn btn-outline" id="cert-share-btn"><i class="ri-share-line"></i> Share Achievement</button>
                        <button class="btn btn-primary" id="cert-download-btn"><i class="ri-download-line"></i> Download PNG</button>
                    </div>
                </div>
            </div>
        </div>`);

    const certModal      = document.getElementById("cert-modal");
    const certNameForm   = document.getElementById("cert-name-form");
    const certNameInput  = document.getElementById("cert-name-input");
    const certCanvasWrap = document.getElementById("cert-canvas-wrap");
    const certCanvas     = document.getElementById("cert-canvas");

    // Shrinks the font until the text fits, so long names/titles never run off the certificate
    function fillFittedText(ctx, text, x, y, weight, maxSize, maxWidth) {
        let size = maxSize;
        do {
            ctx.font = `${weight} ${size}px Poppins, sans-serif`;
            size -= 2;
        } while (ctx.measureText(text).width > maxWidth && size > 20);
        ctx.fillText(text, x, y);
    }

    async function drawCertificate(name, pathTitle) {
        const ctx = certCanvas.getContext("2d");
        const w = certCanvas.width, h = certCanvas.height;
        const maxTextWidth = w - 240;

        if (document.fonts) {
            try {
                await Promise.all([
                    document.fonts.load("700 72px Poppins"),
                    document.fonts.load("400 28px Poppins")
                ]);
                await document.fonts.ready;
            } catch { /* fall back to the default font if Poppins fails to load */ }
        }

        const bg = ctx.createLinearGradient(0, 0, w, h);
        bg.addColorStop(0, "#eef2ff");
        bg.addColorStop(1, "#f8fafc");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = "#2563eb";
        ctx.lineWidth = 10;
        ctx.strokeRect(30, 30, w - 60, h - 60);
        ctx.strokeStyle = "#7c3aed";
        ctx.lineWidth = 3;
        ctx.strokeRect(50, 50, w - 100, h - 100);

        ctx.textAlign = "center";

        ctx.fillStyle = "#2563eb";
        ctx.font = "700 42px Poppins, sans-serif";
        ctx.fillText("EDUZAR", w / 2, 160);

        ctx.fillStyle = "#111827";
        ctx.font = "700 56px Poppins, sans-serif";
        ctx.fillText("Certificate of Completion", w / 2, 250);

        ctx.fillStyle = "#6b7280";
        ctx.font = "400 28px Poppins, sans-serif";
        ctx.fillText("This certifies that", w / 2, 400);

        ctx.fillStyle = "#7c3aed";
        fillFittedText(ctx, name, w / 2, 500, 700, 72, maxTextWidth);

        ctx.fillStyle = "#6b7280";
        ctx.font = "400 28px Poppins, sans-serif";
        ctx.fillText("has successfully completed the learning path", w / 2, 590);

        ctx.fillStyle = "#111827";
        fillFittedText(ctx, pathTitle, w / 2, 660, 700, 46, maxTextWidth);

        const dateStr = new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" });
        ctx.fillStyle = "#6b7280";
        ctx.font = "400 26px Poppins, sans-serif";
        ctx.fillText(dateStr, w / 2, h - 140);
        ctx.fillText("eduzar.co.za · Free, curated learning for every South African", w / 2, h - 90);
    }

    function openCertModal() {
        const path = EDUZAR_PATHS.find(p => p.id === activePathId);
        if (!path) return;

        const savedName = readString(LEARNER_NAME_KEY);
        certNameInput.value = savedName || "";

        if (savedName) {
            certNameForm.style.display = "none";
            certCanvasWrap.style.display = "";
            drawCertificate(savedName, path.title);
        } else {
            certNameForm.style.display = "";
            certCanvasWrap.style.display = "none";
        }

        showLayer(certModal, savedName ? document.getElementById("cert-download-btn") : certNameInput);
    }

    function closeCertModal() {
        if (certModal.classList.contains("active")) hideLayer(certModal);
    }
    registerLayer(certModal, closeCertModal);

    pathCertBtn.addEventListener("click", () => {
        if (!pathCertBtn.disabled) openCertModal();
    });

    function generateCertificate() {
        const name = certNameInput.value.trim();
        if (!name) { showToast("Please enter your name"); return; }
        writeString(LEARNER_NAME_KEY, name);
        const path = EDUZAR_PATHS.find(p => p.id === activePathId);
        if (!path) return;
        certNameForm.style.display = "none";
        certCanvasWrap.style.display = "";
        drawCertificate(name, path.title);
    }

    document.getElementById("cert-generate-btn").addEventListener("click", generateCertificate);
    certNameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") generateCertificate(); });

    document.getElementById("cert-edit-name-btn").addEventListener("click", () => {
        certNameForm.style.display = "";
        certCanvasWrap.style.display = "none";
        certNameInput.focus();
    });

    document.getElementById("cert-download-btn").addEventListener("click", () => {
        const path = EDUZAR_PATHS.find(p => p.id === activePathId);
        const link = document.createElement("a");
        link.download = `EduZar-Certificate-${path ? path.id : "path"}.png`;
        link.href = certCanvas.toDataURL("image/png");
        link.click();
    });

    document.getElementById("cert-share-btn").addEventListener("click", () => {
        const path = EDUZAR_PATHS.find(p => p.id === activePathId);
        if (!path) return;
        const caption = `🎓 I just completed the "${path.title}" learning path on EduZar — free, curated courses for South African learners! #LearnFree #EduZar`;

        certCanvas.toBlob(async (blob) => {
            const file = blob ? new File([blob], `EduZar-Certificate-${path.id}.png`, { type: "image/png" }) : null;

            if (navigator.share && file && navigator.canShare?.({ files: [file] })) {
                try {
                    await navigator.share({ title: "EduZar Certificate", text: caption, files: [file] });
                    return;
                } catch { /* user cancelled the native share sheet — fall back to clipboard below */ }
            }

            try {
                await navigator.clipboard.writeText(caption);
                showToast("Caption copied! Paste it on LinkedIn with your downloaded certificate.");
            } catch {
                showToast("Couldn't copy automatically — download your certificate to share it manually.");
            }
        }, "image/png");
    });

    document.addEventListener("click", (e) => {
        if (e.target.closest("[data-cert-close]")) closeCertModal();
    });
}

const openMenuBtn = document.getElementById("open-menu");
const closeMenuBtn = document.getElementById("close-menu");
const navbar = document.getElementById("navbar");
const overlay = document.getElementById("overlay");
const navLinks = document.querySelectorAll(".nav-link");
const header = document.getElementById("header");

// ── Categories Sidebar ──────────────────────────
const categoriesBtn = document.getElementById("categories-btn");
const catSidebar    = document.getElementById("cat-sidebar");
const catClose      = document.getElementById("cat-close");

function closeCatSidebar() {
    catSidebar?.classList.remove("active");
    categoriesBtn?.classList.remove("active");
}

if (categoriesBtn && catSidebar) {
    categoriesBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isActive = catSidebar.classList.toggle("active");
        categoriesBtn.classList.toggle("active", isActive);
    });
}
catClose?.addEventListener("click", closeCatSidebar);
document.addEventListener("click", (e) => {
    if (catSidebar?.classList.contains("active") &&
        !catSidebar.contains(e.target) &&
        !categoriesBtn?.contains(e.target)) {
        closeCatSidebar();
    }
});

// Open Menu
openMenuBtn.addEventListener("click", () => {
    navbar.classList.add("active");
    overlay.classList.add("active");
    syncScrollLock();
});

// Close Menu Function
function closeMenu() {
    navbar.classList.remove("active");
    overlay.classList.remove("active");
    syncScrollLock();
}

closeMenuBtn.addEventListener("click", closeMenu);
overlay.addEventListener("click", closeMenu);
navLinks.forEach(link => { link.addEventListener("click", closeMenu); });
document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || layers.some(l => l.el.classList.contains("active"))) return;
    closeMenu();
    closeCatSidebar();
});

// "/" jumps to the search box, like most sites with search
document.addEventListener("keydown", (e) => {
    if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest?.("input, textarea, select, [contenteditable]")) return;
    const input = document.getElementById("search-input") || document.getElementById("hero-search-input");
    if (!input) return;
    e.preventDefault();
    input.focus();
    input.select();
});

// Scroll Reveal
const reveals = document.querySelectorAll(".reveal");
function revealOnScroll() {
    const windowHeight = window.innerHeight;
    reveals.forEach((el) => {
        if (el.getBoundingClientRect().top < windowHeight - 100) {
            el.classList.add("active");
        }
    });
}
revealOnScroll();

// ── Hero search → redirect to courses page ─────────
const heroSearch = document.getElementById("hero-search-btn");
const heroInput  = document.getElementById("hero-search-input");

function heroSearchRedirect() {
    const q = heroInput?.value.trim();
    window.location.href = q ? `courses.html?q=${encodeURIComponent(q)}` : "courses.html";
}

if (heroSearch) heroSearch.addEventListener("click", heroSearchRedirect);
if (heroInput)  heroInput.addEventListener("keydown", (e) => { if (e.key === "Enter") heroSearchRedirect(); });

// ── Active nav link on scroll (index page only) ────
const sections = document.querySelectorAll("section[id]");
if (sections.length) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(link => {
                    link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
                });
            }
        });
    }, { rootMargin: "-40% 0px -55% 0px" });
    sections.forEach(s => observer.observe(s));
}

// ── Back to Top button ─────────────────────────────
const backToTop = document.createElement("button");
backToTop.id = "back-to-top";
backToTop.innerHTML = '<i class="ri-arrow-up-line"></i>';
backToTop.setAttribute("aria-label", "Back to top");
document.body.appendChild(backToTop);
backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

// One scroll listener for header shadow, reveal and back-to-top
window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 50);
    backToTop.classList.toggle("visible", window.scrollY > 400);
    revealOnScroll();
}, { passive: true });

// ── Dark Mode ──────────────────────────────────────
// The initial theme is applied by an inline script in <head> to avoid a
// white flash; this just syncs the icon and handles toggling.
const darkToggle = document.getElementById("dark-toggle");
const darkIcon   = darkToggle?.querySelector("i");

function applyTheme(dark, persist) {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    if (darkIcon) darkIcon.className = dark ? "ri-sun-line" : "ri-moon-line";
    if (persist) writeString("eduzar-theme", dark ? "dark" : "light");
}

const savedTheme = readString("eduzar-theme");
applyTheme(savedTheme ? savedTheme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches, false);

if (darkToggle) {
    darkToggle.addEventListener("click", () => {
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        applyTheme(!isDark, true);
    });
}
