import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, PlusCircle, Trash2, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import API from '../services/api';

export default function ClientDashboard({ currentUser }) {
  const [jobs, setJobs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [jobForm, setJobForm] = useState({ title: '', category: 'Programming & Tech', description: '', budget: '', deadlineDays: '3' });

  useEffect(() => {
    API.get('/jobs').then(res => setJobs(res.data || [])).catch(() => {});
    API.get('/orders').then(res => setOrders(res.data || [])).catch(() => {});
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
      setJobs([res.data, ...jobs]);
      setShowPostJobModal(false);
      confetti({ particleCount: 100, spread: 70 });
      setJobForm({ title: '', category: 'Programming & Tech', description: '', budget: '', deadlineDays: '3' });
    } catch (err) {
      alert(err.response?.data?.error || 'Error posting job');
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm('Delete this project brief?')) return;
    try {
      await API.delete(`/jobs/${id}`);
      setJobs(jobs.filter(j => j.id !== id));
      alert('Job deleted.');
    } catch (err) {
      alert('Failed to delete job.');
    }
  };

  const myPostedJobs = jobs.filter(j => j.clientId === currentUser?.id || j.client?.id === currentUser?.id);

  return (
    <div className="space-y-8 pb-16">
      {/* Client Portal Header */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs font-black text-emerald-400 mb-2">
            <Briefcase className="w-4 h-4 text-emerald-400" />
            <span>Verified Client Management Portal</span>
          </div>
          <h2 className="text-3xl font-black text-white">{currentUser?.fullName}</h2>
          <p className="text-xs text-slate-400 mt-1">{currentUser?.email} • Hiring Student Talent</p>
        </div>

        <button 
          onClick={() => setShowPostJobModal(true)}
          className="px-6 py-3 neon-airflow-btn text-white rounded-2xl text-xs font-black shadow-xl flex items-center space-x-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post New Project Brief</span>
        </button>
      </div>

      {/* My Posted Jobs */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-lg font-black text-white">My Posted Project Briefs ({myPostedJobs.length})</h3>
        {myPostedJobs.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/40 rounded-2xl">
            <p className="text-xs text-slate-400">You haven't posted any jobs yet. Post a brief to start receiving proposals!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myPostedJobs.map(job => (
              <div key={job.id} className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black uppercase text-indigo-400">{job.category}</span>
                  <h4 className="text-base font-bold text-white mt-0.5">{job.title}</h4>
                  <span className="text-xs text-slate-400">{job.bids?.length || 0} proposals received • Budget: ₹{job.budget}</span>
                </div>
                <button onClick={() => handleDeleteJob(job.id)} className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition" title="Delete Job">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Hired Orders */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-lg font-black text-white">Hired Student Projects & Escrow ({orders.length})</h3>
        {orders.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">No active hired orders yet.</p>
        ) : (
          <div className="space-y-3">
            {orders.map(o => (
              <div key={o.id} className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl flex justify-between items-center">
                <div>
                  <span className="text-xs font-black uppercase text-indigo-400">Order #{o.id.slice(0, 8)}</span>
                  <h4 className="text-sm font-bold text-white">Student: {o.seller?.fullName}</h4>
                  <span className="text-xs text-slate-400">Escrow Status: {o.status}</span>
                </div>
                <Link to={`/orders/${o.id}`} className="px-5 py-2 neon-airflow-btn text-white text-xs font-black rounded-xl">
                  Open Project Room →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Job Modal */}
      {showPostJobModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="neon-border-box max-w-lg w-full p-7 shadow-2xl relative">
            <button onClick={() => setShowPostJobModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white">✕</button>
            <h3 className="text-xl font-black text-white mb-4">Post a Project Brief</h3>
            <form onSubmit={handlePostJob} className="space-y-4">
              <input required type="text" value={jobForm.title} onChange={e => setJobForm({...jobForm, title: e.target.value})} placeholder="Project Title" className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white" />
              <input required type="number" value={jobForm.budget} onChange={e => setJobForm({...jobForm, budget: e.target.value})} placeholder="Budget in ₹ INR" className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white font-bold" />
              <textarea required rows="4" value={jobForm.description} onChange={e => setJobForm({...jobForm, description: e.target.value})} placeholder="Requirements description..." className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white" />
              <button type="submit" className="w-full py-3.5 neon-airflow-btn text-white text-xs font-black rounded-2xl uppercase">Publish Project Brief</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
