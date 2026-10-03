import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wallet,
  Award,
  ShieldCheck,
  Zap,
  PlusCircle,
  ArrowUpRight,
  FolderPlus,
  PackageCheck,
  Upload,
  FileText,
  Star,
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  Search,
  SlidersHorizontal
} from 'lucide-react';
import confetti from 'canvas-confetti';
import API from '../services/api';

const GIG_LIFECYCLE_META = {
  DRAFT: {
    label: 'Draft',
    className: 'bg-slate-500/10 border-slate-500/20 text-slate-300'
  },
  INCOMPLETE: {
    label: 'Incomplete',
    className: 'bg-amber-500/10 border-amber-500/20 text-amber-300'
  },
  PENDING_REVIEW: {
    label: 'Pending Review',
    className: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
  },
  PUBLISHED: {
    label: 'Published',
    className: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
  },
  PAUSED: {
    label: 'Paused',
    className: 'bg-amber-500/10 border-amber-500/20 text-amber-300'
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-red-500/10 border-red-500/20 text-red-300'
  },
  NEEDS_CHANGES: {
    label: 'Needs Changes',
    className: 'bg-orange-500/10 border-orange-500/20 text-orange-300'
  },
  ARCHIVED: {
    label: 'Archived',
    className: 'bg-slate-500/10 border-slate-500/20 text-slate-400'
  }
};


const getReputationLevel = (points = 0) => {
  if (points >= 1000) return { title: 'Legend', color: 'text-yellow-400' };
  if (points >= 500) return { title: 'Elite', color: 'text-purple-400' };
  if (points >= 250) return { title: 'Professional', color: 'text-indigo-400' };
  if (points >= 100) return { title: 'Trusted', color: 'text-emerald-400' };
  return { title: 'Rookie', color: 'text-slate-400' };
};


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


