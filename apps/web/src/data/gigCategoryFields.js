/*
 * SkillLaunch Gig category-specific field configuration.
 *
 * Keep specialized fields here so adding another supported category/service
 * type does not require rewriting StudentGigCreatePage.jsx.
 *
 * All fields are optional unless explicitly marked required. The initial
 * configuration intentionally follows the product specification examples
 * without turning illustrative examples into publish blockers.
 */

export const GIG_CATEGORY_FIELD_CONFIG = {
  "web-development": [
    {
      key: "technologyStack",
      label: "Technology stack",
      description: "List the main technologies or platforms you will use.",
      type: "text",
      placeholder: "e.g. React, Node.js, PostgreSQL",
      maxLength: 160
    },
    {
      key: "pages",
      appliesToSubcategoryIds: ["web-development-frontend-development", "web-development-full-stack-development", "web-development-cms-website-builders"],
      label: "Pages",
      description: "Approximate number of pages or main screens included.",
      type: "number",
      min: 1,
      max: 1000,
      step: 1,
      placeholder: "e.g. 5"
    },
    {
      key: "responsiveBehavior",
      appliesToSubcategoryIds: ["web-development-frontend-development", "web-development-full-stack-development", "web-development-cms-website-builders"],
      label: "Responsive behavior",
      description: "Describe how the service handles different screen sizes.",
      type: "select",
      options: [
        { value: "fully-responsive", label: "Fully responsive" },
        { value: "desktop-and-mobile", label: "Desktop + mobile" },
        { value: "desktop-focused", label: "Desktop focused" },
        { value: "not-applicable", label: "Not applicable" }
      ]
    },
    {
      key: "browserSupport",
      appliesToSubcategoryIds: ["web-development-frontend-development", "web-development-full-stack-development", "web-development-cms-website-builders"],
      label: "Browser support",
      description: "State the browser coverage buyers should expect.",
      type: "text",
      placeholder: "e.g. Chrome, Edge, Firefox, Safari",
      maxLength: 160
    },
    {
      key: "deployment",
      appliesToSubcategoryIds: ["web-development-frontend-development", "web-development-full-stack-development", "web-development-cms-website-builders"],
      label: "Deployment",
      description: "Indicate what deployment support is included.",
      type: "select",
      options: [
        { value: "included", label: "Deployment included" },
        { value: "setup-guidance", label: "Setup guidance only" },
        { value: "buyer-handled", label: "Buyer handles deployment" },
        { value: "not-applicable", label: "Not applicable" }
      ]
    },
    {
      key: "sourceCode",
      label: "Source code",
      description: "Clarify whether source code is part of the delivery.",
      type: "select",
      options: [
        { value: "included", label: "Included" },
        { value: "partial", label: "Partial / selected files" },
        { value: "not-included", label: "Not included" }
      ]
    },
    {
      key: "integrations",
      label: "Integrations",
      description: "Mention important third-party services or APIs.",
      type: "textarea",
      placeholder: "e.g. Stripe, Firebase, Google Maps, REST APIs",
      maxLength: 400
    }
  ],

  "design-creative:design-creative-graphic-visual-design": [
    {
      key: "conceptCount",
      label: "Concept count",
      description: "How many initial concepts are included.",
      type: "number",
      min: 1,
      max: 50,
      step: 1,
      placeholder: "e.g. 2"
    },
    {
      key: "sourceFormats",
      label: "Source formats",
      description: "Choose the editable/source formats you provide.",
      type: "multi-select",
      options: [
        { value: "fig", label: "FIG" },
        { value: "psd", label: "PSD" },
        { value: "ai", label: "AI" },
        { value: "xd", label: "XD" },
        { value: "indd", label: "INDD" },
        { value: "canva", label: "Canva" },
        { value: "other", label: "Other" }
      ]
    },
    {
      key: "vectorFiles",
      label: "Vector files",
      description: "Clarify whether editable vector files are included.",
      type: "checkbox"
    },
    {
      key: "brandAssets",
      label: "Brand assets",
      description: "State whether usable brand assets are provided.",
      type: "select",
      options: [
        { value: "included", label: "Included" },
        { value: "on-request", label: "On request" },
        { value: "buyer-provides", label: "Buyer provides assets" },
        { value: "not-applicable", label: "Not applicable" }
      ]
    },
    {
      key: "usageRights",
      label: "Usage rights",
      description: "Set the intended usage rights for the delivered design.",
      type: "select",
      options: [
        { value: "commercial", label: "Commercial use" },
        { value: "personal", label: "Personal use" },
        { value: "portfolio-only", label: "Portfolio / display only" },
        { value: "discussed-separately", label: "Discussed separately" }
      ]
    }
  ],

  "education-tutoring-coaching": [
    {
      key: "subject",
      appliesToSubcategoryIds: ["education-tutoring-coaching-academic-tutoring", "education-tutoring-coaching-test-exam-preparation", "education-tutoring-coaching-language-tutoring"],
      label: "Subject",
      description: "What subject or topic will you teach?",
      type: "text",
      placeholder: "e.g. Mathematics, Python, IELTS",
      maxLength: 120
    },
    {
      key: "level",
      appliesToSubcategoryIds: ["education-tutoring-coaching-academic-tutoring", "education-tutoring-coaching-test-exam-preparation", "education-tutoring-coaching-language-tutoring"],
      label: "Level",
      description: "Choose the learner level this service is intended for.",
      type: "select",
      options: [
        { value: "beginner", label: "Beginner" },
        { value: "intermediate", label: "Intermediate" },
        { value: "advanced", label: "Advanced" },
        { value: "mixed", label: "Mixed levels" }
      ]
    },
    {
      key: "sessionDuration",
      appliesToSubcategoryIds: ["education-tutoring-coaching-academic-tutoring", "education-tutoring-coaching-test-exam-preparation", "education-tutoring-coaching-language-tutoring"],
      label: "Session duration",
      description: "Approximate duration of one tutoring/coaching session.",
      type: "number",
      min: 15,
      max: 480,
      step: 15,
      placeholder: "Minutes"
    },
    {
      key: "deliveryMode",
      appliesToSubcategoryIds: ["education-tutoring-coaching-academic-tutoring", "education-tutoring-coaching-test-exam-preparation", "education-tutoring-coaching-language-tutoring"],
      label: "Delivery mode",
      description: "How will sessions or instruction be delivered?",
      type: "select",
      options: [
        { value: "video-call", label: "Video call" },
        { value: "chat", label: "Chat / messaging" },
        { value: "recorded", label: "Recorded lessons" },
        { value: "in-person", label: "In person" },
        { value: "mixed", label: "Mixed" }
      ]
    },
    {
      key: "numberOfSessions",
      appliesToSubcategoryIds: ["education-tutoring-coaching-academic-tutoring", "education-tutoring-coaching-test-exam-preparation", "education-tutoring-coaching-language-tutoring"],
      label: "Number of sessions",
      description: "Approximate number of sessions included in the service.",
      type: "number",
      min: 1,
      max: 200,
      step: 1,
      placeholder: "e.g. 4"
    },
    {
      key: "language",
      appliesToSubcategoryIds: ["education-tutoring-coaching-academic-tutoring", "education-tutoring-coaching-test-exam-preparation", "education-tutoring-coaching-language-tutoring"],
      label: "Language",
      description: "Primary language used for instruction.",
      type: "text",
      placeholder: "e.g. English",
      maxLength: 80
    }
  ],

  "video-audio-animation:video-audio-animation-video-editing-post-production": [
    {
      key: "maximumDuration",
      label: "Maximum duration",
      description: "Maximum final video duration covered by this service.",
      type: "number",
      min: 1,
      max: 1440,
      step: 1,
      placeholder: "Minutes"
    },
    {
      key: "resolution",
      label: "Resolution",
      description: "Highest standard delivery resolution included.",
      type: "select",
      options: [
        { value: "720p", label: "720p" },
        { value: "1080p", label: "1080p Full HD" },
        { value: "1440p", label: "1440p QHD" },
        { value: "2160p", label: "2160p 4K" },
        { value: "custom", label: "Custom / discussed" }
      ]
    },
    {
      key: "captions",
      label: "Captions",
      description: "Clarify the caption/subtitle support included.",
      type: "select",
      options: [
        { value: "included", label: "Included" },
        { value: "optional", label: "Optional add-on / request" },
        { value: "buyer-provides", label: "Buyer provides captions" },
        { value: "not-included", label: "Not included" }
      ]
    },
    {
      key: "sourceFootage",
      label: "Source footage",
      description: "Describe how source footage is handled.",
      type: "select",
      options: [
        { value: "buyer-provided", label: "Buyer provides footage" },
        { value: "seller-provided", label: "Seller provides footage" },
        { value: "mixed", label: "Mixed" },
        { value: "not-applicable", label: "Not applicable" }
      ]
    },
    {
      key: "thumbnail",
      label: "Thumbnail",
      description: "Clarify whether a final thumbnail is included.",
      type: "select",
      options: [
        { value: "included", label: "Included" },
        { value: "optional", label: "Optional" },
        { value: "not-included", label: "Not included" }
      ]
    }
  ],

  "writing-content-creation": [
    {
      key: "contentType",
      appliesToSubcategoryIds: ["writing-content-creation-content-blog-writing", "writing-content-creation-copywriting-sales", "writing-content-creation-technical-academic-writing", "writing-content-creation-medical-scientific-writing", "writing-content-creation-creative-writing-scripts"],
      label: "Content type",
      description: "What type of written content do you deliver?",
      type: "select",
      options: [
        { value: "blog", label: "Blog post" },
        { value: "article", label: "Article" },
        { value: "website-copy", label: "Website copy" },
        { value: "technical", label: "Technical content" },
        { value: "academic", label: "Academic content" },
        { value: "script", label: "Script" },
        { value: "other", label: "Other" }
      ]
    },
    {
      key: "wordCount",
      appliesToSubcategoryIds: ["writing-content-creation-content-blog-writing", "writing-content-creation-copywriting-sales", "writing-content-creation-technical-academic-writing", "writing-content-creation-medical-scientific-writing", "writing-content-creation-creative-writing-scripts"],
      label: "Word count",
      description: "Approximate word count covered by the service.",
      type: "number",
      min: 1,
      max: 100000,
      step: 1,
      placeholder: "e.g. 1000"
    },
    {
      key: "tone",
      appliesToSubcategoryIds: ["writing-content-creation-content-blog-writing", "writing-content-creation-copywriting-sales", "writing-content-creation-technical-academic-writing", "writing-content-creation-medical-scientific-writing", "writing-content-creation-creative-writing-scripts"],
      label: "Tone",
      description: "Choose the intended writing tone.",
      type: "select",
      options: [
        { value: "professional", label: "Professional" },
        { value: "conversational", label: "Conversational" },
        { value: "academic", label: "Academic" },
        { value: "persuasive", label: "Persuasive" },
        { value: "technical", label: "Technical" },
        { value: "creative", label: "Creative" }
      ]
    },
    {
      key: "research",
      appliesToSubcategoryIds: ["writing-content-creation-content-blog-writing", "writing-content-creation-copywriting-sales", "writing-content-creation-technical-academic-writing", "writing-content-creation-medical-scientific-writing", "writing-content-creation-creative-writing-scripts"],
      label: "Research",
      description: "Clarify the research depth included.",
      type: "select",
      options: [
        { value: "included", label: "Research included" },
        { value: "light", label: "Light research" },
        { value: "buyer-provided", label: "Buyer provides sources" },
        { value: "not-included", label: "No research included" }
      ]
    },
    {
      key: "citationStyle",
      appliesToSubcategoryIds: ["writing-content-creation-content-blog-writing", "writing-content-creation-copywriting-sales", "writing-content-creation-technical-academic-writing", "writing-content-creation-medical-scientific-writing", "writing-content-creation-creative-writing-scripts"],
      label: "Citation style",
      description: "Choose the citation style when citations are applicable.",
      type: "select",
      options: [
        { value: "apa", label: "APA" },
        { value: "mla", label: "MLA" },
        { value: "chicago", label: "Chicago" },
        { value: "harvard", label: "Harvard" },
        { value: "custom", label: "Custom / discussed" },
        { value: "not-applicable", label: "Not applicable" }
      ]
    },
    {
      key: "revisionPolicy",
      appliesToSubcategoryIds: ["writing-content-creation-content-blog-writing", "writing-content-creation-copywriting-sales", "writing-content-creation-technical-academic-writing", "writing-content-creation-medical-scientific-writing", "writing-content-creation-creative-writing-scripts"],
      label: "Revision policy",
      description: "Describe what revision support applies to this writing service.",
      type: "select",
      options: [
        { value: "included", label: "Included within the listed revisions" },
        { value: "minor-only", label: "Minor edits only" },
        { value: "scope-change", label: "Scope changes quoted separately" },
        { value: "discussed-separately", label: "Discussed separately" }
      ]
    }
  ]
};

