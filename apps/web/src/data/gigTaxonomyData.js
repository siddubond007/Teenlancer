import { JOB_CATEGORIES, JOB_CATEGORIES_DATA } from './jobsCategoriesData.js';

/*
 * SkillLaunch Gig Taxonomy
 *
 * Layering:
 *   Primary category
 *      -> Subcategory
 *          -> Service type
 *
 * Skills/tags remain separate and belong to GIG-005.
 *
 * The existing marketplace taxonomy is retained as the foundation so
 * Jobs and Gigs do not drift into unrelated category names.
 */

const SERVICE_TYPES_BY_SUBCATEGORY = {
  // Development / IT
  'Frontend Development': [
    'Business website',
    'Landing page',
    'Web application interface',
    'Dashboard interface',
    'Website redesign',
    'Frontend bug fixing'
  ],
  'Backend Development': [
    'REST API development',
    'Backend application',
    'Database-backed service',
    'API integration',
    'Authentication & authorization',
    'Backend bug fixing'
  ],
  'Full Stack Development': [
    'Full-stack web application',
    'SaaS application',
    'Business web application',
    'E-commerce application',
    'MVP development',
    'Full-stack bug fixing'
  ],
  'CMS & Website Builders': [
    'WordPress website',
    'Shopify store',
    'Wix website',
    'Webflow website',
    'CMS customization',
    'CMS migration'
  ],
  'Web Management': [
    'Website maintenance',
    'Website migration',
    'Performance optimization',
    'Accessibility improvements',
    'Security maintenance',
    'Website troubleshooting'
  ],
  'Desktop & OS Development': [
    'Desktop application',
    'Windows application',
    'macOS application',
    'CLI / developer tool',
    'Browser extension',
    'Desktop application maintenance'
  ],
  'Cloud & DevOps': [
    'Cloud deployment',
    'CI/CD pipeline',
    'Docker containerization',
    'Server setup',
    'Cloud migration',
    'Infrastructure optimization'
  ],
  'Scripting & Automation': [
    'Task automation',
    'Workflow automation',
    'Web scraping',
    'Data processing script',
    'CLI automation',
    'Scheduled automation'
  ],
  'Web3 & Blockchain': [
    'Smart contract development',
    'dApp development',
    'Blockchain integration',
    'Wallet integration',
    'Token / NFT functionality',
    'Blockchain troubleshooting'
  ],
  'Cybersecurity': [
    'Security assessment',
    'Web application security review',
    'API security review',
    'Vulnerability assessment',
    'Security hardening',
    'Security remediation'
  ],
  'Low-Level & Testing': [
    'Software testing',
    'Test automation',
    'Code review',
    'Algorithm implementation',
    'Performance optimization',
    'Refactoring & cleanup'
  ],

  // Mobile
  'Android Development': [
    'Android application',
    'Android UI implementation',
    'Android feature development',
    'Android bug fixing',
    'Firebase integration',
    'Play Store preparation'
  ],
  'iOS Development': [
    'iPhone / iPad application',
    'SwiftUI interface',
    'iOS feature development',
    'iOS bug fixing',
    'Apple service integration',
    'App Store preparation'
  ],
  'Cross-Platform': [
    'Flutter application',
    'React Native application',
    'Cross-platform MVP',
    'Cross-platform UI',
    'Cross-platform bug fixing',
    'Mobile API integration'
  ],
  'App Management & Store': [
    'App testing',
    'App reskin',
    'App store optimization',
    'Push notification setup',
    'In-app purchase setup',
    'Mobile app maintenance'
  ],

  // AI / Data
  'Artificial Intelligence & LLMs': [
    'AI application',
    'LLM integration',
    'RAG application',
    'AI content system',
    'AI model integration',
    'AI workflow implementation'
  ],
  'AI Agents & Chatbots': [
    'AI chatbot',
    'AI agent',
    'Customer support bot',
    'Website chatbot',
    'WhatsApp / messaging bot',
    'AI automation agent'
  ],
  'Machine Learning & Deep Learning': [
    'Machine learning model',
    'Predictive model',
    'Classification model',
    'Regression model',
    'Recommendation system',
    'Model evaluation'
  ],
  'Computer Vision & Audio': [
    'Computer vision application',
    'Image recognition',
    'Object detection',
    'OCR solution',
    'Speech / audio AI',
    'Image processing pipeline'
  ],
  'Data Science & Analytics': [
    'Data analysis',
    'Business analytics',
    'Statistical analysis',
    'Research analysis',
    'Predictive analytics',
    'Experiment analysis'
  ],
  'Data Engineering & Databases': [
    'Data pipeline',
    'ETL / data transformation',
    'Database design',
    'Database migration',
    'Data cleaning pipeline',
    'Query optimization'
  ],
  'Data Visualization': [
    'Business dashboard',
    'Analytics dashboard',
    'Power BI dashboard',
    'Tableau dashboard',
    'KPI reporting',
    'Interactive data visualization'
  ],

  // Design
  'Graphic & Visual Design': [
    'Marketing graphic',
    'Social media design',
    'Print design',
    'Poster / flyer design',
    'Packaging design',
    'Marketing asset package'
  ],
  'Branding & Logos': [
    'Logo design',
    'Brand identity',
    'Brand style guide',
    'Business stationery',
    'Logo redesign',
    'Brand asset package'
  ],
  'UI / UX & Web Design': [
    'Website UI design',
    'Mobile app UI design',
    'Dashboard UI',
    'UX wireframes',
    'Interactive prototype',
    'Design system'
  ],
  'Illustration & Art': [
    'Digital illustration',
    'Character design',
    'Vector illustration',
    'Concept art',
    'Editorial illustration',
    'Custom artwork'
  ],
  'Presentations & Typography': [
    'PowerPoint presentation',
    'Pitch deck',
    'Investor presentation',
    'Academic presentation',
    'Presentation redesign',
    'Report / document design'
  ],
  'Fashion & Merchandise': [
    'T-shirt design',
    'Merchandise design',
    'Fashion illustration',
    'Clothing design',
    'Tech pack',
    'Pattern design'
  ],

  // Photography
  'Photography Services': [
    'Portrait photography',
    'Product photography',
    'Food photography',
    'Event photography',
    'Real estate photography',
    'Lifestyle photography'
  ],
  'Image Editing & Retouching': [
    'Photo editing',
    'Photo retouching',
    'Background removal',
    'Image restoration',
    'Color correction',
    'Photo manipulation'
  ],

  // Video / audio
  'Video Editing & Post-Production': [
    'YouTube video editing',
    'Corporate video editing',
    'Wedding video editing',
    'Travel video editing',
    'Short-form video editing',
    'Video post-production'
  ],
  'Short-Form Video': [
    'Instagram Reels',
    'TikTok videos',
    'YouTube Shorts',
    'Social media edits',
    'Video repurposing',
    'Captioned short-form video'
  ],
  'Animation & Motion Graphics': [
    '2D animation',
    '3D animation',
    'Motion graphics',
    'Explainer animation',
    'Logo animation',
    'Product animation'
  ],
  'Audio Production & Editing': [
    'Podcast editing',
    'Audio cleanup',
    'Music production',
    'Mixing & mastering',
    'Sound design',
    'Audiobook editing'
  ],
  'Voice Over & Acting': [
    'Commercial voice over',
    'Narration',
    'Character voice',
    'E-learning narration',
    'Dubbing',
    'IVR / voicemail voice over'
  ],

  // Social
  'Social Media Management': [
    'Social media management',
    'Content scheduling',
    'Social media strategy',
    'Profile optimization',
    'Engagement management',
    'Social media analytics'
  ],
  'Community Management': [
    'Discord community management',
    'Telegram community management',
    'Reddit community management',
    'Group moderation',
    'Community growth',
    'Community support'
  ],
  'Graphics for Socials': [
    'Social media post design',
    'YouTube thumbnail design',
    'Social banner design',
    'Stream graphics',
    'Ad creative',
    'Social media template package'
  ],

  // Marketing
  'Marketing Strategy': [
    'Marketing strategy',
    'Go-to-market planning',
    'Campaign planning',
    'Conversion optimization',
    'Marketing audit',
    'Growth strategy'
  ],
  'Search Engine Optimization (SEO)': [
    'SEO audit',
    'Keyword research',
    'On-page SEO',
    'Technical SEO',
    'Local SEO',
    'E-commerce SEO'
  ],
  'Paid Advertising (PPC)': [
    'Google Ads setup',
    'Meta Ads setup',
    'PPC campaign management',
    'Campaign optimization',
    'Retargeting setup',
    'PPC audit'
  ],
  'PR & Outreach': [
    'Influencer outreach',
    'Press outreach',
    'Affiliate outreach',
    'UGC coordination',
    'Online reputation support',
    'PR campaign support'
  ],

  // E-commerce
  'Amazon & Marketplaces': [
    'Amazon listing optimization',
    'Marketplace product research',
    'Amazon PPC setup',
    'Inventory / catalog support',
    'Marketplace management',
    'A+ content creation'
  ],
  'Shopify & Stores': [
    'Shopify store setup',
    'Shopify customization',
    'WooCommerce store setup',
    'E-commerce storefront',
    'Product catalog setup',
    'Store optimization'
  ],

  // Writing
  'Content & Blog Writing': [
    'Blog post writing',
    'SEO content writing',
    'Website content',
    'Article writing',
    'Content package',
    'AI-assisted content editing'
  ],
  'Copywriting & Sales': [
    'Website copy',
    'Landing page copy',
    'Email copy',
    'Ad copy',
    'Product descriptions',
    'Sales copy package'
  ],
  'Technical & Academic Writing': [
    'Technical documentation',
    'Research writing',
    'Report writing',
    'Literature review',
    'Documentation package',
    'Academic editing'
  ],
  'Medical & Scientific Writing': [
    'Scientific writing',
    'Medical writing',
    'Literature review',
    'Research summary',
    'Technical manuscript support',
    'Scientific editing'
  ],
  'Creative Writing & Scripts': [
    'Script writing',
    'Video script',
    'Story writing',
    'Ghostwriting',
    'E-book writing',
    'Creative writing package'
  ],
  'Editing & Proofreading': [
    'Proofreading',
    'Copy editing',
    'Developmental editing',
    'Fact checking',
    'Rewriting',
    'Document editing'
  ],

  // Translation
  'Translation & Localization': [
    'Document translation',
    'Website localization',
    'App localization',
    'Marketing translation',
    'Technical translation',
    'General translation'
  ],
  'Transcription & Subtitles': [
    'Audio transcription',
    'Video transcription',
    'Subtitling',
    'Captioning',
    'Real-time captioning',
    'PDF-to-text conversion'
  ],

  // Gaming
  'Game Development & Programming': [
    '2D game development',
    '3D game development',
    'Unity game',
    'Unreal game',
    'Game mechanics',
    'Game bug fixing'
  ],
  'Game Art & Level Design': [
    'Game UI design',
    '2D game art',
    '3D game assets',
    'Level design',
    'Environment design',
    'Game animation'
  ],
  'AR, VR & Metaverse': [
    'AR experience',
    'VR experience',
    'Interactive 3D experience',
    'Metaverse environment',
    'AR / VR prototype',
    'Immersive experience design'
  ],
  'Esports, Coaching & Streaming': [
    'Gameplay coaching',
    'VOD review',
    'Streaming setup',
    'Stream graphics',
    'Tournament support',
    'Esports content'
  ],

  // Admin
  'Virtual Assistance & Admin': [
    'Virtual assistant',
    'Administrative support',
    'Calendar management',
    'Document organization',
    'Research assistance',
    'Spreadsheet support'
  ],
  'Data Entry': [
    'Data entry',
    'Data cleanup',
    'Data formatting',
    'Spreadsheet data entry',
    'CRM data entry',
    'PDF data conversion'
  ],
  'Customer Support': [
    'Customer support',
    'Email support',
    'Live chat support',
    'Technical support',
    'Help desk support',
    'Order support'
  ],

  // Business
  'Finance, Accounting & Trading': [
    'Bookkeeping support',
    'Financial data preparation',
    'Expense tracking',
    'Financial modeling',
    'Budgeting support',
    'Accounting spreadsheet support'
  ],
  'HR & Recruitment': [
    'Candidate sourcing',
    'Resume screening',
    'Recruitment coordination',
    'Interview coordination',
    'HR documentation',
    'Employer branding support'
  ],
  'Business Consulting & Project Mgmt': [
    'Market research',
    'Business research',
    'Business plan support',
    'Project management support',
    'Process improvement',
    'Operations support'
  ],
  'Sales & Lead Generation': [
    'Lead generation',
    'Prospect research',
    'Appointment setting',
    'LinkedIn outreach',
    'CRM support',
    'Sales research'
  ],
  'Email Marketing': [
    'Newsletter setup',
    'Email campaign',
    'Drip campaign',
    'Email automation',
    'List segmentation',
    'Email optimization'
  ],

  // Legal
  'Contracts & Documentation': [
    'Contract drafting support',
    'Terms & conditions support',
    'Privacy policy support',
    'NDA documentation',
    'Legal document formatting',
    'Compliance documentation support'
  ],
  'Research & IP': [
    'Legal research',
    'Patent research',
    'Trademark research',
    'IP research support',
    'Research summary',
    'Document research support'
  ],

  // Engineering
  'Architecture & 3D Modeling': [
    '2D floor plan',
    '3D modeling',
    'Architectural visualization',
    'Interior design',
    '3D walkthrough',
    'CAD drafting'
  ],
  'Mechanical & Industrial Engineering': [
    'CAD design',
    'Mechanical product design',
    'Engineering drawing',
    'Prototype design',
    'DFM support',
    'Engineering analysis'
  ],
  'Electrical & Hardware Engineering': [
    'Circuit design',
    'PCB design',
    'Arduino project',
    'Embedded system',
    'Firmware development',
    'Electronics prototype'
  ],
  'Civil Engineering': [
    'Structural analysis',
    'Engineering drawings',
    'BIM support',
    'Load calculation support',
    'Survey data analysis',
    'Civil drafting'
  ],

  // Education
  'Academic Tutoring': [
    '1:1 tutoring',
    'Subject tutoring',
    'Homework guidance',
    'Exam preparation',
    'Programming tutoring',
    'Study mentoring'
  ],
  'Test & Exam Preparation': [
    'SAT preparation',
    'GRE preparation',
    'IELTS preparation',
    'Entrance exam preparation',
    'Aptitude preparation',
    'Mock test coaching'
  ],
  'Career Coaching & Personal Branding': [
    'Resume / CV coaching',
    'LinkedIn profile optimization',
    'Interview preparation',
    'Portfolio guidance',
    'Personal branding',
    'Job search coaching'
  ],
  'Life Coaching & Wellness': [
    'Goal coaching',
    'Study productivity coaching',
    'Fitness guidance',
    'Yoga instruction',
    'Meditation guidance',
    'Lifestyle coaching'
  ],

  // Events / local
  'Drones & Aerial Mapping': [
    'Drone photography',
    'Aerial mapping',
    'Photogrammetry',
    'Inspection imagery',
    'Construction site monitoring',
    'Aerial documentation'
  ],
  'Events & Travel Planning': [
    'Travel itinerary',
    'Travel research',
    'Event planning',
    'Wedding planning',
    'College event planning',
    'Virtual event support'
  ],
  'Real Estate Operations': [
    'Property listing support',
    'Real estate marketing',
    'Property photo / video',
    'Virtual staging',
    'Property data research',
    'Listing management'
  ],
  'Specialized IT & Local Jobs': [
    'Computer troubleshooting',
    'Software installation',
    'Network setup',
    'OS support',
    'Hosting / domain setup',
    'Local technical support'
  ]
};


