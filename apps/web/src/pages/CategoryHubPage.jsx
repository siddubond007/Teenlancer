import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Search, Star, ShieldCheck, Filter, ArrowRight, X, Clock, DollarSign,
  PlusCircle, Zap, CheckCircle2, ChevronRight, SlidersHorizontal, MapPin, User
} from 'lucide-react';
import API from '../services/api';

export default function CategoryHubPage({ currentUser }) {
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  
  const currentSlug = categorySlug || 'graphic-design';
  const categoryTitle = currentSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const [realStudents, setRealStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Fetch real registered students from PostgreSQL database
  useEffect(() => {
    setLoading(true);
    API.get(`/users/freelancers?category=${currentSlug}`)
      .then(res => {
        setRealStudents(res.data || []);
      })
      .catch(err => {
        console.log('Error fetching freelancers:', err);
        setRealStudents([]);
      })
      .finally(() => setLoading(false));
  }, [currentSlug]);

  const handlePostProjectClick = () => {
    if (!currentUser) {
      navigate('/login');
    } else if (currentUser.role === 'CLIENT') {
      navigate('/client/portal');
    } else {
      alert('You are signed in as a Student Freelancer. Please sign in with a Client account to post job briefs.');
    }
  };

  const filteredStudents = realStudents.filter(st => {
    if (keyword && !st.fullName.toLowerCase().includes(keyword.toLowerCase()) && !st.profile?.college?.toLowerCase().includes(keyword.toLowerCase())) {
      return false;
    }
    if (minPrice && (st.profile?.hourlyRate || 499) < Number(minPrice)) return false;
    if (maxPrice && (st.profile?.hourlyRate || 499) > Number(maxPrice)) return false;
    return true;
  });

  return (
    <div className="space-y-8 pb-20 -mt-2">
      
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2 text-xs font-bold text-slate-400">
        <Link to="/" className="hover:text-white transition">SkillLaunch</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/jobs" className="hover:text-white transition">Jobs</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-indigo-400">{categoryTitle}</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span>1</span>
      </div>

      {/* Trust Header */}
      <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800 space-y-4 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-1.5 text-xs font-black text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>Real Verified Student Creators in {categoryTitle}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white">Hire Expert Student {categoryTitle}</h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Connect with registered students and campus creators from top institutes ready to deliver quality work with 5-day escrow protection.
            </p>
          </div>

          <button 
            onClick={handlePostProjectClick}
            className="px-6 py-3.5 neon-airflow-btn text-white text-xs font-black rounded-2xl shadow-xl uppercase tracking-wider flex items-center space-x-2 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post a {categoryTitle} Job</span>
          </button>
        </div>
      </div>

      {/* Dual Search Bar */}
      <div className="glass-panel p-3 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3 shadow-xl">
        <div className="sm:col-span-6 flex items-center space-x-3 px-3 bg-slate-950/80 rounded-xl border border-slate-800">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input 
            type="text" 
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder={`Search registered ${categoryTitle} by name, college, skills...`} 
            className="w-full py-3 bg-transparent text-xs text-white outline-none placeholder-slate-500"
          />
        </div>

        <div className="sm:col-span-4 flex items-center space-x-3 px-3 bg-slate-950/80 rounded-xl border border-slate-800">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Status:</span>
          <span className="text-xs font-bold text-emerald-400">100% Real Live Database</span>
        </div>

        <div className="sm:col-span-2">
          <button className="w-full h-full py-3 neon-airflow-btn text-white text-xs font-black rounded-xl shadow-lg">
            Search
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Filter Sidebar */}
        <div className="lg:col-span-3 glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center space-x-2 text-xs font-black uppercase text-white pb-3 border-b border-slate-800">
            <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
            <span>Filter Talent</span>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-black text-slate-300 block">Hourly Rate Range (₹)</span>
            <div className="flex items-center space-x-2">
              <input 
                type="number" 
                placeholder="Min ₹" 
                value={minPrice} 
                onChange={e => setMinPrice(e.target.value)} 
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none" 
              />
              <span className="text-xs text-slate-500">to</span>
              <input 
                type="number" 
                placeholder="Max ₹" 
                value={maxPrice} 
                onChange={e => setMaxPrice(e.target.value)} 
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none" 
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
            <span className="font-black text-slate-300 block">Categories</span>
            <Link to="/category/graphic-design" className="block text-slate-400 hover:text-indigo-300">Graphic Designers</Link>
            <Link to="/category/web-development" className="block text-slate-400 hover:text-indigo-300">Web Developers</Link>
            <Link to="/category/video-editing" className="block text-slate-400 hover:text-indigo-300">Video & Reel Editors</Link>
            <Link to="/category/python-scripting" className="block text-slate-400 hover:text-indigo-300">Python & AI Coders</Link>
            <Link to="/category/mobile-apps" className="block text-slate-400 hover:text-indigo-300">Mobile Developers</Link>
            <Link to="/category/3d-artists" className="block text-slate-400 hover:text-indigo-300">3D Blender Artists</Link>
          </div>
        </div>

        {/* Center: Real Registered Student Profiles */}
        <div className="lg:col-span-9 space-y-6">
          <div className="flex justify-between items-center bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-black text-white">Registered {categoryTitle} ({filteredStudents.length})</h2>
            <span className="text-xs font-bold text-slate-400">Live PostgreSQL Database</span>
          </div>

          {loading ? (
            <div className="glass-panel p-12 text-center rounded-3xl border border-slate-800">
              <p className="text-xs text-slate-400">Connecting to database...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            /* CLEAN EMPTY STATE WHEN NO STUDENTS REGISTERED YET */
            <div className="glass-panel p-12 text-center rounded-3xl border border-slate-800 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">No Registered Students in {categoryTitle} Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Your database is fresh! Register as a Student Freelancer in this category to have your profile and hourly rate appear right here.
                </p>
              </div>
              <Link 
                to="/register"
                className="px-6 py-3 neon-airflow-btn text-white text-xs font-black rounded-2xl shadow-xl inline-flex items-center space-x-2 uppercase tracking-wider"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Register as a {categoryTitle}</span>
              </Link>
            </div>
          ) : (
            /* REAL REGISTERED STUDENT CARDS */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map(student => (
                <div 
                  key={student.id} 
                  className="glass-panel rounded-3xl border border-slate-800 p-6 flex flex-col justify-between hover:border-indigo-500/50 transition-all duration-300 shadow-xl group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-xl shrink-0 shadow-md">
                        {student.fullName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-base font-black text-white flex items-center space-x-1.5">
                          <span>{student.fullName}</span>
                          <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                        </h3>
                        <div className="flex items-center space-x-1 text-xs font-bold text-amber-400 mt-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>5.0 ({student.reviewsReceived?.length || 0} reviews)</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-slate-400">
                      <div className="font-semibold text-slate-300">{student.profile?.college || 'Verified Student'}</div>
                      <div className="flex items-center space-x-1 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Age: {student.age} yrs • India</span>
                      </div>
                    </div>

                    <div className="text-sm font-black text-emerald-400 pt-1">
                      ₹{student.profile?.hourlyRate || 499} <span className="text-xs text-slate-500 font-normal">per hour</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {(student.profile?.skills || [categoryTitle]).map((s, idx) => (
                        <span key={idx} className="px-2.5 py-0.5 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-800/80 mt-6">
                    <Link 
                      to={`/u/${student.id}`}
                      className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-black transition text-center block shadow-lg shadow-indigo-600/30 uppercase tracking-wider"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
