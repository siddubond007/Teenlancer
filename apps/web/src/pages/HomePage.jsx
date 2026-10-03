import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, ShieldCheck, Flame, PlusCircle, FolderPlus, ArrowRight, Star, Zap, 
  Award, CheckCircle2, Play, Check, ArrowUpRight, Globe, Layers, PhoneCall,
  Clock, DollarSign, Lock
} from 'lucide-react';

const AS_SEEN_ON = [
  'The New York Times', 'CNBC', 'THE WALL STREET JOURNAL', 'CNN', 'Bloomberg', 'yahoo! finance', 'BUSINESS INSIDER', 'Forbes'
];

const SKILL_CATEGORIES_DIR = [
  ['Website Design', 'Mobile Apps', 'Android Apps', 'iPhone Apps', 'Software Architecture', 'Graphic Design', 'Logo Design', 'Public Relations', 'Logistics', 'Proofreading', 'Translation', 'Research'],
  ['Research Writing', 'Article Writing', 'Web Scraping', 'HTML', 'CSS', 'HTML 5', 'Javascript', 'Python', 'Wordpress', 'Web Search', 'Finance', 'C++ Programming'],
  ['Legal', 'Linux', 'Manufacturing', 'Data Entry', 'Content Writing', 'Marketing', 'Excel', 'Ghostwriting', 'Copywriting', 'Accounting', 'MySQL', 'Link Building'],
  ['Banner Design', 'Illustration', 'Link Building', 'C# Programming', 'PHP', '3D Modelling', 'Photoshop', 'Technical Writing', 'Blogging', 'Internet Marketing', 'eCommerce', 'View more →']
];

