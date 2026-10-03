import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, AlertTriangle, CheckCircle, Ban, Eye, EyeOff, User, 
  ArrowRight, ArrowLeft, ShieldCheck, Briefcase, Sparkles, RefreshCw 
} from 'lucide-react';
import API from '../services/api';

const FANCY_CHARACTERS = [
  'gojo', 'zenitsu', 'kakashi', 'itachi', 'luffy', 'zoro', 'tanjiro', 
  'sukuna', 'levi', 'eren', 'batman', 'spidey', 'stark', 'skywalker', 
  'neo', 'phantom', 'shadow', 'astral', 'valkyrie', 'cyber', 'phoenix', 
  'vader', 'dexter', 'kira', 'kenpachi', 'thor', 'wolverine', 'ragnar',
  'drstrange', 'goku', 'madara', 'shinobi', 'gohan', 'alchemist'
];

const generateUsernameSuggestions = (first, last) => {
  const f = (first || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
  const l = (last || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const r1 = Math.floor(10 + Math.random() * 900);
  const r2 = Math.floor(10 + Math.random() * 900);
  const name1 = `${f}${l}_${r1}`;
  const name2 = l ? `${f}_${l}${r2}` : `${f}_dev${r2}`;

  const pick1 = FANCY_CHARACTERS[Math.floor(Math.random() * FANCY_CHARACTERS.length)];
  let pick2 = FANCY_CHARACTERS[Math.floor(Math.random() * FANCY_CHARACTERS.length)];
  while (pick2 === pick1) {
    pick2 = FANCY_CHARACTERS[Math.floor(Math.random() * FANCY_CHARACTERS.length)];
  }

  const r3 = Math.floor(100 + Math.random() * 900);
  const r4 = Math.floor(10 + Math.random() * 90);
  const fancy1 = `${pick1}_${r3}`;
  const fancy2 = f.length >= 3 ? `${pick2}_${f.slice(0, 4)}${r4}` : `${pick2}_x${r4}`;

  return [
    { text: name1, type: 'standard' },
    { text: name2, type: 'standard' },
    { text: fancy1, type: 'aesthetic' },
    { text: fancy2, type: 'aesthetic' }
  ];
};

export default function RegisterPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Form State with Clean Empty Defaults
  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    password: '',
    username: '',
    role: 'STUDENT_FREELANCER',
    dobDay: '15',
    dobMonth: '05',
    dobYear: '2006',
    hasParentConsent: false
  });

  const [calculatedAge, setCalculatedAge] = useState(20);
  const [isBlockedAge, setIsBlockedAge] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameSuggestions, setUsernameSuggestions] = useState([]);

  // Letters-Only Sanitizer (Rejects numbers & special symbols)
  const sanitizeTextOnly = (val) => {
    return val.replace(/[^a-zA-Z\s]/g, '');
  };

  // Recalculate Age from Date Selectors
  const updateDob = (day, month, year) => {
    const birthDate = new Date(`${year}-${month}-${day}`);
    const today = new Date('2026-08-20');
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    setCalculatedAge(age);
    setIsBlockedAge(age < 16);
  };

  // Password Quality Check
  const password = form.password || '';
  const passwordCriteria = {
    hasMinLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  const passedCriteriaCount = Object.values(passwordCriteria).filter(Boolean).length;

  // Step 1 Validation -> Move to Step 2
  const handleStep1Next = (e) => {
    e.preventDefault();
    setError('');

    if (form.firstName.trim().length < 3) {
      setError('First Name must contain at least 3 letters.');
      return;
    }

    if (form.lastName.trim().length < 3) {
      setError('Last Name must contain at least 3 letters.');
      return;
    }

    if (calculatedAge < 16) {
      setError('Registration blocked: You must be at least 16 years old to join SkillLaunch.');
      return;
    }

    if (calculatedAge < 18 && !form.hasParentConsent) {
      setError('Please confirm parental/guardian consent.');
      return;
    }

    if (passedCriteriaCount < 5) {
      setError('Please ensure your password satisfies all 5 security criteria.');
      return;
    }

    const suggestions = generateUsernameSuggestions(form.firstName, form.lastName);
    setUsernameSuggestions(suggestions);
    if (!form.username) {
      setForm(prev => ({ ...prev, username: suggestions[0].text }));
    }

    setStep(2);
  };

  // Final Registration Call
  const handleCompleteRegistration = async (selectedRole) => {
    setError('');
    setLoading(true);

    const dobString = `${form.dobYear}-${form.dobMonth}-${form.dobDay}`;

    try {
      const res = await API.post('/auth/register', {
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        username: form.username,
        role: selectedRole || form.role,
        age: calculatedAge,
        dob: dobString
      });

      localStorage.setItem('token', res.data.token);
      onLoginSuccess(res.data.user);

      if (selectedRole === 'STUDENT_FREELANCER') {
        navigate(`/u/${res.data.user.username}`);
      } else {
        navigate('/client/portal');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="neon-border-box max-w-xl w-full p-8 sm:p-10 shadow-2xl relative">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl font-black text-white">
              {step === 1 && "Create Your Free Account"}
              {step === 2 && "Choose Your Username"}
              {step === 3 && "Select Account Type"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Step {step} of 3 • SkillLaunch Student Hub</p>
          </div>
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="p-2 text-slate-400 hover:text-white flex items-center space-x-1 text-xs font-bold">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}
        </div>

        {error && (
          <div className="p-3.5 bg-red-500/15 border border-red-500/40 rounded-2xl text-xs text-red-300 flex items-start space-x-2.5 mb-5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-bold">{error}</span>
          </div>
        )}

        {/* ─── STEP 1: NAME (LETTERS ONLY), EMAIL, GRAPHICAL CALENDAR & PASSWORD ─── */}
        {step === 1 && (
          <form onSubmit={handleStep1Next} className="space-y-4">
            
            {/* First, Middle, Last Name Inputs (Letters Only Filter, min 3 chars) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">First Name</label>
                <input 
                  required 
                  type="text" 
                  value={form.firstName} 
                  onChange={e => setForm({...form, firstName: sanitizeTextOnly(e.target.value)})} 
                  placeholder="Min 3 letters" 
                  className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-indigo-500" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">Middle Name <span className="text-[9px] text-slate-500 font-normal">(Optional)</span></label>
                <input 
                  type="text" 
                  value={form.middleName} 
                  onChange={e => setForm({...form, middleName: sanitizeTextOnly(e.target.value)})} 
                  placeholder="Optional" 
                  className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-indigo-500" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">Last Name</label>
                <input 
                  required 
                  type="text" 
                  value={form.lastName} 
                  onChange={e => setForm({...form, lastName: sanitizeTextOnly(e.target.value)})} 
                  placeholder="Min 3 letters" 
                  className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-indigo-500" 
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
              <input 
                required 
                type="email" 
                value={form.email} 
                onChange={e => setForm({...form, email: e.target.value})} 
                placeholder="student@university.edu or email@gmail.com" 
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white outline-none focus:border-indigo-500" 
              />
            </div>

            {/* Graphical Date of Birth Picker */}
            <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-black text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span>Date of Birth</span>
                </label>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-md ${
                  calculatedAge >= 18 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                  calculatedAge >= 16 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                  'bg-red-500/20 text-red-300 border border-red-500/40'
                }`}>
                  Age: {calculatedAge} Years Old
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Day */}
                <select 
                  value={form.dobDay} 
                  onChange={e => {
                    setForm({...form, dobDay: e.target.value});
                    updateDob(e.target.value, form.dobMonth, form.dobYear);
                  }}
                  className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none font-bold"
                >
                  {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                {/* Month */}
                <select 
                  value={form.dobMonth} 
                  onChange={e => {
                    setForm({...form, dobMonth: e.target.value});
                    updateDob(form.dobDay, e.target.value, form.dobYear);
                  }}
                  className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none font-bold"
                >
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                    <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
                  ))}
                </select>

                {/* Year */}
                <select 
                  value={form.dobYear} 
                  onChange={e => {
                    setForm({...form, dobYear: e.target.value});
                    updateDob(form.dobDay, form.dobMonth, e.target.value);
                  }}
                  className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none font-bold"
                >
                  {Array.from({ length: 45 }, (_, i) => String(2010 - i)).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Age Verification Messages */}
              {isBlockedAge && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-xs text-red-300 flex items-center space-x-2 font-bold">
                  <Ban className="w-4 h-4 text-red-400 shrink-0" />
                  <span>You must be at least 16 years old to work or register on SkillLaunch.</span>
                </div>
              )}

              {calculatedAge >= 16 && calculatedAge < 18 && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/40 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-amber-300">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Minor Freelancer (Ages 16–17)</span>
                  </div>
                  <label className="flex items-start space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input 
                      type="checkbox" 
                      required 
                      checked={form.hasParentConsent} 
                      onChange={e => setForm({...form, hasParentConsent: e.target.checked})}
                      className="w-4 h-4 mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-0" 
                    />
                    <span>I confirm I have parental/guardian consent to work and receive payments to a parent-linked account.</span>
                  </label>
                </div>
              )}
            </div>

            {/* Password with Eye Toggle & Criteria */}
            <div className="space-y-2">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">Create Password</label>
              <div className="relative">
                <input 
                  required 
                  type={showPassword ? "text" : "password"} 
                  value={form.password} 
                  onChange={e => setForm({...form, password: e.target.value})} 
                  placeholder="••••••••" 
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white outline-none focus:border-indigo-500 pr-11" 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Security Checklist */}
              {password.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5 pt-2 text-[10px] font-bold">
                  {[
                    { label: '8+ Characters', valid: passwordCriteria.hasMinLength },
                    { label: 'Uppercase (A-Z)', valid: passwordCriteria.hasUpper },
                    { label: 'Lowercase (a-z)', valid: passwordCriteria.hasLower },
                    { label: 'Number (0-9)', valid: passwordCriteria.hasNumber },
                    { label: 'Special Symbol (!@#$)', valid: passwordCriteria.hasSpecial }
                  ].map((crit, idx) => (
                    <div key={idx} className={`flex items-center space-x-1.5 ${crit.valid ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {crit.valid ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <span>·</span>}
                      <span>{crit.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={isBlockedAge}
              className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition mt-4 ${
                isBlockedAge ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50' : 'neon-airflow-btn text-white cursor-pointer'
              }`}
            >
              Continue to Step 2 →
            </button>
          </form>
        )}

        {/* ─── STEP 2: CHOOSE USERNAME WITH 4 SMART SUGGESTIONS & REFRESH ─── */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-black text-white uppercase tracking-wider">Choose a Username</label>
                <button
                  type="button"
                  onClick={() => {
                    const fresh = generateUsernameSuggestions(form.firstName, form.lastName);
                    setUsernameSuggestions(fresh);
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center space-x-1.5 px-3 py-1 bg-indigo-950/60 hover:bg-indigo-900/80 rounded-xl border border-indigo-800/40 transition shadow-sm cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Suggestions</span>
                </button>
              </div>

              <p className="text-xs text-slate-400">Your unique profile handle on SkillLaunch (minimum 3 characters).</p>
              
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black text-sm">@</span>
                <input 
                  type="text" 
                  required
                  value={form.username} 
                  onChange={e => setForm({...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})}
                  placeholder="your_unique_username"
                  className="w-full pl-9 pr-4 py-3.5 bg-slate-950 border-2 border-indigo-500/50 rounded-2xl text-sm font-black text-white outline-none focus:border-indigo-400" 
                />
              </div>

              {/* 4 Suggestions: 2 Classic + 2 Aesthetic / Anime / Comic Fancy */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold uppercase text-slate-400 block">Click a suggestion to select:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {usernameSuggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setForm({ ...form, username: sug.text })}
                      className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-between group cursor-pointer ${
                        form.username === sug.text 
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' 
                          : sug.type === 'aesthetic'
                          ? 'bg-gradient-to-r from-purple-950/40 to-pink-950/40 hover:from-purple-900/60 hover:to-pink-900/60 border-purple-800/40 text-purple-200'
                          : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        {sug.type === 'aesthetic' ? (
                          <Sparkles className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        )}
                        <span className="truncate">@{sug.text}</span>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase shrink-0 ${
                        sug.type === 'aesthetic' ? 'bg-pink-500/20 text-pink-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {sug.type === 'aesthetic' ? 'Fancy' : 'Classic'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={() => {
                if (!form.username || form.username.trim().length < 3) {
                  return setError('Please choose a username of at least 3 characters.');
                }
                setError('');
                setStep(3);
              }}
              className="w-full py-3.5 neon-airflow-btn text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-xl cursor-pointer"
            >
              Next (Select Account Type) →
            </button>
          </div>
        )}

        {/* ─── STEP 3: SELECT ACCOUNT TYPE ─── */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-black text-white">Select account type</h3>
              <p className="text-xs text-slate-400">Don't worry, this can be changed later in settings.</p>
            </div>

            <div className="space-y-4">
              <div 
                onClick={() => handleCompleteRegistration('STUDENT_FREELANCER')}
                className="p-6 glass-panel rounded-3xl border-2 border-slate-800 hover:border-indigo-500 hover:bg-slate-900/80 cursor-pointer transition flex items-center space-x-5 group shadow-xl"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition shrink-0">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white group-hover:text-indigo-300 transition">Earn money freelancing</h4>
                  <p className="text-xs text-slate-400 mt-1">I am a student looking to complete projects, earn income, and build my verified portfolio.</p>
                </div>
              </div>

              <div 
                onClick={() => handleCompleteRegistration('CLIENT')}
                className="p-6 glass-panel rounded-3xl border-2 border-slate-800 hover:border-pink-500 hover:bg-slate-900/80 cursor-pointer transition flex items-center space-x-5 group shadow-xl"
              >
                <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 group-hover:scale-110 transition shrink-0">
                  <Briefcase className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white group-hover:text-pink-300 transition">Hire a student freelancer</h4>
                  <p className="text-xs text-slate-400 mt-1">I am a client looking to hire talented students at honest rates for projects.</p>
                </div>
              </div>
            </div>

            {loading && <p className="text-xs text-indigo-400 font-bold text-center animate-pulse">Creating your verified profile in database...</p>}
          </div>
        )}

      </div>
    </div>
  );
}
