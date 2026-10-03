import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  FileEdit,
  Save,
  Send,
  Search,
  X,
  Sparkles,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  Video,
  GripVertical,
  Crop
} from 'lucide-react';
import { GIG_CATEGORY_OPTIONS, GIG_SUBCATEGORY_OPTIONS, GIG_SERVICE_TYPE_OPTIONS } from '../data/gigTaxonomyData.js';
import { ALL_SKILLS_DATABASE } from '../data/skillsData.js';
import {
  GIG_DISCOVERY_LANGUAGES,
  GIG_DISCOVERY_TARGET_AUDIENCES
} from '../data/gigDiscoveryData.js';
import RichTextEditor from '../components/RichTextEditor.jsx';
import GigBuyerPreview from '../components/GigBuyerPreview.jsx';
import ImageCropModal from '../components/ImageCropModal.jsx';
import API from '../services/api';
import { richTextToPlainText } from '../utils/richText.js';
import GigCategorySpecificFields from '../components/GigCategorySpecificFields.jsx';
import {
  getGigCategoryFields,
  validateGigCategoryFields
} from '../data/gigCategoryFields.js';

const steps = [
  { id: 1, label: 'Basics', description: 'Service identity' },
  { id: 2, label: 'Description', description: 'Explain the offer' },
  { id: 3, label: 'Pricing', description: 'Commercial terms' },
  { id: 4, label: 'Scope & Delivery', description: 'Set expectations' },
  { id: 5, label: 'Requirements', description: 'Buyer inputs' },
  { id: 6, label: 'Media & Portfolio', description: 'Build trust' },
  { id: 7, label: 'Discovery', description: 'Improve findability' },
  { id: 8, label: 'FAQ & Policies', description: 'Reduce ambiguity' },
  { id: 9, label: 'Preview', description: 'Review listing' },
  { id: 10, label: 'Submit', description: 'Validate & publish' }
];

const createRequirementId = () =>
  `requirement-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createRequirement = () => ({
  id: createRequirementId(),
  question: '',
  type: 'text',
  required: true,
  options: []
});

const createFaqId = () =>
  `faq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createFaq = () => ({
  id: createFaqId(),
  question: '',
  answer: ''
});

const GIG_USAGE_RIGHTS_POLICIES = {
  buyerOwnsFinalWork: {
    value: 'buyer-owns-final-work',
    label: 'Buyer owns the final delivered work',
    description: 'The buyer receives ownership of the final deliverable created specifically for this gig, unless a stated exception applies.'
  },
  licenseCommercial: {
    value: 'license-commercial-use',
    label: 'Commercial-use license',
    description: 'The buyer receives a license to use the delivered work for commercial purposes; ownership remains with the freelancer unless otherwise agreed in the gig.'
  },
  licensePersonal: {
    value: 'license-personal-use',
    label: 'Personal-use license',
    description: 'The buyer may use the delivered work for personal purposes only; commercial redistribution or resale is not included.'
  },
  portfolioOnly: {
    value: 'portfolio-display-only',
    label: 'Portfolio / display use only',
    description: 'The delivered work is provided for portfolio or display purposes and does not include broader commercial usage rights.'
  }
};

const createMediaId = () =>
  `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const MEDIA_ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp'
]);
const MEDIA_ACCEPT = '.jpg,.jpeg,.png,.webp';
const MEDIA_MAX_SIZE_BYTES = 25 * 1024 * 1024;

const VIDEO_ALLOWED_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime'
]);
const VIDEO_ACCEPT = '.mp4,.webm,.mov';
const VIDEO_MAX_SIZE_BYTES = 25 * 1024 * 1024;

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Unable to read the image.'));
    reader.readAsDataURL(file);
  });

const dataUrlToFile = (dataUrl, fileName) => {
  const [header, body] = String(dataUrl).split(',');
  const mime =
    header.match(/data:(.*?);base64/)?.[1] || 'image/jpeg';
  const binary = window.atob(body || '');
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], fileName, { type: mime });
};

const readImageDimensions = (file) =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('The selected file is not a readable image.'));
    };

    image.src = objectUrl;
  });

const CircularUploadProgress = ({ progress = 0, size = 64 }) => {
  const normalizedProgress = Math.min(100, Math.max(0, Number(progress) || 0));
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference - (normalizedProgress / 100) * circumference;
  const isProcessing =
    normalizedProgress >= 95 && normalizedProgress < 100;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-label={`Upload progress ${normalizedProgress}%`}
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow={normalizedProgress}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={`-rotate-90 ${
          isProcessing ? 'animate-spin' : ''
        }`}
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          className="text-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-cyan-400 transition-[stroke-dashoffset] duration-150"
        />
      </svg>

      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-white">
        {normalizedProgress}%
      </span>
    </div>
  );
};

const uploadGigMedia = async (file, { onUploadProgress } = {}) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await API.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress
  });

  return response.data;
};

const validateMediaFile = async (file, { label }) => {
  if (!(file instanceof File)) {
    return {
      error: `${label} is not a valid image file.`
    };
  }

  if (!MEDIA_ALLOWED_TYPES.has(file.type)) {
    return {
      error: `${label} must be a JPG, PNG, or WebP image.`
    };
  }

  if (file.size > MEDIA_MAX_SIZE_BYTES) {
    return {
      error: `${label} must be 25 MB or smaller.`
    };
  }

  try {
    const dimensions = await readImageDimensions(file);

    return {
      error: '',
      ...dimensions
    };
  } catch (error) {
    return {
      error:
        error.message ||
        `${label} could not be read.`
    };
  }
};

const validateVideoFile = (file, { label }) => {
  if (!(file instanceof File)) {
    return {
      error: `${label} is not a valid video file.`
    };
  }

  if (!VIDEO_ALLOWED_TYPES.has(file.type)) {
    return {
      error: `${label} must be an MP4, WebM, or MOV video.`
    };
  }

  if (file.size > VIDEO_MAX_SIZE_BYTES) {
    return {
      error: `${label} must be 25 MB or smaller.`
    };
  }

  return {
    error: ''
  };
};

function SearchableSelect({
  id,
  label,
  value,
  options,
  placeholder,
  disabled = false,
  error,
  onChange,
  onOpenChange
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [availableHeight, setAvailableHeight] = useState(288);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    openUp: false
  });
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);

  useEffect(() => {
    if (!open) return undefined;

    const updateDropdownPosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const viewportPadding = 16;
      const gap = 8;

      const spaceAbove = Math.max(
        0,
        rect.top - viewportPadding - gap
      );

      const spaceBelow = Math.max(
        0,
        window.innerHeight - rect.bottom - viewportPadding - gap
      );

      const openUp = spaceBelow < 260 && spaceAbove > spaceBelow;
      const availableSpace = openUp ? spaceAbove : spaceBelow;

      const dropdownWidth = rect.width;
      const maxLeft = Math.max(
        viewportPadding,
        window.innerWidth - dropdownWidth - viewportPadding
      );

      setDropdownPosition({
        top: openUp ? rect.top - gap : rect.bottom + gap,
        left: Math.min(Math.max(rect.left, viewportPadding), maxLeft),
        width: dropdownWidth,
        openUp
      });

      setAvailableHeight(
        Math.max(
          160,
          Math.min(360, availableSpace)
        )
      );
    };

    updateDropdownPosition();

    window.addEventListener('resize', updateDropdownPosition);
    window.addEventListener('scroll', updateDropdownPosition, true);

    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [open]);

  const selectedOption = options.find((option) => option.id === value) || null;

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) =>
      option.name.toLowerCase().includes(normalizedQuery)
    );
  }, [options, query]);

  const activeIndex = filteredOptions.length
    ? Math.min(highlightedIndex, filteredOptions.length - 1)
    : 0;

  const setDropdownOpen = (nextOpen) => {
    setOpen(nextOpen);
    onOpenChange?.(nextOpen);

    if (nextOpen) {
      setQuery('');
      setHighlightedIndex(0);
      return;
    }

    setQuery('');
    setHighlightedIndex(0);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const handleSelect = (option) => {
    onChange(option.id);
    setDropdownOpen(false);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();

      if (!filteredOptions.length) return;

      const nextIndex = (activeIndex + 1) % filteredOptions.length;
      setHighlightedIndex(nextIndex);

      window.requestAnimationFrame(() =>
        optionRefs.current[nextIndex]?.scrollIntoView({
          block: 'nearest'
        })
      );
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();

      if (!filteredOptions.length) return;

      const nextIndex =
        (activeIndex - 1 + filteredOptions.length) % filteredOptions.length;

      setHighlightedIndex(nextIndex);

      window.requestAnimationFrame(() =>
        optionRefs.current[nextIndex]?.scrollIntoView({
          block: 'nearest'
        })
      );
    }

    if (event.key === 'Enter') {
      event.preventDefault();

      if (filteredOptions[activeIndex]) {
        handleSelect(filteredOptions[activeIndex]);
      }
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setDropdownOpen(false);
    }
  };

  const renderMatch = (text) => {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) return text;

    const escapedQuery = normalizedQuery.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );

    const parts = text.split(new RegExp(`(${escapedQuery})`, 'ig'));

    return parts.map((part, index) =>
      part.toLowerCase() === normalizedQuery.toLowerCase() ? (
        <mark
          key={`${part}-${index}`}
          className="rounded bg-cyan-500/15 px-0.5 text-cyan-200"
        >
          {part}
        </mark>
      ) : (
        <span key={`${part}-${index}`}>{part}</span>
      )
    );
  };

  return (
    <div className="relative space-y-2.5">
      <label
        htmlFor={`${id}-trigger`}
        className="block text-xs font-black uppercase tracking-wider text-slate-300"
      >
        {label} <span className="text-pink-500">*</span>
      </label>

      <div className="relative">
        <button
          ref={triggerRef}
          id={`${id}-trigger`}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          aria-invalid={Boolean(error)}
          onClick={() => setDropdownOpen(!open)}
          onKeyDown={(event) => {
            if (
              !open &&
              (event.key === 'ArrowDown' ||
                event.key === 'Enter' ||
                event.key === ' ')
            ) {
              event.preventDefault();
              setDropdownOpen(true);
            }
          }}
          className={`w-full min-h-[52px] flex items-center justify-between gap-3 px-4 py-3.5 bg-slate-950 border rounded-2xl text-sm text-left outline-none transition ${
            error
              ? 'border-red-500/50 focus:border-red-400'
              : open
                ? 'border-cyan-500'
                : 'border-slate-800 hover:border-slate-700'
          } ${
            disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer'
          }`}
        >
          <span
            className={`min-w-0 truncate ${
              selectedOption ? 'text-white' : 'text-slate-500'
            }`}
          >
            {selectedOption?.name || placeholder}
          </span>

          <ChevronRight
            className={`w-4 h-4 shrink-0 text-slate-500 transition-transform ${
              open ? 'rotate-90' : ''
            }`}
          />
        </button>

        {open && !disabled && createPortal(
          <>
            <button
              type="button"
              aria-label={`Close ${label} dropdown`}
              onClick={() => setDropdownOpen(false)}
              className="fixed inset-0 z-[9998] cursor-default"
            />

            <div
              id={`${id}-listbox`}
              role="listbox"
              aria-label={label}
              className="fixed z-[9999] overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl shadow-black/60 ring-1 ring-white/5"
              style={{
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
                ...(dropdownPosition.openUp
                  ? {
                      bottom: `${window.innerHeight - dropdownPosition.top}px`
                    }
                  : {
                      top: `${dropdownPosition.top}px`
                    })
              }}
            >
              <div className="border-b border-slate-800 p-2.5">
                <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3 focus-within:border-cyan-500/50">
                  <Search className="w-4 h-4 shrink-0 text-slate-500" />

                  <input
                    autoFocus
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setHighlightedIndex(0);
                    }}
                    onKeyDown={handleSearchKeyDown}
                    placeholder={`Search ${label.toLowerCase()}...`}
                    aria-controls={`${id}-listbox-options`}
                    className="w-full bg-transparent py-2.5 text-sm text-white placeholder:text-slate-600 outline-none"
                  />

                  {query && (
                    <button
                      type="button"
                      aria-label={`Clear ${label} search`}
                      onClick={() => {
                        setQuery('');
                        setHighlightedIndex(0);
                      }}
                      className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-white transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div
                id={`${id}-listbox-options`}
                className="overflow-y-auto p-1.5 scrollbar-hide"
                style={{ maxHeight: `${availableHeight}px` }}
              >
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option, index) => {
                    const isSelected = option.id === value;
                    const isHighlighted = index === activeIndex;

                    return (
                      <button
                        key={option.id}
                        ref={(element) => {
                          optionRefs.current[index] = element;
                        }}
                        id={`${id}-option-${index}`}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        onClick={() => handleSelect(option)}
                        className={`w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                          isSelected
                            ? 'bg-cyan-500/10 text-cyan-300'
                            : isHighlighted
                              ? 'bg-slate-900 text-white'
                              : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                        }`}
                      >
                        <span className="min-w-0 truncate">
                          {renderMatch(option.name)}
                        </span>

                        {isSelected && (
                          <Check className="w-4 h-4 shrink-0 text-cyan-400" />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-8 text-center">
                    <Search className="w-5 h-5 mx-auto text-slate-600" />
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      No {label.toLowerCase()} found.
                    </p>
                    <p className="mt-1 text-[11px] text-slate-700">
                      Try a different search term.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-slate-800 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                <span>{filteredOptions.length} of {options.length}</span>
                <span className="hidden sm:inline">
                  ↑↓ navigate · Enter select · Esc close
                </span>
              </div>
            </div>
          </>,
          document.body
        )}
      </div>

      {error && (
        <p className="text-xs font-semibold text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

const HIDDEN_SCROLLBAR_STYLES = `
  .scrollbar-hide {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

const formatRelativeSavedTime = (timestamp) => {
  const saved = new Date(timestamp).getTime();
  if (!Number.isFinite(saved)) return 'just now';

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - saved) / 1000));
  if (elapsedSeconds < 60) return 'just now';

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes} minute${elapsedMinutes === 1 ? '' : 's'} ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  return `${elapsedHours} hour${elapsedHours === 1 ? '' : 's'} ago`;
};

