export const JOB_CATEGORIES = [
  "Web Development",
  "Software, Desktop & Cloud",
  "Mobile App Development",
  "AI, Machine Learning & Data Science",
  "Design & Creative",
  "Photography & Image Editing",
  "Video, Audio & Animation",
  "Social Media & Community",
  "Digital Marketing & SEO",
  "E-commerce & Retail",
  "Writing & Content Creation",
  "Translation & Transcription",
  "Gaming & Esports",
  "Admin, VA & Customer Support",
  "Business, Finance & HR",
  "Legal Services",
  "Engineering, Architecture & 3D",
  "Education, Tutoring & Coaching",
  "Events, Drones & Local Services"
];

export const JOB_CATEGORIES_DATA = {
  "Web Development": {
    "Frontend Development": ["Frontend Development", "HTML", "HTML5", "CSS", "Tailwind CSS", "Bootstrap", "JavaScript", "React.js", "Next.js", "Vue.js", "Angular", "Svelte", "jQuery", "WebAssembly", "Micro-frontends"],
    "Backend Development": ["Backend Development", "Node.js", "Express JS", "PHP", "Laravel", "Python", "Django", "FastAPI", "Ruby on Rails", "Go", "Rust", "Java", "C# Programming", ".NET", "ASP.NET", "RESTful API", "GraphQL", "API Development", "API Integration"],
    "Full Stack Development": ["Full Stack Development", "MERN Stack", "MEAN Stack", "LAMP Stack", "Web Development", "Web Application"],
    "CMS & Website Builders": ["WordPress", "Wix", "Webflow", "Squarespace", "Magento", "Drupal", "Joomla", "Prestashop", "Ghost", "Headless CMS"],
    "Web Management": ["Progressive Web Apps (PWAs)", "Website Migration", "Website Maintenance", "Performance Optimization", "Cross-Browser Testing", "W3C Accessibility Compliance", "Payment Gateway Integration"]
  },
  "Software, Desktop & Cloud": {
    "Desktop & OS Development": ["Software Development", "Software Engineering", "C", "C++ Programming", "C Programming", "Electron", "Qt", "macOS Development", "Windows Forms", "WPF", "Command Line Interfaces (CLI)", "Legacy System Modernization", "Browser Extensions"],
    "Cloud & DevOps": ["AWS", "Google Cloud (GCP)", "Microsoft Azure", "Docker", "Kubernetes", "CI/CD", "GitHub Actions", "GitLab CI", "Jenkins", "Ansible", "Infrastructure as Code (IaC)", "Terraform", "DevOps Automation", "Server Setup", "Linux/Windows Server Admin", "Server Management", "Cloud Optimization", "Deployment Troubleshooting", "Serverless Architecture", "SaaS Development"],
    "Scripting & Automation": ["Scripting", "Bash Scripting", "Automation", "Workflow Automation", "Web Scraping", "Scrapy", "n8n", "Make.com", "Cron Jobs", "Git", "GitHub"],
    "Web3 & Blockchain": ["Solidity", "Ethereum Development", "Solana Development", "Binance Smart Chain", "Polygon", "Smart Contract Auditing", "Gas Optimization", "Yul", "Decentralized Applications (dApps)", "NFT Minting Platforms", "Token Development", "DeFi Protocols", "Web3.js", "Ethers.js", "Wallet Integration", "Node Operation", "Private Blockchain Networks", "Consensus Algorithms", "Web3 Research", "IPFS Integration"],
    "Cybersecurity": ["Web Security", "Web Security Audits", "Network Security", "Application/API Security", "Penetration Testing", "Malware Analysis", "Digital Forensics", "Secure Coding Review", "Vulnerability Assessment", "Security Auditing", "Security Monitoring", "Incident Response", "Cloud Security", "Identity & Access Management (IAM)", "Security Configuration"],
    "Low-Level & Testing": ["Software Testing", "Data Structures", "Algorithm", "Algorithm Optimization", "Code Refactoring", "Open-source Contribution", "Assembly", "Kernel Development", "Embedded Linux", "Device Drivers", "Computer Science", "Coding", "Programming"]
  },
  "Mobile App Development": {
    "Android Development": ["Android", "Android App Development", "Android SDK", "Android Studio", "Kotlin", "Java"],
    "iOS Development": ["SwiftUI", "iOS SDK", "Apple HealthKit Integration", "Core ML", "ARKit Implementation"],
    "Cross-Platform": ["React Native", "Flutter", "Xamarin", "Ionic", "PhoneGap", "Cordova"],
    "App Management & Store": ["Mobile App Testing", "App Reskinning", "Firebase Integration", "In-App Purchases", "Push Notifications", "App Store Optimization (ASO)", "Mobile Device Management (MDM)"]
  },
  "AI, Machine Learning & Data Science": {
    "Artificial Intelligence & LLMs": ["Artificial Intelligence", "AI Development", "AI Integration", "Generative AI", "Large Language Models (LLMs)", "LLM Prompt Engineering", "Prompt Engineering", "OpenAI", "Claude (Anthropic)", "Hugging Face", "Retrieval-Augmented Generation (RAG)", "RAG Systems", "OpenAI/Gemini API Integration", "LlamaIndex", "Model Fine-Tuning", "AI Testing", "AI Content Generation Consulting", "Ethics & Bias Auditing"],
    "AI Agents & Chatbots": ["AI Agents", "AI Automation", "AI Bot Development", "AI Chatbot", "AI Chatbot Development", "Chatbot Development"],
    "Machine Learning & Deep Learning": ["Machine Learning (ML)", "Deep Learning", "TensorFlow", "Pytorch", "Neural Networks", "Predictive Modeling", "Classification", "Regression", "Scikit-Learn", "Feature Engineering", "Model Evaluation", "Recommendation Systems"],
    "Computer Vision & Audio": ["Computer Vision", "OpenCV", "Object Detection", "Image Analysis", "Image Processing", "Image Bounding Boxes", "Facial Recognition", "Medical Image Analysis", "Spatial Computing", "Optical Flow Analysis", "AI Image Generation", "AI Video", "Natural Language Processing", "Sentiment Analysis", "Speech Recognition", "Voice Cloning", "Text-to-Speech (TTS)", "Audio Labeling"],
    "Data Science & Analytics": ["Data Science", "Data Analysis", "Data Analytics", "Pandas", "Pattern Discovery", "A/B Testing", "SPSS", "SAS", "R Programming", "ANOVA", "Hypothesis Testing", "Survey Analysis", "Research Data Analysis", "Time Series Forecasting", "Customer Churn Prediction", "Fraud Detection", "Algorithmic Trading", "Experiment Analysis", "Spatial Data Science"],
    "Data Engineering & Databases": ["Data Engineer", "Data Extraction", "Data Processing", "Data Annotation", "Data Cleansing", "Data Labeling", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Cassandra", "Database Architecture", "Query Optimization", "Database Migration", "Backup & Recovery", "Data Modeling"],
    "Data Visualization": ["Data Visualization", "Power BI", "Tableau", "Google Looker Studio", "Qlik", "Dashboard Creation", "KPI Tracking", "Reporting"]
  },
  "Design & Creative": {
    "Graphic & Visual Design": ["Graphic Design", "Creative Design", "Flyer Design", "Poster Design", "Canva", "Adobe Illustrator", "Adobe Photoshop", "Flyers", "Brochures", "Posters", "Catalogs", "Menus", "Postcards", "Signage", "Trade Show Booth Design", "Roll-up Banners", "Packaging Design", "Label Design", "Album Cover Design", "Podcast Cover Art"],
    "Branding & Logos": ["Logo Design", "Brand Style Guides", "Business Cards", "Letterheads", "Stationery", "Typography Selection", "Brand Voice"],
    "UI / UX & Web Design": ["UI / User Interface", "UX / User Experience", "Figma", "Sketch", "Website Design", "Website UI", "Mobile App UI", "Dashboard UI", "SaaS Application UI", "Design Systems", "Component Libraries", "Wireframing", "Prototyping", "User Journey Mapping", "Usability Testing", "Information Architecture", "Persona Development", "UX Research", "Interaction Design"],
    "Illustration & Art": ["Illustration", "Digital Art", "Vector Design", "Character Design", "Vector Tracing", "Portraits", "Caricatures", "Children’s Book Illustration", "Editorial Illustration", "Concept Art", "Comics", "Cartoon Design", "Tattoo Design", "Pattern Design", "NFT Art"],
    "Presentations & Typography": ["PowerPoint", "Google Slides", "Keynote", "Pitch Decks", "Investor Decks", "Academic Presentations", "Prezi", "Custom Data Visualization", "Master Slide Engineering", "PDF Design", "Report Design", "Resume/CV Design", "Lead Magnet Formatting", "E-book Layout", "Typesetting"],
    "Fashion & Merchandise": ["T-Shirts", "T-Shirt & Merchandise Design", "Fashion Design", "Clothing Patterns", "Tech Packs", "Fashion Illustration", "Textile Design", "Jewelry Design", "Shoe/Accessories Design", "Personal Styling", "Apparel Styling & Fast-Fashion Consulting", "Makeup Consultation"]
  },
  "Photography & Image Editing": {
    "Photography Services": ["Portrait Photography", "Product Photography", "Food Photography", "Fashion Photography", "Wedding Photography", "Real Estate Photography", "Travel Photography", "Sports Photography", "Lifestyle Photography"],
    "Image Editing & Retouching": ["Photo Editing", "Photo Retouching", "Adobe Lightroom", "Background Removal", "Image Restoration", "Color Correction", "Photo Manipulation", "Compositing", "Lightroom Batch Editing", "Image-to-Text"]
  },
  "Video, Audio & Animation": {
    "Video Editing & Post-Production": ["Video Editing", "Video Production", "Video Post-editing", "Adobe Premiere Pro", "Final Cut Pro", "DaVinci Resolve", "CapCut", "YouTube Videos (Long-form)", "Documentaries", "Wedding Videos", "Travel Vlogs", "Corporate Presentations", "Real Estate Promos", "Unboxing Videos", "Color Grading", "Green Screen Compositing", "Video Restoration", "Video Compression", "Visual Effects (VFX)", "Multi-cam Syncing", "Subtitle Translation", "Video Upload"],
    "Short-Form Video": ["TikToks", "Instagram Reels", "YouTube Shorts", "Captions/Subtitles", "Trend-based Editing"],
    "Animation & Motion Graphics": ["Animation", "2D Animation", "3D Animation", "Motion Graphics", "After Effects", "Explainer Videos", "Whiteboard Animation", "Lottie Animations", "Sprite Sheets", "Traditional Frame-by-Frame Animation", "Character Animation", "Logo Animation", "Title Sequences", "Broadcast Graphics", "CGI Compositing", "App Promo Videos", "3D Product Animation", "Intro/Outro Videos"],
    "Audio Production & Editing": ["Audio Editing", "Music Production", "Podcast Editing", "Audio Cleaning", "Noise Reduction", "Mixing and Mastering", "Dialogue Editing", "Audiobook Production", "Audio Ads", "Foley", "Sound Effects for Games", "Jingles", "Background Music Scoring", "Audio Restoration", "Beat Making", "Songwriting", "Session Musicians", "Vocal Tuning", "Music Transcription", "DJ Services", "Instrumental Production"],
    "Voice Over & Acting": ["Voice Over", "Commercial Narration", "Audiobook Narration", "Character Acting", "IVR/Voicemail", "Dubbing", "E-learning Narration", "Promotional Acting"]
  },
  "Social Media & Community": {
    "Social Media Management": ["Social Media Marketing", "Social Media Management", "Instagram", "Instagram Marketing", "TikTok", "YouTube", "Reddit Marketing", "Facebook Marketing", "Content Scheduling", "Content Planning", "Engagement Management", "Profile Setup", "Hashtag Research", "Social Media Analytics"],
    "Community Management": ["Discord Server Management", "Telegram Moderation", "Reddit Community Growth", "Facebook Group Moderation", "Crisis Management"],
    "Graphics for Socials": ["Thumbnail Design", "YouTube Thumbnail Design", "Instagram Post Design", "Banner Ads", "Stream Graphics", "Twitch Overlays", "AR Filters & Lenses"]
  },
  "Digital Marketing & SEO": {
    "Marketing Strategy": ["Digital Marketing", "Marketing", "Content Marketing", "Internet Marketing", "Brand Strategy", "Campaign Management", "Conversion Rate Optimization (CRO)", "A/B Testing"],
    "Search Engine Optimization (SEO)": ["SEO", "On-Page SEO", "Off-Page SEO", "Technical SEO", "Local SEO", "E-commerce SEO", "SEO Audits", "Competitor Analysis", "Keyword Research"],
    "Paid Advertising (PPC)": ["Search Engine Marketing", "Google Ads", "Facebook Ads", "Bing Ads", "YouTube Ads", "Display Network", "PPC Strategy", "ROAS Optimization", "Programmatic Advertising", "Meta Ads", "TikTok Ads", "LinkedIn Ads", "X (Twitter) Ads", "Pinterest Ads", "Pixel Integration"],
    "PR & Outreach": ["Influencer Marketing", "Influencer Outreach", "UGC Coordination", "Affiliate Marketing", "Affiliate Marketing Management", "Press Release Distribution", "Media Outreach", "Online Reputation Management (ORM)", "Suppressing Negative Links"]
  },
  "E-commerce & Retail": {
    "Amazon & Marketplaces": ["Amazon", "Amazon Listing Optimization", "Gated Category Un-gating", "Brand Approvals", "Amazon PPC Campaigns", "A+ Content Creation", "Inventory Syncing", "Marketplace Management", "Product Research"],
    "Shopify & Stores": ["Shopify", "Shopify Store Setup", "Shopify Development", "WooCommerce", "WooCommerce Customization", "Dropshipping", "Dropshipping Management"]
  },
  "Writing & Content Creation": {
    "Content & Blog Writing": ["Content Creation", "Content Writing", "Blog Writing", "Article Writing", "SEO Writing", "Creative Writing", "Blog Posts", "Articles", "Website Copy", "AI Content Creation"],
    "Copywriting & Sales": ["Copywriting", "Landing Pages", "Email Sequences", "Social Media Captions", "Product Descriptions", "Direct Response Copy", "Sales Letters", "Ad Copy", "VSL Scripts", "Press Releases", "Slogan Creation"],
    "Technical & Academic Writing": ["Technical Writing", "Academic Writing", "Report Writing", "Research", "Research Writing", "User Manuals", "API Documentation", "Process Documentation", "SOPs", "White Papers", "SaaS Guides", "FAQ Creation", "Engineering Reports", "Research Summaries", "Research Proposals", "Grant Writing", "Thesis Formatting", "Citation Management", "Survey Creation", "Data Collection"],
    "Medical & Scientific Writing": ["Clinical Study Reports", "Protocols", "IND/NDA/CTA Submission Dossiers", "FDA Documentation", "Medical Device Manuals", "HEOR Writing", "HTA Submissions", "Real-World Evidence Summaries", "Pharmacoeconomic Modeling", "Drug Safety Reports", "Adverse Event Narratives", "PSURs", "Peer-Reviewed Manuscripts", "Medical Journal Articles", "Congress Abstracts", "Poster Presentations", "Slide Decks", "Literature Reviews", "Patient Education Materials", "Public Health Campaigns", "Health/Wellness Blogs", "CME Materials", "Medical News"],
    "Creative Writing & Scripts": ["Ghostwriting", "Fiction/Non-Fiction E-books", "Script Writing", "Scriptwriting", "Speechwriting", "Poetry", "Story Outlining", "Character Development"],
    "Editing & Proofreading": ["Editing", "Proofreading", "Copy Editing", "Article Rewriting", "Resume Writing", "Developmental Editing", "Copyediting", "Line Editing", "Beta Reading", "Plagiarism Checking", "Fact-Checking"]
  },
  "Translation & Transcription": {
    "Translation & Localization": ["Translation", "English Translation", "App Localization", "Website Localization", "Game Localization", "Cultural Adaptation", "English to Telugu Translation", "English to Hindi Translation", "English to Tamil Translation", "English to Kannada Translation", "English to Malayalam Translation", "English to Marathi Translation", "English to Bengali Translation", "English to Gujarati Translation", "English to Punjabi Translation", "English to Urdu Translation", "English to Sanskrit Translation", "Foreign Language Pairs Translation"],
    "Transcription & Subtitles": ["Transcription", "Audio Transcription", "Medical Transcription", "Legal Transcription", "Video Transcription", "Subtitling", "Captioning", "Real-Time Captioning", "PDF-to-Word"]
  },
  "Gaming & Esports": {
    "Game Development & Programming": ["Game Development", "Game Programming", "Unity", "Unity 3D", "Unreal Engine", "Godot", "Construct 3", "HTML5 Games", "2D/3D Game Development", "Game Mechanics", "Multiplayer Networking", "Game AI Programming", "Game Optimization", "Game Testing", "Roblox"],
    "Game Art & Level Design": ["Game Design", "Game Art", "2D Game Art", "3D Game Art", "Game Asset Creation", "Game UI", "Game Animation", "Level Design", "Environment Design", "Asset Creation"],
    "AR, VR & Metaverse": ["AR Development", "VR Development", "Virtual Reality", "Metaverse Experiences"],
    "Esports, Coaching & Streaming": ["Esports", "Twitch", "Video Game Coaching", "Gameplay Coaching", "VOD Review", "Rank Boosting", "In-game Resource Farming", "Speedrun Coaching", "Offerwall Game Testing", "OBS Setup", "Discord Server Architecture", "Gaming Video Highlights Editing", "Esports Content", "Tournament Organization"]
  },
  "Admin, VA & Customer Support": {
    "Virtual Assistance & Admin": ["Virtual Assistant", "Administrative Support", "Executive Assistance", "Real Estate VA", "Medical VA", "Legal Assistant VA", "E-commerce VA", "Calendar Scheduling", "File Organization", "Document Formatting", "Spreadsheet Management", "Microsoft Office", "Microsoft Word", "Excel", "Spreadsheets", "Google Spreadsheets", "Excel Macros", "VBA", "Time Management", "Internet Research", "Web Search", "Word Processing", "PDF"],
    "Data Entry": ["Data Entry", "Copy Typing", "Typing", "Offline Data Entry", "Deduplication", "Formatting & Cleanup", "Data Normalization", "Missing Value Imputation", "Copy-Paste Tasks", "CRM Data Entry", "Excel Data Entry"],
    "Customer Support": ["Customer Service", "Customer Support", "Technical Support", "Telephone Handling", "Live Chat Support", "Email Ticketing", "Phone/Call Support", "Help Desk Operations", "Customer Feedback Analysis", "Order Processing", "Email Handling"]
  },
  "Business, Finance & HR": {
    "Finance, Accounting & Trading": ["Bookkeeping", "QuickBooks", "Xero", "Wave Setup", "Bank Reconciliation", "Invoicing", "Expense Tracking", "Payroll Assistance", "Financial Data Entry", "Financial Modeling", "Business Valuation", "Budgeting", "Financial Forecasting", "Investment Research", "Financial Planning", "Business Finance", "Day Trading & Retail Investment Consulting", "Excel Financial Models"],
    "HR & Recruitment": ["Candidate Sourcing", "Resume Screening", "Interview Coordination", "HR Policy Drafting", "Employer Branding", "Onboarding Setup", "Employee Surveys", "Team Coordination", "Resource Allocation"],
    "Business Consulting & Project Mgmt": ["Business Plan Writing", "Market Research", "Startup Pitch Decks", "Process Improvement", "Supply Chain/Logistics Consulting", "Product Strategy", "Agile/Scrum Coaching", "Asana/Jira Setup", "Timeline Management", "Operations Consulting", "Airtable Automation", "Notion Systems", "Power Automate", "RPA", "Email Automation", "Freelance"],
    "Sales & Lead Generation": ["Lead Generation", "B2B/B2C Lead Generation", "Cold Email Research", "Appointment Setting", "LinkedIn Outreach", "CRM Management", "Sales Prospecting", "Cold Calling"],
    "Email Marketing": ["Newsletter Writing", "Drip Campaigns", "Klaviyo/Mailchimp Automation", "List Segmentation", "Email Deliverability Optimization", "Email Management"]
  },
  "Legal Services": {
    "Contracts & Documentation": ["Contract Drafting", "Terms of Service", "Privacy Policies", "NDA Creation", "Legal Writing", "Compliance Documentation"],
    "Research & IP": ["Patent/Trademark Research"]
  },
  "Engineering, Architecture & 3D": {
    "Architecture & 3D Modeling": ["3D CAD", "3D Modelling", "3D Printing", "AutoCAD", "CAD / SolidWorks", "Solidworks", "SketchUp", "Revit", "2D Floor Plans", "Blueprints", "Elevation Drawings", "MEP Plans", "Structural Drawings", "Interior Styling", "Landscape Design", "Room Design", "Kitchen Design", "Furniture Design", "Photorealistic Visualization", "Virtual Staging", "3D Walkthroughs", "Architectural Visualization", "Simulation Programming", "Virtual Tours"],
    "Mechanical & Industrial Engineering": ["Mechanical Engineering", "Manufacturing Design", "Engineering Drawing", "CAD/CAM", "CAD Design", "Concept Generation", "Prototype Design", "DFM", "Mechanical Product Design", "3D Product Modeling", "CATIA", "AutoDesk Inventor", "Prototyping", "Enclosure Design", "Thermal Analysis", "Fluid Dynamics (CFD)", "Bill of Materials (BOM) Optimization", "CNC Programming", "Tooling Design", "Automotive Modifications", "HVAC Design", "Engineering Calculations"],
    "Electrical & Hardware Engineering": ["Electrical Engineering", "Electronics", "Circuit Design", "PCB Layout", "Microcontroller", "Arduino", "Firmware Development", "Altium Designer", "Eagle", "Circuit Board Layout", "Schematic Capture", "Gerber File Generation", "Antenna Design", "Mixed Signal Design", "Microcontrollers", "IoT Devices", "Embedded C/C++", "Embedded C++", "Embedded Systems", "FPGA Coding", "Circuit Simulation", "MATLAB", "Matlab and Mathematica", "MATLAB/Simulink"],
    "Civil Engineering": ["Civil Engineering", "Structural Analysis", "Load Calculations", "Foundation Design", "Building Information Modeling (BIM)", "Surveying Data Analysis", "Engineering Technical Drawings"]
  },
  "Education, Tutoring & Coaching": {
    "Academic Tutoring": ["Tutoring", "Math Tutoring", "English Tutoring", "Language Tutoring", "Physics Tutoring", "Chemistry Tutoring", "Biology Tutoring", "Computer Science Tutoring", "Economics Tutoring", "Programming Tutoring", "Data Science Tutoring", "AI/ML Concepts Tutoring", "Regional Language Tutoring", "History Tutoring", "Literature Tutoring", "Coding Lesson"],
    "Test & Exam Preparation": ["SAT Preparation", "GRE Preparation", "GMAT Preparation", "IELTS Preparation", "Competitive State Exams Coaching", "Engineering/Medical Entrance Exam Coaching", "Aptitude & Logical Reasoning"],
    "Career Coaching & Personal Branding": ["CV Design", "LinkedIn Profile Optimization", "Cover Letter Writing", "Portfolio Creation", "Personal Branding", "Interview Preparation", "Job Search Assistance", "Communication Skills", "Presentation Coaching"],
    "Life Coaching & Wellness": ["Life Coaching", "Relationship Coaching", "Fitness Guidance", "Personal Training", "Nutrition Plans", "Yoga Instruction", "Meditation Guidance", "Astrology/Tarot"]
  },
  "Events, Drones & Local Services": {
    "Drones & Aerial Mapping": ["Drone Piloting", "Drone Photography", "Roof Inspections", "Thermal Imaging", "Power Line/Telecom Inspection", "Solar Panel Thermography", "Construction Site Monitoring", "Disaster Relief Assessment", "LiDAR Corridor Mapping", "Photogrammetry", "Topographical Surveys", "Mining Volume Calculations", "3D Site Modeling", "Archaeological Documentation", "NDVI Crop Scouting", "Precision Spraying", "Field Mapping", "Multispectral Imaging", "Forestry & Wildlife Preservation", "Real Estate Aerials", "Cinematic FPV", "Drone Light Shows", "Public Safety", "Stock Photography (Drones)"],
    "Events & Travel Planning": ["Travel Planning", "Genealogy Research", "Custom Itinerary Creation", "Train & Regional Travel Itinerary Planning", "Travel Research", "Visa Application Assistance", "Destination Research", "Points & Miles Consulting", "Hotel Listing Content", "Local Tour Guiding", "Travel Photography", "Travel Blogging", "Airbnb Experience Management", "Corporate Events Planning", "Wedding Planning", "Birthday Events Planning", "College Events Planning", "Hybrid/Virtual Event Production", "Webinar Moderation", "Event Promotion", "Invitation Design", "Event Photography/Videography", "Sponsorship Deck Creation", "Event Social Media Management", "Event Coverage"],
    "Real Estate Operations": ["Property Listing Management", "Real Estate Marketing", "Property Photography/Video Tours", "MLS Data Scraping", "Virtual Staging", "Skip Tracing for Wholesaling"],
    "Specialized IT & Local Jobs": ["Computer Troubleshooting", "Software Installation", "Linux/Windows OS Support", "Network Topology Design", "Active Directory", "Server Troubleshooting", "Domain/Hosting Setup", "Local Job", "Odd Jobs", "Delivery", "Food Delivery", "Parcel Delivery", "Car Driving", "Event Photography"]
  }
};

// Flatten the entire dictionary into a single alphabetical array of unique skills
export const ALL_SKILLS = Array.from(new Set(
  Object.values(JOB_CATEGORIES_DATA).flatMap(category =>
    Object.values(category).flatMap(skills => skills)
  )
)).sort();