export default function HomePage({ currentUser }) {
  const [hoveredMosaic, setHoveredMosaic] = useState(null);

  return (
    <div className="space-y-24 pb-20 -mt-4">
      
      {/* ─── 1. HERO SECTION WITH VIDEO/CANVAS LOOP & PROJECT CALLOUT ─── */}
      <section className="relative min-h-[640px] rounded-3xl overflow-hidden border border-slate-800/80 glass-panel flex flex-col justify-between p-8 sm:p-14 shadow-2xl">
        
        {/* Background Ambient Cyber Video Simulation */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent z-10" />
          <img 
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1800&q=80" 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-35 scale-105 filter blur-[1px]"
          />
        </div>

        {/* Hero Content Left */}
        <div className="relative z-20 max-w-2xl space-y-6 pt-4">
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
            Hire the best student freelancers for any project, online.
          </h1>

          <ul className="space-y-2.5 text-sm sm:text-base text-slate-300 font-medium">
            <li className="flex items-center space-x-2.5">
              <span className="w-2 h-2 rounded-full bg-pink-500 shadow-lg shadow-pink-500/50" />
              <span>India's largest student freelancer network (Ages 16–26)</span>
            </li>
            <li className="flex items-center space-x-2.5">
              <span className="w-2 h-2 rounded-full bg-pink-500 shadow-lg shadow-pink-500/50" />
              <span>Any tech, design, editing, or writing task you can think of</span>
            </li>
            <li className="flex items-center space-x-2.5">
              <span className="w-2 h-2 rounded-full bg-pink-500 shadow-lg shadow-pink-500/50" />
              <span>Save up to 70% with hungry freshers & get bids in minutes</span>
            </li>
            <li className="flex items-center space-x-2.5">
              <span className="w-2 h-2 rounded-full bg-pink-500 shadow-lg shadow-pink-500/50" />
              <span>Pay safely with 5-Day Escrow only when you're 100% satisfied</span>
            </li>
          </ul>

          <div className="flex flex-wrap gap-4 pt-4">
            <Link 
              to="/register"
              className="px-8 py-4 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-black text-sm rounded-2xl shadow-xl shadow-pink-600/30 transition transform hover:-translate-y-0.5"
            >
              Hire a Student
            </Link>
            <Link 
              to="/register"
              className="px-8 py-4 bg-slate-900/90 border border-slate-700 hover:border-white text-white font-black text-sm rounded-2xl transition"
            >
              Earn Money Freelancing
            </Link>
          </div>
        </div>

        {/* Dynamic Proof-of-Work Badge Bottom-Right (Screenshot 1) */}
        <div className="relative z-20 self-end text-right pt-8">
          <div className="inline-block p-4 glass-panel rounded-2xl border border-slate-700/60 shadow-2xl max-w-sm text-left">
            <div className="flex items-center space-x-1 text-amber-400 font-bold text-xs mb-1">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>5.0 Star Verified Work</span>
            </div>
            <h4 className="text-sm font-black text-white">Aarav J. <span className="text-slate-400 text-xs font-normal">@aarav_codes (IIT Madras)</span></h4>
            <p className="text-xs text-slate-300 mt-1">
              "This AI web app & PostgreSQL architecture cost ₹1,500 and took 3 days."
            </p>
          </div>
        </div>
      </section>

      {/* ─── 2. "YEAR OF THE LAUNCH" 4-QUADRANT SHOWCASE (Screenshot 5) ─── */}
      <section className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider">Campaign Spotlight</span>
            <h2 className="text-3xl font-black text-white mt-1">YEAR OF THE LAUNCH</h2>
            <p className="text-xs text-slate-400">The year you finally launch your startup ideas with student builders.</p>
          </div>
          <Link to="/jobs" className="px-6 py-2.5 neon-airflow-btn text-white text-xs font-black rounded-xl shadow-lg self-start">
            Launch Now &gt;
          </Link>
        </div>

        {/* 4-Quadrant Visual Collage */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: '3D Mechanical Design', cost: '₹1,200', days: '4 days', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80' },
            { title: 'Watch Exploded Render', cost: '₹1,500', days: '3 days', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80' },
            { title: 'Brand Packaging & Cups', cost: '₹800', days: '2 days', img: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=400&q=80' },
            { title: 'Mobile App Figma UI', cost: '₹1,400', days: '3 days', img: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=400&q=80' }
          ].map((item, idx) => (
            <div key={idx} className="relative h-64 rounded-2xl overflow-hidden group border border-slate-800 shadow-xl">
              <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <span className="text-xs font-black text-white block">{item.title}</span>
                <span className="text-[10px] text-emerald-400 font-bold">Delivered for {item.cost} in {item.days}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 3. "MAKE IT REAL" DUAL SMARTPHONE SHOWCASE (Screenshot 6) ─── */}
      <section className="glass-panel p-8 sm:p-14 rounded-3xl border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-pink-500/10 border border-pink-500/30 rounded-full text-xs font-black text-pink-400">
            <span>Make it real with SkillLaunch</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Build your dreams with verified student talent.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="space-y-1.5">
              <h4 className="text-base font-black text-white">The best talent</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Discover reliable students by exploring verified portfolios and feedback.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-base font-black text-white">Fast bids</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Get quick quotes from eager students within 60 seconds of posting.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-base font-black text-white">Quality work</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Fresh, modern ideas across coding, design, video editing, and AI.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-base font-black text-white">Be in control</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Stay updated on the go with real-time AI chat and 5-day escrow milestones.
              </p>
            </div>
          </div>

          <div className="pt-4">
            <Link to="/register" className="inline-flex items-center space-x-2 text-pink-400 hover:text-pink-300 font-black text-sm">
              <span>Make your dreams a reality. Get started now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Dual Phone Mockup with Floating Review & Quote Badges */}
        <div className="lg:col-span-6 relative flex justify-center py-6">
          <div className="relative w-72 sm:w-80 h-[460px] bg-slate-900 border-4 border-slate-800 rounded-[40px] shadow-2xl p-4 overflow-hidden">
            {/* Phone Screen Mock */}
            <div className="h-full bg-slate-950 rounded-[30px] p-4 flex flex-col justify-between">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 border-b border-slate-800 pb-2">
                <span>SkillLaunch App</span>
                <span className="text-emerald-400">Escrow: ₹999</span>
              </div>

              <div className="space-y-3 my-auto">
                <div className="p-3 bg-slate-900 rounded-2xl text-xs text-slate-200 border border-slate-800">
                  <div className="flex items-center space-x-1 text-amber-400 text-[10px] font-bold">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>5.0 Rating • Priya P.</span>
                  </div>
                  <p className="mt-1 text-[11px]">"I need a reel video editor for our college fest promo!"</p>
                </div>

                <div className="p-3 bg-indigo-600/30 border border-indigo-500/40 rounded-2xl text-xs text-indigo-200 ml-4">
                  <p className="text-[11px]">"I can deliver the edited reel in 24 hours with custom audio!"</p>
                  <span className="text-[10px] text-emerald-400 font-bold block mt-1">Quote: ₹499 • Pay securely</span>
                </div>
              </div>

              <button className="w-full py-2.5 bg-gradient-to-r from-pink-600 to-rose-500 text-white rounded-xl text-xs font-bold">
                Approve & Release Funds
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. "TAP INTO TALENT" GLOBAL MAP SECTION (Screenshot 7) ─── */}
      <section className="glass-panel p-8 sm:p-14 rounded-3xl border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative overflow-hidden">
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-xs font-black text-indigo-400">
            <span>Tap into a nationwide student network</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Connect with top engineering & design campuses.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="space-y-1">
              <h4 className="text-sm font-black text-white">1. Post your job</h4>
              <p className="text-xs text-slate-400">It's free! Receive competitive student bids in minutes.</p>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-white">2. Choose talent</h4>
              <p className="text-xs text-slate-400">Compare portfolios, GitHub projects, and college badges.</p>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-white">3. Pay safely</h4>
              <p className="text-xs text-slate-400">5-Day Escrow holds your money safely until you approve.</p>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-white">4. Dedicated support</h4>
              <p className="text-xs text-slate-400">AI chat moderation and fast dispute resolution.</p>
            </div>
          </div>

          <div className="pt-2">
            <Link to="/jobs" className="text-pink-400 font-black text-xs hover:underline">
              Create the future. Get started now →
            </Link>
          </div>
        </div>

        {/* Ambient Map with Floating Verified Student Cards */}
        <div className="lg:col-span-6 relative h-[360px] bg-slate-950/80 rounded-3xl border border-slate-800 p-4 flex items-center justify-center">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="space-y-3 relative z-10 w-full max-w-sm">
            {[
              { name: 'Rohan V.', role: 'Figma UI/UX • B.Des', rating: '5.0 ★★★★★', college: 'NID Ahmedabad' },
              { name: 'Sneha M.', role: 'Python/AI • 3rd Year', rating: '5.0 ★★★★★', college: 'IIT Bombay' },
              { name: 'Karan D.', role: '3D Blender Artist', rating: '4.9 ★★★★★', college: 'BITS Pilani' }
            ].map((st, i) => (
              <div key={i} className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl flex justify-between items-center shadow-lg hover:border-indigo-500/50 transition">
                <div>
                  <h5 className="text-xs font-black text-white">{st.name} <span className="text-indigo-400 text-[10px]">({st.college})</span></h5>
                  <span className="text-[11px] text-slate-400">{st.role}</span>
                </div>
                <span className="text-xs font-black text-pink-400">{st.rating}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. "AS SEEN ON" PRESS BAR & NEON MOSAIC GALLERY (Screenshots 8, 9, 10) ─── */}
      <section className="space-y-10">
        <div className="text-center space-y-4">
          <span className="text-xs font-black uppercase tracking-widest text-slate-500">As seen on</span>
          <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12 opacity-60">
            {AS_SEEN_ON.map(logo => (
              <span key={logo} className="text-xs sm:text-sm font-black text-slate-300 uppercase tracking-wider">{logo}</span>
            ))}
          </div>
        </div>

        {/* 5-Tile Interactive Category Mosaic */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { id: '1', title: 'Website Design', desc: 'Modern responsive web apps built by student coders.', img: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80' },
            { id: '2', title: 'Research Writing', desc: 'Detailed academic reports and technical documentation.', img: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80' },
            { id: '3', title: 'Interior & 3D Design', desc: 'Walk through it before you build it.', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80' },
            { id: '4', title: 'Banner & Social Design', desc: 'High-converting graphics for your digital brand.', img: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=600&q=80' },
            { id: '5', title: 'Mobile App Development', desc: 'Native iOS & Android apps from campus coders.', img: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=600&q=80' },
            { id: '6', title: 'Video & Motion Graphics', desc: 'Viral reels and YouTube edits that drive retention.', img: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=80' }
          ].map((tile) => (
            <div 
              key={tile.id}
              onMouseEnter={() => setHoveredMosaic(tile.id)}
              onMouseLeave={() => setHoveredMosaic(null)}
              className="relative h-72 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl group cursor-pointer"
            >
              <img src={tile.img} alt={tile.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              <div className={`absolute inset-0 transition-all duration-300 ${
                hoveredMosaic === tile.id ? 'bg-gradient-to-t from-pink-700/95 via-pink-900/80 to-transparent' : 'bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent'
              }`} />

              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">{tile.title}</h3>
                <p className="text-xs text-slate-300 mt-1">{tile.desc}</p>
                {hoveredMosaic === tile.id && (
                  <Link to="/jobs" className="mt-4 inline-flex items-center space-x-1 text-xs font-black text-white bg-slate-950/80 px-4 py-2 rounded-xl self-start">
                    <span>Post a Project &gt;</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 6. "GET WORK DONE IN 4,000+ CATEGORIES" DIRECTORY (Screenshot 11) ─── */}
      <section className="glass-panel p-8 sm:p-14 rounded-3xl border border-slate-800 space-y-8">
        <div className="max-w-xl">
          <span className="text-xs font-black uppercase text-pink-400 tracking-wider">Massive Student Skill Directory</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-1">Get work done in over 4,000 different categories</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4 text-xs text-slate-400">
          {SKILL_CATEGORIES_DIR.map((col, cIdx) => (
            <div key={cIdx} className="space-y-2.5">
              {col.map((skill, sIdx) => (
                <Link to="/gigs" key={sIdx} className="block hover:text-white transition">
                  {skill}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ─── 7. ENTERPRISE PRE-FOOTER CALLOUT (Screenshot 12) ─── */}
      <section className="p-8 sm:p-12 bg-gradient-to-r from-indigo-900/40 via-violet-900/30 to-pink-900/30 border border-slate-800 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="max-w-2xl">
          <h3 className="text-2xl font-black text-white">Millions of student professionals on demand.</h3>
          <p className="text-xs text-slate-400 mt-1">Why pay high agency overheads when you can integrate our verified student talent pool directly?</p>
        </div>
        <Link to="/register" className="px-6 py-3 neon-airflow-btn text-white text-xs font-black rounded-2xl shrink-0">
          View Enterprise Solutions →
        </Link>
      </section>

      {/* ─── 8. 6-COLUMN MASTER FOOTER WITH REALTIME COUNTERS (Screenshot 13) ─── */}
      <footer className="border-t border-slate-800 pt-16 space-y-12 text-slate-400 text-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
          
          {/* Col 1: Brand & Language */}
          <div className="space-y-4 col-span-2 sm:col-span-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">S</div>
              <span className="text-lg font-black text-white">SkillLaunch</span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1.5">
              <div className="flex items-center space-x-1.5 text-white font-bold"><Globe className="w-3.5 h-3.5" /><span>India (English)</span></div>
              <div>Help & Support</div>
              <div>Accessibility</div>
            </div>
          </div>

          {/* Col 2: Network */}
          <div className="space-y-2.5">
            <span className="text-xs font-black text-white block uppercase">Network</span>
            <div><Link to="/gigs" className="hover:text-white">Categories</Link></div>
            <div><Link to="/jobs" className="hover:text-white">Projects</Link></div>
            <div><Link to="/gigs" className="hover:text-white">Gigs</Link></div>
            <div><Link to="/jobs" className="hover:text-white">Contests</Link></div>
            <div><Link to="/gigs" className="hover:text-white">Student Portfolios</Link></div>
            <div><Link to="/jobs" className="hover:text-white">Showcase</Link></div>
          </div>

          {/* Col 3: About */}
          <div className="space-y-2.5">
            <span className="text-xs font-black text-white block uppercase">About</span>
            <div><Link to="/" className="hover:text-white">About Us</Link></div>
            <div><Link to="/" className="hover:text-white">How it Works</Link></div>
            <div><Link to="/" className="hover:text-white">Security & Escrow</Link></div>
            <div><Link to="/" className="hover:text-white">Investor Relations</Link></div>
            <div><Link to="/" className="hover:text-white">Careers</Link></div>
          </div>

          {/* Col 4: Terms */}
          <div className="space-y-2.5">
            <span className="text-xs font-black text-white block uppercase">Terms</span>
            <div><Link to="/" className="hover:text-white">Privacy Policy</Link></div>
            <div><Link to="/" className="hover:text-white">Terms and Conditions</Link></div>
            <div><Link to="/" className="hover:text-white">Escrow Rules</Link></div>
            <div><Link to="/" className="hover:text-white">Minor Compliance</Link></div>
            <div><Link to="/" className="hover:text-white">Fees and Charges</Link></div>
          </div>

          {/* Col 5: Partners */}
          <div className="space-y-2.5">
            <span className="text-xs font-black text-white block uppercase">Partners</span>
            <div><span className="hover:text-white">Razorpay Escrow</span></div>
            <div><span className="hover:text-white">Campus Student Clubs</span></div>
            <div><span className="hover:text-white">University Affiliates</span></div>
          </div>

          {/* Col 6: Mobile Apps */}
          <div className="space-y-3">
            <span className="text-xs font-black text-white block uppercase">Get App</span>
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-center font-bold text-white text-[11px]">App Store</div>
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-center font-bold text-white text-[11px]">Google Play</div>
          </div>
        </div>

        {/* Live Counters & Copyright Bar */}
        <div className="border-t border-slate-800/80 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex space-x-8 text-sm font-black text-white">
            <div><span className="text-pink-400">89,588,964</span> Registered Students</div>
            <div><span className="text-emerald-400">25,789,566</span> Projects Completed</div>
          </div>
          <div className="text-[11px] text-slate-500">
            © 2026 SkillLaunch Marketplace Technologies Pvt Ltd. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
