import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, ShieldCheck, CheckCircle2, ChevronRight, ArrowRight, 
  MapPin, Clock, DollarSign, Award, PlusCircle, Filter, Search
} from 'lucide-react';

const TALENT_DATA = {
  'graphic-design': {
    title: 'Graphic Designers',
    heroTag: 'Hire expert Graphic Designers for any job',
    heroDesc: 'Millions of businesses and startups use SkillLaunch to turn visual ideas into reality with verified student creators.',
    whatIs: 'Graphic design refers to visual communication through imagery, space, typography, and color palettes to create memorable branding.',
    students: [
      {
        username: 'seabitmedia',
        name: 'Seabit Media',
        rating: 4.9,
        reviewsCount: 7252,
        onBudget: '100%',
        score: '9.8',
        location: 'Kolkata, India',
        rate: '₹499',
        college: 'Rabindra Bharati University (Fine Arts)',
        skills: ['Graphic Design', 'Website Design', 'Logo Design', 'Illustrator', 'Figma'],
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
      },
      {
        username: 'rohanverma',
        name: 'Rohan Verma',
        rating: 4.9,
        reviewsCount: 3376,
        onBudget: '100%',
        score: '9.0',
        location: 'Bengaluru, India',
        rate: '₹599',
        college: 'National Institute of Design (3rd Year)',
        skills: ['Logo Design', 'Banner Design', 'Photoshop', 'Brand Identity'],
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80'
      },
      {
        username: 'ananyarao',
        name: 'Ananya Rao',
        rating: 5.0,
        reviewsCount: 3991,
        onBudget: '96%',
        score: '10.0',
        location: 'Hyderabad, India',
        rate: '₹750',
        college: 'IIT Guwahati (Design Dept)',
        skills: ['Figma UI/UX', 'Mobile App UI', 'Design Systems', 'Vector Art'],
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80'
      }
    ]
  },
  'web-development': {
    title: 'Web Developers',
    heroTag: 'Hire expert Web Developers for any project',
    heroDesc: 'Connect with top student coders from premier engineering institutes building responsive, full-stack web applications.',
    whatIs: 'Web development covers full-stack web architecture, React frontends, Node.js APIs, database engineering, and fast performance optimization.',
    students: [
      {
        username: 'aaravsharma',
        name: 'Aarav Sharma',
        rating: 4.9,
        reviewsCount: 4120,
        onBudget: '100%',
        score: '9.9',
        location: 'Chennai, India',
        rate: '₹699',
        college: 'IIT Madras (B.Tech CSE, 2nd Year)',
        skills: ['React.js', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'Next.js'],
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
      }
    ]
  },
  'video-editing': {
    title: 'Video & Reel Editors',
    heroTag: 'Hire expert Video & Reel Editors for any project',
    heroDesc: 'Level up your retention with students creating viral Instagram reels, TikToks, and YouTube long-form edits.',
    whatIs: 'Video editing includes color grading, sound design, animated subtitles, jump cuts, and motion graphics designed for maximum audience engagement.',
    students: [
      {
        username: 'priyapatel',
        name: 'Priya Patel',
        rating: 5.0,
        reviewsCount: 2840,
        onBudget: '100%',
        score: '10.0',
        location: 'Mumbai, India',
        rate: '₹450',
        college: 'Higher Secondary School (Minor Verified)',
        skills: ['Premiere Pro', 'CapCut', 'After Effects', 'Sound FX', 'Subtitles'],
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80'
      }
    ]
  }
};

