import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Briefcase, FileText, Layers, DollarSign, Paperclip, Sliders, CheckCircle2, 
  ArrowLeft, ArrowRight, Save, Sparkles, Check, Lock, AlertCircle, Clock, Repeat,
  Plus, Trash2, X, Search, Sparkle, Award, Zap, HelpCircle, Calendar, IndianRupee, 
  Info, TrendingUp, UploadCloud, File, Globe, Shield, CheckCircle, Eye, EyeOff, 
  MapPin, Languages, MessageSquare, FileCheck, Edit3, Send, ArrowUpRight
} from 'lucide-react';
import { JOB_CATEGORIES_DATA, JOB_CATEGORIES, ALL_SKILLS } from '../data/jobsCategoriesData';
import API from '../services/api';

const STEPS = [
  { id: 1, name: 'Basics', label: 'Basic Information', icon: Briefcase, desc: 'Title, category, and project scope' },
  { id: 2, name: 'Description', label: 'Project Description', icon: FileText, desc: 'Detailed requirements & deliverables' },
  { id: 3, name: 'Skills', label: 'Skills & Experience', icon: Layers, desc: 'Required tech stack & student level' },
  { id: 4, name: 'Budget', label: 'Budget & Timeline', icon: DollarSign, desc: 'Pricing structure & expected deadline' },
  { id: 5, name: 'Files', label: 'Files & References', icon: Paperclip, desc: 'Attachments, mockups, or documents' },
  { id: 6, name: 'Options', label: 'Additional Options', icon: Sliders, desc: 'Screening questions & visibility' },
  { id: 7, name: 'Review', label: 'Review & Publish', icon: CheckCircle2, desc: 'Final check before posting' }
];

const CATEGORIES_DATA = JOB_CATEGORIES_DATA;

const EXPERIENCE_LEVELS = [
  { id: 'BEGINNER', title: 'Beginner', badge: 'Rising Star', desc: 'Suitable for simple projects or clients comfortable with some guidance.', icon: Sparkle },
  { id: 'INTERMEDIATE', title: 'Intermediate', badge: 'Standard', desc: 'Has professional experience and can independently handle most projects.', icon: Zap },
  { id: 'EXPERT', title: 'Expert', badge: 'Top Tier', desc: 'Highly experienced professional suitable for complex projects.', icon: Award },
  { id: 'NOT_SURE', title: "I'm not sure", badge: 'Flexible', desc: 'Let the marketplace recommend suitable freelancers based on proposals.', icon: HelpCircle }
];

const START_PREFERENCES = [
  { id: 'ASAP', label: 'As soon as possible' },
  { id: 'FEW_DAYS', label: 'Within a few days' },
  { id: 'NEXT_WEEK', label: 'Next week' },
  { id: 'FLEXIBLE', label: 'Flexible' },
  { id: 'SPECIFIC_DATE', label: 'Specific date' }
];

const DEADLINE_TYPES = [
  { id: 'ASAP', label: 'As soon as possible' },
  { id: '1_WEEK', label: 'Within 1 week' },
  { id: '2_WEEKS', label: 'Within 2 weeks' },
  { id: '1_MONTH', label: 'Within 1 month' },
  { id: 'SPECIFIC_DATE', label: 'I have a specific deadline' },
  { id: 'FLEXIBLE', label: 'Flexible' }
];

const INDIAN_STATES = [
  "Andhra Pradesh", "Telangana", "Karnataka", "Tamil Nadu", "Maharashtra", 
  "Delhi (NCR)", "Uttar Pradesh", "Gujarat", "West Bengal", "Kerala", 
  "Rajasthan", "Punjab", "Haryana", "Madhya Pradesh", "Bihar", "Odisha", 
  "Assam", "Goa", "Uttarakhand", "Jharkhand", "Chhattisgarh", "Himachal Pradesh"
];

const INDIAN_LANGUAGES = [
  "English", "Hindi", "Telugu", "Tamil", "Kannada", 
  "Malayalam", "Marathi", "Bengali", "Gujarati", "Punjabi", "Other"
];

const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;

