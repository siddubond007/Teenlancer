import { JOB_CATEGORIES_DATA } from './jobsCategoriesData.js';
import { GIG_TAXONOMY } from './gigTaxonomyData.js';

const normalizeSkill = (value) => value.trim().toLowerCase();

const curatedSkills = [
  // Existing curated SkillLaunch skills
  'React.js', 'Next.js', 'Node.js', 'Express.js', 'JavaScript (ES6+)', 'TypeScript', 'HTML5', 'CSS3', 'Tailwind CSS',
  'Bootstrap', 'Material UI', 'Chakra UI', 'Sass / SCSS', 'Vue.js', 'Nuxt.js', 'Angular', 'Svelte', 'SvelteKit',
  'Redux Toolkit', 'Zustand', 'React Query / TanStack', 'REST APIs', 'GraphQL', 'WebSockets', 'Socket.io',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Prisma ORM', 'Drizzle ORM', 'Mongoose', 'Supabase',
  'Firebase', 'AWS S3', 'Vercel', 'Netlify', 'Render', 'Docker', 'Git', 'GitHub', 'CI/CD Pipelines',

  'Python 3', 'FastAPI', 'Flask', 'Django', 'Pandas', 'NumPy', 'SciPy', 'Matplotlib', 'Seaborn', 'BeautifulSoup4',
  'Selenium Webdriver', 'Playwright', 'Scrapy', 'Web Scraping', 'Automation Scripts', 'Data Cleaning',
  'OpenAI API', 'Google Gemini API', 'Anthropic Claude API', 'LangChain', 'LlamaIndex', 'Hugging Face',
  'PyTorch', 'TensorFlow', 'Scikit-Learn', 'Computer Vision (OpenCV)', 'NLP (Natural Language Processing)',
  'AI Prompt Engineering', 'AI Chatbot Development', 'Fine-tuning Models', 'Vector Databases (Pinecone/Chroma)',

  'Flutter', 'Dart', 'React Native', 'Expo', 'Android App Development', 'iOS App Development', 'Kotlin', 'Swift',
  'SwiftUI', 'Android Studio', 'Xcode', 'Mobile UI Design', 'Push Notifications', 'App Store Submission',
  'Google Play Submission', 'In-App Purchases', 'State Management (Bloc/Riverpod/Provider)',

  'Figma', 'Adobe Illustrator', 'Adobe Photoshop', 'Adobe InDesign', 'Canva Pro', 'Minimalist Logo Design',
  '3D Logo Design', 'Brand Identity Guidelines', 'Brand Style Guides', 'Vector Illustration', 'Typography Design',
  'Packaging Design', 'Label Design', 'Poster Design', 'Flyer & Brochure Design', 'Business Card Design',
  'Merchandise & T-Shirt Design', 'Banner Ads Design', 'Icon Design', 'Vector Tracing', 'Infographic Design',

  'UI Design', 'UX Research', 'Wireframing', 'Interactive Prototyping', 'User Flow Design', 'Design Systems',
  'Mobile App UI', 'Web Dashboard UI', 'Landing Page UI', 'Micro-interactions', 'Usability Testing',
  'Heuristic Evaluation', 'Figma Auto-layout', 'Figma Components & Variants',

  'Adobe Premiere Pro', 'DaVinci Resolve', 'Final Cut Pro', 'CapCut Pro', 'Adobe After Effects', 'Motion Graphics',
  'Instagram Reels Editing', 'YouTube Shorts Editing', 'TikTok Video Editing', 'YouTube Long-form Editing',
  'Video Color Grading', 'Audio Cleanup & Mixing', 'Sound FX Design', 'Kinetic Typography', 'Animated Subtitles',
  'Green Screen & Keying', 'Video Transitions', 'Thumbnail Design', 'Podcast Video Editing', '2D Animation',

  'Blender 3D', 'Autodesk Maya', '3ds Max', 'Cinema 4D', 'ZBrush', 'Substance Painter', 'Unreal Engine 5',
  'Unity 3D', '3D Product Rendering', '3D Modeling', '3D Texturing', '3D Lighting', '3D Rigging',
  '3D Character Animation', 'Photorealistic Architecture Renders', 'Exploded View Renders', 'Hard Surface Modeling',

  'Content Writing', 'SEO Article Writing', 'Blog Post Writing', 'Website Copywriting', 'Landing Page Copy',
  'Technical Writing', 'API Documentation', 'Academic Research Writing', 'Literature Review', 'Proofreading & Editing',
  'Essay & Report Writing', 'Resume & CV Writing', 'LinkedIn Profile Optimization', 'Cold Email Copy',
  'Product Description Copy', 'Ghostwriting', 'E-book Writing', 'Scriptwriting (YouTube/Reels)', 'Social Media Captions',

  'Microsoft Excel (Advanced)', 'Google Sheets', 'Excel Formulas & VBA', 'Data Entry', 'Data Processing',
  'PDF to Excel Conversion', 'Data Extraction', 'Data Cleaning', 'Dashboard Creation', 'Power BI',
  'Tableau', 'Virtual Assistant', 'Email Management', 'Transcription (Audio/Video to Text)',

  'Mathematics Tutoring', 'Calculus & Linear Algebra', 'Physics Tutoring', 'Computer Science Tutoring',
  'Data Structures & Algorithms (DSA)', 'C++ Programming Tutoring', 'Java Programming', 'Chemistry Tutoring',
  'English Language Tutoring', 'Hindi Language Tutoring', 'Coding Interview Prep', 'Assignment Guidance'
];

const taxonomySkills = [
  ...Object.values(JOB_CATEGORIES_DATA).flatMap((subcategories) =>
    Object.values(subcategories).flat()
  ),
  ...GIG_TAXONOMY.flatMap((category) =>
    category.subcategories.flatMap((subcategory) =>
      subcategory.serviceTypes.map((serviceType) => serviceType.name)
    )
  )
];

const skillCatalog = new Map();

for (const skill of [...curatedSkills, ...taxonomySkills]) {
  if (typeof skill !== 'string' || !skill.trim()) continue;

  const trimmed = skill.trim();
  const key = normalizeSkill(trimmed);

  if (!skillCatalog.has(key)) {
    skillCatalog.set(key, trimmed);
  }
}

export const ALL_SKILLS_DATABASE = [...skillCatalog.values()];
