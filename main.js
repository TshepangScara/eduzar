// Always start at the top of the page on load
if (history.scrollRestoration) history.scrollRestoration = "manual";
window.scrollTo(0, 0);

// ── Favorites (localStorage, shared across pages) ──────────
const FAVORITES_KEY = "eduzar-favorites";

function getFavorites() {
    try { return new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY)) || []); }
    catch { return new Set(); }
}
function isFavorite(id) { return getFavorites().has(id); }

function showToast(message) {
    let toast = document.getElementById("eduzar-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "eduzar-toast";
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function toggleFavorite(id) {
    const favorites = getFavorites();
    const nowActive = !favorites.has(id);
    nowActive ? favorites.add(id) : favorites.delete(id);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));

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

    const activeFilter = document.querySelector(".filter-btn.active");
    if (activeFilter?.dataset.category === "favorites") activeFilter.click();
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

function getCompleted() {
    try { return new Set(JSON.parse(localStorage.getItem(COMPLETED_KEY)) || []); }
    catch { return new Set(); }
}
function isCompleted(id) { return getCompleted().has(id); }

function toggleCompleted(id) {
    const completed = getCompleted();
    const nowActive = !completed.has(id);
    nowActive ? completed.add(id) : completed.delete(id);
    localStorage.setItem(COMPLETED_KEY, JSON.stringify([...completed]));
    showToast(nowActive ? "Marked complete!" : "Marked incomplete");
    return nowActive;
}

// ── Render courses/featured/stats from courses-data.js ─────
// Keeps index.html and courses.html in sync with a single data source
// instead of duplicating course markup by hand in two files.
if (typeof EDUZAR_COURSES !== "undefined") {
    const favoriteBtnHTML = (c) => {
        const fav = isFavorite(c.id);
        return `<button class="favorite-btn${fav ? " active" : ""}" data-favorite-id="${c.id}" aria-label="${fav ? "Remove from favorites" : "Save to favorites"}"><i class="${fav ? "ri-heart-fill" : "ri-heart-line"}"></i></button>`;
    };

    const courseCardHTML = (c, i) => `
        <div class="course-card" data-id="${c.id}" data-category="${c.category}" data-tags="${c.tags}" data-favorite="${isFavorite(c.id)}" style="--i:${i}">
            <div class="course-thumbnail" data-open-modal="${c.id}">
                <img src="https://img.youtube.com/vi/${c.id}/maxresdefault.jpg" alt="${c.title}" loading="lazy">
                <div class="play-overlay"><i class="ri-play-circle-fill"></i></div>
                <span class="course-badge">${c.level}</span>
                ${c.isNew ? '<span class="course-badge course-new">New</span>' : ""}
                ${favoriteBtnHTML(c)}
            </div>
            <div class="course-info">
                <h3 data-open-modal="${c.id}">${c.title}</h3>
                <p class="course-channel">${c.channel}</p>
                <div class="course-meta">
                    <span><i class="ri-time-line"></i> ${c.duration} hrs</span>
                    <span><i class="ri-bar-chart-line"></i> ${c.level}</span>
                </div>
                <button class="btn btn-primary watch-btn" data-open-modal="${c.id}">Watch Now</button>
            </div>
        </div>`;

    const featuredCardHTML = (c, i) => `
        <div class="featured-card" data-id="${c.id}" data-favorite="${isFavorite(c.id)}" style="--i:${i}">
            <div class="featured-thumb" data-open-modal="${c.id}">
                <img src="https://img.youtube.com/vi/${c.id}/maxresdefault.jpg" alt="${c.title}" loading="lazy">
                <div class="play-overlay"><i class="ri-play-circle-fill"></i></div>
                <span class="course-badge${c.isNew ? " course-new" : ""}">${c.isNew ? "New" : c.level}</span>
                ${favoriteBtnHTML(c)}
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

    const coursesGrid = document.querySelector(".courses-grid");
    if (coursesGrid) {
        coursesGrid.innerHTML = EDUZAR_COURSES.map(courseCardHTML).join("");
    }

    const featuredGrid = document.querySelector(".featured-grid");
    if (featuredGrid) {
        featuredGrid.innerHTML = EDUZAR_COURSES.filter(c => c.featured).map((c, i) => featuredCardHTML(c, i)).join("");
    }

    // ── In-site video modal ─────────────────────────
    document.body.insertAdjacentHTML("beforeend", `
        <div class="video-modal" id="video-modal" aria-hidden="true">
            <div class="video-modal-backdrop" data-modal-close></div>
            <div class="video-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="video-modal-title">
                <button class="video-modal-close" data-modal-close aria-label="Close video"><i class="ri-close-line"></i></button>
                <div class="video-modal-player">
                    <iframe id="video-modal-iframe" src="" title="Course video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
                <div class="video-modal-info">
                    <div class="video-modal-heading">
                        <div>
                            <span class="video-modal-tag" id="video-modal-category"></span>
                            <h3 id="video-modal-title"></h3>
                            <p class="video-modal-channel" id="video-modal-channel"></p>
                        </div>
                        <button class="favorite-btn favorite-btn-lg" id="video-modal-favorite" aria-label="Save to favorites"><i class="ri-heart-line"></i></button>
                    </div>
                    <p class="video-modal-desc" id="video-modal-desc"></p>
                    <div class="video-modal-meta">
                        <span><i class="ri-time-line"></i> <span id="video-modal-duration"></span> hrs</span>
                        <span><i class="ri-bar-chart-line"></i> <span id="video-modal-level"></span></span>
                        <a id="video-modal-yt" href="#" target="_blank" rel="noopener noreferrer"><i class="ri-youtube-fill"></i> Open on YouTube</a>
                    </div>
                    <div class="video-modal-related" id="video-modal-related"></div>
                </div>
            </div>
        </div>`);

    const videoModal  = document.getElementById("video-modal");
    const modalIframe = document.getElementById("video-modal-iframe");

    function openVideoModal(id) {
        const course = EDUZAR_COURSES.find(c => c.id === id);
        if (!course || !videoModal) return;

        modalIframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
        document.getElementById("video-modal-category").textContent = EDUZAR_CATEGORY_LABELS[course.category] || course.category;
        document.getElementById("video-modal-title").textContent = course.title;
        document.getElementById("video-modal-channel").textContent = course.channel;
        document.getElementById("video-modal-desc").textContent = course.description || `A free ${course.level.toLowerCase()}-level course from ${course.channel}.`;
        document.getElementById("video-modal-duration").textContent = course.duration;
        document.getElementById("video-modal-level").textContent = course.level;
        document.getElementById("video-modal-yt").href = `https://www.youtube.com/watch?v=${id}`;

        const favBtn = document.getElementById("video-modal-favorite");
        favBtn.dataset.favoriteId = id;
        const fav = isFavorite(id);
        favBtn.classList.toggle("active", fav);
        favBtn.setAttribute("aria-label", fav ? "Remove from favorites" : "Save to favorites");
        favBtn.querySelector("i").className = fav ? "ri-heart-fill" : "ri-heart-line";

        const sameCategory = EDUZAR_COURSES.filter(c => c.id !== id && c.category === course.category);
        const related = (sameCategory.length ? sameCategory : EDUZAR_COURSES.filter(c => c.id !== id)).slice(0, 3);
        document.getElementById("video-modal-related").innerHTML = related.map(relatedItemHTML).join("");

        videoModal.classList.add("active");
        videoModal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    }

    function closeVideoModal() {
        if (!videoModal) return;
        videoModal.classList.remove("active");
        videoModal.setAttribute("aria-hidden", "true");
        modalIframe.src = "";
        document.body.style.overflow = "";
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

    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeVideoModal(); });

    const seeAllLink = document.getElementById("see-all-link");
    if (seeAllLink) seeAllLink.textContent = `See All ${EDUZAR_COURSES.length}+ Courses`;

    // Honest, derived-from-data stats instead of hardcoded marketing numbers
    const totalHours = EDUZAR_COURSES.reduce((sum, c) => sum + c.duration, 0);
    const totalEducators = new Set(EDUZAR_COURSES.map(c => c.channel)).size;
    const totalTopics = new Set(EDUZAR_COURSES.flatMap(c => c.tags.split(" "))).size;

    const statValues = {
        "stat-courses": `${EDUZAR_COURSES.length}+`,
        "stat-courses-2": `${EDUZAR_COURSES.length}+`,
        "stat-topics": `${totalTopics}+`,
        "stat-topics-2": `${totalTopics}+`,
        "stat-hours": `${totalHours}+`,
        "stat-educators": `${totalEducators}+`
    };
    Object.entries(statValues).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });
}

