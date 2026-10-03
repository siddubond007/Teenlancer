import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Users, Briefcase, Trash2, Ban, CheckCircle2, 
  Search, AlertTriangle, ArrowUpRight, Award, Lock, RefreshCw, Eye, KeyRound, Mail, LogIn, LogOut,
  GraduationCap, Upload, Clock, Check, ExternalLink, History, ChevronDown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import API from '../services/api';
import { sanitizeRichTextHtml } from '../utils/richText.js';

export default function AdminDashboard({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    studentCount: 0,
    clientCount: 0,
    totalJobs: 0,
    totalOrders: 0,
    moderationLogs: 0,
    averageRating: 0,
    totalReviews: 0,
    totalReputationPoints: 0,
    verifiedStudents: 0,
    flaggedReviews: 0,
    hiddenReviews: 0
  });
  const [moderationLogs, setModerationLogs] = useState([]);
  const [gigModerationQueue, setGigModerationQueue] = useState([]);
  const [gigRevisionHistory, setGigRevisionHistory] = useState({});
  const [gigRevisionLoading, setGigRevisionLoading] = useState({});
  const [gigRevisionErrors, setGigRevisionErrors] = useState({});
  const [verifications, setVerifications] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [investigationReport, setInvestigationReport] = useState(null);
  const [investigationLoading, setInvestigationLoading] = useState(false);
  const [selectedInvestigationUser, setSelectedInvestigationUser] = useState(null);
  const [investigationHistory, setInvestigationHistory] = useState([]);
  const [investigationNote, setInvestigationNote] = useState('');
  const [fraudStats, setFraudStats] = useState({
    suspiciousAccounts: 0,
    highRiskUsers: 0,
    reviewAbuseCases: 0,
    verificationAbuseCases: 0,
    disputeAbuseCases: 0
  });
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);

  // Login Form State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes, logsRes, gigModerationRes, verifRes, payoutsRes, disputesRes, reviewsRes, fraudRes, auditRes] = await Promise.all([
        API.get('/admin/users'),
        API.get('/admin/stats'),
        API.get('/admin/moderation-logs'),
        API.get('/admin/gig-moderation'),
        API.get('/admin/verifications'),
        API.get('/admin/payouts'),
        API.get('/disputes'),
        API.get('/admin/reviews'),
        API.get('/admin/fraud'),
        API.get('/admin/audit-logs')
      ]);

      setUsers(usersRes.data || []);
      setStats(statsRes.data || {});
      setModerationLogs(logsRes.data || []);
      setGigModerationQueue(gigModerationRes.data || []);
      setVerifications(verifRes.data || []);
      setPayouts(payoutsRes.data || []);
      setDisputes(disputesRes.data || []);
      setReviews(reviewsRes.data || []);
      setFraudStats(fraudRes.data || {});
      setAuditLogs(auditRes.data || []);
      setIsAdminLoggedIn(true);
    } catch (err) {
      console.error('Fetch Admin Data Error:', err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        setIsAdminLoggedIn(false);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchAdminData();
    }
  }, []);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await API.post('/auth/login', {
        email: adminEmail,
        password: adminPassword
      });

      if (res.data.user?.role !== 'ADMIN') {
        setLoginError('Access Denied: This account is not an Administrator.');
        return;
      }

      localStorage.setItem('token', res.data.token);
      confetti();
      setIsAdminLoggedIn(true);
      fetchAdminData();
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Admin login failed.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleMasterUnlock = async () => {
    const masterKey = window.prompt('Enter Master Admin Key:');
    if (!masterKey) return;

    try {
      const res = await API.post('/auth/admin-login', { masterKey });
      localStorage.setItem('token', res.data.token);
      confetti();
      setIsAdminLoggedIn(true);
      fetchAdminData();
      alert('👑 Master Admin Access Granted!');
    } catch (err) {
      alert('Access Denied: ' + (err.response?.data?.error || 'Invalid Key'));
    }
  };

  const handleGigModeration = async (gigId, status, defaultReasonCode = '') => {
    let reasonCode = defaultReasonCode;
    let reason = '';

    if (status !== 'PUBLISHED') {
      reasonCode = window.prompt(
        'Enter moderation reason code:',
        defaultReasonCode || 'POLICY_REVIEW'
      );
      if (reasonCode === null || !reasonCode.trim()) return;

      reason = window.prompt('Enter moderation notes (optional):', '');
      if (reason === null) return;
    }

    try {
      await API.put(`/admin/gig-moderation/${gigId}`, {
        status,
        reasonCode: reasonCode?.trim() || null,
        reason: reason?.trim() || null
      });

      if (status === 'PUBLISHED') {
        confetti();
        alert('✅ Gig approved and published.');
      } else if (status === 'NEEDS_CHANGES') {
        alert('📝 Gig marked as Needs Changes.');
      } else {
        alert('❌ Gig rejected.');
      }

      fetchAdminData();
    } catch (err) {
      alert('Failed to update gig moderation: ' + (err.response?.data?.error || err.message));
    }
  };

  const loadGigRevisionHistory = async (gigId) => {
    if (gigRevisionHistory[gigId] || gigRevisionLoading[gigId]) return;

    setGigRevisionLoading((previous) => ({ ...previous, [gigId]: true }));
    setGigRevisionErrors((previous) => {
      const next = { ...previous };
      delete next[gigId];
      return next;
    });

    try {
      const response = await API.get(`/gigs/${gigId}/revisions`);
      setGigRevisionHistory((previous) => ({
        ...previous,
        [gigId]: response.data?.revisions || []
      }));
    } catch (err) {
      setGigRevisionErrors((previous) => ({
        ...previous,
        [gigId]:
          err.response?.data?.error ||
          'Failed to load gig version history.'
      }));
    } finally {
      setGigRevisionLoading((previous) => {
        const next = { ...previous };
        delete next[gigId];
        return next;
      });
    }
  };

  // Document Verification Actions (Independent College ID & Govt ID)
  const handleApproveVerification = async (id, docType) => {
    try {
      await API.put(`/admin/verifications/${id}/status`, { type: docType, status: 'APPROVED' });
      confetti();
      alert(`✅ ${docType === 'COLLEGE' ? 'College Student ID' : 'Government Identity ID'} Approved!`);
      fetchAdminData();
    } catch (err) {
      alert('Failed to approve: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleRejectVerification = async (id, docType) => {
    const reason = window.prompt(`Enter rejection reason for ${docType === 'COLLEGE' ? 'College ID' : 'Govt ID'} (optional):`, 'Document image was blurry or unreadable.');
    if (reason === null) return;
    try {
      await API.put(`/admin/verifications/${id}/status`, { type: docType, status: 'REJECTED', reason });
      alert(`❌ ${docType === 'COLLEGE' ? 'College ID' : 'Govt ID'} marked as Rejected.`);
      fetchAdminData();
    } catch (err) {
      alert('Failed to reject: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${userName}"? This cannot be undone.`)) return;

    try {
      await API.delete(`/admin/users/${userId}`);
      alert(`User "${userName}" deleted from PostgreSQL database.`);
      fetchAdminData();
    } catch (err) {
      alert('Failed to delete user: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleToggleSuspend = async (userId) => {
    try {
      const res = await API.put(`/admin/users/${userId}/suspend`);
      alert(res.data.message);
      fetchAdminData();
    } catch (err) {
      alert('Failed to update suspension: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await API.put(`/admin/users/${userId}/role`, { role: newRole });
      alert(`User role changed to ${newRole}`);
      fetchAdminData();
    } catch (err) {
      alert('Failed to update role: ' + (err.response?.data?.error || err.message));
    }
  };


  const handleApprovePayout = async (payoutId) => {
    try {
      await API.put(`/admin/payouts/${payoutId}/approve`);
      alert('Payout approved successfully.');
      fetchAdminData();
    } catch (err) {
      alert('Failed to approve payout: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleRejectPayout = async (payoutId) => {
    try {
      await API.put(`/admin/payouts/${payoutId}/reject`);
      alert('Payout rejected and funds returned.');
      fetchAdminData();
    } catch (err) {
      alert('Failed to reject payout: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleResolveDispute = async (disputeId, decision) => {
    try {
      await API.put(`/disputes/${disputeId}/resolve`, {
        decision
      });

      alert('Dispute resolved successfully.');
      fetchAdminData();
    } catch (err) {
      alert('Failed to resolve dispute: ' + (err.response?.data?.error || err.message));
    }
  };


  const handleHideReview = async (reviewId) => {
    const reason = window.prompt('Reason for hiding review:', 'Hidden by admin');
    if (reason === null) return;

    try {
      await API.put(`/admin/reviews/${reviewId}/hide`, { reason });
      alert('Review hidden successfully.');
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleShowReview = async (reviewId) => {
    try {
      await API.put(`/admin/reviews/${reviewId}/show`);
      alert('Review restored successfully.');
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review permanently?')) return;

    try {
      await API.delete(`/admin/reviews/${reviewId}`);
      alert('Review deleted successfully.');
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };


  const handleInvestigateUser = async (userId) => {
    try {
      setSelectedInvestigationUser(userId);
      setInvestigationLoading(true);

      const response = await API.get(`/admin/fraud-investigation/${userId}`);

      setInvestigationReport(response.data);
      await loadInvestigationHistory(userId);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setInvestigationLoading(false);
    }
  };

  const loadInvestigationHistory = async (userId) => {
    try {
      const res = await API.get(`/admin/fraud-investigation/${userId}/history`);
      setInvestigationHistory(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddInvestigationNote = async () => {
    if (!selectedInvestigationUser) return;
    if (!investigationNote.trim()) return;

    try {
      await API.post(
        `/admin/fraud-investigation/${selectedInvestigationUser}/note`,
        { note: investigationNote }
      );

      setInvestigationNote('');
      await loadInvestigationHistory(selectedInvestigationUser);

      alert('Investigation note added.');
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleBanUser = async () => {
    if (!selectedInvestigationUser) return;

    if (!window.confirm('Ban this user?')) return;

    try {
      await API.post(
        `/admin/fraud-investigation/${selectedInvestigationUser}/ban`
      );

      await loadInvestigationHistory(selectedInvestigationUser);

      alert('User banned successfully.');
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleClearInvestigation = async () => {
    if (!selectedInvestigationUser) return;

    try {
      await API.post(
        `/admin/fraud-investigation/${selectedInvestigationUser}/clear`
      );

      await loadInvestigationHistory(selectedInvestigationUser);

      alert('Investigation cleared.');
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };


  const handleExportAuditLogs = async () => {
    try {
      const response = await API.get(
        '/admin/audit-logs/export',
        {
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data])
      );

      const link = document.createElement('a');
      link.href = url;
      link.download = 'audit-logs.csv';

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const filteredUsers = users.filter(u => {

    const matchesSearch = 
      (u.fullName && u.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.id && u.id.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredAuditLogs = auditLogs.filter(log => {
    const q = auditSearch.toLowerCase();

    return (
      (log.actionType || '').toLowerCase().includes(q) ||
      (log.adminId || '').toLowerCase().includes(q) ||
      (log.targetId || '').toLowerCase().includes(q) ||
      (log.details || '').toLowerCase().includes(q)
    );
  });

  const pendingVerifCount = verifications.filter(v => 
    (v.collegeIdStatus === 'PENDING' && v.idCardUrl) || 
    (v.govtIdStatus === 'PENDING' && v.nationalIdUrl) ||
    v.status === 'PENDING'
  ).length;

  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 glass-panel rounded-3xl border border-slate-800 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-indigo-600/20 border border-indigo-500/40 rounded-2xl flex items-center justify-center mx-auto text-indigo-400">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-white">Admin Console Access</h2>
          <p className="text-xs text-slate-400">Sign in with your Super Administrator credentials or use the Master Key.</p>
        </div>

        {loginError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 font-bold">
            {loginError}
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Admin Email</label>
            <input 
              type="email" 
              required 
              value={adminEmail} 
              onChange={e => setAdminEmail(e.target.value)} 
              placeholder="siddusiddharth80193@gmail.com" 
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-indigo-500" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Password</label>
            <input 
              type="password" 
              required 
              value={adminPassword} 
              onChange={e => setAdminPassword(e.target.value)} 
              placeholder="••••••••••••" 
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-indigo-500" 
            />
          </div>
          <button 
            type="submit" 
            disabled={loginLoading} 
            className="w-full py-3.5 neon-airflow-btn text-white text-xs font-black rounded-xl uppercase tracking-wider"
          >
            {loginLoading ? 'Authenticating...' : 'Sign In as Administrator'}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800 text-center">
          <button 
            onClick={handleMasterUnlock} 
            className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center justify-center space-x-1.5 mx-auto"
          >
            <KeyRound className="w-4 h-4" />
            <span>Direct Master Key Unlock</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950/60 p-6 rounded-3xl border border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-pink-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Master Admin Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">SkillLaunch Management Console</h1>
          <p className="text-xs text-slate-400 mt-1">Super Administrator Active • Full PostgreSQL Database Access</p>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={fetchAdminData} 
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white flex items-center space-x-2 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Database</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-black uppercase text-slate-400">Total Users</span>
          <div className="text-2xl font-black text-white">{stats.totalUsers || users.length}</div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-black uppercase text-indigo-400">Students</span>
          <div className="text-2xl font-black text-indigo-400">{stats.studentCount || users.filter(u => u.role === 'STUDENT_FREELANCER').length}</div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-black uppercase text-pink-400">Clients</span>
          <div className="text-2xl font-black text-pink-400">{stats.clientCount || users.filter(u => u.role === 'CLIENT').length}</div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-black uppercase text-emerald-400">Total Jobs</span>
          <div className="text-2xl font-black text-emerald-400">{stats.totalJobs || 0}</div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-black uppercase text-amber-400">Escrow Orders</span>
          <div className="text-2xl font-black text-amber-400">{stats.totalOrders || 0}</div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-black uppercase text-red-400">AI Flags</span>
          <div className="text-2xl font-black text-red-400">{moderationLogs.length}</div>
        </div>
      </div>


      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-black uppercase text-cyan-400">Avg Rating</span>
          <div className="text-2xl font-black text-cyan-400">
            {Number(stats.averageRating || 0).toFixed(1)}
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-black uppercase text-violet-400">Reviews</span>
          <div className="text-2xl font-black text-violet-400">
            {stats.totalReviews || 0}
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-black uppercase text-pink-400">Reputation</span>
          <div className="text-2xl font-black text-pink-400">
            {stats.totalReputationPoints || 0}
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-black uppercase text-emerald-400">Verified</span>
          <div className="text-2xl font-black text-emerald-400">
            {stats.verifiedStudents || 0}
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-black uppercase text-amber-400">Flagged Reviews</span>
          <div className="text-2xl font-black text-amber-400">
            {stats.flaggedReviews || 0}
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-black uppercase text-red-400">Hidden Reviews</span>
          <div className="text-2xl font-black text-red-400">
            {stats.hiddenReviews || 0}
          </div>
        </div>
      </div>

      {/* REQ21 Admin Security Analytics */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-black uppercase text-cyan-400">
            Admin Actions Today
          </span>
          <div className="text-2xl font-black text-cyan-400">
            {stats.adminActionsToday || 0}
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-black uppercase text-red-400">
            Failed Admin Logins
          </span>
          <div className="text-2xl font-black text-red-400">
            {stats.failedAdminLogins || 0}
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-black uppercase text-emerald-400">
            Active Admins
          </span>
          <div className="text-2xl font-black text-emerald-400">
            {stats.activeAdmins || 0}
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-black uppercase text-amber-400">
            Most Active Admin
          </span>
          <div className="text-sm font-black text-amber-400 break-all">
            {stats.mostActiveAdmin || 'N/A'}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-3 border-b border-slate-800 pb-3 text-xs font-black">
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-5 py-2.5 rounded-xl transition ${activeTab === 'users' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`
        }>
          Registered Users Directory ({filteredUsers.length})
        </button>
        <button 
          onClick={() => setActiveTab('verifications')}
          className={`px-5 py-2.5 rounded-xl transition flex items-center space-x-2 ${activeTab === 'verifications' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`
        }>
          <span>Student ID Verifications</span>
          {pendingVerifCount > 0 && (
            <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full animate-pulse">
              {pendingVerifCount} Pending
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('moderation')}
            className={`px-5 py-2.5 rounded-xl transition ${activeTab === 'moderation' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
          AI Chat Moderation Queue ({moderationLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('gigModeration')}
          className={`px-5 py-2.5 rounded-xl transition flex items-center gap-2 ${activeTab === 'gigModeration' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          Gig Moderation ({gigModerationQueue.length})
          {gigModerationQueue.length > 0 && (
            <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full">
              {gigModerationQueue.length} Pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('payouts')}
            className={`px-5 py-2.5 rounded-xl transition ${activeTab === 'payouts' ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          Withdrawal Requests ({payouts.length})
        </button>

        <button
          onClick={() => setActiveTab('disputes')}
          className={`px-5 py-2.5 rounded-xl transition ${activeTab === 'disputes' ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          Disputes ({disputes.length})
        </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-5 py-2.5 rounded-xl transition ${activeTab === 'reviews' ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Reviews ({reviews.length})
          </button>

          <button
            onClick={() => setActiveTab('fraud')}
            className={`px-5 py-2.5 rounded-xl transition ${activeTab === 'fraud' ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Fraud Detection
          </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-5 py-2.5 rounded-xl transition ${activeTab === 'audit' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Audit Trail ({auditLogs.length})
            </button>

      </div>

      {/* 1. USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="glass-panel rounded-3xl border border-slate-800 p-6 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search user by name, email, username, ID..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-indigo-500" 
              />
            </div>

            <div className="flex space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {['ALL', 'STUDENT_FREELANCER', 'CLIENT', 'ADMIN'].map(role => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    roleFilter === role ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {role === 'ALL' ? 'ALL' : role === 'STUDENT_FREELANCER' ? 'Students' : role}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-black uppercase text-slate-400">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">College / Category</th>
                  <th className="py-3 px-4">Age</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-pink-600 flex items-center justify-center text-xs font-black">
                        {user.fullName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div>{user.fullName}</div>
                        <span className="text-[10px] text-slate-400 font-normal">@{user.username || 'user'}</span>

                        {user.isBanned && (
                          <div className="mt-1">
                            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-bold">
                              BANNED
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{user.email}</td>
                    <td className="py-3.5 px-4">
                      <select 
                        value={user.role} 
                        onChange={e => handleChangeRole(user.id, e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold text-indigo-300 outline-none"
                      >
                        <option value="STUDENT_FREELANCER">Student</option>
                        <option value="CLIENT">Client</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="font-semibold text-white">{user.profile?.category || 'General'}</div>
                      <div className="text-[11px] text-slate-400">{user.profile?.college || 'Not set'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{user.age ? `${user.age} yrs` : '18 yrs'}</td>
                    <td className="py-3.5 px-4 text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link 
                          to={`/u/${user.username || user.id}`} 
                          target="_blank" 
                          className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg transition"
                          title="View Public Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button 
                          onClick={() => handleToggleSuspend(user.id)}
                          className={`p-2 rounded-lg transition ${
                            user.isSuspended ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30' : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                          title={user.isSuspended ? 'Unsuspend User' : 'Suspend User'}
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => handleInvestigateUser(user.id)}
                            className="p-2 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white rounded-lg transition"
                            title="Investigate User"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                          <button 
                          onClick={() => handleDeleteUser(user.id, user.fullName)}
                          className="p-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition"
                          title="Permanently Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* 2. UNIFIED SINGLE VERIFICATION QUEUE */}
      {activeTab === 'verifications' && (
        <div className="glass-panel rounded-3xl border border-slate-800 p-6 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-xl font-black text-white flex items-center space-x-2">
                <ShieldCheck className="w-6 h-6 text-indigo-400" />
                <span>Student ID Verification Requests ({verifications.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">Review College Student IDs and Government Photo IDs side-by-side to approve verified badges.</p>
            </div>
            <button 
              onClick={fetchAdminData} 
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl flex items-center space-x-2 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Queue</span>
            </button>
          </div>

          {verifications.length === 0 ? (
            <div className="p-16 text-center text-sm text-slate-500 bg-slate-950/40 border border-slate-900 rounded-2xl">
              No verification requests submitted yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {verifications.map((v) => (
                <div key={v.id} className="p-6 bg-slate-950 border border-slate-800/90 rounded-2xl space-y-6 shadow-xl">
                  {/* User Header with Clickable Username */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-900 pb-4">
                    <div>
                      <h4 className="text-lg font-black text-white">{v.user?.fullName || 'Student'}</h4>
                      <div className="flex items-center space-x-2 text-xs mt-1">
                        <Link 
                          to={`/u/${v.user?.username || v.user?.id}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline flex items-center space-x-1 transition cursor-pointer bg-indigo-950/60 hover:bg-indigo-900/80 px-2 py-0.5 rounded-lg border border-indigo-800/50"
                          title="Click to view student profile"
                        >
                          <span>@{v.user?.username || 'user'}</span>
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </Link>
                        <span className="text-slate-600 font-bold">•</span>
                        <span className="text-slate-400 font-medium">{v.user?.email}</span>
                      </div>
                      <p className="text-xs text-indigo-400/90 font-semibold mt-1">🏫 {v.collegeName || v.user?.profile?.college || 'College Student'}</p>
                    </div>
                    <span className="text-xs text-slate-500">Submitted: {new Date(v.createdAt).toLocaleString()}</span>
                  </div>

                  {/* Dual Documents Side-by-Side Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* 1. College Student ID Card */}
                    <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black uppercase text-indigo-400 flex items-center space-x-1.5">
                            <GraduationCap className="w-4 h-4" />
                            <span>1. College Student ID</span>
                          </span>
                          <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-md border ${
                            v.collegeIdStatus === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                            v.collegeIdStatus === 'PENDING' && v.idCardUrl ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse' :
                            v.idCardUrl ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'
                          }`}>
                            {v.idCardUrl ? (v.collegeIdStatus || 'PENDING') : 'Not Uploaded'}
                          </span>
                        </div>

                        {v.idCardUrl ? (
                          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 group h-48 flex items-center justify-center">
                            <img src={v.idCardUrl} alt="College ID" className="w-full h-full object-contain cursor-pointer transition transform group-hover:scale-105" onClick={() => window.open(v.idCardUrl, '_blank')} />
                            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center pointer-events-none">
                              <span className="text-xs font-bold text-white flex items-center space-x-1"><Eye className="w-4 h-4" /><span>Click to view full image</span></span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-48 flex items-center justify-center text-xs text-slate-500 bg-slate-950/50 rounded-xl border border-slate-800/40">Student has not uploaded College ID</div>
                        )}
                        {v.collegeRejectionReason && <p className="text-xs text-red-400 font-bold">Reason: {v.collegeRejectionReason}</p>}
                      </div>

                      {v.idCardUrl && (
                        <div className="flex space-x-2 pt-2">
                          <button 
                            onClick={() => handleApproveVerification(v.id, 'COLLEGE')} 
                            disabled={v.collegeIdStatus === 'APPROVED'} 
                            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition ${
                              v.collegeIdStatus === 'APPROVED' ? 'bg-emerald-900/40 text-emerald-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40'
                            }`}
                          >
                            {v.collegeIdStatus === 'APPROVED' ? '✓ College ID Approved' : 'Approve College ID'}
                          </button>
                          <button 
                            onClick={() => handleRejectVerification(v.id, 'COLLEGE')} 
                            className="px-4 py-2.5 bg-red-950/50 hover:bg-red-900/80 border border-red-800 text-red-300 text-xs font-bold rounded-xl transition"
                          >
                            Reject ID
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 2. Government Identity ID Document */}
                    <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black uppercase text-violet-400 flex items-center space-x-1.5">
                            <ShieldCheck className="w-4 h-4" />
                            <span>2. Government Identity ID</span>
                          </span>
                          <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-md border ${
                            v.govtIdStatus === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                            v.govtIdStatus === 'PENDING' && v.nationalIdUrl ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse' :
                            v.nationalIdUrl ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'
                          }`}>
                            {v.nationalIdUrl ? (v.govtIdStatus || 'PENDING') : 'Not Uploaded'}
                          </span>
                        </div>

                        {v.nationalIdUrl ? (
                          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 group h-48 flex items-center justify-center">
                            <img src={v.nationalIdUrl} alt="Government ID" className="w-full h-full object-contain cursor-pointer transition transform group-hover:scale-105" onClick={() => window.open(v.nationalIdUrl, '_blank')} />
                            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center pointer-events-none">
                              <span className="text-xs font-bold text-white flex items-center space-x-1"><Eye className="w-4 h-4" /><span>Click to view full image</span></span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-48 flex items-center justify-center text-xs text-slate-500 bg-slate-950/50 rounded-xl border border-slate-800/40">Student has not uploaded Govt ID</div>
                        )}
                        {v.govtRejectionReason && <p className="text-xs text-red-400 font-bold">Reason: {v.govtRejectionReason}</p>}
                      </div>

                      {v.nationalIdUrl && (
                        <div className="flex space-x-2 pt-2">
                          <button 
                            onClick={() => handleApproveVerification(v.id, 'GOVT')} 
                            disabled={v.govtIdStatus === 'APPROVED'} 
                            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition ${
                              v.govtIdStatus === 'APPROVED' ? 'bg-emerald-900/40 text-emerald-500 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-950/40'
                            }`}
                          >
                            {v.govtIdStatus === 'APPROVED' ? '✓ Govt ID Approved' : 'Approve Govt ID'}
                          </button>
                          <button 
                            onClick={() => handleRejectVerification(v.id, 'GOVT')} 
                            className="px-4 py-2.5 bg-red-950/50 hover:bg-red-900/80 border border-red-800 text-red-300 text-xs font-bold rounded-xl transition"
                          >
                            Reject ID
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}


      {/* 3. PAYOUT REQUESTS */}
      {activeTab === 'payouts' && (
        <div className="glass-panel rounded-3xl border border-slate-800 p-6 space-y-4 shadow-2xl">
          <h3 className="text-base font-black text-white">Withdrawal Requests</h3>

          {payouts.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              No withdrawal requests found.
            </div>
          ) : (
            <div className="space-y-3">
              {payouts.map((payout) => (
                <div key={payout.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white">{payout.user?.fullName}</div>
                    <div className="text-xs text-slate-400">{payout.user?.email}</div>
                    <div className="text-sm text-emerald-400 font-bold mt-1">₹{payout.amount}</div>
                    <div className="text-xs text-slate-500">UPI: {payout.destination}</div>
                  </div>

                  <div className="flex gap-2">
                    {payout.status === 'PENDING' ? (
                      <>
                        <button
                          onClick={() => handleApprovePayout(payout.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold text-white"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() => handleRejectPayout(payout.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-bold text-white"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">
                        {payout.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      
      {/* 3. DISPUTES */}
      {activeTab === 'disputes' && (
        <div className="glass-panel rounded-3xl border border-slate-800 p-6 space-y-4 shadow-2xl">
          <h3 className="text-base font-black text-white">
            Dispute Resolution Center
          </h3>

          {disputes.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              No disputes found.
            </div>
          ) : (
            <div className="space-y-3">
              {disputes.map((d) => (
                <div
                  key={d.id}
                  className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3"
                >
                  <div className="font-bold text-white">
                    Order #{d.orderId?.slice?.(0,8) || d.orderId}
                  </div>

                  <div className="text-xs text-slate-400">
                    Status: {d.status}
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="p-3 rounded-xl bg-red-950/20 border border-red-900">
                      <div className="text-red-400 font-bold mb-1">
                        Client Complaint
                      </div>
                      <div className="text-slate-300">
                        {d.reason || 'No complaint provided'}
                      </div>

                      {d.evidence && (
                        <div className="text-xs text-slate-500 mt-1">
                          Evidence: {d.evidence}
                        </div>
                      )}
                    </div>

                    {d.sellerReason && (
                      <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900">
                        <div className="text-emerald-400 font-bold mb-1">
                          Seller Response
                        </div>

                        <div className="text-slate-300">
                          {d.sellerReason}
                        </div>

                        {d.sellerEvidence && (
                          <div className="text-xs text-slate-500 mt-1">
                            Evidence: {d.sellerEvidence}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolveDispute(d.id, 'RELEASE_TO_SELLER')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold text-white"
                    >
                      Release To Seller
                    </button>

                    <button
                      onClick={() => handleResolveDispute(d.id, 'REFUND_CLIENT')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-bold text-white"
                    >
                      Refund Client
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}


        {/* REVIEW MODERATION */}
        {activeTab === 'reviews' && (
          <div className="glass-panel rounded-3xl border border-slate-800 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-white pb-3 border-b border-slate-800">
              Review Moderation Center
            </h3>

            {reviews.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No reviews found.
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map(review => (
                  <div
                    key={review.id}
                    className="p-4 bg-slate-900 border border-slate-800 rounded-2xl"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="text-white font-bold">
                          {review.reviewer?.fullName || 'Unknown'} → {review.reviewee?.fullName || 'Unknown'}
                        </div>

                        <div className="text-amber-400 text-sm mt-1">
                          Rating: {review.rating}/5
                        </div>

                        <div className="text-slate-300 text-sm mt-2">
                          {review.comment}
                        </div>

                        <div className="text-xs text-slate-500 mt-2">
                          {new Date(review.createdAt).toLocaleString()}
                        </div>
                      </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${review.isVisible ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {review.isVisible ? 'VISIBLE' : 'HIDDEN'}
                          </span>

                          {review.isVisible ? (
                            <button
                              onClick={() => handleHideReview(review.id)}
                              className="px-3 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-xs font-bold text-white"
                            >
                              Hide
                            </button>
                          ) : (
                            <button
                              onClick={() => handleShowReview(review.id)}
                              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold text-white"
                            >
                              Restore
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="px-3 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-bold text-white"
                          >
                            Delete
                          </button>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      {activeTab === 'fraud' && (
        <div className="glass-panel rounded-3xl border border-red-900/40 p-6 space-y-6 shadow-2xl">
          <h3 className="text-base font-black text-white border-b border-slate-800 pb-3">
            Fraud Detection Center
          </h3>

          <div className="grid md:grid-cols-5 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-xs text-slate-400">Suspicious Accounts</div>
              <div className="text-2xl font-black text-orange-400">{fraudStats.suspiciousAccounts || 0}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-xs text-slate-400">High Risk Users</div>
              <div className="text-2xl font-black text-red-400">{fraudStats.highRiskUsers || 0}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-xs text-slate-400">Review Abuse Cases</div>
              <div className="text-2xl font-black text-amber-400">{fraudStats.reviewAbuseCases || 0}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-xs text-slate-400">Verification Abuse</div>
              <div className="text-2xl font-black text-orange-400">{fraudStats.verificationAbuseCases || 0}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-xs text-slate-400">Dispute Abuse</div>
              <div className="text-2xl font-black text-red-400">{fraudStats.disputeAbuseCases || 0}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-red-500/30">
              <div className="text-xs text-slate-400">Platform Risk Level</div>
              <div className="text-2xl font-black text-red-400">
                {fraudStats.riskLevel || 'LOW'}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Signals: {fraudStats.totalFraudSignals || 0}
              </div>
              <div className="text-[10px] text-orange-400 font-bold mt-1">
                Risk Score: {fraudStats.riskScore || 0}/100
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6">
            <h4 className="text-sm font-bold text-white mb-4">
              Flagged Users For Investigation
            </h4>

            {(!fraudStats.flaggedUsers || fraudStats.flaggedUsers.length === 0) ? (
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-sm">
                No suspicious users detected.
              </div>
            ) : (
              <div className="space-y-3">
                {fraudStats.flaggedUsers.map(user => (
                  <div
                    key={user.id}
                    className="p-4 rounded-2xl bg-slate-900 border border-red-500/30 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-semibold text-white">
                        {user.fullName}
                      </div>
                      <div className="text-xs text-slate-400">
                        {user.email}
                      </div>

                      <div className="mt-1 flex flex-wrap gap-2 text-[10px]">
                        <span className="px-2 py-1 rounded-full bg-slate-800 text-slate-300">
                          Age: {user.accountAgeHours || 0}h
                        </span>

                        {user.suspiciousAccount && (
                          <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-300 font-bold">
                            NEW ACCOUNT RISK
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300">
                        {user.role}
                      </span>

                      <button
                        onClick={() => handleInvestigateUser(user.id)}
                        className="text-xs px-3 py-1 rounded-full bg-red-500/20 text-red-300 font-bold hover:bg-red-500/30"
                      >
                        INVESTIGATE
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-800 pt-6 mt-6">
            <h4 className="text-sm font-bold text-white mb-4">
              Verification Abuse Users
            </h4>

            {(!fraudStats.verificationAbuseUsers || fraudStats.verificationAbuseUsers.length === 0) ? (
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-sm">
                No verification abuse detected.
              </div>
            ) : (
              <div className="space-y-3">
                {fraudStats.verificationAbuseUsers.map((user, index) => (
                  <div
                    key={user.id || index}
                    className="p-4 rounded-2xl bg-slate-900 border border-orange-500/30 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-semibold text-white">
                        {user.fullName}
                      </div>

                      <div className="text-xs text-slate-400">
                        {user.email}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300">
                        {user.role}
                      </span>

                      <span className="text-xs px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 font-bold">
                        {user.rejectedCount} REJECTIONS
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {investigationLoading && (
            <div className="mt-6 p-4 rounded-2xl bg-slate-900 border border-blue-500/30 text-blue-300">
              Loading investigation report...
            </div>
          )}

          {investigationReport && !investigationLoading && (
            <div className="mt-6 p-6 rounded-3xl bg-slate-900 border border-red-500/30 space-y-4">
              <h4 className="text-lg font-black text-white">
                Fraud Investigation Report
              </h4>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-800">
                  <div className="text-xs text-slate-400">Risk Level</div>
                  <div className="text-xl font-black text-red-400">
                    {investigationReport.riskLevel || 'LOW'}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800">
                  <div className="text-xs text-slate-400">Risk Score</div>
                  <div className="text-xl font-black text-orange-400">
                    {investigationReport.fraudScore || 0}/100
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800">
                  <div className="text-xs text-slate-400">Account Age</div>
                  <div className="text-xl font-black text-white">
                    {investigationReport.accountAgeHours || 0}h
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-800">
                  <div className="text-xs text-slate-400">Orders</div>
                  <div className="text-xl font-black text-cyan-400">
                    {investigationReport.orders?.total || 0}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800">
                  <div className="text-xs text-slate-400">Reviews</div>
                  <div className="text-xl font-black text-green-400">
                    {investigationReport.reviews?.total || 0}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800">
                  <div className="text-xs text-slate-400">Disputes</div>
                  <div className="text-xl font-black text-red-400">
                    {investigationReport.disputes?.length || 0}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800">
                  <div className="text-xs text-slate-400">Verification</div>
                  <div className="text-xl font-black text-yellow-400">
                    {investigationReport.verification ? 'VERIFIED' : 'PENDING'}
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700">
                <h5 className="text-sm font-bold text-white mb-4">
                  User Details
                </h5>

                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-400">Name</div>
                    <div className="text-white font-semibold">
                      {investigationReport.user?.fullName || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400">Email</div>
                    <div className="text-white">
                      {investigationReport.user?.email || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400">Role</div>
                    <div className="text-white">
                      {investigationReport.user?.role || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400">Joined</div>
                    <div className="text-white">
                      {investigationReport.user?.createdAt
                        ? new Date(investigationReport.user.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700">
                <h5 className="text-sm font-bold text-white mb-4">
                  Profile Details
                </h5>

                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-400">College</div>
                    <div className="text-white">
                      {investigationReport.profile?.college || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400">Category</div>
                    <div className="text-white">
                      {investigationReport.profile?.category || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400">Hourly Rate</div>
                    <div className="text-white">
                      ₹{investigationReport.profile?.hourlyRate || 0}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400">Skills</div>
                    <div className="text-white">
                      {investigationReport.profile?.skills?.length || 0}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400">Badges</div>
                    <div className="text-white">
                      {investigationReport.profile?.badges?.length || 0}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700">
                <h5 className="text-sm font-bold text-white mb-4">
                  Marketplace Activity
                </h5>

                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-slate-400">Orders As Client</div>
                    <div className="text-white font-semibold">
                      {investigationReport.orders?.asClient?.length || 0}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400">Orders As Seller</div>
                    <div className="text-white font-semibold">
                      {investigationReport.orders?.asSeller?.length || 0}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400">Total Orders</div>
                    <div className="text-white font-semibold">
                      {investigationReport.orders?.total || 0}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400">Reviews Written</div>
                    <div className="text-white">
                      {investigationReport.reviews?.written?.length || 0}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400">Reviews Received</div>
                    <div className="text-white">
                      {investigationReport.reviews?.received?.length || 0}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400">Total Reviews</div>
                    <div className="text-white">
                      {investigationReport.reviews?.total || 0}
                    </div>
                  </div>
                </div>
              </div>

              {investigationReport.disputes?.length > 0 && (
                <div className="p-5 rounded-2xl bg-slate-800 border border-red-500/30">
                  <h5 className="text-sm font-bold text-white mb-4">
                    Open Disputes
                  </h5>

                  <div className="space-y-3">
                    {investigationReport.disputes.map((dispute, index) => (
                      <div
                        key={dispute.id || index}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-700"
                      >
                        <div className="flex justify-between">
                          <div className="text-white font-semibold">
                            {dispute.reason || 'Unknown Reason'}
                          </div>

                          <div className="text-red-400 text-xs font-bold">
                            {dispute.status || 'OPEN'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {investigationReport.riskFactors?.length > 0 && (
                <div className="p-5 rounded-2xl bg-slate-800 border border-red-500/30">
                  <h5 className="text-sm font-bold text-white mb-4">
                    Risk Factors
                  </h5>

                  <div className="flex flex-wrap gap-3">
                    {investigationReport.riskFactors.map((factor, index) => (
                      <span
                        key={index}
                        className="px-3 py-2 rounded-full bg-red-500/20 text-red-300 text-xs font-bold"
                      >
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-5 rounded-2xl bg-slate-800 border border-orange-500/30 mb-4">
                <h5 className="text-sm font-bold text-white mb-4">
                  Fraud Score Breakdown
                </h5>

                <div className="text-3xl font-black text-orange-400 mb-4">
                  {investigationReport.fraudScore || 0}/100
                </div>

                {investigationReport.scoreBreakdown?.length > 0 ? (
                  <div className="space-y-2">
                    {investigationReport.scoreBreakdown.map((item, index) => (
                      <div
                        key={index}
                        className="p-2 rounded-lg bg-slate-900 text-slate-300 text-sm"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-green-400 font-semibold">
                    No fraud indicators detected
                  </div>
                )}
              </div>


                {(investigationReport.reviews?.written?.length > 0 ||
                  investigationReport.reviews?.received?.length > 0) && (
                  <div className="p-5 rounded-2xl bg-slate-800 border border-green-500/30">
                    <h5 className="text-sm font-bold text-white mb-4">
                      Review Evidence
                    </h5>

                    <div className="space-y-3 max-h-80 overflow-auto">
                      {[...(investigationReport.reviews?.written || []), ...(investigationReport.reviews?.received || [])]
                        .slice(0, 10)
                        .map((review, index) => (
                          <div
                            key={review.id || index}
                            className="p-3 rounded-xl bg-slate-900 border border-slate-700"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <div className="text-white font-semibold">
                                Rating: {review.overallRating || 0}/5
                              </div>

                              {review.isFlagged && (
                                <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-bold">
                                  FLAGGED
                                </span>
                              )}
                            </div>

                            <div className="text-slate-300 text-sm">
                              {review.comment || 'No comment'}
                            </div>

                            <div className="mt-2 text-xs text-slate-500">
                              {review.createdAt
                                ? new Date(review.createdAt).toLocaleString()
                                : 'Unknown Date'}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}


              {(investigationReport.orders?.asClient?.length > 0 ||
                investigationReport.orders?.asSeller?.length > 0) && (
                <div className="p-5 rounded-2xl bg-slate-800 border border-cyan-500/30">
                  <h5 className="text-sm font-bold text-white mb-4">
                    Order Evidence
                  </h5>

                  <div className="space-y-3 max-h-72 overflow-auto">
                    {[...(investigationReport.orders?.asClient || []), ...(investigationReport.orders?.asSeller || [])]
                      .slice(0, 10)
                      .map((order, index) => (
                        <div
                          key={order.id || index}
                          className="p-3 rounded-xl bg-slate-900 border border-slate-700"
                        >
                          <div className="flex justify-between">
                            <div className="text-white font-semibold">
                              {order.status || 'UNKNOWN'}
                            </div>

                            <div className="text-cyan-400 text-xs">
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleString()
                                : 'Unknown Date'}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {investigationReport.verification && (
                <div className="p-5 rounded-2xl bg-slate-800 border border-yellow-500/30">
                  <h5 className="text-sm font-bold text-white mb-4">
                    Verification Evidence
                  </h5>

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-slate-400">Status</div>
                      <div className="text-white font-semibold">
                        {investigationReport.verification.status || 'UNKNOWN'}
                      </div>
                    </div>

                    <div>
                      <div className="text-slate-400">College ID</div>
                      <div className="text-white font-semibold">
                        {investigationReport.verification.collegeIdStatus || 'N/A'}
                      </div>
                    </div>

                    <div>
                      <div className="text-slate-400">Government ID</div>
                      <div className="text-white font-semibold">
                        {investigationReport.verification.govtIdStatus || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {investigationReport.moderationLogs?.length > 0 && (
                <div className="p-5 rounded-2xl bg-slate-800 border border-red-500/30">
                  <h5 className="text-sm font-bold text-white mb-4">
                    Moderation Evidence
                  </h5>

                  <div className="space-y-3 max-h-72 overflow-auto">
                    {investigationReport.moderationLogs.map((log, index) => (
                      <div
                        key={log.id || index}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-700"
                      >
                        <div className="text-red-300 font-semibold">
                          {log.violationType}
                        </div>

                        <div className="text-slate-300 text-sm">
                          {log.flaggedText}
                        </div>

                        <div className="mt-2 text-xs text-slate-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-5 rounded-2xl bg-slate-800 border border-orange-500/30 mb-4 space-y-4">
                <h5 className="text-sm font-bold text-white">
                  Investigation Actions
                </h5>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleBanUser}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm"
                  >
                    Ban User
                  </button>

                  <button
                    onClick={handleClearInvestigation}
                    className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm"
                  >
                    Clear Investigation
                  </button>
                </div>

                <div className="space-y-3">
                  <textarea
                    value={investigationNote}
                    onChange={(e) => setInvestigationNote(e.target.value)}
                    placeholder="Add investigation note..."
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                    rows={3}
                  />

                  <button
                    onClick={handleAddInvestigationNote}
                    className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm"
                  >
                    Add Note
                  </button>
                </div>

                <div>
                  <h6 className="text-xs font-bold text-slate-300 mb-2">
                    Investigation History
                  </h6>

                  <div className="space-y-2 max-h-64 overflow-auto">
                    {investigationHistory.length === 0 ? (
                      <div className="text-xs text-slate-500">
                        No investigation history yet.
                      </div>
                    ) : (
                      investigationHistory.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl bg-slate-900 border border-slate-700"
                        >
                          <div className="text-xs font-bold text-orange-300">
                            {item.actionType}
                          </div>

                          {item.note && (
                            <div className="text-sm text-slate-300 mt-1">
                              {item.note}
                            </div>
                          )}

                          <div className="text-[11px] text-slate-500 mt-1">
                            {new Date(item.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              
            </div>
          )}

        </div>
      )}







        {activeTab === 'audit' && (
          <div className="glass-panel rounded-3xl border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-800">
  <h3 className="text-base font-black text-white">
    Admin Audit Trail
  </h3>

  <button
    onClick={handleExportAuditLogs}
    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black transition"
  >
    Export Audit Logs
  </button>
</div>

            <input
              type="text"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder="Search action, admin, target or details..."
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
            />

            {auditLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">No audit logs found.</div>
            ) : (
              <div className="space-y-3">
                {filteredAuditLogs.map(log => (
                  <div key={log.id} className="p-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase">
                        {log.actionType}
                      </span>
                      <span className="text-xs text-slate-400">
                        Admin: {log.adminId}
                      </span>
                    </div>

                    {log.details && (
                      <div className="mt-2 text-xs text-slate-300">
                        {log.details}
                      </div>
                    )}

                    <div className="mt-2 text-[11px] text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


{/* GIG MODERATION QUEUE */}
      {activeTab === 'gigModeration' && (
        <div className="glass-panel rounded-3xl border border-slate-800 p-6 space-y-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-black text-white">Gig Moderation Queue</h3>
              <p className="text-xs text-slate-500 mt-1">
                Review submitted gigs before they become marketplace-visible.
              </p>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase">
              {gigModerationQueue.length} Pending
            </span>
          </div>

          {gigModerationQueue.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No gigs are waiting for moderation.
            </div>
          ) : (
            <div className="space-y-4">
              {gigModerationQueue.map((gig) => {
                const moderation = gig.moderationFindings || {};
                const findings = Array.isArray(moderation.findings)
                  ? moderation.findings
                  : [];

                return (
                  <article
                    key={gig.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-4"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-black text-white">{gig.title}</h4>
                          <span className="px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[9px] font-black uppercase">
                            {gig.isPendingEdit ? 'EDIT PENDING REVIEW' : gig.status}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 mt-2">
                          Seller: {gig.seller?.fullName || 'Unknown'} ({gig.seller?.email || 'No email'})
                        </p>

                        <p className="text-[11px] text-slate-500 mt-1">
                          Category: {gig.categoryRef?.name || gig.category || 'Uncategorised'}
                          {gig.subcategoryRef?.name ? ` • ${gig.subcategoryRef.name}` : ''}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleGigModeration(gig.id, 'PUBLISHED')}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </button>

                        <button
                          type="button"
                          onClick={() => handleGigModeration(gig.id, 'NEEDS_CHANGES', 'CONTENT_NEEDS_CHANGES')}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-300 hover:bg-orange-500/20 text-[10px] font-black transition"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Needs Changes
                        </button>

                        <button
                          type="button"
                          onClick={() => handleGigModeration(gig.id, 'REJECTED', 'POLICY_VIOLATION')}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/20 text-[10px] font-black transition"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    </div>

                    {gig.packages?.length > 0 && (
                      <div className="text-[11px] text-slate-300">
                        {gig.isTiered ? (
                          <>
                            Packages: {gig.packages.filter((pkg) =>
                              ['Basic', 'Standard', 'Premium'].includes(pkg.tierName)
                            ).length}
                          </>
                        ) : (
                          <>
                            Price: {gig.packages[0].price} • Delivery: {gig.packages[0].deliveryDays} days •
                            Revisions: {gig.packages[0].revisions < 0 ? 'Unlimited' : gig.packages[0].revisions}
                          </>
                        )}
                      </div>
                    )}

                    <details className="group rounded-2xl border border-slate-800 bg-slate-900/40">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-xs font-black text-slate-200">
                        <span>Review Full Gig</span>
                        <span className="text-[10px] font-bold text-slate-500 group-open:text-cyan-300">
                          {gig.draftData?.media?.cover?.url || gig.coverImage ? 'Content + Media' : 'Content'}
                        </span>
                      </summary>

                      <div className="border-t border-slate-800 p-4 sm:p-5 space-y-5">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                            Service Description
                          </p>
                          {sanitizeRichTextHtml(gig.draftData?.description || gig.description || '') ? (
                            <div
                              className="mt-2 max-w-none break-words text-sm leading-6 text-slate-300 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:font-black [&_strong]:text-white [&_b]:font-black [&_b]:text-white [&_em]:italic [&_ul]:ml-5 [&_ul]:list-disc [&_ol]:ml-5 [&_ol]:list-decimal [&_li]:pl-1"
                              dangerouslySetInnerHTML={{
                                __html: sanitizeRichTextHtml(gig.draftData?.description || gig.description || '')
                              }}
                            />
                          ) : (
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                              No description provided.
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                            <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">Service Type</p>
                            <p className="mt-1 text-xs font-bold text-slate-200">
                              {gig.draftData?.basics?.serviceType || 'Not specified'}
                            </p>
                          </div>

                          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                            <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">Skills</p>
                            <p className="mt-1 text-xs font-bold text-slate-200">
                              {Array.isArray(gig.draftData?.basics?.skills) && gig.draftData.basics.skills.length
                                ? gig.draftData.basics.skills.join(', ')
                                : 'None specified'}
                            </p>
                          </div>
                        </div>

                        {gig.isTiered && Array.isArray(gig.packages) ? (
                          <div>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                                Package Pricing & Scope
                              </p>
                              <span className="text-[10px] font-bold text-cyan-300">
                                {gig.packages.filter((pkg) =>
                                  ['Basic', 'Standard', 'Premium'].includes(pkg.tierName)
                                ).length} tiers
                              </span>
                            </div>

                            <div className="mt-2 grid grid-cols-1 lg:grid-cols-3 gap-3">
                              {['Basic', 'Standard', 'Premium'].map((tierName) => {
                                const pkg = gig.packages.find(
                                  (item) => item.tierName === tierName
                                );

                                if (!pkg) {
                                  return (
                                    <div
                                      key={tierName}
                                      className="rounded-xl border border-red-500/20 bg-red-500/5 p-3"
                                    >
                                      <p className="text-sm font-black text-white">{tierName}</p>
                                      <p className="mt-2 text-xs text-red-300">
                                        Package data missing.
                                      </p>
                                    </div>
                                  );
                                }

                                const scope =
                                  pkg.scope && typeof pkg.scope === 'object'
                                    ? pkg.scope
                                    : {};

                                const includedItems = Array.isArray(scope.includedItems)
                                  ? scope.includedItems.filter(Boolean)
                                  : [];
                                const excludedItems = Array.isArray(scope.excludedItems)
                                  ? scope.excludedItems.filter(Boolean)
                                  : [];
                                const deliverables = Array.isArray(scope.deliverables)
                                  ? scope.deliverables.filter(Boolean)
                                  : [];
                                const features = Array.isArray(pkg.features)
                                  ? pkg.features.filter(Boolean)
                                  : [];

                                const renderItems = (items, emptyLabel = 'None specified') =>
                                  items.length > 0 ? (
                                    <div className="mt-1.5 space-y-1">
                                      {items.map((item, index) => (
                                        <p
                                          key={`${tierName}-${index}-${item}`}
                                          className="text-[11px] leading-5 text-slate-300"
                                        >
                                          • {item}
                                        </p>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="mt-1.5 text-[11px] text-slate-600">
                                      {emptyLabel}
                                    </p>
                                  );

                                return (
                                  <article
                                    key={tierName}
                                    className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p className="text-sm font-black text-white">
                                          {pkg.tierName}
                                        </p>
                                        <p className="mt-1 text-[11px] font-bold text-cyan-300">
                                          {pkg.price} • {pkg.deliveryDays} days •{' '}
                                          {pkg.revisions < 0
                                            ? 'Unlimited revisions'
                                            : `${pkg.revisions} revision${pkg.revisions === 1 ? '' : 's'}`}
                                        </p>
                                      </div>
                                    </div>

                                    <p className="mt-3 text-xs leading-5 text-slate-400">
                                      {pkg.description || 'No package description provided.'}
                                    </p>

                                    <div className="mt-3 space-y-3">
                                      <div>
                                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                                          Included
                                        </p>
                                        {renderItems(includedItems)}
                                      </div>

                                      <div>
                                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                                          Excluded
                                        </p>
                                        {renderItems(excludedItems)}
                                      </div>

                                      <div>
                                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                                          Deliverables
                                        </p>
                                        {renderItems(deliverables)}
                                      </div>

                                      <div>
                                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                                          Features
                                        </p>
                                        {renderItems(features)}
                                      </div>
                                    </div>
                                  </article>
                                );
                              })}
                            </div>
                          </div>
                        ) : gig.draftData?.delivery ? (
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                              Scope & Deliverables
                            </p>

                            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                              {[
                                ['Included', gig.draftData.delivery.includedItems],
                                ['Excluded', gig.draftData.delivery.excludedItems],
                                ['Deliverables', gig.draftData.delivery.deliverables]
                              ].map(([label, items]) => (
                                <div key={label} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                                    {label}
                                  </p>

                                  <div className="mt-2 space-y-1">
                                    {Array.isArray(items) && items.filter(Boolean).length > 0 ? (
                                      items.filter(Boolean).map((item, index) => (
                                        <p key={`${label}-${index}`} className="text-xs text-slate-300">
                                          • {item}
                                        </p>
                                      ))
                                    ) : (
                                      <p className="text-xs text-slate-600">None specified</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {Array.isArray(gig.draftData?.extras) && gig.draftData.extras.length > 0 && (
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                              Optional Extras
                            </p>

                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                              {gig.draftData.extras
                                .filter((extra) => extra && typeof extra === 'object')
                                .map((extra, index) => {
                                  const extraTitle = String(extra.title || '').trim();
                                  const extraPrice = Number(extra.price);
                                  const extraScope =
                                    extra.scope && typeof extra.scope === 'object'
                                      ? String(extra.scope.description || '').trim()
                                      : '';

                                  return (
                                    <div
                                      key={extra.id || `extra-${index}`}
                                      className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                          <p className="text-sm font-black text-white">
                                            {extraTitle || 'Untitled extra'}
                                          </p>
                                          <p className="mt-1 text-[11px] text-slate-400 leading-5">
                                            {extraScope || 'No scope specified.'}
                                          </p>
                                        </div>

                                        <p className="shrink-0 text-[11px] font-black text-amber-300">
                                          {Number.isFinite(extraPrice) && extraPrice > 0
                                            ? `+${gig.draftData?.pricing?.currency || 'INR'} ${extraPrice.toLocaleString('en-IN')}`
                                            : 'Invalid price'}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}

                        {Array.isArray(gig.draftData?.requirements) && gig.draftData.requirements.length > 0 && (
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                              Buyer Requirements
                            </p>

                            <div className="mt-2 space-y-2">
                              {gig.draftData.requirements.map((item, index) => (
                                <div
                                  key={`requirement-${index}`}
                                  className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"
                                >
                                  <p className="text-xs font-bold text-slate-200">
                                    {item.question || 'Requirement'}
                                  </p>

                                  {Array.isArray(item.options) && item.options.filter(Boolean).length > 0 && (
                                    <p className="mt-1 text-[11px] text-slate-500">
                                      Options: {item.options.filter(Boolean).join(', ')}
                                    </p>
                                  )}

                                  <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-600">
                                    {item.required ? 'Required' : 'Optional'}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {Array.isArray(gig.draftData?.faqs) && gig.draftData.faqs.length > 0 && (
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                              FAQs
                            </p>

                            <div className="mt-2 space-y-2">
                              {gig.draftData.faqs.map((faq, index) => (
                                <div
                                  key={`faq-${index}`}
                                  className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"
                                >
                                  <p className="text-xs font-bold text-slate-200">
                                    {faq.question || 'Question'}
                                  </p>

                                  {faq.answer && (
                                    <p className="mt-1 text-xs leading-5 text-slate-400">
                                      {faq.answer}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {(() => {
                          const coverUrl =
                            gig.draftData?.media?.cover?.url ||
                            gig.coverImage ||
                            '';

                          const gallery = Array.isArray(gig.draftData?.media?.gallery)
                            ? gig.draftData.media.gallery
                                .map((item) => item?.url)
                                .filter(Boolean)
                            : [];

                          const mediaUrls = [coverUrl, ...gallery].filter(Boolean);

                          return mediaUrls.length > 0 ? (
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                                Media
                              </p>

                              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {mediaUrls.map((url, index) => (
                                  <a
                                    key={`${url}-${index}`}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block overflow-hidden rounded-xl border border-slate-800 bg-slate-950/50"
                                    title="Open media in new tab"
                                  >
                                    <img
                                      src={url}
                                      alt={`${gig.title} media ${index + 1}`}
                                      className="h-28 w-full object-cover hover:scale-105 transition"
                                    />
                                  </a>
                                ))}
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    </details>

                    <details
                      className="group rounded-2xl border border-slate-800 bg-slate-900/40"
                      onToggle={(event) => {
                        if (event.currentTarget.open) {
                          loadGigRevisionHistory(gig.id);
                        }
                      }}
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-xs font-black text-slate-200">
                        <span className="flex items-center gap-2">
                          <History className="w-3.5 h-3.5 text-cyan-300" />
                          Version History
                        </span>
                        <span className="flex items-center gap-2 text-[10px] font-bold text-slate-500 group-open:text-cyan-300">
                          {gigRevisionHistory[gig.id]
                            ? `${gigRevisionHistory[gig.id].length} revision${gigRevisionHistory[gig.id].length === 1 ? '' : 's'}`
                            : 'Load history'}
                          <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
                        </span>
                      </summary>

                      <div className="border-t border-slate-800 p-4 sm:p-5">
                        {gigRevisionLoading[gig.id] ? (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Loading saved revisions…
                          </div>
                        ) : gigRevisionErrors[gig.id] ? (
                          <p className="text-xs text-red-300">
                            {gigRevisionErrors[gig.id]}
                          </p>
                        ) : !gigRevisionHistory[gig.id]?.length ? (
                          <p className="text-xs text-slate-500">
                            No saved revisions are available for this gig yet.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {gigRevisionHistory[gig.id].map((revision) => {
                              const snapshot =
                                revision.snapshot &&
                                typeof revision.snapshot === 'object'
                                  ? revision.snapshot
                                  : {};

                              const snapshotPackages = Array.isArray(snapshot.packages)
                                ? snapshot.packages
                                : [];

                              const activeSnapshotPackageNames = snapshot.isTiered
                                ? ['Basic', 'Standard', 'Premium']
                                : ['Single'];

                              const snapshotPackage =
                                snapshotPackages.find((pkg) =>
                                  activeSnapshotPackageNames.includes(pkg?.tierName)
                                ) || null;

                              return (
                                <details
                                  key={revision.id}
                                  className="rounded-xl border border-slate-800 bg-slate-950/50"
                                >
                                  <summary className="flex cursor-pointer list-none flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 py-3">
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[10px] font-black text-cyan-300">
                                          v{revision.version}
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px] font-black uppercase">
                                          {revision.changeType}
                                        </span>
                                        <span className="text-[9px] text-slate-600">
                                          Draft v{snapshot.draftVersion ?? '—'}
                                        </span>
                                      </div>
                                      <p className="mt-1 text-xs font-bold text-slate-200 truncate">
                                        {snapshot.title || 'Untitled revision'}
                                      </p>
                                    </div>

                                    <time
                                      dateTime={revision.createdAt}
                                      className="shrink-0 text-[9px] font-bold text-slate-600"
                                    >
                                      {new Date(revision.createdAt).toLocaleString()}
                                    </time>
                                  </summary>

                                  <div className="border-t border-slate-800 p-3 space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                                        <p className="text-[8px] font-black uppercase tracking-wider text-slate-600">
                                          Status
                                        </p>
                                        <p className="mt-1 text-[10px] font-bold text-slate-300">
                                          {snapshot.status || '—'}
                                        </p>
                                      </div>

                                      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                                        <p className="text-[8px] font-black uppercase tracking-wider text-slate-600">
                                          Price
                                        </p>
                                        <p className="mt-1 text-[10px] font-bold text-slate-300">
                                          {snapshotPackage?.price ?? '—'}
                                        </p>
                                      </div>

                                      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                                        <p className="text-[8px] font-black uppercase tracking-wider text-slate-600">
                                          Delivery
                                        </p>
                                        <p className="mt-1 text-[10px] font-bold text-slate-300">
                                          {snapshotPackage?.deliveryDays != null
                                            ? `${snapshotPackage.deliveryDays} days`
                                            : '—'}
                                        </p>
                                      </div>
                                    </div>

                                    <div>
                                      <p className="text-[8px] font-black uppercase tracking-wider text-slate-600">
                                        Description
                                      </p>
                                      <p className="mt-1 text-[11px] leading-5 text-slate-400 whitespace-pre-wrap break-words">
                                        {snapshot.description || 'No description recorded.'}
                                      </p>
                                    </div>

                                    {snapshot.moderationReasonCode && (
                                      <p className="text-[10px] text-amber-300">
                                        Moderation reason: {snapshot.moderationReasonCode}
                                      </p>
                                    )}
                                  </div>
                                </details>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </details>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                          Automated Moderation
                        </span>
                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${
                          moderation.status === 'FLAGGED'
                            ? 'bg-amber-500/10 text-amber-300'
                            : 'bg-emerald-500/10 text-emerald-300'
                        }`}>
                          {moderation.status || 'NOT_RUN'}
                        </span>
                      </div>

                      {findings.length === 0 ? (
                        <p className="text-xs text-slate-500 mt-3">
                          No automated findings were recorded.
                        </p>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {findings.map((finding, index) => (
                            <div
                              key={`${finding.reasonCode}-${index}`}
                              className="rounded-xl bg-slate-950/70 border border-slate-800 p-3"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-black text-white">
                                  {finding.reasonCode}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px] font-black uppercase">
                                  {finding.severity}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1">
                                {finding.message}
                              </p>
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
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. AI CHAT MODERATION LOGS */}
      {activeTab === 'moderation' && (
        <div className="glass-panel rounded-3xl border border-slate-800 p-6 space-y-4 shadow-2xl">
          <h3 className="text-base font-black text-white pb-3 border-b border-slate-800">AI Contact-Leak Interception Logs</h3>
          {moderationLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">No chat violations detected.</div>
          ) : (
            <div className="space-y-3">
              {moderationLogs.map(log => (
                <div key={log.id} className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="font-bold text-red-400">Blocked Text: "{log.flaggedText}"</span>
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-300 rounded text-[9px] font-bold uppercase">{log.violationType}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Sender: {log.sender?.fullName || 'User'} ({log.sender?.email}) • Flagged at: {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