const getMatchingFieldEntries = ({
  categoryId,
  subcategoryId,
  serviceType
}) => {
  const matches = [];

  const add = (scopeKey) => {
    const fields = GIG_CATEGORY_FIELD_CONFIG[scopeKey];
    if (!Array.isArray(fields)) return;

    fields.forEach((field) => {
      if (
        Array.isArray(field.appliesToSubcategoryIds) &&
        subcategoryId &&
        !field.appliesToSubcategoryIds.includes(subcategoryId)
      ) {
        return;
      }

      if (
        Array.isArray(field.appliesToSubcategoryIds) &&
        !subcategoryId
      ) {
        return;
      }

      matches.push(field);
    });
  };

  if (categoryId) add(categoryId);
  if (subcategoryId) add(`${categoryId}:${subcategoryId}`);
  if (serviceType) add(serviceType);

  const seen = new Set();

  return matches.filter((field) => {
    if (seen.has(field.key)) return false;
    seen.add(field.key);
    return true;
  });
};

export const getGigCategoryFields = (taxonomy = {}) =>
  getMatchingFieldEntries(taxonomy);

export const getGigCategoryFieldDefaults = (fields = []) =>
  fields.reduce((result, field) => {
    result[field.key] = field.type === 'multi-select'
      ? []
      : field.type === 'checkbox'
        ? false
        : '';
    return result;
  }, {});

