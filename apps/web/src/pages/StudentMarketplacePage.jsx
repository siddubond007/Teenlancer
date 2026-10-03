import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { Search, Filter, DollarSign, Briefcase, ChevronLeft, ChevronRight, Globe, Languages, Sparkles } from 'lucide-react';

export default function StudentMarketplacePage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('latest');

  const [searchInput, setSearchInput] = useState('');

  const [filters, setFilters] = useState({
    q: '',
    minBudget: '',
    maxBudget: '',
    type: [],
    skills: [],
    location: '',
    language: ''
  });

  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  
  const TOP_15_SKILLS = [
    "AI Prompt Engineering & LLM Integration", "Full-Stack Web Development", "Workflow & Script Automation",
    "UI/UX & Product Design", "Short-Form Video Editing", "Search Engine Optimization (SEO)",
    "Data Analytics & Visualization", "Digital Marketing & Paid Ads", "Cybersecurity & Ethical Hacking",
    "E-commerce Store Management", "Mobile App Development", "Community Management",
    "Cloud Infrastructure & DevOps", "Specialized Copywriting", "Virtual Assistance & Operations Support"
  ];

  const RAW_SKILLS = [
    // Software, Scripting & Automation
    "Algorithm", "Android", "Android App Development", "Android SDK", "Android Studio", "API Development", "API Integration", "Automation", "Bash Scripting", "C Programming", "C# Programming", "C++ Programming", "CI/CD", "Coding", "Computer Science", "Django", "Docker", "Embedded C++", "Embedded Systems", "Express JS", "FastAPI", "Flutter", "Full Stack Development", "Git", "GitHub", "HTML", "HTML5", "Java", "JavaScript", "Kotlin", "Laravel", "Linux", "Make.com", "MATLAB", "Matlab and Mathematica", "MATLAB/Simulink", "Mobile App Development", "Mobile App Testing", "n8n", "Next.js", "Node.js", "PHP", "PostgreSQL", "Programming", "Python", "React Native", "React.js", "RESTful API", "Scripting", "Software Development", "Software Engineering", "Software Testing", "SwiftUI", "Web Application", "Web Development", "Web Scraping", "Workflow Automation",
    // AI, ML & Data
    "AI HW/SW", "AI Agents", "AI Automation", "AI Bot Development", "AI Chatbot", "AI Chatbot Development", "AI Content Creation", "AI Development", "AI Image Generation", "AI Integration", "AI Model Development", "AI Video", "Artificial Intelligence", "Chatbot Development", "Claude (Anthropic)", "Computer Vision", "Data Analysis", "Data Analytics", "Data Annotation", "Data Cleansing", "Data Engineer", "Data Extraction", "Data Labeling", "Data Processing", "Data Science", "Data Visualization", "Deep Learning", "Generative AI", "Hugging Face", "Image Analysis", "Image Processing", "LangChain", "Large Language Models (LLMs)", "LLM Prompt Engineering", "Machine Learning (ML)", "Natural Language Processing", "Neural Networks", "OpenAI", "Pandas", "Prompt Engineering", "Pytorch", "Retrieval-Augmented Generation (RAG)", "Scrapy", "TensorFlow",
    // Gaming & Esports
    "2D Game Art", "3D Game Art", "Esports", "Game AI Programming", "Game Animation", "Game Art", "Game Asset Creation", "Game Design", "Game Development", "Game Optimization", "Game Programming", "Game Testing", "Game UI", "Roblox", "Twitch", "Unity", "Unity 3D", "Unreal Engine", "Video Game Coaching", "Virtual Reality",
    // Design & Creative
    "2D Animation", "3D Animation", "3D Design", "3D Modelling", "3D Rendering", "Adobe Illustrator", "Adobe Lightroom", "Adobe Photoshop", "Adobe Premiere Pro", "After Effects", "Animation", "Audio Editing", "Blender", "Blender 3D", "Canva", "CapCut", "Character Design", "Creative Design", "DaVinci Resolve", "Digital Art", "Figma", "Final Cut Pro", "Flyer Design", "Graphic Design", "Illustration", "Logo Design", "Motion Graphics", "Music Production", "Photo Editing", "Photo Retouching", "Poster Design", "T-Shirts", "Thumbnail Design", "UI / User Interface", "UX / User Experience", "Vector Design", "Video Editing", "Video Post-editing", "Video Production", "Voice Over", "Website Design", "YouTube Video Editing",
    // Admin & Data Entry
    "Administrative Support", "Copy Typing", "Customer Service", "Customer Support", "Data Entry", "Email Handling", "Excel", "Freelance", "Google Spreadsheets", "Internet Research", "Microsoft Office", "Microsoft Word", "Order Processing", "PDF", "Spreadsheets", "Technical Support", "Telephone Handling", "Time Management", "Transcription", "Typing", "Video Upload", "Virtual Assistant", "Web Search", "Word Processing",
    // Writing & Translation
    "Academic Writing", "Article Rewriting", "Article Writing", "Blog Writing", "Coding Lesson", "Content Creation", "Content Writing", "Copy Editing", "Copywriting", "Creative Writing", "Editing", "English Translation", "English Tutoring", "Ghostwriting", "Language Tutoring", "Math Tutoring", "Proofreading", "Report Writing", "Research", "Research Writing", "Resume Writing", "Script Writing", "SEO Writing", "Technical Writing", "Translation", "Tutoring",
    // Marketing & E-commerce
    "Affiliate Marketing", "Amazon", "Content Marketing", "Digital Marketing", "Dropshipping", "Facebook Ads", "Facebook Marketing", "Google Ads", "Influencer Marketing", "Instagram", "Instagram Marketing", "Internet Marketing", "Keyword Research", "Lead Generation", "Marketing", "Reddit Marketing", "Search Engine Marketing", "SEO", "Shopify", "Shopify Development", "Social Media Management", "Social Media Marketing", "TikTok", "WooCommerce", "WordPress", "YouTube",
    // Engineering & Hardware
    "3D CAD", "3D Printing", "Arduino", "AutoCAD", "CAD / SolidWorks", "CAD/CAM", "Circuit Design", "Civil Engineering", "Drone Photography", "Drone Piloting", "Electrical Engineering", "Electronics", "Engineering Drawing", "Firmware Development", "Manufacturing Design", "Mechanical Engineering", "Microcontroller", "PCB Layout", "Solidworks",
    // Local Services
    "Car Driving", "Delivery", "Event Photography", "Food Delivery", "Local Job", "Odd Jobs", "Parcel Delivery",
    // Master List Extras
    "Vue.js", "Angular", "Svelte", "Tailwind CSS", "Bootstrap", "jQuery", "WebAssembly", "Micro-frontends", "Ruby on Rails", "Go", "Rust", "ASP.NET", "GraphQL", "MERN Stack", "MEAN Stack", "LAMP Stack", "Serverless Architecture", "SaaS Development", "Progressive Web Apps (PWAs)", "Wix", "Webflow", "Squarespace", "Magento", "Drupal", "Joomla", "Prestashop", "Ghost", "Headless CMS", "Payment Gateway Integration", "WooCommerce Customization", "Performance Optimization", "Website Migration", "Website Maintenance", "Cross-Browser Testing", "Web Security Audits", "W3C Accessibility Compliance", "iOS SDK", "Apple HealthKit Integration", "Core ML", "ARKit Implementation", "Xamarin", "Ionic", "PhoneGap", "App Reskinning", "Cordova", "Firebase Integration", "In-App Purchases", "Push Notifications", "App Store Optimization (ASO)", "Mobile Device Management (MDM)", "C", ".NET", "Electron", "Qt", "macOS Development", "Windows Forms", "WPF", "Command Line Interfaces (CLI)", "Legacy System Modernization", "Browser Extensions", "Cron Jobs", "Assembly", "Kernel Development", "Embedded Linux", "Device Drivers", "Data Structures", "Algorithm Optimization", "Code Refactoring", "Open-source Contribution", "Solidity", "Ethereum Development", "Solana Development", "Binance Smart Chain", "Polygon", "Smart Contract Auditing", "Gas Optimization", "Yul", "Decentralized Applications (dApps)", "NFT Minting Platforms", "Token Development", "DeFi Protocols", "Web3.js", "Ethers.js", "Wallet Integration", "Node Operation", "Private Blockchain Networks", "Crypto Data Analysis", "Consensus Algorithms", "Web3 Research", "IPFS Integration", "RAG Systems", "OpenAI/Gemini API Integration", "Model Fine-Tuning", "LlamaIndex", "Predictive Modeling", "Classification", "Regression", "Scikit-Learn", "Feature Engineering", "Model Evaluation", "Object Detection", "OpenCV", "Facial Recognition", "Medical Image Analysis", "Spatial Computing", "Optical Flow Analysis", "Sentiment Analysis", "Speech Recognition", "Voice Cloning", "Text-to-Speech (TTS)", "Recommendation Systems", "Image Bounding Boxes", "Audio Labeling", "AI Testing", "AI Content Generation Consulting", "Ethics & Bias Auditing", "Copy-Paste Tasks", "CRM Data Entry", "Excel Data Entry", "Image-to-Text", "PDF-to-Word", "Typing Services", "Offline Data Entry", "Deduplication", "Formatting & Cleanup", "Data Normalization", "Missing Value Imputation", "Excel Macros", "VBA", "Pattern Discovery", "Power BI", "Tableau", "Google Looker Studio", "Qlik", "Dashboard Creation", "KPI Tracking", "Reporting", "Excel Financial Models", "A/B Testing", "SPSS", "SAS", "R Programming", "ANOVA", "Hypothesis Testing", "Survey Analysis", "Research Data Analysis", "Time Series Forecasting", "Customer Churn Prediction", "Fraud Detection", "Algorithmic Trading", "Experiment Analysis", "Spatial Data Science", "MySQL", "MongoDB", "Redis", "Cassandra", "Database Architecture", "Query Optimization", "Database Migration", "Backup & Recovery", "Data Modeling", "AWS", "Google Cloud (GCP)", "Microsoft Azure", "Server Setup", "Linux/Windows Server Admin", "Kubernetes", "Server Management", "GitHub Actions", "GitLab CI", "Jenkins", "Ansible", "Infrastructure as Code (IaC)", "Terraform", "DevOps Automation", "Deployment Troubleshooting", "Cloud Optimization", "Vulnerability Assessment", "Security Auditing", "Security Monitoring", "Incident Response", "Cloud Security", "Identity & Access Management (IAM)", "Security Configuration", "Web Security", "Network Security", "Application/API Security", "Penetration Testing", "Malware Analysis", "Digital Forensics", "Secure Coding Review", "Brand Style Guides", "Business Cards", "Letterheads", "Stationery", "Typography Selection", "Brand Voice", "Flyers", "Brochures", "Posters", "Catalogs", "Menus", "Postcards", "Signage", "Trade Show Booth Design", "Roll-up Banners", "Vector Tracing", "Portraits", "Caricatures", "Children’s Book Illustration", "Editorial Illustration", "Concept Art", "Comics", "Cartoon Design", "T-Shirt & Merchandise Design", "Tattoo Design", "Pattern Design", "Packaging Design", "Label Design", "Album Cover Design", "Podcast Cover Art", "NFT Art", "Instagram Post Design", "YouTube Thumbnail Design", "Banner Ads", "Stream Graphics", "Twitch Overlays", "AR Filters & Lenses", "Sketch", "Website UI", "Mobile App UI", "Dashboard UI", "SaaS Application UI", "Design Systems", "Component Libraries", "Wireframing", "Prototyping", "User Journey Mapping", "Usability Testing", "Information Architecture", "Persona Development", "UX Research", "Interaction Design", "2D Floor Plans", "Blueprints", "Elevation Drawings", "MEP Plans", "Structural Drawings", "SketchUp", "Revit", "Interior Styling", "Landscape Design", "Room Design", "Kitchen Design", "Furniture Design", "Photorealistic Visualization", "Virtual Staging", "3D Walkthroughs", "PowerPoint", "Google Slides", "Keynote", "Pitch Decks", "Investor Decks", "Academic Presentations", "Prezi", "Custom Data Visualization", "Master Slide Engineering", "PDF Design", "Report Design", "Resume/CV Design", "Lead Magnet Formatting", "E-book Layout", "Typesetting", "Portrait Photography", "Product Photography", "Food Photography", "Fashion Photography", "Wedding Photography", "Real Estate Photography", "Travel Photography", "Sports Photography", "Lifestyle Photography", "Background Removal", "Image Restoration", "Color Correction", "Photo Manipulation", "Compositing", "Lightroom Batch Editing", "CAD Design", "Concept Generation", "Prototype Design", "DFM", "Mechanical Product Design", "3D Product Modeling", "Fashion Design", "Clothing Patterns", "Tech Packs", "Fashion Illustration", "Textile Design", "Jewelry Design", "Shoe/Accessories Design", "Personal Styling", "Apparel Styling & Fast-Fashion Consulting", "Makeup Consultation", "TikToks", "Instagram Reels", "YouTube Shorts", "Captions/Subtitles", "Trend-based Editing", "YouTube Videos (Long-form)", "Documentaries", "Wedding Videos", "Travel Vlogs", "Corporate Presentations", "Real Estate Promos", "Unboxing Videos", "Color Grading", "Green Screen Compositing", "Video Restoration", "Video Compression", "Visual Effects (VFX)", "Multi-cam Syncing", "Subtitle Translation", "Explainer Videos", "Whiteboard Animation", "Lottie Animations", "Sprite Sheets", "Traditional Frame-by-Frame Animation", "Character Animation", "Logo Animation", "Title Sequences", "Broadcast Graphics", "CGI Compositing", "App Promo Videos", "3D Product Animation", "Intro/Outro Videos", "Podcast Editing", "Audio Cleaning", "Noise Reduction", "Mixing and Mastering", "Dialogue Editing", "Audiobook Production", "Audio Ads", "Foley", "Sound Effects for Games", "Jingles", "Background Music Scoring", "Audio Restoration", "Commercial Narration", "Audiobook Narration", "Character Acting", "IVR/Voicemail", "Dubbing", "E-learning Narration", "Promotional Acting", "Beat Making", "Songwriting", "Session Musicians", "Vocal Tuning", "Music Transcription", "DJ Services", "Instrumental Production", "Godot", "Construct 3", "HTML5 Games", "2D/3D Game Development", "Game Mechanics", "Multiplayer Networking", "Level Design", "Character Design", "Environment Design", "Asset Creation", "AR Development", "VR Development", "Metaverse Experiences", "Virtual Tours", "Architectural Visualization", "Simulation Programming", "Blog Posts", "Articles", "Website Copy", "Landing Pages", "Email Sequences", "Social Media Captions", "Product Descriptions", "Direct Response Copy", "Sales Letters", "Ad Copy", "VSL Scripts", "Press Releases", "Slogan Creation", "Clinical Study Reports", "Protocols", "IND/NDA/CTA Submission Dossiers", "FDA Documentation", "Medical Device Manuals", "HEOR Writing", "HTA Submissions", "Real-World Evidence Summaries", "Pharmacoeconomic Modeling", "Drug Safety Reports", "Adverse Event Narratives", "PSURs", "Peer-Reviewed Manuscripts", "Medical Journal Articles", "Congress Abstracts", "Poster Presentations", "Slide Decks", "Literature Reviews", "Patient Education Materials", "Public Health Campaigns", "Health/Wellness Blogs", "CME Materials", "Medical News", "User Manuals", "API Documentation", "Process Documentation", "SOPs", "White Papers", "SaaS Guides", "FAQ Creation", "Engineering Reports", "Research Summaries", "Research Proposals", "Grant Writing", "Thesis Formatting", "Citation Management", "Survey Creation", "Data Collection", "Ghostwriting", "Fiction/Non-Fiction E-books", "Scriptwriting", "Speechwriting", "Poetry", "Story Outlining", "Character Development", "Developmental Editing", "Copyediting", "Line Editing", "Beta Reading", "Plagiarism Checking", "Fact-Checking", "English to Telugu Translation", "English to Hindi Translation", "English to Tamil Translation", "English to Kannada Translation", "English to Malayalam Translation", "English to Marathi Translation", "English to Bengali Translation", "English to Gujarati Translation", "English to Punjabi Translation", "English to Urdu Translation", "English to Sanskrit Translation", "Foreign Language Pairs Translation", "App Localization", "Website Localization", "Game Localization", "Subtitling", "Captioning", "Cultural Adaptation", "Audio Transcription", "Medical Transcription", "Legal Transcription", "Video Transcription", "Real-Time Captioning", "On-Page SEO", "Off-Page SEO", "Technical SEO", "Local SEO", "E-commerce SEO", "SEO Audits", "Competitor Analysis", "Bing Ads", "YouTube Ads", "Display Network", "PPC Strategy", "ROAS Optimization", "Programmatic Advertising", "Content Scheduling", "Content Planning", "Engagement Management", "Profile Setup", "Hashtag Research", "Social Media Analytics", "Discord Server Management", "Telegram Moderation", "Reddit Community Growth", "Facebook Group Moderation", "Crisis Management", "Meta Ads", "TikTok Ads", "LinkedIn Ads", "X (Twitter) Ads", "Pinterest Ads", "Pixel Integration", "Influencer Outreach", "Campaign Management", "UGC Coordination", "Affiliate Marketing Management", "Amazon Listing Optimization", "Gated Category Un-gating", "Brand Approvals", "Amazon PPC Campaigns", "A+ Content Creation", "Inventory Syncing", "Shopify Store Setup", "WooCommerce Customization", "Dropshipping Management", "Product Research", "Conversion Rate Optimization (CRO)", "Marketplace Management", "Press Release Distribution", "Media Outreach", "Online Reputation Management (ORM)", "Suppressing Negative Links", "Brand Strategy", "B2B/B2C Lead Generation", "Cold Email Research", "Appointment Setting", "LinkedIn Outreach", "CRM Management", "Sales Prospecting", "Cold Calling", "Newsletter Writing", "Drip Campaigns", "Klaviyo/Mailchimp Automation", "List Segmentation", "Email Deliverability Optimization", "Email Management", "Calendar Scheduling", "Travel Planning", "File Organization", "Document Formatting", "Spreadsheet Management", "Real Estate VA", "Medical VA", "Legal Assistant VA", "Executive Assistance", "E-commerce VA", "Live Chat Support", "Email Ticketing", "Phone/Call Support", "Help Desk Operations", "Customer Feedback Analysis", "FAQ Creation", "Bookkeeping", "QuickBooks", "Xero", "Wave Setup", "Bank Reconciliation", "Invoicing", "Expense Tracking", "Payroll Assistance", "Financial Data Entry", "Financial Modeling", "Business Valuation", "Budgeting", "Financial Forecasting", "Investment Research", "Financial Planning", "Business Finance", "Day Trading & Retail Investment Consulting", "Candidate Sourcing", "Resume Screening", "Interview Coordination", "HR Policy Drafting", "Employer Branding", "Onboarding Setup", "Employee Surveys", "Contract Drafting", "Terms of Service", "Privacy Policies", "NDA Creation", "Patent/Trademark Research", "Legal Writing", "Compliance Documentation", "Business Plan Writing", "Market Research", "Startup Pitch Decks", "Process Improvement", "Supply Chain/Logistics Consulting", "Product Strategy", "Agile/Scrum Coaching", "Asana/Jira Setup", "Timeline Management", "Team Coordination", "Resource Allocation", "Operations Consulting", "Airtable Automation", "Notion Systems", "Power Automate", "RPA", "Email Automation", "Computer Troubleshooting", "Software Installation", "Linux/Windows OS Support", "Network Topology Design", "Active Directory", "Server Troubleshooting", "Domain/Hosting Setup", "Roof Inspections", "Thermal Imaging", "Power Line/Telecom Inspection", "Solar Panel Thermography", "Construction Site Monitoring", "Disaster Relief Assessment", "LiDAR Corridor Mapping", "Photogrammetry", "Topographical Surveys", "Mining Volume Calculations", "3D Site Modeling", "Archaeological Documentation", "NDVI Crop Scouting", "Precision Spraying", "Field Mapping", "Multispectral Imaging", "Forestry & Wildlife Preservation", "Real Estate Aerials", "Cinematic FPV", "Event Coverage", "Drone Light Shows", "Public Safety", "Stock Photography (Drones)", "CATIA", "AutoDesk Inventor", "DFM", "Prototyping", "Enclosure Design", "Thermal Analysis", "Fluid Dynamics (CFD)", "Bill of Materials (BOM) Optimization", "CNC Programming", "Tooling Design", "Automotive Modifications", "HVAC Design", "Engineering Calculations", "Altium Designer", "Eagle", "Circuit Board Layout", "Schematic Capture", "Gerber File Generation", "Antenna Design", "Mixed Signal Design", "Microcontrollers", "IoT Devices", "Embedded C/C++", "FPGA Coding", "Circuit Simulation", "Structural Analysis", "Load Calculations", "Foundation Design", "Building Information Modeling (BIM)", "Surveying Data Analysis", "Engineering Technical Drawings", "Physics Tutoring", "Chemistry Tutoring", "Biology Tutoring", "Computer Science Tutoring", "Economics Tutoring", "Programming Tutoring", "Data Science Tutoring", "AI/ML Concepts Tutoring", "Regional Language Tutoring", "History Tutoring", "Literature Tutoring", "Communication Skills", "Presentation Coaching", "SAT Preparation", "GRE Preparation", "GMAT Preparation", "IELTS Preparation", "Competitive State Exams Coaching", "Engineering/Medical Entrance Exam Coaching", "Aptitude & Logical Reasoning", "CV Design", "LinkedIn Profile Optimization", "Cover Letter Writing", "Portfolio Creation", "Personal Branding", "Interview Preparation", "Job Search Assistance", "Gameplay Coaching", "VOD Review", "Rank Boosting", "In-game Resource Farming", "Speedrun Coaching", "Offerwall Game Testing", "Twitch Overlay Design", "OBS Setup", "Discord Server Architecture", "Gaming Video Highlights Editing", "Esports Content", "Tournament Organization", "Fitness Guidance", "Personal Training", "Nutrition Plans", "Yoga Instruction", "Meditation Guidance", "Life Coaching", "Relationship Coaching", "Astrology/Tarot", "Genealogy Research", "Custom Itinerary Creation", "Train & Regional Travel Itinerary Planning", "Travel Research", "Visa Application Assistance", "Destination Research", "Points & Miles Consulting", "Hotel Listing Content", "Local Tour Guiding", "Travel Photography", "Travel Blogging", "Airbnb Experience Management", "Corporate Events Planning", "Wedding Planning", "Birthday Events Planning", "College Events Planning", "Hybrid/Virtual Event Production", "Webinar Moderation", "Event Promotion", "Invitation Design", "Event Photography/Videography", "Sponsorship Deck Creation", "Event Social Media Management", "Property Listing Management", "Real Estate Marketing", "Property Photography/Video Tours", "MLS Data Scraping", "Virtual Staging", "Skip Tracing for Wholesaling"
  ];
  
  // Dedupes array to prevent any duplicate mapping keys
  const EXHAUSTIVE_SKILLS = Array.from(new Set(RAW_SKILLS));

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "just now";
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchJobs();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [filters, page]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.q) query.append('q', filters.q);
      if (filters.minBudget) query.append('minBudget', filters.minBudget);
      if (filters.maxBudget) query.append('maxBudget', filters.maxBudget);
      if (filters.location) query.append('location', filters.location);
      if (filters.language) query.append('language', filters.language);
      if (filters.type.length > 0) query.append('type', filters.type.join(','));
      if (filters.skills.length > 0) query.append('skills', filters.skills.join(','));
      query.append('page', page);
      query.append('limit', 20);

      const res = await API.get(`/jobs?${query.toString()}`);
      if (res.data.jobs) {
        setJobs(res.data.jobs);
        setPagination(res.data.pagination);
      } else {
        setJobs(res.data);
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = () => {
    setPage(1);
    setFilters(prev => ({ ...prev, q: searchInput }));
  };

  const toggleType = (val) => {
    setPage(1);
    setFilters(prev => ({
      ...prev,
      type: prev.type.includes(val) ? prev.type.filter(t => t !== val) : [...prev.type, val]
    }));
  };

  const toggleSkill = (val) => {
    setPage(1);
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(val) ? prev.skills.filter(s => s !== val) : [...prev.skills, val]
    }));
  };

  let sortedJobs = [...jobs];
  if (sortBy === 'lowest') {
    sortedJobs.sort((a, b) => (a.budget || 0) - (b.budget || 0));
  } else if (sortBy === 'highest') {
    sortedJobs.sort((a, b) => (b.budget || 0) - (a.budget || 0));
  }

  const filteredExhaustiveSkills = skillSearchQuery.trim() === '' 
    ? [] 
    : EXHAUSTIVE_SKILLS.filter(s => s.toLowerCase().includes(skillSearchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#020617] font-sans text-slate-300 pb-20 selection:bg-emerald-500/30">
      
      <div className="relative overflow-hidden bg-slate-900 border-b border-slate-800 pt-12 pb-10 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/20 to-blue-900/10 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight flex items-center gap-3">
            Discover Projects <Sparkles className="w-8 h-8 text-emerald-400 animate-pulse" />
          </h1>
          <div className="flex flex-col md:flex-row gap-4 max-w-4xl">
            <div className="relative flex-1 group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative flex items-center bg-slate-950 border border-slate-700 rounded-xl">
                <Search className="absolute left-4 text-slate-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by keywords, title, or skills..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                  className="w-full pl-12 pr-4 py-3.5 bg-transparent text-white focus:outline-none rounded-xl"
                />
              </div>
            </div>
            <button 
              onClick={handleSearchSubmit} 
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-10 py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transform hover:-translate-y-0.5"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sticky top-24 shadow-2xl">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
              <h2 className="font-bold text-lg text-white flex items-center gap-2">
                <Filter className="w-5 h-5 text-emerald-400" /> Advanced Filters
              </h2>
              <button 
                onClick={() => setFilters({q: '', minBudget: '', maxBudget: '', type: [], skills: [], location: '', language: ''})} 
                className="text-slate-400 text-xs hover:text-emerald-400 transition-colors"
              >
                Reset All
              </button>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4 text-blue-400" /> Location
              </h3>
              <select 
                value={filters.location}
                onChange={(e) => { setPage(1); setFilters({...filters, location: e.target.value}); }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-sm text-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              >
                <option value="">Anywhere (Remote & On-site)</option>
                <option value="REMOTE">Remote Only</option>
                <option value="ON_SITE">On-Site Only</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2 text-sm">
                <Languages className="w-4 h-4 text-purple-400" /> Language
              </h3>
              <select 
                value={filters.language}
                onChange={(e) => { setPage(1); setFilters({...filters, language: e.target.value}); }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-sm text-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              >
                <option value="">Any Language</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Telugu">Telugu</option>
                <option value="Tamil">Tamil</option>
                <option value="Kannada">Kannada</option>
                <option value="Malayalam">Malayalam</option>
                <option value="Marathi">Marathi</option>
                <option value="Bengali">Bengali</option>
                <option value="Gujarati">Gujarati</option>
                <option value="Punjabi">Punjabi</option>
                <option value="Urdu">Urdu</option>
                <option value="Sanskrit">Sanskrit</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Arabic">Arabic</option>
                <option value="Mandarin">Mandarin</option>
                <option value="Japanese">Japanese</option>
              </select>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-emerald-400" /> Budget Range
              </h3>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  value={filters.minBudget} 
                  onChange={(e) => { setPage(1); setFilters({...filters, minBudget: e.target.value}); }} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-white focus:border-emerald-500 outline-none transition-all" 
                  placeholder="Min ₹" 
                />
                <span className="text-slate-600">-</span>
                <input 
                  type="number" 
                  value={filters.maxBudget} 
                  onChange={(e) => { setPage(1); setFilters({...filters, maxBudget: e.target.value}); }} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-white focus:border-emerald-500 outline-none transition-all" 
                  placeholder="Max ₹" 
                />
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2 text-sm">
                <Briefcase className="w-4 h-4 text-amber-400" /> Required Skills
              </h3>
              
              <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search 800+ skills..."
                  value={skillSearchQuery}
                  onChange={(e) => setSkillSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              {/* Scrollbar hidden via arbitrary class injection */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                
                {skillSearchQuery.trim() !== '' && filteredExhaustiveSkills.length > 0 && (
                  <div className="mb-4 pb-4 border-b border-slate-800">
                    <p className="text-xs text-emerald-400 font-semibold mb-2 uppercase tracking-wider">Search Results</p>
                    {filteredExhaustiveSkills.map(skill => (
                      <label key={skill} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors border border-transparent hover:border-slate-700">
                        <input type="checkbox" checked={filters.skills.includes(skill)} onChange={() => toggleSkill(skill)} className="mt-0.5 w-4 h-4 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900" />
                        <span className="text-sm text-slate-300 leading-tight">{skill}</span>
                      </label>
                    ))}
                  </div>
                )}

                <p className="text-xs text-amber-400/80 font-semibold mb-2 uppercase tracking-wider">🔥 Top 15 Demanding Skills</p>
                {TOP_15_SKILLS.map(skill => (
                  <label key={skill} className="flex items-start gap-3 p-2 rounded-lg bg-slate-900/30 hover:bg-slate-800/80 cursor-pointer transition-all border border-slate-800/50 hover:border-emerald-500/30">
                    <input type="checkbox" checked={filters.skills.includes(skill)} onChange={() => toggleSkill(skill)} className="mt-0.5 w-4 h-4 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900" />
                    <span className="text-sm text-slate-300 leading-tight">{skill}</span>
                  </label>
                ))}
              </div>
            </div>

          </div>
        </div>

        <div className="lg:col-span-9">
          
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center text-sm shadow-lg mb-6">
            <div className="font-medium text-slate-400">
              <span className="text-white font-bold">{jobs.length > 0 ? `1-${jobs.length}` : '0'}</span> of {pagination.total > 1000 ? '1K+' : pagination.total} projects found
            </div>
            <div className="flex items-center gap-3 mt-4 sm:mt-0">
              <span className="text-slate-500">Sort by:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg py-2 px-4 outline-none focus:border-emerald-500 text-white font-medium cursor-pointer transition-colors hover:border-slate-600"
              >
                <option value="latest">⚡ Latest Projects</option>
                <option value="highest">💎 Highest Budget</option>
                <option value="lowest">📉 Lowest Budget</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="p-20 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
              </div>
            ) : sortedJobs.length === 0 ? (
              <div className="p-20 text-center bg-slate-900/30 border border-slate-800 rounded-3xl">
                <Search className="w-16 h-16 mx-auto mb-6 text-slate-700 animate-pulse" />
                <h3 className="text-2xl font-bold text-white mb-2">No projects found</h3>
                <p className="text-slate-400">Adjust your advanced filters or try a different keyword to uncover opportunities.</p>
              </div>
            ) : (
              sortedJobs.map((job) => (
                <div 
                  key={job.id} 
                  className="group relative bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-6 md:p-8 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)] hover:-translate-y-1 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mt-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex-1">
                      <Link to={`/jobs/${job.id}`} className="text-2xl font-extrabold text-white group-hover:text-emerald-400 transition-colors block leading-tight mb-3">
                        {job.title}
                      </Link>
                      
                      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold mb-4">
                        <span className={`px-3 py-1 rounded-full border ${job.projectType === 'HOURLY' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                          {job.projectType === 'HOURLY' ? 'Hourly Rate' : 'Fixed Price'}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {job.experienceLevel || 'Intermediate'}
                        </span>
                        {job.preferredLocation && (
                           <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                             <Globe className="w-3 h-3" /> {job.preferredLocation}
                           </span>
                        )}
                      </div>

                      <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed mb-6">
                        {job.description || 'No detailed description provided.'}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {job.skills && job.skills.length > 0 ? (
                          job.skills.map((skill, index) => (
                            <span key={index} className="text-xs font-bold text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 group-hover:border-slate-600 transition-colors">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs font-bold text-slate-500 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">General Request</span>
                        )}
                      </div>
                    </div>

                    <div className="w-full md:w-auto flex flex-col items-end shrink-0 border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-8">
                      <div className="text-right w-full mb-6">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Budget</p>
                        <span className="text-3xl font-black text-white group-hover:text-emerald-400 transition-colors block leading-none">
                          ₹{job.budget}
                        </span>
                        <p className="text-slate-400 text-sm mt-2 font-medium">
                          {job.bids?.length || 0} active proposals
                        </p>
                      </div>
                      
                      {/* Changed to Link that redirects straight to the form anchor */}
                      <Link
                        to={`/jobs/${job.id}#bid-form`}
                        className="w-full text-center block bg-slate-800 group-hover:bg-emerald-600 text-white text-sm font-bold py-3.5 px-8 rounded-xl transition-all duration-300 transform active:scale-95 shadow-none group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                      >
                        Bid on this project
                      </Link>
                      <p className="text-xs text-slate-500 mt-3 font-medium">Posted {timeAgo(job.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {!loading && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center mt-12 gap-4">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-6 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-300 disabled:opacity-30 hover:bg-slate-800 transition-all font-bold flex items-center gap-2 hover:-translate-x-1"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <div className="px-6 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-sm font-bold shadow-inner">
                <span className="text-white">{page}</span> / {pagination.totalPages}
              </div>
              <button
                disabled={page === pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-6 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-300 disabled:opacity-30 hover:bg-slate-800 transition-all font-bold flex items-center gap-2 hover:translate-x-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