export default function StudentGigCreatePage({ currentUser }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(() => new Set());
  const [description, setDescription] = useState('');

  const [saveState, setSaveState] = useState('idle');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [submissionState, setSubmissionState] = useState('idle');
  const [submissionError, setSubmissionError] = useState('');
  const [submissionBlockers, setSubmissionBlockers] = useState([]);
  const [moderationFeedback, setModerationFeedback] = useState(null);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    if (!currentUser?.id) {
      return;
    }

    let cancelled = false;

    API.get(`/users/${currentUser.id}`)
      .then((response) => {
        if (cancelled) return;
        setProfileData(response.data || null);
      })
      .catch(() => {
        if (cancelled) return;
        setProfileData(null);
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id]);

  const managementGigId = searchParams.get('manageId') || '';
  const isManagementEdit = Boolean(managementGigId);
  const [pendingEditStatus, setPendingEditStatus] = useState(null);
  const isManagementEditLocked =
    isManagementEdit && pendingEditStatus === 'PENDING_REVIEW';

  const draftIdRef = useRef(searchParams.get('draftId') || '');
  const draftVersionRef = useRef(0);
  const saveTimerRef = useRef(null);
  const saveSequenceRef = useRef(0);
  const latestRequestedSequenceRef = useRef(0);
  const latestSavedSnapshotRef = useRef('');
  const latestSnapshotRef = useRef('');
  const pendingSnapshotRef = useRef(null);
  const savePromiseRef = useRef(Promise.resolve());
  const availabilitySaveSequenceRef = useRef(0);
  const availabilitySavePromiseRef = useRef(Promise.resolve());
  const initialSnapshotEstablishedRef = useRef(false);
  const draftHydratedRef = useRef(!searchParams.get('draftId'));
  const hasUnsavedChangesRef = useRef(false);

  const [pricing, setPricing] = useState({
    basePrice: '',
    currency: 'INR',
    packageModel: 'single'
  });

  const [delivery, setDelivery] = useState({
    deliveryDays: '',
    revisions: '',
    includedItems: [''],
    excludedItems: [],
    deliverables: [''],
    acceptingOrders: true,
    unavailableUntil: '',
    activeOrderLimit: ''
  });

  const [packages, setPackages] = useState(() => [
    {
      tierName: 'Basic',
      price: '',
      deliveryDays: '',
      revisions: '',
      description: '',
      includedItems: [''],
      excludedItems: [],
      deliverables: [''],
      features: ['']
    },
    {
      tierName: 'Standard',
      price: '',
      deliveryDays: '',
      revisions: '',
      description: '',
      includedItems: [''],
      excludedItems: [],
      deliverables: [''],
      features: ['']
    },
    {
      tierName: 'Premium',
      price: '',
      deliveryDays: '',
      revisions: '',
      description: '',
      includedItems: [''],
      excludedItems: [],
      deliverables: [''],
      features: ['']
    }
  ]);

  const normalizePackageItems = (items, fallback = ['']) => {
    if (!Array.isArray(items)) return fallback;
    return items.length ? items : fallback;
  };

  const [extras, setExtras] = useState([]);

  const [requirements, setRequirements] = useState(() => [createRequirement()]);
  const [faqs, setFaqs] = useState([]);
  const [usageRightsPolicy, setUsageRightsPolicy] = useState('');
  const [platformRulesAcknowledged, setPlatformRulesAcknowledged] = useState(false);
  const [media, setMedia] = useState({
    cover: null,
    gallery: [],
    video: null,
    portfolioLinks: [],
    liveDemoUrl: ''
  });
  const [portfolioLinkInputError, setPortfolioLinkInputError] = useState('');
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [pendingCoverFile, setPendingCoverFile] = useState(null);
  const [coverUploadProgress, setCoverUploadProgress] = useState(0);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [galleryUploadProgress, setGalleryUploadProgress] = useState({});
  const [draggedGalleryId, setDraggedGalleryId] = useState(null);
  const mediaRef = useRef(media);

  useEffect(() => {
    mediaRef.current = media;
  }, [media]);

  useEffect(
    () => () => {
      if (mediaRef.current.cover?.previewUrl) {
        URL.revokeObjectURL(mediaRef.current.cover.previewUrl);
      }

      mediaRef.current.gallery.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });

      if (mediaRef.current.video?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(mediaRef.current.video.previewUrl);
      }
    },
    []
  );

  const [basics, setBasics] = useState({

    title: '',
    categoryId: '',
    subcategoryId: '',
    serviceType: '',
    skills: []
  });

  const [categorySpecificFields, setCategorySpecificFields] = useState({});

  const [discovery, setDiscovery] = useState({
    keywords: [],
    languages: [],
    targetAudience: []
  });

  const [skillQuery, setSkillQuery] = useState('');
  const deferredSkillQuery = useDeferredValue(skillQuery);
  const [visibleSkillCount, setVisibleSkillCount] = useState(24);

  const [touchedFields, setTouchedFields] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  const serializeDraftMediaItem = (item) => {
    if (!item) return null;

    return {
      id: item.id,
      url: item.url || '',
      publicId: item.publicId || '',
      resourceType: item.resourceType || '',
      format: item.format || '',
      name: item.name || '',
      size: Number(item.size) || 0,
      type: item.type || '',
      width: Number(item.width) || 0,
      height: Number(item.height) || 0,
      validationError: item.validationError || ''
    };
  };

  const serializeGigDraft = () => ({
    version: 1,
    currentStep,
    basics: {
      title: basics.title,
      categoryId: basics.categoryId,
      subcategoryId: basics.subcategoryId,
      serviceType: basics.serviceType,
      skills: [...basics.skills]
    },
    categorySpecificFields: { ...categorySpecificFields },
    discovery: {
      keywords: [...discovery.keywords],
      languages: [...discovery.languages],
      targetAudience: [...discovery.targetAudience]
    },
    description,
    pricing: {
      basePrice: pricing.basePrice,
      currency: pricing.currency,
      packageModel: pricing.packageModel
    },
    delivery: {
      deliveryDays: delivery.deliveryDays,
      revisions: delivery.revisions,
      includedItems: [...delivery.includedItems],
      excludedItems: [...delivery.excludedItems],
      deliverables: [...delivery.deliverables],
      acceptingOrders: Boolean(delivery.acceptingOrders),
      unavailableUntil: String(delivery.unavailableUntil || '').trim(),
      activeOrderLimit: String(delivery.activeOrderLimit ?? '').trim()
    },
    packages: packages.map((pkg) => ({
      tierName: pkg.tierName,
      price: pkg.price,
      deliveryDays: pkg.deliveryDays,
      revisions: pkg.revisions,
      description: pkg.description,
      scope: {
        includedItems: [...(pkg.includedItems || [])],
        excludedItems: [...(pkg.excludedItems || [])],
        deliverables: [...(pkg.deliverables || [])]
      },
      features: [...(pkg.features || [])]
    })),
    extras: extras.map((extra) => ({
      id: extra.id,
      title: extra.title,
      price: extra.price,
      scope: {
        description: extra.scope?.description || ''
      }
    })),
    requirements: requirements.map((requirement) => ({
      id: requirement.id,
      question: requirement.question,
      type: requirement.type,
      required: Boolean(requirement.required),
      options: Array.isArray(requirement.options) ? [...requirement.options] : []
    })),
    media: {
      cover: serializeDraftMediaItem(media.cover),
      gallery: media.gallery.map(serializeDraftMediaItem).filter(Boolean),
      video: serializeDraftMediaItem(media.video),
      portfolioLinks: [...media.portfolioLinks],
      liveDemoUrl: String(media.liveDemoUrl || '').trim()
    },
    faqs: faqs.map((faq) => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer
    })),
    usageRightsPolicy,
    platformRulesAcknowledged: Boolean(platformRulesAcknowledged)
  });

  const serializeManagementDraft = () => {
    const draft = serializeGigDraft();
    const managementDelivery = { ...(draft.delivery || {}) };

    delete managementDelivery.acceptingOrders;
    delete managementDelivery.unavailableUntil;

    return {
      ...draft,
      delivery: managementDelivery
    };
  };

  const restoreGigDraft = (draft) => {
    const data = draft?.draftData;
    if (!data || typeof data !== 'object') return;

    const nextBasics = {
      title: data.basics?.title || '',
      categoryId: data.basics?.categoryId || '',
      subcategoryId: data.basics?.subcategoryId || '',
      serviceType: data.basics?.serviceType || '',
      skills: Array.isArray(data.basics?.skills) ? data.basics.skills : []
    };

    setBasics(nextBasics);
    setCategorySpecificFields(
      data.categorySpecificFields && typeof data.categorySpecificFields === 'object'
        ? { ...data.categorySpecificFields }
        : {}
    );
    setDiscovery({
      keywords: Array.isArray(data.discovery?.keywords)
        ? data.discovery.keywords.filter((item) => typeof item === 'string')
        : [],
      languages: Array.isArray(data.discovery?.languages)
        ? data.discovery.languages.filter((item) => GIG_DISCOVERY_LANGUAGES.includes(item))
        : [],
      targetAudience: Array.isArray(data.discovery?.targetAudience)
        ? data.discovery.targetAudience.filter((item) => GIG_DISCOVERY_TARGET_AUDIENCES.includes(item))
        : []
    });
    setDescription(typeof data.description === 'string' ? data.description : '');
    setPricing({
      basePrice: data.pricing?.basePrice ?? '',
      currency: data.pricing?.currency || 'INR',
      packageModel: data.pricing?.packageModel || 'single'
    });

    setPackages(
      ['Basic', 'Standard', 'Premium'].map((tierName) => {
        const source = Array.isArray(data.packages)
          ? data.packages.find((pkg) => pkg?.tierName === tierName)
          : null;
        const scope =
          source?.scope && typeof source.scope === 'object'
            ? source.scope
            : {};

        return {
          tierName,
          price: source?.price ?? '',
          deliveryDays: source?.deliveryDays ?? '',
          revisions:
            source?.revisions === -1
              ? 'unlimited'
              : source?.revisions ?? '',
          description:
            typeof source?.description === 'string'
              ? source.description
              : '',
          includedItems: normalizePackageItems(scope.includedItems),
          excludedItems: normalizePackageItems(scope.excludedItems, []),
          deliverables: normalizePackageItems(scope.deliverables),
          features: normalizePackageItems(source?.features)
        };
      })
    );

    setExtras(
      Array.isArray(data.extras)
        ? data.extras.map((extra, index) => ({
            id: extra?.id || `extra-${Date.now()}-${index}`,
            title: typeof extra?.title === 'string' ? extra.title : '',
            price: extra?.price ?? '',
            scope: {
              description:
                typeof extra?.scope?.description === 'string'
                  ? extra.scope.description
                  : ''
            }
          }))
        : []
    );

    setDelivery({
      deliveryDays: data.delivery?.deliveryDays ?? '',
      revisions: data.delivery?.revisions ?? '',
      includedItems:
        Array.isArray(data.delivery?.includedItems) && data.delivery.includedItems.length
          ? data.delivery.includedItems
          : [''],
      excludedItems: Array.isArray(data.delivery?.excludedItems)
        ? data.delivery.excludedItems
        : [],
      deliverables:
        Array.isArray(data.delivery?.deliverables) && data.delivery.deliverables.length
          ? data.delivery.deliverables
          : [''],
      acceptingOrders:
        typeof data.delivery?.acceptingOrders === 'boolean'
          ? data.delivery.acceptingOrders
          : true,
      unavailableUntil:
        typeof data.delivery?.unavailableUntil === 'string'
          ? data.delivery.unavailableUntil
          : '',
      activeOrderLimit:
        data.delivery?.activeOrderLimit === null ||
        typeof data.delivery?.activeOrderLimit === 'undefined'
          ? ''
          : String(data.delivery.activeOrderLimit)
    });

    setRequirements(
      Array.isArray(data.requirements)
        ? data.requirements.map((requirement) => ({
            id: requirement.id || createRequirementId(),
            question: requirement.question || '',
            type: requirement.type || 'text',
            required: typeof requirement.required === 'boolean'
              ? requirement.required
              : true,
            options: Array.isArray(requirement.options) ? requirement.options : []
          }))
        : [createRequirement()]
    );

    setFaqs(
      Array.isArray(data.faqs)
        ? data.faqs.map((faq) => ({
            id: faq.id || createFaqId(),
            question: faq.question || '',
            answer: faq.answer || ''
          }))
        : []
    );
    setUsageRightsPolicy(
      typeof data.usageRightsPolicy === 'string' ? data.usageRightsPolicy : ''
    );
    setPlatformRulesAcknowledged(data.platformRulesAcknowledged === true);

    const restoreMediaItem = (item) =>
      item
        ? {
            id: item.id || createMediaId(),
            file: null,
            previewUrl: item.url || '',
            url: item.url || '',
            publicId: item.publicId || '',
            resourceType: item.resourceType || '',
            format: item.format || '',
            name: item.name || 'Saved image',
            size: Number(item.size) || 0,
            type: item.type || '',
            width: Number(item.width) || 0,
            height: Number(item.height) || 0,
            validationError: item.validationError || ''
          }
        : null;

    setMedia({
      cover: restoreMediaItem(data.media?.cover),
      gallery: Array.isArray(data.media?.gallery)
        ? data.media.gallery.map(restoreMediaItem).filter(Boolean)
        : [],
      video: restoreMediaItem(data.media?.video),
      portfolioLinks: Array.isArray(data.media?.portfolioLinks)
        ? data.media.portfolioLinks
            .map((item) => String(item || '').trim())
            .filter(Boolean)
        : [],
      liveDemoUrl:
        typeof data.media?.liveDemoUrl === 'string'
          ? data.media.liveDemoUrl.trim()
          : ''
    });

    const restoredStep = Number(data.currentStep);
    if (Number.isInteger(restoredStep) && restoredStep >= 1 && restoredStep <= steps.length) {
      setCurrentStep(restoredStep);
    }

    setCompletedSteps(new Set());
  };

  const updateDraftUrl = (id) => {
    if (!id) return;

    const url = new URL(window.location.href);
    url.searchParams.set('draftId', id);
    window.history.replaceState(null, '', url.toString());
  };

  const markSnapshotDirty = (snapshot) => {
    latestSnapshotRef.current = snapshot;
    hasUnsavedChangesRef.current = snapshot !== latestSavedSnapshotRef.current;
  };

  const categories = GIG_CATEGORY_OPTIONS;
  const selectedCategoryId = basics.categoryId;
  const selectedSubcategoryId = basics.subcategoryId;

  const subcategories = GIG_SUBCATEGORY_OPTIONS(selectedCategoryId);
  const serviceTypes = GIG_SERVICE_TYPE_OPTIONS(
    selectedCategoryId,
    selectedSubcategoryId
  );

  const categorySpecificFieldDefinitions = useMemo(
    () =>
      getGigCategoryFields({
        categoryId: basics.categoryId,
        subcategoryId: basics.subcategoryId,
        serviceType: basics.serviceType
      }),
    [basics.categoryId, basics.subcategoryId, basics.serviceType]
  );

  const categorySpecificFieldErrors = useMemo(
    () =>
      validateGigCategoryFields(
        categorySpecificFieldDefinitions,
        categorySpecificFields
      ),
    [categorySpecificFieldDefinitions, categorySpecificFields]
  );

  const filteredSkills = useMemo(() => {
    const normalizedQuery = deferredSkillQuery.trim().toLowerCase();

    return ALL_SKILLS_DATABASE.filter((skill) => {
      const matchesQuery =
        !normalizedQuery ||
        skill.toLowerCase().includes(normalizedQuery);

      return matchesQuery && !basics.skills.includes(skill);
    });
  }, [deferredSkillQuery, basics.skills]);

  const selectedSkillItems = basics.skills;

  const addSkill = (skill) => {
    setBasics((previous) => (
      previous.skills.includes(skill)
        ? previous
        : { ...previous, skills: [...previous.skills, skill] }
    ));
    setSkillQuery('');
    setVisibleSkillCount(24);
  };

  const handleCategorySpecificFieldChange = (fieldKey, value) => {
    setCategorySpecificFields((previous) => ({
      ...previous,
      [fieldKey]: value
    }));

    setTouchedFields((previous) => ({
      ...previous,
      [`categorySpecific.${fieldKey}`]: true
    }));

    setFieldErrors((previous) => {
      const next = { ...previous };
      const nextCategoryErrors = { ...(next.categorySpecific || {}) };

      delete nextCategoryErrors[fieldKey];

      if (Object.keys(nextCategoryErrors).length > 0) {
        next.categorySpecific = nextCategoryErrors;
      } else {
        delete next.categorySpecific;
      }

      return next;
    });
  };

  const removeSkill = (skillToRemove) => {
    setBasics((previous) => ({
      ...previous,
      skills: previous.skills.filter((skill) => skill !== skillToRemove)
    }));
  };

  const toggleDiscoveryValue = (field, value) => {
    setDiscovery((previous) => {
      const current = Array.isArray(previous[field]) ? previous[field] : [];
      return {
        ...previous,
        [field]: current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value]
      };
    });
  };

  const addDiscoveryKeyword = (rawValue) => {
    const value = String(rawValue || '').trim().replace(/\s+/g, ' ');
    if (!value || value.length > 40) return false;

    setDiscovery((previous) => {
      const exists = previous.keywords.some(
        (keyword) => keyword.toLowerCase() === value.toLowerCase()
      );

      if (exists || previous.keywords.length >= 10) return previous;
      return { ...previous, keywords: [...previous.keywords, value] };
    });

    return true;
  };

  const removeDiscoveryKeyword = (keywordToRemove) => {
    setDiscovery((previous) => ({
      ...previous,
      keywords: previous.keywords.filter((keyword) => keyword !== keywordToRemove)
    }));
  };

  const selectedCategory = categories.find(
    (category) => category.id === selectedCategoryId
  ) || null;

  const selectedSubcategory = subcategories.find(
    (subcategory) => subcategory.id === selectedSubcategoryId
  ) || null;

  const isTitleLengthValid =
    basics.title.trim().length >= 3 && basics.title.trim().length <= 120;

  const descriptionText = useMemo(
    () => richTextToPlainText(description),
    [description]
  );

  const descriptionCharacterCount = descriptionText.length;
  const descriptionWordCount = descriptionText
    ? descriptionText.split(/\s+/).filter(Boolean).length
    : 0;

  const isDescriptionComplete = descriptionCharacterCount >= 50;

  const getExtraValidationErrors = () => {
    const errors = {};

    extras.forEach((extra, index) => {
      const prefix = `extra.${extra?.id || index}`;
      const title = String(extra?.title || '').trim();
      const rawPrice = String(extra?.price ?? '').trim();
      const price = Number(rawPrice);
      const scopeDescription = String(
        extra?.scope?.description || ''
      ).trim();

      if (!title) {
        errors[`${prefix}.title`] = 'Add a title for this extra.';
      }

      if (!rawPrice || !Number.isFinite(price) || price <= 0) {
        errors[`${prefix}.price`] =
          'Extra price must be greater than 0.';
      }

      if (!scopeDescription) {
        errors[`${prefix}.scope`] =
          'Describe what this extra adds to the service.';
      }
    });

    return errors;
  };

  const basePriceNumber = Number(pricing.basePrice);
  const isMultiPackage = pricing.packageModel === 'multi';

  const isSinglePricingComplete =
    pricing.packageModel === 'single' &&
    Boolean(pricing.currency) &&
    pricing.basePrice !== '' &&
    Number.isFinite(basePriceNumber) &&
    basePriceNumber > 0;

  const arePackagePricesComplete =
    isMultiPackage &&
    packages.length === 3 &&
    ['Basic', 'Standard', 'Premium'].every((tierName) => {
      const pkg = packages.find((item) => item.tierName === tierName);
      return (
        pkg &&
        String(pkg.price ?? '').trim() !== '' &&
        Number.isFinite(Number(pkg.price)) &&
        Number(pkg.price) > 0
      );
    });

  const isPricingComplete =
    Boolean(pricing.currency) &&
    (isSinglePricingComplete || arePackagePricesComplete);

  const extraValidationErrors = getExtraValidationErrors();
  const areExtrasComplete = Object.keys(extraValidationErrors).length === 0;

  const deliveryDaysNumber = Number(delivery.deliveryDays);
  const revisionsNumber = Number(delivery.revisions);
  const isUnlimitedRevisions = delivery.revisions === 'unlimited';
  const isRevisionAllowanceValid =
    isUnlimitedRevisions ||
    (delivery.revisions !== '' &&
      Number.isInteger(revisionsNumber) &&
      revisionsNumber >= 0);
  const hasOnlyMeaningfulListItems = (items) =>
    Array.isArray(items) &&
    items.length > 0 &&
    items.every((item) => String(item || '').trim().length > 0);

  const isExcludedListValid =
    delivery.excludedItems.length === 0 ||
    hasOnlyMeaningfulListItems(delivery.excludedItems);

  const isScopeComplete =
    hasOnlyMeaningfulListItems(delivery.includedItems) &&
    hasOnlyMeaningfulListItems(delivery.deliverables) &&
    isExcludedListValid;

  const isPackageDeliveryComplete =
    isMultiPackage &&
    packages.length === 3 &&
    packages.every((pkg) => {
      const days = Number(pkg.deliveryDays);
      const revisions =
        pkg.revisions === 'unlimited' ? -1 : Number(pkg.revisions);
      const included = Array.isArray(pkg.includedItems)
        ? pkg.includedItems
        : [];
      const excluded = Array.isArray(pkg.excludedItems)
        ? pkg.excludedItems
        : [];
      const deliverables = Array.isArray(pkg.deliverables)
        ? pkg.deliverables
        : [];
      const features = Array.isArray(pkg.features)
        ? pkg.features
        : [];

      return (
        Number.isInteger(days) &&
        days > 0 &&
        Number.isInteger(revisions) &&
        revisions >= -1 &&
        hasOnlyMeaningfulListItems(included) &&
        (excluded.length === 0 || hasOnlyMeaningfulListItems(excluded)) &&
        hasOnlyMeaningfulListItems(deliverables) &&
        hasOnlyMeaningfulListItems(features)
      );
    });

  const isDeliveryComplete = isMultiPackage
    ? isPackageDeliveryComplete
    : (
        delivery.deliveryDays !== '' &&
        Number.isInteger(deliveryDaysNumber) &&
        deliveryDaysNumber > 0 &&
        isRevisionAllowanceValid &&
        isScopeComplete
      );

  const getRequirementValidation = (requirement) => {
    const questionValid = String(requirement.question || '').trim().length > 0;

    if (requirement.type !== 'multiple-choice') {
      return {
        questionValid,
        optionsValid: true
      };
    }

    const meaningfulOptions = Array.isArray(requirement.options)
      ? requirement.options.filter((option) => String(option || '').trim().length > 0)
      : [];

    return {
      questionValid,
      optionsValid: meaningfulOptions.length >= 2
    };
  };

  const isRequirementsComplete =
    Array.isArray(requirements) &&
    requirements.length > 0 &&
    requirements.every((requirement) => {
      const validation = getRequirementValidation(requirement);

      return (
        Boolean(requirement.type) &&
        typeof requirement.required === 'boolean' &&
        validation.questionValid &&
        validation.optionsValid
      );
    });

  const getFaqValidation = (faq) => ({
    questionValid: String(faq?.question || '').trim().length > 0,
    answerValid: String(faq?.answer || '').trim().length > 0
  });

  const isFaqsComplete =
    Array.isArray(faqs) &&
    faqs.every((faq) => {
      const validation = getFaqValidation(faq);
      return validation.questionValid && validation.answerValid;
    });

  const isUsageRightsPolicyComplete = Object.values(GIG_USAGE_RIGHTS_POLICIES).some(
    (policy) => policy.value === usageRightsPolicy
  );

  const descriptionGuidance = !descriptionText
    ? 'Explain what you provide, what the buyer receives, and what to expect.'
    : descriptionCharacterCount < 50
      ? `Add ${50 - descriptionCharacterCount} more meaningful character${
          50 - descriptionCharacterCount === 1 ? '' : 's'
        } so buyers have enough context.`
      : descriptionCharacterCount < 140
        ? 'Good foundation. Add the buyer outcome, key inclusions, and any important expectations.'
        : descriptionCharacterCount < 300
          ? 'Strong description. Make sure the service, buyer fit, and boundaries are easy to understand.'
          : 'Strong buyer-facing detail. Keep it focused, specific, and easy to scan.';

  const isBasicsComplete =
    isTitleLengthValid &&
    Boolean(basics.categoryId) &&
    Boolean(basics.subcategoryId) &&
    Boolean(basics.serviceType) &&
    Object.keys(categorySpecificFieldErrors).length === 0;

  const effectiveCompletedSteps = useMemo(() => {
    const next = new Set(completedSteps);

    if (isBasicsComplete) {
      next.add(1);
    } else {
      next.delete(1);
    }

    if (isDescriptionComplete) {
      next.add(2);
    } else {
      next.delete(2);
    }

    if (isPricingComplete) {
      next.add(3);
    } else {
      next.delete(3);
    }

    if (isDeliveryComplete) {
      next.add(4);
    } else {
      next.delete(4);
    }

    if (isRequirementsComplete) {
      next.add(5);
    } else {
      next.delete(5);
    }

    if (
      Boolean(media.cover) &&
      !media.cover.validationError &&
      media.gallery.every((item) => !item.validationError)
    ) {
      next.add(6);
    } else {
      next.delete(6);
    }

    if (isFaqsComplete) {
      next.add(8);
    } else {
      next.delete(8);
    }

    const discoveryValid =
      Array.isArray(discovery.keywords) &&
      discovery.keywords.length <= 10 &&
      discovery.keywords.every((keyword) => {
        const value = String(keyword || '').trim();
        return value.length >= 1 && value.length <= 40;
      }) &&
      Array.isArray(discovery.languages) &&
      discovery.languages.every((language) => GIG_DISCOVERY_LANGUAGES.includes(language)) &&
      Array.isArray(discovery.targetAudience) &&
      discovery.targetAudience.every((audience) => GIG_DISCOVERY_TARGET_AUDIENCES.includes(audience));

    if (discoveryValid) {
      next.add(7);
    } else {
      next.delete(7);
    }

    return next;
  }, [
    completedSteps,
    isBasicsComplete,
    isDescriptionComplete,
    isPricingComplete,
    isDeliveryComplete,
    isRequirementsComplete,
    media,
    isFaqsComplete,
    discovery,
    extras,
    areExtrasComplete,
    extraValidationErrors
  ]);

  const queueDraftSave = (snapshot, { immediate = false } = {}) => {
    pendingSnapshotRef.current = snapshot;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    if (immediate) {
      requestDraftSave(snapshot);
      return;
    }

    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      requestDraftSave(pendingSnapshotRef.current);
    }, 900);
  };

  const requestDraftSave = (snapshot) => {
    if (!snapshot || !draftHydratedRef.current) return Promise.resolve();

    const normalizedSnapshot = String(snapshot);
    if (
      normalizedSnapshot === latestSavedSnapshotRef.current &&
      !pendingSnapshotRef.current
    ) {
      hasUnsavedChangesRef.current = false;
      return Promise.resolve();
    }

    const sequence = ++saveSequenceRef.current;
    latestRequestedSequenceRef.current = sequence;
    pendingSnapshotRef.current = null;
    setSaveState('saving');

    const saveOperation = async () => {
      const parsedSnapshot = JSON.parse(normalizedSnapshot);
      const nextVersion = draftVersionRef.current + 1;

      const payload = {
        draftData: parsedSnapshot,
        draftVersion: nextVersion
      };

      try {
        let response;

        if (isManagementEdit && managementGigId) {
          response = await API.put(
            `/gigs/${managementGigId}/manage`,
            { draftData: parsedSnapshot }
          );
        } else if (draftIdRef.current) {
          response = await API.put(
            `/gigs/drafts/${draftIdRef.current}`,
            payload
          );
        } else {
          response = await API.post('/gigs/drafts', payload);
        }

        const savedDraft = response.data?.draft || response.data?.gig;
        if (!savedDraft?.id) {
          throw new Error('Gig save response did not include a gig ID.');
        }

        draftIdRef.current = savedDraft.id;
        draftVersionRef.current =
          Number(savedDraft.draftVersion) || nextVersion;

        if (sequence < latestRequestedSequenceRef.current) {
          return;
        }

        latestSavedSnapshotRef.current = normalizedSnapshot;
        latestSnapshotRef.current = normalizedSnapshot;
        hasUnsavedChangesRef.current = false;
        setLastSavedAt(savedDraft.updatedAt || new Date().toISOString());
        setSaveState('saved');

        if (!isManagementEdit) {
          updateDraftUrl(savedDraft.id);
        }
      } catch (error) {
        if (sequence < latestRequestedSequenceRef.current) {
          return;
        }

        if (error?.response?.status === 409 && error.response.data?.draft) {
          const serverDraft = error.response.data.draft;
          draftVersionRef.current = Number(serverDraft.draftVersion) || draftVersionRef.current;
        }

        setSaveState('error');
        hasUnsavedChangesRef.current = true;
      }
    };

    savePromiseRef.current = savePromiseRef.current
      .catch(() => undefined)
      .then(saveOperation);

    return savePromiseRef.current;
  };

  const handleSaveDraft = async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    const snapshot = latestSnapshotRef.current || JSON.stringify(serializeGigDraft());
    pendingSnapshotRef.current = null;
    await requestDraftSave(snapshot);
  };

  useEffect(() => {
    let cancelled = false;

    const requestedDraftId = searchParams.get('draftId');

    if (isManagementEdit && managementGigId) {
      API.get(`/gigs/${managementGigId}/manage`)
        .then((response) => {
          if (cancelled) return;

          const managedGig = response.data;
          if (!managedGig?.id) {
            throw new Error('Managed gig was not returned.');
          }

          draftIdRef.current = managedGig.id;
          draftVersionRef.current = Number(managedGig.draftVersion) || 0;
          setPendingEditStatus(managedGig.pendingEditStatus || null);

          const sourceData =
            managedGig.draftData &&
            typeof managedGig.draftData === 'object'
              ? managedGig.draftData
              : {};

          const firstPackage = Array.isArray(managedGig.packages)
            ? managedGig.packages[0]
            : null;

          const hydratedData = {
            ...sourceData,
            basics: {
              ...(sourceData.basics || {}),
              title: sourceData.basics?.title || managedGig.title || '',
              categoryId:
                sourceData.basics?.categoryId ||
                managedGig.category ||
                '',
              subcategoryId:
                sourceData.basics?.subcategoryId ||
                managedGig.subcategoryId ||
                '',
              serviceType:
                sourceData.basics?.serviceType || '',
              skills: Array.isArray(sourceData.basics?.skills)
                ? sourceData.basics.skills
                : []
            },
            description:
              typeof sourceData.description === 'string'
                ? sourceData.description
                : managedGig.description || '',
            pricing: {
              ...(sourceData.pricing || {}),
              basePrice:
                sourceData.pricing?.basePrice ??
                firstPackage?.price ??
                '',
              currency:
                sourceData.pricing?.currency || 'INR',
              packageModel:
                sourceData.pricing?.packageModel ||
                (managedGig.isTiered ? 'multi' : 'single')
            },
            packages:
              Array.isArray(sourceData.packages) && sourceData.packages.length > 0
                ? sourceData.packages
                : (Array.isArray(managedGig.packages)
                    ? managedGig.packages.map((pkg) => ({
                        tierName: pkg.tierName,
                        price: pkg.price,
                        deliveryDays: pkg.deliveryDays,
                        revisions:
                          pkg.revisions === -1 ? 'unlimited' : pkg.revisions,
                        description: pkg.description || '',
                        scope:
                          pkg.scope && typeof pkg.scope === 'object'
                            ? pkg.scope
                            : {},
                        features: Array.isArray(pkg.features)
                          ? pkg.features
                          : []
                      }))
                    : []),
            extras:
              Array.isArray(sourceData.extras)
                ? sourceData.extras
                : (Array.isArray(managedGig.extras)
                    ? managedGig.extras.map((extra) => ({
                        id: extra.id,
                        title: extra.title || '',
                        price: extra.price ?? '',
                        scope:
                          extra.scope && typeof extra.scope === 'object'
                            ? {
                                description:
                                  typeof extra.scope.description === 'string'
                                    ? extra.scope.description
                                    : ''
                              }
                            : { description: '' }
                      }))
                    : []),
            delivery: {
              ...(sourceData.delivery || {}),
              deliveryDays:
                sourceData.delivery?.deliveryDays ??
                firstPackage?.deliveryDays ??
                '',
              revisions:
                sourceData.delivery?.revisions ??
                (firstPackage?.revisions === -1
                  ? 'unlimited'
                  : firstPackage?.revisions ?? ''),
              acceptingOrders:
                typeof sourceData.delivery?.acceptingOrders === 'boolean'
                  ? sourceData.delivery.acceptingOrders
                  : true,
              unavailableUntil:
                typeof sourceData.delivery?.unavailableUntil === 'string'
                  ? sourceData.delivery.unavailableUntil
                  : '',
              activeOrderLimit:
                sourceData.delivery?.activeOrderLimit === null ||
                typeof sourceData.delivery?.activeOrderLimit === 'undefined'
                  ? ''
                  : String(sourceData.delivery.activeOrderLimit)
            },
            media: {
              ...(sourceData.media || {}),
              cover:
                sourceData.media?.cover ||
                (managedGig.coverImage
                  ? { url: managedGig.coverImage }
                  : null)
            },
            requirements: Array.isArray(sourceData.requirements)
              ? sourceData.requirements
              : [],
            faqs: Array.isArray(sourceData.faqs)
              ? sourceData.faqs
              : []
          };

          restoreGigDraft({ draftData: hydratedData });
          const managementSavedData = {
            ...hydratedData,
            delivery: (() => {
                const managementDelivery = { ...(hydratedData.delivery || {}) };

                delete managementDelivery.acceptingOrders;
                delete managementDelivery.unavailableUntil;

                return managementDelivery;
              })()
          };
          latestSavedSnapshotRef.current = JSON.stringify(managementSavedData);
          latestSnapshotRef.current = latestSavedSnapshotRef.current;
          hasUnsavedChangesRef.current = false;
          setLastSavedAt(managedGig.updatedAt || null);
          setSaveState('saved');

          if (managedGig.pendingEditStatus === 'PENDING_REVIEW') {
            setSubmissionState('submitted');
          } else {
            setSubmissionState('idle');
          }
        })
        .catch(() => {
          if (!cancelled) setSaveState('error');
        })
        .finally(() => {
          if (!cancelled) draftHydratedRef.current = true;
        });

      return () => {
        cancelled = true;
      };
    }

    if (!requestedDraftId) {
      draftHydratedRef.current = true;
      return undefined;
    }

    API.get(`/gigs/drafts/${requestedDraftId}`)
      .then((response) => {
        if (cancelled) return;

        const savedDraft = response.data?.draft;
        if (!savedDraft) {
          throw new Error('Saved draft was not returned.');
        }

        draftIdRef.current = savedDraft.id;
        draftVersionRef.current = Number(savedDraft.draftVersion) || 0;
        restoreGigDraft(savedDraft);
        latestSavedSnapshotRef.current = JSON.stringify(savedDraft.draftData || {});
        latestSnapshotRef.current = latestSavedSnapshotRef.current;
        hasUnsavedChangesRef.current = false;
        setLastSavedAt(savedDraft.updatedAt || null);
        setSaveState('saved');
        setModerationFeedback(
          ['NEEDS_CHANGES', 'REJECTED'].includes(savedDraft.status)
            ? {
                status: savedDraft.status,
                reasonCode: savedDraft.moderationReasonCode || '',
                findings: Array.isArray(savedDraft.moderationFindings?.findings)
                  ? savedDraft.moderationFindings.findings
                  : []
              }
            : null
        );
        if (savedDraft.status === 'PENDING_REVIEW') {
          setSubmissionState('submitted');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSaveState('error');
        }
      })
      .finally(() => {
        if (!cancelled) {
          draftHydratedRef.current = true;
        }
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams, managementGigId, isManagementEdit]);

  const draftSnapshot = JSON.stringify(
    isManagementEdit ? serializeManagementDraft() : serializeGigDraft()
  );

  useEffect(() => {
    if (!draftHydratedRef.current) return;

    if (
      !initialSnapshotEstablishedRef.current &&
      !draftIdRef.current &&
      !latestSavedSnapshotRef.current
    ) {
      initialSnapshotEstablishedRef.current = true;
      latestSavedSnapshotRef.current = draftSnapshot;
      latestSnapshotRef.current = draftSnapshot;
      hasUnsavedChangesRef.current = false;
      return;
    }

    initialSnapshotEstablishedRef.current = true;
    markSnapshotDirty(draftSnapshot);

    if (draftSnapshot === latestSavedSnapshotRef.current) {
      setSaveState('saved');
      return;
    }

    queueDraftSave(draftSnapshot);
  }, [draftSnapshot]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!hasUnsavedChangesRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const currentStepData = steps[currentStep - 1];

  const furthestReachableStep = useMemo(
    () => Math.min(
      steps.length,
      Math.max(
        currentStep,
        effectiveCompletedSteps.size ? Math.max(...effectiveCompletedSteps) + 1 : 1
      )
    ),
    [currentStep, effectiveCompletedSteps]
  );

  const completionPercent = Math.round(
    (effectiveCompletedSteps.size / steps.length) * 100
  );

  const qualityScore = useMemo(() => {
    const skillsCount = Array.isArray(basics.skills) ? basics.skills.length : 0;
    const validFaqCount = Array.isArray(faqs)
      ? faqs.filter(
          (faq) =>
            String(faq?.question || '').trim().length > 0 &&
            String(faq?.answer || '').trim().length > 0
        ).length
      : 0;
    const validRequirementCount = Array.isArray(requirements)
      ? requirements.filter((requirement) => {
          const questionValid =
            String(requirement.question || '').trim().length > 0;
          const optionsValid =
            requirement.type !== 'multiple-choice' ||
            (Array.isArray(requirement.options)
              ? requirement.options.filter(
                  (option) => String(option || '').trim().length > 0
                ).length >= 2
              : false);

          return (
            Boolean(requirement.type) &&
            typeof requirement.required === 'boolean' &&
            questionValid &&
            optionsValid
          );
        }).length
      : 0;
    const hasValidCover = Boolean(media.cover) && !media.cover.validationError;
    const validGalleryCount = Array.isArray(media.gallery)
      ? media.gallery.filter((item) => !item.validationError).length
      : 0;

    const basicsScore =
      (isTitleLengthValid ? 5 : 0) +
      (basics.categoryId ? 3 : 0) +
      (basics.subcategoryId ? 3 : 0) +
      (basics.serviceType ? 2 : 0) +
      (skillsCount >= 3 ? 2 : skillsCount > 0 ? 1 : 0);

    const descriptionScore =
      descriptionCharacterCount < 50
        ? Math.round((descriptionCharacterCount / 50) * 8)
        : descriptionCharacterCount < 140
          ? 12
          : descriptionCharacterCount < 300
            ? 18
            : 20;

    const scopeScore =
      (hasOnlyMeaningfulListItems(delivery.includedItems) ? 5 : 0) +
      (hasOnlyMeaningfulListItems(delivery.deliverables) ? 5 : 0) +
      (delivery.excludedItems.length > 0 && isExcludedListValid ? 5 : 0);

    const packageDeliveryComplete =
      isMultiPackage &&
      packages.length === 3 &&
      packages.every((pkg) => {
        const days = Number(pkg.deliveryDays);
        const revisions =
          pkg.revisions === 'unlimited' ? -1 : Number(pkg.revisions);

        return (
          Number.isInteger(days) &&
          days > 0 &&
          Number.isInteger(revisions) &&
          revisions >= -1
        );
      });

    const pricingDeliveryScore =
      (isPricingComplete ? 7.5 : 0) +
      (isMultiPackage
        ? (packageDeliveryComplete ? 4 : 0)
        : (delivery.deliveryDays !== '' &&
            Number.isInteger(deliveryDaysNumber) &&
            delivery.deliveryDays > 0
          ? 4
          : 0)) +
      (isMultiPackage
        ? (packageDeliveryComplete ? 3.5 : 0)
        : (isRevisionAllowanceValid ? 3.5 : 0));

    const requirementsScore =
      validRequirementCount > 0 && isRequirementsComplete ? 10 : 0;

    const mediaScore =
      (hasValidCover ? 10 : 0) +
      (validGalleryCount > 0 ? 5 : 0);

    const faqScore = validFaqCount > 0 && isFaqsComplete ? 10 : 0;

    const signals = [
      {
        id: 'basics',
        label: 'Basics',
        weight: 15,
        score: Math.min(15, basicsScore),
        step: 1
      },
      {
        id: 'description',
        label: 'Description quality',
        weight: 20,
        score: Math.min(20, descriptionScore),
        step: 2
      },
      {
        id: 'scope',
        label: 'Scope + deliverables',
        weight: 15,
        score: Math.min(15, scopeScore),
        step: 4
      },
      {
        id: 'pricing-delivery',
        label: 'Pricing + delivery',
        weight: 15,
        score: Math.min(15, pricingDeliveryScore),
        step: 3
      },
      {
        id: 'requirements',
        label: 'Buyer requirements',
        weight: 10,
        score: Math.min(10, requirementsScore),
        step: 5
      },
      {
        id: 'media',
        label: 'Media',
        weight: 15,
        score: Math.min(15, mediaScore),
        step: 6
      },
      {
        id: 'faq',
        label: 'FAQ',
        weight: 10,
        score: Math.min(10, faqScore),
        step: 8
      }
    ];

    const total = Math.round(signals.reduce((sum, signal) => sum + signal.score, 0));

    const qualityBand =
      total >= 85
        ? {
            label: 'High quality',
            description: 'Strong buyer-facing coverage across the quality signals available now.'
          }
        : total >= 70
          ? {
              label: 'Strong foundation',
              description: 'The Gig is taking shape well, with a few meaningful improvements still available.'
            }
          : total >= 40
            ? {
                label: 'Developing',
                description: 'The core offer is forming, but several high-value areas can still be strengthened.'
              }
            : {
                label: 'Needs work',
                description: 'Focus on the highest-value gaps first to make the service clearer and more trustworthy.'
              };

    const suggestions = [];

    if (!isBasicsComplete) {
      suggestions.push({
        id: 'basics-required',
        step: 1,
        priority: 100,
        title: 'Complete your service basics',
        detail: 'Finish the title and category hierarchy so buyers can understand what the service is.'
      });
    } else if (skillsCount < 3) {
      suggestions.push({
        id: 'basics-skills',
        step: 1,
        priority: 55,
        title: 'Add more relevant skills',
        detail: 'Use at least three focused skills or tags to improve service clarity and matching.'
      });
    }

    if (descriptionCharacterCount < 140) {
      suggestions.push({
        id: 'description-detail',
        step: 2,
        priority: 95,
        title: 'Strengthen the service description',
        detail:
          descriptionCharacterCount < 50
            ? 'Explain what you provide, what the buyer receives, and what to expect.'
            : 'Add the buyer outcome, key inclusions, and important expectations.'
      });
    } else if (descriptionCharacterCount < 300) {
      suggestions.push({
        id: 'description-polish',
        step: 2,
        priority: 60,
        title: 'Add more buyer-facing detail',
        detail: 'Make the service, buyer fit, and boundaries especially easy to understand.'
      });
    }

    const packageScopeNeedsAttention =
      isMultiPackage &&
      packages.some((pkg) => {
        const included = Array.isArray(pkg.includedItems) ? pkg.includedItems : [];
        const deliverables = Array.isArray(pkg.deliverables) ? pkg.deliverables : [];
        const features = Array.isArray(pkg.features) ? pkg.features : [];

        return (
          !included.some((item) => String(item || '').trim()) ||
          !deliverables.some((item) => String(item || '').trim()) ||
          !features.some((item) => String(item || '').trim())
        );
      });

    if (
      (isMultiPackage && packageScopeNeedsAttention) ||
      (!isMultiPackage &&
        (!hasOnlyMeaningfulListItems(delivery.includedItems) ||
          !hasOnlyMeaningfulListItems(delivery.deliverables)))
    ) {
      suggestions.push({
        id: 'scope-required',
        step: 4,
        priority: 90,
        title: 'Clarify scope and deliverables',
        detail: isMultiPackage
          ? 'Complete the included work, deliverables, and features for every package.'
          : 'State what is included and the concrete outputs the buyer will receive.'
      });
    } else if (!isMultiPackage && delivery.excludedItems.length === 0) {
      suggestions.push({
        id: 'scope-boundaries',
        step: 4,
        priority: 45,
        title: 'Clarify important exclusions',
        detail: 'Add meaningful boundaries where they help prevent buyer misunderstandings.'
      });
    }

    const packageCommercialNeedsAttention =
      isMultiPackage &&
      packages.some((pkg) => {
        const days = Number(pkg.deliveryDays);
        const revisions =
          pkg.revisions === 'unlimited' ? -1 : Number(pkg.revisions);

        return (
          !Number.isInteger(days) ||
          days <= 0 ||
          !Number.isInteger(revisions) ||
          revisions < -1
        );
      });

    if (
      !isPricingComplete ||
      (isMultiPackage
        ? packageCommercialNeedsAttention
        : delivery.deliveryDays === '' ||
          !Number.isInteger(deliveryDaysNumber) ||
          delivery.deliveryDays <= 0 ||
          !isRevisionAllowanceValid)
    ) {
      suggestions.push({
        id: 'pricing-delivery',
        step: 4,
        priority: 85,
        title: 'Complete purchase expectations',
        detail: 'Make price, delivery timing, and revision allowance clear and valid.'
      });
    }

    if (validRequirementCount === 0 || !isRequirementsComplete) {
      suggestions.push({
        id: 'requirements',
        step: 5,
        priority: 70,
        title: 'Strengthen buyer requirements',
        detail: 'Add clear questions or inputs needed before you can begin the work.'
      });
    }

    if (!hasValidCover) {
      suggestions.push({
        id: 'media-cover',
        step: 6,
        priority: 100,
        title: 'Add a strong cover image',
        detail: 'A clear primary image helps buyers understand and trust the service at a glance.'
      });
    } else if (validGalleryCount === 0) {
      suggestions.push({
        id: 'media-gallery',
        step: 6,
        priority: 50,
        title: 'Show more of your best work',
        detail: 'Add valid gallery images to provide additional visual evidence of the service.'
      });
    }

    if (validFaqCount === 0 || !isFaqsComplete) {
      suggestions.push({
        id: 'faq',
        step: 8,
        priority: 40,
        title: 'Add buyer-facing FAQs',
        detail: 'Answer likely buyer questions early to reduce uncertainty before purchase.'
      });
    }

    const strongestSignals = [...signals]
      .filter((signal) => signal.score > 0)
      .sort(
        (a, b) =>
          b.score / b.weight - a.score / a.weight ||
          b.score - a.score
      )
      .slice(0, 2);

    return {
      score: total,
      qualityBand,
      signals,
      strongestSignals,
      suggestions: suggestions
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 3)
    };
  }, [
    basics,
    descriptionCharacterCount,
    delivery,
    requirements,
    faqs,
    media,
    isTitleLengthValid,
    isBasicsComplete,
    isPricingComplete,
    isRevisionAllowanceValid,
    packages,
    isMultiPackage,
    isExcludedListValid,
    deliveryDaysNumber,
    isRequirementsComplete,
    isFaqsComplete
  ]);

  const validationSummary = useMemo(() => {
    const blockers = [];
    const warnings = [];

    const addBlocker = (step, message, detail = null) => {
      blockers.push({ step, message, detail });
    };

    const addWarning = (step, message, detail = null) => {
      warnings.push({ step, message, detail });
    };

    if (!isBasicsComplete) {
      const basicsErrors = [];
      if (!isTitleLengthValid) {
        basicsErrors.push(
          basics.title.trim()
            ? 'Title must be between 3 and 120 characters.'
            : 'Add a service title.'
        );
      }
      if (!basics.categoryId) basicsErrors.push('Select a primary category.');
      if (!basics.subcategoryId) basicsErrors.push('Select a subcategory.');
      if (!basics.serviceType) basicsErrors.push('Select a service type.');

      Object.values(categorySpecificFieldErrors).forEach((message) => {
        basicsErrors.push(message);
      });

      addBlocker(
        1,
        'Complete your service basics.',
        basicsErrors.join(' ')
      );
    }

    if (!isDescriptionComplete) {
      addBlocker(
        2,
        'Add a meaningful service description.',
        descriptionText
          ? 'The description needs at least 50 meaningful characters.'
          : 'A service description is required.'
      );
    }

    if (!isPricingComplete) {
      const pricingIssues = [];

      if (pricing.packageModel === 'multi') {
        packages.forEach((pkg) => {
          if (
            String(pkg.price).trim() === '' ||
            !Number.isFinite(Number(pkg.price)) ||
            !(Number(pkg.price) > 0)
          ) {
            pricingIssues.push(`${pkg.tierName} price must be greater than 0.`);
          }
        });

        if (packages.length !== 3) {
          pricingIssues.push('Basic, Standard, and Premium packages are required.');
        }
      } else {
        const rawPrice = String(pricing.basePrice).trim();

        if (!rawPrice) {
          pricingIssues.push('Enter a base price.');
        } else if (
          !Number.isFinite(Number(rawPrice)) ||
          !(Number(rawPrice) > 0)
        ) {
          pricingIssues.push('Base price must be greater than 0.');
        }
      }

      if (!pricing.currency) pricingIssues.push('Select a currency.');

      addBlocker(3, 'Complete your pricing.', pricingIssues.join(' '));
    }

    if (!areExtrasComplete) {
      const extraIssues = extras.flatMap((extra, index) => {
        const prefix = `extra.${extra?.id || index}`;
        const issues = [];
        const errors = extraValidationErrors;

        Object.keys(errors)
          .filter((key) => key.startsWith(`${prefix}.`))
          .forEach((key) => {
            issues.push(errors[key]);
          });

        return issues;
      });

      addBlocker(
        3,
        'Complete your optional extras.',
        extraIssues.join(' ')
      );
    }

    if (!isDeliveryComplete) {
      const deliveryIssues = [];

      if (pricing.packageModel === 'multi') {
        packages.forEach((pkg) => {
          const days = Number(pkg.deliveryDays);
          const revisions =
            pkg.revisions === 'unlimited' ? -1 : Number(pkg.revisions);
          const included = Array.isArray(pkg.includedItems) ? pkg.includedItems : [];
          const excluded = Array.isArray(pkg.excludedItems) ? pkg.excludedItems : [];
          const deliverables = Array.isArray(pkg.deliverables) ? pkg.deliverables : [];
          const features = Array.isArray(pkg.features) ? pkg.features : [];

          if (!Number.isInteger(days) || days <= 0) {
            deliveryIssues.push(`${pkg.tierName} needs a positive delivery time.`);
          }

          if (!Number.isInteger(revisions) || revisions < -1) {
            deliveryIssues.push(`${pkg.tierName} needs a valid revision allowance.`);
          }

          if (
            !included.length ||
            included.some((item) => !String(item || '').trim())
          ) {
            deliveryIssues.push(`${pkg.tierName} needs at least one included item.`);
          }

          if (excluded.some((item) => !String(item || '').trim())) {
            deliveryIssues.push(`${pkg.tierName} has an incomplete excluded item.`);
          }

          if (
            !deliverables.length ||
            deliverables.some((item) => !String(item || '').trim())
          ) {
            deliveryIssues.push(`${pkg.tierName} needs at least one deliverable.`);
          }

          if (
            !features.length ||
            features.some((item) => !String(item || '').trim())
          ) {
            deliveryIssues.push(`${pkg.tierName} needs at least one feature.`);
          }
        });
      } else {
        const rawDelivery = String(delivery.deliveryDays).trim();
        const rawRevisions = String(delivery.revisions).trim();

        if (!rawDelivery) {
          deliveryIssues.push('Set a delivery time.');
        } else if (
          !Number.isInteger(Number(rawDelivery)) ||
          !(Number(rawDelivery) > 0)
        ) {
          deliveryIssues.push('Delivery time must be a positive whole number of days.');
        }

        if (!rawRevisions) {
          deliveryIssues.push('Select a revision allowance.');
        } else if (
          !isRevisionAllowanceValid
        ) {
          deliveryIssues.push('Revision allowance must be 0 or more, or unlimited.');
        }

        if (!hasOnlyMeaningfulListItems(delivery.includedItems)) {
          deliveryIssues.push('Add at least one included item and complete all included items.');
        }

        if (!isExcludedListValid) {
          deliveryIssues.push('Complete or remove blank excluded items.');
        }

        if (!hasOnlyMeaningfulListItems(delivery.deliverables)) {
          deliveryIssues.push('Add at least one deliverable and complete all deliverables.');
        }
      }

      addBlocker(
        4,
        'Complete your scope and delivery details.',
        deliveryIssues.join(' ')
      );
    }

    if (!isRequirementsComplete) {
      const requirementIssueCount = requirements.filter((requirement) => {
        const validation = getRequirementValidation(requirement);
        return (
          !requirement.type ||
          typeof requirement.required !== 'boolean' ||
          !validation.questionValid ||
          !validation.optionsValid
        );
      }).length;

      addBlocker(
        5,
        'Complete your buyer requirements.',
        requirements.length === 0
          ? 'Add at least one buyer requirement.'
          : `${requirementIssueCount} requirement${requirementIssueCount === 1 ? '' : 's'} need attention.`
      );
    }

    const mediaBlocker =
      !media.cover
        ? 'Add a cover image.'
        : media.cover.validationError
          ? media.cover.validationError
          : media.gallery.some((item) => item.validationError)
            ? 'Fix or remove invalid gallery images.'
            : media.video?.validationError
              ? media.video.validationError
              : null;

    if (mediaBlocker) {
      addBlocker(6, 'Fix your media.', mediaBlocker);
    }

    if (faqs.length === 0) {
      addWarning(
        8,
        'FAQs are recommended.',
        'Add buyer-facing questions and answers to reduce uncertainty.'
      );
    } else if (!isFaqsComplete) {
      const faqIssueCount = faqs.filter((faq) => {
        const validation = getFaqValidation(faq);
        return !validation.questionValid || !validation.answerValid;
      }).length;

      addWarning(
        8,
        'Some FAQs still need attention.',
        `${faqIssueCount} FAQ${faqIssueCount === 1 ? '' : 's'} need completion before they can help buyers.`
      );
    }

    if (!isUsageRightsPolicyComplete) {
      addBlocker(
        8,
        'Select a usage and ownership policy.',
        'Choose the structured usage and ownership policy that applies to this gig before submitting it for review.'
      );
    }

    if (!platformRulesAcknowledged) {
      addBlocker(
        8,
        'Acknowledge the marketplace rules.',
        'You must agree to the marketplace rules before submitting this gig for review.'
      );
    }

    return {
      blockers,
      warnings,
      isReadyForCurrentChecks: blockers.length === 0
    };
  }, [
    basics,
    descriptionText,
    pricing,
    delivery,
    requirements,
    media,
    faqs,
    isBasicsComplete,
    isDescriptionComplete,
    categorySpecificFieldErrors,
    isPricingComplete,
    isDeliveryComplete,
    isRequirementsComplete,
    isTitleLengthValid,
    isRevisionAllowanceValid,
    isExcludedListValid,
    isFaqsComplete,
    isUsageRightsPolicyComplete,
    platformRulesAcknowledged,
    extras,
    areExtrasComplete,
    extraValidationErrors
  ]);

  const validateBasics = () => {
    const nextErrors = {};
    const titleLength = basics.title.trim().length;

    if (titleLength < 3) {
      nextErrors.title = 'Title must be at least 3 characters.';
    } else if (titleLength > 120) {
      nextErrors.title = 'Title must be 120 characters or fewer.';
    }

    if (!basics.categoryId) {
      nextErrors.categoryId = 'Please select a primary category.';
    }

    if (!basics.subcategoryId) {
      nextErrors.subcategoryId = 'Please select a subcategory.';
    }

    if (!basics.serviceType) {
      nextErrors.serviceType = 'Please select a service type.';
    }

    const categorySpecificErrors = validateGigCategoryFields(
      categorySpecificFieldDefinitions,
      categorySpecificFields
    );

    if (Object.keys(categorySpecificErrors).length > 0) {
      nextErrors.categorySpecific = categorySpecificErrors;
    }

    setFieldErrors(nextErrors);
    setTouchedFields({
      title: true,
      categoryId: true,
      subcategoryId: true,
      serviceType: true,
      ...Object.fromEntries(
        categorySpecificFieldDefinitions.map((field) => [
          `categorySpecific.${field.key}`,
          true
        ])
      )
    });

    return Object.keys(nextErrors).length === 0;
  };

  const handleBasicsChange = (field, value) => {
    setBasics((previous) => {
      const next = { ...previous, [field]: value };

      if (field === 'categoryId') {
        next.subcategoryId = '';
        next.serviceType = '';
      }

      if (field === 'subcategoryId') {
        next.serviceType = '';
      }

      return next;
    });

    setTouchedFields((previous) => ({
      ...previous,
      [field]: true
    }));

    setFieldErrors((previous) => {
      const next = { ...previous };
      delete next[field];

      if (field === 'categoryId') {
        delete next.subcategoryId;
        delete next.serviceType;
        delete next.categorySpecific;
      }

      if (field === 'subcategoryId') {
        delete next.serviceType;
        delete next.categorySpecific;
      }

      if (field === 'serviceType') {
        delete next.categorySpecific;
      }

      return next;
    });
  };

  const goToStep = (stepId) => {
    if (stepId >= 1 && stepId <= furthestReachableStep) {
      setCurrentStep(stepId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const validateDescription = () => {
    if (!isDescriptionComplete) {
      setFieldErrors((previous) => ({
        ...previous,
        description: descriptionText
          ? 'Description must contain at least 50 meaningful characters.'
          : 'Service description is required.'
      }));

      setTouchedFields((previous) => ({
        ...previous,
        description: true
      }));

      return false;
    }

    setFieldErrors((previous) => {
      const next = { ...previous };
      delete next.description;
      return next;
    });

    setTouchedFields((previous) => ({
      ...previous,
      description: true
    }));

    return true;
  };

  const handleDescriptionChange = (nextValue) => {
    setDescription(nextValue);

    setFieldErrors((previous) => {
      if (!previous.description) return previous;

      const next = { ...previous };
      delete next.description;
      return next;
    });

    setTouchedFields((previous) => ({
      ...previous,
      description: true
    }));
  };

  const handlePackageChange = (packageIndex, field, value) => {
    setPackages((previous) =>
      previous.map((pkg, index) =>
        index === packageIndex ? { ...pkg, [field]: value } : pkg
      )
    );
  };

  const handlePackageListChange = (packageIndex, field, itemIndex, value) => {
    setPackages((previous) =>
      previous.map((pkg, index) => {
        if (index !== packageIndex) return pkg;
        const items = Array.isArray(pkg[field]) ? [...pkg[field]] : [];
        items[itemIndex] = value;
        return { ...pkg, [field]: items };
      })
    );
  };

  const handlePackageListAdd = (packageIndex, field) => {
    setPackages((previous) =>
      previous.map((pkg, index) =>
        index === packageIndex
          ? {
              ...pkg,
              [field]: [
                ...(Array.isArray(pkg[field]) ? pkg[field] : []),
                ''
              ]
            }
          : pkg
      )
    );
  };

  const handlePackageListRemove = (packageIndex, field, itemIndex) => {
    setPackages((previous) =>
      previous.map((pkg, index) =>
        index === packageIndex
          ? {
              ...pkg,
              [field]: (Array.isArray(pkg[field]) ? pkg[field] : []).filter(
                (_, currentIndex) => currentIndex !== itemIndex
              )
            }
          : pkg
      )
    );
  };

  const handleExtraChange = (extraIndex, field, value) => {
    setExtras((previous) =>
      previous.map((extra, index) =>
        index === extraIndex
          ? { ...extra, [field]: value }
          : extra
      )
    );
  };

  const handleExtraScopeChange = (extraIndex, value) => {
    setExtras((previous) =>
      previous.map((extra, index) =>
        index === extraIndex
          ? {
              ...extra,
              scope: {
                ...(extra.scope || {}),
                description: value
              }
            }
          : extra
      )
    );
  };

  const handleExtraAdd = () => {
    setExtras((previous) => [
      ...previous,
      {
        id: `extra-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: '',
        price: '',
        scope: {
          description: ''
        }
      }
    ]);
  };

  const handleExtraRemove = (extraIndex) => {
    setExtras((previous) =>
      previous.filter((_, index) => index !== extraIndex)
    );
  };


  const validateExtras = () => {
    const nextErrors = getExtraValidationErrors();

    setFieldErrors((previous) => {
      const next = { ...previous };

      Object.keys(next).forEach((key) => {
        if (key.startsWith('extra.')) {
          delete next[key];
        }
      });

      return {
        ...next,
        ...nextErrors
      };
    });

    setTouchedFields((previous) => ({
      ...previous,
      extras: true
    }));

    return Object.keys(nextErrors).length === 0;
  };

  const validatePackages = () => {
    if (pricing.packageModel !== 'multi') return true;

    const nextErrors = {};

    packages.forEach((pkg) => {
      const prefix = `package.${pkg.tierName}`;
      const price = Number(pkg.price);
      const days = Number(pkg.deliveryDays);
      const revisions =
        pkg.revisions === 'unlimited' ? -1 : Number(pkg.revisions);
      const included = Array.isArray(pkg.includedItems) ? pkg.includedItems : [];
      const excluded = Array.isArray(pkg.excludedItems) ? pkg.excludedItems : [];
      const deliverables = Array.isArray(pkg.deliverables) ? pkg.deliverables : [];
      const features = Array.isArray(pkg.features) ? pkg.features : [];

      if (!Number.isFinite(price) || price <= 0) {
        nextErrors[`${prefix}.price`] = 'Enter a positive package price.';
      }
      if (!Number.isInteger(days) || days <= 0) {
        nextErrors[`${prefix}.deliveryDays`] =
          'Delivery must be a positive whole number of days.';
      }
      if (!Number.isInteger(revisions) || revisions < -1) {
        nextErrors[`${prefix}.revisions`] =
          'Use 0 or more revisions, or unlimited.';
      }
      if (
        included.length === 0 ||
        included.some((item) => !String(item || '').trim())
      ) {
        nextErrors[`${prefix}.includedItems`] =
          'Add and complete at least one included item.';
      }
      if (excluded.some((item) => !String(item || '').trim())) {
        nextErrors[`${prefix}.excludedItems`] =
          'Complete or remove blank excluded items.';
      }
      if (
        deliverables.length === 0 ||
        deliverables.some((item) => !String(item || '').trim())
      ) {
        nextErrors[`${prefix}.deliverables`] =
          'Add and complete at least one deliverable.';
      }
      if (
        features.length === 0 ||
        features.some((item) => !String(item || '').trim())
      ) {
        nextErrors[`${prefix}.features`] =
          'Add and complete at least one feature.';
      }
    });

    if (packages.length !== 3) {
      nextErrors.packages = 'Basic, Standard, and Premium are required.';
    }

    setFieldErrors((previous) => ({
      ...previous,
      ...nextErrors
    }));
    setTouchedFields((previous) => ({
      ...previous,
      packages: true
    }));

    return Object.keys(nextErrors).length === 0;
  };

  const validatePricing = () => {
    const nextErrors = {};
    const rawPrice = String(pricing.basePrice).trim();

    if (pricing.packageModel === 'single') {
      if (!rawPrice) {
        nextErrors.basePrice = 'Enter a base price for your service.';
      } else if (!Number.isFinite(Number(rawPrice))) {
        nextErrors.basePrice = 'Enter a valid numeric price.';
      } else if (!(Number(rawPrice) > 0)) {
        nextErrors.basePrice = 'Base price must be greater than 0.';
      }
    } else if (pricing.packageModel === 'multi') {
      const allowedTiers = new Set(['Basic', 'Standard', 'Premium']);
      const seenTiers = new Set();

      if (packages.length !== 3) {
        nextErrors.packages = 'Basic, Standard, and Premium are required.';
      }

      packages.forEach((pkg) => {
        const prefix = `package.${pkg.tierName}`;
        const price = Number(pkg.price);

        if (!allowedTiers.has(pkg.tierName) || seenTiers.has(pkg.tierName)) {
          nextErrors[`${prefix}.tierName`] =
            'Basic, Standard, and Premium must each appear once.';
        }
        seenTiers.add(pkg.tierName);

        if (!Number.isFinite(price) || price <= 0) {
          nextErrors[`${prefix}.price`] = 'Enter a positive package price.';
        }
      });

      for (const tierName of ['Basic', 'Standard', 'Premium']) {
        if (!seenTiers.has(tierName)) {
          nextErrors.packages = 'Basic, Standard, and Premium are required.';
          break;
        }
      }
    } else {
      nextErrors.packageModel = 'Select a pricing model.';
    }

    if (!pricing.currency) {
      nextErrors.currency = 'Please select a currency.';
    }

    const extraErrors = getExtraValidationErrors();

    Object.assign(nextErrors, extraErrors);

    setFieldErrors((previous) => {
      const next = { ...previous };

      Object.keys(next).forEach((key) => {
        if (
          ['basePrice', 'currency', 'packageModel', 'packages'].includes(key) ||
          key.startsWith('package.') ||
          key.startsWith('extra.')
        ) {
          delete next[key];
        }
      });

      return { ...next, ...nextErrors };
    });

    setTouchedFields((previous) => ({
      ...previous,
      basePrice: true,
      currency: true,
      packageModel: true,
      packages: pricing.packageModel === 'multi' ? true : previous.packages,
      extras: extras.length > 0 ? true : previous.extras
    }));

    return Object.keys(nextErrors).length === 0;
  };

  const handlePricingChange = (field, value) => {
    setPricing((previous) => ({
      ...previous,
      [field]: value
    }));

    setFieldErrors((previous) => {
      if (!previous[field]) return previous;

      const next = { ...previous };
      delete next[field];
      return next;
    });

    setTouchedFields((previous) => ({
      ...previous,
      [field]: true
    }));
  };

  const validateDelivery = () => {
    const nextErrors = {};
    const rawUnavailableUntil = String(delivery.unavailableUntil || '').trim();
    const rawActiveOrderLimit = String(delivery.activeOrderLimit || '').trim();

    if (rawActiveOrderLimit) {
      if (!/^\d+$/.test(rawActiveOrderLimit) || !Number.isSafeInteger(Number(rawActiveOrderLimit))) {
        nextErrors.activeOrderLimit = 'Active order limit must be a positive whole number.';
      } else if (Number(rawActiveOrderLimit) <= 0) {
        nextErrors.activeOrderLimit = 'Active order limit must be greater than 0.';
      }
    }

    if (!delivery.acceptingOrders && rawUnavailableUntil) {
      const parsedUnavailableUntil = new Date(`${rawUnavailableUntil}T00:00:00Z`);
      const isCalendarDateValid =
        /^\d{4}-\d{2}-\d{2}$/.test(rawUnavailableUntil) &&
        !Number.isNaN(parsedUnavailableUntil.getTime()) &&
        parsedUnavailableUntil.toISOString().slice(0, 10) === rawUnavailableUntil;

      if (!isCalendarDateValid) {
        nextErrors.unavailableUntil = 'Choose a valid unavailable-until date.';
      } else {
        const todayDateString = new Date().toISOString().split('T')[0];
        if (rawUnavailableUntil < todayDateString) {
          nextErrors.unavailableUntil = 'Unavailable-until date cannot be in the past.';
        }
      }
    }

    if (pricing.packageModel === 'multi') {
      const packagesValid = validatePackages();

      if (Object.keys(nextErrors).length > 0) {
        setFieldErrors((previous) => ({
          ...previous,
          ...nextErrors
        }));

        setTouchedFields((previous) => ({
          ...previous,
          unavailableUntil: true
        }));
      }

      return packagesValid && Object.keys(nextErrors).length === 0;
    }

    const rawDelivery = String(delivery.deliveryDays).trim();
    const rawRevisions = String(delivery.revisions).trim();
    const includedItems = Array.isArray(delivery.includedItems) ? delivery.includedItems : [];
    const excludedItems = Array.isArray(delivery.excludedItems) ? delivery.excludedItems : [];
    const deliverables = Array.isArray(delivery.deliverables) ? delivery.deliverables : [];
    const hasMeaningfulIncluded = includedItems.some(
      (item) => String(item || '').trim().length > 0
    );
    const hasMeaningfulDeliverable = deliverables.some(
      (item) => String(item || '').trim().length > 0
    );
    const hasBlankIncluded = includedItems.some(
      (item) => String(item || '').trim().length === 0
    );
    const hasBlankExcluded = excludedItems.length > 0 && excludedItems.some(
      (item) => String(item || '').trim().length === 0
    );
    const hasBlankDeliverable = deliverables.some(
      (item) => String(item || '').trim().length === 0
    );

    if (!rawDelivery) {
      nextErrors.deliveryDays = 'Enter the delivery time for your service.';
    } else if (!Number.isInteger(Number(rawDelivery))) {
      nextErrors.deliveryDays = 'Delivery time must be a whole number of days.';
    } else if (!(Number(rawDelivery) > 0)) {
      nextErrors.deliveryDays = 'Delivery time must be greater than 0 days.';
    }

    if (!rawRevisions) {
      nextErrors.revisions = 'Select how many revisions are included.';
    } else if (
      rawRevisions !== 'unlimited' &&
      (!Number.isInteger(Number(rawRevisions)) || Number(rawRevisions) < 0)
    ) {
      nextErrors.revisions = 'Revisions must be 0 or more, or unlimited.';
    }

    if (!hasMeaningfulIncluded) {
      nextErrors.includedItems = 'Add at least one included item.';
    } else if (hasBlankIncluded) {
      nextErrors.includedItems = 'Complete or remove blank included items.';
    }

    if (hasBlankExcluded) {
      nextErrors.excludedItems = 'Complete or remove blank excluded items.';
    }

    if (!hasMeaningfulDeliverable) {
      nextErrors.deliverables = 'Add at least one deliverable.';
    } else if (hasBlankDeliverable) {
      nextErrors.deliverables = 'Complete or remove blank deliverables.';
    }

    setFieldErrors((previous) => {
      const next = { ...previous };
      [
      'deliveryDays',
      'revisions',
      'includedItems',
      'excludedItems',
      'deliverables',
      'unavailableUntil',
      'activeOrderLimit'
    ].forEach((key) => delete next[key]);
      return { ...next, ...nextErrors };
    });

    setTouchedFields((previous) => ({
      ...previous,
      deliveryDays: true,
      revisions: true,
      includedItems: true,
      excludedItems: true,
      deliverables: true,
      unavailableUntil: true,
      activeOrderLimit: true
    }));

    return Object.keys(nextErrors).length === 0;
  };

  const saveManagementAvailability = (acceptingOrders, unavailableUntil) => {
    if (!isManagementEdit || !managementGigId) {
      return Promise.resolve();
    }

    const sequence = ++availabilitySaveSequenceRef.current;
    setSaveState('saving');

    const saveOperation = async () => {
      try {
        const response = await API.put(
          `/gigs/${managementGigId}/availability`,
          {
            acceptingOrders: Boolean(acceptingOrders),
            unavailableUntil: String(unavailableUntil || '').trim()
          }
        );

        if (sequence !== availabilitySaveSequenceRef.current) {
          return;
        }

        const updatedGig = response.data?.gig;
        setLastSavedAt(updatedGig?.updatedAt || new Date().toISOString());
        setSaveState('saved');
      } catch {
        if (sequence !== availabilitySaveSequenceRef.current) {
          return;
        }

        setSaveState('error');
      }
    };

    availabilitySavePromiseRef.current = availabilitySavePromiseRef.current
      .catch(() => undefined)
      .then(saveOperation);

    return availabilitySavePromiseRef.current;
  };

  const handleDeliveryChange = (field, value) => {
    const nextAcceptingOrders =
      field === 'acceptingOrders'
        ? Boolean(value)
        : Boolean(delivery.acceptingOrders);

    const nextUnavailableUntil =
      field === 'acceptingOrders' && value
        ? ''
        : field === 'unavailableUntil'
          ? String(value || '').trim()
          : String(delivery.unavailableUntil || '').trim();

    setDelivery((previous) => ({
      ...previous,
      [field]: value,
      ...(field === 'acceptingOrders' && value
        ? { unavailableUntil: '' }
        : {})
    }));

    if (
      isManagementEdit &&
      (field === 'acceptingOrders' || field === 'unavailableUntil')
    ) {
      saveManagementAvailability(
        nextAcceptingOrders,
        nextUnavailableUntil
      );
    }

    setFieldErrors((previous) => {
      if (!previous[field]) return previous;

      const next = { ...previous };
      delete next[field];
      return next;
    });

    setTouchedFields((previous) => ({
      ...previous,
      [field]: true
    }));
  };

  const handleDeliveryListChange = (field, index, value) => {
    setDelivery((previous) => {
      const updated = Array.isArray(previous[field]) ? [...previous[field]] : [];
      updated[index] = value;
      return {
        ...previous,
        [field]: updated
      };
    });

    setFieldErrors((previous) => {
      if (!previous[field]) return previous;

      const next = { ...previous };
      delete next[field];
      return next;
    });

    setTouchedFields((previous) => ({
      ...previous,
      [field]: true
    }));
  };

  const handleAddDeliveryListItem = (field) => {
    setDelivery((previous) => ({
      ...previous,
      [field]: [...(Array.isArray(previous[field]) ? previous[field] : []), '']
    }));

    setTouchedFields((previous) => ({
      ...previous,
      [field]: true
    }));
  };

  const handleRemoveDeliveryListItem = (field, index) => {
    setDelivery((previous) => {
      const currentItems = Array.isArray(previous[field]) ? previous[field] : [];
      return {
        ...previous,
        [field]: currentItems.filter((_, itemIndex) => itemIndex !== index)
      };
    });

    setFieldErrors((previous) => {
      if (!previous[field]) return previous;

      const next = { ...previous };
      delete next[field];
      return next;
    });

    setTouchedFields((previous) => ({
      ...previous,
      [field]: true
    }));
  };

  const validateRequirements = () => {
    const nextItems = {};
    let hasErrors = false;

    requirements.forEach((requirement) => {
      const validation = getRequirementValidation(requirement);
      const itemErrors = {};

      if (!validation.questionValid) {
        itemErrors.question = 'Enter a meaningful buyer question or input label.';
      }

      if (requirement.type === 'multiple-choice' && !validation.optionsValid) {
        itemErrors.options = 'Add at least two meaningful choices.';
      }

      if (Object.keys(itemErrors).length > 0) {
        nextItems[requirement.id] = itemErrors;
        hasErrors = true;
      }
    });

    const nextErrors = {
      step: requirements.length === 0
        ? 'Add at least one buyer requirement.'
        : null,
      items: nextItems
    };

    if (requirements.length === 0) {
      hasErrors = true;
    }

    setFieldErrors((previous) => ({
      ...previous,
      requirements: nextErrors
    }));

    setTouchedFields((previous) => ({
      ...previous,
      requirements: true
    }));

    return !hasErrors;
  };

  const updateRequirement = (requirementId, updater) => {
    setRequirements((previous) =>
      previous.map((requirement) =>
        requirement.id === requirementId
          ? { ...requirement, ...updater(requirement) }
          : requirement
      )
    );

    setFieldErrors((previous) => {
      if (!previous.requirements) return previous;

      const nextItems = { ...(previous.requirements.items || {}) };
      delete nextItems[requirementId];

      const next = {
        ...previous,
        requirements: {
          ...previous.requirements,
          items: nextItems,
          step: requirements.length > 0 ? null : previous.requirements.step
        }
      };

      return next;
    });

    setTouchedFields((previous) => ({
      ...previous,
      requirements: true
    }));
  };

  const handleRequirementChange = (requirementId, field, value) => {
    if (field === 'type') {
      updateRequirement(requirementId, (requirement) => ({
        type: value,
        options:
          value === 'multiple-choice'
            ? (
                requirement.options?.length
                  ? requirement.options
                  : ['', '']
              )
            : []
      }));
      return;
    }

    updateRequirement(requirementId, () => ({
      [field]: value
    }));
  };

  const handleRequirementOptionChange = (requirementId, optionIndex, value) => {
    updateRequirement(requirementId, (requirement) => {
      const options = Array.isArray(requirement.options)
        ? [...requirement.options]
        : ['', ''];

      options[optionIndex] = value;

      return { options };
    });
  };

  const handleAddRequirement = () => {
    setRequirements((previous) => [...previous, createRequirement()]);
    setFieldErrors((previous) => ({
      ...previous,
      requirements: {
        ...(previous.requirements || {}),
        step: null
      }
    }));
    setTouchedFields((previous) => ({
      ...previous,
      requirements: true
    }));
  };

  const handleRemoveRequirement = (requirementId) => {
    setRequirements((previous) =>
      previous.filter((requirement) => requirement.id !== requirementId)
    );

    setFieldErrors((previous) => {
      if (!previous.requirements) return previous;

      const nextItems = { ...(previous.requirements.items || {}) };
      delete nextItems[requirementId];

      return {
        ...previous,
        requirements: {
          ...previous.requirements,
          items: nextItems
        }
      };
    });

    setTouchedFields((previous) => ({
      ...previous,
      requirements: true
    }));
  };

  const handleAddRequirementOption = (requirementId) => {
    updateRequirement(requirementId, (requirement) => ({
      options: [
        ...(Array.isArray(requirement.options) ? requirement.options : []),
        ''
      ]
    }));
  };

  const handleRemoveRequirementOption = (requirementId, optionIndex) => {
    updateRequirement(requirementId, (requirement) => ({
      options: (Array.isArray(requirement.options) ? requirement.options : [])
        .filter((_, index) => index !== optionIndex)
    }));
  };

  const validateFaqs = () => {
    const nextItems = {};
    let hasErrors = false;

    faqs.forEach((faq) => {
      const validation = getFaqValidation(faq);
      const itemErrors = {};

      if (!validation.questionValid) {
        itemErrors.question = 'Enter a meaningful buyer-facing question.';
      }

      if (!validation.answerValid) {
        itemErrors.answer = 'Enter a meaningful answer for buyers.';
      }

      if (Object.keys(itemErrors).length > 0) {
        nextItems[faq.id] = itemErrors;
        hasErrors = true;
      }
    });

    const policyHasError = !isUsageRightsPolicyComplete;

    setFieldErrors((previous) => ({
      ...previous,
      faqs: {
        step: hasErrors
          ? 'Complete each FAQ or remove the unfinished FAQ.'
          : null,
        items: nextItems
      },
      usageRightsPolicy: policyHasError
        ? 'Select a usage and ownership policy before continuing.'
        : null
    }));

    setTouchedFields((previous) => ({
      ...previous,
      faqs: true,
      usageRightsPolicy: true
    }));

    return !hasErrors && !policyHasError;
  };

  const updateFaq = (faqId, updater) => {
    setFaqs((previous) =>
      previous.map((faq) =>
        faq.id === faqId
          ? { ...faq, ...updater(faq) }
          : faq
      )
    );

    setFieldErrors((previous) => {
      if (!previous.faqs) return previous;

      const nextItems = { ...(previous.faqs.items || {}) };
      delete nextItems[faqId];

      const remainingErrors = Object.keys(nextItems).length > 0;

      return {
        ...previous,
        faqs: {
          ...previous.faqs,
          step: remainingErrors ? previous.faqs.step : null,
          items: nextItems
        }
      };
    });

    setTouchedFields((previous) => ({
      ...previous,
      faqs: true
    }));
  };

  const handleFaqChange = (faqId, field, value) => {
    updateFaq(faqId, () => ({
      [field]: value
    }));
  };

  const handleAddFaq = () => {
    setFaqs((previous) => [...previous, createFaq()]);
    setTouchedFields((previous) => ({
      ...previous,
      faqs: true
    }));
  };

  const handleRemoveFaq = (faqId) => {
    setFaqs((previous) =>
      previous.filter((faq) => faq.id !== faqId)
    );

    setFieldErrors((previous) => {
      if (!previous.faqs) return previous;

      const nextItems = { ...(previous.faqs.items || {}) };
      delete nextItems[faqId];

      const hasRemainingErrors = Object.keys(nextItems).length > 0;

      return {
        ...previous,
        faqs: {
          ...previous.faqs,
          step: hasRemainingErrors
            ? previous.faqs.step
            : null,
          items: nextItems
        }
      };
    });

    setTouchedFields((previous) => ({
      ...previous,
      faqs: true
    }));
  };

  const clearMediaError = (key) => {
    setFieldErrors((previous) => {
      const mediaErrors = { ...(previous.media || {}) };
      delete mediaErrors[key];

      return {
        ...previous,
        media: mediaErrors
      };
    });
  };

  const handleCoverFileSelected = async (file) => {
    if (!file) return;

    const validation = await validateMediaFile(file, {
      label: 'Cover image'
    });

    if (validation.error) {
      setFieldErrors((previous) => ({
        ...previous,
        media: {
          ...(previous.media || {}),
          cover: validation.error
        }
      }));
      return;
    }

    try {
      const imageSrc = await fileToDataUrl(file);

      setPendingCoverFile(file);
      setCropImageSrc(imageSrc);
      clearMediaError('cover');
    } catch (error) {
      setFieldErrors((previous) => ({
        ...previous,
        media: {
          ...(previous.media || {}),
          cover:
            error.message ||
            'Unable to prepare the cover image.'
        }
      }));
    }
  };

  const handleCoverCropComplete = async (croppedBase64) => {
    const sourceFile = pendingCoverFile;

    if (!sourceFile) return;

    try {
      const croppedFile = dataUrlToFile(
        croppedBase64,
        `${sourceFile.name.replace(/\.[^.]+$/, '') || 'cover'}-cropped.jpg`
      );
      const dimensions = await readImageDimensions(croppedFile);
      const previewUrl = URL.createObjectURL(croppedFile);

      setCoverUploadProgress(0);

      const uploaded = await uploadGigMedia(croppedFile, {
        onUploadProgress: (event) => {
          if (!event.total) return;
          setCoverUploadProgress(
            Math.min(95, Math.round((event.loaded * 95) / event.total))
          );
        }
      });

      setCoverUploadProgress(100);

      setMedia((previous) => {
        if (previous.cover?.previewUrl) {
          URL.revokeObjectURL(previous.cover.previewUrl);
        }

        return {
          ...previous,
          cover: {
            id: previous.cover?.id || createMediaId(),
            file: croppedFile,
            previewUrl,
            url: uploaded.url || '',
            publicId: uploaded.publicId || '',
            resourceType: uploaded.resourceType || '',
            format: uploaded.format || '',
            name: croppedFile.name,
            size: croppedFile.size,
            type: croppedFile.type,
            width: dimensions.width,
            height: dimensions.height,
            validationError: ''
          }
        };
      });

      setCropImageSrc(null);
      setPendingCoverFile(null);
      window.setTimeout(() => setCoverUploadProgress(0), 220);
      clearMediaError('cover');
    } catch (error) {
      setCoverUploadProgress(0);
      setFieldErrors((previous) => ({
        ...previous,
        media: {
          ...(previous.media || {}),
          cover:
            error.message ||
            'Unable to save the cropped cover image.'
        }
      }));
    }
  };

  const removeCover = () => {
    setMedia((previous) => {
      if (previous.cover?.previewUrl) {
        URL.revokeObjectURL(previous.cover.previewUrl);
      }

      return {
        ...previous,
        cover: null
      };
    });

    setFieldErrors((previous) => ({
      ...previous,
      media: {
        ...(previous.media || {}),
        cover: undefined
      }
    }));
  };

  const handleVideoFileSelected = async (file) => {
    if (!file) return;

    const validation = validateVideoFile(file, {
      label: 'Service introduction video'
    });

    if (validation.error) {
      setFieldErrors((previous) => ({
        ...previous,
        media: {
          ...(previous.media || {}),
          video: validation.error
        }
      }));
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    let uploaded = null;
    let uploadError = '';

    try {
      setVideoUploadProgress(0);

      uploaded = await uploadGigMedia(file, {
        onUploadProgress: (event) => {
          if (!event.total) return;
          setVideoUploadProgress(
            Math.min(95, Math.round((event.loaded * 95) / event.total))
          );
        }
      });
    } catch (error) {
      uploadError =
        error?.response?.data?.error ||
        'Unable to upload the service introduction video.';
    }

    if (!uploadError) {
      setVideoUploadProgress(100);
    }

    setMedia((previous) => {
      if (previous.video?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previous.video.previewUrl);
      }

      return {
        ...previous,
        video: {
          id: previous.video?.id || createMediaId(),
          file,
          previewUrl,
          url: uploaded?.url || '',
          publicId: uploaded?.publicId || '',
          resourceType: uploaded?.resourceType || '',
          format: uploaded?.format || '',
          name: file.name,
          size: file.size,
          type: file.type,
          validationError: uploadError
        }
      };
    });

    if (uploadError) {
      setVideoUploadProgress(0);
    } else {
      window.setTimeout(() => setVideoUploadProgress(0), 220);
    }

    setFieldErrors((previous) => ({
      ...previous,
      media: {
        ...(previous.media || {}),
        video: uploadError || undefined
      }
    }));
  };

  const removeVideo = () => {
    setMedia((previous) => {
      if (previous.video?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previous.video.previewUrl);
      }

      return {
        ...previous,
        video: null
      };
    });

    setFieldErrors((previous) => ({
      ...previous,
      media: {
        ...(previous.media || {}),
        video: undefined
      }
    }));
  };

  const handleGalleryFilesSelected = async (filesList) => {
    const incomingFiles = Array.from(filesList || []);

    if (!incomingFiles.length) return;

    const nextItems = [];

    for (const file of incomingFiles) {
      const validation = await validateMediaFile(file, {
        label: `Gallery image "${file.name}"`
      });

      let previewUrl = null;

      if (!validation.error) {
        previewUrl = URL.createObjectURL(file);
      }

      nextItems.push({
        id: createMediaId(),
        file,
        previewUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        width: validation.width || 0,
        height: validation.height || 0,
        validationError: validation.error
      });
    }

    setMedia((previous) => ({
      ...previous,
      gallery: [
        ...previous.gallery,
        ...nextItems
      ]
    }));

    await Promise.all(
      nextItems.map(async (item) => {
        if (item.validationError) return;

        setGalleryUploadProgress((previous) => ({
          ...previous,
          [item.id]: 0
        }));

        try {
          const uploaded = await uploadGigMedia(item.file, {
            onUploadProgress: (event) => {
              if (!event.total) return;

              setGalleryUploadProgress((previous) => ({
                ...previous,
                [item.id]: Math.min(
                  95,
                  Math.round((event.loaded * 95) / event.total)
                )
              }));
            }
          });

          const uploadedItem = {
            ...item,
            url: uploaded.url || '',
            publicId: uploaded.publicId || '',
            resourceType: uploaded.resourceType || '',
            format: uploaded.format || ''
          };

          setMedia((previous) => ({
            ...previous,
            gallery: previous.gallery.map((galleryItem) =>
              galleryItem.id === item.id ? uploadedItem : galleryItem
            )
          }));

          setGalleryUploadProgress((previous) => ({
            ...previous,
            [item.id]: 100
          }));

          window.setTimeout(() => {
            setGalleryUploadProgress((previous) => {
              const next = { ...previous };
              delete next[item.id];
              return next;
            });
          }, 220);
        } catch (error) {
          const failedItem = {
            ...item,
            validationError:
              error?.response?.data?.error ||
              'Unable to upload this gallery image.'
          };

          setMedia((previous) => ({
            ...previous,
            gallery: previous.gallery.map((galleryItem) =>
              galleryItem.id === item.id ? failedItem : galleryItem
            )
          }));

          setGalleryUploadProgress((previous) => {
            const next = { ...previous };
            delete next[item.id];
            return next;
          });
        }
      })
    );

    setFieldErrors((previous) => {
      const galleryItems = {
        ...(previous.media?.galleryItems || {})
      };

      nextItems.forEach((item) => {
        if (item.validationError) {
          galleryItems[item.id] =
            item.validationError;
        }
      });

      return {
        ...previous,
        media: {
          ...(previous.media || {}),
          galleryItems
        }
      };
    });
  };

  const handleReplaceGalleryImage = async (
    galleryId,
    file
  ) => {
    if (!file) return;

    const validation = await validateMediaFile(file, {
      label: `Gallery image "${file.name}"`
    });

    const previewUrl = validation.error
      ? null
      : URL.createObjectURL(file);

    let uploaded = null;
    let uploadError = '';

    if (!validation.error) {
      try {
        uploaded = await uploadGigMedia(file);
      } catch (error) {
        uploadError =
          error?.response?.data?.error ||
          'Unable to upload this gallery image.';
      }
    }

    setMedia((previous) => ({
      ...previous,
      gallery: previous.gallery.map((item) => {
        if (item.id !== galleryId) return item;

        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }

        return {
          ...item,
          file,
          previewUrl,
          url: uploaded?.url || '',
          publicId: uploaded?.publicId || '',
          resourceType: uploaded?.resourceType || '',
          format: uploaded?.format || '',
          name: file.name,
          size: file.size,
          type: file.type,
          width: validation.width || 0,
          height: validation.height || 0,
          validationError: validation.error || uploadError
        };
      })
    }));

    setFieldErrors((previous) => {
      const galleryItems = {
        ...(previous.media?.galleryItems || {})
      };

      if (validation.error) {
        galleryItems[galleryId] =
          validation.error;
      } else {
        delete galleryItems[galleryId];
      }

      return {
        ...previous,
        media: {
          ...(previous.media || {}),
          galleryItems
        }
      };
    });
  };

  const removeGalleryImage = (galleryId) => {
    setMedia((previous) => {
      const item = previous.gallery.find(
        (galleryItem) => galleryItem.id === galleryId
      );

      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }

      return {
        ...previous,
        gallery: previous.gallery.filter(
          (galleryItem) =>
            galleryItem.id !== galleryId
        )
      };
    });

    setFieldErrors((previous) => {
      const galleryItems = {
        ...(previous.media?.galleryItems || {})
      };

      delete galleryItems[galleryId];

      return {
        ...previous,
        media: {
          ...(previous.media || {}),
          galleryItems
        }
      };
    });
  };

  const handleMoveGallery = (galleryId, direction) => {
    setMedia((previous) => {
      const currentIndex =
        previous.gallery.findIndex(
          (item) => item.id === galleryId
        );

      if (currentIndex < 0) return previous;

      const targetIndex =
        direction === 'up'
          ? currentIndex - 1
          : currentIndex + 1;

      if (
        targetIndex < 0 ||
        targetIndex >= previous.gallery.length
      ) {
        return previous;
      }

      const gallery = [...previous.gallery];

      [gallery[currentIndex], gallery[targetIndex]] = [
        gallery[targetIndex],
        gallery[currentIndex]
      ];

      return {
        ...previous,
        gallery
      };
    });
  };

  const handleGalleryDrop = (targetId) => {
    if (
      !draggedGalleryId ||
      draggedGalleryId === targetId
    ) {
      setDraggedGalleryId(null);
      return;
    }

    setMedia((previous) => {
      const fromIndex =
        previous.gallery.findIndex(
          (item) => item.id === draggedGalleryId
        );

      const toIndex =
        previous.gallery.findIndex(
          (item) => item.id === targetId
        );

      if (fromIndex < 0 || toIndex < 0) {
        return previous;
      }

      const gallery = [...previous.gallery];
      const [moved] = gallery.splice(fromIndex, 1);

      gallery.splice(toIndex, 0, moved);

      return {
        ...previous,
        gallery
      };
    });

    setDraggedGalleryId(null);
  };

  const isValidPortfolioLink = (value) => {
    try {
      const parsed = new URL(String(value || '').trim());
      return /^(https?:)$/i.test(parsed.protocol) && Boolean(parsed.hostname);
    } catch {
      return false;
    }
  };

  const addPortfolioLink = (rawValue) => {
    const value = String(rawValue || '').trim();

    if (!value) {
      setPortfolioLinkInputError('Enter a portfolio URL before adding a link.');
      return false;
    }

    if (!isValidPortfolioLink(value)) {
      setPortfolioLinkInputError(
        'Enter a valid portfolio URL using http:// or https://.'
      );
      return false;
    }

    setPortfolioLinkInputError('');

    setMedia((previous) => {
      const current = Array.isArray(previous.portfolioLinks)
        ? previous.portfolioLinks
        : [];
      if (current.some((item) => item.toLowerCase() === value.toLowerCase())) {
        return previous;
      }

      return {
        ...previous,
        portfolioLinks: [...current, value]
      };
    });

    return true;
  };

  const removePortfolioLink = (linkToRemove) => {
    setMedia((previous) => ({
      ...previous,
      portfolioLinks: (previous.portfolioLinks || []).filter(
        (item) => item !== linkToRemove
      )
    }));
  };

  const updateLiveDemoUrl = (rawValue) => {
    const value = String(rawValue || '').trim();

    setMedia((previous) => ({
      ...previous,
      liveDemoUrl: value
    }));

    setFieldErrors((previous) => {
      const mediaErrors = { ...(previous.media || {}) };

      if (!value || isValidPortfolioLink(value)) {
        delete mediaErrors.liveDemoUrl;
      } else {
        mediaErrors.liveDemoUrl =
          'Enter a valid live demo URL using http:// or https://.';
      }

      if (!mediaErrors.liveDemoUrl && mediaErrors.step?.includes('live demo')) {
        delete mediaErrors.step;
      }

      return {
        ...previous,
        media: mediaErrors
      };
    });
  };

  const validateMedia = () => {
    const nextMediaErrors = {};
    const galleryItems = {};
    const portfolioLinks = Array.isArray(media.portfolioLinks)
      ? media.portfolioLinks
      : [];
    const invalidPortfolioLinks = portfolioLinks.filter(
      (link) => !isValidPortfolioLink(link)
    );
    const liveDemoUrl = String(media.liveDemoUrl || '').trim();
    const invalidLiveDemoUrl = Boolean(liveDemoUrl) && !isValidPortfolioLink(liveDemoUrl);

    if (!media.cover) {
      nextMediaErrors.cover =
        'A cover image is required.';
    } else if (media.cover.validationError) {
      nextMediaErrors.cover =
        media.cover.validationError;
    }

    media.gallery.forEach((item) => {
      if (item.validationError) {
        galleryItems[item.id] =
          item.validationError;
      }
    });

    if (Object.keys(galleryItems).length > 0) {
      nextMediaErrors.galleryItems =
        galleryItems;
    }

    if (invalidPortfolioLinks.length > 0) {
      nextMediaErrors.portfolioLinks =
        'Remove or correct invalid portfolio links. Use full http:// or https:// URLs.';
    }

    if (invalidLiveDemoUrl) {
      nextMediaErrors.liveDemoUrl =
        'Enter a valid live demo URL using http:// or https://.';
    }

    if (media.video?.validationError) {
      nextMediaErrors.video = media.video.validationError;
    }

    if (
      nextMediaErrors.cover ||
      nextMediaErrors.galleryItems ||
      nextMediaErrors.portfolioLinks ||
      nextMediaErrors.liveDemoUrl ||
      nextMediaErrors.video
    ) {
      nextMediaErrors.step =
        nextMediaErrors.cover
          ? 'Add a valid cover image before continuing.'
          : nextMediaErrors.galleryItems
            ? 'Fix or remove the highlighted gallery images before continuing.'
            : nextMediaErrors.portfolioLinks
              ? 'Fix or remove the highlighted portfolio links before continuing.'
              : nextMediaErrors.liveDemoUrl
                ? 'Fix or remove the live demo URL before continuing.'
                : 'Fix or remove the service introduction video before continuing.';
    }

    setFieldErrors((previous) => ({
      ...previous,
      media: nextMediaErrors
    }));

    setTouchedFields((previous) => ({
      ...previous,
      media: true
    }));

    return (
      !nextMediaErrors.cover &&
      !nextMediaErrors.galleryItems &&
      !nextMediaErrors.portfolioLinks &&
      !nextMediaErrors.liveDemoUrl &&
      !nextMediaErrors.video
    );
  };

  const handleMoveFaq = (faqId, direction) => {
    setFaqs((previous) => {
      const currentIndex = previous.findIndex((faq) => faq.id === faqId);
      if (currentIndex < 0) return previous;

      const targetIndex =
        direction === 'up'
          ? currentIndex - 1
          : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= previous.length) {
        return previous;
      }

      const next = [...previous];
      [next[currentIndex], next[targetIndex]] = [
        next[targetIndex],
        next[currentIndex]
      ];

      return next;
    });

    setTouchedFields((previous) => ({
      ...previous,
      faqs: true
    }));
  };

  const validateDiscovery = () => {
    const nextErrors = {};

    if (!Array.isArray(discovery.keywords)) {
      nextErrors.keywords = 'Discovery keywords are invalid.';
    } else if (discovery.keywords.length > 10) {
      nextErrors.keywords = 'Use up to 10 discovery keywords.';
    } else if (discovery.keywords.some((keyword) => {
      const value = String(keyword || '').trim();
      return !value || value.length > 40;
    })) {
      nextErrors.keywords = 'Each discovery keyword must contain 1–40 characters.';
    }

    if (!Array.isArray(discovery.languages) || discovery.languages.some(
      (language) => !GIG_DISCOVERY_LANGUAGES.includes(language)
    )) {
      nextErrors.languages = 'Choose languages from the available options.';
    }

    if (!Array.isArray(discovery.targetAudience) || discovery.targetAudience.some(
      (audience) => !GIG_DISCOVERY_TARGET_AUDIENCES.includes(audience)
    )) {
      nextErrors.targetAudience = 'Choose target audiences from the available options.';
    }

    setFieldErrors((previous) => ({
      ...previous,
      discovery: nextErrors
    }));

    setTouchedFields((previous) => ({
      ...previous,
      discovery: true
    }));

    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep >= steps.length) return;

    if (currentStep === 1 && !validateBasics()) {
      return;
    }

    if (currentStep === 2 && !validateDescription()) {
      return;
    }

    if (currentStep === 3 && !validatePricing()) {
      return;
    }

    if (currentStep === 4 && !validateDelivery()) {
      return;
    }

    if (currentStep === 5 && !validateRequirements()) {
      return;
    }

    if (currentStep === 6 && !validateMedia()) {
      return;
    }

    if (currentStep === 7 && !validateDiscovery()) {
      return;
    }

    if (currentStep === 8 && !validateFaqs()) {
      return;
    }

    setCompletedSteps((previous) => {
      const next = new Set(previous);
      next.add(currentStep);
      return next;
    });

    setCurrentStep((previous) => Math.min(previous + 1, steps.length));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const handleSubmitGig = async () => {
    if (submissionState === 'submitting' || submissionState === 'submitted') return;

    setSubmissionError('');
    setSubmissionBlockers([]);

    if (!validationSummary.isReadyForCurrentChecks) {
      setSubmissionError('Fix the current blockers before submitting your gig.');
      return;
    }

    setSubmissionState('submitting');

    try {
      await handleSaveDraft();

      if (!draftIdRef.current) {
        throw new Error('Unable to save the gig draft before submission.');
      }

      const response = isManagementEdit
        ? await API.post(`/gigs/${managementGigId}/manage/submit`)
        : await API.post(`/gigs/drafts/${draftIdRef.current}/submit`);

      const submissionStatus = response.data?.submission?.status;
      const pendingEditStatus = response.data?.submission?.pendingEditStatus;

      if (
        isManagementEdit
          ? pendingEditStatus !== 'PENDING_REVIEW' || !managementGigId
          : submissionStatus !== 'PENDING_REVIEW'
      ) {
        throw new Error('Submission did not enter review status.');
      }

      setSubmissionState('submitted');
      setSaveState('saved');
      setModerationFeedback(null);
    } catch (error) {
      const blockers = Array.isArray(error?.response?.data?.blockers)
        ? error.response.data.blockers
        : [];

      setSubmissionBlockers(blockers);
      setSubmissionError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to submit the gig for review.'
      );
      setSubmissionState('error');
    }
  };

  const handleBack = () => {
    if (currentStep <= 1) return;
    setCurrentStep((previous) => Math.max(previous - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const titleCount = basics.title.length;

  const titleGuidance = !basics.title.trim()
    ? 'Use a specific service outcome buyers can understand quickly.'
    : titleCount < 3
      ? 'Add a few more characters so the service is clearly identified.'
      : titleCount < 20
        ? 'Good start. Make the outcome or service specific where possible.'
        : titleCount <= 120
          ? 'Looks clear. Keep the wording focused on the service you provide.'
          : 'Shorten the title to 120 characters or fewer.';

  const titleStateClass = touchedFields.title
    ? isTitleLengthValid
      ? 'border-emerald-500/40 focus:border-emerald-400'
      : 'border-red-500/50 focus:border-red-400'
    : 'border-slate-800 focus:border-cyan-500';

  const renderBasics = () => (
    <div className="mt-8 space-y-7">
      <section className="rounded-3xl border border-slate-800 bg-slate-950/35 p-5 sm:p-7">
        <div className="max-w-3xl">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
            Service identity
          </p>
          <h3 className="break-words text-xl sm:text-2xl font-black text-white mt-2">
            Tell buyers exactly what you provide
          </h3>
          <p className="text-sm leading-6 text-slate-500 mt-2">
            Start with a clear service title, then narrow it through the category hierarchy.
          </p>
        </div>

        <div className="mt-8 space-y-2.5">
          <div className="flex items-center justify-between gap-4">
            <label
              htmlFor="gig-title"
              className="text-xs font-black uppercase tracking-wider text-slate-300"
            >
              Service title <span className="text-pink-500">*</span>
            </label>
            <span
              className={`text-[11px] font-bold ${
                isTitleLengthValid ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              {titleCount}/120
            </span>
          </div>

          <input
            id="gig-title"
            type="text"
            maxLength={120}
            value={basics.title}
            onChange={(event) => handleBasicsChange('title', event.target.value)}
            placeholder="e.g. Build a responsive React dashboard for your startup"
            aria-invalid={Boolean(fieldErrors.title)}
            aria-describedby="gig-title-guidance gig-title-error"
            className={`w-full px-4 py-3.5 bg-slate-950 rounded-2xl text-sm text-white outline-none transition ${titleStateClass}`}
          />

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <p id="gig-title-guidance" className="text-xs leading-5 text-slate-500">
              {titleGuidance}
            </p>
            {fieldErrors.title && (
              <p
                id="gig-title-error"
                className="text-xs font-semibold text-red-400 sm:text-right"
              >
                {fieldErrors.title}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-950/35 p-5 sm:p-7">
        <div className="max-w-3xl">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
            Category hierarchy
          </p>
          <h3 className="text-xl sm:text-2xl font-black text-white mt-2">
            Narrow the service to the right category
          </h3>
          <p className="text-sm leading-6 text-slate-500 mt-2">
            Subcategories and service types become available only after their parent selection.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
          <SearchableSelect
            id="gig-category"
            label="Primary category"
            value={basics.categoryId}
            options={categories}
            placeholder="Select a category…"
            error={fieldErrors.categoryId}
            onChange={(value) => handleBasicsChange('categoryId', value)}
          />

          <SearchableSelect
            id="gig-subcategory"
            label="Subcategory"
            value={basics.subcategoryId}
            options={subcategories}
            disabled={!basics.categoryId}
            placeholder={
              basics.categoryId
                ? 'Select a subcategory…'
                : 'Select a category first…'
            }
            error={fieldErrors.subcategoryId}
            onChange={(value) => handleBasicsChange('subcategoryId', value)}
          />

          <SearchableSelect
            id="gig-service-type"
            label="Service type"
            value={basics.serviceType}
            options={serviceTypes}
            disabled={!basics.subcategoryId}
            placeholder={
              basics.subcategoryId
                ? 'Select a service type…'
                : 'Select a subcategory first…'
            }
            error={fieldErrors.serviceType}
            onChange={(value) => handleBasicsChange('serviceType', value)}
          />
          </div>

        {selectedCategory && selectedSubcategory && (
          <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500">
            <span className="max-w-full truncate rounded-lg border border-slate-800 bg-slate-950/70 px-2.5 py-1.5">
              {selectedCategory.name}
            </span>

            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-700" />

            <span className="max-w-full truncate rounded-lg border border-slate-800 bg-slate-950/70 px-2.5 py-1.5">
              {selectedSubcategory.name}
            </span>

            {basics.serviceType && (
              <>
                <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-700" />

                <span className="max-w-full truncate rounded-lg border border-cyan-500/15 bg-cyan-500/5 px-2.5 py-1.5 text-cyan-300/80">
                  {serviceTypes.find(
                    (serviceType) => serviceType.id === basics.serviceType
                  )?.name || basics.serviceType}
                </span>
              </>
            )}
          </div>
        )}
      </section>

      {categorySpecificFieldDefinitions.length > 0 && (
        <GigCategorySpecificFields
          fields={categorySpecificFieldDefinitions}
          values={categorySpecificFields}
          errors={categorySpecificFieldErrors}
          touchedFields={Object.fromEntries(
            categorySpecificFieldDefinitions.map((field) => [
              field.key,
              Boolean(touchedFields[`categorySpecific.${field.key}`])
            ])
          )}
          onChange={handleCategorySpecificFieldChange}
        />
      )}

      <section className="rounded-3xl border border-slate-800 bg-slate-950/35 p-5 sm:p-7">
        <div className="max-w-3xl">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
            Skills & tags
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-2">
                Add the skills buyers can search for
              </h3>
              <p className="text-sm leading-6 text-slate-500 mt-2">
                Choose the capabilities that best represent your service. Search the full SkillLaunch catalog; 3–10 relevant skills are recommended.
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                {basics.skills.length} selected
              </p>
              <p className={`text-[10px] font-bold mt-1 ${
                basics.skills.length >= 3 && basics.skills.length <= 10
                  ? 'text-emerald-400'
                  : 'text-slate-600'
              }`}>
                {basics.skills.length >= 3 && basics.skills.length <= 10
                  ? 'Recommended range'
                  : '3–10 recommended'}
              </p>
            </div>
          </div>

          <div className="mt-6 relative">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/80 px-3.5 transition focus-within:border-cyan-500/60">
              <Search className="w-4 h-4 shrink-0 text-slate-500" />

              <input
                id="gig-skills"
                type="text"
                value={skillQuery}
                onChange={(event) => {
                  setSkillQuery(event.target.value);
                  setVisibleSkillCount(24);
                }}
                placeholder="Search skills (e.g. React, Trading, SEO, Blender, Excel, Figma)…"
                className="w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-slate-600"
              />

              {skillQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSkillQuery('');
                    setVisibleSkillCount(24);
                  }}
                  aria-label="Clear skill search"
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-white transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between gap-3 px-1">
              <span className="text-[10px] font-bold text-slate-600">
                {filteredSkills.length.toLocaleString()} matching skills
              </span>

              {!skillQuery && (
                <span className="text-[10px] font-bold text-slate-600">
                  1,891 skills available
                </span>
              )}
            </div>
          </div>

          {selectedSkillItems.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Selected skills
                </span>
                <span className="text-[10px] font-bold text-slate-600">
                  {selectedSkillItems.length} selected
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedSkillItems.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-200"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      aria-label={`Remove ${skill}`}
                      className="rounded-md p-0.5 text-cyan-400 hover:bg-cyan-500/10 hover:text-white transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
              <div>
                <p className="text-xs font-black text-white">
                  {skillQuery ? 'Search results' : 'Explore skills'}
                </p>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  Click any skill to add it to your gig.
                </p>
              </div>

              <span className="text-[10px] font-bold text-slate-600">
                {filteredSkills.length.toLocaleString()} results
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto p-3 scrollbar-hide">
              {filteredSkills.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredSkills.slice(0, visibleSkillCount).map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => addSkill(skill)}
                        className="group flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-3.5 py-2.5 text-left text-xs font-bold text-slate-300 hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-cyan-200 transition"
                      >
                        <span className="min-w-0 truncate">
                          {skill}
                        </span>
                        <Plus className="w-3.5 h-3.5 shrink-0 text-slate-600 group-hover:text-cyan-400 transition" />
                      </button>
                    ))}
                  </div>

                  {filteredSkills.length > visibleSkillCount && (
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleSkillCount((count) =>
                          Math.min(count + 24, filteredSkills.length)
                        )
                      }
                      className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-400 hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-cyan-200 transition"
                    >
                      Show 24 more · {filteredSkills.length - visibleSkillCount} remaining
                    </button>
                  )}
                </>
              ) : (
                <div className="py-12 text-center">
                  <Search className="w-5 h-5 mx-auto text-slate-700" />
                  <p className="mt-2 text-xs font-bold text-slate-500">
                    No matching skills found.
                  </p>
                  <p className="mt-1 text-[10px] text-slate-700">
                    Try another keyword or broader spelling.
                  </p>
                </div>
              )}
            </div>
          </div>

          {basics.skills.length > 10 && (
            <div className="mt-3 rounded-xl border border-amber-500/15 bg-amber-500/5 px-3 py-2.5">
              <p className="text-[10px] font-bold text-amber-300/80">
                You have more than 10 skills selected. Keep only the most relevant skills for the strongest buyer signal.
              </p>
            </div>
          )}
        </div>
      </section>

      {!isBasicsComplete && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
          <p className="text-xs font-bold text-slate-400">
            Complete the required title and category selections to continue.
          </p>
        </div>
      )}
    </div>
  );

  const renderDescription = () => (
    <div className="mt-8 space-y-7">
      <section className="rounded-3xl border border-slate-800 bg-slate-950/35 p-5 sm:p-7">
        <div className="w-full min-w-0 max-w-3xl">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
            Service description
          </p>

          <h3 className="text-xl sm:text-2xl font-black text-white mt-2">
            Give buyers a clear reason to choose your service
          </h3>

          <p className="break-words text-sm leading-6 text-slate-500 mt-2">
            Explain what you provide, who it is for, what the buyer receives,
            and any important expectations or limitations.
          </p>
        </div>

        <div className="mt-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-2.5">
            <label
              htmlFor="service-description"
              className="text-xs font-black uppercase tracking-wider text-slate-300"
            >
              Description <span className="text-pink-500">*</span>
            </label>

            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600">
              <span>{descriptionWordCount} words</span>
              <span aria-hidden="true">·</span>
              <span>{descriptionCharacterCount} characters</span>
            </div>
          </div>

          <RichTextEditor
            id="service-description"
            value={description}
            onChange={handleDescriptionChange}
            error={Boolean(fieldErrors.description)}
          />

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <p className="text-xs leading-5 text-slate-500 max-w-2xl">
              {descriptionGuidance}
            </p>

            {fieldErrors.description && touchedFields.description && (
              <p
                id="service-description-error"
                className="text-xs font-semibold text-red-400 sm:text-right"
              >
                {fieldErrors.description}
              </p>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              ['What you provide', 'Describe the actual service and outcome.'],
              ['What they receive', 'Mention the main deliverables or inclusions.'],
              ['What to expect', 'Clarify fit, boundaries, or important conditions.']
            ].map(([title, detail]) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5"
              >
                <p className="text-xs font-black text-white">{title}</p>
                <p className="text-[11px] leading-5 text-slate-600 mt-1">
                  {detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {!isDescriptionComplete && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
          <p className="text-xs font-bold text-slate-400">
            A meaningful description of at least 50 characters is required before continuing.
          </p>
        </div>
      )}
    </div>
  );

  const renderPricing = () => {
    const priceError = touchedFields.basePrice ? fieldErrors.basePrice : null;
    const currencyError = touchedFields.currency ? fieldErrors.currency : null;

    return (
      <div className="mt-8 space-y-7">

        <section className="rounded-3xl border border-slate-800 bg-slate-950/35 p-5 sm:p-7">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
              Service pricing
            </p>

            <h3 className="text-xl sm:text-2xl font-black text-white mt-2">
              Choose your pricing structure
            </h3>

            <p className="text-sm leading-6 text-slate-500 mt-2 max-w-2xl">
              Keep one straightforward purchase option or offer Basic, Standard,
              and Premium packages with different commercial terms.
            </p>
          </div>

          <div className="mt-7 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              {
                value: 'single',
                title: 'Single price',
                detail: 'One purchase option for the complete service.'
              },
              {
                value: 'multi',
                title: 'Basic / Standard / Premium',
                detail: 'Three options with their own price and package terms.'
              }
            ].map((option) => (
              <label
                key={option.value}
                className={[
                  'flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition',
                  pricing.packageModel === option.value
                    ? 'border-cyan-500/40 bg-cyan-500/10'
                    : 'border-slate-800 bg-slate-950/60'
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="packageModel"
                  value={option.value}
                  checked={pricing.packageModel === option.value}
                  onChange={(event) =>
                    handlePricingChange('packageModel', event.target.value)
                  }
                  className="mt-1 h-4 w-4 accent-cyan-400"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-black text-white">
                    {option.title}
                  </span>
                  <span className="block text-xs leading-5 text-slate-500 mt-1">
                    {option.detail}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/35 p-5 sm:p-7">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
              Currency
            </p>
            <label
              htmlFor="gig-currency"
              className="block text-xs font-black uppercase tracking-wider text-slate-300 mt-2"
            >
              Display currency <span className="text-pink-500">*</span>
            </label>

            <select
              id="gig-currency"
              name="currency"
              value={pricing.currency}
              onChange={(event) => handlePricingChange('currency', event.target.value)}
              aria-invalid={Boolean(currencyError)}
              className={[
                'w-full mt-3 rounded-xl border bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none transition',
                currencyError
                  ? 'border-red-500/50 focus:border-red-400'
                  : 'border-slate-800 focus:border-cyan-500/60'
              ].join(' ')}
            >
              <option value="INR">INR — Indian Rupee</option>
            </select>

            <p className="text-xs leading-5 text-slate-600 mt-2">
              Your current platform currency is INR.
            </p>

            {currencyError && (
              <p role="alert" className="text-xs font-semibold text-red-400 mt-2">
                {currencyError}
              </p>
            )}
          </div>
        </section>

        {pricing.packageModel === 'single' ? (
          <section className="rounded-3xl border border-slate-800 bg-slate-950/35 p-5 sm:p-7">
            <label
              htmlFor="gig-base-price"
              className="text-xs font-black uppercase tracking-wider text-slate-300"
            >
              Base price <span className="text-pink-500">*</span>
            </label>

            <div className="mt-3 flex min-w-0 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
              <span className="inline-flex items-center px-3 border-r border-slate-800 text-sm font-black text-slate-500">
                INR
              </span>
              <input
                id="gig-base-price"
                name="basePrice"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="1"
                value={pricing.basePrice}
                onChange={(event) => handlePricingChange('basePrice', event.target.value)}
                aria-invalid={Boolean(priceError)}
                className="w-full min-w-0 bg-transparent px-3 py-3 text-sm font-bold text-white outline-none"
                placeholder="Enter your price"
              />
            </div>

            {priceError && (
              <p role="alert" className="text-xs font-semibold text-red-400 mt-2">
                {priceError}
              </p>
            )}
          </section>
        ) : (
          <section className="rounded-3xl border border-slate-800 bg-slate-950/35 p-5 sm:p-7">
            <div className="max-w-3xl">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
                Package pricing
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-2">
                Price each package separately
              </h3>
              <p className="text-sm leading-6 text-slate-500 mt-2">
                Basic, Standard, and Premium are all required for a multi-package gig.
              </p>
            </div>

            <div className="mt-7 grid grid-cols-1 xl:grid-cols-3 gap-4">
              {packages.map((pkg, packageIndex) => {
                const error = touchedFields.packages
                  ? fieldErrors[`package.${pkg.tierName}.price`]
                  : null;

                return (
                  <div
                    key={pkg.tierName}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-400">
                      Package {packageIndex + 1}
                    </p>
                    <h4 className="mt-1 text-lg font-black text-white">
                      {pkg.tierName}
                    </h4>

                    <label className="block mt-5 text-xs font-black uppercase tracking-wider text-slate-300">
                      Price <span className="text-pink-500">*</span>
                    </label>
                    <div className="mt-2 flex rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                      <span className="inline-flex items-center px-3 border-r border-slate-800 text-sm font-black text-slate-500">
                        INR
                      </span>
                      <input
                        type="number"
                        min="0.01"
                        step="1"
                        value={pkg.price}
                        onChange={(event) =>
                          handlePackageChange(
                            packageIndex,
                            'price',
                            event.target.value
                          )
                        }
                        className="w-full min-w-0 bg-transparent px-3 py-3 text-sm font-bold text-white outline-none"
                        placeholder="Enter price"
                      />
                    </div>

                    {error && (
                      <p role="alert" className="mt-2 text-xs font-semibold text-red-400">
                        {error}
                      </p>
                    )}

                    <label className="block mt-5 text-xs font-black uppercase tracking-wider text-slate-300">
                      Package summary
                    </label>
                    <textarea
                      rows="3"
                      maxLength="240"
                      value={pkg.description}
                      onChange={(event) =>
                        handlePackageChange(
                          packageIndex,
                          'description',
                          event.target.value
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm font-semibold text-white outline-none resize-y"
                      placeholder="Explain the value of this package."
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-slate-800 bg-slate-950/35 p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-3xl">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
                Optional extras
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-2">
                Offer paid add-ons
              </h3>
              <p className="text-sm leading-6 text-slate-500 mt-2">
                Give buyers optional additions they can ask for beyond the base service.
                Extras are optional, but each one needs a clear price and scope.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExtraAdd}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-2.5 text-xs font-black text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/15"
            >
              <Plus className="h-4 w-4" />
              Add extra
            </button>
          </div>

          {extras.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-800 bg-slate-950/45 px-4 py-6 text-center">
              <p className="text-sm font-bold text-slate-400">
                No extras added.
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Keep this empty when you do not offer optional paid additions.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {extras.map((extra, extraIndex) => {
                const prefix = `extra.${extra?.id || extraIndex}`;
                const titleError = touchedFields.extras
                  ? fieldErrors[`${prefix}.title`]
                  : null;
                const priceError = touchedFields.extras
                  ? fieldErrors[`${prefix}.price`]
                  : null;
                const scopeError = touchedFields.extras
                  ? fieldErrors[`${prefix}.scope`]
                  : null;

                return (
                  <article
                    key={extra.id || `extra-${extraIndex}`}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-400">
                          Extra {extraIndex + 1}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          Optional paid addition
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleExtraRemove(extraIndex)}
                        aria-label={`Remove extra ${extraIndex + 1}`}
                        className="shrink-0 rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-500 transition hover:border-red-500/30 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <div className="space-y-2">
                        <label
                          htmlFor={`gig-extra-title-${extraIndex}`}
                          className="block text-xs font-black uppercase tracking-wider text-slate-300"
                        >
                          Extra title
                        </label>
                        <input
                          id={`gig-extra-title-${extraIndex}`}
                          type="text"
                          maxLength={120}
                          value={extra.title}
                          onChange={(event) =>
                            handleExtraChange(
                              extraIndex,
                              'title',
                              event.target.value
                            )
                          }
                          aria-invalid={Boolean(titleError)}
                          className={[
                            'w-full rounded-xl border bg-slate-950 px-3 py-3 text-sm font-semibold text-white outline-none transition',
                            titleError
                              ? 'border-red-500/50 focus:border-red-400'
                              : 'border-slate-800 focus:border-cyan-500/60'
                          ].join(' ')}
                          placeholder="e.g. Express delivery"
                        />
                        {titleError && (
                          <p role="alert" className="text-xs font-semibold text-red-400">
                            {titleError}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor={`gig-extra-price-${extraIndex}`}
                          className="block text-xs font-black uppercase tracking-wider text-slate-300"
                        >
                          Extra price
                        </label>
                        <div
                          className={[
                            'flex overflow-hidden rounded-xl border bg-slate-950 transition',
                            priceError
                              ? 'border-red-500/50'
                              : 'border-slate-800 focus-within:border-cyan-500/60'
                          ].join(' ')}
                        >
                          <span className="inline-flex items-center border-r border-slate-800 px-3 text-sm font-black text-slate-500">
                            INR
                          </span>
                          <input
                            id={`gig-extra-price-${extraIndex}`}
                            type="number"
                            inputMode="decimal"
                            min="0.01"
                            step="1"
                            value={extra.price}
                            onChange={(event) =>
                              handleExtraChange(
                                extraIndex,
                                'price',
                                event.target.value
                              )
                            }
                            aria-invalid={Boolean(priceError)}
                            className="w-full min-w-0 bg-transparent px-3 py-3 text-sm font-bold text-white outline-none"
                            placeholder="Enter price"
                          />
                        </div>
                        {priceError && (
                          <p role="alert" className="text-xs font-semibold text-red-400">
                            {priceError}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <label
                        htmlFor={`gig-extra-scope-${extraIndex}`}
                        className="block text-xs font-black uppercase tracking-wider text-slate-300"
                      >
                        Scope
                      </label>
                      <textarea
                        id={`gig-extra-scope-${extraIndex}`}
                        rows="3"
                        maxLength="240"
                        value={extra.scope?.description || ''}
                        onChange={(event) =>
                          handleExtraScopeChange(
                            extraIndex,
                            event.target.value
                          )
                        }
                        aria-invalid={Boolean(scopeError)}
                        className={[
                          'w-full rounded-xl border bg-slate-950 px-3 py-3 text-sm font-semibold text-white outline-none resize-y transition',
                          scopeError
                            ? 'border-red-500/50 focus:border-red-400'
                            : 'border-slate-800 focus:border-cyan-500/60'
                        ].join(' ')}
                        placeholder="Explain exactly what the buyer gets with this add-on."
                      />
                      {scopeError && (
                        <p role="alert" className="text-xs font-semibold text-red-400">
                          {scopeError}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {!isPricingComplete && (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
            <p className="text-xs font-bold text-slate-400">
              Complete the required pricing details before continuing.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderDelivery = () => {
    const todayDateString = new Date().toISOString().split('T')[0];

    const availabilityError =
      touchedFields.unavailableUntil ? fieldErrors.unavailableUntil : null;

    const activeOrderLimitError = touchedFields.activeOrderLimit
      ? fieldErrors.activeOrderLimit
      : null;

    const renderAvailability = () => (
      <section className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-5 sm:p-7">
        <div className="max-w-3xl">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
            Availability
          </p>
          <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">
            Control when buyers can place new orders
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Turn this off when you are not currently taking new work. You can
            optionally provide a date when you expect to accept orders again.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={Boolean(delivery.acceptingOrders)}
              onChange={(event) =>
                handleDeliveryChange('acceptingOrders', event.target.checked)
              }
              className="mt-1 h-4 w-4 shrink-0 accent-cyan-500"
            />
            <span className="min-w-0">
              <span className="block text-sm font-black text-white">
                Accepting new orders
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                When enabled, buyers can purchase an available package.
              </span>
            </span>
          </label>

          {!delivery.acceptingOrders && (
            <div className="mt-5 border-t border-slate-800 pt-5">
              <label
                htmlFor="gig-unavailable-until"
                className="text-xs font-black uppercase tracking-wider text-slate-300"
              >
                Unavailable until
              </label>

              <input
                id="gig-unavailable-until"
                name="unavailableUntil"
                type="date"
                min={todayDateString}
                value={delivery.unavailableUntil}
                onChange={(event) =>
                  handleDeliveryChange('unavailableUntil', event.target.value)
                }
                aria-invalid={Boolean(availabilityError)}
                aria-describedby={
                  availabilityError
                    ? 'gig-unavailable-until-error'
                    : 'gig-unavailable-until-help'
                }
                className={[
                  'mt-3 w-full rounded-xl border bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none transition',
                  availabilityError
                    ? 'border-red-500/50 focus:border-red-400'
                    : 'border-slate-800 focus:border-cyan-500/60'
                ].join(' ')}
              />

              <p
                id="gig-unavailable-until-help"
                className="mt-2 text-xs leading-5 text-slate-600"
              >
                Optional. Leave blank when you do not have a specific return date.
              </p>

              {availabilityError && (
                <p
                  id="gig-unavailable-until-error"
                  role="alert"
                  className="mt-2 text-xs font-semibold text-red-400"
                >
                  {availabilityError}
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    );

    const renderOrderCapacity = () => (
      <section className="rounded-3xl border border-violet-500/20 bg-violet-500/5 p-5 sm:p-7">
        <div className="max-w-3xl">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-300">
            Order capacity
          </p>
          <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">
            Protect your delivery capacity
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Optionally limit how many active orders this gig can have at once. Completed
            and cancelled orders do not count toward the limit.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5">
          <label
            htmlFor="gig-active-order-limit"
            className="text-xs font-black uppercase tracking-wider text-slate-300"
          >
            Active order limit
          </label>

          <div
            className={[
              'mt-3 flex min-w-0 items-center overflow-hidden rounded-xl border bg-slate-950 focus-within:border-violet-500/60',
              activeOrderLimitError
                ? 'border-red-500/50 focus-within:border-red-400'
                : 'border-slate-800'
            ].join(' ')}
          >
            <input
              id="gig-active-order-limit"
              name="activeOrderLimit"
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              value={delivery.activeOrderLimit}
              onChange={(event) =>
                handleDeliveryChange('activeOrderLimit', event.target.value)
              }
              aria-invalid={Boolean(activeOrderLimitError)}
              aria-describedby={
                activeOrderLimitError
                  ? 'gig-active-order-limit-error'
                  : 'gig-active-order-limit-help'
              }
              className="w-full min-w-0 bg-transparent px-3 py-3 text-sm font-bold text-white outline-none"
              placeholder="e.g. 3"
            />
            <span className="shrink-0 border-l border-slate-800 px-3 text-sm font-black text-slate-500">
              active orders
            </span>
          </div>

          <p
            id="gig-active-order-limit-help"
            className="mt-2 text-xs leading-5 text-slate-600"
          >
            Optional. Leave blank to accept unlimited active orders. The limit protects
            your workload while you finish existing projects.
          </p>

          {activeOrderLimitError && (
            <p
              id="gig-active-order-limit-error"
              role="alert"
              className="mt-2 text-xs font-semibold text-red-400"
            >
              {activeOrderLimitError}
            </p>
          )}
        </div>
      </section>
    );

    if (pricing.packageModel === 'multi') {
      const renderPackageList = (
        packageIndex,
        field,
        label,
        placeholder,
        required = false
      ) => {
        const pkg = packages[packageIndex];
        const items = Array.isArray(pkg?.[field]) ? pkg[field] : [];
        const error = touchedFields.packages
          ? fieldErrors[`package.${pkg?.tierName}.${field}`]
          : null;

        return (
          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                  {label}{required && <span className="text-pink-500"> *</span>}
                </label>
                <p className="mt-1 text-[11px] leading-5 text-slate-600">
                  {required
                    ? 'Add at least one clear item.'
                    : 'Add meaningful boundaries buyers should know.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handlePackageListAdd(packageIndex, field)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-[11px] font-black text-cyan-300 hover:border-cyan-500/30"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {items.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-800 px-3 py-3 text-xs text-slate-600">
                  Nothing added yet.
                </p>
              ) : (
                items.map((item, itemIndex) => (
                  <div
                    key={`${pkg.tierName}-${field}-${itemIndex}`}
                    className="flex items-start gap-2"
                  >
                    <input
                      type="text"
                      maxLength={180}
                      value={item}
                      onChange={(event) =>
                        handlePackageListChange(
                          packageIndex,
                          field,
                          itemIndex,
                          event.target.value
                        )
                      }
                      placeholder={placeholder}
                      className="w-full min-w-0 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-cyan-500/60"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        handlePackageListRemove(
                          packageIndex,
                          field,
                          itemIndex
                        )
                      }
                      aria-label={`Remove ${label.toLowerCase()} ${itemIndex + 1}`}
                      className="shrink-0 rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-500 hover:border-red-500/30 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {error && (
              <p role="alert" className="mt-2 text-xs font-semibold text-red-400">
                {error}
              </p>
            )}
          </div>
        );
      };

      const packageStepErrors = Object.entries(fieldErrors)
        .filter(([key]) => key.startsWith('package.') || key === 'packages')
        .map(([, value]) => value)
        .filter(Boolean);

      return (
        <div className="mt-8 space-y-7">
          {renderAvailability()}
          {renderOrderCapacity()}

          <section className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-5 sm:p-7">
            <div className="max-w-3xl">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
                Package scope & delivery
              </p>
              <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">
                Define the promise of each package
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Each package needs its own delivery time, revision allowance,
                included work, exclusions, deliverables, and features.
              </p>
            </div>
          </section>

          {packages.map((pkg, packageIndex) => (
            <section
              key={pkg.tierName}
              className="rounded-3xl border border-slate-800 bg-slate-950/35 p-5 sm:p-7"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
                    Package {packageIndex + 1}
                  </p>
                  <h3 className="mt-1 text-xl font-black text-white">
                    {pkg.tierName}
                  </h3>
                </div>

                <span className="text-xs font-bold text-slate-500">
                  INR {Number(pkg.price || 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Delivery time <span className="text-pink-500">*</span>
                  </label>

                  <div className="mt-2 flex overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={pkg.deliveryDays}
                      onChange={(event) =>
                        handlePackageChange(
                          packageIndex,
                          'deliveryDays',
                          event.target.value
                        )
                      }
                      className="w-full min-w-0 bg-transparent px-3 py-3 text-sm font-bold text-white outline-none"
                      placeholder="e.g. 3"
                    />
                    <span className="inline-flex items-center border-l border-slate-800 px-3 text-sm font-black text-slate-500">
                      days
                    </span>
                  </div>

                  {touchedFields.packages &&
                    fieldErrors[`package.${pkg.tierName}.deliveryDays`] && (
                      <p role="alert" className="mt-2 text-xs font-semibold text-red-400">
                        {fieldErrors[`package.${pkg.tierName}.deliveryDays`]}
                      </p>
                    )}
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Revisions <span className="text-pink-500">*</span>
                  </label>

                  <select
                    value={pkg.revisions}
                    onChange={(event) =>
                      handlePackageChange(
                        packageIndex,
                        'revisions',
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none"
                  >
                    <option value="">Select revision allowance</option>
                    <option value="0">0 revisions</option>
                    <option value="1">1 revision</option>
                    <option value="2">2 revisions</option>
                    <option value="3">3 revisions</option>
                    <option value="4">4 revisions</option>
                    <option value="5">5 revisions</option>
                    <option value="unlimited">Unlimited revisions</option>
                  </select>

                  {touchedFields.packages &&
                    fieldErrors[`package.${pkg.tierName}.revisions`] && (
                      <p role="alert" className="mt-2 text-xs font-semibold text-red-400">
                        {fieldErrors[`package.${pkg.tierName}.revisions`]}
                      </p>
                    )}
                </div>
              </div>

              {renderPackageList(
                packageIndex,
                'includedItems',
                'Included items',
                'e.g. Responsive homepage implementation',
                true
              )}

              {renderPackageList(
                packageIndex,
                'excludedItems',
                'Excluded items',
                'e.g. Custom backend integrations'
              )}

              {renderPackageList(
                packageIndex,
                'deliverables',
                'Deliverables',
                'e.g. Production-ready source code',
                true
              )}

              {renderPackageList(
                packageIndex,
                'features',
                'Features',
                'e.g. Source files included',
                true
              )}
            </section>
          ))}

          {packageStepErrors.length > 0 && (
            <div
              role="alert"
              className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 sm:px-5"
            >
              <p className="text-xs font-black uppercase tracking-wider text-red-300">
                Complete the highlighted package fields
              </p>
              <ul className="mt-2 space-y-1 text-xs text-red-200/80">
                {packageStepErrors.slice(0, 8).map((message, index) => (
                  <li key={`${message}-${index}`}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          {!isDeliveryComplete && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
              <p className="text-xs font-bold text-slate-400">
                Complete every package before continuing.
              </p>
            </div>
          )}
        </div>
      );
    }

    const deliveryError = touchedFields.deliveryDays ? fieldErrors.deliveryDays : null;
    const revisionsError = touchedFields.revisions ? fieldErrors.revisions : null;
    const includedError = touchedFields.includedItems ? fieldErrors.includedItems : null;
    const excludedError = touchedFields.excludedItems ? fieldErrors.excludedItems : null;
    const deliverablesError = touchedFields.deliverables ? fieldErrors.deliverables : null;

    const renderRepeatableList = ({
      field,
      label,
      description,
      placeholder,
      required = false,
      error,
      emptyMessage,
      addLabel
    }) => {
      const items = Array.isArray(delivery[field]) ? delivery[field] : [];

      return (
        <div className="mt-7 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                {label}{required && <span className="text-pink-500"> *</span>}
              </label>
              <p className="text-xs leading-5 text-slate-600 mt-2 max-w-2xl">
                {description}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 px-4 py-3">
                <p className="text-xs text-slate-600">{emptyMessage}</p>
              </div>
            ) : (
              items.map((item, index) => {
                const inputId = `gig-${field}-${index}`;
                const errorId = `${inputId}-error`;
                const itemIsBlank = touchedFields[field] && String(item || '').trim().length === 0;
                const showError = Boolean(error) && itemIsBlank;

                return (
                  <div key={`${field}-${index}`} className="flex min-w-0 items-start gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-[10px] font-black text-slate-500"
                      >
                        {index + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <input
                          id={inputId}
                          type="text"
                          maxLength={180}
                          value={item}
                          onChange={(event) =>
                            handleDeliveryListChange(field, index, event.target.value)
                          }
                          placeholder={placeholder(index)}
                          aria-invalid={Boolean(showError)}
                          aria-describedby={showError ? errorId : undefined}
                          className={[
                            'w-full min-w-0 rounded-xl border bg-slate-950 px-3 py-3 text-sm font-semibold text-white outline-none transition',
                            showError
                              ? 'border-red-500/50 focus:border-red-400'
                              : 'border-slate-800 focus:border-cyan-500/60'
                          ].join(' ')}
                        />

                        {showError && (
                          <p
                            id={errorId}
                            role="alert"
                            className="mt-2 text-xs font-semibold text-red-400"
                          >
                            Enter a meaningful item or remove this row.
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveDeliveryListItem(field, index)}
                      aria-label={`Remove ${label.toLowerCase()} item ${index + 1}`}
                      className="shrink-0 rounded-xl border border-slate-800 bg-slate-900 p-3 text-slate-500 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {error && !items.some((item) => String(item || '').trim().length === 0) && (
            <p role="alert" className="mt-3 text-xs font-semibold text-red-400">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() => handleAddDeliveryListItem(field)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-black text-cyan-300 transition hover:border-cyan-500/30 hover:bg-cyan-500/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
          >
            <Plus className="h-4 w-4" />
            {addLabel}
          </button>
        </div>
      );
    };

    const stepErrors = [
      deliveryError,
      revisionsError,
      activeOrderLimitError,
      includedError,
      excludedError,
      deliverablesError
    ].filter(Boolean);

    return (
      <div className="mt-8 space-y-7">
        {renderAvailability()}
        {renderOrderCapacity()}

        <section className="rounded-3xl border border-slate-800 bg-slate-950/35 p-5 sm:p-7">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
              Delivery & revisions
            </p>

            <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">
              Set the service expectations before work begins
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Define when buyers should expect the finished service and how many reasonable
              revision rounds are included.
            </p>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="min-w-0 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5">
              <label
                htmlFor="gig-delivery-days"
                className="text-xs font-black uppercase tracking-wider text-slate-300"
              >
                Delivery time <span className="text-pink-500">*</span>
              </label>
              <div className="mt-3 flex min-w-0 items-center overflow-hidden rounded-xl border border-slate-800 bg-slate-950 focus-within:border-cyan-500/60">
                <input
                  id="gig-delivery-days"
                  name="deliveryDays"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  value={delivery.deliveryDays}
                  onChange={(event) => handleDeliveryChange('deliveryDays', event.target.value)}
                  aria-invalid={Boolean(deliveryError)}
                  aria-describedby={
                    deliveryError ? 'gig-delivery-days-error' : 'gig-delivery-days-help'
                  }
                  className="w-full min-w-0 bg-transparent px-3 py-3 text-sm font-bold text-white outline-none"
                  placeholder="e.g. 3"
                />
                <span className="shrink-0 border-l border-slate-800 px-3 text-sm font-black text-slate-500">
                  days
                </span>
              </div>

              <p id="gig-delivery-days-help" className="mt-2 text-xs leading-5 text-slate-600">
                The delivery clock starts when the order is created.
              </p>

              {deliveryError && (
                <p
                  id="gig-delivery-days-error"
                  role="alert"
                  className="mt-2 text-xs font-semibold text-red-400"
                >
                  {deliveryError}
                </p>
              )}
            </div>

            <div className="min-w-0 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5">
              <label
                htmlFor="gig-revisions"
                className="text-xs font-black uppercase tracking-wider text-slate-300"
              >
                Revisions <span className="text-pink-500">*</span>
              </label>
              <select
                id="gig-revisions"
                name="revisions"
                value={delivery.revisions}
                onChange={(event) => handleDeliveryChange('revisions', event.target.value)}
                aria-invalid={Boolean(revisionsError)}
                aria-describedby={revisionsError ? 'gig-revisions-error' : 'gig-revisions-help'}
                className={[
                  'mt-3 w-full rounded-xl border bg-slate-950 px-3 py-3 text-sm font-bold text-white outline-none transition',
                  revisionsError
                    ? 'border-red-500/50 focus:border-red-400'
                    : 'border-slate-800 focus:border-cyan-500/60'
                ].join(' ')}
              >
                <option value="">Select revision allowance</option>
                <option value="0">0 revisions</option>
                <option value="1">1 revision</option>
                <option value="2">2 revisions</option>
                <option value="3">3 revisions</option>
                <option value="4">4 revisions</option>
                <option value="5">5 revisions</option>
                <option value="unlimited">Unlimited revisions</option>
              </select>

              <p id="gig-revisions-help" className="mt-2 text-xs leading-5 text-slate-600">
                A revision covers reasonable changes within the original service scope.
              </p>

              {revisionsError && (
                <p
                  id="gig-revisions-error"
                  role="alert"
                  className="mt-2 text-xs font-semibold text-red-400"
                >
                  {revisionsError}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/35 p-5 sm:p-7">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
              What's included
            </p>
            <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">
              Make the service scope explicit
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              List the parts of the service the buyer can reasonably expect as part of the
              purchased offer.
            </p>
          </div>

          {renderRepeatableList({
            field: 'includedItems',
            label: 'Included item',
            description: 'Use one clear line for each thing your service covers.',
            placeholder: (index) =>
              index === 0
                ? 'e.g. Homepage implementation'
                : 'e.g. Responsive mobile styling',
            required: true,
            error: includedError,
            emptyMessage: 'No included items added yet.',
            addLabel: 'Add included item'
          })}
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/35 p-5 sm:p-7">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
              What's not included
            </p>
            <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">
              Clarify the boundaries of the service
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Mention important exclusions so buyers can understand what falls outside the
              agreed scope.
            </p>
          </div>

          {renderRepeatableList({
            field: 'excludedItems',
            label: 'Excluded item',
            description: 'Use one clear line for each meaningful boundary or excluded task.',
            placeholder: () => 'e.g. Custom backend integrations',
            required: false,
            error: excludedError,
            emptyMessage: 'No exclusions added. Add boundaries that buyers should know about.',
            addLabel: 'Add excluded item'
          })}
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/35 p-5 sm:p-7">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
              Deliverables
            </p>
            <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">
              Tell buyers exactly what they'll receive
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Describe the concrete outputs or files the buyer should receive when the service
              is complete.
            </p>
          </div>

          {renderRepeatableList({
            field: 'deliverables',
            label: 'Deliverable',
            description: 'Use one clear line for each concrete output or file.',
            placeholder: (index) =>
              index === 0
                ? 'e.g. Production-ready React source code'
                : 'e.g. Final deployment package',
            required: true,
            error: deliverablesError,
            emptyMessage: 'No deliverables added yet.',
            addLabel: 'Add deliverable'
          })}
        </section>

        {stepErrors.length > 0 && (
          <div
            role="alert"
            className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 sm:px-5"
          >
            <p className="text-xs font-black uppercase tracking-wider text-red-300">
              Complete the highlighted Step 4 fields
            </p>
            <ul className="mt-2 space-y-1 text-xs text-red-200/80">
              {stepErrors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderRequirements = () => {
    const requirementErrors = fieldErrors.requirements || {};
    const showErrors = Boolean(touchedFields.requirements);
    const typeLabels = {
      text: 'Short text',
      'long-text': 'Long text',
      'multiple-choice': 'Multiple choice',
      checkbox: 'Checkbox',
      'file-upload': 'File upload'
    };

    return (
      <div className="mt-8 space-y-7">
        <section className="rounded-3xl border border-slate-800 bg-slate-950/35 p-5 sm:p-7">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
              Buyer requirements
            </p>

            <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">
              Tell buyers exactly what you need before starting
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Ask for the information, confirmations, or files you need from the buyer
              before you can begin the service.
            </p>
          </div>

          {showErrors && requirementErrors.step && (
            <div
              role="alert"
              className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 sm:px-5"
            >
              <p className="text-xs font-black uppercase tracking-wider text-red-300">
                Complete the highlighted Step 5 fields
              </p>
              <p className="mt-1 text-xs leading-5 text-red-200/80">
                {requirementErrors.step}
              </p>
            </div>
          )}

          <div className="mt-7 space-y-5">
            {requirements.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 px-4 py-5">
                <p className="text-sm font-semibold text-slate-500">
                  No buyer requirements added yet.
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Add at least one question or required input before continuing.
                </p>
              </div>
            ) : (
              requirements.map((requirement, index) => {
                const itemErrors = showErrors
                  ? (requirementErrors.items?.[requirement.id] || {})
                  : {};
                const questionId = `gig-requirement-${requirement.id}-question`;
                const typeId = `gig-requirement-${requirement.id}-type`;
                const optionsId = `gig-requirement-${requirement.id}-options`;

                return (
                  <article
                    key={requirement.id}
                    className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4 sm:p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <span
                          aria-hidden="true"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-xs font-black text-cyan-300"
                        >
                          {index + 1}
                        </span>

                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                            Buyer input
                          </p>
                          <h4 className="mt-1 break-words text-base font-black text-white">
                            Requirement {index + 1}
                          </h4>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveRequirement(requirement.id)}
                        aria-label={`Remove buyer requirement ${index + 1}`}
                        className="inline-flex shrink-0 items-center justify-center gap-2 self-end rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs font-black text-slate-500 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 sm:self-start"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>

                    <div className="mt-6 space-y-5">
                      <div className="space-y-2.5">
                        <label
                          htmlFor={questionId}
                          className="block text-xs font-black uppercase tracking-wider text-slate-300"
                        >
                          Question or input label <span className="text-pink-500">*</span>
                        </label>

                        <input
                          id={questionId}
                          type="text"
                          maxLength={240}
                          value={requirement.question}
                          onChange={(event) =>
                            handleRequirementChange(
                              requirement.id,
                              'question',
                              event.target.value
                            )
                          }
                          placeholder="e.g. What style or format should I follow?"
                          aria-invalid={Boolean(itemErrors.question)}
                          aria-describedby={
                            itemErrors.question
                              ? `${questionId}-error`
                              : undefined
                          }
                          className={[
                            'w-full min-w-0 rounded-2xl border bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white outline-none transition',
                            itemErrors.question
                              ? 'border-red-500/50 focus:border-red-400'
                              : 'border-slate-800 focus:border-cyan-500/60'
                          ].join(' ')}
                        />

                        {itemErrors.question && (
                          <p
                            id={`${questionId}-error`}
                            role="alert"
                            className="text-xs font-semibold text-red-400"
                          >
                            {itemErrors.question}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="space-y-2.5">
                          <label
                            htmlFor={typeId}
                            className="block text-xs font-black uppercase tracking-wider text-slate-300"
                          >
                            Response type <span className="text-pink-500">*</span>
                          </label>

                          <select
                            id={typeId}
                            value={requirement.type}
                            onChange={(event) =>
                              handleRequirementChange(
                                requirement.id,
                                'type',
                                event.target.value
                              )
                            }
                            className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3.5 text-sm font-bold text-white outline-none transition focus:border-cyan-500/60"
                          >
                            {Object.entries(typeLabels).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>

                          <p className="text-xs leading-5 text-slate-600">
                            {requirement.type === 'text'
                              ? 'Buyer gives a concise one-line answer.'
                              : requirement.type === 'long-text'
                                ? 'Buyer provides a more detailed written answer.'
                                : requirement.type === 'multiple-choice'
                                  ? 'Buyer selects one option from your choices.'
                                  : requirement.type === 'checkbox'
                                    ? 'Buyer confirms the statement by checking the box.'
                                    : 'Buyer will provide a file when responding.'}
                          </p>
                        </div>

                        <div className="space-y-2.5">
                          <span className="block text-xs font-black uppercase tracking-wider text-slate-300">
                            Buyer input
                          </span>

                          <label
                            htmlFor={`${questionId}-required`}
                            className="flex min-h-[52px] cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3.5"
                          >
                            <span className="min-w-0">
                              <span className="block text-sm font-black text-white">
                                {requirement.required ? 'Required' : 'Optional'}
                              </span>
                              <span className="mt-1 block text-xs leading-5 text-slate-600">
                                {requirement.required
                                  ? 'Buyer must provide this before work can properly begin.'
                                  : 'Helpful context, but the buyer may leave it unanswered.'}
                              </span>
                            </span>

                            <span className="relative shrink-0">
                              <input
                                id={`${questionId}-required`}
                                type="checkbox"
                                checked={requirement.required}
                                onChange={(event) =>
                                  handleRequirementChange(
                                    requirement.id,
                                    'required',
                                    event.target.checked
                                  )
                                }
                                className="peer sr-only"
                              />
                              <span
                                aria-hidden="true"
                                className={[
                                  'flex h-6 w-11 items-center rounded-full border p-0.5 transition',
                                  requirement.required
                                    ? 'border-cyan-400/50 bg-cyan-500/20'
                                    : 'border-slate-700 bg-slate-900'
                                ].join(' ')}
                              >
                                <span
                                  className={[
                                    'h-5 w-5 rounded-full transition',
                                    requirement.required
                                      ? 'translate-x-5 bg-cyan-300'
                                      : 'translate-x-0 bg-slate-500'
                                  ].join(' ')}
                                />
                              </span>
                            </span>
                          </label>
                        </div>
                      </div>

                      {requirement.type === 'multiple-choice' && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 sm:p-5">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <label
                                id={optionsId}
                                className="block text-xs font-black uppercase tracking-wider text-slate-300"
                              >
                                Choice options <span className="text-pink-500">*</span>
                              </label>
                              <p className="mt-2 text-xs leading-5 text-slate-600">
                                Add the choices the buyer can select. At least two meaningful
                                options are required.
                              </p>
                            </div>

                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                              {requirement.options.filter(
                                (option) => String(option || '').trim().length > 0
                              ).length} meaningful
                            </span>
                          </div>

                          <div className="mt-4 space-y-3">
                            {requirement.options.map((option, optionIndex) => {
                              const optionId = `${optionsId}-${optionIndex}`;
                              const optionIsBlank =
                                showErrors &&
                                String(option || '').trim().length === 0 &&
                                Boolean(itemErrors.options);

                              return (
                                <div
                                  key={`${requirement.id}-option-${optionIndex}`}
                                  className="flex min-w-0 items-start gap-3"
                                >
                                  <span
                                    aria-hidden="true"
                                    className="mt-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-[10px] font-black text-slate-500"
                                  >
                                    {optionIndex + 1}
                                  </span>

                                  <div className="min-w-0 flex-1">
                                    <label htmlFor={optionId} className="sr-only">
                                      Option {optionIndex + 1} for requirement {index + 1}
                                    </label>
                                    <input
                                      id={optionId}
                                      type="text"
                                      maxLength={160}
                                      value={option}
                                      onChange={(event) =>
                                        handleRequirementOptionChange(
                                          requirement.id,
                                          optionIndex,
                                          event.target.value
                                        )
                                      }
                                      placeholder={`Choice ${optionIndex + 1}`}
                                      aria-invalid={Boolean(optionIsBlank)}
                                      aria-describedby={
                                        optionIsBlank
                                          ? `${optionId}-error`
                                          : undefined
                                      }
                                      className={[
                                        'w-full min-w-0 rounded-xl border bg-slate-950 px-3 py-3 text-sm font-semibold text-white outline-none transition',
                                        optionIsBlank
                                          ? 'border-red-500/50 focus:border-red-400'
                                          : 'border-slate-800 focus:border-cyan-500/60'
                                      ].join(' ')}
                                    />
                                    {optionIsBlank && (
                                      <p
                                        id={`${optionId}-error`}
                                        role="alert"
                                        className="mt-2 text-xs font-semibold text-red-400"
                                      >
                                        Enter a meaningful choice or remove this option.
                                      </p>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveRequirementOption(
                                        requirement.id,
                                        optionIndex
                                      )
                                    }
                                    aria-label={`Remove option ${optionIndex + 1} from requirement ${index + 1}`}
                                    className="shrink-0 rounded-xl border border-slate-800 bg-slate-900 p-3 text-slate-500 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          {itemErrors.options && (
                            <p role="alert" className="mt-3 text-xs font-semibold text-red-400">
                              {itemErrors.options}
                            </p>
                          )}

                          <button
                            type="button"
                            onClick={() => handleAddRequirementOption(requirement.id)}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-black text-cyan-300 transition hover:border-cyan-500/30 hover:bg-cyan-500/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
                          >
                            <Plus className="h-4 w-4" />
                            Add option
                          </button>
                        </div>
                      )}

                      {requirement.type === 'long-text' && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                          <p className="text-xs leading-5 text-slate-600">
                            Buyers will see a larger response area for this requirement.
                          </p>
                        </div>
                      )}

                      {requirement.type === 'checkbox' && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                          <p className="text-xs leading-5 text-slate-600">
                            Buyers will confirm this statement with a checkbox when responding.
                          </p>
                        </div>
                      )}

                      {requirement.type === 'file-upload' && (
                        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-4">
                          <p className="text-xs font-semibold text-slate-300">
                            File upload requirement
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-600">
                            This defines a file the buyer must provide later. Actual upload
                            handling is not part of GIG-015/016/017.
                          </p>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <button
            type="button"
            onClick={handleAddRequirement}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3.5 text-xs font-black text-cyan-300 transition hover:border-cyan-500/30 hover:bg-cyan-500/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Add buyer requirement
          </button>
        </section>
      </div>
    );
  };

  const renderDiscovery = () => {
    const discoveryErrors = fieldErrors.discovery || {};
    const categoryDerivedValues = [
      { label: 'Category', value: selectedCategory?.name },
      { label: 'Subcategory', value: selectedSubcategory?.name },
      {
        label: 'Service type',
        value:
          serviceTypes.find((serviceType) => serviceType.id === basics.serviceType)?.name ||
          basics.serviceType
      }
    ].filter((item) => String(item.value || '').trim());

    const meaningfulCategoryFields = categorySpecificFieldDefinitions
      .map((field) => ({
        label: field.label,
        value: categorySpecificFields[field.key]
      }))
      .filter((item) => {
        if (Array.isArray(item.value)) return item.value.length > 0;
        return String(item.value ?? '').trim().length > 0;
      });

    return (
      <div className="mt-8 space-y-6">
        <section className="rounded-3xl border border-slate-800 bg-slate-950/35 p-5 sm:p-7">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">Search keywords</p>
            <h3 className="mt-2 text-xl sm:text-2xl font-black text-white">Add words buyers may search for</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Add up to 10 focused search terms. These complement your existing Basics skills without duplicating them.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              id="gig-discovery-keyword"
              type="text"
              maxLength={40}
              className={`min-w-0 flex-1 rounded-2xl border bg-slate-950 px-4 py-3 text-sm text-white outline-none transition ${
                discoveryErrors.keywords ? 'border-red-500/60' : 'border-slate-800 focus:border-cyan-500/60'
              }`}
              placeholder="e.g. React dashboard, Figma prototype, Excel automation"
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ',') {
                  event.preventDefault();
                  const added = addDiscoveryKeyword(event.currentTarget.value);
                  if (added) event.currentTarget.value = '';
                }
              }}
              aria-invalid={Boolean(discoveryErrors.keywords)}
            />
            <button
              type="button"
              onClick={(event) => {
                const input = event.currentTarget.previousElementSibling;
                if (input && addDiscoveryKeyword(input.value)) input.value = '';
              }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-xs font-black text-slate-200 transition hover:border-cyan-500/40 hover:text-cyan-200"
            >
              <Plus className="h-4 w-4" /> Add keyword
            </button>
          </div>

          {discovery.keywords.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {discovery.keywords.map((keyword) => (
                <span key={keyword} className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-200">
                  {keyword}
                  <button type="button" onClick={() => removeDiscoveryKeyword(keyword)} aria-label={`Remove ${keyword}`} className="rounded-md p-0.5 text-cyan-400 hover:bg-cyan-500/10 hover:text-white">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {discoveryErrors.keywords && <p className="mt-3 text-xs font-semibold text-red-300">{discoveryErrors.keywords}</p>}
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/35 p-5 sm:p-7">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">Languages</p>
            <h3 className="mt-2 text-xl font-black text-white">Choose the languages this service supports</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">Use the controlled language list so discovery filters stay consistent.</p>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {GIG_DISCOVERY_LANGUAGES.map((language) => {
              const selected = discovery.languages.includes(language);
              return (
                <button
                  key={language}
                  type="button"
                  onClick={() => toggleDiscoveryValue('languages', language)}
                  aria-pressed={selected}
                  className={`min-h-11 rounded-xl border px-3 py-2.5 text-xs font-bold text-left transition ${
                    selected
                      ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-cyan-500/20 hover:text-white'
                  }`}
                >
                  {selected && <span className="mr-1.5">✓</span>}{language}
                </button>
              );
            })}
          </div>
          {discoveryErrors.languages && <p className="mt-3 text-xs font-semibold text-red-300">{discoveryErrors.languages}</p>}
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/35 p-5 sm:p-7">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">Target audience</p>
            <h3 className="mt-2 text-xl font-black text-white">Who is this service best suited for?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">Optional audience signals can make a gig easier to discover without restricting who can buy it.</p>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {GIG_DISCOVERY_TARGET_AUDIENCES.map((audience) => {
              const selected = discovery.targetAudience.includes(audience);
              return (
                <button
                  key={audience}
                  type="button"
                  onClick={() => toggleDiscoveryValue('targetAudience', audience)}
                  aria-pressed={selected}
                  className={`min-h-11 rounded-xl border px-3 py-2.5 text-xs font-bold text-left transition ${
                    selected
                      ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-cyan-500/20 hover:text-white'
                  }`}
                >
                  {selected && <span className="mr-1.5">✓</span>}{audience}
                </button>
              );
            })}
          </div>
          {discoveryErrors.targetAudience && <p className="mt-3 text-xs font-semibold text-red-300">{discoveryErrors.targetAudience}</p>}
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/35 p-5 sm:p-7">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">Existing search signals</p>
            <h3 className="mt-2 text-xl font-black text-white">Your existing skills and category metadata</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">These values are derived from earlier steps and are shown here for discovery context. They are not duplicated into a second stored tags field.</p>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Skills / tags from Basics</p>
            {basics.skills.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {basics.skills.map((skill) => (
                  <span key={skill} className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-200">{skill}</span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-600">No Basics skills have been selected yet.</p>
            )}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {categoryDerivedValues.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-sm font-bold text-white">{item.value}</p>
              </div>
            ))}
          </div>

          {meaningfulCategoryFields.length > 0 && (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {meaningfulCategoryFields.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
                  <p className="mt-2 text-sm font-bold text-slate-200 break-words">
                    {Array.isArray(item.value) ? item.value.join(', ') : String(item.value)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  };

  const renderFaqs = () => {
    const faqErrors = fieldErrors.faqs || {};
    const showErrors = Boolean(touchedFields.faqs);

    return (
      <div className="mt-8 space-y-7">
        <section className="rounded-3xl border border-slate-800 bg-slate-950/35 p-5 sm:p-7">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
              Frequently asked questions
            </p>

            <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">
              Answer buyer questions before they ask
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Answer questions buyers are likely to have before purchasing so your service
              is easier to understand and has less uncertainty.
            </p>
          </div>

          {showErrors && faqErrors.step && (
            <div
              role="alert"
              className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 sm:px-5"
            >
              <p className="text-xs font-black uppercase tracking-wider text-red-300">
                Complete the highlighted FAQ items
              </p>
              <p className="mt-1 text-xs leading-5 text-red-200/80">
                {faqErrors.step}
              </p>
            </div>
          )}

          <div className="mt-7 space-y-5">
            {faqs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 px-4 py-5">
                <p className="text-sm font-semibold text-slate-500">
                  No FAQs added yet.
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  FAQs are recommended, but you can continue without adding one.
                </p>
              </div>
            ) : (
              faqs.map((faq, index) => {
                const itemErrors = showErrors
                  ? (faqErrors.items?.[faq.id] || {})
                  : {};
                const questionId = `gig-faq-${faq.id}-question`;
                const answerId = `gig-faq-${faq.id}-answer`;

                return (
                  <article
                    key={faq.id}
                    className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4 sm:p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <span
                          aria-hidden="true"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-xs font-black text-cyan-300"
                        >
                          {index + 1}
                        </span>

                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                            Buyer-facing answer
                          </p>
                          <h4 className="mt-1 break-words text-base font-black text-white">
                            FAQ {index + 1}
                          </h4>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2 self-end sm:self-start">
                        <button
                          type="button"
                          onClick={() => handleMoveFaq(faq.id, 'up')}
                          disabled={index === 0}
                          aria-label={`Move FAQ ${index + 1} up`}
                          className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-400 transition hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMoveFaq(faq.id, 'down')}
                          disabled={index === faqs.length - 1}
                          aria-label={`Move FAQ ${index + 1} down`}
                          className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-400 transition hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveFaq(faq.id)}
                          aria-label={`Remove FAQ ${index + 1}`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs font-black text-slate-500 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="hidden sm:inline">Remove</span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 space-y-5">
                      <div className="space-y-2.5">
                        <label
                          htmlFor={questionId}
                          className="block text-xs font-black uppercase tracking-wider text-slate-300"
                        >
                          Buyer question <span className="text-pink-500">*</span>
                        </label>

                        <input
                          id={questionId}
                          type="text"
                          maxLength={240}
                          value={faq.question}
                          onChange={(event) =>
                            handleFaqChange(
                              faq.id,
                              'question',
                              event.target.value
                            )
                          }
                          placeholder="e.g. Can you work with my existing brand guidelines?"
                          aria-invalid={Boolean(itemErrors.question)}
                          aria-describedby={
                            itemErrors.question
                              ? `${questionId}-error`
                              : undefined
                          }
                          className={[
                            'w-full min-w-0 rounded-2xl border bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white outline-none transition',
                            itemErrors.question
                              ? 'border-red-500/50 focus:border-red-400'
                              : 'border-slate-800 focus:border-cyan-500/60'
                          ].join(' ')}
                        />

                        {itemErrors.question && (
                          <p
                            id={`${questionId}-error`}
                            role="alert"
                            className="text-xs font-semibold text-red-400"
                          >
                            {itemErrors.question}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2.5">
                        <label
                          htmlFor={answerId}
                          className="block text-xs font-black uppercase tracking-wider text-slate-300"
                        >
                          Answer <span className="text-pink-500">*</span>
                        </label>

                        <textarea
                          id={answerId}
                          rows={5}
                          maxLength={1000}
                          value={faq.answer}
                          onChange={(event) =>
                            handleFaqChange(
                              faq.id,
                              'answer',
                              event.target.value
                            )
                          }
                          placeholder="Explain the answer clearly so the buyer knows what to expect."
                          aria-invalid={Boolean(itemErrors.answer)}
                          aria-describedby={
                            itemErrors.answer
                              ? `${answerId}-error`
                              : undefined
                          }
                          className={[
                            'w-full min-w-0 resize-y rounded-2xl border bg-slate-950 px-4 py-3.5 text-sm font-semibold leading-6 text-white outline-none transition',
                            itemErrors.answer
                              ? 'border-red-500/50 focus:border-red-400'
                              : 'border-slate-800 focus:border-cyan-500/60'
                          ].join(' ')}
                        />

                        {itemErrors.answer && (
                          <p
                            id={`${answerId}-error`}
                            role="alert"
                            className="text-xs font-semibold text-red-400"
                          >
                            {itemErrors.answer}
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <button
            type="button"
            onClick={handleAddFaq}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3.5 text-xs font-black text-cyan-300 transition hover:border-cyan-500/30 hover:bg-cyan-500/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Add FAQ
          </button>
        </section>

        <section className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-5 sm:p-7">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">
              Usage & ownership policy
            </p>
            <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">
              Define what the buyer receives
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Choose the structured SkillLaunch policy that best describes the intended
              usage and ownership terms for the final work delivered through this gig.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {Object.values(GIG_USAGE_RIGHTS_POLICIES).map((policy) => {
              const checked = usageRightsPolicy === policy.value;

              return (
                <label
                  key={policy.value}
                  className={[
                    'block cursor-pointer rounded-2xl border p-4 transition sm:p-5',
                    checked
                      ? 'border-cyan-500/40 bg-cyan-500/10'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  ].join(' ')}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <input
                      type="radio"
                      name="usageRightsPolicy"
                      value={policy.value}
                      checked={checked}
                      onChange={(event) => {
                        setUsageRightsPolicy(event.target.value);
                        setFieldErrors((previous) => ({
                          ...previous,
                          usageRightsPolicy: null
                        }));
                        setTouchedFields((previous) => ({
                          ...previous,
                          usageRightsPolicy: true
                        }));
                      }}
                      aria-required="true"
                      aria-invalid={Boolean(
                        touchedFields.usageRightsPolicy &&
                        fieldErrors.usageRightsPolicy
                      )}
                      className="mt-1 h-4 w-4 shrink-0 accent-cyan-400"
                    />

                    <span className="min-w-0">
                      <span className="block text-sm font-black text-white">
                        {policy.label}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-400">
                        {policy.description}
                      </span>
                    </span>
                  </div>
                </label>
              );
            })}
          </div>

          {touchedFields.usageRightsPolicy && fieldErrors.usageRightsPolicy && (
            <p
              role="alert"
              className="mt-3 text-xs font-semibold text-red-400"
            >
              {fieldErrors.usageRightsPolicy}
            </p>
          )}

          {!isUsageRightsPolicyComplete && !touchedFields.usageRightsPolicy && (
            <p className="mt-3 text-xs font-semibold text-amber-300">
              Required before you can continue or submit this gig for review.
            </p>
          )}
        </section>

        <section className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-5 sm:p-7">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">
              Marketplace rules
            </p>
            <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">
              Confirm you will follow the rules before submission
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Before this gig can be submitted for review, confirm that the service follows
              the marketplace rules, platform policies, and applicable student-safety requirements.
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5">
            <label className="flex min-w-0 cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={platformRulesAcknowledged}
                onChange={(event) => setPlatformRulesAcknowledged(event.target.checked)}
                aria-required="true"
                aria-invalid={!platformRulesAcknowledged}
                className="mt-1 h-4 w-4 shrink-0 accent-cyan-400"
              />
              <span className="min-w-0 text-sm leading-6 text-slate-300">
                I acknowledge the marketplace rules and confirm that this gig complies with
                the platform rules and safety requirements.
              </span>
            </label>

            {!platformRulesAcknowledged && (
              <p className="mt-3 text-xs font-semibold text-amber-300">
                Required before this gig can be submitted for review.
              </p>
            )}
          </div>
        </section>
      </div>
    );
  };

  const renderMedia = () => {
    const mediaErrors = fieldErrors.media || {};
    const showErrors = Boolean(touchedFields.media);

    return (
      <div className="mt-8 space-y-7">
        <section className="rounded-3xl border border-slate-800 bg-slate-950/35 p-5 sm:p-7">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
              Primary media
            </p>
            <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">
              Choose a cover image that represents your service
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Your cover is the dedicated primary image for the gig. Add a clear image, then position it before saving.
            </p>
          </div>

          {showErrors && mediaErrors.step && (
            <div
              role="alert"
              className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 sm:px-5"
            >
              <p className="text-xs font-black uppercase tracking-wider text-red-300">
                Media needs attention
              </p>
              <p className="mt-1 text-xs leading-5 text-red-200/80">
                {mediaErrors.step}
              </p>
            </div>
          )}

          <div className="mt-7">
            <div className="mb-3 flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                  Cover image <span className="text-pink-500">*</span>
                </label>
                <p className="mt-1 text-xs text-slate-600">
                  JPG, PNG, or WebP · up to 25 MB
                </p>
              </div>

              {media.cover && (
                <span className="self-start rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-300 sm:self-auto">
                  Primary
                </span>
              )}
            </div>

            {media.cover || coverUploadProgress > 0 ? (
              <div className="overflow-hidden rounded-3xl border border-cyan-500/20 bg-slate-950/70">
                <div className="relative aspect-[16/9] w-full bg-slate-900">
                  {media.cover?.previewUrl ? (
                    <img
                      src={media.cover.previewUrl}
                      alt="Gig cover preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-slate-900">
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-8 w-8 text-slate-700" aria-hidden="true" />
                        <p className="mt-2 text-xs font-black text-slate-500">
                          Preparing cover
                        </p>
                      </div>
                    </div>
                  )}

                  {coverUploadProgress > 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/55 backdrop-blur-[2px]">
                      <div className="rounded-2xl border border-slate-700/80 bg-slate-950/85 p-4 shadow-2xl">
                        <CircularUploadProgress
                          progress={coverUploadProgress}
                          size={82}
                        />
                        <p className="mt-3 text-center text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">
                          Uploading cover
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {media.cover ? (
                    <div className="static flex flex-col gap-3 bg-slate-950 p-4 sm:absolute sm:inset-x-0 sm:bottom-0 sm:bg-gradient-to-t sm:from-slate-950/95 sm:via-slate-950/75 sm:to-transparent sm:pt-16 sm:flex-row sm:items-end sm:justify-between">
                      <div className="min-w-0">
                      <p className="truncate text-sm font-black text-white">
                        {media.cover.name}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-slate-400">
                        {media.cover.width} × {media.cover.height} ·{' '}
                        {(media.cover.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <label
                        htmlFor="gig-cover-replace"
                        className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/85 px-3 py-2.5 text-xs font-black text-slate-200 transition hover:border-cyan-500/30 hover:text-white focus-within:ring-2 focus-within:ring-cyan-400/70"
                      >
                        <Upload className="h-4 w-4" />
                        Replace
                      </label>

                      <input
                        id="gig-cover-replace"
                        type="file"
                        accept={MEDIA_ACCEPT}
                        className="sr-only"
                        onChange={(event) => {
                          handleCoverFileSelected(
                            event.target.files?.[0]
                          );
                          event.target.value = '';
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => {
                          setPendingCoverFile(media.cover.file);
                          setCropImageSrc(media.cover.previewUrl);
                        }}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/85 px-3 py-2.5 text-xs font-black text-slate-200 transition hover:border-cyan-500/30 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
                      >
                        <Crop className="h-4 w-4" />
                        Re-crop
                      </button>

                      <button
                        type="button"
                        onClick={removeCover}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs font-black text-red-300 transition hover:bg-red-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <label
                htmlFor="gig-cover-upload"
                className={`flex aspect-[16/9] cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed bg-slate-950/55 px-5 text-center transition focus-within:ring-2 focus-within:ring-cyan-400/70 ${
                  showErrors && mediaErrors.cover
                    ? 'border-red-500/40 hover:border-red-400/60'
                    : 'border-slate-700 hover:border-cyan-500/40 hover:bg-cyan-500/[0.03]'
                }`}
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
                  <ImageIcon className="h-6 w-6" />
                </span>

                <span className="mt-4 text-sm font-black text-white">
                  Upload your cover image
                </span>

                <span className="mt-1 max-w-md text-xs leading-5 text-slate-500">
                  Select an image to open the crop and positioning tool.
                </span>

                <span className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/10">
                  <Upload className="h-4 w-4" />
                  Choose image
                </span>

                <input
                  id="gig-cover-upload"
                  type="file"
                  accept={MEDIA_ACCEPT}
                  className="sr-only"
                  onChange={(event) => {
                    handleCoverFileSelected(
                      event.target.files?.[0]
                    );
                    event.target.value = '';
                  }}
                />
              </label>
            )}

            {showErrors && mediaErrors.cover && (
              <p
                role="alert"
                className="mt-2 text-xs font-semibold text-red-400"
              >
                {mediaErrors.cover}
              </p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/35 p-5 sm:p-7">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
              Gallery
            </p>
            <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">
              Show more of your best work
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Add additional portfolio or service images. Gallery media is recommended, and every image you add must be valid.
            </p>
          </div>

          <div className="mt-7 rounded-2xl border border-slate-800 bg-slate-950/45 p-3 sm:p-4">
            <label
              htmlFor="gig-gallery-upload"
              className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 px-5 py-7 text-center transition hover:border-cyan-500/40 hover:bg-cyan-500/[0.03] focus-within:ring-2 focus-within:ring-cyan-400/70"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-300">
                <Upload className="h-5 w-5" />
              </span>

              <span className="mt-3 text-sm font-black text-white">
                Add gallery images
              </span>

              <span className="mt-1 text-xs text-slate-600">
                Select one or more JPG, PNG, or WebP images · up to 25 MB each
              </span>

              <input
                id="gig-gallery-upload"
                type="file"
                accept={MEDIA_ACCEPT}
                multiple
                className="sr-only"
                onChange={(event) => {
                  handleGalleryFilesSelected(
                    event.target.files
                  );
                  event.target.value = '';
                }}
              />
            </label>
          </div>

          {media.gallery.length > 0 ? (
            <div className="mt-5 space-y-3" aria-label="Gallery image list">
              <div className="flex items-start gap-2 text-[11px] font-semibold leading-5 text-slate-600">
                <GripVertical className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Drag an image onto another image to reorder, or use the move controls.
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {media.gallery.map((item, index) => {
                  const itemError =
                    mediaErrors.galleryItems?.[item.id] ||
                    item.validationError;
                  const replaceInputId =
                    `gig-gallery-replace-${item.id}`;

                  return (
                    <article
                      key={item.id}
                      draggable={Boolean(item.previewUrl)}
                      onDragStart={() =>
                        setDraggedGalleryId(item.id)
                      }
                      onDragOver={(event) => {
                        if (item.previewUrl) {
                          event.preventDefault();
                        }
                      }}
                      onDrop={() =>
                        handleGalleryDrop(item.id)
                      }
                      onDragEnd={() =>
                        setDraggedGalleryId(null)
                      }
                      className={`group overflow-hidden rounded-2xl border bg-slate-950/70 ${
                        itemError
                          ? 'border-red-500/40'
                          : 'border-slate-800'
                      } ${
                        draggedGalleryId === item.id
                          ? 'opacity-50'
                          : ''
                      }`}
                    >
                      <div className="relative aspect-[4/3] bg-slate-900">
                        {item.previewUrl ? (
                          <img
                            src={item.previewUrl}
                            alt={`Gallery image ${index + 1}: ${item.name}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                            <ImageIcon className="h-7 w-7 text-red-300" />
                            <p className="mt-2 text-xs font-black text-red-300">
                              Invalid image
                            </p>
                          </div>
                        )}

                        {galleryUploadProgress[item.id] !== undefined ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/55 backdrop-blur-[2px]">
                            <div className="rounded-2xl border border-slate-700/80 bg-slate-950/85 p-3.5 shadow-2xl">
                              <CircularUploadProgress
                                progress={galleryUploadProgress[item.id]}
                                size={76}
                              />
                              <p className="mt-2 text-center text-[9px] font-black uppercase tracking-[0.15em] text-slate-300">
                                Uploading
                              </p>
                            </div>
                          </div>
                        ) : null}

                        <div className="absolute left-2 top-2 rounded-lg border border-slate-700 bg-slate-950/80 px-2 py-1 text-[10px] font-black text-white backdrop-blur-sm">
                          {index + 1}
                        </div>

                        {item.previewUrl && (
                          <div
                            aria-hidden="true"
                            className="absolute right-2 top-2 rounded-lg border border-slate-700 bg-slate-950/80 p-1.5 text-slate-400 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100"
                          >
                            <GripVertical className="h-4 w-4" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 p-3">
                        <div className="min-w-0">
                          <p
                            className="truncate text-xs font-black text-white"
                            title={item.name}
                          >
                            {item.name}
                          </p>
                          <p className="mt-1 text-[10px] font-semibold text-slate-600">
                            {item.width && item.height
                              ? `${item.width} × ${item.height}`
                              : `${(item.size / (1024 * 1024)).toFixed(1)} MB`}
                          </p>
                        </div>

                        {itemError && (
                          <p
                            role="alert"
                            className="text-[11px] font-semibold leading-5 text-red-400"
                          >
                            {itemError}
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleMoveGallery(item.id, 'up')
                            }
                            disabled={index === 0}
                            aria-label={`Move image ${index + 1} up`}
                            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-2 py-2 text-[10px] font-black text-slate-400 transition hover:border-cyan-500/30 hover:text-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ArrowUp className="h-4 w-4" />
                            Up
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleMoveGallery(item.id, 'down')
                            }
                            disabled={
                              index === media.gallery.length - 1
                            }
                            aria-label={`Move image ${index + 1} down`}
                            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-2 py-2 text-[10px] font-black text-slate-400 transition hover:border-cyan-500/30 hover:text-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ArrowDown className="h-4 w-4" />
                            Down
                          </button>

                          <label
                            htmlFor={replaceInputId}
                            className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl border border-slate-800 bg-slate-900 px-2 py-2 text-[10px] font-black text-slate-400 transition hover:border-cyan-500/30 hover:text-cyan-300 focus-within:ring-2 focus-within:ring-cyan-400/70"
                          >
                            Replace
                          </label>

                          <input
                            id={replaceInputId}
                            type="file"
                            accept={MEDIA_ACCEPT}
                            className="sr-only"
                            onChange={(event) => {
                              handleReplaceGalleryImage(
                                item.id,
                                event.target.files?.[0]
                              );
                              event.target.value = '';
                            }}
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeGalleryImage(item.id)
                            }
                            aria-label={`Remove gallery image ${index + 1}`}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-2 py-2 text-[10px] font-black text-red-300 transition hover:bg-red-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 px-4 py-5">
              <p className="text-sm font-semibold text-slate-500">
                No gallery images added yet.
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Gallery images are recommended, so you can continue without adding one.
              </p>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/35 p-5 sm:p-7">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
              Service introduction video
            </p>
            <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">
              Let buyers see your service in action
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Optional short video introducing your service, process, or expected result.
              MP4, WebM, or MOV · up to 25 MB.
            </p>
          </div>

          {media.video || videoUploadProgress > 0 ? (
            <div
              className={`mt-6 overflow-hidden rounded-2xl border bg-slate-950/70 ${
                media.video?.validationError
                  ? 'border-red-500/40'
                  : 'border-slate-800'
              }`}
            >
              <div className="relative aspect-video w-full bg-slate-900">
                {media.video?.previewUrl ? (
                  <video
                    src={media.video.previewUrl}
                    controls
                    preload="metadata"
                    className="h-full w-full object-contain"
                  >
                    Your browser does not support video playback.
                  </video>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center px-5 text-center">
                    <Video className="h-8 w-8 text-slate-700" aria-hidden="true" />
                    <p className="mt-3 text-sm font-black text-slate-400">
                      {videoUploadProgress > 0
                        ? 'Preparing video'
                        : 'Video preview unavailable'}
                    </p>
                  </div>
                )}

                {videoUploadProgress > 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/55 backdrop-blur-[2px]">
                    <div className="rounded-2xl border border-slate-700/80 bg-slate-950/85 p-4 shadow-2xl">
                      <CircularUploadProgress
                        progress={videoUploadProgress}
                        size={82}
                      />
                      <p className="mt-3 text-center text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">
                        Uploading video
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              {media.video ? (
                <div className="space-y-3 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:space-y-0">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-white" title={media.video.name}>
                      {media.video.name}
                    </p>
                  <p className="mt-1 text-[10px] font-semibold text-slate-600">
                    {(media.video.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                  {media.video.validationError ? (
                    <p role="alert" className="mt-2 text-[11px] font-semibold leading-5 text-red-400">
                      {media.video.validationError}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <label
                    htmlFor="gig-video-replace"
                    className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/85 px-3 py-2.5 text-xs font-black text-slate-200 transition hover:border-cyan-500/30 hover:text-white focus-within:ring-2 focus-within:ring-cyan-400/70"
                  >
                    <Upload className="h-4 w-4" />
                    Replace
                  </label>
                  <input
                    id="gig-video-replace"
                    type="file"
                    accept={VIDEO_ACCEPT}
                    className="sr-only"
                    onChange={(event) => {
                      handleVideoFileSelected(event.target.files?.[0]);
                      event.target.value = '';
                    }}
                  />

                  <button
                    type="button"
                    onClick={removeVideo}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs font-black text-red-300 transition hover:bg-red-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70"
                  >
                    Remove
                  </button>
                </div>
              </div>
                ) : null}
            </div>
          ) : (
            <label
              htmlFor="gig-video-upload"
              className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-5 py-8 text-center transition focus-within:ring-2 focus-within:ring-cyan-400/70 ${
                fieldErrors.media?.video
                  ? 'border-red-500/40 hover:border-red-400/60'
                  : 'border-slate-700 bg-slate-950/40 hover:border-cyan-500/40 hover:bg-cyan-500/[0.03]'
              }`}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
                <Video className="h-5 w-5" />
              </span>
              <span className="mt-3 text-sm font-black text-white">
                Add service introduction video
              </span>
              <span className="mt-1 max-w-md text-xs leading-5 text-slate-500">
                Upload an optional video to help buyers understand your service before ordering.
              </span>
              <span className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/10">
                <Upload className="h-4 w-4" />
                Choose video
              </span>
              <input
                id="gig-video-upload"
                type="file"
                accept={VIDEO_ACCEPT}
                className="sr-only"
                onChange={(event) => {
                  handleVideoFileSelected(event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
            </label>
          )}

          {fieldErrors.media?.video ? (
            <p role="alert" className="mt-3 text-xs font-semibold text-red-400">
              {fieldErrors.media.video}
            </p>
          ) : null}
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/35 p-5 sm:p-7">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
              Portfolio links
            </p>
            <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">
              Add relevant external work
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Optional links to relevant external work, case studies, repositories, or portfolio pages.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              id="gig-portfolio-link"
              type="url"
              placeholder="https://example.com/your-work"
              aria-invalid={Boolean(portfolioLinkInputError)}
              aria-describedby={
                portfolioLinkInputError ? 'gig-portfolio-link-error' : undefined
              }
              className={`min-h-11 flex-1 rounded-xl border bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:ring-2 ${
                portfolioLinkInputError
                  ? 'border-red-500/50 focus:border-red-400/70 focus:ring-red-400/10'
                  : 'border-slate-800 focus:border-cyan-500/50 focus:ring-cyan-400/10'
              }`}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  const added = addPortfolioLink(event.currentTarget.value);
                  if (added) {
                    event.currentTarget.value = '';
                  }
                }
              }}
            />
            <button
              type="button"
              onClick={(event) => {
                const input = event.currentTarget.previousElementSibling;
                const added = addPortfolioLink(input?.value);
                if (added && input) {
                  input.value = '';
                }
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-cyan-500 px-5 py-3 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/10 transition hover:bg-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
            >
              Add link
            </button>
          </div>

          {portfolioLinkInputError ? (
            <p
              id="gig-portfolio-link-error"
              role="alert"
              className="mt-3 text-xs font-semibold text-red-400"
            >
              {portfolioLinkInputError}
            </p>
          ) : null}

          {touchedFields.media && mediaErrors.portfolioLinks ? (
            <p role="alert" className="mt-3 text-xs font-semibold text-red-400">
              {mediaErrors.portfolioLinks}
            </p>
          ) : null}

          {media.portfolioLinks.length > 0 ? (
            <div className="mt-5 space-y-2">
              {media.portfolioLinks.map((link) => (
                <div
                  key={link}
                  className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/55 px-3 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-200" title={link}>
                      {link}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePortfolioLink(link)}
                    className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-[10px] font-black text-red-300 transition hover:bg-red-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 px-4 py-5">
              <p className="text-sm font-semibold text-slate-500">
                No portfolio links added yet.
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Portfolio links are optional, so you can continue without adding one.
              </p>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/35 p-5 sm:p-7">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
              Live demo
            </p>
            <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">
              Let buyers try the service
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Optional demo URL for applicable services. Use a public page where buyers can preview the kind of experience or result they can expect.
            </p>
          </div>

          <div className="mt-6">
            <label
              htmlFor="gig-live-demo-url"
              className="block text-xs font-black uppercase tracking-wider text-slate-300"
            >
              Live demo URL
            </label>
            <div className="mt-3">
              <input
                id="gig-live-demo-url"
                type="url"
                value={media.liveDemoUrl}
                onChange={(event) => updateLiveDemoUrl(event.target.value)}
                placeholder="https://example.com/demo"
                aria-invalid={Boolean(mediaErrors.liveDemoUrl)}
                aria-describedby={
                  mediaErrors.liveDemoUrl
                    ? 'gig-live-demo-url-error'
                    : 'gig-live-demo-url-help'
                }
                className={`min-h-11 w-full rounded-xl border bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:ring-2 ${
                  mediaErrors.liveDemoUrl
                    ? 'border-red-500/50 focus:border-red-400/70 focus:ring-red-400/10'
                    : 'border-slate-800 focus:border-cyan-500/50 focus:ring-cyan-400/10'
                }`}
              />
            </div>

            <p id="gig-live-demo-url-help" className="mt-2 text-xs leading-5 text-slate-600">
              Full http:// or https:// URLs only. Leave empty when a live demo does not apply.
            </p>

            {mediaErrors.liveDemoUrl ? (
              <p
                id="gig-live-demo-url-error"
                role="alert"
                className="mt-3 text-xs font-semibold text-red-400"
              >
                {mediaErrors.liveDemoUrl}
              </p>
            ) : null}
          </div>
        </section>

        {cropImageSrc && (
          <ImageCropModal
            imageSrc={cropImageSrc}
            aspect={16 / 9}
            cropShape="rect"
            title="Crop Gig Cover"
            onCropComplete={handleCoverCropComplete}
            onClose={() => {
              setCropImageSrc(null);
              setPendingCoverFile(null);
            }}
          />
        )}
      </div>
    );
  };

  const renderValidationSummary = () => (
    <div className="mt-8 space-y-6">
      <section
        aria-labelledby="gig-quality-score-heading"
        className="rounded-3xl border border-indigo-500/20 bg-indigo-500/5 p-5 sm:p-7"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-300">
              Gig Quality Score
            </p>
            <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-2">
              <h3
                id="gig-quality-score-heading"
                className="text-4xl sm:text-5xl font-black text-white"
              >
                {qualityScore.score}
                <span className="ml-1 text-xl sm:text-2xl text-slate-500">/100</span>
              </h3>
              <p className="pb-1 text-sm font-black text-cyan-300" role="status">
                {qualityScore.qualityBand.label}
              </p>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              {qualityScore.qualityBand.description}
            </p>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-600">
              This score uses the quality signals currently available in this creation
              workflow. Later requirements can add further quality signals without
              changing the purpose of the score.
            </p>
          </div>

          <div className="w-full max-w-sm shrink-0 lg:w-72">
            <div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.16em]">
              <span className="text-slate-500">Current quality</span>
              <span className="text-indigo-300">{qualityScore.score}%</span>
            </div>
            <div
              className="mt-3 h-2.5 overflow-hidden rounded-full border border-slate-800 bg-slate-950"
              role="progressbar"
              aria-label="Gig quality score"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={qualityScore.score}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500 transition-all"
                style={{ width: `${qualityScore.score}%` }}
              />
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              Quality is different from overall step completion and reflects how
              strongly each available area supports buyer clarity.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {qualityScore.strongestSignals.map((signal) => (
            <div
              key={signal.id}
              className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black text-white">{signal.label}</p>
                <span className="text-[11px] font-black text-emerald-300">
                  {signal.score}/{signal.weight}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                One of the strongest quality signals in the current Gig.
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <div>
            <h4 className="text-sm font-black text-white">Highest-value improvements</h4>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              These are recommendations, not additional submission blockers.
            </p>
          </div>

          {qualityScore.suggestions.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-4 text-xs font-semibold text-emerald-200/80">
              No major quality improvements are identified in the current workflow.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
              {qualityScore.suggestions.map((suggestion) => (
                <article
                  key={suggestion.id}
                  className="rounded-2xl border border-indigo-500/15 bg-slate-950/45 p-4"
                >
                  <p className="text-sm font-black text-white">{suggestion.title}</p>
                  <p className="mt-1.5 text-xs leading-5 text-slate-400">
                    {suggestion.detail}
                  </p>
                  <button
                    type="button"
                    onClick={() => goToStep(suggestion.step)}
                    className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/70 px-3.5 py-2.5 text-[11px] font-black text-slate-200 transition hover:border-cyan-500/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
                  >
                    Review {steps[suggestion.step - 1].label}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section
        aria-labelledby="validation-summary-heading"
        className="rounded-3xl border border-slate-800 bg-slate-950/35 p-5 sm:p-7"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
              Validation Summary
            </p>
            <h3
              id="validation-summary-heading"
              className="mt-2 text-xl sm:text-2xl font-black text-white"
            >
              {validationSummary.isReadyForCurrentChecks
                ? 'Your gig has no current blockers'
                : 'A few things still need attention'}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Review required items before the later submission stage. This
              summary reflects the validation already implemented in the current
              creation workflow.
            </p>
          </div>

          <div
            className={[
              'shrink-0 rounded-2xl border px-4 py-3 text-xs font-black',
              validationSummary.isReadyForCurrentChecks
                ? 'border-emerald-500/25 bg-emerald-500/5 text-emerald-300'
                : 'border-red-500/25 bg-red-500/5 text-red-300'
            ].join(' ')}
            role="status"
          >
            {validationSummary.isReadyForCurrentChecks
              ? 'Ready for current checks'
              : `${validationSummary.blockers.length} blocker${validationSummary.blockers.length === 1 ? '' : 's'}`}
          </div>
        </div>
      </section>

      {validationSummary.blockers.length > 0 && (
        <section
          aria-labelledby="validation-blockers-heading"
          className="rounded-3xl border border-red-500/20 bg-red-500/5 p-5 sm:p-7"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3
                id="validation-blockers-heading"
                className="text-sm font-black text-red-200"
              >
                Blockers
              </h3>
              <p className="mt-1 text-xs leading-5 text-red-200/70">
                These required areas need to be fixed before the gig can pass
                the current validation checks.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {validationSummary.blockers.map((item) => (
              <article
                key={`${item.step}-${item.message}`}
                className="rounded-2xl border border-red-500/15 bg-slate-950/50 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white">{item.message}</p>
                    {item.detail && (
                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        {item.detail}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => goToStep(item.step)}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/70 px-3.5 py-2.5 text-[11px] font-black text-slate-200 transition hover:border-cyan-500/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
                  >
                    Go to {steps[item.step - 1].label}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section
        aria-labelledby="validation-warnings-heading"
        className="rounded-3xl border border-slate-800 bg-slate-950/35 p-5 sm:p-7"
      >
        <div>
          <h3
            id="validation-warnings-heading"
            className="text-sm font-black text-white"
          >
            Recommendations
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            These items can improve buyer clarity but are not current blockers.
          </p>
        </div>

        {validationSummary.warnings.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-4 text-xs font-semibold text-slate-500">
            No current recommendations.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {validationSummary.warnings.map((item) => (
              <article
                key={`${item.step}-${item.message}`}
                className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white">{item.message}</p>
                    {item.detail && (
                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        {item.detail}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => goToStep(item.step)}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/70 px-3.5 py-2.5 text-[11px] font-black text-slate-200 transition hover:border-cyan-500/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
                  >
                    Review {steps[item.step - 1].label}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {moderationFeedback && (
        <section
          aria-labelledby="moderation-feedback-heading"
          className="rounded-3xl border border-orange-500/20 bg-orange-500/5 p-5 sm:p-7"
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">
              Moderation Feedback
            </p>
            <h3
              id="moderation-feedback-heading"
              className="mt-1 text-lg font-black text-white"
            >
              {moderationFeedback.status === 'REJECTED'
                ? 'Your gig was rejected'
                : 'Changes are required before approval'}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Review the reason code and automated findings below, make the requested corrections, then submit the gig again for moderation.
            </p>

            {moderationFeedback.reasonCode && (
              <div className="mt-4 rounded-2xl border border-orange-500/15 bg-slate-950/50 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                  Reason code
                </p>
                <p className="mt-1 text-sm font-black text-orange-200">
                  {moderationFeedback.reasonCode}
                </p>
              </div>
            )}

            {moderationFeedback.findings.length > 0 && (
              <div className="mt-4 space-y-2">
                {moderationFeedback.findings.map((finding, index) => (
                  <div
                    key={`${finding.reasonCode || 'finding'}-${index}`}
                    className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-white">
                        {finding.reasonCode || finding.check || 'Moderation finding'}
                      </span>
                      {finding.severity && (
                        <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-400">
                          {finding.severity}
                        </span>
                      )}
                    </div>
                    {finding.details && (
                      <div className="mt-3 space-y-2">
                        {Array.isArray(finding.details) ? (
                          finding.details.map((detail, detailIndex) => (
                            <div
                              key={`${finding.reasonCode || finding.check || 'finding'}-detail-${detailIndex}`}
                              className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2.5"
                            >
                              {typeof detail === 'object' && detail !== null ? (
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                                  {Object.entries(detail).map(([key, value]) => (
                                    <span key={key} className="text-slate-400">
                                      <span className="font-black uppercase tracking-wider text-slate-600">
                                        {key === 'phrase' ? 'Phrase' : key === 'count' ? 'Occurrences' : key}
                                      </span>{' '}
                                      <span className="font-bold text-slate-300">
                                        {String(value)}
                                      </span>
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[11px] text-slate-300">{String(detail)}</p>
                              )}
                            </div>
                          ))
                        ) : typeof finding.details === 'object' ? (
                          <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2.5">
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                              {Object.entries(finding.details).map(([key, value]) => (
                                <span key={key} className="text-slate-400">
                                  <span className="font-black uppercase tracking-wider text-slate-600">
                                    {key}
                                  </span>{' '}
                                  <span className="font-bold text-slate-300">
                                    {String(value)}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400">{String(finding.details)}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {submissionError && (
        <section
          aria-labelledby="submission-error-heading"
          className="rounded-3xl border border-red-500/20 bg-red-500/5 p-5 sm:p-7"
        >
          <h3
            id="submission-error-heading"
            className="text-sm font-black text-red-200"
          >
            Submission needs attention
          </h3>
          <p className="mt-2 text-sm leading-6 text-red-200/80">
            {submissionError}
          </p>

          {submissionBlockers.length > 0 && (
            <div className="mt-4 space-y-2">
              {submissionBlockers.map((item) => (
                <button
                  key={`${item.step}-${item.field}-${item.detail || item.message}`}
                  type="button"
                  onClick={() => goToStep(item.step)}
                  className="block w-full rounded-xl border border-red-500/15 bg-slate-950/50 px-3.5 py-3 text-left text-xs font-bold text-slate-300 hover:border-cyan-500/30 hover:text-white transition"
                >
                  Step {item.step}: {item.detail || item.message}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {submissionState === 'submitted' && (
        <section
          aria-labelledby="submission-success-heading"
          className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5 sm:p-7"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <h3
                id="submission-success-heading"
                className="text-lg font-black text-white"
              >
                {isManagementEdit
                  ? 'Changes submitted for review'
                  : 'Gig submitted for review'}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {isManagementEdit
                  ? 'Your changes passed the current submission validation and are now pending marketplace review. The current live version will remain unchanged until the changes are approved.'
                  : 'Your gig passed the current submission validation and is now pending marketplace review. It will not appear as a published marketplace listing until it is approved.'}
              </p>
              <button
                type="button"
                onClick={() => navigate('/student/gigs')}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-xs font-black text-slate-950 hover:bg-cyan-400 transition"
              >
                Back to My Gigs
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );

  const renderPlaceholder = () => (
    <div className="mt-8 rounded-3xl border border-dashed border-slate-700 bg-slate-950/35 p-6 sm:p-8">
      <div className="max-w-xl">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-indigo-300" />
        </div>

        <h3 className="text-lg sm:text-xl font-black text-white mt-5">
          {currentStepData.label} step is ready
        </h3>

        <p className="text-sm leading-6 text-slate-500 mt-2">
          Navigation is now controlled across the complete creation flow.
          Completed steps remain available for review without resetting your place in the workflow.
        </p>
      </div>
    </div>
  );

  return (
    <>
      <style>{HIDDEN_SCROLLBAR_STYLES}</style>
      <div className="min-h-[calc(100vh-7rem)] pb-16">
      <div className="w-full min-w-0 max-w-[1500px] mx-auto">
        <section className="glass-panel w-full min-w-0 rounded-3xl border border-slate-800 overflow-hidden">
          <header className="border-b border-slate-800 bg-gradient-to-r from-cyan-500/10 via-transparent to-indigo-500/10">
            <div className="px-5 sm:px-7 lg:px-9 py-5 sm:py-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <Link
                    to="/student/gigs"
                    className="inline-flex items-center gap-2 text-xs font-black text-slate-400 hover:text-white transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to My Gigs
                  </Link>

                  <div className="flex items-start gap-3 mt-5">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                      <FileEdit className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
                        Student Workspace
                      </p>
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mt-1">
                        {isManagementEdit ? 'Edit Service' : 'Create a Service'}
                      </h1>
                      <p className="text-sm leading-6 text-slate-500 mt-2 max-w-2xl">
                        {isManagementEdit
                          ? 'Update your service while keeping its current lifecycle state.'
                          : 'Build a clear, trustworthy service listing buyers can understand before they order.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                      {isManagementEdit
                        ? isManagementEditLocked
                          ? 'Changes Pending Review'
                          : 'Editing Service'
                        : 'Ready to edit'}
                    </span>
                  </div>

                  <div
                      className="inline-flex min-w-0 items-center rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-[10px] font-black text-slate-500"
                      aria-live="polite"
                    >
                      {saveState === 'saving' && 'Saving…'}
                      {saveState === 'saved' && lastSavedAt && (
                        <>Saved {formatRelativeSavedTime(lastSavedAt)}</>
                      )}
                      {saveState === 'saved' && !lastSavedAt && 'Saved'}
                      {saveState === 'error' && 'Save failed — retry'}
                      {saveState === 'idle' && 'Not saved yet'}
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={
                        saveState === 'saving' ||
                        submissionState === 'submitted' ||
                        isManagementEditLocked
                      }
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950/50 text-xs font-black text-slate-300 hover:text-white hover:border-slate-600 transition disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Save gig draft"
                    >
                      <Save className="w-4 h-4" />
                      {saveState === 'saving'
                        ? 'Saving…'
                        : isManagementEdit
                          ? 'Save Changes'
                          : 'Save Draft'}
                    </button>
                </div>
              </div>
            </div>

            <div className="px-5 sm:px-7 lg:px-9 pb-5">
              <div className="flex items-center justify-between gap-4 mb-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                    Overall Progress
                  </p>
                  <p className="text-sm font-black text-white mt-1">
                    {completionPercent}% complete
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">
                    Current step
                  </p>
                  <p className="text-sm font-black text-cyan-300 mt-1">
                    {currentStep} of {steps.length}
                  </p>
                </div>
              </div>

              <div className="h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500 transition-all"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>
          </header>

          <div className="grid w-full min-w-0 grid-cols-1 lg:grid-cols-[290px_minmax(0,1fr)]">
            <aside className="border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950/35 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
                    Creation Flow
                  </p>
                  <h2 className="text-sm font-black text-white mt-1">
                    Build your service
                  </h2>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-black text-slate-500">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Guided
                </div>
              </div>

              <nav
                aria-label="Gig creation steps"
                className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-1 lg:overflow-visible"
              >
                {steps.map((step) => {
                  const isCurrent = step.id === currentStep;
                  const isComplete = effectiveCompletedSteps.has(step.id);
                  const isReachable = step.id <= furthestReachableStep;

                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => goToStep(step.id)}
                      disabled={!isReachable || isManagementEditLocked}
                      aria-current={isCurrent ? 'step' : undefined}
                      aria-label={`${step.label}${isComplete ? ', completed' : isCurrent ? ', current step' : ', upcoming'}`}
                      className={[
                        'w-full min-w-[190px] lg:min-w-0 text-left rounded-2xl border px-3.5 py-3 transition',
                        isCurrent
                          ? 'border-cyan-500/30 bg-cyan-500/10 shadow-lg shadow-cyan-500/5'
                          : isComplete
                            ? 'border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/30 hover:bg-emerald-500/10'
                            : 'border-slate-800 bg-slate-950/30 opacity-75',
                        !isReachable ? 'cursor-not-allowed' : 'cursor-pointer'
                      ].join(' ')}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={[
                            'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border',
                            isComplete
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                              : isCurrent
                                ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                                : 'border-slate-800 bg-slate-900 text-slate-600'
                          ].join(' ')}
                        >
                          {isComplete ? (
                            <Check className="w-4 h-4" />
                          ) : isCurrent ? (
                            <span className="text-[11px] font-black">{step.id}</span>
                          ) : (
                            <Circle className="w-3.5 h-3.5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className={`text-xs font-black ${isCurrent ? 'text-white' : 'text-slate-400'}`}>
                            {step.label}
                          </p>
                          <p className="text-[10px] text-slate-600 mt-0.5 truncate">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </aside>

            <main className="w-full min-w-0 p-5 sm:p-7 lg:p-10">
              <div className="w-full min-w-0 max-w-4xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
                      Step {currentStep}
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                      {currentStepData.label}
                    </h2>
                    <p className="text-sm leading-6 text-slate-500 mt-2 max-w-2xl">
                      {currentStep === 1
                        ? 'Identify the service with a clear title and precise category hierarchy.'
                        : `${currentStepData.description}. This step is part of the guided service creation workflow.`}
                    </p>
                  </div>

                  <div className="hidden sm:flex w-11 h-11 rounded-2xl bg-slate-900 border border-slate-800 items-center justify-center">
                    <FileEdit className="w-5 h-5 text-slate-500" />
                  </div>
                </div>

                {currentStep === 1
                  ? renderBasics()
                  : currentStep === 2
                    ? renderDescription()
                    : currentStep === 3
                      ? renderPricing()
                      : currentStep === 4
                        ? renderDelivery()
                        : currentStep === 5
                          ? renderRequirements()
                          : currentStep === 6
                            ? renderMedia()
                            : currentStep === 7
                              ? renderDiscovery()
                              : currentStep === 8
                              ? renderFaqs()
                              : currentStep === 9
                            ? (
                              <GigBuyerPreview
                                basics={basics}
                                description={description}
                                pricing={pricing}
                                delivery={delivery}
                                packages={packages}
                                extras={extras}
                                requirements={requirements}
                                media={media}
                                faqs={faqs}
                                discovery={discovery}
                                categorySpecificFields={categorySpecificFieldDefinitions.map((field) => ({
                                  ...field,
                                  value: categorySpecificFields[field.key]
                                }))}
                                categoryName={selectedCategory?.name}
                                subcategoryName={selectedSubcategory?.name}
                                sellerProfile={profileData}
                                serviceTypeName={
                                  serviceTypes.find(
                                    (serviceType) => serviceType.id === basics.serviceType
                                  )?.name || basics.serviceType
                                }
                              />
                            )
                            : currentStep === 10
                              ? renderValidationSummary()
                              : renderPlaceholder()}

                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 mt-8 pt-6 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => navigate('/student/gigs')}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-700 bg-slate-950/50 text-xs font-black text-slate-300 hover:text-white hover:border-slate-600 transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Exit
                  </button>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={handleBack}
                        disabled={isManagementEditLocked}
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-700 bg-slate-950/50 text-xs font-black text-slate-300 hover:text-white hover:border-slate-600 transition disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                      </button>
                    )}

                    {currentStep < steps.length && submissionState !== 'submitted' && (
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={isManagementEditLocked}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 text-slate-950 text-xs font-black hover:bg-cyan-400 transition shadow-lg shadow-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Continue
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}

                    {currentStep === steps.length &&
                      submissionState !== 'submitted' && (
                      <button
                        type="button"
                        onClick={handleSubmitGig}
                        disabled={
                          submissionState === 'submitting' ||
                          !validationSummary.isReadyForCurrentChecks ||
                          saveState === 'saving'
                        }
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        {submissionState === 'submitting'
                          ? 'Submitting…'
                          : isManagementEdit
                            ? 'Submit Changes for Review'
                            : 'Submit for Review'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </main>
          </div>
        </section>
      </div>
    </div>
    </>
  );
}
