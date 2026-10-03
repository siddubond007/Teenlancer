import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Wallet, User, Users, CheckCircle2, Calendar, LayoutTemplate, Paperclip, ExternalLink, Globe, Clock3, MapPin, Languages, ShieldCheck, Bookmark, Share2 } from 'lucide-react';
import API from '../services/api';

export default function PublicJobDetailsPage({ currentUser }) {
  const { jobId } = useParams();
  const location = useLocation();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [bidAmount, setBidAmount] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [proposalText, setProposalText] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  
  const bidFormRef = useRef(null);

  useEffect(() => {
    API.get(`/jobs/public/${jobId}`)
      .then((res) => setJob(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [jobId]);

  // Auto-scroll if the user arrives from the marketplace with the #bid-form hash
  useEffect(() => {
    if (job && location.hash === '#bid-form' && bidFormRef.current) {
      setTimeout(() => {
        bidFormRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, [job, location.hash]);

  const scrollToBidForm = (e) => {
    e.preventDefault();
    bidFormRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    if (proposalText.length < 100) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await API.post(`/jobs/${jobId}/bid`, {
        proposedAmount: Number(bidAmount),
        deliveryDays: Number(deliveryDays),
        coverLetter: proposalText + (portfolioLink ? `\n\nPortfolio: ${portfolioLink}` : '')
      });

      setToastMessage({
        text: response.data?.message || 'Proposal submitted successfully!',
        type: 'success'
      });
      
      // Clear form on success
      setProposalText('');
      setBidAmount('');
      setDeliveryDays('');
      setPortfolioLink('');
      
      // Refresh the job data so the proposal count updates
      const refreshedJob = await API.get(`/jobs/public/${jobId}`);
      setJob(refreshedJob.data);
      
    } catch (error) {
      console.error('Bid Error:', error);
      setToastMessage({
        text: error.response?.data?.error || 'Failed to submit bid. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

const formatEnumLabel = (value, fallback = 'Not specified') => {
  if (!value) return fallback;
  return String(value)
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
};

const projectTypeLabel = formatEnumLabel(job?.projectType, 'One-time project');
const timelineLabel = formatEnumLabel(job?.timeline, 'Flexible');
const startLabel = job?.startPreference === 'SPECIFIC_DATE' && job?.startDate
  ? new Date(job.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  : formatEnumLabel(job?.startPreference, 'As soon as possible');
const locationLabel = job?.locationPreferences || 'Anywhere in India';
const languagesLabel = job?.languagePreferences || 'English';
const postedLabel = job?.createdAt
  ? new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  : 'Recently';

const handleShareProject = async () => {
  try {
    if (navigator.share) {
      await navigator.share({
        title: job.title,
        text: 'Check out this project on SkillLaunch',
        url: window.location.href
      });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      setToastMessage({ text: 'Project link copied to clipboard.', type: 'success' });
    }
  } catch (error) {
    if (error?.name !== 'AbortError') {
      setToastMessage({ text: 'Unable to share this project right now.', type: 'error' });
    }
  }
};

const formatDate = (value) => {
  if (!value) return 'Not specified';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not specified';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const budgetTypeLabel = formatEnumLabel(job?.budgetType, 'Budget');
const budgetSummary = String(job?.budgetType || '').toUpperCase() === 'FIXED'
  ? `${job?.currency || 'INR'} ${Number(job?.fixedBudget ?? job?.budget ?? 0).toLocaleString('en-IN')}`
  : job?.minimumBudget != null && job?.maximumBudget != null
    ? `${job?.currency || 'INR'} ${Number(job?.minimumBudget).toLocaleString('en-IN')} - ${Number(job?.maximumBudget).toLocaleString('en-IN')}`
    : `${job?.currency || 'INR'} ${Number(job?.budget ?? 0).toLocaleString('en-IN')}`;

const startSummary = job?.startPreference === 'SPECIFIC_DATE'
  ? formatDate(job?.startDate)
  : startLabel;

const deadlineSummary = job?.deadlineType === 'SPECIFIC_DATE'
  ? formatDate(job?.deadlineDate)
  : formatEnumLabel(job?.deadlineType || job?.timeline, 'Flexible');

const locationParts = [job?.preferredState, job?.preferredCity].filter(Boolean);
const displayLocation = locationParts.length
  ? locationParts.join(', ')
  : (job?.locationPreferences || 'Anywhere in India');

const displayLanguages = Array.isArray(job?.preferredLanguages) && job?.preferredLanguages.length
  ? job?.preferredLanguages.join(', ')
  : (job?.languagePreferences || 'English');

const parsedBidAmount = Number(bidAmount);
const estimatedPlatformFee = Number.isFinite(parsedBidAmount) && parsedBidAmount > 0
  ? Number((parsedBidAmount * 0.10).toFixed(2))
  : 0;
const estimatedEarnings = Number.isFinite(parsedBidAmount) && parsedBidAmount > 0
  ? Number((parsedBidAmount - estimatedPlatformFee).toFixed(2))
  : 0;
const expectedCompletionDate = Number(deliveryDays) > 0
  ? (() => {
      const d = new Date();
      d.setDate(d.getDate() + Number(deliveryDays));
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    })()
  : null;


  if (loading) {
  return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <div className="text-slate-400 font-medium tracking-wide">Loading enterprise details...</div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-center">
        <div className="bg-white/5 border border-white/10 backdrop-blur-md p-8 rounded-3xl">
          <h2 className="text-2xl font-bold text-gray-200">Project not found</h2>
          <Link to="/jobs" className="mt-4 inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors">
            <ArrowLeft size={16} /> Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 text-gray-200">
      
      {/* Back Navigation */}
      <Link to="/jobs" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium">
        <ArrowLeft size={16} /> Back to Feed
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Primary Narrative Column */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Hero Glass Panel */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-3xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-wide uppercase">
                {job.category || 'General'}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs tracking-wide uppercase">
                {job.experienceLevel || 'INTERMEDIATE'}
              </span>
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
                {projectTypeLabel}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs">
                <Calendar size={12} /> {timelineLabel}
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
                {job.status === 'OPEN' && job.isOpen ? 'Accepting proposals' : formatEnumLabel(job.status)}
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
              <div className="min-w-0">
                <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4">
                  {job.title}
                </h1>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">{job.category || 'General'}</span>
                  {job.subcategory && (
                    <>
                      <span className="text-slate-700">/</span>
                      <span>{job.subcategory}</span>
                    </>
                  )}
                  <span className="text-slate-700">•</span>
                  <span>Posted {postedLabel}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSaved(prev => !prev)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition ${
                    isSaved
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-white/[0.03] border-white/10 text-slate-300 hover:text-white hover:border-white/20'
                  }`}
                >
                  <Bookmark size={15} fill={isSaved ? 'currentColor' : 'none'} />
                  {isSaved ? 'Saved' : 'Save'}
                </button>

                <button
                  type="button"
                  onClick={handleShareProject}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 hover:text-white hover:border-white/20 text-xs font-bold transition"
                >
                  <Share2 size={15} />
                  Share
                </button>
              </div>
            </div>
          </div>

          {/* Project Facts */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 sm:p-8 rounded-3xl">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">Project Snapshot</div>
                <h2 className="text-xl font-bold text-white">Key project details</h2>
              </div>
              <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-300">
                {budgetTypeLabel}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Budget</div>
                <div className="text-base font-bold text-white">{budgetSummary}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Start</div>
                <div className="text-base font-semibold text-slate-200">{startSummary}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Deadline</div>
                <div className="text-base font-semibold text-slate-200">{deadlineSummary}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Location</div>
                <div className="text-base font-semibold text-slate-200 break-words">{displayLocation}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Languages</div>
                <div className="text-base font-semibold text-slate-200 break-words">{displayLanguages}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Review window</div>
                <div className="text-base font-semibold text-slate-200">{job.reviewWindow ? `${job.reviewWindow} days` : 'Not specified'}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-5">
              <span className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
                {projectTypeLabel}
              </span>
              {job.ndaRequired && (
                <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
                  NDA required
                </span>
              )}
              {job.visibility && (
                <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold">
                  {formatEnumLabel(job.visibility)}
                </span>
              )}
            </div>
          </div>

          {/* Overview Panel */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <LayoutTemplate className="text-emerald-400" size={20} /> Overview
            </h2>
            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap text-base">
              {job.description || 'No description provided'}
            </div>
          </div>

          {Array.isArray(job.screeningQuestions) && job.screeningQuestions.length > 0 && (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">Before applying</div>
              <h2 className="text-xl font-bold text-white mb-5">Client screening questions</h2>
              <div className="space-y-3">
                {job.screeningQuestions.map((question, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 rounded-2xl bg-slate-900/40 border border-white/5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-300 shrink-0">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-slate-300">{question}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deliverables & Requirements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl">
              <h2 className="text-lg font-bold text-white mb-4">Deliverables</h2>
              {Array.isArray(job.deliverables) && job.deliverables.length > 0 ? (
                <ul className="space-y-3">
                  {job.deliverables.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-300 text-sm">
                      <CheckCircle2 size={16} className="mt-0.5 text-emerald-400 shrink-0" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-slate-500 italic text-sm">No deliverables specified</div>
              )}
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl">
              <h2 className="text-lg font-bold text-white mb-4">Requirements</h2>
              <div className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">
                {job.requirements || 'No requirements provided'}
              </div>
            </div>
          </div>

          {/* Attachments & References */}
          {(job.attachmentUrls?.length > 0 || job.externalLinks?.length > 0 || job.referenceLinks?.length > 0) && (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl mt-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Paperclip className="text-emerald-400" size={20} /> Attachments & References
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {job.attachmentUrls?.map((url, i) => {
                  const fileName = url.split('/').pop().split('?')[0] || `Attachment ${i + 1}`;
                  return (
                    <a key={`att-${i}`} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-slate-900/50 hover:bg-slate-800/80 border border-white/5 hover:border-emerald-500/30 rounded-2xl transition-all group">
                      <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
                        <Paperclip size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-gray-200 truncate">{decodeURIComponent(fileName)}</div>
                        <div className="text-xs text-gray-500 mt-0.5">Click to view/download</div>
                      </div>
                    </a>
                  );
                })}
                
                {job.externalLinks?.map((url, i) => (
                  <a key={`ext-${i}`} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-slate-900/50 hover:bg-slate-800/80 border border-white/5 hover:border-blue-500/30 rounded-2xl transition-all group">
                    <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
                      <ExternalLink size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-gray-200 truncate">{url}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Cloud Drive Link</div>
                    </div>
                  </a>
                ))}

                {job.referenceLinks?.map((url, i) => (
                  <a key={`ref-${i}`} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-slate-900/50 hover:bg-slate-800/80 border border-white/5 hover:border-purple-500/30 rounded-2xl transition-all group">
                    <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl group-hover:scale-110 transition-transform">
                      <Globe size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-gray-200 truncate">{url}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Reference Website</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Place a Bid Form Section */}
          <div id="bid-form" ref={bidFormRef} className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl mt-8 scroll-mt-24">
            {currentUser && (job.clientId === currentUser.id || job.client?.id === currentUser.id) ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
                <User className="text-blue-400" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">This is your project</h2>
              <p className="text-slate-400 max-w-md mx-auto mb-6">You are viewing the public listing for your own project.</p>
            </div>
          ) : job.viewerBid ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <CheckCircle2 className="text-emerald-400" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">You've already applied</h2>
            <p className="text-slate-400 max-w-md mx-auto mb-6">You submitted a proposal for this project on {formatDate(job.viewerBid.createdAt)}.</p>
            <div className="inline-block text-left bg-slate-900/50 border border-white/5 rounded-2xl p-6 max-w-lg w-full">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">Your Bid Amount</span>
                <span className="text-lg font-bold text-emerald-400">₹{Number(job.viewerBid.proposedAmount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">Delivery Time</span>
                <span className="text-sm font-semibold text-slate-200">{job.viewerBid.deliveryDays} Days</span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block mb-2">Cover Letter</span>
                <p className="text-sm text-slate-300 line-clamp-3 whitespace-pre-wrap">{job.viewerBid.coverLetter}</p>
              </div>
            </div>
          </div>
        ) : (!job.isOpen || job.status !== 'OPEN') ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
              <ShieldCheck className="text-red-400" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Applications Closed</h2>
            <p className="text-slate-400 max-w-md mx-auto">This project is no longer accepting new proposals.</p>
          </div>
        ) : !currentUser ? (
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-white mb-2">Sign in to apply</h2>
            <p className="text-slate-400 max-w-md mx-auto mb-6">You need an account to submit a proposal for this project.</p>
            <Link to="/login" className="inline-flex items-center justify-center py-3 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              Sign In / Register
            </Link>
          </div>
        ) : currentUser.role !== 'STUDENT_FREELANCER' ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
              <ShieldCheck className="text-amber-400" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Freelancer Account Required</h2>
            <p className="text-slate-400 max-w-md mx-auto">Only student freelancer accounts can submit proposals on projects.</p>
          </div>
        ) : (
          <>
<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                          <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">Application</div>
                            <h2 className="text-xl font-bold text-white">Place a bid on this project</h2>
                            <p className="text-sm text-gray-400 mt-2">You will be able to edit your bid until the project is awarded to someone.</p>
                          </div>
                          <div className="px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 font-semibold shrink-0">
                            One proposal per applicant
                          </div>
                        </div>
            
                        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                            <div className="text-xs font-bold text-white">Be specific</div>
                            <div className="text-[11px] text-slate-500 mt-1">Explain exactly how you will solve the client's problem.</div>
                          </div>
                          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                            <div className="text-xs font-bold text-white">Show relevance</div>
                            <div className="text-[11px] text-slate-500 mt-1">Mention experience that directly matches this project.</div>
                          </div>
                          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                            <div className="text-xs font-bold text-white">Set expectations</div>
                            <div className="text-[11px] text-slate-500 mt-1">Give a realistic delivery estimate and clear scope.</div>
                          </div>
                        </div>
            
                        {toastMessage && (
                          <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                            toastMessage.type === 'success'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                              : 'bg-red-500/10 border-red-500/20 text-red-300'
                          }`}>
                            {toastMessage.text}
                          </div>
                        )}
            
                        <form onSubmit={handleBidSubmit} className="space-y-6">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5">
                              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Client budget</div>
                              <div className="text-base font-bold text-white">{budgetSummary}</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5">
                              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Project type</div>
                              <div className="text-base font-semibold text-slate-200">{projectTypeLabel}</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5">
                              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Proposals</div>
                              <div className="text-base font-semibold text-amber-300">{job.bids?.length || 0}</div>
                            </div>
                          </div>
            
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Bid Amount */}
                            <div className="space-y-2">
                              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Bid Amount</label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                                <input
                                  type="number"
                                  required
                                  value={bidAmount}
                                  onChange={(e) => setBidAmount(e.target.value)}
                                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-gray-600"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
            
                            {/* Delivery Time */}
                            <div className="space-y-2">
                              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">This project will be delivered in</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  required
                                  value={deliveryDays}
                                  onChange={(e) => setDeliveryDays(e.target.value)}
                                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-4 pr-16 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-gray-600"
                                  placeholder="7"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Days</span>
                              </div>
                            </div>
                          </div>
            
                          {Number.isFinite(parsedBidAmount) && parsedBidAmount > 0 && (
                            <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/15 p-4">
                              <div className="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-3">Your bid preview</div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Bid amount</div>
                                  <div className="text-base font-bold text-white mt-1">₹{parsedBidAmount.toLocaleString('en-IN')}</div>
                                </div>
                                <div>
                                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Estimated platform fee</div>
                                  <div className="text-base font-semibold text-slate-300 mt-1">₹{estimatedPlatformFee.toLocaleString('en-IN')}</div>
                                </div>
                                <div>
                                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Estimated earnings</div>
                                  <div className="text-base font-bold text-emerald-300 mt-1">₹{estimatedEarnings.toLocaleString('en-IN')}</div>
                                </div>
                              </div>
                              {expectedCompletionDate && (
                                <div className="mt-4 pt-3 border-t border-white/5 text-xs text-slate-400">
                                  Expected completion: <span className="text-slate-200 font-semibold">{expectedCompletionDate}</span>
                                </div>
                              )}
                            </div>
                          )}
            
                          {/* Proposal Description */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Describe your proposal</label>
                              <span className={`text-xs ${proposalText.length < 100 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {proposalText.length}/2000 (Min 100)
                              </span>
                            </div>
                            <textarea
                              required
                              value={proposalText}
                              onChange={(e) => setProposalText(e.target.value)}
                              maxLength={2000}
                              rows={6}
                              className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-gray-600 resize-y"
                              placeholder="Introduce yourself, mention relevant experience, explain your approach, and tell the client why you are a strong fit..."
                            />
                          </div>
            
                          {/* Portfolio Link */}
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Portfolio / Previous Works Link</label>
                            <input
                              type="url"
                              value={portfolioLink}
                              onChange={(e) => setPortfolioLink(e.target.value)}
                              className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-gray-600"
                              placeholder="https://your-portfolio.com or Google Drive link"
                            />
                          </div>
            
                          {/* Safety Reminder */}
                              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-300/90 text-xs mb-6">
                                <ShieldCheck size={16} className="shrink-0 mt-0.5 text-amber-400" />
                                <p className="leading-relaxed">
                                  <strong>Safety Tip:</strong> Keep communication and payments on SkillLaunch. Do not send money or share personal bank details with a client to apply for a job.
                                </p>
                              </div>
                              
                              <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                  <div>
                                    <div className="text-xs font-black uppercase tracking-wider text-slate-400">
                                      Final proposal check
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1">
                                      {Number.isFinite(parsedBidAmount) && parsedBidAmount > 0
                                        ? `You are proposing ₹${parsedBidAmount.toLocaleString('en-IN')} with an estimated ₹${estimatedEarnings.toLocaleString('en-IN')} payout after the platform fee.`
                                        : 'Enter a valid bid amount to review your estimated earnings.'}
                                    </p>
                                  </div>

                                  <span className="shrink-0 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-black text-amber-300">
                                    One proposal only
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                                <p className="text-xs text-slate-500">
                                  Your bid amount, delivery time, and proposal will be submitted to the client.
                                </p>

                                <button
                                  type="submit"
                                  disabled={
                                    isSubmitting ||
                                    proposalText.length < 100 ||
                                    !(Number.isFinite(parsedBidAmount) && parsedBidAmount > 0) ||
                                    !(Number(deliveryDays) > 0)
                                  }
                                  className="w-full sm:w-auto py-3 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                >
                                  {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
                                </button>
                              </div>
                        </form>
          </>
        )}
          </div>

          {/* Similar / Recommended Projects */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl mt-8">
              <h2 className="text-xl font-bold text-white mb-6">Similar projects you might like</h2>
              <div className="text-center py-10 bg-slate-900/40 border border-white/5 rounded-2xl flex flex-col items-center justify-center">
                <div className="text-slate-400 text-sm mb-2">
                  Explore more projects in <span className="font-semibold text-slate-300">{job.category || 'this category'}</span>
                </div>
                <Link to="/jobs" className="text-emerald-400 text-xs font-bold hover:text-emerald-300 transition-colors inline-block mt-2">
                  Return to Marketplace &rarr;
                </Link>
              </div>
            </div>

          </div>

          {/* Right: Sticky Sidebar */}
        <div className="lg:col-span-4">
          <div className="sticky top-6 space-y-6">
            
            {/* Meta Data Card */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl">
              <div className="space-y-6">
                
                {/* Budget */}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shrink-0">
                    <Wallet className="text-emerald-400" size={20} />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Budget</div>
                    <div className="text-2xl font-black text-white">₹{job.budget}</div>
                  </div>
                </div>

                <div className="h-px w-full bg-white/5" />

                {/* Project Snapshot */}
                <div className="space-y-4">
                  <div className="text-xs uppercase tracking-wider text-gray-500 font-bold">Project Snapshot</div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-2.5">
                      <Clock3 size={15} className="mt-0.5 text-indigo-400 shrink-0" />
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Duration</div>
                        <div className="text-sm text-gray-200 mt-0.5">{timelineLabel}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Calendar size={15} className="mt-0.5 text-purple-400 shrink-0" />
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Posted</div>
                        <div className="text-sm text-gray-200 mt-0.5">{postedLabel}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <MapPin size={15} className="mt-0.5 text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Location</div>
                        <div className="text-sm text-gray-200 mt-0.5 break-words">{locationLabel}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Languages size={15} className="mt-0.5 text-blue-400 shrink-0" />
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Language</div>
                        <div className="text-sm text-gray-200 mt-0.5 break-words">{languagesLabel}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <ShieldCheck size={16} className="mt-0.5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-gray-200">Application status</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {job.status === 'OPEN' && job.isOpen
                          ? 'This project is currently open for proposals.'
                          : 'This project is not currently accepting new proposals.'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px w-full bg-white/5" />

                {/* Client & Proposals */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">
                      <User size={12} /> Client
                    </div>
                    <div className="text-sm font-medium text-gray-200">
                      {job.client?.fullName || 'Client'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">
                      <Users size={12} /> Proposals
                    </div>
                    <div className="text-sm font-medium text-amber-400">
                      {job.bids?.length || 0} Submitted
                    </div>
                  </div>
                </div>

                {/* Apply CTA */}
                <div className="pt-4 space-y-3">
                  {!job.viewerBid && currentUser?.role === 'STUDENT_FREELANCER' && job.isOpen && job.status === 'OPEN' && (
                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                      <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-black">
                        Before you bid
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div>
                          <div className="text-[9px] uppercase tracking-wider text-slate-600 font-black">Fee</div>
                          <div className="text-sm font-black text-white mt-1">10% platform fee</div>
                        </div>
                        <div>
                          <div className="text-[9px] uppercase tracking-wider text-slate-600 font-black">Commitment</div>
                          <div className="text-sm font-black text-white mt-1">Amount + delivery</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <a
                    href="#bid-form"
                    onClick={scrollToBidForm}
                    className="flex items-center justify-center w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-900 text-sm font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                  >
                    {currentUser && (job.clientId === currentUser.id || job.client?.id === currentUser.id)
                      ? 'View Project'
                      : job.viewerBid
                        ? 'View your proposal'
                        : (!job.isOpen || job.status !== 'OPEN')
                          ? 'Applications closed'
                          : 'Bid on this project'}
                  </a>
                </div>
              </div>
            </div>

            {/* Client Trust Card */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl">
              <div className="text-xs uppercase tracking-wider text-emerald-400 font-bold mb-1">About the client</div>
              <h3 className="text-lg font-bold text-white mb-5">Client profile</h3>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-900 border border-white/10 flex items-center justify-center shrink-0">
                  {job.client?.profile?.avatarUrl ? (
                    <img
                      src={job.client.profile.avatarUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="text-slate-500" size={22} />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-base font-bold text-white truncate">
                    {job.client?.fullName || 'Client'}
                  </div>
                  {job.client?.profile?.tagline && (
                    <div className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {job.client.profile.tagline}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="p-3 rounded-2xl bg-slate-900/40 border border-white/5">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Rating</div>
                  <div className="text-sm font-bold text-white mt-1">
                    {Number(job.client?.averageRating || 0).toFixed(1)} / 5
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/40 border border-white/5">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Reviews</div>
                  <div className="text-sm font-bold text-white mt-1">
                    {job.client?.totalReviews || 0}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/40 border border-white/5">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Member since</div>
                  <div className="text-sm font-semibold text-slate-200 mt-1">
                    {job.client?.createdAt ? formatDate(job.client.createdAt) : 'Recently'}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/40 border border-white/5">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Verification</div>
                  <div className="text-sm font-semibold mt-1 flex items-center gap-1.5">
                    {job.client?.verification?.status === 'APPROVED' ? (
                      <>
                        <ShieldCheck size={14} className="text-emerald-400" />
                        <span className="text-emerald-300">Verified</span>
                      </>
                    ) : (
                      <span className="text-slate-400">Not verified</span>
                    )}
                  </div>
                </div>
              </div>

              {job.client?.profile?.college && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Organization / College</div>
                  <div className="text-sm text-slate-300">{job.client.profile.college}</div>
                </div>
              )}
            </div>

            {/* Skills Taxonomy Card */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Required Skills</h3>
              {Array.isArray(job.skills) && job.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-gray-300 transition-colors cursor-default"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 italic text-sm">No skills specified</div>
              )}
            </div>

          </div>
        </div>
        
      </div>
    </div>
  );
}
