// Single source of truth for Learning Paths. Each path is an ordered list of
// course IDs from courses-data.js — course/hour counts are derived in main.js,
// never hardcoded here, so they can never drift out of sync.
const EDUZAR_PATHS = [
    {
        id: "frontend-dev",
        title: "Front-End Web Developer",
        icon: "ri-code-s-slash-line",
        description: "Go from zero to building interactive, styled websites and web apps.",
        courses: ["pQN-pnXPaVg", "1Rs2ND1ryYc", "PkZNo7MFNFg", "RGOj5yH7evk", "bMknfKXIFA8", "30LWjhZzg50"]
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
        courses: ["8DvywoWv6fI", "RGOj5yH7evk", "HXV3zeQKqGY", "xxpc-HPKN28", "i_LwzRVP7bg"]
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
        courses: ["FTFaQWZBqQ8", "I8uWcFnh36M", "IyR_uYsRdPs", "LxO-6rlihSg"]
    },
    {
        id: "digital-marketer",
        title: "Digital Marketer",
        icon: "ri-megaphone-line",
        description: "Master the core channels businesses pay for: SEO, social, ads, and email.",
        courses: ["R5vK1PLygHU", "xsVTqzratPs", "oyOAfnnoIyI", "FuOmpoZjZ2s", "Go3QTwORnhY"]
    },
    {
        id: "entrepreneur",
        title: "Entrepreneur & Small Business",
        icon: "ri-briefcase-line",
        description: "Practical skills to start, run, and manage the finances of your own business.",
        courses: ["UEngvxZ11sw", "Vl0H-qTclOg", "ic1wdDl9T44", "oyOAfnnoIyI"]
    }
];
