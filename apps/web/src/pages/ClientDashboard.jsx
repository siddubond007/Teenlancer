import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, PlusCircle, Trash2, Star, ArrowRight, AlertCircle, CheckCircle2, Clock3, DollarSign, FileText, Users, Bell, ShieldCheck, Menu, X, MessageCircle, CalendarDays, WalletCards } from 'lucide-react';
import confetti from 'canvas-confetti';
import API from '../services/api';


function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-2">
      {[1,2,3,4,5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-7 h-7 ${
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "text-slate-600"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ClientDashboard({ currentUser }) {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    overallRating: 5,
    communicationRating: 5,
    qualityRating: 5,
    timelinessRating: 5,
    comment: ""
  });

  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [jobForm, setJobForm] = useState({
    title: '',
    category: 'Programming & Tech',
    description: '',
    budget: '',
    deadlineDays: '3'
  });

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        setDashboardLoading(true);
        setDashboardError('');

        const dashboardRes = await API.get('/client/dashboard');

        if (!mounted) return;

        setDashboardData(dashboardRes.data);
      } catch (err) {
        if (!mounted) return;
        setDashboardError(
          err.response?.data?.error || 'Unable to load your dashboard.'
        );
      } finally {
        if (mounted) {
          setDashboardLoading(false);
        }
      }
    };

    loadDashboard();

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

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/reviews/${selectedOrderId}`, reviewForm);
      alert("Review submitted successfully.");
      setShowReviewModal(false);
      setSelectedOrderId(null);
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to submit review.");
    }
  };

  const getStatusLabel = (job) => {
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
  };

  const dashboardSummary = dashboardData?.summary || {
    activeProjects: 0,
    pendingProposals: 0,
    totalSpend: 0,
    escrowAmount: 0,
    completedProjects: 0,
    unreadNotifications: 0
  };

  const attention = dashboardData?.attention || {
    proposalJobs: [],
    deliveryApprovalItems: [],
    paymentItems: []
  };

  const activeProjects = dashboardData?.activeProjects || [];

  const attentionItems = [
    ...attention.deliveryApprovalItems.map(item => ({
      key: `delivery-${item.orderId}`,
      type: 'DELIVERY',
      title: 'Delivery awaiting approval',
      subtitle: item.projectTitle,
      detail: `${item.studentName} · ₹${Number(item.amount || 0).toLocaleString('en-IN')}`,
      action: 'Review Delivery',
      href: `/orders/${item.orderId}`
    })),
    ...attention.paymentItems.map(item => ({
      key: `payment-${item.orderId}`,
      type: 'PAYMENT',
      title: 'Payment required to continue hiring',
      subtitle: item.projectTitle,
      detail: `${item.studentName} · ₹${Number(item.amount || 0).toLocaleString('en-IN')}`,
      action: 'Open Project Room',
      href: `/orders/${item.orderId}`
    })),
    ...attention.proposalJobs.map(item => ({
      key: `proposal-${item.id}`,
      type: 'PROPOSAL',
      title: `${item.pendingProposalCount} proposal${item.pendingProposalCount === 1 ? '' : 's'} awaiting review`,
      subtitle: item.title,
      detail: 'Choose the right student for this project',
      action: 'Review Proposals',
      href: `/my-projects/${item.id}/proposals`
    }))
  ].slice(0, 5);

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString('en-IN')}`;

  const dashboardSections = [
    { id: 'overview', label: 'Overview', icon: Briefcase, group: 'workspace' },
    { id: 'attention', label: 'Needs Attention', icon: AlertCircle, group: 'workspace' },
    { id: 'projects', label: 'Projects', icon: FileText, group: 'work' },
    { id: 'proposals', label: 'Proposals', icon: Users, group: 'work' },
    { id: 'deadlines', label: 'Deadlines', icon: CalendarDays, group: 'work' },
    { id: 'payments', label: 'Payments', icon: WalletCards, group: 'financial' },
    { id: 'students', label: 'Students', icon: Users, group: 'discover' },
    { id: 'messages', label: 'Messages', icon: MessageCircle, group: 'discover' },
    { id: 'activity', label: 'Activity', icon: Clock3, group: 'insights' },
    { id: 'reviews', label: 'Reviews', icon: Star, group: 'insights' },
    { id: 'account', label: 'Account', icon: ShieldCheck, group: 'account' }
  ];

  const selectSection = (section) => {
    setActiveSection(section);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="pb-16">
      <div className="lg:hidden flex items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wider text-indigo-400">
            Client Workspace
          </p>
          <p className="text-lg font-black text-white truncate">
            {dashboardSections.find(s => s.id === activeSection)?.label || 'Overview'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-700 text-white text-xl shrink-0"
          aria-label="Open dashboard navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        >
          <aside
            className="w-[82%] max-w-sm h-full bg-slate-950 border-r border-slate-800 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-indigo-400">
                  Client Workspace
                </p>
                <h2 className="text-xl font-black text-white mt-1">
                  Dashboard
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 text-slate-300"
                aria-label="Close dashboard navigation"
              >
                ✕
              </button>
            </div>

            <nav className="space-y-5">
              {[
                ['workspace', 'Workspace'],
                ['work', 'Manage'],
                ['financial', 'Financial'],
                ['discover', 'Discover'],
                ['insights', 'Insights'],
                ['account', 'Account']
              ].map(([group, label]) => {
                const items = dashboardSections.filter(section => section.group === group);
                if (items.length === 0) return null;

                return (
                  <div key={group}>
                    <p className="px-3.5 mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      {label}
                    </p>

                    <div className="space-y-1">
                      {items.map((section) => {
                        const Icon = section.icon;
                        const selected = activeSection === section.id;

                        return (
                          <button
                            type="button"
                            key={section.id}
                            onClick={() => selectSection(section.id)}
                            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-black transition ${
                              selected
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/30'
                                : 'text-slate-400 hover:text-white hover:bg-slate-900'
                            }`}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="truncate">{section.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      <div className="grid lg:grid-cols-[240px_minmax(0,1fr)] gap-6">
        <aside className="hidden lg:block">
          <div className="glass-panel p-3.5 rounded-3xl border border-slate-800 sticky top-24">
            <div className="px-3.5 py-3.5 border-b border-slate-800 mb-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-400">
                Client Workspace
              </p>
              <h2 className="text-xl font-black text-white mt-1">
                Dashboard
              </h2>
            </div>

            <nav className="space-y-4">
              {[
                ['workspace', 'Workspace'],
                ['work', 'Manage'],
                ['financial', 'Financial'],
                ['discover', 'Discover'],
                ['insights', 'Insights'],
                ['account', 'Account']
              ].map(([group, label]) => {
                const items = dashboardSections.filter(section => section.group === group);
                if (items.length === 0) return null;

                return (
                  <div key={group}>
                    <p className="px-3.5 mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      {label}
                    </p>

                    <div className="space-y-1">
                      {items.map((section) => {
                        const Icon = section.icon;
                        const selected = activeSection === section.id;

                        return (
                          <button
                            type="button"
                            key={section.id}
                            onClick={() => selectSection(section.id)}
                            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-black transition ${
                              selected
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/30'
                                : 'text-slate-400 hover:text-white hover:bg-slate-900'
                            }`}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="truncate">{section.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 space-y-6">

      {activeSection === 'overview' && (
        <section className="space-y-6">
      <div className="glass-panel p-4 sm:p-5 md:p-8 rounded-3xl border border-slate-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 md:gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[10px] sm:text-xs md:text-sm font-black text-emerald-400 mb-2.5">
            <Briefcase className="w-4 h-4" />
            <span>Client Management Portal</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
            Welcome back, {currentUser?.fullName}
          </h2>

          <p className="text-sm sm:text-base text-slate-400 mt-1.5 md:mt-2">
            Manage your projects, hiring, approvals and payments from one place.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 md:gap-3">
          <button
            onClick={() => setShowPostJobModal(true)}
            className="px-4 sm:px-5 md:px-6 py-3 md:py-3.5 neon-airflow-btn text-white rounded-2xl text-sm font-black shadow-xl flex items-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Post New Project</span>
          </button>

          <Link
            to="/notifications"
            className="px-4 py-3.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 rounded-2xl flex items-center gap-2"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {dashboardSummary.unreadNotifications > 0 && (
              <span className="text-sm font-black">
                {dashboardSummary.unreadNotifications}
              </span>
            )}
          </Link>
        </div>
      </div>

      {dashboardError && (
        <div className="glass-panel p-4 rounded-2xl border border-red-500/30 bg-red-500/5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-base font-bold text-red-300">{dashboardError}</p>
            <p className="text-sm text-slate-400 mt-1">
              The dashboard could not load its latest summary.
            </p>
          </div>
        </div>
      )}

        </section>
      )}

      {activeSection === 'account' && (
        <section className="space-y-6">
          <div className="glass-panel p-5 md:p-6 rounded-3xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-lg md:text-xl font-black text-white">
                Account & Verification
              </h3>
              <p className="text-sm text-slate-400 mt-0.5">
                Your contact details, identity status and account state.
              </p>
            </div>
          </div>

          <Link
            to={`/profile/${dashboardData?.account?.id || ''}`}
            className="text-sm font-black text-indigo-400 hover:text-indigo-300 flex items-center gap-1 shrink-0"
          >
            Manage Verification
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {dashboardLoading ? (
          <div className="py-5 text-center text-sm text-slate-500">
            Loading account details…
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-slate-950/50 border border-slate-800 p-4">
              <p className="text-sm font-bold text-slate-500">Email</p>
              <p className="text-base font-bold text-white mt-1 break-words">
                {dashboardData?.account?.email || 'Not available'}
              </p>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Account email
              </p>
            </div>

            <Link
              to={`/profile/${dashboardData?.account?.id || ''}`}
              className="rounded-2xl bg-slate-950/50 border border-slate-800 p-4 hover:border-indigo-500/40 transition"
            >
              <p className="text-sm font-bold text-slate-500">Phone</p>
              <p className="text-base font-bold text-white mt-1">
                {dashboardData?.account?.phone || 'Not added'}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {dashboardData?.account?.phone ? 'Phone on account' : 'Add a phone number in your profile'}
              </p>
              {!dashboardData?.account?.phone && (
                <span className="inline-flex items-center gap-1 mt-3 text-sm font-black text-indigo-400">
                  Add phone <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Link>

            <Link
              to={`/profile/${dashboardData?.account?.id || ''}`}
              className="rounded-2xl bg-slate-950/50 border border-slate-800 p-4 hover:border-indigo-500/40 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-500">
                    Government Identity
                  </p>
                  <p className="text-base font-bold text-white mt-1">
                    Identity verification
                  </p>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-black shrink-0 ${
                    dashboardData?.account?.verification?.govtIdStatus === 'APPROVED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : dashboardData?.account?.verification?.govtIdStatus === 'PENDING' &&
                        dashboardData?.account?.verification?.hasGovtId
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {dashboardData?.account?.verification?.govtIdStatus === 'APPROVED' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : dashboardData?.account?.verification?.govtIdStatus === 'PENDING' &&
                    dashboardData?.account?.verification?.hasGovtId ? (
                    <Clock3 className="w-4 h-4" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}

                  {dashboardData?.account?.verification?.govtIdStatus === 'APPROVED'
                    ? 'Verified'
                    : dashboardData?.account?.verification?.govtIdStatus === 'PENDING' &&
                      dashboardData?.account?.verification?.hasGovtId
                      ? 'Under Review'
                      : 'Not Submitted'}
                </span>
              </div>
              {dashboardData?.account?.verification?.govtIdStatus !== 'APPROVED' && (
                <span className="inline-flex items-center gap-1 mt-3 text-sm font-black text-indigo-400">
                  Verify identity <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Link>

            <div className="rounded-2xl bg-slate-950/50 border border-slate-800 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-500">
                    Account Status
                  </p>
                  <p className="text-base font-bold text-white mt-1">
                    Client Account
                  </p>
                </div>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                  Active
                </span>
              </div>
            </div>
          </div>
        )}
          </div>

          </section>
        )}

      {activeSection === 'overview' && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: 'Active Projects',
            value: dashboardSummary.activeProjects,
            note: dashboardSummary.activeProjects === 0
              ? 'No active projects'
              : 'Currently in progress',
            icon: Briefcase
          },
          {
            label: 'Pending Proposals',
            value: dashboardSummary.pendingProposals,
            note: dashboardSummary.pendingProposals === 0
              ? 'Nothing waiting'
              : 'Ready for your review',
            icon: Users
          },
          {
            label: 'Total Spend',
            value: formatCurrency(dashboardSummary.totalSpend),
            note: 'Across non-refunded orders',
            icon: DollarSign
          },
          {
            label: 'In Escrow',
            value: formatCurrency(dashboardSummary.escrowAmount),
            note: 'Currently secured',
            icon: Clock3
          }
        ].map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-800"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-black uppercase tracking-wide text-slate-400">
                  {card.label}
                </span>
                <Icon className="w-5 h-5 text-indigo-400" />
              </div>

              <div className="text-xl sm:text-2xl md:text-3xl font-black text-white mt-2.5 md:mt-3">
                {dashboardLoading ? '—' : card.value}
              </div>

              <p className="text-sm text-slate-500 mt-1">
                {card.note}
              </p>
            </div>
          );
        })}
      </div>
      )}


      {activeSection === 'attention' && (
        <div className="glass-panel p-6 md:p-7 rounded-3xl border border-slate-800">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <h3 className="text-xl font-black text-white">
                Needs Your Attention
              </h3>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Important actions that should not be buried in your project list.
            </p>
          </div>
        </div>

        {dashboardLoading ? (
          <div className="py-8 text-center text-base text-slate-500">
            Loading action items…
          </div>
        ) : attentionItems.length === 0 ? (
          <div className="py-8 rounded-2xl bg-slate-950/40 border border-slate-800 text-center">
            <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto mb-2" />
            <p className="text-base font-bold text-slate-200">
              You are all caught up.
            </p>
            <p className="text-sm text-slate-500 mt-1">
              No immediate client actions require your attention.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {attentionItems.slice(0, 3).map((item) => {
              const itemIcon =
                item.type === 'DELIVERY'
                  ? CheckCircle2
                  : item.type === 'PAYMENT'
                    ? DollarSign
                    : FileText;

              const Icon = itemIcon;

              return (
                <Link
                  key={item.key}
                  to={item.href}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 md:p-5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-950 transition"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-indigo-400" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-base font-bold text-white">
                        {item.title}
                      </p>
                      <p className="text-sm font-semibold text-slate-300 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {item.detail}
                      </p>
                    </div>
                  </div>

                  <span className="text-sm font-black text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1 shrink-0">
                    {item.action}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      )}



      {activeSection === 'projects' && (
        <section className="space-y-6">
          <div className="glass-panel p-6 md:p-7 rounded-3xl border border-slate-800">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-xl font-black text-white">Active Projects</h3>
            <p className="text-sm text-slate-400 mt-1">
              A focused view of work currently moving through your marketplace.
            </p>
          </div>

          <Link
            to="/my-projects"
            className="text-sm font-black text-indigo-400 hover:text-indigo-300 flex items-center gap-1 shrink-0"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>

        </div>

        {dashboardLoading ? (
          <div className="py-8 text-center text-base text-slate-500">
            Loading active projects…
          </div>
        ) : activeProjects.length === 0 ? (
          <div className="py-8 rounded-2xl bg-slate-950/40 border border-slate-800 text-center">
            <Briefcase className="w-7 h-7 text-slate-500 mx-auto mb-2" />
            <p className="text-base font-bold text-slate-200">
              No active projects yet.
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Post a project and start finding student freelancers.
            </p>

            <button
              onClick={() => setShowPostJobModal(true)}
              className="mt-4 px-5 py-3 neon-airflow-btn rounded-xl text-white text-sm font-black"
            >
              Post a Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeProjects.map((project) => (
              <div
                key={project.id}
                className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm uppercase font-black text-indigo-400">
                        {project.category}
                      </span>
                      <span className="text-sm px-2.5 py-1 rounded-full bg-slate-800 text-slate-200 font-bold">
                        {getStatusLabel(project)}
                      </span>
                    </div>

                    <h4 className="text-lg font-black text-white mt-2 leading-snug line-clamp-2 break-words">
                      {project.title}
                    </h4>
                  </div>

                  <FileText className="w-5 h-5 text-slate-500 shrink-0" />
                </div>

                <div className="grid grid-cols-2 gap-3 mt-5">
                  <div className="rounded-xl bg-slate-900/70 p-3">
                    <p className="text-sm text-slate-500">Budget</p>
                    <p className="text-base font-black text-white mt-1">
                      {formatCurrency(project.budget)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-900/70 p-3">
                    <p className="text-sm text-slate-500">Proposals</p>
                    <p className="text-base font-black text-white mt-1">
                      {project.proposalCount}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 mt-4">
                  <span className="text-sm text-slate-500">
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </span>

                  <button
                    onClick={() => navigate(`/my-projects/${project.id}`)}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white text-sm font-black flex items-center gap-1.5"
                  >
                    Open
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
          </div>
        </section>
      )}

      {activeSection === 'proposals' && (
        <section className="space-y-6">
          <div className="glass-panel p-6 md:p-7 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className="text-xl font-black text-white">
                  Proposals to Review
                </h3>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Review students who have applied to your projects.
              </p>
            </div>

            <span className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-sm font-black text-indigo-300">
              {dashboardSummary.pendingProposals} waiting
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {attention.proposalJobs.slice(0, 3).map((project) => (
              <Link
                key={project.id}
                to={`/my-projects/${project.id}/proposals`}
                className="group flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/40 transition"
              >
                <div className="min-w-0">
                  <p className="text-base font-bold text-white leading-snug line-clamp-2 break-words">
                    {project.title}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    {project.pendingProposalCount}{' '}
                    {project.pendingProposalCount === 1 ? 'proposal' : 'proposals'} waiting for review
                  </p>
                </div>

                <span className="text-sm font-black text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1 shrink-0">
                  Review
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>

          {attention.proposalJobs.length === 0 && (
            <div className="py-8 rounded-2xl bg-slate-950/40 border border-slate-800 text-center">
              <Users className="w-7 h-7 text-slate-500 mx-auto mb-2" />
              <p className="text-base font-bold text-slate-200">
                No proposals waiting for review.
              </p>
              <p className="text-sm text-slate-500 mt-1">
                New student proposals will appear here when they arrive.
              </p>
            </div>
          )}

          {attention.proposalJobs.length > 4 && (
            <p className="text-sm text-slate-500 mt-4 text-center">
              Showing the projects with the most proposal activity.
            </p>
          )}
          </div>
        </section>
      )}

      {activeSection === 'deadlines' && (
        <section className="space-y-6">
          <div className="glass-panel p-6 md:p-7 rounded-3xl border border-slate-800">
          <div className="flex items-center gap-2 mb-5">
            <Clock3 className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-xl font-black text-white">
                Upcoming Deadlines
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                The next important project deadlines on your workload.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dashboardData.deadlines.slice(0, 3).map((item) => {
              const deadline = new Date(item.deadline);
              const daysRemaining = Math.ceil(
                (deadline.getTime() - Date.now()) / 86400000
              );

              const href = item.orderId
                ? `/orders/${item.orderId}`
                : `/my-projects/${item.projectId}`;

              const urgency =
                daysRemaining < 0
                  ? {
                      text: 'text-red-300',
                      badge: 'bg-red-500/10 border-red-500/30',
                      label: 'Overdue'
                    }
                  : daysRemaining <= 1
                    ? {
                        text: 'text-red-300',
                        badge: 'bg-red-500/10 border-red-500/20',
                        label: daysRemaining === 0 ? 'Due today' : 'Due tomorrow'
                      }
                    : daysRemaining <= 3
                      ? {
                          text: 'text-amber-300',
                          badge: 'bg-amber-500/10 border-amber-500/20',
                          label: `${daysRemaining} days left`
                        }
                      : {
                          text: 'text-slate-300',
                          badge: 'bg-slate-900/70 border-slate-800',
                          label: `${daysRemaining} days left`
                        };

              return (
                <Link
                  key={`${item.orderId || 'project'}-${item.projectId}`}
                  to={href}
                  className={`group flex items-center justify-between gap-4 p-4 rounded-2xl border transition hover:border-indigo-500/40 ${
                    daysRemaining < 0
                      ? 'bg-red-950/20 border-red-500/20'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-base font-bold text-white truncate">
                      {item.projectTitle}
                    </p>

                    <p className="text-sm text-slate-400 mt-1">
                      {item.studentName
                        ? `${item.studentName} · ${item.status.replaceAll('_', ' ')}`
                        : 'Project deadline'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-sm font-black ${urgency.text} ${urgency.badge}`}>
                      {urgency.label}
                    </span>
                    <p className="text-sm text-slate-500 mt-1">
                      {deadline.toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          {dashboardData?.deadlines?.length === 0 && (
            <div className="py-8 rounded-2xl bg-slate-950/40 border border-slate-800 text-center">
              <Clock3 className="w-7 h-7 text-slate-500 mx-auto mb-2" />
              <p className="text-base font-bold text-slate-200">
                No upcoming deadlines.
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Important project and delivery deadlines will appear here.
              </p>
            </div>
          )}
          </div>
        </section>
      )}

      {activeSection === 'payments' && (
        <section className="space-y-6">
          <div className="glass-panel p-6 md:p-7 rounded-3xl border border-slate-800">
        <div className="flex items-center gap-2 mb-5">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-xl font-black text-white">
              Payments & Escrow
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              A quick view of money committed to your marketplace work.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl bg-slate-950/50 border border-slate-800 p-4">
            <p className="text-sm text-slate-500">In Escrow</p>
            <p className="text-2xl font-black text-white mt-1">
              {formatCurrency(dashboardSummary.escrowAmount)}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Funds currently secured
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950/50 border border-slate-800 p-4">
            <p className="text-sm text-slate-500">Total Spent</p>
            <p className="text-2xl font-black text-white mt-1">
              {formatCurrency(dashboardSummary.totalSpend)}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Captured order payments
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950/50 border border-slate-800 p-4">
            <p className="text-sm text-slate-500">Payments Pending</p>
            <p className="text-2xl font-black text-white mt-1">
              {attention.paymentItems.length}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Hiring reservations awaiting payment
            </p>
          </div>
        </div>

        {attention.paymentItems.length > 0 ? (
          <div className="mt-5 pt-5 border-t border-slate-800 space-y-3">
            {attention.paymentItems.slice(0, 3).map((item) => (
              <Link
                key={item.orderId}
                to={`/orders/${item.orderId}`}
                className="group flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/40 transition"
              >
                <div className="min-w-0">
                  <p className="text-base font-bold text-white truncate">
                    {item.projectTitle}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    Payment required · {formatCurrency(item.amount)}
                  </p>
                </div>

                <span className="text-sm font-black text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1 shrink-0">
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-5 pt-5 border-t border-slate-800">
            <div className="py-7 rounded-2xl bg-slate-950/40 border border-slate-800 text-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto mb-2" />
              <p className="text-base font-bold text-slate-200">
                No payments are waiting.
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Your current payment and escrow activity is up to date.
              </p>
            </div>
          </div>
        )}
          </div>
        </section>
      )}

      {activeSection === 'students' && (
        <section className="space-y-6">
          <div className="glass-panel p-6 md:p-7 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-xl font-black text-white">
                  Recommended Students
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Discover highly rated student freelancers.
                </p>
              </div>
            </div>

            <Link
              to="/talent-search"
              className="text-sm font-black text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Explore Talent
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {dashboardData.recommendedStudents.slice(0, 4).map((student, index) => (
              <div
                key={student.id}
                className={`rounded-2xl bg-slate-950/60 border border-slate-800 p-5 ${
                  index > 1 ? 'hidden sm:block' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {student.profile?.avatarUrl ? (
                    <img
                      src={student.profile.avatarUrl}
                      alt=""
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-700"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-base font-black text-indigo-300">
                      {(student.fullName || 'S').charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-base font-black text-white truncate">
                      {student.fullName}
                    </p>
                    <p className="text-sm text-slate-400 truncate mt-0.5">
                      {student.profile?.category || 'Student Freelancer'}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-slate-300 mt-4 line-clamp-2 min-h-[40px]">
                  {student.profile?.tagline || 'Student freelancer ready to work.'}
                </p>

                <div className="flex items-center justify-between gap-3 mt-4">
                  <div>
                    <p className="text-sm text-slate-500">Rating</p>
                    <p className="text-base font-black text-white mt-0.5">
                      {student.totalReviews > 0 ? `${Number(student.averageRating || 0).toFixed(1)} ★` : 'New'}
                      <span className="text-sm text-slate-500 font-medium ml-1">
                        {student.totalReviews > 0 ? `(${student.totalReviews})` : 'No reviews yet'}
                      </span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-slate-500">From</p>
                    <p className="text-base font-black text-white mt-0.5">
                      {formatCurrency(student.profile?.hourlyRate || 0)}
                    </p>
                  </div>
                </div>

                <Link
                  to={`/u/${student.username || student.id}`}
                  className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-black"
                >
                  View Profile
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>

          {(!dashboardData?.recommendedStudents || dashboardData.recommendedStudents.length === 0) && (
            <div className="py-8 rounded-2xl bg-slate-950/40 border border-slate-800 text-center">
              <Users className="w-7 h-7 text-slate-500 mx-auto mb-2" />
              <p className="text-base font-bold text-slate-200">
                No recommended students yet.
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Explore the talent marketplace to find student freelancers.
              </p>
              <Link
                to="/talent-search"
                className="mt-4 inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black"
              >
                Explore Talent
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
          </div>
        </section>
      )}

      {activeSection === 'messages' && (
        <section className="space-y-6">
          <div className="glass-panel p-6 md:p-7 rounded-3xl border border-slate-800">
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-xl font-black text-white">
                Recent Conversations
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Your latest messages from active project rooms.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {dashboardData.recentConversations.slice(0, 5).map((conversation, index) => (
              <Link
                key={conversation.orderId}
                to={`/orders/${conversation.orderId}`}
                className={`group flex items-center gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/40 transition ${
                  index > 2 ? 'hidden sm:flex' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-indigo-400" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-white truncate">
                    {conversation.projectTitle}
                  </p>

                  <p className="text-sm text-slate-300 truncate mt-1">
                    <span className="font-semibold">
                      {conversation.senderName}:
                    </span>{' '}
                    {conversation.message}
                  </p>

                  <p className="text-sm text-slate-500 mt-1">
                    {new Date(conversation.createdAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 shrink-0" />
              </Link>
            ))}
          </div>

          {(!dashboardData?.recentConversations || dashboardData.recentConversations.length === 0) && (
            <div className="py-8 rounded-2xl bg-slate-950/40 border border-slate-800 text-center">
              <Users className="w-7 h-7 text-slate-500 mx-auto mb-2" />
              <p className="text-base font-bold text-slate-200">
                No project conversations yet.
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Messages from your active project rooms will appear here.
              </p>
              <Link
                to="/my-projects"
                className="mt-4 inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-black"
              >
                View Projects
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
          </div>
        </section>
      )}

      {activeSection === 'activity' && (
        <section className="space-y-6">
          <div className="glass-panel p-6 md:p-7 rounded-3xl border border-slate-800">
          <div className="flex items-center gap-2 mb-5">
            <Clock3 className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-xl font-black text-white">
                Recent Activity
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                The latest updates across your active work.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dashboardData.recentActivity.slice(0, 6).map((event, index) => {
              const href = event.projectId
                ? `/my-projects/${event.projectId}`
                : `/orders/${event.orderId}`;

                const activityMeta =
                  event.type === 'PAYMENT_RELEASED' || event.type === 'ORDER_APPROVED'
                    ? { icon: DollarSign, tone: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' }
                    : event.type === 'REVISION_REQUESTED'
                      ? { icon: AlertCircle, tone: 'text-amber-400 bg-amber-500/10 border-amber-500/20' }
                      : event.type === 'DELIVERABLE_SUBMITTED'
                        ? { icon: CheckCircle2, tone: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20' }
                        : { icon: Clock3, tone: 'text-slate-300 bg-slate-500/10 border-slate-500/20' };

                const ActivityIcon = activityMeta.icon;

              return (
                <Link
                  key={event.id}
                  to={href}
                  className={`group flex items-start gap-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/40 transition ${
                    index > 2 ? 'hidden sm:flex' : ''
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${activityMeta.tone}`}>
                    <ActivityIcon className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-white">
                      {event.message}
                    </p>

                    <p className="text-sm text-slate-400 truncate mt-1">
                      {event.projectTitle}
                    </p>

                    <p className="text-sm text-slate-500 mt-1">
                      {new Date(event.createdAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 mt-1 shrink-0" />
                </Link>
              );
            })}
          </div>

          {(!dashboardData?.recentActivity || dashboardData.recentActivity.length === 0) && (
            <div className="py-8 rounded-2xl bg-slate-950/40 border border-slate-800 text-center">
              <Clock3 className="w-7 h-7 text-slate-500 mx-auto mb-2" />
              <p className="text-base font-bold text-slate-200">
                No recent activity.
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Updates from your projects and orders will appear here.
              </p>
            </div>
          )}
          </div>
        </section>
      )}

      {activeSection === 'reviews' && (() => {
        const pendingReviews = dashboardData?.pendingReviews || [];

        return (
          <section className="space-y-6">
            <div className="glass-panel p-6 md:p-7 rounded-3xl border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-xl font-black text-white">
                  Completed Projects Needing Review
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Share feedback on recently completed student work.
                </p>
              </div>
            </div>

            {pendingReviews.length === 0 ? (
              <div className="py-6 rounded-2xl bg-slate-950/40 border border-slate-800 text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <p className="text-base font-bold text-slate-200">
                  No reviews waiting.
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  You have reviewed all completed projects shown here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingReviews.slice(0, 4).map((order, index) => (
                  <div
                    key={order.orderId}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 ${
                      index > 1 ? 'hidden sm:flex' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-base font-bold text-white truncate">
                        {order.projectTitle || `Order #${order.orderId?.slice(0, 8)}`}
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        {order.studentName || 'Student'} · {formatCurrency(order.totalAmount)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedOrderId(order.orderId);
                          setShowReviewModal(true);
                        }}
                        className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-black rounded-xl"
                      >
                        Leave Review
                      </button>

                      <Link
                        to={`/orders/${order.orderId}`}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-black rounded-xl"
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </section>
        );
      })()}

      {activeSection === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h3 className="text-xl font-black text-white">Project Pipeline</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              ['Drafts', dashboardData?.projectCounts?.drafts || 0],
              ['Published', dashboardData?.projectCounts?.published || 0],
              ['In Progress', dashboardData?.projectCounts?.inProgress || 0],
              ['Completed', dashboardData?.projectCounts?.completed || 0],
              ['Cancelled', dashboardData?.projectCounts?.cancelled || 0],
              ['Total', dashboardData?.projectCounts?.all || 0]
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-slate-950/50 border border-slate-800 p-4">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="text-2xl font-black text-white mt-1">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-indigo-400" />
            <h3 className="text-xl font-black text-white">Quick Actions</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setShowPostJobModal(true)}
              className="p-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black text-left"
            >
              + Post a Project
            </button>

            <Link
              to="/talent-search"
              className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100 text-sm font-black"
            >
              Find Students
            </Link>

            <Link
              to="/notifications"
              className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100 text-sm font-black"
            >
              Notifications
            </Link>

          </div>
        </div>
      </div>

      )}

        </main>
      </div>

      {showPostJobModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="neon-border-box max-w-lg w-full p-7 shadow-2xl relative">

            <button
              onClick={() => setShowPostJobModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
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
                onChange={e => setJobForm({...jobForm, title: e.target.value})}
                placeholder="Project Title"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white"
              />

              <input
                required
                type="number"
                value={jobForm.budget}
                onChange={e => setJobForm({...jobForm, budget: e.target.value})}
                placeholder="Budget in ₹"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white"
              />

              <textarea
                required
                rows="4"
                value={jobForm.description}
                onChange={e => setJobForm({...jobForm, description: e.target.value})}
                placeholder="Requirements description..."
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white"
              />

              <button
                type="submit"
                className="w-full py-3.5 neon-airflow-btn text-white font-black rounded-2xl"
              >
                Publish Project Brief
              </button>

            </form>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 w-full max-w-lg shadow-2xl">
            <h3 className="text-xl font-black text-white mb-6">
              Leave Review
            </h3>

            <form onSubmit={handleSubmitReview} className="space-y-4">

              <div>
                <label className="block text-sm text-slate-300 mb-2">Overall Rating</label>
                <StarRating
                  value={reviewForm.overallRating}
                  onChange={(v) => setReviewForm({...reviewForm, overallRating: v})}
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Communication</label>
                <StarRating
                  value={reviewForm.communicationRating}
                  onChange={(v) => setReviewForm({...reviewForm, communicationRating: v})}
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Quality</label>
                <StarRating
                  value={reviewForm.qualityRating}
                  onChange={(v) => setReviewForm({...reviewForm, qualityRating: v})}
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Timeliness</label>
                <StarRating
                  value={reviewForm.timelinessRating}
                  onChange={(v) => setReviewForm({...reviewForm, timelinessRating: v})}
                />
              </div>

              <textarea
                required
                minLength={10}
                maxLength={1000}
                value={reviewForm.comment}
                onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}
                placeholder="Describe your experience..."
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white"
                rows="4"
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedOrderId(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-slate-800 text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black"
                >
                  Submit Review
                </button>
              </div>

            </form>
          </div>
        </div>
      )}


    </div>
  );
}
