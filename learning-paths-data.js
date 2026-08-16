// Single source of truth for Learning Paths. Each path is an ordered list of
// course IDs from courses-data.js — course/hour counts are derived in main.js,
// never hardcoded here, so they can never drift out of sync.
const EDUZAR_PATHS = [
    {
        id: "frontend-dev",
        title: "Front-End Web Developer",
        icon: "ri-code-s-slash-line",
        description: "Go from zero to building interactive, styled websites and web apps.",
        courses: ["OX9HJsJUDxA", "PkZNo7MFNFg", "RGOj5yH7evk", "bMknfKXIFA8", "30LWjhZzg50", "qZXt1Aom3Cs"]
    },
    {
        id: "backend-dev",
        title: "Back-End Developer",
        icon: "ri-server-line",
        description: "Learn server-side programming and build APIs that power real applications.",
        courses: ["PkZNo7MFNFg", "Oe421EPjeBE", "RGOj5yH7evk", "HXV3zeQKqGY", "sWbUDq4S6Y8"]
    },
    {
        id: "python-ml",
        title: "Python & Machine Learning",
        icon: "ri-terminal-box-line",
        description: "Build a strong Python foundation, then apply it to real machine learning models.",
        courses: ["kqtD5dpn9C8", "RGOj5yH7evk", "HXV3zeQKqGY", "i_LwzRVP7bg"]
    },
    {
        id: "data-analyst",
        title: "Data Analyst",
        icon: "ri-bar-chart-line",
        description: "Learn to collect, query, and visualise data for real business decisions.",
        courses: ["Vl0H-qTclOg", "HXV3zeQKqGY", "xxpc-HPKN28", "ua-CiDNNj30", "fnA-_iDV_LY"]
    },
    {
        id: "ui-ux-design",
        title: "UI/UX & Freelance Design",
        icon: "ri-palette-line",
        description: "Design professional interfaces and graphics — everything you need to freelance.",
        courses: ["FTFaQWZBqQ8", "c8KoJNTTSw0", "IyR_uYsRdPs", "LxO-6rlihSg"]
    },
    {
        id: "digital-marketer",
        title: "Digital Marketer",
        icon: "ri-megaphone-line",
        description: "Master the core channels businesses pay for: SEO, social, ads, and email.",
        courses: ["xsVTqzratPs", "SKBG1sqdyIU", "lD3plMqRmgQ", "hZskMUzgSEM"]
    },
    {
        id: "entrepreneur",
        title: "Entrepreneur & Small Business",
        icon: "ri-briefcase-line",
        description: "Practical skills to start, run, and manage the finances of your own business.",
        courses: ["8eYxMVHSJqk", "Vl0H-qTclOg", "HQzoZfc3GwQ", "SKBG1sqdyIU"]
    }
];
