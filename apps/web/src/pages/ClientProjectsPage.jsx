import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, PlusCircle, Trash2, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';
import API from '../services/api';

const FILTERS = [
  ['ALL', 'All'],
  ['DRAFTS', 'Drafts'],
  ['PUBLISHED', 'Published'],
  ['IN_PROGRESS', 'In Progress'],
  ['COMPLETED', 'Completed'],
  ['CANCELLED', 'Cancelled']
];

function getStatusLabel(job) {
  switch ((job.status || '').toUpperCase()) {
    case 'DRAFT':
      return 'Draft';
    case 'OPEN':
      return 'Published';
    case 'PENDING_PAYMENT':
      return 'Payment Pending';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return job.status || 'Unknown';
  }
}

export default function ClientProjectsPage() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [jobToCancel, setJobToCancel] = useState(null);
  const [cancellingHiring, setCancellingHiring] = useState(false);

  const [jobForm, setJobForm] = useState({
    title: '',
    category: 'Programming & Tech',
    description: '',
    budget: '',
    deadlineDays: '3'
  });

  useEffect(() => {
    let mounted = true;

    API.get('/jobs/my-projects')
      .then((res) => {
        if (!mounted) return;
        setJobs(res.data || []);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.response?.data?.error || 'Unable to load your projects.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handlePostJob = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post('/jobs', {
        title: jobForm.title,
        category: jobForm.category,
        description: jobForm.description,
        budget: Number(jobForm.budget),
        reviewWindow: Number(jobForm.deadlineDays)
      });

      const createdJob = res.data.job || res.data;
      setJobs((prev) => [createdJob, ...prev]);
      setShowPostJobModal(false);

      confetti({
        particleCount: 100,
        spread: 70
      });

      setJobForm({
        title: '',
        category: 'Programming & Tech',
        description: '',
        budget: '',
        deadlineDays: '3'
      });
    } catch (err) {
      alert(err.response?.data?.error || 'Error posting job');
    }
  };

  const handleDeleteJob = (id) => {
    setJobToDelete(id);
    setShowDeleteModal(true);
  };

  const handleCancelHiring = (id) => {
    setJobToCancel(id);
    setShowCancelModal(true);
  };

  const confirmCancelHiring = async () => {
    if (!jobToCancel || cancellingHiring) return;

    setCancellingHiring(true);

    try {
      await API.post(`/jobs/${jobToCancel}/cancel-hiring`);
      const refreshed = await API.get('/jobs/my-projects');
      setJobs(refreshed.data || []);
      setShowCancelModal(false);
      setJobToCancel(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel hiring reservation.');
    } finally {
      setCancellingHiring(false);
    }
  };

  const confirmDeleteJob = async () => {
    if (!jobToDelete) return;

    try {
      await API.delete(`/jobs/${jobToDelete}`);

      setJobs((prev) => prev.filter((job) => job.id !== jobToDelete));
      setShowDeleteModal(false);
      setJobToDelete(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete job.');
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const status = (job.status || '').toUpperCase();

    if (filter === 'ALL') return true;
    if (filter === 'DRAFTS') return status === 'DRAFT';
    if (filter === 'PUBLISHED') return status === 'OPEN';
    if (filter === 'IN_PROGRESS') return status === 'IN_PROGRESS';
    if (filter === 'COMPLETED') return status === 'COMPLETED';
    if (filter === 'CANCELLED') return status === 'CANCELLED';

    return true;
  });

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString('en-IN')}`;

  const getProjectState = (job) => {
    const orderStatus = job.currentOrder?.status;

    if (orderStatus === 'PENDING_PAYMENT') {
      return {
        label: 'Payment Pending',
        className: 'bg-amber-500/10 text-amber-300 border-amber-500/20'
      };
    }

    if (['FUNDED_IN_ESCROW', 'REQUIREMENTS_SUBMITTED', 'IN_PROGRESS', 'DELIVERED', 'REVISION_REQUESTED', 'IN_REVIEW'].includes(orderStatus)) {
      return {
        label: 'Hired · In Progress',
        className: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
      };
    }

    if (orderStatus === 'COMPLETED') {
      return {
        label: 'Hired · Completed',
        className: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
      };
    }

    if (orderStatus === 'DISPUTED') {
      return {
        label: 'Disputed',
        className: 'bg-red-500/10 text-red-300 border-red-500/20'
      };
    }

    if ((job.status || '').toUpperCase() === 'DRAFT') {
      return {
        label: 'Draft',
        className: 'bg-slate-800 text-slate-300 border-slate-700'
      };
    }

    if ((job.status || '').toUpperCase() === 'CANCELLED') {
      return {
        label: 'Cancelled',
        className: 'bg-slate-800 text-slate-400 border-slate-700'
      };
    }

    return {
      label: job.bids?.length ? 'Published · Hiring' : 'Published · Awaiting Proposals',
      className: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
    };
  };

  return (
    <div className="max-w-6xl mx-auto space-y-7 pb-16">
      <div className="glass-panel p-7 md:p-8 rounded-3xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <Link
              to="/client/portal"
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-indigo-400" />
              </div>

              <div>
                <h1 className="text-3xl md:text-4xl font-black text-white">
                  My Projects
                </h1>
                <p className="text-base text-slate-400 mt-1">
                  Manage all of your project briefs in one place.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowPostJobModal(true)}
            className="px-6 py-3.5 neon-airflow-btn text-white rounded-2xl text-sm font-black shadow-xl flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            Post New Project
          </button>
        </div>
      </div>

      <div className="glass-panel p-5 md:p-6 rounded-3xl border border-slate-800">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-4 py-2.5 rounded-xl text-sm font-black transition ${
                filter === value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="glass-panel p-5 rounded-2xl border border-red-500/30 bg-red-500/5">
          <p className="text-base font-bold text-red-300">{error}</p>
        </div>
      )}

      <div className="glass-panel p-6 md:p-7 rounded-3xl border border-slate-800">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-black text-white">
              {FILTERS.find(([value]) => value === filter)?.[1]} Projects
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {loading ? 'Loading…' : `${filteredJobs.length} project${filteredJobs.length === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-14 text-center text-base text-slate-500">
            Loading your projects…
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="py-14 rounded-2xl bg-slate-950/40 border border-slate-800 text-center">
            <FileText className="w-8 h-8 text-slate-500 mx-auto mb-3" />
            <h3 className="text-lg font-black text-slate-200">
              No projects in this category
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Create a project brief to start finding student freelancers.
            </p>
            <button
              onClick={() => setShowPostJobModal(true)}
              className="mt-5 px-5 py-3 neon-airflow-btn rounded-xl text-white text-sm font-black"
            >
              Post a Project
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="p-5 md:p-6 bg-slate-950/60 border border-slate-800 rounded-2xl"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm uppercase font-black text-indigo-400">
                        {job.category}
                      </span>
                      <span className={`text-sm px-2.5 py-1 rounded-full border font-bold ${getProjectState(job).className}`}>
                        {getProjectState(job).label}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-white mt-2">
                      {job.title}
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                      <div>
                        <p className="text-sm text-slate-500">Budget</p>
                        <p className="text-base font-black text-white mt-1">
                          {formatCurrency(job.budget)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">Proposals</p>
                        <p className="text-base font-black text-white mt-1">
                          {job.bids?.length || 0}
                        </p>
                        {job.bids?.some((bid) => bid.status === 'SHORTLISTED') && (
                          <p className="text-xs font-bold text-indigo-300 mt-1">
                            Shortlisted
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">Deadline</p>
                        {(() => {
                          const deadlineValue =
                            job.currentOrder?.deadline || job.deadlineDate;
                          const deadlineDate = deadlineValue ? new Date(deadlineValue) : null;
                          const now = new Date();
                          const daysRemaining = deadlineDate && !Number.isNaN(deadlineDate.getTime())
                            ? Math.round(
                                (
                                  Date.UTC(
                                    deadlineDate.getFullYear(),
                                    deadlineDate.getMonth(),
                                    deadlineDate.getDate()
                                  ) -
                                  Date.UTC(
                                    now.getFullYear(),
                                    now.getMonth(),
                                    now.getDate()
                                  )
                                ) / 86400000
                              )
                            : null;

                          const deadlineLabel =
                            daysRemaining === null
                              ? (job.timeline || 'Not specified')
                                  .toLowerCase()
                                  .replaceAll('_', ' ')
                                  .replace(/\b\w/g, (c) => c.toUpperCase())
                              : daysRemaining < 0
                                ? 'Overdue'
                                : daysRemaining === 0
                                  ? 'Due today'
                                  : daysRemaining === 1
                                    ? 'Due tomorrow'
                                    : `${daysRemaining} days left`;

                          const deadlineTone =
                            daysRemaining !== null && daysRemaining < 0
                              ? 'text-red-300'
                              : daysRemaining !== null && daysRemaining <= 3
                                ? 'text-amber-300'
                                : 'text-slate-200';

                          return (
                            <>
                              <p className={`text-base font-bold mt-1 ${deadlineTone}`}>
                                {deadlineLabel}
                              </p>
                              {deadlineDate && !Number.isNaN(deadlineDate.getTime()) && (
                                <p className="text-xs text-slate-500 mt-1">
                                  {deadlineDate.toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </p>
                              )}
                            </>
                          );
                        })()}
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">Updated</p>
                        <p className="text-base font-bold text-slate-200 mt-1">
                          {new Date(job.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end shrink-0">
                    {String(job.status || '').toUpperCase() === 'DRAFT' ? (
                      <>
                        <button
                          onClick={() => navigate(`/post-job?draftId=${job.id}`)}
                          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 rounded-xl text-white text-sm font-black"
                        >
                          Continue Editing
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="px-4 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-white text-sm font-black flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => navigate(`/my-projects/${job.id}`)}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white text-sm font-black"
                        >
                          View Project
                        </button>

                        {job.currentOrder?.status === 'PENDING_PAYMENT' ? (
                          <button
                            onClick={() => handleCancelHiring(job.id)}
                            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 rounded-xl text-white text-sm font-black"
                          >
                            Cancel Hiring
                          </button>
                        ) : !job.currentOrder ? (
                          <button
                            onClick={() => handleDeleteJob(job.id)}
                            className="px-4 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-white text-sm font-black flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPostJobModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="neon-border-box max-w-lg w-full p-7 shadow-2xl relative">
            <button
              onClick={() => setShowPostJobModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white text-lg"
              aria-label="Close"
            >
              ✕
            </button>

            <h3 className="text-xl font-black text-white mb-4">
              Post a Project Brief
            </h3>

            <form onSubmit={handlePostJob} className="space-y-4">
              <input
                required
                type="text"
                value={jobForm.title}
                onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                placeholder="Project Title"
                className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-base"
              />

              <input
                required
                type="number"
                min="1"
                value={jobForm.budget}
                onChange={(e) => setJobForm({ ...jobForm, budget: e.target.value })}
                placeholder="Budget in ₹"
                className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-base"
              />

              <textarea
                required
                rows="5"
                value={jobForm.description}
                onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                placeholder="Requirements description..."
                className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-base"
              />

              <button
                type="submit"
                className="w-full py-3.5 neon-airflow-btn text-white font-black rounded-2xl text-base"
              >
                Publish Project Brief
              </button>
            </form>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="text-xs font-black uppercase tracking-widest text-amber-400 mb-2">
              Hiring Reservation
            </div>
            <h3 className="text-xl font-black text-white mb-3">
              Cancel Pending Hiring?
            </h3>
            <p className="text-base text-slate-400 mb-6">
              This will release the unpaid hiring reservation and make the project available for hiring again.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (cancellingHiring) return;
                  setShowCancelModal(false);
                  setJobToCancel(null);
                }}
                disabled={cancellingHiring}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-bold disabled:opacity-50"
              >
                Keep Hiring
              </button>

              <button
                type="button"
                onClick={confirmCancelHiring}
                disabled={cancellingHiring}
                className="px-5 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-bold disabled:opacity-50"
              >
                {cancellingHiring ? 'Cancelling…' : 'Cancel Hiring'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-black text-white mb-3">
              Delete Project Brief
            </h3>

            <p className="text-base text-slate-400 mb-6">
              Are you sure you want to delete this project? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setJobToDelete(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-bold"
              >
                Cancel
              </button>

              <button
                onClick={confirmDeleteJob}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
