package com.skilllaunch.app.feature.onboarding

internal data class StudentOnboardingSkill(
    val id: String,
    val title: String
)

internal val STUDENT_ONBOARDING_SKILLS_BY_DOMAIN: Map<String, List<StudentOnboardingSkill>> = mapOf(
    "Web Development" to listOf(
        StudentOnboardingSkill("web-development-frontend-development", "Frontend Development"),
        StudentOnboardingSkill("web-development-backend-development", "Backend Development"),
        StudentOnboardingSkill("web-development-full-stack-development", "Full Stack Development"),
        StudentOnboardingSkill("web-development-cms-website-builders", "CMS & Website Builders"),
        StudentOnboardingSkill("web-development-web-management", "Web Management")
    ),
    "Software & IT Services" to listOf(
        StudentOnboardingSkill("software-it-services-desktop-os-development", "Desktop & OS Development"),
        StudentOnboardingSkill("software-it-services-cloud-devops", "Cloud & DevOps"),
        StudentOnboardingSkill("software-it-services-scripting-automation", "Scripting & Automation"),
        StudentOnboardingSkill("software-it-services-web3-blockchain", "Web3 & Blockchain"),
        StudentOnboardingSkill("software-it-services-cybersecurity", "Cybersecurity"),
        StudentOnboardingSkill("software-it-services-low-level-testing", "Low-Level & Testing"),
        StudentOnboardingSkill("software-it-services-manual-qa-testing", "Manual QA Testing"),
        StudentOnboardingSkill("software-it-services-automated-testing", "Automated Testing"),
        StudentOnboardingSkill("software-it-services-usability-testing", "Usability Testing")
    ),
    "Mobile App Development" to listOf(
        StudentOnboardingSkill("mobile-app-development-android-development", "Android Development"),
        StudentOnboardingSkill("mobile-app-development-ios-development", "iOS Development"),
        StudentOnboardingSkill("mobile-app-development-cross-platform", "Cross-Platform"),
        StudentOnboardingSkill("mobile-app-development-app-management-store", "App Management & Store")
    ),
    "AI, Machine Learning & Data Science" to listOf(
        StudentOnboardingSkill("ai-machine-learning-data-science-artificial-intelligence-llms", "Artificial Intelligence & LLMs"),
        StudentOnboardingSkill("ai-machine-learning-data-science-ai-agents-chatbots", "AI Agents & Chatbots"),
        StudentOnboardingSkill("ai-machine-learning-data-science-machine-learning-deep-learning", "Machine Learning & Deep Learning"),
        StudentOnboardingSkill("ai-machine-learning-data-science-computer-vision-audio", "Computer Vision & Audio"),
        StudentOnboardingSkill("ai-machine-learning-data-science-data-science-analytics", "Data Science & Analytics"),
        StudentOnboardingSkill("ai-machine-learning-data-science-data-engineering-databases", "Data Engineering & Databases"),
        StudentOnboardingSkill("ai-machine-learning-data-science-data-visualization", "Data Visualization")
    ),
    "Design & Creative" to listOf(
        StudentOnboardingSkill("design-creative-graphic-visual-design", "Graphic & Visual Design"),
        StudentOnboardingSkill("design-creative-branding-logos", "Branding & Logos"),
        StudentOnboardingSkill("design-creative-ui-ux-web-design", "UI / UX & Web Design"),
        StudentOnboardingSkill("design-creative-illustration-art", "Illustration & Art"),
        StudentOnboardingSkill("design-creative-presentations-typography", "Presentations & Typography"),
        StudentOnboardingSkill("design-creative-fashion-merchandise", "Fashion & Merchandise")
    ),
    "Photography & Image Editing" to listOf(
        StudentOnboardingSkill("photography-image-editing-photography-services", "Photography Services"),
        StudentOnboardingSkill("photography-image-editing-image-editing-retouching", "Image Editing & Retouching")
    ),
    "Video, Audio & Animation" to listOf(
        StudentOnboardingSkill("video-audio-animation-video-editing-post-production", "Video Editing & Post-Production"),
        StudentOnboardingSkill("video-audio-animation-short-form-video", "Short-Form Video"),
        StudentOnboardingSkill("video-audio-animation-animation-motion-graphics", "Animation & Motion Graphics"),
        StudentOnboardingSkill("video-audio-animation-audio-production-editing", "Audio Production & Editing"),
        StudentOnboardingSkill("video-audio-animation-voice-over-acting", "Voice Over & Acting"),
        StudentOnboardingSkill("video-audio-animation-music-production", "Music Production"),
        StudentOnboardingSkill("video-audio-animation-mixing-mastering", "Mixing & Mastering"),
        StudentOnboardingSkill("video-audio-animation-podcast-spoken-audio", "Podcast & Spoken Audio"),
        StudentOnboardingSkill("video-audio-animation-sound-design", "Sound Design"),
        StudentOnboardingSkill("video-audio-animation-music-performance", "Music Performance")
    ),
    "Social Media & Community" to listOf(
        StudentOnboardingSkill("social-media-community-social-media-management", "Social Media Management"),
        StudentOnboardingSkill("social-media-community-community-management", "Community Management"),
        StudentOnboardingSkill("social-media-community-graphics-for-socials", "Graphics for Socials")
    ),
    "Digital Marketing & SEO" to listOf(
        StudentOnboardingSkill("digital-marketing-seo-marketing-strategy", "Marketing Strategy"),
        StudentOnboardingSkill("digital-marketing-seo-search-engine-optimization-seo", "Search Engine Optimization (SEO)"),
        StudentOnboardingSkill("digital-marketing-seo-paid-advertising-ppc", "Paid Advertising (PPC)"),
        StudentOnboardingSkill("digital-marketing-seo-pr-outreach", "PR & Outreach")
    ),
    "E-commerce & Retail" to listOf(
        StudentOnboardingSkill("e-commerce-retail-amazon-marketplaces", "Amazon & Marketplaces"),
        StudentOnboardingSkill("e-commerce-retail-shopify-stores", "Shopify & Stores")
    ),
    "Writing & Content Creation" to listOf(
        StudentOnboardingSkill("writing-content-creation-content-blog-writing", "Content & Blog Writing"),
        StudentOnboardingSkill("writing-content-creation-copywriting-sales", "Copywriting & Sales"),
        StudentOnboardingSkill("writing-content-creation-technical-academic-writing", "Technical & Academic Writing"),
        StudentOnboardingSkill("writing-content-creation-medical-scientific-writing", "Medical & Scientific Writing"),
        StudentOnboardingSkill("writing-content-creation-creative-writing-scripts", "Creative Writing & Scripts"),
        StudentOnboardingSkill("writing-content-creation-editing-proofreading", "Editing & Proofreading")
    ),
    "Translation & Transcription" to listOf(
        StudentOnboardingSkill("translation-transcription-translation-localization", "Translation & Localization"),
        StudentOnboardingSkill("translation-transcription-transcription-subtitles", "Transcription & Subtitles")
    ),
    "Gaming & Esports" to listOf(
        StudentOnboardingSkill("gaming-esports-game-development-programming", "Game Development & Programming"),
        StudentOnboardingSkill("gaming-esports-game-art-level-design", "Game Art & Level Design"),
        StudentOnboardingSkill("gaming-esports-ar-vr-metaverse", "AR, VR & Metaverse"),
        StudentOnboardingSkill("gaming-esports-esports-coaching-streaming", "Esports, Coaching & Streaming")
    ),
    "Admin, Support & Operations" to listOf(
        StudentOnboardingSkill("admin-support-operations-virtual-assistance-admin", "Virtual Assistance & Admin"),
        StudentOnboardingSkill("admin-support-operations-data-entry", "Data Entry"),
        StudentOnboardingSkill("admin-support-operations-customer-support", "Customer Support"),
        StudentOnboardingSkill("admin-support-operations-customer-service", "Customer Service"),
        StudentOnboardingSkill("admin-support-operations-technical-support", "Technical Support"),
        StudentOnboardingSkill("admin-support-operations-customer-experience", "Customer Experience")
    ),
    "Business, Finance & HR" to listOf(
        StudentOnboardingSkill("business-finance-hr-finance-accounting-trading", "Finance, Accounting & Trading"),
        StudentOnboardingSkill("business-finance-hr-hr-recruitment", "HR & Recruitment"),
        StudentOnboardingSkill("business-finance-hr-business-consulting-project-mgmt", "Business Consulting & Project Mgmt"),
        StudentOnboardingSkill("business-finance-hr-sales-lead-generation", "Sales & Lead Generation"),
        StudentOnboardingSkill("business-finance-hr-email-marketing", "Email Marketing"),
        StudentOnboardingSkill("business-finance-hr-recruiting-services", "Recruiting Services"),
        StudentOnboardingSkill("business-finance-hr-hr-documentation", "HR Documentation"),
        StudentOnboardingSkill("business-finance-hr-employer-branding", "Employer Branding")
    ),
    "Legal & Compliance" to listOf(
        StudentOnboardingSkill("legal-compliance-contracts-documentation", "Contracts & Documentation"),
        StudentOnboardingSkill("legal-compliance-research-ip", "Research & IP"),
        StudentOnboardingSkill("legal-compliance-business-legal-support", "Business Legal Support"),
        StudentOnboardingSkill("legal-compliance-intellectual-property-support", "Intellectual Property Support"),
        StudentOnboardingSkill("legal-compliance-policy-compliance-research", "Policy & Compliance Research")
    ),
    "Engineering, Architecture & 3D" to listOf(
        StudentOnboardingSkill("engineering-architecture-3d-architecture-3d-modeling", "Architecture & 3D Modeling"),
        StudentOnboardingSkill("engineering-architecture-3d-mechanical-industrial-engineering", "Mechanical & Industrial Engineering"),
        StudentOnboardingSkill("engineering-architecture-3d-electrical-hardware-engineering", "Electrical & Hardware Engineering"),
        StudentOnboardingSkill("engineering-architecture-3d-civil-engineering", "Civil Engineering"),
        StudentOnboardingSkill("engineering-architecture-3d-architecture", "Architecture"),
        StudentOnboardingSkill("engineering-architecture-3d-interior-design", "Interior Design"),
        StudentOnboardingSkill("engineering-architecture-3d-landscape-design", "Landscape Design")
    ),
    "Education, Tutoring & Coaching" to listOf(
        StudentOnboardingSkill("education-tutoring-coaching-academic-tutoring", "Academic Tutoring"),
        StudentOnboardingSkill("education-tutoring-coaching-test-exam-preparation", "Test & Exam Preparation"),
        StudentOnboardingSkill("education-tutoring-coaching-career-coaching-personal-branding", "Career Coaching & Personal Branding"),
        StudentOnboardingSkill("education-tutoring-coaching-life-coaching-wellness", "Life Coaching & Wellness"),
        StudentOnboardingSkill("education-tutoring-coaching-language-tutoring", "Language Tutoring"),
        StudentOnboardingSkill("education-tutoring-coaching-language-assessment", "Language Assessment")
    ),
    "Events, Travel & Local Services" to listOf(
        StudentOnboardingSkill("events-travel-local-services-drones-aerial-mapping", "Drones & Aerial Mapping"),
        StudentOnboardingSkill("events-travel-local-services-events-travel-planning", "Events & Travel Planning"),
        StudentOnboardingSkill("events-travel-local-services-real-estate-operations", "Real Estate Operations"),
        StudentOnboardingSkill("events-travel-local-services-specialized-it-local-jobs", "Specialized IT & Local Jobs"),
        StudentOnboardingSkill("events-travel-local-services-event-production", "Event Production"),
        StudentOnboardingSkill("events-travel-local-services-event-media", "Event Media"),
        StudentOnboardingSkill("events-travel-local-services-entertainment-services", "Entertainment Services")
    ),
    "Telecommunications & Networking" to listOf(
        StudentOnboardingSkill("telecommunications-networking-network-setup", "Network Setup"),
        StudentOnboardingSkill("telecommunications-networking-voip-communication-systems", "VoIP & Communication Systems"),
        StudentOnboardingSkill("telecommunications-networking-network-security", "Network Security"),
        StudentOnboardingSkill("telecommunications-networking-domain-hosting-services", "Domain & Hosting Services")
    ),
    "Health & Wellness" to listOf(
        StudentOnboardingSkill("health-wellness-fitness-training", "Fitness & Training"),
        StudentOnboardingSkill("health-wellness-nutrition-meal-planning", "Nutrition & Meal Planning"),
        StudentOnboardingSkill("health-wellness-mental-wellness-lifestyle", "Mental Wellness & Lifestyle"),
        StudentOnboardingSkill("health-wellness-sports-performance", "Sports & Performance")
    ),
    "Manufacturing & Product Development" to listOf(
        StudentOnboardingSkill("manufacturing-product-development-product-design", "Product Design"),
        StudentOnboardingSkill("manufacturing-product-development-cad-manufacturing-documentation", "CAD & Manufacturing Documentation"),
        StudentOnboardingSkill("manufacturing-product-development-3d-printing-prototyping", "3D Printing & Prototyping"),
        StudentOnboardingSkill("manufacturing-product-development-packaging-production-assets", "Packaging & Production Assets"),
        StudentOnboardingSkill("manufacturing-product-development-sourcing-supplier-support", "Sourcing & Supplier Support")
    ),
    "Product Management & Operations" to listOf(
        StudentOnboardingSkill("product-management-operations-product-strategy", "Product Strategy"),
        StudentOnboardingSkill("product-management-operations-project-management", "Project Management"),
        StudentOnboardingSkill("product-management-operations-process-operations", "Process & Operations"),
        StudentOnboardingSkill("product-management-operations-no-code-productivity-systems", "No-Code & Productivity Systems")
    ),
    "Market Research & Consumer Insights" to listOf(
        StudentOnboardingSkill("market-research-consumer-insights-market-research", "Market Research"),
        StudentOnboardingSkill("market-research-consumer-insights-competitor-research", "Competitor Research"),
        StudentOnboardingSkill("market-research-consumer-insights-customer-research", "Customer Research"),
        StudentOnboardingSkill("market-research-consumer-insights-business-intelligence-research", "Business Intelligence Research")
    ),
    "Public Relations & Communications" to listOf(
        StudentOnboardingSkill("public-relations-communications-public-relations", "Public Relations"),
        StudentOnboardingSkill("public-relations-communications-corporate-communications", "Corporate Communications"),
        StudentOnboardingSkill("public-relations-communications-influencer-creator-relations", "Influencer & Creator Relations")
    ),
    "Career & Professional Services" to listOf(
        StudentOnboardingSkill("career-professional-services-resume-cv", "Resume & CV"),
        StudentOnboardingSkill("career-professional-services-linkedin-professional-profiles", "LinkedIn & Professional Profiles"),
        StudentOnboardingSkill("career-professional-services-job-search-support", "Job Search Support"),
        StudentOnboardingSkill("career-professional-services-interview-preparation", "Interview Preparation")
    ),
    "Government & Nonprofit Services" to listOf(
        StudentOnboardingSkill("government-nonprofit-services-grant-proposal-support", "Grant & Proposal Support"),
        StudentOnboardingSkill("government-nonprofit-services-nonprofit-operations", "Nonprofit Operations"),
        StudentOnboardingSkill("government-nonprofit-services-public-research", "Public Research")
    ),
    "Real Estate & Property Services" to listOf(
        StudentOnboardingSkill("real-estate-property-services-property-marketing", "Property Marketing"),
        StudentOnboardingSkill("real-estate-property-services-property-visualization", "Property Visualization"),
        StudentOnboardingSkill("real-estate-property-services-property-research-support", "Property Research & Support")
    ),
    "Travel & Hospitality" to listOf(
        StudentOnboardingSkill("travel-hospitality-travel-planning", "Travel Planning"),
        StudentOnboardingSkill("travel-hospitality-hospitality-support", "Hospitality Support"),
        StudentOnboardingSkill("travel-hospitality-travel-content", "Travel Content")
    ),
    "Food & Culinary Services" to listOf(
        StudentOnboardingSkill("food-culinary-services-food-content", "Food Content"),
        StudentOnboardingSkill("food-culinary-services-food-business-support", "Food Business Support"),
        StudentOnboardingSkill("food-culinary-services-cooking-instruction", "Cooking & Instruction")
    ),
    "Beauty & Personal Care" to listOf(
        StudentOnboardingSkill("beauty-personal-care-beauty-content", "Beauty Content"),
        StudentOnboardingSkill("beauty-personal-care-personal-styling", "Personal Styling"),
        StudentOnboardingSkill("beauty-personal-care-beauty-business-support", "Beauty Business Support")
    ),
    "Fashion, Jewelry & Accessories" to listOf(
        StudentOnboardingSkill("fashion-jewelry-accessories-fashion-design", "Fashion Design"),
        StudentOnboardingSkill("fashion-jewelry-accessories-tech-packs-patterns", "Tech Packs & Patterns"),
        StudentOnboardingSkill("fashion-jewelry-accessories-fashion-branding", "Fashion Branding"),
        StudentOnboardingSkill("fashion-jewelry-accessories-jewelry-design", "Jewelry Design"),
        StudentOnboardingSkill("fashion-jewelry-accessories-accessories-design", "Accessories Design")
    ),
    "Scientific & Technical Research" to listOf(
        StudentOnboardingSkill("scientific-technical-research-scientific-research-support", "Scientific Research Support"),
        StudentOnboardingSkill("scientific-technical-research-stem-analysis", "STEM Analysis"),
        StudentOnboardingSkill("scientific-technical-research-technical-documentation", "Technical Documentation")
    ),
    "Freight, Delivery & Transportation" to listOf(
        StudentOnboardingSkill("freight-delivery-transportation-delivery-logistics", "Delivery & Logistics"),
        StudentOnboardingSkill("freight-delivery-transportation-transportation-research", "Transportation Research")
    ),
    "Agriculture & Environmental Services" to listOf(
        StudentOnboardingSkill("agriculture-environmental-services-agriculture-support", "Agriculture Support"),
        StudentOnboardingSkill("agriculture-environmental-services-environmental-research", "Environmental Research")
    ),
    "3D Printing & Digital Fabrication" to listOf(
        StudentOnboardingSkill("3d-printing-digital-fabrication-3d-modeling-for-fabrication", "3D Modeling for Fabrication"),
        StudentOnboardingSkill("3d-printing-digital-fabrication-digital-fabrication", "Digital Fabrication")
    ),
    "Consulting & Professional Advisory" to listOf(
        StudentOnboardingSkill("consulting-professional-advisory-business-consulting", "Business Consulting"),
        StudentOnboardingSkill("consulting-professional-advisory-technology-consulting", "Technology Consulting"),
        StudentOnboardingSkill("consulting-professional-advisory-creative-consulting", "Creative Consulting")
    ),
    "Personal Development & Hobbies" to listOf(
        StudentOnboardingSkill("personal-development-hobbies-personal-development", "Personal Development"),
        StudentOnboardingSkill("personal-development-hobbies-creative-hobbies", "Creative Hobbies"),
        StudentOnboardingSkill("personal-development-hobbies-hobby-instruction", "Hobby Instruction")
    )
)