/*
 * Additional marketplace domains.
 *
 * The original SkillLaunch job taxonomy remains intact above.
 * These domains close major marketplace coverage gaps without turning
 * every leaf service into a top-level category.
 */
const ADDITIONAL_MARKETPLACE_TAXONOMY = {
  'Music & Audio': {
    'Music Production': [
      'Beat production', 'Instrumental production', 'Song production',
      'Music arrangement', 'Music composition', 'Music production'
    ],
    'Mixing & Mastering': [
      'Audio mixing', 'Music mastering', 'Vocal mixing',
      'Stem mixing', 'Podcast mixing', 'Audio restoration'
    ],
    'Podcast & Spoken Audio': [
      'Podcast editing', 'Podcast production', 'Podcast cleanup',
      'Podcast intro/outro', 'Audiobook production', 'Spoken-word editing'
    ],
    'Sound Design': [
      'Sound effects', 'Game sound design', 'Film sound design',
      'UI sound design', 'Foley', 'Audio branding'
    ],
    'Music Performance': [
      'Session musician', 'Vocal recording', 'Instrument recording',
      'Jingles', 'Custom music', 'Music transcription'
    ]
  },

  'Telecommunications & Networking': {
    'Network Setup': [
      'Network configuration', 'Wi-Fi setup', 'Router configuration',
      'Network troubleshooting', 'LAN setup', 'Network documentation'
    ],
    'VoIP & Communication Systems': [
      'VoIP setup', 'SIP configuration', 'PBX setup',
      'Call routing', 'Business phone configuration', 'VoIP troubleshooting'
    ],
    'Network Security': [
      'Firewall configuration', 'VPN setup', 'Network security review',
      'Access control setup', 'Secure network configuration', 'Security monitoring'
    ],
    'Domain & Hosting Services': [
      'Domain setup', 'DNS configuration', 'Hosting setup',
      'SSL configuration', 'Email domain setup', 'Hosting migration'
    ]
  },

  'Health & Wellness': {
    'Fitness & Training': [
      'Workout planning', 'Personal training', 'Home fitness plan',
      'Strength training guidance', 'Fitness accountability', 'Mobility planning'
    ],
    'Nutrition & Meal Planning': [
      'Meal planning', 'Nutrition guidance', 'Meal prep planning',
      'Lifestyle nutrition planning', 'Food tracking support', 'Healthy recipe planning'
    ],
    'Mental Wellness & Lifestyle': [
      'Meditation guidance', 'Mindfulness coaching', 'Stress management',
      'Habit coaching', 'Productivity coaching', 'Wellness planning'
    ],
    'Sports & Performance': [
      'Sports coaching', 'Performance planning', 'Skill development',
      'Training plan', 'Game analysis', 'Athletic mentoring'
    ]
  },

  'Manufacturing & Product Development': {
    'Product Design': [
      'Product concept design', 'Industrial product design',
      'Consumer product design', 'Prototype design', 'Design refinement',
      'Product visualization'
    ],
    'CAD & Manufacturing Documentation': [
      'Manufacturing CAD', 'Technical drawings', 'Production drawings',
      'Bill of materials', 'Manufacturing documentation', 'Design for manufacturing'
    ],
    '3D Printing & Prototyping': [
      '3D printing preparation', 'Prototype modeling', 'Rapid prototyping',
      'Printable model design', 'Prototype refinement', '3D production files'
    ],
    'Packaging & Production Assets': [
      'Packaging design', 'Production-ready artwork',
      'Product labels', 'Die-line preparation', 'Production mockups', 'Packaging refinement'
    ],
    'Sourcing & Supplier Support': [
      'Supplier research', 'Product sourcing', 'Vendor research',
      'Manufacturing research', 'Quotation comparison', 'Supply chain research'
    ]
  },

  'Product Management & Operations': {
    'Product Strategy': [
      'Product roadmap', 'Product strategy', 'Feature prioritization',
      'Product requirements', 'MVP planning', 'Product discovery'
    ],
    'Project Management': [
      'Project planning', 'Project coordination', 'Agile planning',
      'Sprint planning', 'Project documentation', 'Delivery tracking'
    ],
    'Process & Operations': [
      'Process mapping', 'SOP creation', 'Operations documentation',
      'Workflow optimization', 'Process improvement', 'Operations research'
    ],
    'No-Code & Productivity Systems': [
      'Notion workspace', 'Airtable system', 'Zapier automation',
      'Make automation', 'Workspace setup', 'Productivity system'
    ]
  },

  'Market Research & Consumer Insights': {
    'Market Research': [
      'Market research', 'Market sizing', 'Industry research',
      'Market opportunity analysis', 'Trend research', 'Market report'
    ],
    'Competitor Research': [
      'Competitor analysis', 'Competitive intelligence',
      'Competitor benchmarking', 'Feature comparison', 'Pricing research', 'Competitor report'
    ],
    'Customer Research': [
      'Customer research', 'User interviews', 'Survey research',
      'Customer feedback analysis', 'Persona research', 'Customer insights'
    ],
    'Business Intelligence Research': [
      'Company research', 'Startup research', 'Industry intelligence',
      'Business database research', 'Lead intelligence', 'Research report'
    ]
  },

  'Public Relations & Communications': {
    'Public Relations': [
      'PR strategy', 'Press release', 'Media outreach',
      'PR research', 'Press kit', 'PR campaign support'
    ],
    'Corporate Communications': [
      'Corporate communications', 'Internal communications',
      'Executive communications', 'Company announcements', 'Communication planning', 'Messaging support'
    ],
    'Influencer & Creator Relations': [
      'Influencer outreach', 'Creator outreach', 'Partnership research',
      'Creator campaign support', 'UGC coordination', 'Influencer research'
    ]
  },

  'Resume & Career Services': {
    'Resume & CV': [
      'Resume writing', 'CV writing', 'Resume redesign',
      'ATS resume optimization', 'Resume editing', 'Academic CV'
    ],
    'LinkedIn & Professional Profiles': [
      'LinkedIn optimization', 'Professional bio', 'LinkedIn profile writing',
      'Personal branding profile', 'Professional headline', 'Profile optimization'
    ],
    'Job Search Support': [
      'Job search strategy', 'Application support', 'Cover letter',
      'Job application review', 'Portfolio review', 'Career research'
    ],
    'Interview Preparation': [
      'Mock interview', 'Technical interview preparation',
      'Behavioral interview preparation', 'Interview coaching',
      'Case interview preparation', 'Interview feedback'
    ]
  },

  'Legal & Compliance': {
    'Business Legal Support': [
      'Business document drafting', 'Terms & conditions',
      'Privacy policy', 'NDA support', 'Compliance documentation', 'Legal document formatting'
    ],
    'Intellectual Property Support': [
      'Trademark research', 'Patent research', 'Copyright research',
      'IP documentation', 'IP landscape research', 'Brand protection research'
    ],
    'Policy & Compliance Research': [
      'Policy research', 'Compliance research', 'Regulatory research',
      'Policy documentation', 'Compliance checklist', 'Risk documentation'
    ]
  },

  'Government & Nonprofit Services': {
    'Grant & Proposal Support': [
      'Grant research', 'Grant writing support', 'Proposal writing',
      'Funding research', 'Grant application editing', 'Nonprofit proposal'
    ],
    'Nonprofit Operations': [
      'Nonprofit research', 'Program documentation', 'Volunteer coordination',
      'Nonprofit communications', 'Impact report', 'Operations support'
    ],
    'Public Research': [
      'Public data research', 'Policy research', 'Government research',
      'Public records research', 'Civic research', 'Research report'
    ]
  },

  'Real Estate & Property Services': {
    'Property Marketing': [
      'Property listing', 'Real estate copywriting',
      'Property brochure', 'Property marketing assets', 'Listing optimization', 'Property research'
    ],
    'Property Visualization': [
      'Virtual staging', 'Floor plan visualization', 'Property photo editing',
      'Property video editing', '3D property visualization', 'Virtual tour'
    ],
    'Property Research & Support': [
      'Property research', 'Market research', 'Property data entry',
      'Listing management', 'Property database cleanup', 'Real estate research'
    ]
  },

  'Travel & Hospitality': {
    'Travel Planning': [
      'Custom itinerary', 'Trip planning', 'Travel research',
      'Destination research', 'Budget travel planning', 'Family trip planning'
    ],
    'Hospitality Support': [
      'Hotel listing content', 'Vacation rental listing',
      'Guest communication setup', 'Hospitality operations', 'Guest guide',
      'Hospitality research'
    ],
    'Travel Content': [
      'Travel writing', 'Travel blog', 'Travel video',
      'Destination guide', 'Travel photography', 'Travel social content'
    ]
  },

  'Food & Culinary Services': {
    'Food Content': [
      'Recipe writing', 'Food blog writing', 'Recipe photography',
      'Food video', 'Menu content', 'Food social content'
    ],
    'Food Business Support': [
      'Menu design', 'Restaurant marketing', 'Food business research',
      'Restaurant social media', 'Food product research', 'Hospitality content'
    ],
    'Cooking & Instruction': [
      'Cooking lesson', 'Recipe consultation', 'Meal planning',
      'Cooking tutorial', 'Baking instruction', 'Culinary mentoring'
    ]
  },

  'Beauty & Personal Care': {
    'Beauty Content': [
      'Beauty content writing', 'Beauty social content',
      'Makeup tutorial', 'Beauty video', 'Beauty photography', 'Product beauty content'
    ],
    'Personal Styling': [
      'Personal styling', 'Wardrobe guidance', 'Outfit planning',
      'Fashion consultation', 'Style board', 'Personal shopping research'
    ],
    'Beauty Business Support': [
      'Beauty brand research', 'Beauty product content',
      'Salon social media', 'Beauty business marketing', 'Product listing', 'Beauty marketing'
    ]
  },

  'Fashion & Apparel': {
    'Fashion Design': [
      'Fashion illustration', 'Garment design', 'Collection concept',
      'Clothing design', 'Fashion mood board', 'Technical fashion design'
    ],
    'Tech Packs & Patterns': [
      'Tech pack', 'Garment pattern', 'Size chart',
      'Production specification', 'Pattern digitization', 'Manufacturing pack'
    ],
    'Fashion Branding': [
      'Fashion logo', 'Fashion brand identity', 'Lookbook design',
      'Fashion catalog', 'Fashion social content', 'Collection presentation'
    ]
  },

  'Jewelry & Accessories': {
    'Jewelry Design': [
      'Jewelry concept', 'Jewelry CAD', 'Jewelry rendering',
      'Custom jewelry design', 'Jewelry technical drawing', 'Jewelry visualization'
    ],
    'Accessories Design': [
      'Bag design', 'Footwear design', 'Accessory design',
      'Product concept', 'Accessory technical drawing', 'Accessory visualization'
    ]
  },

  'Architecture & Interior Services': {
    'Architecture': [
      'Architectural design', 'Floor plan', 'Elevation design',
      'Architectural drafting', 'Concept design', 'Architectural presentation'
    ],
    'Interior Design': [
      'Room design', 'Interior layout', 'Space planning',
      'Interior mood board', 'Furniture layout', 'Interior visualization'
    ],
    'Landscape Design': [
      'Landscape plan', 'Garden design', 'Outdoor space design',
      'Landscape visualization', 'Planting plan', 'Landscape concept'
    ]
  },

  'Scientific & Technical Research': {
    'Scientific Research Support': [
      'Literature research', 'Research summary', 'Research review',
      'Data research', 'Technical research', 'Research documentation'
    ],
    'STEM Analysis': [
      'Statistical analysis', 'Scientific data analysis',
      'Experiment analysis', 'Technical analysis', 'Research visualization', 'Data interpretation'
    ],
    'Technical Documentation': [
      'Technical report', 'Research documentation',
      'Laboratory documentation', 'Technical specification', 'Process documentation', 'Technical editing'
    ]
  },

  'Language Learning & Linguistic Services': {
    'Language Tutoring': [
      'English tutoring', 'Hindi tutoring', 'Regional language tutoring',
      'Conversation practice', 'Pronunciation coaching', 'Language mentoring'
    ],
    'Language Assessment': [
      'Language assessment', 'Speaking practice',
      'Writing assessment', 'Grammar coaching', 'Language test preparation', 'Editing support'
    ]
  },

  'Event Production & Entertainment': {
    'Event Production': [
      'Event planning', 'Event coordination', 'Virtual event production',
      'College event production', 'Corporate event support', 'Event logistics'
    ],
    'Event Media': [
      'Event photography', 'Event videography', 'Event highlight video',
      'Event livestream', 'Event graphics', 'Event social coverage'
    ],
    'Entertainment Services': [
      'DJ service', 'Live music', 'MC / hosting',
      'Performance support', 'Entertainment planning', 'Talent coordination'
    ]
  },

  'Freight, Delivery & Transportation': {
    'Delivery & Logistics': [
      'Local delivery', 'Parcel delivery', 'Courier coordination',
      'Delivery planning', 'Logistics research', 'Route planning'
    ],
    'Transportation Research': [
      'Travel logistics research', 'Route research',
      'Fleet research', 'Transport planning', 'Shipping research', 'Logistics analysis'
    ]
  },

  'Agriculture & Environmental Services': {
    'Agriculture Support': [
      'Agricultural research', 'Crop research', 'Farm data analysis',
      'Agriculture documentation', 'Farm planning research', 'Agricultural visualization'
    ],
    'Environmental Research': [
      'Environmental research', 'Sustainability research',
      'Climate research', 'Environmental data analysis', 'Impact research', 'Sustainability report'
    ]
  },

  'Human Resources & Recruiting': {
    'Recruiting Services': [
      'Candidate sourcing', 'Resume screening', 'Recruiting research',
      'Interview coordination', 'Candidate database building', 'Recruitment support'
    ],
    'HR Documentation': [
      'HR policy', 'Employee handbook', 'Onboarding documents',
      'HR templates', 'Job descriptions', 'HR process documentation'
    ],
    'Employer Branding': [
      'Employer branding', 'Career page content',
      'Recruitment marketing', 'Job posting optimization', 'Recruitment social content', 'Hiring materials'
    ]
  },

  'Customer Experience & Support': {
    'Customer Service': [
      'Email customer support', 'Live chat support',
      'Customer service setup', 'Support documentation', 'Customer feedback', 'Order support'
    ],
    'Technical Support': [
      'Help desk support', 'Product support', 'Technical troubleshooting',
      'User support documentation', 'Support ticket handling', 'Technical customer service'
    ],
    'Customer Experience': [
      'Customer journey research', 'CX audit', 'Customer feedback analysis',
      'Support workflow', 'FAQ development', 'Customer experience research'
    ]
  },

  'App & Software Testing': {
    'Manual QA Testing': [
      'Website testing', 'Mobile app testing', 'Software testing',
      'Functional testing', 'Regression testing', 'Exploratory testing'
    ],
    'Automated Testing': [
      'Test automation', 'Browser automation testing',
      'API testing', 'End-to-end testing', 'CI test automation', 'Test framework setup'
    ],
    'Usability Testing': [
      'User testing', 'UX testing', 'Usability audit',
      'Accessibility testing', 'User feedback research', 'Conversion usability testing'
    ]
  },

  '3D Printing & Digital Fabrication': {
    '3D Modeling for Fabrication': [
      '3D printable model', 'STL preparation', 'Prototype model',
      'Product model', 'Functional part model', 'Model repair'
    ],
    'Digital Fabrication': [
      'Laser cutting design', 'CNC design files',
      'Fabrication drawings', 'Cut files', 'Manufacturing templates', 'Production preparation'
    ]
  },

  'Consulting & Professional Advisory': {
    'Business Consulting': [
      'Business consultation', 'Startup consultation',
      'Business model review', 'Strategy consultation', 'Growth consultation', 'Operations consultation'
    ],
    'Technology Consulting': [
      'Technology consultation', 'Architecture review',
      'Technical roadmap', 'Technology selection', 'Technical strategy', 'Solution assessment'
    ],
    'Creative Consulting': [
      'Brand consultation', 'Design consultation',
      'Content strategy', 'Creative direction', 'Marketing consultation', 'Creative review'
    ]
  },

  'Personal Development & Hobbies': {
    'Personal Development': [
      'Goal setting', 'Productivity coaching', 'Study planning',
      'Habit coaching', 'Time management', 'Personal development planning'
    ],
    'Creative Hobbies': [
      'Drawing lessons', 'Photography lessons', 'Writing coaching',
      'Craft guidance', 'Creative mentoring', 'Art mentoring'
    ],
    'Hobby Instruction': [
      'Music lessons', 'Gaming coaching', 'Cooking lessons',
      'Language practice', 'Creative skill coaching', 'Beginner mentoring'
    ]
  }
};

