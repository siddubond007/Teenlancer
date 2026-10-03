import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, Star, ShieldCheck, CheckCircle2, MapPin, SlidersHorizontal, 
  ArrowRight, PlusCircle, User, Zap, GraduationCap, X, ChevronRight
} from 'lucide-react';
import API from '../services/api';
import { ALL_SKILLS_DATABASE } from '../data/skillsData';

export default function SkillSearchPage({ currentUser }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSkill = searchParams.get('skill') || '';

  const [searchQuery, setSearchQuery] = useState(initialSkill);
  const [selectedSkillPill, setSelectedSkillPill] = useState(initialSkill);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real registered students from PostgreSQL database
  useEffect(() => {
    setLoading(true);
    API.get('/users/freelancers')
      .then(res => {
        setStudents(res.data || []);
      })
      .catch(err => {
        console.log('Error fetching talent:', err);
        setStudents([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSkillPillClick = (skill) => {
    if (selectedSkillPill === skill) {
      setSelectedSkillPill('');
      setSearchQuery('');
      setSearchParams({});
    } else {
      setSelectedSkillPill(skill);
      setSearchQuery(skill);
      setSearchParams({ skill });
    }
  };

  // Filter students based on searched skill or keyword
  const filteredStudents = students.filter(st => {
    const term = (selectedSkillPill || searchQuery).toLowerCase().trim();
    
    // Check matching name, college, category, or skills array
    const matchesKeyword = !term || 
      st.fullName.toLowerCase().includes(term) ||
      (st.profile?.college && st.profile.college.toLowerCase().includes(term)) ||
      (st.profile?.category && st.profile.category.toLowerCase().includes(term)) ||
      (st.profile?.skills && st.profile.skills.some(s => s.toLowerCase().includes(term)));

    const rate = st.profile?.hourlyRate || 499;
    const matchesMin = !minPrice || rate >= Number(minPrice);
    const matchesMax = !maxPrice || rate <= Number(maxPrice);

    return matchesKeyword && matchesMin && matchesMax;
  });

  const popularPills = [
    'React.js', 'Python', 'Figma', 'Video Editing', '3D Blender', 'Logo Design', 
    'Next.js', 'Tailwind CSS', 'WordPress', 'SEO Writing', 'Machine Learning', 'Flutter'
  ];

  return (
    <div className="space-y-8 pb-20 -mt-2 w-full">
      
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2 text-xs font-bold text-slate-400">
        <Link to="/" className="hover:text-white transition">SkillLaunch</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/jobs" className="hover:text-white transition">Talent Search</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-indigo-400">Search by Skill</span>
      </div>

      {/* Hero Header */}
      <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800 space-y-4 relative overflow-hidden">
        <div className="space-y-2 max-w-3xl relative z-10">
          <div className="inline-flex items-center space-x-1.5 text-xs font-black text-indigo-400">
            <Zap className="w-4 h-4 fill-indigo-400" />
            <span>Search 1,000+ Skills & Find Student Freelancers</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Find Students by Specific Skill</h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Search for exact technologies, tools, and creative disciplines. Discover verified students ready to work at budget-friendly rates.
          </p>
        </div>
      </div>

      {/* Main Search Bar & Quick Skill Filter Pills */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5 shadow-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-9 flex items-center space-x-3 px-4 bg-slate-950/80 rounded-2xl border border-slate-800">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setSelectedSkillPill('');
              }}
              placeholder="Search by skill (e.g. React.js, Python, Figma, Reel Editing, Logo Design, 3D Blender)..." 
              className="w-full py-3.5 bg-transparent text-sm text-white outline-none placeholder-slate-500"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSelectedSkillPill(''); }} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="sm:col-span-3">
            <button className="w-full h-full py-3.5 neon-airflow-btn text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-xl">
              Search Talent
            </button>
          </div>
        </div>

        {/* Popular Skill Pills Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          <span className="text-xs font-bold text-slate-400 mr-1">Popular Skills:</span>
          {popularPills.map(skill => (
            <button
              key={skill}
              onClick={() => handleSkillPillClick(skill)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                (selectedSkillPill === skill || searchQuery.toLowerCase() === skill.toLowerCase())
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-indigo-500/50 hover:text-white'
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Layout: Sidebar + Student Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
        
        {/* Left Filter Sidebar */}
        <div className="lg:col-span-3 glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center space-x-2 text-xs font-black uppercase text-white pb-3 border-b border-slate-800">
            <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
            <span>Filter by Rate</span>
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
            <span className="font-black text-slate-300 block">Explore Categories</span>
            <Link to="/webdeveloper" className="block text-slate-400 hover:text-indigo-300">Website Developers</Link>
            <Link to="/editing" className="block text-slate-400 hover:text-indigo-300">Video & Reel Editors</Link>
            <Link to="/graphic-design" className="block text-slate-400 hover:text-indigo-300">Graphic Designers</Link>
            <Link to="/python-scripting" className="block text-slate-400 hover:text-indigo-300">Python & AI Coders</Link>
            <Link to="/mobile-apps" className="block text-slate-400 hover:text-indigo-300">Mobile Developers</Link>
            <Link to="/3d-artists" className="block text-slate-400 hover:text-indigo-300">3D Blender Artists</Link>
          </div>
        </div>

        {/* Center: Live Matching Student Profiles */}
        <div className="lg:col-span-9 space-y-6">
          <div className="flex justify-between items-center bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-black text-white">
              {searchQuery ? `Students with skill "${searchQuery}"` : 'All Available Student Freelancers'} ({filteredStudents.length})
            </h2>
            <span className="text-xs font-bold text-slate-400">Live PostgreSQL Database</span>
          </div>

          {loading ? (
            <div className="glass-panel p-12 text-center text-xs text-slate-400 rounded-3xl">
              Searching database for skilled students...
            </div>
          ) : filteredStudents.length === 0 ? (
            /* Empty State */
            <div className="glass-panel p-12 text-center rounded-3xl border border-slate-800 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">No Registered Students Found for "{searchQuery || 'this filter'}"</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Have this skill? Register as a student freelancer to have your profile and hourly rate appear in this search!
                </p>
              </div>
              <Link 
                to="/register"
                className="px-6 py-3 neon-airflow-btn text-white text-xs font-black rounded-2xl shadow-xl inline-flex items-center space-x-2 uppercase tracking-wider"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Register with this Skill</span>
              </Link>
            </div>
          ) : (
            /* Grid of Real Student Cards */
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

                    {/* Skill Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {(student.profile?.skills || [student.profile?.category || 'Student']).map((s, idx) => (
                        <span key={idx} className="px-2.5 py-0.5 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-800/80 mt-6">
                    <Link 
                      to={`/u/${student.username || student.id}`}
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