// ── Learning Paths, progress, and certificates ─────────────
// Only runs on pages that load learning-paths-data.js (paths.html,
// plus the homepage teaser on index.html).
if (typeof EDUZAR_PATHS !== "undefined" && typeof EDUZAR_COURSES !== "undefined") {
    const courseById = (id) => EDUZAR_COURSES.find(c => c.id === id);

    function pathStats(path) {
        const courses = path.courses.map(courseById).filter(Boolean);
        const done = courses.filter(c => isCompleted(c.id)).length;
        const hours = courses.reduce((sum, c) => sum + c.duration, 0);
        return { courses, done, total: courses.length, hours, pct: courses.length ? done / courses.length : 0 };
    }

    const pathCardHTML = (path, i) => {
        const { total, hours, done, pct } = pathStats(path);
        return `
        <div class="path-card" data-path-id="${path.id}" style="--i:${i}">
            <div class="path-card-icon"><i class="${path.icon}"></i></div>
            <h3>${path.title}</h3>
            <p>${path.description}</p>
            <div class="path-card-meta">
                <span><i class="ri-play-list-line"></i> ${total} courses</span>
                <span><i class="ri-time-line"></i> ${hours} hrs</span>
            </div>
            <div class="path-progress-bar"><div class="path-progress-fill" style="width:${Math.round(pct * 100)}%"></div></div>
            <div class="path-progress-label">${done}/${total} complete</div>
            <button class="btn btn-primary path-view-btn" data-open-path="${path.id}">View Path</button>
        </div>`;
    };

    const pathsGrid = document.querySelector(".paths-grid");
    if (pathsGrid) pathsGrid.innerHTML = EDUZAR_PATHS.map(pathCardHTML).join("");

    // ── Homepage teaser (index.html only) ──────────
    const teaserGrid = document.querySelector(".paths-teaser-grid");
    if (teaserGrid) {
        const teaserPaths = ["frontend-dev", "data-analyst", "ui-ux-design"]
            .map(id => EDUZAR_PATHS.find(p => p.id === id))
            .filter(Boolean);
        teaserGrid.innerHTML = teaserPaths.map((path) => {
            const { total, hours } = pathStats(path);
            return `
            <a href="paths.html" class="path-card path-teaser-card">
                <div class="path-card-icon"><i class="${path.icon}"></i></div>
                <h3>${path.title}</h3>
                <p>${path.description}</p>
                <div class="path-card-meta">
                    <span><i class="ri-play-list-line"></i> ${total} courses</span>
                    <span><i class="ri-time-line"></i> ${hours} hrs</span>
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

    const pathRowHTML = (course, index) => `
        <div class="path-row" data-row-id="${course.id}">
            <span class="path-row-number">${index + 1}</span>
            <div class="path-row-thumb" data-open-modal="${course.id}">
                <img src="https://img.youtube.com/vi/${course.id}/hqdefault.jpg" alt="${course.title}" loading="lazy">
            </div>
            <div class="path-row-info" data-open-modal="${course.id}">
                <strong>${course.title}</strong>
                <span>${course.channel} &middot; ${course.duration} hrs</span>
            </div>
            <button class="path-row-complete${isCompleted(course.id) ? " active" : ""}" data-mark-complete="${course.id}" aria-label="Mark complete">
                <i class="${isCompleted(course.id) ? "ri-checkbox-circle-fill" : "ri-checkbox-blank-circle-line"}"></i>
            </button>
        </div>`;

    function refreshPathModal() {
        const path = EDUZAR_PATHS.find(p => p.id === activePathId);
        if (!path) return;
        const { courses, done, total, pct } = pathStats(path);

        document.getElementById("path-modal-progress-fill").style.width = `${Math.round(pct * 100)}%`;
        document.getElementById("path-modal-progress-label").textContent = `${done}/${total} complete`;
        document.getElementById("path-modal-rows").innerHTML = courses.map(pathRowHTML).join("");

        const complete = total > 0 && done === total;
        pathCertBtn.disabled = !complete;
        pathCertBtn.classList.toggle("ready", complete);

        // Keep the grid card behind the modal in sync too
        const card = document.querySelector(`.path-card[data-path-id="${path.id}"]`);
        if (card) card.outerHTML = pathCardHTML(path, card.style.getPropertyValue("--i") || 0);
    }

    function openPathModal(id) {
        const path = EDUZAR_PATHS.find(p => p.id === id);
        if (!path || !pathModal) return;
        activePathId = id;

        document.getElementById("path-modal-icon").className = path.icon;
        document.getElementById("path-modal-title").textContent = path.title;
        document.getElementById("path-modal-desc").textContent = path.description;
        refreshPathModal();

        pathModal.classList.add("active");
        pathModal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    }

    function closePathModal() {
        if (!pathModal) return;
        pathModal.classList.remove("active");
        pathModal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
        activePathId = null;
    }

    document.addEventListener("click", (e) => {
        const opener = e.target.closest("[data-open-path]");
        if (opener) { openPathModal(opener.dataset.openPath); return; }

        if (e.target.closest("[data-path-close]")) { closePathModal(); return; }

        const markBtn = e.target.closest("[data-mark-complete]");
        if (markBtn) {
            e.preventDefault();
            e.stopPropagation();
            toggleCompleted(markBtn.dataset.markComplete);
            refreshPathModal();
            return;
        }
    });

    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePathModal(); });

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

    async function drawCertificate(name, pathTitle) {
        const ctx = certCanvas.getContext("2d");
        const w = certCanvas.width, h = certCanvas.height;

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
        ctx.font = "700 72px Poppins, sans-serif";
        ctx.fillText(name, w / 2, 500);

        ctx.fillStyle = "#6b7280";
        ctx.font = "400 28px Poppins, sans-serif";
        ctx.fillText("has successfully completed the learning path", w / 2, 590);

        ctx.fillStyle = "#111827";
        ctx.font = "700 46px Poppins, sans-serif";
        ctx.fillText(pathTitle, w / 2, 660);

        const dateStr = new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" });
        ctx.fillStyle = "#6b7280";
        ctx.font = "400 26px Poppins, sans-serif";
        ctx.fillText(dateStr, w / 2, h - 140);
        ctx.fillText("eduzar.co.za · Free, curated learning for every South African", w / 2, h - 90);
    }

    function openCertModal() {
        const path = EDUZAR_PATHS.find(p => p.id === activePathId);
        if (!path || !certModal) return;

        const savedName = localStorage.getItem(LEARNER_NAME_KEY);
        certNameInput.value = savedName || "";

        if (savedName) {
            certNameForm.style.display = "none";
            certCanvasWrap.style.display = "";
            drawCertificate(savedName, path.title);
        } else {
            certNameForm.style.display = "";
            certCanvasWrap.style.display = "none";
        }

        certModal.classList.add("active");
        certModal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    }

    function closeCertModal() {
        if (!certModal) return;
        certModal.classList.remove("active");
        certModal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    }

    if (pathCertBtn) {
        pathCertBtn.addEventListener("click", () => {
            if (!pathCertBtn.disabled) openCertModal();
        });
    }

    document.getElementById("cert-generate-btn")?.addEventListener("click", () => {
        const name = certNameInput.value.trim();
        if (!name) { showToast("Please enter your name"); return; }
        localStorage.setItem(LEARNER_NAME_KEY, name);
        const path = EDUZAR_PATHS.find(p => p.id === activePathId);
        if (!path) return;
        certNameForm.style.display = "none";
        certCanvasWrap.style.display = "";
        drawCertificate(name, path.title);
    });

    document.getElementById("cert-edit-name-btn")?.addEventListener("click", () => {
        certNameForm.style.display = "";
        certCanvasWrap.style.display = "none";
    });

    document.getElementById("cert-download-btn")?.addEventListener("click", () => {
        const path = EDUZAR_PATHS.find(p => p.id === activePathId);
        const link = document.createElement("a");
        link.download = `EduZar-Certificate-${path ? path.id : "path"}.png`;
        link.href = certCanvas.toDataURL("image/png");
        link.click();
    });

    document.getElementById("cert-share-btn")?.addEventListener("click", () => {
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
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCertModal(); });
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

if (categoriesBtn && catSidebar) {
    categoriesBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isActive = catSidebar.classList.toggle("active");
        categoriesBtn.classList.toggle("active", isActive);
    });
}
if (catClose && catSidebar) {
    catClose.addEventListener("click", () => {
        catSidebar.classList.remove("active");
        categoriesBtn?.classList.remove("active");
    });
}
document.addEventListener("click", (e) => {
    if (catSidebar?.classList.contains("active") &&
        !catSidebar.contains(e.target) &&
        !categoriesBtn?.contains(e.target)) {
        catSidebar.classList.remove("active");
        categoriesBtn?.classList.remove("active");
    }
});

// Open Menu
openMenuBtn.addEventListener("click", () => {
    navbar.classList.add("active");
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
});

// Close Menu Function
function closeMenu() {
    navbar.classList.remove("active");
    overlay.classList.remove("active");
    document.body.style.overflow = "";
}

closeMenuBtn.addEventListener("click", closeMenu);
overlay.addEventListener("click", closeMenu);
navLinks.forEach(link => { link.addEventListener("click", closeMenu); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

// Header shrink on scroll
window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 50);
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
window.addEventListener("scroll", revealOnScroll);
revealOnScroll();

// ── Search (courses page) ──────────────────────────
const searchInput = document.getElementById("search-input");
const searchBtn   = document.getElementById("search-btn");

function runSearch() {
    const query = (searchInput?.value || "").toLowerCase().trim();
    const cards = document.querySelectorAll(".course-card");
    let found = 0;

    cards.forEach((card) => {
        const title   = card.querySelector("h3")?.textContent.toLowerCase() || "";
        const channel = card.querySelector(".course-channel")?.textContent.toLowerCase() || "";
        const tags    = card.dataset.tags?.toLowerCase() || "";
        const match   = !query || title.includes(query) || channel.includes(query) || tags.includes(query);
        card.style.display = match ? "" : "none";
        if (match) found++;
    });

    let empty = document.getElementById("no-results");
    if (!empty) {
        empty = document.createElement("p");
        empty.id = "no-results";
        empty.className = "no-results";
        empty.textContent = "No courses found. Try a different keyword.";
        document.querySelector(".courses-grid")?.after(empty);
    }
    empty.style.display = found === 0 ? "block" : "none";
}

if (searchBtn)   searchBtn.addEventListener("click", runSearch);
if (searchInput) {
    searchInput.addEventListener("keydown", (e) => { if (e.key === "Enter") runSearch(); });
    searchInput.addEventListener("input", runSearch); // real-time search
}

// ── Category filter (courses page) ────────────────
const filterBtns = document.querySelectorAll(".filter-btn");

filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        filterBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const cat = btn.dataset.category;
        document.querySelectorAll(".course-card").forEach((card) => {
            const match = cat === "all"
                ? true
                : cat === "favorites"
                    ? card.dataset.favorite === "true"
                    : card.dataset.category === cat;
            card.style.display = match ? "" : "none";
        });

        const empty = document.getElementById("no-results");
        if (empty) empty.style.display = "none";
        if (searchInput) searchInput.value = "";
    });
});

// ── Hero search → redirect to courses page ─────────
const heroSearch = document.getElementById("hero-search-btn");
const heroInput  = document.getElementById("hero-search-input");

function heroSearchRedirect() {
    const q = heroInput?.value.trim();
    if (q) window.location.href = `courses.html?q=${encodeURIComponent(q)}`;
}

if (heroSearch) heroSearch.addEventListener("click", heroSearchRedirect);
if (heroInput)  heroInput.addEventListener("keydown", (e) => { if (e.key === "Enter") heroSearchRedirect(); });

// ── Activate filter or pre-fill search from URL ────
window.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("category");
    const q   = params.get("q");

    if (cat) {
        const btn = [...filterBtns].find(b => b.dataset.category === cat);
        if (btn) btn.click();
    } else if (q && searchInput) {
        searchInput.value = q;
        runSearch();
    }
});

// ── Course count badges on filter buttons ──────────
window.addEventListener("DOMContentLoaded", () => {
    const allCards = document.querySelectorAll(".course-card");
    filterBtns.forEach((btn) => {
        const cat = btn.dataset.category;
        const count = cat === "all"
            ? allCards.length
            : [...allCards].filter(c => c.dataset.category === cat).length;
        if (count > 0) {
            const badge = document.createElement("span");
            badge.className = "filter-count";
            badge.textContent = count;
            btn.appendChild(badge);
        }
    });
    updateFavoritesBadge();
});

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

window.addEventListener("scroll", () => {
    backToTop.classList.toggle("visible", window.scrollY > 400);
});
backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

// ── Dark Mode ──────────────────────────────────────
const darkToggle = document.getElementById("dark-toggle");
const darkIcon   = darkToggle?.querySelector("i");

function applyTheme(dark) {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    if (darkIcon) {
        darkIcon.className = dark ? "ri-sun-line" : "ri-moon-line";
    }
    localStorage.setItem("eduzar-theme", dark ? "dark" : "light");
}

// Load saved preference
const savedTheme = localStorage.getItem("eduzar-theme");
applyTheme(savedTheme === "dark");

if (darkToggle) {
    darkToggle.addEventListener("click", () => {
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        applyTheme(!isDark);
    });
}
