import os
import re

reg_path = os.path.expanduser('~/student-marketplace/frontend/src/pages/RegisterPage.jsx')
with open(reg_path, 'r') as f:
    reg_content = f.read()

# 1. Update lucide-react imports with Sparkles and RefreshCw
reg_content = re.sub(
    r"import\s*\{([^}]+)\}\s*from\s*['\"]lucide-react['\"];",
    """import { 
  Calendar, AlertTriangle, CheckCircle, Ban, Eye, EyeOff, User, 
  ArrowRight, ArrowLeft, ShieldCheck, Briefcase, Sparkles, RefreshCw 
} from 'lucide-react';""",
    reg_content
)

# 2. Add FANCY_CHARACTERS & generator helper
if 'FANCY_CHARACTERS' not in reg_content:
    helpers = """const FANCY_CHARACTERS = [
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
"""
    reg_content = reg_content.replace(
        "export default function RegisterPage({ onLoginSuccess }) {",
        helpers + "\nexport default function RegisterPage({ onLoginSuccess }) {"
    )

# 3. Add usernameSuggestions state
if 'const [usernameSuggestions, setUsernameSuggestions] =' not in reg_content:
    reg_content = reg_content.replace(
        "const [loading, setLoading] = useState(false);",
        "const [loading, setLoading] = useState(false);\n  const [usernameSuggestions, setUsernameSuggestions] = useState([]);"
    )

# 4. Update Step 1 Validation (min 3 characters for names)
step1_old = """    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Please enter valid first and last names (letters only).');
      return;
    }"""

step1_new = """    if (form.firstName.trim().length < 3) {
      setError('First Name must contain at least 3 letters.');
      return;
    }

    if (form.lastName.trim().length < 3) {
      setError('Last Name must contain at least 3 letters.');
      return;
    }"""

reg_content = reg_content.replace(step1_old, step1_new)

# Step 1 username suggestion initialization
step1_sug_old = """    // Auto-generate clean username suggestion
    const cleanFirst = form.firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanLast = form.lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const defaultUsername = `${cleanFirst}${cleanLast}${Math.floor(100 + Math.random() * 900)}`;
    setForm(prev => ({ ...prev, username: prev.username || defaultUsername }));

    setStep(2);"""

step1_sug_new = """    const suggestions = generateUsernameSuggestions(form.firstName, form.lastName);
    setUsernameSuggestions(suggestions);
    if (!form.username) {
      setForm(prev => ({ ...prev, username: suggestions[0].text }));
    }

    setStep(2);"""

reg_content = reg_content.replace(step1_sug_old, step1_sug_new)

# 5. Update Step 2 UI with Refresh and 4 Badges (2 Classic + 2 Aesthetic)
step2_start = "{/* ─── STEP 2: CHOOSE USERNAME ─── */}"
step3_start = "{/* ─── STEP 3: SELECT ACCOUNT TYPE ─── */}"

new_step2_jsx = """{/* ─── STEP 2: CHOOSE USERNAME ─── */}
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

              {/* 4 Suggestions (2 Name-based Classic + 2 Aesthetic / Anime / Comic Fancy) */}
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

        """

if step2_start in reg_content and step3_start in reg_content:
    p1 = reg_content.split(step2_start)[0]
    p2 = reg_content.split(step3_start)
    reg_content = p1 + new_step2_jsx + step3_start + p2

with open(reg_path, 'w') as f:
    f.write(reg_content)

print('✅ Successfully updated RegisterPage.jsx with 3-letter name validation, 4 smart suggestions (Classic & Fancy Anime/Comic), and Refresh button!')