const mergeAdditionalTaxonomy = (taxonomy) => ({
  ...taxonomy,
  ...Object.fromEntries(
    Object.entries(ADDITIONAL_MARKETPLACE_TAXONOMY).map(([category, subcategories]) => [
      category,
      Object.fromEntries(
        Object.entries(subcategories).map(([subcategory, serviceTypes]) => [
          subcategory,
          serviceTypes
        ])
      )
    ])
  )
});

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const BASE_MARKETPLACE_TAXONOMY = Object.fromEntries(
  JOB_CATEGORIES.map((category) => [
    category,
    JOB_CATEGORIES_DATA[category] || {}
  ])
);

const COMPLETE_MARKETPLACE_TAXONOMY = mergeAdditionalTaxonomy(
  BASE_MARKETPLACE_TAXONOMY
);

// Final SkillLaunch category ownership.
// Existing subcategories/service types are preserved; only overlapping
// top-level ownership is consolidated.
const FINAL_CATEGORY_ALIASES = {
  'Software, Desktop & Cloud': 'Software & IT Services',
  'App & Software Testing': 'Software & IT Services',
  'Human Resources & Recruiting': 'Business, Finance & HR',
  'Admin, VA & Customer Support': 'Admin, Support & Operations',
  'Customer Experience & Support': 'Admin, Support & Operations',
  'Events, Drones & Local Services': 'Events, Travel & Local Services',
  'Event Production & Entertainment': 'Events, Travel & Local Services',
  'Language Learning & Linguistic Services': 'Education, Tutoring & Coaching',
  'Architecture & Interior Services': 'Engineering, Architecture & 3D',
  'Fashion & Apparel': 'Fashion, Jewelry & Accessories',
  'Jewelry & Accessories': 'Fashion, Jewelry & Accessories',
  'Legal Services': 'Legal & Compliance',
  'Music & Audio': 'Video, Audio & Animation',
  'Resume & Career Services': 'Career & Professional Services'
};

