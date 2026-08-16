// Single source of truth for every course. index.html (Featured) and
// courses.html (full grid) both render from this list, so a course only
// ever needs to be added/edited in one place.
const EDUZAR_COURSES = [
    { id: "kqtD5dpn9C8", title: "Python for Everybody", channel: "freeCodeCamp.org", category: "programming", tags: "python beginner", duration: 14, level: "Beginner", isNew: false, featured: true, description: "The most watched Python course online. Perfect if you've never coded before." },
    { id: "OX9HJsJUDxA", title: "Modern CSS Tutorial", channel: "The Net Ninja", category: "design", tags: "css intermediate web", duration: 8, level: "Intermediate", isNew: false },
    { id: "PkZNo7MFNFg", title: "JavaScript Full Course", channel: "freeCodeCamp.org", category: "programming", tags: "javascript beginner web", duration: 11, level: "Beginner", isNew: false },
    { id: "i_LwzRVP7bg", title: "Machine Learning with Python", channel: "freeCodeCamp.org", category: "data", tags: "machine learning python advanced", duration: 10, level: "Advanced", isNew: false },
    { id: "FTFaQWZBqQ8", title: "Figma UI Design – Full Course", channel: "Traversy Media", category: "design", tags: "figma ui ux design beginner", duration: 5, level: "Beginner", isNew: false, featured: true, description: "Learn how to design beautiful apps and websites from scratch using Figma." },
    { id: "bMknfKXIFA8", title: "React Course for Beginners", channel: "freeCodeCamp.org", category: "programming", tags: "react javascript intermediate frontend", duration: 12, level: "Intermediate", isNew: false },
    { id: "xsVTqzratPs", title: "SEO Full Course for Beginners", channel: "Ahrefs", category: "marketing", tags: "seo digital marketing beginner", duration: 4, level: "Beginner", isNew: false },
    { id: "HXV3zeQKqGY", title: "SQL Full Course", channel: "freeCodeCamp.org", category: "data", tags: "sql database beginner", duration: 4, level: "Beginner", isNew: false },
    { id: "Vl0H-qTclOg", title: "Microsoft Excel – Full Course", channel: "Kevin Stratvert", category: "business", tags: "excel business beginner", duration: 6, level: "Beginner", isNew: false, featured: true, description: "Master spreadsheets from basics to advanced formulas — essential for any career." },
    { id: "5eFjkCAbpOo", title: "Spanish for Beginners – Full Course", channel: "Dreaming Spanish", category: "language", tags: "spanish language beginner", duration: 8, level: "Beginner", isNew: false },
    { id: "RGOj5yH7evk", title: "Git & GitHub Full Course", channel: "freeCodeCamp.org", category: "programming", tags: "git github beginner version control", duration: 6, level: "Beginner", isNew: false },
    { id: "SKBG1sqdyIU", title: "Social Media Marketing Course", channel: "HubSpot Marketing", category: "marketing", tags: "social media marketing instagram content", duration: 5, level: "Beginner", isNew: false },
    { id: "30LWjhZzg50", title: "TypeScript Full Course for Beginners", channel: "freeCodeCamp.org", category: "programming", tags: "typescript javascript intermediate", duration: 8, level: "Intermediate", isNew: false },
    { id: "LxO-6rlihSg", title: "Photography Masterclass", channel: "Photo Genius", category: "design", tags: "photography beginner camera", duration: 6, level: "Beginner", isNew: false },
    { id: "ua-CiDNNj30", title: "Data Science with Python – Full Course", channel: "freeCodeCamp.org", category: "data", tags: "data science python pandas numpy beginner", duration: 12, level: "Beginner", isNew: false },
    { id: "8eYxMVHSJqk", title: "How to Start a Business – Full Course", channel: "Gillian Perkins", category: "business", tags: "entrepreneurship startup business beginner", duration: 4, level: "Beginner", isNew: false },
    { id: "sdqBOneCr0c", title: "French for Beginners – Complete Course", channel: "Learn French with Alexa", category: "language", tags: "french language beginner", duration: 7, level: "Beginner", isNew: false },
    { id: "BBz-Jyr23M4", title: "Guitar for Beginners – Full Course", channel: "Justin Guitar", category: "music", tags: "music guitar beginner", duration: 5, level: "Beginner", isNew: false },
    { id: "Oe421EPjeBE", title: "Node.js & Express – Full Course", channel: "freeCodeCamp.org", category: "programming", tags: "nodejs backend javascript intermediate", duration: 8, level: "Intermediate", isNew: false },
    { id: "lD3plMqRmgQ", title: "Google Ads Complete Course", channel: "Surfside PPC", category: "marketing", tags: "google ads ppc marketing intermediate", duration: 6, level: "Intermediate", isNew: false },
    { id: "grEKMHGYyns", title: "Java Full Course for Beginners", channel: "freeCodeCamp.org", category: "programming", tags: "java beginner object oriented", duration: 16, level: "Beginner", isNew: false, featured: true, description: "One of the most in-demand programming languages. Great for building apps and systems." },
    { id: "vLnPwxZdW4Y", title: "C++ Full Course for Beginners", channel: "freeCodeCamp.org", category: "programming", tags: "c++ beginner systems programming", duration: 31, level: "Beginner", isNew: true },
    { id: "qZXt1Aom3Cs", title: "Vue.js 3 Crash Course", channel: "Traversy Media", category: "programming", tags: "vue javascript frontend intermediate", duration: 4, level: "Intermediate", isNew: true },
    { id: "sWbUDq4S6Y8", title: "Linux Command Line – Full Course", channel: "freeCodeCamp.org", category: "programming", tags: "linux command line terminal beginner", duration: 5, level: "Beginner", isNew: true },
    { id: "IyR_uYsRdPs", title: "Photoshop for Beginners – Full Course", channel: "Bring Your Own Laptop", category: "design", tags: "photoshop photo editing beginner", duration: 5, level: "Beginner", isNew: true },
    { id: "c8KoJNTTSw0", title: "Canva for Beginners – Full Course", channel: "Canva Design School", category: "design", tags: "canva graphic design social media beginner", duration: 3, level: "Beginner", isNew: true },
    { id: "fnA-_iDV_LY", title: "Power BI – Full Course", channel: "freeCodeCamp.org", category: "data", tags: "power bi business intelligence dashboard beginner", duration: 4, level: "Beginner", isNew: true },
    { id: "xxpc-HPKN28", title: "Statistics for Data Science", channel: "freeCodeCamp.org", category: "data", tags: "statistics data science beginner probability", duration: 8, level: "Intermediate", isNew: true },
    { id: "hZskMUzgSEM", title: "Email Marketing – Full Course", channel: "HubSpot Marketing", category: "marketing", tags: "email marketing newsletter beginner", duration: 3, level: "Beginner", isNew: true },
    { id: "HQzoZfc3GwQ", title: "Personal Finance – Full Course", channel: "Graham Stephan", category: "business", tags: "personal finance money investing beginner", duration: 5, level: "Beginner", isNew: true },
    { id: "rge_wlzq3sE", title: "Japanese for Beginners – Full Course", channel: "JapanesePod101", category: "language", tags: "japanese language beginner", duration: 6, level: "Beginner", isNew: true },
    { id: "uTMCEgS2FvI", title: "Piano for Beginners – Full Course", channel: "Pianote", category: "music", tags: "piano keyboard beginner", duration: 4, level: "Beginner", isNew: true }
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