export const normalizeGigCategoryFields = (fields, values = {}) =>
  fields.reduce((result, field) => {
    const raw = values?.[field.key];

    if (field.type === 'multi-select') {
      result[field.key] = Array.isArray(raw) ? [...raw] : [];
    } else if (field.type === 'checkbox') {
      result[field.key] = Boolean(raw);
    } else {
      result[field.key] = raw ?? '';
    }

    return result;
  }, {});

export const validateGigCategoryFields = (fields = [], values = {}) => {
  const errors = {};

  fields.forEach((field) => {
    const value = values?.[field.key];
    const empty =
      field.type === 'multi-select'
        ? !Array.isArray(value) || value.length === 0
        : field.type === 'checkbox'
          ? false
          : String(value ?? '').trim().length === 0;

    if (field.required && empty) {
      errors[field.key] = `${field.label} is required.`;
      return;
    }

    if (field.type === 'number' && !empty) {
      const numeric = Number(value);

      if (!Number.isFinite(numeric)) {
        errors[field.key] = `${field.label} must be a valid number.`;
        return;
      }

      if (field.min !== undefined && numeric < field.min) {
        errors[field.key] = `${field.label} must be at least ${field.min}.`;
        return;
      }

      if (field.max !== undefined && numeric > field.max) {
        errors[field.key] = `${field.label} must be ${field.max} or less.`;
        return;
      }
    }

    if (
      ['text', 'textarea'].includes(field.type) &&
      field.maxLength &&
      !empty &&
      String(value).length > field.maxLength
    ) {
      errors[field.key] = `${field.label} must be ${field.maxLength} characters or fewer.`;
    }
  });

  return errors;
};

export const hasMeaningfulGigCategoryFieldValue = (field, value) => {
  if (field.type === 'multi-select') return Array.isArray(value) && value.length > 0;
  if (field.type === 'checkbox') return Boolean(value);
  return String(value ?? '').trim().length > 0;
};