export default function StudentDashboard({ currentUser }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [walletData, setWalletData] = useState(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState('ALL');
  const [gigs, setGigs] = useState([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const [reviewForm, setReviewForm] = useState({
    overallRating: 5,
    communicationRating: 5,
    qualityRating: 5,
    timelinessRating: 5,
    comment: ""
  });

  const [withdrawForm, setWithdrawForm] = useState({ upiId: '', amount: '500' });

  const hasReviewedOrder = (order) => {
    return (order.reviews || []).some(
      review => review.reviewerId === currentUser?.id
    );
  };

  const getReviewCountForOrder = (order) => {
    return (order.reviews || []).length;
  };

  const profileChecklist = [
    Boolean(profileData?.profile?.avatarUrl),
    Boolean(profileData?.profile?.tagline?.trim()),
    Boolean(profileData?.profile?.category?.trim()),
    Boolean(profileData?.profile?.college?.trim()),
    Boolean(profileData?.profile?.bio?.trim()),
    Array.isArray(profileData?.profile?.skills) && profileData.profile.skills.length > 0
  ];

  const profileCompletion = profileChecklist.filter(Boolean).length;
  const profileCompletionPercent = Math.round(
    (profileCompletion / profileChecklist.length) * 100
  );

  const missingProfileItems = [
    !profileData?.profile?.avatarUrl && 'Profile photo',
    !profileData?.profile?.tagline?.trim() && 'Tagline',
    !profileData?.profile?.category?.trim() && 'Category',
    !profileData?.profile?.college?.trim() && 'College',
    !profileData?.profile?.bio?.trim() && 'Bio',
    !(Array.isArray(profileData?.profile?.skills) && profileData.profile.skills.length > 0) && 'Skills'
  ].filter(Boolean);

  const totalWithdrawn = payoutHistory.reduce(
    (total, payout) =>
      payout.status === 'APPROVED'
        ? total + Number(payout.amount || 0)
        : total,
    0
  );

  const activeOrders = orders.filter(order =>
    ['FUNDED_IN_ESCROW', 'REQUIREMENTS_SUBMITTED', 'IN_PROGRESS'].includes(order.status)
  );

  const revisionOrders = orders.filter(order => order.status === 'REVISION_REQUESTED');
  const deliveredOrders = orders.filter(order => order.status === 'DELIVERED');
  const attentionOrders = [...revisionOrders, ...deliveredOrders];

  const actionStatus = revisionOrders.length > 0
    ? 'Revision needed'
    : deliveredOrders.length > 0
      ? 'Review pending'
      : activeOrders.length > 0
        ? 'Work in progress'
        : 'Ready';

  const filteredOrders = orders.filter(order => {
    const query = orderSearch.trim().toLowerCase();

    const matchesSearch =
      !query ||
      order.id?.toLowerCase().includes(query) ||
      order.client?.fullName?.toLowerCase().includes(query) ||
      order.status?.toLowerCase().includes(query);

    const matchesFilter =
      orderFilter === 'ALL'
        || order.status === orderFilter
        || (orderFilter === 'ACTIVE' && [
          'FUNDED_IN_ESCROW',
          'REQUIREMENTS_SUBMITTED',
          'IN_PROGRESS',
          'DELIVERED',
          'REVISION_REQUESTED'
        ].includes(order.status));

    return matchesSearch && matchesFilter;
  });


  useEffect(() => {
    API.get('/notifications/stats')
      .then(res => setUnreadNotificationCount(res.data?.unread || 0))
      .catch(() => {});

    API.get('/notifications')
      .then(res => {
        const notifications = Array.isArray(res.data)
          ? res.data
          : (res.data?.notifications || []);

        setRecentNotifications(notifications.slice(0, 3));
      })
      .catch(() => {});

    API.get('/payouts/my')
      .then(res => setPayoutHistory(res.data || []))
      .catch(() => {});

    API.get('/payouts/wallet')
      .then(res => setWalletData(res.data || null))
      .catch(() => {});

    if (currentUser?.id) {
      API.get(`/users/${currentUser.id}`)
        .then(res => setProfileData(res.data || null))
        .catch(() => {});
    }

    API.get('/orders').then(res => setOrders(res.data || [])).catch(() => {});
    API.get('/gigs/mine').then(res => setGigs(res.data || [])).catch(() => {});
    API.get('/jobs')
      .then(res => {
        const jobs = res.data || [];
        const uniqueJobs = Array.from(
          new Map(
            jobs.map(job => [
              `${job.title}|${job.category}|${job.client?.fullName || ''}|${job.budget}`,
              job
            ])
          ).values()
        );
        setRecommendedJobs(uniqueJobs);
      })
      .catch(() => {});
  }, [currentUser?.id]);

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

  const handleWithdraw = async (e) => {
    e.preventDefault();

    try {
      await API.post('/payouts', {
        amount: Number(withdrawForm.amount),
        upiId: withdrawForm.upiId
      });

      alert('Withdrawal request submitted successfully.');

      setShowWithdrawModal(false);

      setWithdrawForm({
        upiId: '',
        amount: '500'
      });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit withdrawal request.');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 pb-16">
      {/* REQ22 Workspace Sidebar */}
      <aside className="lg:w-60 shrink-0">
        <div className="glass-panel rounded-3xl border border-slate-800 p-3 lg:sticky lg:top-24">
          <div className="hidden lg:block px-3 py-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-400">
              Workspace
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Your freelance control center
            </p>
          </div>

          <nav className="mobile-workspace-nav flex lg:block gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
            <a href="#overview" className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 text-white text-sm font-black">
              <LayoutDashboard className="w-4 h-4 text-indigo-400" />
              Home
            </a>

            <Link to="/student/gigs" className="flex items-center gap-3 px-3 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-900/70 text-sm font-black transition">
              <Briefcase className="w-4 h-4 text-slate-500" />
              My Gigs
            </Link>

            <Link to="/student/orders" className="flex items-center gap-3 px-3 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-900/70 text-sm font-black transition">
              <PackageCheck className="w-4 h-4 text-slate-500" />
              My Orders
            </Link>

            <Link to="/notifications" className="flex items-center justify-between gap-3 px-3 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-900/70 text-sm font-black transition">
              <span className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-slate-500" />
                Notifications
              </span>

              {unreadNotificationCount > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </span>
              )}
            </Link>

            <a href="#wallet" className="flex items-center gap-3 px-3 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-900/70 text-sm font-black transition">
              <Wallet className="w-4 h-4 text-slate-500" />
              Payments
            </a>

            <Link to={`/profile/${currentUser?.id}`} className="flex items-center gap-3 px-3 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-900/70 text-xs font-black transition">
              <Award className="w-4 h-4 text-slate-500" />
              My Profile
            </Link>
          </nav>

          <div className="mt-4 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => navigate('/student/gigs/create')}
              className="w-full px-3 py-3 rounded-2xl neon-airflow-btn text-white text-xs font-black flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Publish New Gig
            </button>
          </div>
        </div>
      </aside>

      <main id="overview" className="min-w-0 flex-1 space-y-6">

      {/* REQ22 Premium Workspace Header */}
      <section className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-6 sm:p-8 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 p-[2px]">
                <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-indigo-300" />
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-400">
                    Student Freelancer Workspace
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400">
                    <ShieldCheck className="w-3 h-3" />
                    Active
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white mt-2">
                  Welcome back, {currentUser?.fullName}
                </h1>

                <p className="text-xs text-slate-400 mt-1">
                  {currentUser?.email} • {currentUser?.age || 20} Years Old
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to={`/profile/${currentUser?.id}`}
                className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-white rounded-xl text-xs font-black transition flex items-center gap-2"
              >
                <Award className="w-4 h-4 text-indigo-400" />
                Manage Verification
              </Link>

              <button
                onClick={() => navigate('/student/gigs/create')}
                className="px-4 py-2.5 neon-airflow-btn text-white rounded-xl text-xs font-black shadow-lg flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Publish New Gig
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* REQ22 Premium KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="glass-panel rounded-3xl border border-slate-800 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Cleared Funds
            </span>
            <Wallet className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="text-3xl font-black text-emerald-400 mt-3">
            ₹{Number(walletData?.availableBalance || 0).toLocaleString('en-IN')}
          </div>

          <p className="text-sm font-bold text-emerald-300 mt-1">
            Available to withdraw
          </p>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="rounded-xl bg-amber-500/5 border border-amber-500/15 px-3 py-2.5">
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                Pending
              </p>
              <p className="text-sm font-black text-amber-300 mt-1">
                ₹{Number(walletData?.pendingBalance || 0).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="rounded-xl bg-slate-900/70 border border-slate-800 px-3 py-2.5">
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                Withdrawn
              </p>
              <p className="text-sm font-black text-slate-300 mt-1">
                ₹{Number(totalWithdrawn || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={Number(walletData?.availableBalance || 0) <= 0}
            className="mt-4 w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-xs font-black flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {Number(walletData?.availableBalance || 0) > 0 ? 'Withdraw via UPI' : 'No Funds Available'}
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="glass-panel rounded-3xl border border-slate-800 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Proposal Quota
            </span>
            <Zap className="w-5 h-5 text-amber-400" />
          </div>

          <div className="text-3xl font-black text-amber-400 mt-3">
            {currentUser?.freeBidsRemaining ?? 15}
          </div>

          <p className="text-xs text-slate-500 mt-1">
            Free bids remaining
          </p>

          <div className="mt-4 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
              style={{
                width: `${Math.min(((currentUser?.freeBidsRemaining ?? 15) / 20) * 100, 100)}%`
              }}
            />
          </div>
        </div>

        <div className="glass-panel rounded-3xl border border-slate-800 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Student Reputation
            </span>
            <Award className="w-5 h-5 text-indigo-400" />
          </div>

          <div className="text-3xl font-black text-white mt-3">
            {currentUser?.points ?? 50}
          </div>

          <div className={`text-xs font-black mt-1 ${getReputationLevel(currentUser?.points ?? 50).color}`}>
            {getReputationLevel(currentUser?.points ?? 50).title}
          </div>

          <p className="text-[10px] text-emerald-400 font-bold mt-4">
            0/3 Strikes • Excellent Standing
          </p>
        </div>
      </section>

      {/* REQ22 Withdrawal History */}
      <section id="wallet" className="glass-panel rounded-3xl border border-slate-800 p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-400">
              Wallet Activity
            </p>
            <h3 className="text-lg font-black text-white mt-1">
              Withdrawal History
            </h3>
          </div>

          <span className="text-[10px] font-black text-slate-500">
            {payoutHistory.length} request{payoutHistory.length === 1 ? '' : 's'}
          </span>
        </div>

        {payoutHistory.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 px-5 py-8 text-center">
            <Wallet className="w-6 h-6 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-500 mt-3">
              No withdrawal requests yet.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {payoutHistory.slice(0, 5).map((payout) => {
              const status = payout.status || 'PENDING';
              const statusClass =
                status === 'APPROVED'
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : status === 'REJECTED'
                    ? 'text-red-400 bg-red-500/10 border-red-500/20'
                    : 'text-amber-400 bg-amber-500/10 border-amber-500/20';

              return (
                <div
                  key={payout.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-black text-white">
                      ₹{payout.amount}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {payout.method || 'UPI'} • {new Date(payout.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <span className={`self-start sm:self-auto px-2.5 py-1 rounded-full border text-[10px] font-black ${statusClass}`}>
                    {status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* REQ22 Profile Snapshot */}
      <section className="glass-panel rounded-3xl border border-slate-800 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 p-[2px]">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-xl font-black text-white overflow-hidden">
                {profileData?.profile?.avatarUrl ? (
                  <img
                    src={profileData.profile.avatarUrl}
                    alt={profileData?.fullName || currentUser?.fullName || 'Profile'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  currentUser?.fullName?.charAt(0) || 'S'
                )}
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-black text-white">
                  {currentUser?.fullName}
                </h3>
                <span className="px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400">
                  Student Freelancer
                </span>
              </div>

              <p className="text-xs text-slate-500 mt-1">
                Keep your profile complete and client-ready.
              </p>

              <div className="mt-3 max-w-md">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider">
                  <span className="text-slate-500">Profile readiness</span>
                  <span className={profileCompletionPercent === 100 ? 'text-emerald-400' : 'text-indigo-400'}>
                    {profileCompletionPercent}%
                  </span>
                </div>

                <div className="mt-1.5 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                    style={{ width: `${profileCompletionPercent}%` }}
                  />
                </div>

                <p className="text-xs text-slate-500 mt-2">
                  {profileCompletionPercent === 100
                    ? 'Your profile is complete and client-ready.'
                    : `${missingProfileItems.length} item${missingProfileItems.length === 1 ? '' : 's'} still needed: ${missingProfileItems.slice(0, 3).join(', ')}${missingProfileItems.length > 3 ? '…' : ''}`}
                </p>
              </div>
            </div>
          </div>

          <Link
            to={`/profile/${currentUser?.id}`}
            className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-white rounded-xl text-xs font-black transition text-center"
          >
            Open My Profile
          </Link>
        </div>
      </section>

      {/* REQ22 Action Center */}
      <section className="glass-panel rounded-3xl border border-slate-800 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-400">
              Action Center
            </p>
            <h3 className="text-lg font-black text-white mt-1">
              Your workspace at a glance
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2.5 min-w-0">
              <p className="text-[9px] font-black uppercase text-slate-500">Active Work</p>
              <p className="text-xl font-black text-white mt-1">{activeOrders.length}</p>
            </div>

            <a
              href="#orders"
              className={`rounded-xl border px-3 py-2.5 min-w-0 transition ${
                attentionOrders.length
                  ? 'border-amber-500/20 bg-amber-500/5 hover:border-amber-400/40'
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
              }`}
              aria-label="Jump to orders requiring attention"
            >
              <p className="text-[9px] font-black uppercase text-slate-500">Attention</p>
              <p className={`text-xl font-black mt-1 ${attentionOrders.length ? 'text-amber-300' : 'text-white'}`}>
                {attentionOrders.length}
              </p>
            </a>

            <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2.5 min-w-0">
              <p className="text-[9px] font-black uppercase text-slate-500">Gigs</p>
              <p className="text-xl font-black text-white mt-1">{gigs.length}</p>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 min-w-0">
              <p className="text-[9px] font-black uppercase text-slate-500">Available</p>
              <p className="text-lg font-black text-emerald-300 mt-1">
                ₹{Number(walletData?.availableBalance || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => navigate('/student/gigs/create')}
            className="rounded-xl border border-slate-800 bg-slate-950/40 hover:border-indigo-500/40 px-3 py-3 text-left transition"
          >
            <PlusCircle className="w-4 h-4 text-indigo-400" />
            <p className="text-xs font-black text-white mt-2">Publish Gig</p>
          </button>

          <Link
            to="/jobs"
            className="rounded-xl border border-slate-800 bg-slate-950/40 hover:border-indigo-500/40 px-3 py-3 transition"
          >
            <Briefcase className="w-4 h-4 text-cyan-400" />
            <p className="text-xs font-black text-white mt-2">Find Work</p>
          </Link>

          <Link
            to={`/profile/${currentUser?.id}`}
            className="rounded-xl border border-slate-800 bg-slate-950/40 hover:border-indigo-500/40 px-3 py-3 transition"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <p className="text-xs font-black text-white mt-2">Verification</p>
          </Link>

          <Link
            to={`/profile/${currentUser?.id}`}
            className="rounded-xl border border-slate-800 bg-slate-950/40 hover:border-indigo-500/40 px-3 py-3 transition"
          >
            <Award className="w-4 h-4 text-violet-400" />
            <p className="text-xs font-black text-white mt-2">My Profile</p>
          </Link>
        </div>
      </section>

      {/* REQ23 Recent Activity */}
      <section className="glass-panel rounded-3xl border border-slate-800 p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-400">
              Recent Activity
            </p>
            <h3 className="text-lg font-black text-white mt-1">
              Latest updates
            </h3>
          </div>

          <Link
            to="/notifications"
            className="text-xs font-black text-indigo-400 hover:text-indigo-300 transition"
          >
            View All →
          </Link>
        </div>

        {recentNotifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 px-5 py-7 text-center">
            <MessageSquare className="w-6 h-6 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-500 mt-3">
              No recent notifications.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-2xl border px-4 py-3 transition ${
                  notification.isRead
                    ? 'border-slate-800 bg-slate-950/30'
                    : 'border-indigo-500/30 bg-indigo-500/5 shadow-[0_0_24px_rgba(99,102,241,0.06)]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${
                      notification.isRead
                        ? 'bg-slate-700'
                        : 'bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.7)]'
                    }`}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black text-white">
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black uppercase tracking-wider text-indigo-300">
                          New
                        </span>
                      )}
                    </div>

                    <p className="text-sm leading-6 text-slate-400 mt-1.5 line-clamp-2">
                      {notification.message}
                    </p>

                    <p className="text-xs text-slate-600 mt-2">
                      {new Date(notification.createdAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* REQ23 My Gigs */}
      <section id="gigs" className="glass-panel rounded-3xl border border-slate-800 p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
              My Gigs
            </p>
            <h3 className="text-lg font-black text-white mt-1">
              Your latest gig lifecycle states
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/student/gigs"
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-white text-[11px] font-black transition"
            >
              View All Gigs
            </Link>

            <button
              type="button"
              onClick={() => navigate('/student/gigs/create')}
              className="px-3 py-2 rounded-xl neon-airflow-btn text-white text-[11px] font-black"
            >
              + Publish Gig
            </button>
          </div>
        </div>

        {gigs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 px-5 py-8 text-center">
            <Briefcase className="w-6 h-6 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-500 mt-3">
              You have not created any gigs yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {gigs.slice(0, 2).map((gig) => {
              const firstPackage = gig.packages?.[0];
              const lifecycle = GIG_LIFECYCLE_META[gig.status] || {
                label: 'Unknown',
                className: 'bg-slate-500/10 border-slate-500/20 text-slate-400'
              };

              return (
                <article
                  key={gig.id}
                  className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/40 hover:border-cyan-500/30 transition"
                >
                  <div className="h-32 bg-slate-900 overflow-hidden">
                    <img
                      src={gig.coverImage}
                      alt={gig.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                        {gig.category || 'Service'}
                      </span>

                      <span
                        className={`px-2.5 py-1 rounded-full border text-[10px] font-black ${lifecycle.className}`}
                        title={lifecycle.label}
                      >
                        {lifecycle.label}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-white mt-2 line-clamp-2">
                      {gig.title}
                    </h4>

                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                      {gig.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <div className="rounded-xl bg-slate-900/80 border border-slate-800 px-3 py-2.5">
                        <p className="text-[9px] uppercase font-black tracking-wider text-slate-600">
                          Starting price
                        </p>
                        <p className="text-lg font-black text-emerald-400 mt-1">
                          ₹{Number(firstPackage?.price || 0).toLocaleString('en-IN')}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-900/80 border border-slate-800 px-3 py-2.5">
                        <p className="text-[9px] uppercase font-black tracking-wider text-slate-600">
                          Delivery
                        </p>
                        <p className="text-sm font-black text-white mt-1">
                          {firstPackage?.deliveryDays ?? '-'} days
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 mt-4">
                      <span className="text-xs text-slate-500">
                        {gig.subcategory || gig.category || 'Student service'}
                      </span>
                      <span className="text-xs font-bold text-cyan-300">
                        {gig.packages?.length || 1} package{gig.packages?.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    <Link
                      to={`/gigs`}
                      className="block mt-4 w-full text-center px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-white text-xs font-black transition"
                    >
                      Manage My Gigs →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div id="orders"></div>

      {/* Student's Orders */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-400">
              Project Workspace
            </p>
            <h3 className="text-lg font-black text-white mt-1">
              Active Client Orders ({orders.length})
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search orders..."
                className="w-full sm:w-56 pl-9 pr-3 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/40"
              />
            </div>

            <div className="relative">
              <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <select
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value)}
                className="appearance-none w-full sm:w-40 pl-9 pr-8 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500/40"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Work</option>
                <option value="FUNDED_IN_ESCROW">Funded</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DELIVERED">Delivered</option>
                <option value="REVISION_REQUESTED">Revision</option>
                <option value="COMPLETED">Completed</option>
                <option value="DISPUTED">Disputed</option>
                <option value="CANCELLED_REFUNDED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/40 px-6 py-10 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Briefcase className="w-7 h-7 text-indigo-400" />
            </div>

            <h4 className="text-lg font-black text-white mt-4">
              Your workspace is ready for its first project
            </h4>

            <p className="max-w-lg mx-auto text-xs leading-6 text-slate-500 mt-2">
              Publish a service or explore open client jobs to start building your freelance portfolio.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => navigate('/student/gigs/create')}
                className="px-4 py-2.5 neon-airflow-btn text-white rounded-xl text-xs font-black flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Publish a Gig
              </button>

              <Link
                to="/jobs"
                className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-white rounded-xl text-xs font-black transition flex items-center gap-2"
              >
                Browse Jobs
                <ArrowUpRight className="w-4 h-4 text-indigo-400" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders
              .filter(order => !['PENDING_PAYMENT', 'CANCELLED_REFUNDED'].includes(order.status))
              .map(order => {
                const statusLabels = {
                  FUNDED_IN_ESCROW: 'Funded in Escrow',
                  REQUIREMENTS_SUBMITTED: 'Requirements Submitted',
                  IN_PROGRESS: 'In Progress',
                  DELIVERED: 'Delivered — Client Review',
                  REVISION_REQUESTED: 'Revision Requested',
                  COMPLETED: 'Completed',
                  DISPUTED: 'Disputed'
                };

                const statusClass =
                  order.status === 'COMPLETED'
                    ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
                    : order.status === 'REVISION_REQUESTED'
                      ? 'text-amber-300 bg-amber-500/10 border-amber-500/20'
                      : order.status === 'DISPUTED'
                        ? 'text-red-300 bg-red-500/10 border-red-500/20'
                        : 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20';

                const daysRemaining = order.deadline
                  ? Math.ceil((new Date(order.deadline).getTime() - Date.now()) / 86400000)
                  : null;

                const nextAction =
                  order.status === 'REVISION_REQUESTED'
                    ? 'Review the requested changes and resubmit.'
                    : order.status === 'DELIVERED'
                      ? 'Waiting for client review.'
                      : order.status === 'COMPLETED'
                        ? 'Project complete and payout finalized.'
                        : 'Continue working toward delivery.';

                return (
                  <div
                    key={order.id}
                    className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl hover:border-indigo-500/30 transition"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-indigo-400">
                            Order #{order.id.slice(0, 8)}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full border text-[10px] font-black ${statusClass}`}>
                            {statusLabels[order.status] || order.status}
                          </span>
                        </div>

                        <h4 className="text-base font-black text-white mt-2 truncate">
                          {order.job?.title || order.gig?.title || 'Client Project'}
                        </h4>

                        <p className="text-sm text-slate-400 mt-1">
                          Client: {order.client?.fullName || 'Client'}
                        </p>

                        <p className="text-sm text-slate-500 mt-2">
                          {nextAction}
                        </p>

                        {daysRemaining != null && order.status !== 'COMPLETED' && (
                          <p className={`text-xs font-bold mt-2 ${
                            daysRemaining < 0 ? 'text-red-300' : 'text-slate-500'
                          }`}>
                            {daysRemaining < 0
                              ? `${Math.abs(daysRemaining)} day(s) overdue`
                              : `${daysRemaining} day(s) remaining`}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
                        <div className="sm:text-right">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                            Order Value
                          </p>
                          <p className="text-xl font-black text-emerald-400 mt-1">
                            ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Expected payout ₹{Number(order.sellerEarnings || 0).toLocaleString('en-IN')}
                          </p>
                        </div>

                        {order.status === 'COMPLETED' && (
                          hasReviewedOrder(order) ? (
                            <span className="px-3 py-2 bg-emerald-600/20 border border-emerald-500/20 text-emerald-300 text-xs font-black rounded-xl">
                              Review Submitted
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedOrderId(order.id);
                                setShowReviewModal(true);
                              }}
                              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black rounded-xl"
                            >
                              Leave Review
                            </button>
                          )
                        )}

                        <Link
                          to={`/orders/${order.id}`}
                          className="px-4 py-2.5 neon-airflow-btn text-white text-xs font-black rounded-xl text-center"
                        >
                          Open Project Room →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* REQ22 Recommended Work */}
      <section className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-400">
              Recommended Work
            </p>
            <h3 className="text-xl font-black text-white mt-1">
              Opportunities you can bid on
            </h3>
          </div>

          <Link
            to="/jobs"
            className="text-xs font-black text-indigo-400 hover:text-indigo-300 transition"
          >
            View all jobs →
          </Link>
        </div>

        {recommendedJobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 p-6 text-center">
            <p className="text-xs text-slate-500">
              No open jobs are available right now.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {recommendedJobs.slice(0, 4).map((job) => (
              <article
                key={job.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5 hover:border-indigo-500/40 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                      {job.category || 'Open Project'}
                    </span>

                    <h4 className="text-sm font-black text-white mt-2 line-clamp-2">
                      {job.title}
                    </h4>
                  </div>

                  <span className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400">
                    ₹{job.budget}
                  </span>
                </div>

                <p className="text-xs leading-5 text-slate-500 mt-3 line-clamp-2">
                  {job.description}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                  <div className="rounded-xl bg-slate-900/80 border border-slate-800 px-3 py-2.5">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                      Budget
                    </p>
                    <p className="text-sm font-black text-emerald-300 mt-1">
                      ₹{Number(job.budget || 0).toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-900/80 border border-slate-800 px-3 py-2.5">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                      Proposals
                    </p>
                    <p className="text-sm font-black text-white mt-1">
                      {job.bids?.length || 0}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-900/80 border border-slate-800 px-3 py-2.5 col-span-2 sm:col-span-1">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                      Client
                    </p>
                    <p className="text-sm font-black text-white mt-1 truncate">
                      {job.client?.fullName || 'Client'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 mt-4">
                  <span className="text-xs text-slate-500">
                    Review the scope before bidding.
                  </span>
                  <span className="text-xs font-bold text-indigo-300">
                    {job.category || 'Open project'}
                  </span>
                </div>

                <div className="flex gap-2 mt-5">
                  <Link
                    to={`/jobs/${job.id}`}
                    className="flex-1 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-center text-[11px] font-black text-white transition"
                  >
                    View Details
                  </Link>

                  <Link
                    to={`/jobs/${job.id}`}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black transition"
                  >
                    Bid Now
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      </main>



      {/* Modals */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="neon-border-box max-w-md w-full p-7 shadow-2xl relative">
            <button onClick={() => setShowWithdrawModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white">✕</button>
            <h3 className="text-xl font-black text-white mb-4">Withdraw via UPI</h3>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <input required type="text" value={withdrawForm.upiId} onChange={e => setWithdrawForm({...withdrawForm, upiId: e.target.value})} placeholder="Enter UPI ID (e.g. name@okhdfcbank)" className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white" />
              <input required type="number" min="100" value={withdrawForm.amount} onChange={e => setWithdrawForm({...withdrawForm, amount: e.target.value})} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white font-bold" />
              <button type="submit" className="w-full py-3.5 neon-airflow-btn text-white text-xs font-black rounded-2xl uppercase">Submit Instant Withdrawal</button>
            </form>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 w-full max-w-lg">
            <h3 className="text-xl font-black text-white mb-5">
              Leave Review
            </h3>

            <form onSubmit={handleSubmitReview} className="space-y-4">

                <StarRating
                  value={reviewForm.overallRating}
                  onChange={(v) =>
                    setReviewForm({
                      ...reviewForm,
                      overallRating: v
                    })
                  }
                />
                <p className="text-xs text-amber-400 -mt-2">
                  ⭐ Rate overall experience with the client
                </p>

                <StarRating
                  value={reviewForm.communicationRating}
                  onChange={(v) =>
                    setReviewForm({
                      ...reviewForm,
                      communicationRating: v
                    })
                  }
                />
                <p className="text-xs text-cyan-400 -mt-2">
                  💬 How well did the client communicate?
                </p>

                <StarRating
                  value={reviewForm.qualityRating}
                  onChange={(v) =>
                    setReviewForm({
                      ...reviewForm,
                      qualityRating: v
                    })
                  }
                />
                <p className="text-xs text-purple-400 -mt-2">
                  📋 Were requirements clear and detailed?
                </p>

                <StarRating
                  value={reviewForm.timelinessRating}
                  onChange={(v) =>
                    setReviewForm({
                      ...reviewForm,
                      timelinessRating: v
                    })
                  }
                />
                <p className="text-xs text-emerald-400 -mt-2">
                  💰 Was payment handled professionally?
                </p>

                <textarea
                rows="4"
                required
                value={reviewForm.comment}
                onChange={e => setReviewForm({...reviewForm, comment:e.target.value})}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white"
                placeholder="Write your review..."
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-5 py-2 bg-slate-700 text-white rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 text-white rounded-xl font-black"
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