export default function PostJobPage({ currentUser }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);
  
  // New refs added for the auto-expanding textareas
  const descriptionRef = useRef(null);
  const requirementsRef = useRef(null);

  const token = localStorage.getItem('token');
  const isAuthenticated = Boolean(currentUser || token);

  const [currentStep, setCurrentStep] = useState(1);
  const [draftId, setDraftId] = useState(() => searchParams.get('draftId') || '');
  const [toastMessage, setToastMessage] = useState(null);
  const [errors, setErrors] = useState({});

  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [publishedJobInfo, setPublishedJobInfo] = useState(null);

  const [skillSearchInput, setSkillSearchInput] = useState('');
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [cloudLinkInput, setCloudLinkInput] = useState('');
  const [fileError, setFileError] = useState('');

  const todayDateString = new Date().toISOString().split('T')[0];

  const initialFormState = {
    title: '',
    category: '',
    subcategory: '',
    projectType: 'ONE_TIME',
    description: '',
    deliverables: [''],
    specificRequirements: '',
    requiredSkills: [],
    experienceLevel: 'INTERMEDIATE',
    budgetType: 'RANGE',
    fixedBudget: '',
    minimumBudget: '',
    maximumBudget: '',
    currency: 'INR',
    startPreference: 'ASAP',
    startDate: '',
    deadlineType: '1_MONTH',
    deadlineDate: '',
    uploadedFiles: [],
    cloudDriveLinks: [],
    referenceWebsites: [''],
    visibility: 'PUBLIC',
    preferredLocationType: 'ANYWHERE_INDIA',
    preferredState: '',
    preferredCity: '',
    preferredLanguages: ['English'],
    screeningQuestions: [],
    ndaRequired: false
  };

  const [formData, setFormData] = useState(initialFormState);

  // Auto-expanding textbox function
  const adjustHeight = (ref) => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  };

  // Triggers the auto-expand when they open Step 2 or load a draft
  useEffect(() => {
    if (currentStep === 2) {
      setTimeout(() => {
        adjustHeight(descriptionRef);
        adjustHeight(requirementsRef);
      }, 0);
    }
  }, [currentStep, formData.description, formData.specificRequirements]);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    try {
      const requestedDraftId = searchParams.get('draftId');
      const allDrafts = JSON.parse(localStorage.getItem('marketplace_client_drafts') || '[]');

      if (requestedDraftId) {
        const found = allDrafts.find(d => d.id === requestedDraftId);
        if (found && found.formData) {
          setDraftId(found.id);
          setFormData(prev => ({ ...prev, ...found.formData }));
          if (found.currentStep) setCurrentStep(found.currentStep);
          if (found.lastSaved) {
            setLastSavedTime(new Date(found.lastSaved).toLocaleTimeString());
          }
          showToast('Draft loaded: ' + (found.formData.title || 'Untitled Draft'), 'success');
          return;
        }
      }

      const savedActiveDraft = localStorage.getItem('marketplace_job_draft');
      if (savedActiveDraft) {
        const parsed = JSON.parse(savedActiveDraft);
        if (parsed.draftId) setDraftId(parsed.draftId);
        if (parsed.lastSaved) {
          setLastSavedTime(new Date(parsed.lastSaved).toLocaleTimeString());
        }
        if (parsed.formData) {
          setFormData(prev => ({
            ...prev,
            ...parsed.formData,
            deliverables: Array.isArray(parsed.formData.deliverables) && parsed.formData.deliverables.length > 0 
              ? parsed.formData.deliverables : [''],
            requiredSkills: Array.isArray(parsed.formData.requiredSkills) ? parsed.formData.requiredSkills : [],
            uploadedFiles: Array.isArray(parsed.formData.uploadedFiles) ? parsed.formData.uploadedFiles : [],
            cloudDriveLinks: Array.isArray(parsed.formData.cloudDriveLinks) ? parsed.formData.cloudDriveLinks : [],
            referenceWebsites: Array.isArray(parsed.formData.referenceWebsites) && parsed.formData.referenceWebsites.length > 0 
              ? parsed.formData.referenceWebsites : [''],
            preferredLanguages: Array.isArray(parsed.formData.preferredLanguages) && parsed.formData.preferredLanguages.length > 0
              ? parsed.formData.preferredLanguages : ['English'],
            screeningQuestions: Array.isArray(parsed.formData.screeningQuestions) ? parsed.formData.screeningQuestions : [],
            budgetType: parsed.formData.budgetType || 'RANGE',
            currency: 'INR'
          }));
        }
        if (parsed.currentStep) setCurrentStep(parsed.currentStep);
      }
    } catch (e) {
      console.error('Failed to load draft:', e);
    }
  }, [searchParams]);

  const handleFieldChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'category') updated.subcategory = '';
      return updated;
    });
    if (errors[field]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleAddDeliverable = () => setFormData(prev => ({ ...prev, deliverables: [...prev.deliverables, ''] }));
  const handleDeliverableChange = (index, value) => {
    setFormData(prev => {
      const updated = [...prev.deliverables];
      updated[index] = value;
      return { ...prev, deliverables: updated };
    });
  };
  const handleRemoveDeliverable = (index) => {
    setFormData(prev => {
      const updated = prev.deliverables.filter((_, idx) => idx !== index);
      return { ...prev, deliverables: updated.length > 0 ? updated : [''] };
    });
  };

  const handleAddSkill = (skillToAdd) => {
    const trimmed = (skillToAdd || '').trim();
    if (!trimmed) return;
    if (formData.requiredSkills.includes(trimmed)) {
      setSkillSearchInput('');
      setShowSkillDropdown(false);
      return;
    }
    if (formData.requiredSkills.length >= 10) {
      setErrors(prev => ({ ...prev, requiredSkills: 'You can select up to 10 skills maximum' }));
      return;
    }
    setFormData(prev => ({ ...prev, requiredSkills: [...prev.requiredSkills, trimmed] }));
    setSkillSearchInput('');
    setShowSkillDropdown(false);
  };
  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({ ...prev, requiredSkills: prev.requiredSkills.filter(s => s !== skillToRemove) }));
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFilesSelected = async (filesList) => {
    setFileError('');

    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      const tempId = `upload_${Date.now()}_${i}`;

      try {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          setFileError(`"${file.name}" exceeds the 500 MB upload limit.`);
          continue;
        }


        setFormData(prev => ({
          ...prev,
          uploadedFiles: [
            ...prev.uploadedFiles,
            {
              id: tempId,
              name: file.name,
              size: file.size,
              type: file.type || 'FILE',
              status: 'Uploading...',
              progress: 0
            }
          ]
        }));

        const chunkSize = 5 * 1024 * 1024;
        const totalChunks = Math.ceil(file.size / chunkSize);

        const initRes = await API.post('/upload/resumable/init', {
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type || 'application/octet-stream',
          totalChunks
        });

        const { uploadId } = initRes.data;

        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
          const start = chunkIndex * chunkSize;
          const end = Math.min(start + chunkSize, file.size);

          const chunk = file.slice(start, end);

          const r = await fetch(
            `${API.defaults.baseURL}/upload/resumable/${uploadId}/chunk`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
                'X-Chunk-Index': chunkIndex,
                'X-Total-Chunks': totalChunks,
                'Content-Type': 'application/octet-stream'
              },
              body: chunk
            }
          );

          if (!r.ok) {
            throw new Error(`Chunk ${chunkIndex} failed`);
          }

          const progress = Math.round(
            ((chunkIndex + 1) / totalChunks) * 100
          );

          setFormData(prev => ({
            ...prev,
            uploadedFiles: prev.uploadedFiles.map(f =>
              f.id === tempId
                ? { ...f, progress }
                : f
            )
          }));
        }

        const completeRes = await API.post(
          `/upload/resumable/${uploadId}/complete`
        );

        const uploadedUrl =
          completeRes.data?.secureUrl ||
          completeRes.data?.url ||
          '';

        setFormData(prev => ({
          ...prev,
          uploadedFiles: prev.uploadedFiles.map(f =>
            f.id === tempId
              ? {
                  ...f,
                  status: 'Uploaded',
                  progress: 100,
                  uploadId,
                  url: uploadedUrl
                }
              : f
          )
        }));
      } catch (err) {
        console.error(err);

        setFileError(`Failed to upload ${file.name}`);

        setFormData(prev => ({
          ...prev,
          uploadedFiles: prev.uploadedFiles.filter(
            f => f.id !== tempId
          )
        }));
      }
    }
  };


  const handleRemoveFile = (fileId) => {
    setFormData(prev => ({ ...prev, uploadedFiles: prev.uploadedFiles.filter(f => f.id !== fileId) }));
  };

  const handleAddCloudLink = () => {
    const trimmed = cloudLinkInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setFileError('Please enter a valid URL starting with https:// or http://');
      return;
    }
    setFormData(prev => ({ ...prev, cloudDriveLinks: [...prev.cloudDriveLinks, trimmed] }));
    setCloudLinkInput('');
    setFileError('');
  };

  const handleRemoveCloudLink = (index) => {
    setFormData(prev => ({ ...prev, cloudDriveLinks: prev.cloudDriveLinks.filter((_, idx) => idx !== index) }));
  };

  const handleAddReferenceWebsite = () => setFormData(prev => ({ ...prev, referenceWebsites: [...prev.referenceWebsites, ''] }));
  const handleReferenceWebsiteChange = (index, value) => {
    setFormData(prev => {
      const updated = [...prev.referenceWebsites];
      updated[index] = value;
      return { ...prev, referenceWebsites: updated };
    });
  };
  const handleRemoveReferenceWebsite = (index) => {
    setFormData(prev => {
      const updated = prev.referenceWebsites.filter((_, idx) => idx !== index);
      return { ...prev, referenceWebsites: updated.length > 0 ? updated : [''] };
    });
  };

  const handleToggleLanguage = (lang) => {
    setFormData(prev => {
      const exists = prev.preferredLanguages.includes(lang);
      if (exists) {
        if (prev.preferredLanguages.length === 1) return prev;
        return { ...prev, preferredLanguages: prev.preferredLanguages.filter(l => l !== lang) };
      }
      return { ...prev, preferredLanguages: [...prev.preferredLanguages, lang] };
    });
  };

  const handleAddScreeningQuestion = () => {
    if (formData.screeningQuestions.length >= 5) {
      setErrors(prev => ({ ...prev, screeningQuestions: 'You can add up to 5 screening questions maximum' }));
      return;
    }
    setFormData(prev => ({ ...prev, screeningQuestions: [...prev.screeningQuestions, ''] }));
  };

  const handleScreeningQuestionChange = (index, value) => {
    setFormData(prev => {
      const updated = [...prev.screeningQuestions];
      updated[index] = value;
      return { ...prev, screeningQuestions: updated };
    });
  };

  const handleRemoveScreeningQuestion = (index) => {
    setFormData(prev => ({ ...prev, screeningQuestions: prev.screeningQuestions.filter((_, idx) => idx !== index) }));
  };

  const validateAllSteps = () => {
    const s1 = {}, s2 = {}, s3 = {}, s4 = {};
    const trimmedTitle = (formData.title || '').trim();
    if (!trimmedTitle) s1.title = 'Job title is required';
    else if (trimmedTitle.length < 10) s1.title = 'Title must be at least 10 characters long';
    else if (trimmedTitle.length > 100) s1.title = 'Title cannot exceed 100 characters';
    if (!formData.category) s1.category = 'Please select a primary category';
    if (formData.category && !formData.subcategory) s1.subcategory = 'Please select a subcategory';
    if (!formData.projectType) s1.projectType = 'Please select a project type';

    const trimmedDesc = (formData.description || '').trim();
    if (!trimmedDesc) s2.description = 'Project description is required';
    else if (trimmedDesc.length < 50) s2.description = 'Description must be at least 50 characters long';
    const validDeliv = (formData.deliverables || []).filter(d => (d || '').trim().length > 0);
    if (validDeliv.length === 0) s2.deliverables = 'Please specify at least one project deliverable';

    if (!formData.requiredSkills || formData.requiredSkills.length === 0) {
      s3.requiredSkills = 'Please select at least one required skill';
    }

    if (formData.budgetType === 'FIXED') {
      const fb = Number(formData.fixedBudget);
      if (!formData.fixedBudget || isNaN(fb) || fb <= 0) s4.fixedBudget = 'Please enter a valid fixed budget greater than 0';
    } else {
      const minB = Number(formData.minimumBudget);
      const maxB = Number(formData.maximumBudget);
      if (!formData.minimumBudget || isNaN(minB) || minB <= 0) s4.minimumBudget = 'Minimum budget must be greater than 0';
      if (!formData.maximumBudget || isNaN(maxB) || maxB <= 0) s4.maximumBudget = 'Maximum budget must be greater than 0';
      if (!isNaN(minB) && !isNaN(maxB) && minB > 0 && maxB > 0 && maxB < minB) {
        s4.maximumBudget = 'Maximum budget must be greater than or equal to minimum budget';
      }
    }
    if (formData.startPreference === 'SPECIFIC_DATE' && (!formData.startDate || formData.startDate < todayDateString)) {
      s4.startDate = 'Please select a valid future start date';
    }
    if (formData.deadlineType === 'SPECIFIC_DATE') {
      if (!formData.deadlineDate || formData.deadlineDate < todayDateString) {
        s4.deadlineDate = 'Please select a valid future deadline date';
      } else if (formData.startPreference === 'SPECIFIC_DATE' && formData.startDate && formData.deadlineDate < formData.startDate) {
        s4.deadlineDate = 'Deadline must be on or after start date';
      }
    }

    return {
      isValid: Object.keys(s1).length === 0 && Object.keys(s2).length === 0 && Object.keys(s3).length === 0 && Object.keys(s4).length === 0,
      s1, s2, s3, s4
    };
  };

  const validateCurrentStep = (step) => {
    const stepErrors = {};
    if (step === 1) {
      const trimmedTitle = (formData.title || '').trim();
      if (!trimmedTitle) stepErrors.title = 'Job title is required';
      else if (trimmedTitle.length < 10) stepErrors.title = 'Title must be at least 10 characters long';
      else if (trimmedTitle.length > 100) stepErrors.title = 'Title cannot exceed 100 characters';
      if (!formData.category) stepErrors.category = 'Please select a primary category';
      if (formData.category && !formData.subcategory) stepErrors.subcategory = 'Please select a subcategory';
      if (!formData.projectType) stepErrors.projectType = 'Please select a project type';
    } else if (step === 2) {
      const trimmedDesc = (formData.description || '').trim();
      if (!trimmedDesc) stepErrors.description = 'Project description is required';
      else if (trimmedDesc.length < 50) stepErrors.description = 'Description must be at least 50 characters long';
      const validDeliv = (formData.deliverables || []).filter(d => (d || '').trim().length > 0);
      if (validDeliv.length === 0) stepErrors.deliverables = 'Please specify at least one project deliverable';
    } else if (step === 3) {
      if (!formData.requiredSkills || formData.requiredSkills.length === 0) {
        stepErrors.requiredSkills = 'Please select at least one required skill';
      }
    } else if (step === 4) {
      if (formData.budgetType === 'FIXED') {
        const fb = Number(formData.fixedBudget);
        if (!formData.fixedBudget || isNaN(fb) || fb <= 0) stepErrors.fixedBudget = 'Please enter a valid fixed budget greater than 0';
      } else {
        const minB = Number(formData.minimumBudget);
        const maxB = Number(formData.maximumBudget);
        if (!formData.minimumBudget || isNaN(minB) || minB <= 0) stepErrors.minimumBudget = 'Minimum budget must be greater than 0';
        if (!formData.maximumBudget || isNaN(maxB) || maxB <= 0) stepErrors.maximumBudget = 'Maximum budget must be greater than 0';
        if (!isNaN(minB) && !isNaN(maxB) && minB > 0 && maxB > 0 && maxB < minB) {
          stepErrors.maximumBudget = 'Maximum budget must be greater than or equal to minimum budget';
        }
      }
      if (formData.startPreference === 'SPECIFIC_DATE' && (!formData.startDate || formData.startDate < todayDateString)) {
        stepErrors.startDate = 'Please select a valid future start date';
      }
      if (formData.deadlineType === 'SPECIFIC_DATE') {
        if (!formData.deadlineDate || formData.deadlineDate < todayDateString) {
          stepErrors.deadlineDate = 'Please select a valid future deadline date';
        } else if (formData.startPreference === 'SPECIFIC_DATE' && formData.startDate && formData.deadlineDate < formData.startDate) {
          stepErrors.deadlineDate = 'Deadline must be on or after start date';
        }
      }
    }
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep(currentStep)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // SAVE DRAFT: Updates existing draft if draftId is set, or creates new draft
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const timeString = new Date().toLocaleTimeString();
      let activeDraftId = draftId;

      const payload = {
        id: activeDraftId && !activeDraftId.startsWith('DRAFT-') ? activeDraftId : undefined,
        title: formData.title || 'Untitled Draft',
        category: formData.category || 'Web Development',
        subcategory: formData.subcategory || '',
        projectType: formData.projectType || 'ONE_TIME',
        description: formData.description || '',
        deliverables: (formData.deliverables || []).filter(d => (d || '').trim().length > 0),
        requirements: formData.specificRequirements || null,
        skills: formData.requiredSkills || [],
        experienceLevel: formData.experienceLevel || 'INTERMEDIATE',
        budget: formData.budgetType === 'FIXED' 
          ? (parseFloat(formData.fixedBudget) || 0) 
          : (parseFloat(formData.maximumBudget) || parseFloat(formData.minimumBudget) || 0),
        timeline: formData.deadlineType || '1_MONTH',
        attachmentUrls: (formData.uploadedFiles || []).map(f => f.url).filter(Boolean),
        externalLinks: (formData.cloudDriveLinks || []).filter(l => (l || '').trim().length > 0),
        referenceLinks: (formData.referenceWebsites || []).filter(w => (w || '').trim().length > 0),
        visibility: formData.visibility || 'PUBLIC',
        locationPreferences: formData.preferredLocationType === 'SPECIFIC_STATE' ? formData.preferredState : formData.preferredLocationType === 'SPECIFIC_CITY' ? formData.preferredCity : formData.preferredLocationType,
        languagePreferences: (formData.preferredLanguages || []).join(', '),
        screeningQuestions: (formData.screeningQuestions || []).filter(q => (q || '').trim().length > 0),
        currentStep,
        status: 'DRAFT',
        isOpen: false
      };

      // Sync with PostgreSQL backend database if token is available
      if (token) {
        try {
          let res;
          if (activeDraftId && !activeDraftId.startsWith('DRAFT-')) {
            res = await axios.put(`http://localhost:5000/api/jobs/${activeDraftId}`, payload, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } else {
            res = await axios.post('http://localhost:5000/api/jobs', payload, {
              headers: { Authorization: `Bearer ${token}` }
            });
          }
          const serverJob = res.data.job || res.data;
          if (serverJob && serverJob.id) {
            activeDraftId = serverJob.id;
            setDraftId(serverJob.id);
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('draftId', serverJob.id);
            window.history.replaceState(null, '', newUrl.toString());
          }
        } catch (apiErr) {
          console.warn('Backend draft sync notice:', apiErr);
        }
      }

      if (!activeDraftId) {
        activeDraftId = `DRAFT-${Date.now().toString().slice(-6)}`;
        setDraftId(activeDraftId);
      }

      // Update LocalStorage cache
      const draftPayload = {
        id: activeDraftId,
        draftId: activeDraftId,
        status: 'draft',
        currentStep,
        formData,
        lastSaved: new Date().toISOString()
      };

      localStorage.setItem('marketplace_job_draft', JSON.stringify(draftPayload));

      const allDrafts = JSON.parse(localStorage.getItem('marketplace_client_drafts') || '[]');
      const existingIdx = allDrafts.findIndex(d => d.id === activeDraftId);
      
      let updatedDrafts;
      if (existingIdx >= 0) {
        updatedDrafts = [...allDrafts];
        updatedDrafts[existingIdx] = draftPayload;
      } else {
        updatedDrafts = [draftPayload, ...allDrafts];
      }
      localStorage.setItem('marketplace_client_drafts', JSON.stringify(updatedDrafts));

      setLastSavedTime(timeString);
      showToast(draftId ? `✓ Draft updated successfully at ${timeString}` : `✓ Draft saved successfully at ${timeString}`, 'success');
    } catch (e) {
      console.error('Save draft error:', e);
      showToast('Failed to save draft. Your data has been preserved, please try again.', 'error');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // PUBLISH JOB (Final Step)
  const handlePublishJob = async () => {
    const v = validateAllSteps();
    if (!v.isValid) {
      if (Object.keys(v.s1).length > 0) { setCurrentStep(1); setErrors(v.s1); }
      else if (Object.keys(v.s2).length > 0) { setCurrentStep(2); setErrors(v.s2); }
      else if (Object.keys(v.s3).length > 0) { setCurrentStep(3); setErrors(v.s3); }
      else if (Object.keys(v.s4).length > 0) { setCurrentStep(4); setErrors(v.s4); }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsPublishing(true);
    try {
      let createdJobId = draftId;

      const payload = {
        id: draftId && !draftId.startsWith('DRAFT-') ? draftId : undefined,
        title: formData.title,
        category: formData.category,
        subcategory: formData.subcategory || '',
        projectType: formData.projectType || 'ONE_TIME',
        description: formData.description,
        deliverables: (formData.deliverables || []).filter(d => (d || '').trim().length > 0),
        requirements: formData.specificRequirements || null,
        skills: formData.requiredSkills || [],
        experienceLevel: formData.experienceLevel || 'INTERMEDIATE',
        budget: formData.budgetType === 'FIXED' 
          ? (parseFloat(formData.fixedBudget) || 0) 
          : (parseFloat(formData.maximumBudget) || parseFloat(formData.minimumBudget) || 0),
        timeline: formData.deadlineType || '1_MONTH',
        attachmentUrls: (formData.uploadedFiles || []).map(f => f.url).filter(Boolean),
        externalLinks: (formData.cloudDriveLinks || []).filter(l => (l || '').trim().length > 0),
        referenceLinks: (formData.referenceWebsites || []).filter(w => (w || '').trim().length > 0),
        visibility: formData.visibility || 'PUBLIC',
        locationPreferences: formData.preferredLocationType === 'SPECIFIC_STATE' ? formData.preferredState : formData.preferredLocationType === 'SPECIFIC_CITY' ? formData.preferredCity : formData.preferredLocationType,
        languagePreferences: (formData.preferredLanguages || []).join(', '),
        screeningQuestions: (formData.screeningQuestions || []).filter(q => (q || '').trim().length > 0),
        currentStep: 7,
        status: 'OPEN',
        isOpen: true
      };

      if (token) {
        try {
          let res;
          if (draftId && !draftId.startsWith('DRAFT-')) {
            res = await axios.put(`http://localhost:5000/api/jobs/${draftId}`, payload, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } else {
            res = await axios.post('http://localhost:5000/api/jobs', payload, {
              headers: { Authorization: `Bearer ${token}` }
            });
          }
          const serverJob = res.data.job || res.data;
          if (serverJob && serverJob.id) {
            createdJobId = serverJob.id;
          }
        } catch (apiErr) {
          console.warn('Backend publish fallback to local:', apiErr);
        }
      }

      if (!createdJobId) {
        createdJobId = `JOB-${Date.now().toString().slice(-6)}`;
      }

      const publishedRecord = {
        id: createdJobId,
        title: formData.title,
        category: formData.category,
        subcategory: formData.subcategory,
        budget: getFormattedBudgetSummary(),
        createdAt: new Date().toISOString(),
        status: 'Active'
      };

      try {
        const existingJobs = JSON.parse(localStorage.getItem('marketplace_client_jobs') || '[]');
        localStorage.setItem('marketplace_client_jobs', JSON.stringify([publishedRecord, ...existingJobs]));
        
        localStorage.removeItem('marketplace_job_draft');
        if (draftId) {
          const allDrafts = JSON.parse(localStorage.getItem('marketplace_client_drafts') || '[]');
          localStorage.setItem('marketplace_client_drafts', JSON.stringify(allDrafts.filter(d => d.id !== draftId)));
        }
      } catch (e) {
        console.error('Error saving published job locally:', e);
      }

      setPublishedJobInfo(publishedRecord);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error publishing job:', err);
      showToast('Error publishing job. Please check all fields.', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleResetForNewJob = () => {
    setFormData(initialFormState);
    setCurrentStep(1);
    setDraftId('');
    setLastSavedTime(null);
    setPublishedJobInfo(null);
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white">Client Authentication Required</h2>
          <p className="text-slate-400 text-sm">You must be signed in to create and post student projects.</p>
        </div>
        <div className="flex justify-center gap-4 pt-2">
          <Link to="/login" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition shadow-lg shadow-indigo-500/25">
            Sign In to Account
          </Link>
          <Link to="/register" className="px-6 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-black rounded-xl transition">
            Create Client Account
          </Link>
        </div>
      </div>
    );
  }

  if (publishedJobInfo) {
    return (
      <div className="min-h-screen bg-[#030712] text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800 shadow-2xl text-center space-y-8 animate-fade-in">
          <div className="w-20 h-20 bg-emerald-500/15 border-2 border-emerald-500/30 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live on Marketplace</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Your job has been published successfully!</h1>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Eligible student freelancers can now discover your project brief and submit custom proposals.
            </p>
          </div>

          <div className="p-6 bg-slate-950/80 border border-slate-800 rounded-2xl text-left space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase">Job Title</div>
                <div className="text-base font-bold text-white mt-0.5">{publishedJobInfo.title}</div>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                #{publishedJobInfo.id}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-900 text-xs">
              <div>
                <span className="text-slate-500">Category: </span>
                <span className="text-slate-300 font-semibold">{publishedJobInfo.category}</span>
              </div>
              <div>
                <span className="text-slate-500">Budget: </span>
                <span className="text-emerald-400 font-semibold">{publishedJobInfo.budget}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Link to="/jobs" className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2">
              <span>View Job on Marketplace</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link to="/client/portal" className="px-6 py-3.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-black rounded-xl transition flex items-center justify-center gap-2">
              <span>Go to My Projects</span>
            </Link>
          </div>

          <div className="pt-2 border-t border-slate-900">
            <button
              type="button"
              onClick={handleResetForNewJob}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition"
            >
              + Post Another Job
            </button>
          </div>
        </div>
      </div>
    );
  }

  const availableSubcategories = formData.category
    ? Object.keys(CATEGORIES_DATA[formData.category] || {})
    : [];

  

  const filteredSkillSuggestions = ALL_SKILLS.filter(s =>
    s.toLowerCase().includes(skillSearchInput.toLowerCase().trim()) &&
    !formData.requiredSkills.includes(s)
  ).slice(0, 15);

  const getFormattedBudgetSummary = () => {
    if (formData.budgetType === 'FIXED') {
      return formData.fixedBudget ? `₹${Number(formData.fixedBudget).toLocaleString('en-IN')} (Fixed)` : 'Not set';
    }
    if (formData.minimumBudget && formData.maximumBudget) {
      return `₹${Number(formData.minimumBudget).toLocaleString('en-IN')} — ₹${Number(formData.maximumBudget).toLocaleString('en-IN')}`;
    }
    return 'Not set';
  };

  const getFormattedStartSummary = () => {
    if (formData.startPreference === 'SPECIFIC_DATE') {
      return formData.startDate ? new Date(formData.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Specific date';
    }
    const found = START_PREFERENCES.find(p => p.id === formData.startPreference);
    return found ? found.label : 'As soon as possible';
  };

  const getFormattedDeadlineSummary = () => {
    if (formData.deadlineType === 'SPECIFIC_DATE') {
      return formData.deadlineDate ? new Date(formData.deadlineDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Specific deadline';
    }
    const found = DEADLINE_TYPES.find(d => d.id === formData.deadlineType);
    return found ? found.label : 'Within 1 month';
  };

  const cleanDeliverables = (formData.deliverables || []).filter(d => (d || '').trim().length > 0);
  const cleanRefWebsites = (formData.referenceWebsites || []).filter(w => (w || '').trim().length > 0);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 py-8 px-4 sm:px-6 lg:px-8 relative">
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 transition-all transform duration-300 animate-bounce ${
          toastMessage.type === 'success' 
            ? 'bg-slate-900 border-emerald-500/40 text-emerald-300 shadow-emerald-950/50' 
            : 'bg-slate-900 border-red-500/40 text-red-300 shadow-red-950/50'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
          <span className="text-xs font-bold">{toastMessage.text}</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Client Project Hub</span>
              {draftId && (
                <span className="ml-2 px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] rounded-md font-mono">
                  Draft #{draftId}
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Post a Job</h1>
            <p className="text-sm text-slate-400 mt-1">Hire verified college talent, developers, and creators for your project.</p>
          </div>
          <div className="flex items-center gap-3">
            {lastSavedTime && (
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                Saved at {lastSavedTime}
              </span>
            )}
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-white text-xs font-bold rounded-xl flex items-center gap-2 transition shadow-sm disabled:opacity-50"
            >
              <Save className={`w-4 h-4 text-indigo-400 ${isSavingDraft ? 'animate-spin' : ''}`} />
              <span>{isSavingDraft ? 'Saving...' : 'Save Draft'}</span>
            </button>
          </div>
        </div>

        {/* Stepper */}
        <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <div className="md:hidden flex justify-between items-center text-xs font-bold">
            <span className="text-indigo-400 uppercase tracking-wider">Step {currentStep} of {STEPS.length}</span>
            <span className="text-white">{STEPS[currentStep - 1].label}</span>
          </div>
          <div className="hidden md:grid grid-cols-7 gap-2">
            {STEPS.map((step) => {
              const isCompleted = step.id < currentStep;
              const isCurrent = step.id === currentStep;
              const Icon = step.icon;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => { if (step.id < currentStep) setCurrentStep(step.id); }}
                  disabled={step.id > currentStep}
                  className={`flex flex-col items-center text-center p-2 rounded-2xl transition-all ${
                    isCurrent ? 'bg-indigo-600/20 border border-indigo-500/40 text-white' : isCompleted ? 'text-emerald-400 hover:bg-slate-900/60 cursor-pointer' : 'text-slate-600 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black mb-1.5 transition-all ${
                    isCurrent ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-400/50' : isCompleted ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' : 'bg-slate-950 border border-slate-800 text-slate-500'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[11px] font-bold tracking-tight ${isCurrent ? 'text-white' : isCompleted ? 'text-slate-300' : 'text-slate-500'}`}>
                    {step.name}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full transition-all duration-300 rounded-full" style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }} />
          </div>
        </div>

        {/* Step Body */}
        <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl space-y-8 min-h-[400px]">
          <div className="space-y-1">
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Step {currentStep}</div>
            <h2 className="text-2xl font-black text-white">{currentStep === 7 ? 'Review your job' : STEPS[currentStep - 1].label}</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {currentStep === 7 ? 'Make sure everything looks correct before publishing your project.' : STEPS[currentStep - 1].desc}
            </p>
          </div>

          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                    What do you need help with? <span className="text-pink-500">*</span>
                  </label>
                  <span className={`text-[11px] font-semibold ${formData.title.length > 100 ? 'text-red-400' : 'text-slate-500'}`}>{formData.title.length}/100</span>
                </div>
                <input
                  type="text"
                  maxLength={100}
                  value={formData.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  placeholder="e.g. Build a responsive e-commerce website"
                  className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl text-sm text-white outline-none transition"
                />
                {errors.title && <p className="text-xs text-red-400 font-semibold">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300">Category <span className="text-pink-500">*</span></label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleFieldChange('category', e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white outline-none focus:border-indigo-500"
                  >
                    <option value="">Select a category...</option>
                    {Object.keys(CATEGORIES_DATA).map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                  </select>
                  {errors.category && <p className="text-xs text-red-400 font-semibold">{errors.category}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300">Subcategory <span className="text-pink-500">*</span></label>
                  <select
                    value={formData.subcategory}
                    disabled={!formData.category}
                    onChange={(e) => handleFieldChange('subcategory', e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">{!formData.category ? 'Select a category first...' : 'Select a subcategory...'}</option>
                    {availableSubcategories.map(sub => (<option key={sub} value={sub}>{sub}</option>))}
                  </select>
                  {errors.subcategory && <p className="text-xs text-red-400 font-semibold">{errors.subcategory}</p>}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300">What type of project is this? <span className="text-pink-500">*</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'ONE_TIME', title: 'One-time project', desc: 'Find a student for a specific project or task with clear deliverables', icon: Clock },
                    { id: 'ONGOING', title: 'Ongoing work', desc: 'Hire a student on a recurring or long-term basis for ongoing support', icon: Repeat }
                  ].map(type => {
                    const isSelected = formData.projectType === type.id;
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleFieldChange('projectType', type.id)}
                        className={`p-5 rounded-2xl text-left border transition-all flex items-start gap-4 ${
                          isSelected ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-500/50' : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl border mt-0.5 ${isSelected ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 border-slate-800 text-slate-500'}`}><Icon className="w-5 h-5" /></div>
                        <div><div className="text-sm font-bold text-white">{type.title}</div><div className="text-xs text-slate-400">{type.desc}</div></div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300">Describe your project <span className="text-pink-500">*</span></label>
                  <span className={`text-[11px] font-semibold ${formData.description.length > 3000 ? 'text-red-400' : 'text-slate-500'}`}>{formData.description.length}/3000</span>
                </div>
                {/* 
                  FIX APPLIED: Added ref={descriptionRef} 
                  Added adjustHeight function to onChange
                  Added classes: overflow-hidden resize-none min-h-[120px] 
                */}
                <textarea
                  ref={descriptionRef}
                  rows={4}
                  maxLength={3000}
                  value={formData.description}
                  onChange={(e) => {
                    handleFieldChange('description', e.target.value);
                    adjustHeight(descriptionRef);
                  }}
                  placeholder="Tell freelancers what you need, what you are trying to achieve, and what the final result should look like."
                  className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl text-sm text-white outline-none transition overflow-hidden resize-none min-h-[120px]"
                />
                {errors.description && <p className="text-xs text-red-400 font-semibold">{errors.description}</p>}
              </div>

              <div className="p-6 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-4">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300">What should the freelancer deliver? <span className="text-pink-500">*</span></label>
                <div className="space-y-3">
                  {formData.deliverables.map((deliverable, index) => (
                    <div key={index} className="flex items-center gap-3">
                      {/* FIX APPLIED: Added maxLength={150} */}
                      <input
                        type="text"
                        maxLength={150}
                        value={deliverable}
                        onChange={(e) => handleDeliverableChange(index, e.target.value)}
                        placeholder={`e.g. ${index === 0 ? 'Responsive website' : index === 1 ? 'Source code repository' : 'Deployment'}`}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-indigo-500"
                      />
                      {formData.deliverables.length > 1 && (
                        <button type="button" onClick={() => handleRemoveDeliverable(index)} className="p-3 bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl border border-slate-800"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={handleAddDeliverable} className="px-4 py-2.5 bg-slate-900 border border-slate-800 text-indigo-400 text-xs font-bold rounded-xl flex items-center gap-2"><Plus className="w-4 h-4" /><span>Add deliverable</span></button>
                {errors.deliverables && <p className="text-xs text-red-400 font-semibold">{errors.deliverables}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300">Are there any specific requirements? <span className="text-xs text-slate-500 font-medium">(Optional)</span></label>
                  <span className={`text-[11px] font-semibold ${(formData.specificRequirements || '').length >= 300 ? 'text-red-400' : 'text-slate-500'}`}>{(formData.specificRequirements || '').length}/300</span>
                </div>
                {/* 
                  FIX APPLIED: Added ref={requirementsRef} 
                  Added adjustHeight function to onChange
                  Added classes: overflow-hidden resize-none min-h-[90px] 
                  Updated Placeholder and Max Length
                */}
                <textarea 
                  ref={requirementsRef}
                  rows={3} 
                  maxLength={300}
                  value={formData.specificRequirements} 
                  onChange={(e) => {
                    handleFieldChange('specificRequirements', e.target.value);
                    adjustHeight(requirementsRef);
                  }} 
                  placeholder="Describe technology requirements, technical constraints, design guidelines... (Max 300 characters)" 
                  className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white outline-none focus:border-indigo-500 overflow-hidden resize-none min-h-[90px]" 
                />
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-300">What skills should the freelancer have? <span className="text-pink-500">*</span></label>
                    <p className="text-xs text-slate-500">Select up to 10 key technologies or capabilities.</p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">{formData.requiredSkills.length}/10 selected</span>
                </div>

                <div className="min-h-[52px] p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-wrap items-center gap-2">
                  {formData.requiredSkills.length > 0 ? (
                    formData.requiredSkills.map(skill => (
                      <span key={skill} className="px-3 py-1.5 bg-indigo-600/20 border border-indigo-500/40 text-indigo-200 text-xs font-bold rounded-xl flex items-center gap-2">
                        <span>{skill}</span>
                        <button type="button" onClick={() => handleRemoveSkill(skill)}><X className="w-3.5 h-3.5" /></button>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-600 italic px-2">No skills selected yet. Search below.</span>
                  )}
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={skillSearchInput}
                    onFocus={() => setShowSkillDropdown(true)}
                    onChange={(e) => { setSkillSearchInput(e.target.value); setShowSkillDropdown(true); }}
                    onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ',') && skillSearchInput.trim()) { e.preventDefault(); handleAddSkill(skillSearchInput); } }}
                    placeholder="Search skills (e.g. React, Python, Figma, Tailwind, Node.js)..."
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white outline-none focus:border-indigo-500"
                  />
                  {showSkillDropdown && skillSearchInput.trim() && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-60 overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 space-y-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {filteredSkillSuggestions.length > 0 ? (
                        filteredSkillSuggestions.map(skill => (
                          <button key={skill} type="button" onClick={() => handleAddSkill(skill)} className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-200 hover:bg-indigo-600/30 flex justify-between items-center gap-3">
                            <span className="whitespace-normal break-words text-left">{skill}</span>
                            <Plus className="w-4 h-4 text-indigo-400 shrink-0" />
                          </button>
                        ))
                      ) : (
                        <div className="px-3.5 py-3 text-xs text-slate-400 text-center italic">
                          No skills found for "{skillSearchInput}".
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {errors.requiredSkills && <p className="text-xs text-red-400 font-semibold">{errors.requiredSkills}</p>}
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300">What level of freelancer are you looking for?</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {EXPERIENCE_LEVELS.map(lvl => {
                    const isSelected = formData.experienceLevel === lvl.id;
                    const Icon = lvl.icon;
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => handleFieldChange('experienceLevel', lvl.id)}
                        className={`p-5 rounded-2xl text-left border transition-all flex items-start gap-4 ${
                          isSelected ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-500/50' : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl border mt-0.5 ${isSelected ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 border-slate-800 text-slate-500'}`}><Icon className="w-5 h-5" /></div>
                        <div><div className="text-sm font-bold text-white">{lvl.title}</div><div className="text-xs text-slate-400">{lvl.desc}</div></div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {currentStep === 4 && (
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300">What's your budget for this project? (INR ₹) <span className="text-pink-500">*</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'RANGE', title: 'Budget Range (Recommended)', desc: 'Set a flexible minimum and maximum amount in INR ₹.', icon: TrendingUp },
                    { id: 'FIXED', title: 'Fixed Budget', desc: 'Set a specific total amount available for the project in INR ₹.', icon: IndianRupee }
                  ].map(type => {
                    const isSelected = formData.budgetType === type.id;
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleFieldChange('budgetType', type.id)}
                        className={`p-5 rounded-2xl text-left border transition-all flex items-start gap-4 ${
                          isSelected ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-500/50' : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl border mt-0.5 ${isSelected ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 border-slate-800 text-slate-500'}`}><Icon className="w-5 h-5" /></div>
                        <div><div className="text-sm font-bold text-white">{type.title}</div><div className="text-xs text-slate-400">{type.desc}</div></div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-4">
                {formData.budgetType === 'FIXED' ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-300">Total Project Budget <span className="text-pink-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
                      <input type="number" min="1" value={formData.fixedBudget} onChange={(e) => handleFieldChange('fixedBudget', e.target.value)} placeholder="10,000" className="w-full pl-8 pr-4 py-3.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-indigo-500" />
                    </div>
                    {errors.fixedBudget && <p className="text-xs text-red-400 font-semibold">{errors.fixedBudget}</p>}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-300">Minimum Budget <span className="text-pink-500">*</span></label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
                        <input type="number" min="1" value={formData.minimumBudget} onChange={(e) => handleFieldChange('minimumBudget', e.target.value)} placeholder="5,000" className="w-full pl-8 pr-4 py-3.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-indigo-500" />
                      </div>
                      {errors.minimumBudget && <p className="text-xs text-red-400 font-semibold">{errors.minimumBudget}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-300">Maximum Budget <span className="text-pink-500">*</span></label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
                        <input type="number" min="1" value={formData.maximumBudget} onChange={(e) => handleFieldChange('maximumBudget', e.target.value)} placeholder="15,000" className="w-full pl-8 pr-4 py-3.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-indigo-500" />
                      </div>
                      {errors.maximumBudget && <p className="text-xs text-red-400 font-semibold">{errors.maximumBudget}</p>}
                    </div>
                  </div>
                )}
                <div className="p-4 bg-indigo-950/30 border border-indigo-500/20 rounded-xl flex items-start gap-3 mt-4">
                  <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-indigo-200">Not sure about the right budget?</div>
                    <p className="text-xs text-slate-400">Freelancers will review your project requirements and submit proposals based on the work involved.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-800">
                <div className="space-y-3">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300">When should the freelancer start?</label>
                  <select value={formData.startPreference} onChange={(e) => handleFieldChange('startPreference', e.target.value)} className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white outline-none focus:border-indigo-500">
                    {START_PREFERENCES.map(pref => (<option key={pref.id} value={pref.id}>{pref.label}</option>))}
                  </select>
                  {formData.startPreference === 'SPECIFIC_DATE' && (
                    <input type="date" min={todayDateString} value={formData.startDate} onChange={(e) => handleFieldChange('startDate', e.target.value)} className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-indigo-500" />
                  )}
                  {errors.startDate && <p className="text-xs text-red-400 font-semibold">{errors.startDate}</p>}
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300">When should the project be completed?</label>
                  <select value={formData.deadlineType} onChange={(e) => handleFieldChange('deadlineType', e.target.value)} className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white outline-none focus:border-indigo-500">
                    {DEADLINE_TYPES.map(type => (<option key={type.id} value={type.id}>{type.label}</option>))}
                  </select>
                  {formData.deadlineType === 'SPECIFIC_DATE' && (
                    <input type="date" min={formData.startDate || todayDateString} value={formData.deadlineDate} onChange={(e) => handleFieldChange('deadlineDate', e.target.value)} className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-indigo-500" />
                  )}
                  {errors.deadlineDate && <p className="text-xs text-red-400 font-semibold">{errors.deadlineDate}</p>}
                </div>
              </div>

              <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-400" /><span>Timeline & Budget Summary</span></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-900">
                  <div><div className="text-[11px] text-slate-500 uppercase">Estimated Budget</div><div className="text-sm font-bold text-emerald-400 mt-0.5">{getFormattedBudgetSummary()}</div></div>
                  <div><div className="text-[11px] text-slate-500 uppercase">Expected Start</div><div className="text-sm font-bold text-white mt-0.5">{getFormattedStartSummary()}</div></div>
                  <div><div className="text-[11px] text-slate-500 uppercase">Project Deadline</div><div className="text-sm font-bold text-indigo-300 mt-0.5">{getFormattedDeadlineSummary()}</div></div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {currentStep === 5 && (
            <div className="space-y-8">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                    Add project files <span className="text-xs text-slate-500 font-medium normal-case">(Optional, max 500 MB per file)</span>
                  </label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upload documents, images, designs, requirements, or other files that will help freelancers understand your project.
                  </p>
                </div>

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleFilesSelected(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className={`p-8 border-2 border-dashed rounded-3xl text-center space-y-3 cursor-pointer transition-all ${
                    isDraggingFile ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]' : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-900/40'
                  }`}
                >
                  <input type="file" ref={fileInputRef} multiple onChange={(e) => { if (e.target.files) handleFilesSelected(e.target.files); }} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.zip,.txt" className="hidden" />
                  <div className="w-14 h-14 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg"><UploadCloud className="w-7 h-7" /></div>
                  <div><div className="text-sm font-bold text-white">Drag & drop files here</div><div className="text-xs text-slate-400 mt-0.5">or <span className="text-indigo-400 font-bold hover:underline">browse files</span> from your device</div></div>
                  <div className="text-[11px] text-slate-500">Supported: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, PNG, JPG, ZIP, TXT (up to 500 MB)</div>
                </div>
                {fileError && <p className="text-xs text-red-400 font-semibold mt-1">{fileError}</p>}

                {formData.uploadedFiles.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attached Files ({formData.uploadedFiles.length})</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {formData.uploadedFiles.map(file => (
                        <div key={file.id} className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 shrink-0"><File className="w-4 h-4" /></div>
                            <div className="min-w-0"><div className="text-xs font-bold text-white truncate">{file.name}</div><div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5"><span>{formatFileSize(file.size)}</span><span className="text-emerald-400 font-semibold">Uploaded</span></div></div>
                          </div>
                          <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveFile(file.id); }} className="p-2 text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-4">
                <div><label className="block text-xs font-black uppercase tracking-wider text-slate-300">Have a larger file? <span className="text-xs text-slate-500 font-medium normal-case">(Cloud Drive Link)</span></label><p className="text-xs text-slate-500 mt-0.5">Upload large files (over 500 MB) to Google Drive, Dropbox, or OneDrive and share the link here.</p></div>
                <div className="flex items-center gap-3">
                  <input type="url" value={cloudLinkInput} onChange={(e) => setCloudLinkInput(e.target.value)} placeholder="https://drive.google.com/... or https://dropbox.com/..." className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-indigo-500" />
                  <button type="button" onClick={handleAddCloudLink} className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition shadow-lg shadow-indigo-500/25 shrink-0">+ Add Link</button>
                </div>
                {formData.cloudDriveLinks.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-900">
                    {formData.cloudDriveLinks.map((link, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-xl"><span className="text-xs text-indigo-300 truncate">{link}</span><button type="button" onClick={() => handleRemoveCloudLink(idx)} className="text-slate-500 hover:text-red-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button></div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-4">
                <div><label className="block text-xs font-black uppercase tracking-wider text-slate-300">Reference Websites <span className="text-xs text-slate-500 font-medium normal-case">(Optional)</span></label><p className="text-xs text-slate-500 mt-0.5">Share websites or online examples that show what you want.</p></div>
                <div className="space-y-3">
                  {formData.referenceWebsites.map((website, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <input type="url" value={website} onChange={(e) => handleReferenceWebsiteChange(index, e.target.value)} placeholder="https://example.com" className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-indigo-500" />
                      {formData.referenceWebsites.length > 1 && (<button type="button" onClick={() => handleRemoveReferenceWebsite(index)} className="p-3 bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl border border-slate-800"><Trash2 className="w-4 h-4" /></button>)}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={handleAddReferenceWebsite} className="px-4 py-2.5 bg-slate-900 border border-slate-800 text-indigo-400 text-xs font-bold rounded-xl flex items-center gap-2 hover:border-indigo-500/40"><Plus className="w-4 h-4" /><span>Add another link</span></button>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-start gap-3">
                <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-400 leading-relaxed"><strong className="text-slate-200">File Privacy:</strong> Files and references attached to this job posting may be visible to verified student freelancers who view your project brief.</p>
              </div>
            </div>
          )}

          {/* STEP 6 */}
          {currentStep === 6 && (
            <div className="space-y-8">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300">Who should be able to see this job?</label>
                  <p className="text-xs text-slate-500 mt-0.5">Choose who can view your project brief and submit proposals.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'PUBLIC', title: 'Public Marketplace', badge: 'Recommended', desc: 'Any eligible freelancer on SkillLaunch can view this job and submit a proposal.', icon: Eye },
                    { id: 'PRIVATE', title: 'Private / Invite Only', badge: 'Confidential', desc: 'Only freelancers you directly invite can view and access this job.', icon: EyeOff }
                  ].map(vis => {
                    const isSelected = formData.visibility === vis.id;
                    const Icon = vis.icon;
                    return (
                      <button
                        key={vis.id}
                        type="button"
                        onClick={() => handleFieldChange('visibility', vis.id)}
                        className={`p-5 rounded-2xl text-left border transition-all flex items-start gap-4 ${
                          isSelected ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-500/50' : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl border mt-0.5 shrink-0 ${isSelected ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 border-slate-800 text-slate-500'}`}><Icon className="w-5 h-5" /></div>
                        <div><div className="flex items-center gap-2"><span className="text-sm font-bold text-white">{vis.title}</span><span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${isSelected ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-900 text-slate-500'}`}>{vis.badge}</span></div><p className="text-xs text-slate-400 leading-relaxed">{vis.desc}</p></div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-400" /><label className="block text-xs font-black uppercase tracking-wider text-slate-300">Do you have a preferred freelancer location?</label></div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'ANYWHERE_INDIA', label: 'Anywhere in India' },
                    { id: 'SPECIFIC_STATE', label: 'Specific State' },
                    { id: 'SPECIFIC_CITY', label: 'Specific City' },
                    { id: 'NO_PREFERENCE', label: 'No Preference' }
                  ].map(loc => {
                    const isSelected = formData.preferredLocationType === loc.id;
                    return (
                      <button key={loc.id} type="button" onClick={() => handleFieldChange('preferredLocationType', loc.id)} className={`p-3 rounded-xl border text-center transition-all ${isSelected ? 'bg-indigo-600 text-white font-bold border-indigo-500 shadow-md' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}><span className="text-xs">{loc.label}</span></button>
                    );
                  })}
                </div>
                {formData.preferredLocationType === 'SPECIFIC_STATE' && (
                  <select value={formData.preferredState} onChange={(e) => handleFieldChange('preferredState', e.target.value)} className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-indigo-500">
                    <option value="">Select a state...</option>
                    {INDIAN_STATES.map(st => (<option key={st} value={st}>{st}</option>))}
                  </select>
                )}
                {formData.preferredLocationType === 'SPECIFIC_CITY' && (
                  <input type="text" value={formData.preferredCity} onChange={(e) => handleFieldChange('preferredCity', e.target.value)} placeholder="e.g. Hyderabad, Bengaluru, Mumbai, Delhi..." className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-indigo-500" />
                )}
              </div>

              <div className="p-6 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center gap-2"><Languages className="w-4 h-4 text-indigo-400" /><label className="block text-xs font-black uppercase tracking-wider text-slate-300">Preferred communication language</label></div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {INDIAN_LANGUAGES.map(lang => {
                    const isSelected = formData.preferredLanguages.includes(lang);
                    return (
                      <button key={lang} type="button" onClick={() => handleToggleLanguage(lang)} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${isSelected ? 'bg-indigo-600/25 border-indigo-500 text-indigo-200 shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}>
                        {isSelected && <span className="mr-1.5">✓</span>}{lang}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-indigo-400" /><label className="block text-xs font-black uppercase tracking-wider text-slate-300">Want to ask applicants a few questions? <span className="text-xs text-slate-500 font-medium">(Optional, max 5)</span></label></div>
                  <span className="text-[11px] font-semibold text-slate-500">{formData.screeningQuestions.length}/5</span>
                </div>
                {formData.screeningQuestions.map((q, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-indigo-400 w-5">Q{index + 1}</span>
                    <input type="text" value={q} onChange={(e) => handleScreeningQuestionChange(index, e.target.value)} placeholder="e.g. Have you worked on a similar project before?" className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-indigo-500" />
                    <button type="button" onClick={() => handleRemoveScreeningQuestion(index)} className="p-3 bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl border border-slate-800"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                {formData.screeningQuestions.length < 5 && (
                  <button type="button" onClick={handleAddScreeningQuestion} className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-indigo-400 text-xs font-bold rounded-xl flex items-center gap-2 transition"><Plus className="w-4 h-4" /><span>Add Question</span></button>
                )}
              </div>

              <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20"><FileCheck className="w-5 h-5" /></div>
                  <div><div className="text-sm font-bold text-white">Require Non-Disclosure Agreement (NDA)</div><div className="text-xs text-slate-400">Freelancers must sign standard confidentiality before viewing proprietary project files.</div></div>
                </div>
                <input type="checkbox" checked={formData.ndaRequired} onChange={(e) => handleFieldChange('ndaRequired', e.target.checked)} className="w-5 h-5 accent-indigo-600 rounded cursor-pointer" />
              </div>
            </div>
          )}

          {/* STEP 7 */}
          {currentStep === 7 && (
            <div className="space-y-8">
              {/* Section 1 Review */}
              <div className="p-6 bg-slate-950/70 border border-slate-800 rounded-3xl space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-850">
                  <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-indigo-400" /><span className="text-xs font-bold uppercase tracking-wider text-indigo-300">1. Basic Information</span></div>
                  <button type="button" onClick={() => setCurrentStep(1)} className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/40 text-indigo-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"><Edit3 className="w-3.5 h-3.5" /><span>Edit</span></button>
                </div>
                <div className="space-y-3">
                  <div><div className="text-[11px] font-bold text-slate-500 uppercase">Project Title</div><div className="text-base font-bold text-white mt-0.5">{formData.title || 'Untitled Project'}</div></div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div><div className="text-[11px] font-bold text-slate-500 uppercase">Category</div><div className="text-xs font-semibold text-slate-200 mt-0.5">{formData.category || 'Not specified'}</div></div>
                    <div><div className="text-[11px] font-bold text-slate-500 uppercase">Subcategory</div><div className="text-xs font-semibold text-slate-200 mt-0.5">{formData.subcategory || 'Not specified'}</div></div>
                    <div><div className="text-[11px] font-bold text-slate-500 uppercase">Project Type</div><div className="text-xs font-semibold text-slate-200 mt-0.5">{formData.projectType === 'ONE_TIME' ? 'One-time project' : 'Ongoing work'}</div></div>
                  </div>
                </div>
              </div>

              {/* Section 2 Review */}
              <div className="p-6 bg-slate-950/70 border border-slate-800 rounded-3xl space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-850">
                  <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-400" /><span className="text-xs font-bold uppercase tracking-wider text-indigo-300">2. Project Description & Deliverables</span></div>
                  <button type="button" onClick={() => setCurrentStep(2)} className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/40 text-indigo-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"><Edit3 className="w-3.5 h-3.5" /><span>Edit</span></button>
                </div>
                <div className="space-y-4">
                  <div><div className="text-[11px] font-bold text-slate-500 uppercase mb-1">Description</div><p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">{formData.description || 'No description provided.'}</p></div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase mb-1.5">Expected Deliverables ({cleanDeliverables.length})</div>
                    <ul className="space-y-1.5">
                      {cleanDeliverables.map((deliv, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-slate-300"><span className="text-emerald-400 font-bold">✓</span><span>{deliv}</span></li>
                      ))}
                    </ul>
                  </div>
                  {formData.specificRequirements && (
                    <div className="pt-2 border-t border-slate-900"><div className="text-[11px] font-bold text-slate-500 uppercase mb-1">Specific Requirements</div><p className="text-xs text-slate-400 leading-relaxed">{formData.specificRequirements}</p></div>
                  )}
                </div>
              </div>

              {/* Section 3 Review */}
              <div className="p-6 bg-slate-950/70 border border-slate-800 rounded-3xl space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-850">
                  <div className="flex items-center gap-2"><Layers className="w-4 h-4 text-indigo-400" /><span className="text-xs font-bold uppercase tracking-wider text-indigo-300">3. Skills & Experience</span></div>
                  <button type="button" onClick={() => setCurrentStep(3)} className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/40 text-indigo-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"><Edit3 className="w-3.5 h-3.5" /><span>Edit</span></button>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase mb-1.5">Required Skills ({formData.requiredSkills.length})</div>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.requiredSkills.map(s => (<span key={s} className="px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 text-indigo-200 text-xs font-bold rounded-lg">{s}</span>))}
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="text-[11px] font-bold text-slate-500 uppercase">Target Experience Level</div>
                    <div className="text-xs font-bold text-white mt-0.5">{EXPERIENCE_LEVELS.find(l => l.id === formData.experienceLevel)?.title || 'Intermediate'}</div>
                  </div>
                </div>
              </div>

              {/* Section 4 Review */}
              <div className="p-6 bg-slate-950/70 border border-slate-800 rounded-3xl space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-850">
                  <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-indigo-400" /><span className="text-xs font-bold uppercase tracking-wider text-indigo-300">4. Budget & Timeline (INR ₹)</span></div>
                  <button type="button" onClick={() => setCurrentStep(4)} className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/40 text-indigo-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"><Edit3 className="w-3.5 h-3.5" /><span>Edit</span></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800"><div className="text-[11px] font-bold text-slate-500 uppercase">Project Budget</div><div className="text-base font-bold text-emerald-400 mt-1">{getFormattedBudgetSummary()}</div></div>
                  <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800"><div className="text-[11px] font-bold text-slate-500 uppercase">Expected Start</div><div className="text-sm font-bold text-white mt-1">{getFormattedStartSummary()}</div></div>
                  <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800"><div className="text-[11px] font-bold text-slate-500 uppercase">Project Deadline</div><div className="text-sm font-bold text-indigo-300 mt-1">{getFormattedDeadlineSummary()}</div></div>
                </div>
              </div>

              {/* Section 5 Review */}
              <div className="p-6 bg-slate-950/70 border border-slate-800 rounded-3xl space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-850">
                  <div className="flex items-center gap-2"><Paperclip className="w-4 h-4 text-indigo-400" /><span className="text-xs font-bold uppercase tracking-wider text-indigo-300">5. Files & References</span></div>
                  <button type="button" onClick={() => setCurrentStep(5)} className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/40 text-indigo-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"><Edit3 className="w-3.5 h-3.5" /><span>Edit</span></button>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase mb-1">Attached Files ({formData.uploadedFiles.length})</div>
                    {formData.uploadedFiles.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {formData.uploadedFiles.map(f => (
                          <span key={f.id} className="px-3 py-1 bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg flex items-center gap-1.5">
                            <File className="w-3.5 h-3.5 text-indigo-400" /><span>{f.name}</span><span className="text-slate-500">({formatFileSize(f.size)})</span>
                          </span>
                        ))}
                      </div>
                    ) : (<span className="text-xs text-slate-500 italic">No native files attached.</span>)}
                  </div>
                  {formData.cloudDriveLinks.length > 0 && (
                    <div><div className="text-[11px] font-bold text-slate-500 uppercase mb-1">Cloud Storage Links ({formData.cloudDriveLinks.length})</div>
                      <div className="space-y-1">{formData.cloudDriveLinks.map((link, idx) => (<div key={idx} className="text-xs text-indigo-400 truncate flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /><span>{link}</span></div>))}</div>
                    </div>
                  )}
                  {cleanRefWebsites.length > 0 && (
                    <div><div className="text-[11px] font-bold text-slate-500 uppercase mb-1">Reference Websites ({cleanRefWebsites.length})</div>
                      <div className="space-y-1">{cleanRefWebsites.map((web, idx) => (<div key={idx} className="text-xs text-slate-300 truncate flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-slate-500" /><span>{web}</span></div>))}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 6 Review */}
              <div className="p-6 bg-slate-950/70 border border-slate-800 rounded-3xl space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-850">
                  <div className="flex items-center gap-2"><Sliders className="w-4 h-4 text-indigo-400" /><span className="text-xs font-bold uppercase tracking-wider text-indigo-300">6. Additional Options & Visibility</span></div>
                  <button type="button" onClick={() => setCurrentStep(6)} className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/40 text-indigo-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"><Edit3 className="w-3.5 h-3.5" /><span>Edit</span></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div><div className="text-[11px] font-bold text-slate-500 uppercase">Visibility</div><div className="text-xs font-bold text-white mt-0.5">{formData.visibility === 'PUBLIC' ? 'Public Marketplace' : 'Private / Invite Only'}</div></div>
                  <div><div className="text-[11px] font-bold text-slate-500 uppercase">Location Preference</div><div className="text-xs font-bold text-white mt-0.5">{formData.preferredLocationType === 'ANYWHERE_INDIA' ? 'Anywhere in India' : formData.preferredLocationType === 'SPECIFIC_STATE' ? formData.preferredState : formData.preferredLocationType === 'SPECIFIC_CITY' ? formData.preferredCity : 'No Preference'}</div></div>
                  <div><div className="text-[11px] font-bold text-slate-500 uppercase">Languages</div><div className="text-xs font-bold text-white mt-0.5">{formData.preferredLanguages.join(', ')}</div></div>
                </div>
                {formData.screeningQuestions.length > 0 && (
                  <div className="pt-2 border-t border-slate-900"><div className="text-[11px] font-bold text-slate-500 uppercase mb-1.5">Screening Questions ({formData.screeningQuestions.length})</div><ul className="space-y-1">{formData.screeningQuestions.map((q, idx) => (<li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5"><span className="text-indigo-400 font-bold">Q{idx + 1}:</span><span>{q}</span></li>))}</ul></div>
                )}
                {formData.ndaRequired && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold pt-1"><FileCheck className="w-4 h-4" /><span>Requires signed Non-Disclosure Agreement (NDA)</span></div>
                )}
              </div>

              {/* Section 7 Notice */}
              <div className="p-5 bg-indigo-950/30 border border-slate-800 border border-indigo-500/20 rounded-2xl flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-white">Publishing Policy:</strong> Once published, eligible freelancers will be able to view your project brief and submit proposals. You can manage submissions from your Client Portal.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-800">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full sm:w-auto px-6 py-3 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-black rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {currentStep < STEPS.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isPublishing}
                  onClick={handlePublishJob}
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isPublishing ? 'Publishing Job...' : 'Publish Job'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