const FINAL_CATEGORY_ORDER = [
  'Web Development',
  'Software & IT Services',
  'Mobile App Development',
  'AI, Machine Learning & Data Science',
  'Design & Creative',
  'Photography & Image Editing',
  'Video, Audio & Animation',
  'Social Media & Community',
  'Digital Marketing & SEO',
  'E-commerce & Retail',
  'Writing & Content Creation',
  'Translation & Transcription',
  'Gaming & Esports',
  'Admin, Support & Operations',
  'Business, Finance & HR',
  'Legal & Compliance',
  'Engineering, Architecture & 3D',
  'Education, Tutoring & Coaching',
  'Events, Travel & Local Services',
  'Telecommunications & Networking',
  'Health & Wellness',
  'Manufacturing & Product Development',
  'Product Management & Operations',
  'Market Research & Consumer Insights',
  'Public Relations & Communications',
  'Career & Professional Services',
  'Government & Nonprofit Services',
  'Real Estate & Property Services',
  'Travel & Hospitality',
  'Food & Culinary Services',
  'Beauty & Personal Care',
  'Fashion, Jewelry & Accessories',
  'Scientific & Technical Research',
  'Freight, Delivery & Transportation',
  'Agriculture & Environmental Services',
  '3D Printing & Digital Fabrication',
  'Consulting & Professional Advisory',
  'Personal Development & Hobbies'
];

