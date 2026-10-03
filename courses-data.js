// Single source of truth for every course. index.html (Featured) and
// courses.html (full grid) both render from this list, so a course only
// ever needs to be added/edited in one place.
//
// Every id, title, channel and duration here was checked against YouTube
// (oEmbed + the watch page) on 2026-10-01. Before adding a course, confirm
// the video exists and the metadata matches:
//   https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=VIDEO_ID&format=json
// `duration` is in hours (decimals are fine — under an hour displays as minutes).
const EDUZAR_COURSES = [
    // ── Programming ──
    { id: "8DvywoWv6fI", title: "Python for Everybody – Full University Course", channel: "freeCodeCamp.org", category: "programming", tags: "python beginner university", duration: 13.7, level: "Beginner", isNew: false, featured: true, description: "Dr. Chuck's legendary university course. Perfect if you've never written a line of code." },
    { id: "kqtD5dpn9C8", title: "Python for Beginners in 1 Hour", channel: "Programming with Mosh", category: "programming", tags: "python beginner crash course", duration: 1, level: "Beginner", isNew: false },
    { id: "pQN-pnXPaVg", title: "HTML Full Course – Build a Website", channel: "freeCodeCamp.org", category: "programming", tags: "html web beginner website frontend", duration: 2, level: "Beginner", isNew: true },
    { id: "1Rs2ND1ryYc", title: "CSS Tutorial – Zero to Hero", channel: "freeCodeCamp.org", category: "programming", tags: "css web beginner styling frontend", duration: 6.3, level: "Beginner", isNew: false },
    { id: "PkZNo7MFNFg", title: "JavaScript Full Course for Beginners", channel: "freeCodeCamp.org", category: "programming", tags: "javascript beginner web", duration: 3.5, level: "Beginner", isNew: false },
    { id: "RGOj5yH7evk", title: "Git & GitHub Crash Course", channel: "freeCodeCamp.org", category: "programming", tags: "git github beginner version control", duration: 1.1, level: "Beginner", isNew: false },
    { id: "bMknfKXIFA8", title: "React Course for Beginners", channel: "freeCodeCamp.org", category: "programming", tags: "react javascript frontend", duration: 11.9, level: "Intermediate", isNew: false },
    { id: "30LWjhZzg50", title: "TypeScript Full Tutorial", channel: "freeCodeCamp.org", category: "programming", tags: "typescript javascript", duration: 4.8, level: "Intermediate", isNew: false },
    { id: "Oe421EPjeBE", title: "Node.js & Express – Full Course", channel: "freeCodeCamp.org", category: "programming", tags: "nodejs express backend javascript api", duration: 8.3, level: "Intermediate", isNew: false },
    { id: "grEKMHGYyns", title: "Java Full Tutorial for Beginners", channel: "freeCodeCamp.org", category: "programming", tags: "java beginner object oriented", duration: 9.5, level: "Beginner", isNew: false, featured: true, description: "One of the most in-demand languages in the world. Great for building apps and systems." },
    { id: "vLnPwxZdW4Y", title: "C++ Full Course for Beginners", channel: "freeCodeCamp.org", category: "programming", tags: "c++ cpp beginner systems programming", duration: 4, level: "Beginner", isNew: false },
    { id: "qZXt1Aom3Cs", title: "Vue.js Crash Course", channel: "Traversy Media", category: "programming", tags: "vue javascript frontend", duration: 1.9, level: "Intermediate", isNew: false },
    { id: "sWbUDq4S6Y8", title: "Introduction to Linux – Full Course", channel: "freeCodeCamp.org", category: "programming", tags: "linux command line terminal beginner", duration: 6.1, level: "Beginner", isNew: false },

    // ── Data Science ──
    { id: "i_LwzRVP7bg", title: "Machine Learning for Everybody", channel: "freeCodeCamp.org", category: "data", tags: "machine learning ai python", duration: 3.9, level: "Intermediate", isNew: false },
    { id: "HXV3zeQKqGY", title: "SQL Full Database Course", channel: "freeCodeCamp.org", category: "data", tags: "sql database beginner", duration: 4.3, level: "Beginner", isNew: false },
    { id: "ua-CiDNNj30", title: "Data Science – Full Course for Beginners", channel: "freeCodeCamp.org", category: "data", tags: "data science python beginner", duration: 5.9, level: "Beginner", isNew: false },
    { id: "fnA-_iDV_LY", title: "Power BI Beginner Tutorial", channel: "Learn Skills Daily", category: "data", tags: "power bi business intelligence dashboard beginner", duration: 1.6, level: "Beginner", isNew: false },
    { id: "xxpc-HPKN28", title: "Statistics – Full University Course", channel: "freeCodeCamp.org", category: "data", tags: "statistics probability data science university", duration: 8.3, level: "Intermediate", isNew: false },

    // ── Design ──
    { id: "FTFaQWZBqQ8", title: "Figma UI Design in 24 Minutes", channel: "AJ&Smart", category: "design", tags: "figma ui ux design beginner", duration: 0.4, level: "Beginner", isNew: false, featured: true, description: "Design your first app screen in Figma in under half an hour — the fastest way in." },
    { id: "LxO-6rlihSg", title: "Learn Photography – Full Course", channel: "Chris Bray Photography", category: "design", tags: "photography camera beginner", duration: 2.4, level: "Beginner", isNew: false },
    { id: "IyR_uYsRdPs", title: "Photoshop for Beginners – Free Course", channel: "Envato Tuts+", category: "design", tags: "photoshop photo editing beginner", duration: 3.1, level: "Beginner", isNew: false },
    { id: "I8uWcFnh36M", title: "Canva Full Course – Beginner to Advanced", channel: "Marketing Fundas Global", category: "design", tags: "canva graphic design social media beginner", duration: 4.1, level: "Beginner", isNew: false },

    // ── Marketing ──
    { id: "R5vK1PLygHU", title: "Digital Marketing – Full Course", channel: "Intellipaat", category: "marketing", tags: "digital marketing social media ads seo beginner", duration: 10.3, level: "Beginner", isNew: true },
    { id: "xsVTqzratPs", title: "Complete SEO Course for Beginners", channel: "Ahrefs", category: "marketing", tags: "seo google digital marketing beginner", duration: 2, level: "Beginner", isNew: false },
    { id: "oyOAfnnoIyI", title: "Social Media Marketing Crash Course", channel: "Skillsiya", category: "marketing", tags: "social media marketing instagram content", duration: 0.4, level: "Beginner", isNew: false },
    { id: "FuOmpoZjZ2s", title: "Google Ads – Full Course", channel: "WsCube Tech", category: "marketing", tags: "google ads ppc advertising", duration: 8, level: "Intermediate", isNew: false },
    { id: "Go3QTwORnhY", title: "Email Marketing in 1 Hour", channel: "WsCube Tech", category: "marketing", tags: "email marketing newsletter beginner", duration: 1.2, level: "Beginner", isNew: false },

    // ── Business ──
    { id: "Vl0H-qTclOg", title: "Microsoft Excel – Full Course", channel: "freeCodeCamp.org", category: "business", tags: "excel spreadsheets business beginner", duration: 2.4, level: "Beginner", isNew: false, featured: true, description: "Master spreadsheets from basics to formulas — a skill employers ask for in almost every job." },
    { id: "UEngvxZ11sw", title: "The Foundations of Entrepreneurship", channel: "freeCodeCamp.org", category: "business", tags: "entrepreneurship startup business beginner", duration: 5.8, level: "Beginner", isNew: true },
    { id: "ic1wdDl9T44", title: "Personal Finance & Investing – Full Course", channel: "Jon Law", category: "business", tags: "personal finance money investing budgeting beginner", duration: 8.5, level: "Beginner", isNew: true },
    { id: "HQzoZfc3GwQ", title: "How to Manage Your Money (50/30/20 Rule)", channel: "WhiteBoard Finance", category: "business", tags: "personal finance budgeting money beginner", duration: 0.12, level: "Beginner", isNew: false },

    // ── Languages ──
    { id: "BskGhvTxC5Y", title: "Learn isiZulu – Conversation for Beginners", channel: "Education World", category: "language", tags: "zulu isizulu south africa language beginner", duration: 0.9, level: "Beginner", isNew: true },
    { id: "0hfr0O2Mafk", title: "Learn Afrikaans in 3 Hours", channel: "AfrikaansPod101", category: "language", tags: "afrikaans south africa language beginner", duration: 3.1, level: "Beginner", isNew: true },
    { id: "bp9OZoQu3A0", title: "Spanish for Beginners – A1 Course", channel: "freeCodeCamp.org", category: "language", tags: "spanish language beginner", duration: 10.9, level: "Beginner", isNew: false },
    { id: "_coTZxZ-H5Q", title: "French for Beginners – A1 Course", channel: "freeCodeCamp.org", category: "language", tags: "french language beginner", duration: 5.3, level: "Beginner", isNew: false },
    { id: "qMRCLH_HfUU", title: "Learn Japanese – Full Course", channel: "Japanese With Niko", category: "language", tags: "japanese hiragana katakana language beginner", duration: 2.4, level: "Beginner", isNew: false },

    // ── Music ──
    { id: "BBz-Jyr23M4", title: "Guitar Lesson 1 – Absolute Beginners", channel: "Andy Guitar", category: "music", tags: "music guitar beginner", duration: 0.27, level: "Beginner", isNew: false },
    { id: "b2VcPxlLHg4", title: "Piano Fundamentals for Absolute Beginners", channel: "Learn Piano with Jazer Lee", category: "music", tags: "music piano keyboard beginner", duration: 0.2, level: "Beginner", isNew: false }
];

const EDUZAR_CATEGORY_LABELS = {
    programming: "Programming",
    design: "Design",
    data: "Data Science",
    marketing: "Marketing",
    business: "Business",
    language: "Languages",
    music: "Music"
};

// "6.3 hrs" / "1 hr" / "25 min"
function formatDuration(hours) {
    if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
    const rounded = Math.round(hours * 10) / 10;
    return `${rounded} hr${rounded === 1 ? "" : "s"}`;
}