export default function HireCategoryPage({ currentUser }) {
  const { categorySlug } = useParams();
  const navigate = useNavigate();

  const data = TALENT_DATA[categorySlug] || {
    title: categorySlug ? categorySlug.replace(/-/g, ' ').toUpperCase() : 'Student Freelancers',
    heroTag: `Hire expert Student Freelancers in ${categorySlug?.replace(/-/g, ' ')}`,
    heroDesc: 'Connect with verified student talent ready to deliver exceptional results at honest budget rates.',
    whatIs: 'Professional freelance services delivered by verified students with 5-day escrow protection.',
    students: []
  };

  return (
    <div className="space-y-12 pb-20 -mt-4">
      
      {/* ─── 1. CATEGORY HERO BANNER (Screenshot 29) ─── */}
      <section className="relative min-h-[460px] rounded-3xl overflow-hidden glass-panel border border-slate-800 p-8 sm:p-14 flex flex-col justify-between shadow-2xl">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent z-10" />
          <img 
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1600&q=80" 
            alt="Hero" 
            className="w-full h-full object-cover opacity-35 scale-105"
          />
        </div>

        <div className="relative z-20 space-y-4 max-w-2xl">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400">
            <Link to="/" className="hover:text-white">SkillLaunch</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Hire</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-pink-400">{data.title}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
            Hire expert <span className="text-pink-500">{data.title}</span> for any project
          </h1>

          <p className="text-sm text-slate-300 max-w-lg leading-relaxed">{data.heroDesc}</p>

          <div className="pt-2">
            <Link 
              to="/register"
              className="px-8 py-3.5 bg-gradient-to-r from-pink-600 to-rose-500 text-white text-xs font-black rounded-2xl shadow-xl shadow-pink-600/30 uppercase tracking-wider inline-block"
            >
              Hire a top {data.title} now
            </Link>
          </div>
        </div>

        {/* Client Logos Bar (Screenshot 29) */}
        <div className="relative z-20 pt-8 border-t border-slate-800/80 flex flex-wrap items-center gap-8 text-xs font-black text-slate-400 opacity-60">
          <span>TRUSTED BY LEADING BRANDS:</span>
          {['NASA', 'Deloitte.', 'FACEBOOK', 'AIRBUS', 'Adobe'].map(brand => (
            <span key={brand} className="text-white tracking-widest uppercase">{brand}</span>
          ))}
        </div>
      </section>

      {/* ─── 2. WHAT IS & HIRE CARDS (Screenshot 30) ─── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-3">
          <h3 className="text-xl font-black text-white">What is {data.title}?</h3>
          <p className="text-xs text-slate-300 leading-relaxed">{data.whatIs}</p>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-3">
          <h3 className="text-xl font-black text-white">Hire a {data.title.slice(0, -1)}</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            On SkillLaunch, you can hire verified college freshers for custom projects, prototypes, or continuous tasks backed by 5-day escrow milestones.
          </p>
        </div>
      </section>

      {/* ─── 3. LIVE STATS BAR (Screenshot 30 & 31) ─── */}
      <section className="glass-panel p-8 rounded-3xl border border-slate-800 text-center space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white">{data.title} are ready — get proposals in seconds</h2>
          <p className="text-xs text-slate-400">Post your project for free and connect with skilled students ready to start today.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto py-2">
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
            <div className="text-2xl font-black text-white">~330 sec</div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">To First Proposal</span>
          </div>
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
            <div className="text-2xl font-black text-pink-400">93+</div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Proposals per Project</span>
          </div>
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
            <div className="text-2xl font-black text-emerald-400">2,680+</div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Students Online</span>
          </div>
        </div>

        <Link 
          to="/register"
          className="px-8 py-3.5 bg-gradient-to-r from-pink-600 to-rose-500 text-white text-xs font-black rounded-2xl shadow-xl uppercase tracking-wider inline-block"
        >
          Post your project — it's free
        </Link>
      </section>

      {/* ─── 4. FREELANCER DIRECTORY CARDS GRID (Screenshot 31 & 32) ─── */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black text-white">Hire {data.title}</h2>
          <span className="text-xs font-bold text-slate-400">Showing top verified student profiles</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.students.map(student => (
            <div key={student.username} className="glass-panel rounded-3xl border border-slate-800 p-6 flex flex-col justify-between hover:border-indigo-500/50 transition shadow-xl group">
              <div className="space-y-4">
                {/* Avatar & Header */}
                <div className="flex items-center space-x-3">
                  <img src={student.avatar} alt={student.name} className="w-14 h-14 rounded-2xl object-cover border border-slate-700" />
                  <div>
                    <h3 className="text-base font-black text-white flex items-center space-x-1.5">
                      <span>{student.name}</span>
                      <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                    </h3>
                    <div className="flex items-center space-x-1 text-xs font-bold text-amber-400 mt-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{student.rating} ({student.reviewsCount})</span>
                      <span className="text-slate-500 ml-1">• {student.onBudget} on budget</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-400 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{student.location}</span>
                </div>

                <div className="text-sm font-black text-emerald-400">
                  {student.rate} <span className="text-xs text-slate-500 font-normal">per hour</span>
                </div>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {student.skills.map(s => (
                    <span key={s} className="px-2.5 py-0.5 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* View Profile Button (Screenshot 32) */}
              <div className="pt-6 border-t border-slate-800/80 mt-6">
                <Link 
                  to={`/u/${student.username}`}
                  className="w-full py-2.5 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-300 hover:text-white rounded-xl text-xs font-black transition text-center block"
                >
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