const FINAL_CATEGORY_MAP = new Map();

for (const [sourceCategory, subcategories] of Object.entries(
  COMPLETE_MARKETPLACE_TAXONOMY
)) {
  const targetCategory =
    FINAL_CATEGORY_ALIASES[sourceCategory] || sourceCategory;

  if (!FINAL_CATEGORY_MAP.has(targetCategory)) {
    FINAL_CATEGORY_MAP.set(targetCategory, {});
  }

  Object.assign(FINAL_CATEGORY_MAP.get(targetCategory), subcategories);
}

export const GIG_TAXONOMY = FINAL_CATEGORY_ORDER
  .filter((category) => FINAL_CATEGORY_MAP.has(category))
  .map((category) => ({
    id: slugify(category),
    name: category,
    subcategories: Object.entries(FINAL_CATEGORY_MAP.get(category)).map(
      ([subcategory, serviceTypes]) => ({
        id: `${slugify(category)}-${slugify(subcategory)}`,
        name: subcategory,
        serviceTypes: (SERVICE_TYPES_BY_SUBCATEGORY[subcategory] || serviceTypes)
          .map((serviceType) => ({
            id: `${slugify(category)}-${slugify(subcategory)}-${slugify(serviceType)}`,
            name: serviceType
          }))
      })
    )
  }));

export const GIG_CATEGORY_OPTIONS = GIG_TAXONOMY.map((category) => ({
  id: category.id,
  name: category.name
}));

export const GIG_SUBCATEGORY_OPTIONS = (categoryId) =>
  GIG_TAXONOMY.find((category) => category.id === categoryId)?.subcategories || [];

export const GIG_SERVICE_TYPE_OPTIONS = (categoryId, subcategoryId) =>
  GIG_TAXONOMY
    .find((category) => category.id === categoryId)
    ?.subcategories.find((subcategory) => subcategory.id === subcategoryId)
    ?.serviceTypes || [];
