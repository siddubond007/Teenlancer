import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import confetti from 'canvas-confetti';
import API from '../services/api';

export default function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await API.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      onLoginSuccess(res.data.user);
      confetti({ particleCount: 100, spread: 70 });
      
      if (res.data.user.role === 'STUDENT_FREELANCER') {
        navigate('/student/portal');
      } else {
        navigate('/client/portal');
      }
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Cannot connect to backend server. Make sure port 5000 is active.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4">
      <div className="neon-border-box max-w-md w-full p-8 shadow-2xl relative">
        <h2 className="text-3xl font-black text-white text-center">Welcome Back</h2>
        <p className="text-xs text-slate-400 text-center mt-1 mb-6">Sign in to your SkillLaunch work portal</p>

        {error && (
          <div className="p-3.5 bg-red-500/15 border border-red-500/40 rounded-2xl text-xs text-red-300 flex items-start space-x-2.5 mb-5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-bold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
            <input 
              required 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="name@college.edu or name@gmail.com" 
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white outline-none focus:border-indigo-500" 
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <input 
                required 
                type={showPassword ? 'text' : 'password'} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••" 
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white outline-none focus:border-indigo-500 pr-11" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 neon-airflow-btn text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-xl mt-4"
          >
            {loading ? 'Verifying...' : 'Sign In to Portal'}
          </button>
        </form>

        <p className="text-xs text-slate-400 text-center mt-6">
          Don't have an account? <Link to="/register" className="text-indigo-400 font-bold hover:underline">Join Free as Student or Client</Link>
        </p>
      </div>
    </div>
  );
}
