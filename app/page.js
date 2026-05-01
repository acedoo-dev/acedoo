'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import {
  Atom, Sigma, FlaskConical, Dna,
  Cog, Zap, AudioWaveform, TrendingUp, Grid3X3, Beaker, Hexagon, TreePine,
  BookOpen, FileText,
  ArrowLeft, Dice6, RefreshCw, ImageUp, Copy, Eye, Sun, Moon, LayoutDashboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import concepts from '@/data/concepts.json';

// ── Config ─────────────────────────────────────────────────────────────────

const SUBJECTS = [
  {
    key: 'Physique', label: 'Physique', Icon: Atom,
    iconCls: 'text-blue-400',
    hoverCls: 'hover:border-blue-500/50 hover:shadow-[0_0_24px_rgba(59,130,246,0.25)]',
    selectedCls: 'border-blue-500/60 bg-blue-500/10',
    accentCls: 'text-blue-400',
    glowRgb: '59,130,246',
  },
  {
    key: 'Mathématiques', label: 'Mathématiques', Icon: Sigma,
    iconCls: 'text-violet-400',
    hoverCls: 'hover:border-violet-500/50 hover:shadow-[0_0_24px_rgba(139,92,246,0.25)]',
    selectedCls: 'border-violet-500/60 bg-violet-500/10',
    accentCls: 'text-violet-400',
    glowRgb: '139,92,246',
  },
  {
    key: 'Chimie', label: 'Chimie', Icon: FlaskConical,
    iconCls: 'text-emerald-400',
    hoverCls: 'hover:border-emerald-500/50 hover:shadow-[0_0_24px_rgba(16,185,129,0.25)]',
    selectedCls: 'border-emerald-500/60 bg-emerald-500/10',
    accentCls: 'text-emerald-400',
    glowRgb: '16,185,129',
  },
  {
    key: 'Biologie', label: 'Biologie', Icon: Dna,
    iconCls: 'text-orange-400',
    hoverCls: 'hover:border-orange-500/50 hover:shadow-[0_0_24px_rgba(249,115,22,0.25)]',
    selectedCls: 'border-orange-500/60 bg-orange-500/10',
    accentCls: 'text-orange-400',
    glowRgb: '249,115,22',
  },
];

const SUBJECT_MAP = Object.fromEntries(SUBJECTS.map(s => [s.key, s]));

const COURSE_ICONS = {
  'Mécanique (101)': Cog,
  'Électricité et magnétisme (201)': Zap,
  'Ondes et physique moderne (301)': AudioWaveform,
  'Calcul différentiel (103)': TrendingUp,
  'Calcul intégral (203)': Sigma,
  'Algèbre linéaire (105)': Grid3X3,
  'Chimie générale (101)': FlaskConical,
  'Chimie des solutions (201)': Beaker,
  'Chimie organique (202)': Hexagon,
  'Évolution et diversité du vivant (101)': TreePine,
  'Génétique (401)': Dna,
};

const MODES = [
  {
    key: 'apprendre', label: 'Apprendre', Icon: BookOpen,
    iconCls: 'text-cyan-400',
    hoverCls: 'hover:border-cyan-500/50 hover:shadow-[0_0_24px_rgba(6,182,212,0.25)]',
    selectedCls: 'border-cyan-500/60 bg-cyan-500/10',
    description: 'Explications détaillées du concept',
  },
  {
    key: 'courtes', label: 'Questions courtes', Icon: Zap,
    iconCls: 'text-emerald-400',
    hoverCls: 'hover:border-emerald-500/50 hover:shadow-[0_0_24px_rgba(16,185,129,0.25)]',
    selectedCls: 'border-emerald-500/60 bg-emerald-500/10',
    description: 'Réponses rapides, calculs directs',
  },
  {
    key: 'longues', label: 'Questions longues', Icon: FileText,
    iconCls: 'text-orange-400',
    hoverCls: 'hover:border-orange-500/50 hover:shadow-[0_0_24px_rgba(249,115,22,0.25)]',
    selectedCls: 'border-orange-500/60 bg-orange-500/10',
    description: 'Problèmes approfondis, multi-étapes',
  },
];

const MODE_MAP = Object.fromEntries(MODES.map(m => [m.key, m]));

const DIFFICULTIES = ['Facile', 'Moyen', 'Difficile'];
const DIFF_STYLE = {
  Facile:   'bg-green-100  dark:bg-green-900/50  text-green-600  dark:text-green-400  border-green-300  dark:border-green-700/50',
  Moyen:    'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700/50',
  Difficile:'bg-red-100    dark:bg-red-900/50    text-red-600    dark:text-red-400    border-red-300    dark:border-red-700/50',
};
const DIFF_INACTIVE = 'bg-transparent border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500';

const TIMER_OPTIONS = [
  { label: '⏱', value: 0, title: 'Pas de minuterie' },
  { label: '5 min', value: 300 },
  { label: '10 min', value: 600 },
  { label: '15 min', value: 900 },
];

// ── Markdown ────────────────────────────────────────────────────────────────

const mdProps = {
  remarkPlugins: [remarkMath],
  rehypePlugins: [[rehypeKatex, { throwOnError: false, errorColor: '#ff6b6b', strict: false }]],
};

const contentCls =
  'text-base leading-relaxed ' +
  '[&_p]:mb-4 [&_p:last-child]:mb-0 ' +
  '[&_strong]:font-semibold ' +
  '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 ' +
  '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 ' +
  '[&_li]:mb-1 ' +
  '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 ' +
  '[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4';

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseCourse(key) {
  const m = key.match(/^(.+?)\s*\((\d+)\)$/);
  return m ? { name: m[1].trim(), code: m[2] } : { name: key, code: '' };
}

function parseChapter(key) {
  const m = key.match(/^(Ch\.\s*\d+)\s*[—–-]\s*(.+)$/);
  return m ? { num: m[1], title: m[2] } : { num: '', title: key };
}

async function streamInto(url, body, onChunk) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Erreur HTTP ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    onChunk(text);
  }
}

function formatTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function encodeForUrl(data) {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  return btoa(String.fromCharCode(...bytes));
}

function decodeFromUrl(encoded) {
  const bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

// ── Sub-components ──────────────────────────────────────────────────────────

function ThemeToggle({ resolvedTheme, onToggle }) {
  return (
    <button
      onClick={onToggle}
      title={resolvedTheme === 'dark' ? 'Mode clair' : 'Mode sombre'}
      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
    >
      {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

function NavCard({ Icon, title, subtitle, accentCls, hoverCls, selectedCls, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`group w-full rounded-2xl border p-5 flex flex-col items-center gap-3
        transition-all duration-200 hover:scale-[1.02] cursor-pointer
        ${isSelected
          ? `${selectedCls} border`
          : `border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 ${hoverCls}`
        }`}
    >
      <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800/80 group-hover:bg-gray-200 dark:group-hover:bg-gray-800 transition-colors">
        <Icon size={28} className={accentCls} />
      </div>
      <div className="text-center space-y-0.5">
        <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 leading-tight">{title}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </button>
  );
}

function BreadcrumbNav({ level, subject, course, chapter, concept, mode, onBack, onHome, onPickRandom, isGenerating, onToggleTheme, resolvedTheme }) {
  const sc = subject ? SUBJECT_MAP[subject] : null;
  const cc = course ? parseCourse(course) : null;
  const ch = chapter ? parseChapter(chapter) : null;
  const mc = mode ? MODE_MAP[mode] : null;

  return (
    <div className="no-print flex items-center justify-between mb-8 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onBack}
          className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
        >
          <ArrowLeft size={18} />
        </button>
        <nav className="flex items-center gap-1 text-sm min-w-0 flex-wrap">
          <button onClick={onHome} className="text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors shrink-0">
            Accueil
          </button>
          {sc && (
            <>
              <span className="text-gray-300 dark:text-gray-700 select-none">/</span>
              <span className={`${sc.accentCls} font-medium shrink-0`}>{sc.label}</span>
            </>
          )}
          {cc && (
            <>
              <span className="text-gray-300 dark:text-gray-700 select-none">/</span>
              <span className="text-gray-500 dark:text-gray-400 shrink-0 hidden sm:inline">{cc.name}</span>
              <span className="text-gray-400 dark:text-gray-600 text-xs shrink-0 hidden sm:inline ml-0.5">({cc.code})</span>
            </>
          )}
          {ch && level >= 4 && (
            <>
              <span className="text-gray-300 dark:text-gray-700 select-none hidden sm:inline">/</span>
              <span className="text-gray-400 dark:text-gray-500 text-xs hidden sm:inline truncate max-w-[180px]">{ch.title}</span>
            </>
          )}
          {concept && level >= 5 && (
            <>
              <span className="text-gray-300 dark:text-gray-700 select-none hidden sm:inline">/</span>
              <span className="text-gray-400 dark:text-gray-500 text-xs hidden sm:inline truncate max-w-[160px]">{concept}</span>
            </>
          )}
          {mc && level >= 6 && (
            <>
              <span className="text-gray-300 dark:text-gray-700 select-none hidden sm:inline">/</span>
              <span className={`${mc.iconCls} text-xs hidden sm:inline shrink-0`}>{mc.label}</span>
            </>
          )}
        </nav>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <ThemeToggle resolvedTheme={resolvedTheme} onToggle={onToggleTheme} />
        <button
          onClick={onPickRandom}
          disabled={isGenerating}
          title="Problème aléatoire"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-all disabled:opacity-40"
        >
          <Dice6 size={15} />
          <span className="hidden sm:inline">Aléatoire</span>
        </button>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function Home() {
  const { resolvedTheme, setTheme } = useTheme();
  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

  // Navigation state
  const [level, setLevel] = useState(1);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);

  // Settings
  const [difficulty, setDifficulty] = useState('Moyen');
  const [timerDuration, setTimerDuration] = useState(0);

  // Problem state
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [sharedId, setSharedId] = useState(null);
  const [, forceUpdate] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [photoMediaType, setPhotoMediaType] = useState(null);
  const prevCountRef = useRef(0);
  const photoInputRef = useRef(null);

  // Computed
  const currentItem = items[0] ?? null;
  const isGenerating = currentItem?.generatingProblem ?? false;
  const hasActiveTimer = items.some(it => it.timerEnd && it.timerEnd > Date.now());

  const subjectCfg = selectedSubject ? SUBJECT_MAP[selectedSubject] : null;
  const courses = selectedSubject ? Object.keys(concepts[selectedSubject].cours) : [];
  const chapters = selectedCourse
    ? Object.keys(concepts[selectedSubject]?.cours[selectedCourse]?.chapitres ?? {})
    : [];
  const conceptsList = selectedChapter
    ? (concepts[selectedSubject]?.cours[selectedCourse]?.chapitres[selectedChapter] ?? [])
    : [];

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const shared = params.get('p');
      if (shared) {
        const data = decodeFromUrl(shared);
        if (data.problem && (data.subject || data.course)) {
          const restoredMode = data.mode ?? 'courtes';
          setItems([{
            id: Date.now(),
            subject: data.subject ?? '', course: data.course ?? '',
            chapter: data.chapter ?? '', concept: data.concept ?? '',
            difficulty: data.difficulty ?? 'Moyen', mode: restoredMode,
            problem: data.problem, solution: null, hint: null,
            generatingProblem: false, generatingSolution: false, generatingHint: false,
            timerEnd: null, grading: null, generatingGrading: false, score: null,
          }]);
          setSelectedSubject(data.subject ?? null);
          setSelectedCourse(data.course ?? null);
          setSelectedChapter(data.chapter ?? null);
          setSelectedConcept(data.concept ?? null);
          setSelectedMode(restoredMode);
          setLevel(6);
          prevCountRef.current = 1;
          window.history.replaceState({}, '', '/');
          setHydrated(true);
          return;
        }
      }
    } catch {}
    try {
      const saved = localStorage.getItem('acedoo-session');
      if (saved) {
        const parsed = JSON.parse(saved);
        const restored = parsed.filter(it => it.problem).map(it => ({
          ...it,
          generatingProblem: false,
          generatingSolution: false,
          grading: it.grading ?? null,
          generatingGrading: false,
          score: it.score ?? null,
        }));
        setItems(restored);
        prevCountRef.current = restored.length;
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem('acedoo-session', JSON.stringify(items)); } catch {}
  }, [items, hydrated]);

  useEffect(() => {
    if (!hasActiveTimer) return;
    const id = setInterval(() => forceUpdate(n => n + 1), 1000);
    return () => clearInterval(id);
  }, [hasActiveTimer]);

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (level === 6 && selectedSubject && selectedCourse && selectedChapter && selectedConcept && selectedMode && !isGenerating) {
          doGenerate({ subjectVal: selectedSubject, courseVal: selectedCourse, chapterVal: selectedChapter, conceptVal: selectedConcept, modeVal: selectedMode, diff: difficulty });
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [level, selectedSubject, selectedCourse, selectedChapter, selectedConcept, selectedMode, difficulty, isGenerating]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Navigation handlers ───────────────────────────────────────────────────

  function goBack() {
    setError('');
    setLevel(l => Math.max(1, l - 1));
  }

  function goHome() {
    setError('');
    setLevel(1);
    setSelectedSubject(null);
    setSelectedCourse(null);
    setSelectedChapter(null);
    setSelectedConcept(null);
    setSelectedMode(null);
  }

  function handleSelectSubject(key) {
    setSelectedSubject(key);
    setSelectedCourse(null);
    setSelectedChapter(null);
    setSelectedConcept(null);
    setSelectedMode(null);
    setLevel(2);
  }

  function handleSelectCourse(key) {
    setSelectedCourse(key);
    setSelectedChapter(null);
    setSelectedConcept(null);
    setSelectedMode(null);
    setLevel(3);
  }

  function handleSelectChapter(key) {
    setSelectedChapter(key);
    setSelectedConcept(null);
    setSelectedMode(null);
    setLevel(4);
  }

  function handleSelectConcept(concept) {
    setSelectedConcept(concept);
    setSelectedMode(null);
    setLevel(5);
  }

  function handleSelectMode(modeKey) {
    setSelectedMode(modeKey);
    setLevel(6);
    doGenerate({
      subjectVal: selectedSubject,
      courseVal: selectedCourse,
      chapterVal: selectedChapter,
      conceptVal: selectedConcept,
      modeVal: modeKey,
      diff: difficulty,
    });
  }

  function pickRandom() {
    const s = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
    const subj = s.key;
    const crs = Object.keys(concepts[subj].cours);
    const crsKey = crs[Math.floor(Math.random() * crs.length)];
    const chs = Object.keys(concepts[subj].cours[crsKey].chapitres);
    const chKey = chs[Math.floor(Math.random() * chs.length)];
    const cons = concepts[subj].cours[crsKey].chapitres[chKey];
    const conKey = cons[Math.floor(Math.random() * cons.length)];
    const modeKey = ['courtes', 'longues'][Math.floor(Math.random() * 2)];
    setSelectedSubject(subj);
    setSelectedCourse(crsKey);
    setSelectedChapter(chKey);
    setSelectedConcept(conKey);
    setSelectedMode(modeKey);
    setLevel(6);
    doGenerate({ subjectVal: subj, courseVal: crsKey, chapterVal: chKey, conceptVal: conKey, modeVal: modeKey, diff: difficulty });
  }

  // ── Problem handlers ──────────────────────────────────────────────────────

  function updateItem(id, updater) {
    setItems(prev => prev.map(it => it.id === id ? updater(it) : it));
  }

  async function doGenerate({ subjectVal, courseVal, chapterVal, conceptVal, modeVal, diff, similarTo }) {
    setError('');
    setPhotoPreview(null);
    setPhotoBase64(null);
    setPhotoMediaType(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
    const id = Date.now();
    const manuelVal = concepts[subjectVal]?.cours[courseVal]?.manuel ?? '';
    setItems(prev => [{
      id, subject: subjectVal, course: courseVal, chapter: chapterVal, concept: conceptVal,
      difficulty: diff, mode: modeVal, problem: '', solution: null, hint: null,
      generatingProblem: true, generatingSolution: false, generatingHint: false,
      timerEnd: null, grading: null, generatingGrading: false, score: null,
    }, ...prev]);
    let ok = false;
    try {
      await streamInto(
        '/api/generate-problem',
        { subject: subjectVal, course: courseVal, chapter: chapterVal, concept: conceptVal, manuel: manuelVal, difficulty: diff, mode: modeVal, similarTo },
        text => updateItem(id, it => ({ ...it, problem: text })),
      );
      ok = true;
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.');
      setItems(prev => prev.filter(it => it.id !== id));
    } finally {
      updateItem(id, it => ({
        ...it,
        generatingProblem: false,
        timerEnd: ok && modeVal !== 'apprendre' && timerDuration > 0 ? Date.now() + timerDuration * 1000 : null,
      }));
    }
  }

  async function revealHint(id) {
    const item = items.find(it => it.id === id);
    if (!item) return;
    updateItem(id, it => ({ ...it, generatingHint: true }));
    try {
      await streamInto('/api/generate-hint', { subject: item.subject, problem: item.problem },
        text => updateItem(id, it => ({ ...it, hint: text })));
    } catch {}
    finally { updateItem(id, it => ({ ...it, generatingHint: false })); }
  }

  async function revealSolution(id) {
    const item = items.find(it => it.id === id);
    if (!item) return;
    updateItem(id, it => ({ ...it, generatingSolution: true }));
    try {
      await streamInto('/api/generate-solution', { subject: item.subject, problem: item.problem },
        text => updateItem(id, it => ({ ...it, solution: text })));
    } catch {}
    finally { updateItem(id, it => ({ ...it, generatingSolution: false })); }
  }

  async function copyProblem(id) {
    const item = items.find(it => it.id === id);
    if (!item) return;
    await navigator.clipboard.writeText(item.problem);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function shareLink(id) {
    const item = items.find(it => it.id === id);
    if (!item) return;
    const encoded = encodeForUrl({
      subject: item.subject, course: item.course, chapter: item.chapter,
      concept: item.concept, difficulty: item.difficulty, mode: item.mode, problem: item.problem,
    });
    await navigator.clipboard.writeText(`${window.location.origin}/?p=${encoded}`);
    setSharedId(id);
    setTimeout(() => setSharedId(null), 2000);
  }

  function printCard(id) {
    document.querySelectorAll('[data-print-id]').forEach(el => el.classList.remove('print-target'));
    document.querySelector(`[data-print-id="${id}"]`)?.classList.add('print-target');
    window.print();
    document.querySelector(`[data-print-id="${id}"]`)?.classList.remove('print-target');
  }

  // ── Photo / grading ───────────────────────────────────────────────────────

  async function resizeImage(file, maxPx = 1024) {
    return new Promise(resolve => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width: w, height: h } = img;
        if (w > maxPx || h > maxPx) {
          if (w > h) { h = Math.round(h * maxPx / w); w = maxPx; }
          else { w = Math.round(w * maxPx / h); h = maxPx; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve({ dataUrl, base64: dataUrl.split(',')[1], mediaType: 'image/jpeg' });
      };
      img.src = url;
    });
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await resizeImage(file);
    setPhotoPreview(result.dataUrl);
    setPhotoBase64(result.base64);
    setPhotoMediaType(result.mediaType);
  }

  function saveGrade({ subject, course, chapter, concept, problem, score, feedback }) {
    try {
      const entry = {
        id: Date.now(),
        subject, course, chapter, concept,
        score,
        feedback,
        problem_text: problem,
        timestamp: new Date().toISOString(),
      };
      const existing = JSON.parse(localStorage.getItem('acedoo_grades') || '[]');
      existing.unshift(entry);
      localStorage.setItem('acedoo_grades', JSON.stringify(existing.slice(0, 200)));
    } catch {}
  }

  async function gradeWork() {
    if (!currentItem || !photoBase64) return;
    const itemId = currentItem.id;
    const snap = {
      subject: currentItem.subject,
      course: currentItem.course,
      chapter: currentItem.chapter,
      concept: currentItem.concept,
      problem: currentItem.problem,
    };
    updateItem(itemId, it => ({ ...it, grading: '', generatingGrading: true, score: null }));
    let finalText = '';
    try {
      await streamInto(
        '/api/grade-work',
        { problem: snap.problem, imageBase64: photoBase64, mediaType: photoMediaType },
        text => {
          finalText = text;
          updateItem(itemId, it => ({ ...it, grading: text }));
        },
      );
      const match = finalText.match(/Score[^:]*:\s*(\d+)\s*\/\s*100/i);
      const score = match ? Math.min(100, Math.max(0, parseInt(match[1]))) : null;
      updateItem(itemId, it => ({ ...it, score }));
      if (score !== null) saveGrade({ ...snap, score, feedback: finalText });
    } catch (err) {
      updateItem(itemId, it => ({ ...it, grading: `Erreur : ${err.message}` }));
    } finally {
      updateItem(itemId, it => ({ ...it, generatingGrading: false }));
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[#fafafa] dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-4 py-8">
      <div className="w-full max-w-4xl mx-auto">

        {level > 1 && (
          <BreadcrumbNav
            level={level}
            subject={selectedSubject}
            course={selectedCourse}
            chapter={selectedChapter}
            concept={selectedConcept}
            mode={selectedMode}
            onBack={goBack}
            onHome={goHome}
            onPickRandom={pickRandom}
            isGenerating={isGenerating}
            onToggleTheme={toggleTheme}
            resolvedTheme={resolvedTheme}
          />
        )}

        {/* ─── LEVEL 1: HOME ─── */}
        {level === 1 && (
          <div className="space-y-10">
            <div className="text-center space-y-3 pt-10 pb-2">
              <div className="flex items-center justify-end gap-2 mb-4">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-all"
                >
                  <LayoutDashboard size={14} />
                  <span className="hidden sm:inline">Tableau de bord</span>
                </Link>
                <ThemeToggle resolvedTheme={resolvedTheme} onToggle={toggleTheme} />
              </div>
              <h1 className="text-6xl font-bold tracking-tight">Acedoo</h1>
              <p className="text-gray-500 text-lg">
                Pratique infinie pour le DEC en Sciences de la Nature
              </p>
              <div className="pt-2">
                <button
                  onClick={pickRandom}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-all"
                >
                  <Dice6 size={16} />
                  Problème aléatoire
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {SUBJECTS.map(s => (
                <NavCard
                  key={s.key}
                  Icon={s.Icon}
                  title={s.label}
                  accentCls={s.iconCls}
                  hoverCls={s.hoverCls}
                  selectedCls={s.selectedCls}
                  isSelected={false}
                  onClick={() => handleSelectSubject(s.key)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ─── LEVEL 2: COURSES ─── */}
        {level === 2 && selectedSubject && (
          <div className="space-y-6">
            <div>
              <h2 className={`text-2xl font-bold ${subjectCfg?.accentCls}`}>{selectedSubject}</h2>
              <p className="text-gray-500 text-sm mt-1">Choisis un cours</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map(courseKey => {
                const { name, code } = parseCourse(courseKey);
                const CourseIcon = COURSE_ICONS[courseKey] ?? subjectCfg?.Icon ?? Atom;
                return (
                  <NavCard
                    key={courseKey}
                    Icon={CourseIcon}
                    title={name}
                    subtitle={`Cours ${code}`}
                    accentCls={subjectCfg?.iconCls ?? 'text-gray-400'}
                    hoverCls={subjectCfg?.hoverCls ?? ''}
                    selectedCls={subjectCfg?.selectedCls ?? ''}
                    isSelected={false}
                    onClick={() => handleSelectCourse(courseKey)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* ─── LEVEL 3: CHAPTERS ─── */}
        {level === 3 && selectedCourse && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {parseCourse(selectedCourse).name}
                <span className="ml-2 text-base font-normal text-gray-500">
                  ({parseCourse(selectedCourse).code})
                </span>
              </h2>
              <p className="text-gray-500 text-sm mt-1">Choisis un chapitre</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {chapters.map(chapterKey => {
                const { num, title } = parseChapter(chapterKey);
                return (
                  <button
                    key={chapterKey}
                    onClick={() => handleSelectChapter(chapterKey)}
                    className={`group w-full text-left p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900
                      ${subjectCfg?.hoverCls ?? ''} hover:scale-[1.02] transition-all duration-200`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`shrink-0 text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ${subjectCfg?.accentCls ?? 'text-gray-400'} mt-0.5`}>
                        {num}
                      </span>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 leading-snug">{title}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── LEVEL 4: CONCEPTS ─── */}
        {level === 4 && selectedChapter && (
          <div className="space-y-6">
            <div>
              <p className={`text-xs font-mono font-medium mb-1 ${subjectCfg?.accentCls ?? 'text-gray-400'}`}>
                {parseChapter(selectedChapter).num}
              </p>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {parseChapter(selectedChapter).title}
              </h2>
              <p className="text-gray-500 text-sm mt-1">Choisis un concept</p>
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <span className="text-xs text-gray-400 dark:text-gray-600 uppercase tracking-wider mr-1">Difficulté</span>
                {DIFFICULTIES.map(d => (
                  <button key={d} onClick={() => setDifficulty(d)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${difficulty === d ? DIFF_STYLE[d] : DIFF_INACTIVE}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {conceptsList.map(concept => (
                <button
                  key={concept}
                  onClick={() => handleSelectConcept(concept)}
                  className={`group w-full text-left p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900
                    ${subjectCfg?.hoverCls ?? ''} hover:scale-[1.02] transition-all duration-200
                    text-sm font-medium text-gray-700 dark:text-gray-200 leading-snug`}
                >
                  {concept}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── LEVEL 5: MODE SELECTION ─── */}
        {level === 5 && selectedConcept && (
          <div className="space-y-6">
            <div>
              <p className={`text-xs font-mono font-medium mb-1 ${subjectCfg?.accentCls ?? 'text-gray-400'}`}>
                {selectedConcept}
              </p>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                Comment veux-tu pratiquer ?
              </h2>
              <p className="text-gray-500 text-sm mt-1">Choisis un mode d&apos;apprentissage</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {MODES.map(m => (
                <NavCard
                  key={m.key}
                  Icon={m.Icon}
                  title={m.label}
                  subtitle={m.description}
                  accentCls={m.iconCls}
                  hoverCls={m.hoverCls}
                  selectedCls={m.selectedCls}
                  isSelected={false}
                  onClick={() => handleSelectMode(m.key)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ─── LEVEL 6: PROBLEM / EXPLANATION ─── */}
        {level === 6 && (
          <div className="space-y-5 max-w-2xl mx-auto">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 rounded-lg text-red-600 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Settings bar — hidden in apprendre mode */}
            {currentItem?.mode !== 'apprendre' && (
              <div className="no-print flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-400 dark:text-gray-700 uppercase tracking-wider">Difficulté</span>
                  {DIFFICULTIES.map(d => (
                    <button key={d} onClick={() => setDifficulty(d)} disabled={isGenerating}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border disabled:opacity-40 ${difficulty === d ? DIFF_STYLE[d] : DIFF_INACTIVE}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  {TIMER_OPTIONS.map(({ label, value, title }) => (
                    <button key={value} onClick={() => setTimerDuration(value)} disabled={isGenerating}
                      title={title}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 ${
                        timerDuration === value
                          ? 'bg-gray-500 dark:bg-gray-600 text-white border border-gray-400 dark:border-gray-500'
                          : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Problem card */}
            {currentItem && (() => {
              const itemSubjectCfg = SUBJECT_MAP[currentItem.subject];
              return (
                <div
                  key={currentItem.id}
                  data-print-id={currentItem.id}
                  className="rounded-2xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gradient-to-b dark:from-gray-900 dark:to-gray-950 overflow-hidden animate-in fade-in slide-in-from-bottom-1 duration-200 shadow-sm dark:shadow-none"
                  style={itemSubjectCfg ? { boxShadow: `0 0 40px rgba(${itemSubjectCfg.glowRgb}, 0.08)` } : undefined}
                >
                  <div className="p-8 space-y-5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className={`text-xs font-medium uppercase tracking-wider ${itemSubjectCfg?.accentCls ?? 'text-blue-400'}`}>
                          {currentItem.concept}
                        </span>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {currentItem.subject} — {parseCourse(currentItem.course).name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {currentItem.mode !== 'apprendre' && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${DIFF_STYLE[currentItem.difficulty]}`}>
                            {currentItem.difficulty}
                          </span>
                        )}
                        {currentItem.timerEnd && (() => {
                          const msLeft = currentItem.timerEnd - Date.now();
                          const expired = msLeft <= 0;
                          return (
                            <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${expired ? 'bg-red-100 dark:bg-red-900/50 text-red-500 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                              {expired ? 'Temps écoulé' : `⏱ ${formatTime(msLeft)}`}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Skeleton loading */}
                    {currentItem.generatingProblem && !currentItem.problem && (
                      <div className="space-y-3 animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700/60 rounded-full w-full" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700/60 rounded-full w-5/6" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700/60 rounded-full w-4/5" />
                        <div className="h-4 bg-gray-100 dark:bg-gray-700/40 rounded-full w-3/4" />
                        <div className="h-4 bg-gray-100 dark:bg-gray-700/40 rounded-full w-2/3" />
                      </div>
                    )}

                    {/* Content */}
                    {currentItem.problem && (
                      <div className={`text-gray-800 dark:text-gray-100 ${contentCls}`}>
                        <ReactMarkdown {...mdProps}>{currentItem.problem}</ReactMarkdown>
                      </div>
                    )}

                    {/* Post-generation actions */}
                    {!currentItem.generatingProblem && currentItem.problem && (
                      <div className="space-y-4 pt-3 border-t border-gray-100 dark:border-gray-800/60">

                        {/* 3 action buttons — hidden in apprendre mode */}
                        {currentItem.mode !== 'apprendre' && (
                          <div className="no-print flex items-center justify-around gap-2">
                            {/* Copier */}
                            <button
                              onClick={() => copyProblem(currentItem.id)}
                              title="Copier le problème"
                              className="flex flex-col items-center gap-1 p-3 rounded-full border border-gray-200 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800/40 hover:border-cyan-400/60 hover:shadow-[0_0_16px_rgba(34,211,238,0.2)] hover:scale-105 transition-all duration-200 min-w-[60px] min-h-[60px] justify-center"
                            >
                              <Copy size={24} className="text-cyan-500" />
                              <span className="text-[11px] font-medium text-cyan-500">
                                {copiedId === currentItem.id ? 'Copié ✓' : 'Copier'}
                              </span>
                            </button>
                            {/* Voir solution */}
                            <button
                              onClick={() => revealSolution(currentItem.id)}
                              disabled={currentItem.generatingSolution || !!currentItem.solution}
                              title="Voir la solution"
                              className="flex flex-col items-center gap-1 p-3 rounded-full border border-gray-200 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800/40 hover:border-emerald-500/60 hover:shadow-[0_0_16px_rgba(16,185,129,0.2)] hover:scale-105 transition-all duration-200 disabled:opacity-40 min-w-[60px] min-h-[60px] justify-center"
                            >
                              <Eye size={24} className="text-emerald-500" />
                              <span className="text-[11px] font-medium text-emerald-500">
                                {currentItem.generatingSolution ? '…' : 'Solution'}
                              </span>
                            </button>
                            {/* Similaire */}
                            <button
                              onClick={() => doGenerate({
                                subjectVal: currentItem.subject,
                                courseVal: currentItem.course,
                                chapterVal: currentItem.chapter,
                                conceptVal: currentItem.concept,
                                modeVal: currentItem.mode,
                                diff: currentItem.difficulty,
                                similarTo: currentItem.problem,
                              })}
                              disabled={isGenerating}
                              title="Problème similaire"
                              className="flex flex-col items-center gap-1 p-3 rounded-full border border-gray-200 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800/40 hover:border-amber-500/60 hover:shadow-[0_0_16px_rgba(245,158,11,0.2)] hover:scale-105 transition-all duration-200 disabled:opacity-40 min-w-[60px] min-h-[60px] justify-center"
                            >
                              <RefreshCw size={24} className="text-amber-500" />
                              <span className="text-[11px] font-medium text-amber-500">Similaire</span>
                            </button>
                          </div>
                        )}

                        {/* Secondary row: hint + share + print */}
                        <div className="no-print flex gap-2 flex-wrap">
                          {currentItem.mode !== 'apprendre' && !currentItem.hint && (
                            <button
                              onClick={() => revealHint(currentItem.id)}
                              disabled={currentItem.generatingHint}
                              className="text-xs text-amber-600 dark:text-amber-700 hover:text-amber-500 dark:hover:text-amber-400 border border-amber-200 dark:border-amber-900/50 hover:border-amber-300 dark:hover:border-amber-700/60 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40"
                            >
                              {currentItem.generatingHint ? 'Chargement…' : '💡 Indice'}
                            </button>
                          )}
                          <button
                            onClick={() => shareLink(currentItem.id)}
                            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 transition-colors"
                          >
                            {sharedId === currentItem.id ? '✓ Lien copié' : '🔗 Partager'}
                          </button>
                          <button
                            onClick={() => printCard(currentItem.id)}
                            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 transition-colors"
                          >
                            ⎙ PDF
                          </button>
                        </div>

                        {/* Hint block */}
                        {currentItem.mode !== 'apprendre' && currentItem.hint && (
                          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg">
                            <div className="text-xs text-amber-500 dark:text-amber-400 font-medium mb-2 uppercase tracking-wider">💡 Indice</div>
                            <div className={`text-amber-800 dark:text-amber-100/80 text-sm ${contentCls}`}>
                              <ReactMarkdown {...mdProps}>{currentItem.hint}</ReactMarkdown>
                            </div>
                          </div>
                        )}

                        {/* Solution block */}
                        {currentItem.mode !== 'apprendre' && currentItem.solution && (
                          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                            <div className="text-xs text-emerald-500 font-medium mb-3 uppercase tracking-wider">Solution</div>
                            <div className={`text-gray-700 dark:text-gray-300 ${contentCls}`}>
                              <ReactMarkdown {...mdProps}>{currentItem.solution}</ReactMarkdown>
                            </div>
                          </div>
                        )}

                        {/* Photo upload / grading — hidden in apprendre mode */}
                        {currentItem.mode !== 'apprendre' && (
                          <div className="no-print space-y-3">
                            <Separator className="bg-gray-200 dark:bg-gray-800/60" />
                            <div className="flex items-center gap-2">
                              <ImageUp size={13} className="text-gray-400" />
                              <span className="text-xs font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wider">Soumets ta démarche</span>
                            </div>
                            <input
                              ref={photoInputRef}
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={handlePhotoUpload}
                            />
                            {!photoPreview ? (
                              <button
                                onClick={() => photoInputRef.current?.click()}
                                className="w-full py-5 border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 rounded-xl flex flex-col items-center gap-1.5 text-gray-300 dark:text-gray-700 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
                              >
                                <ImageUp size={20} />
                                <span className="text-xs">Prendre une photo ou téléverser</span>
                              </button>
                            ) : (
                              <div className="space-y-3">
                                <img
                                  src={photoPreview}
                                  alt="Ta démarche"
                                  className="max-h-80 w-auto rounded-xl border border-gray-200 dark:border-gray-700 mx-auto block object-contain"
                                  style={{ maxWidth: 400 }}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setPhotoPreview(null);
                                      setPhotoBase64(null);
                                      setPhotoMediaType(null);
                                      if (photoInputRef.current) photoInputRef.current.value = '';
                                    }}
                                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 transition-colors"
                                  >
                                    Changer
                                  </button>
                                  <button
                                    onClick={gradeWork}
                                    disabled={currentItem.generatingGrading}
                                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                                  >
                                    {currentItem.generatingGrading ? 'Correction en cours…' : 'Soumettre'}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Grading display */}
                            {(currentItem.grading || currentItem.generatingGrading) && (
                              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/60 rounded-xl space-y-3">
                                <div className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">Correction IA</div>
                                {currentItem.score !== null && currentItem.score !== undefined && (
                                  <div className="text-center py-1">
                                    <span className={`text-5xl font-bold ${
                                      currentItem.score >= 75 ? 'text-emerald-500' :
                                      currentItem.score >= 50 ? 'text-amber-500' : 'text-red-500'
                                    }`}>
                                      {currentItem.score}
                                    </span>
                                    <span className="text-xl text-gray-400 ml-1">/100</span>
                                  </div>
                                )}
                                {currentItem.generatingGrading && !currentItem.grading ? (
                                  <div className="animate-pulse space-y-2">
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700/60 rounded-full w-3/4" />
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700/60 rounded-full w-1/2" />
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700/60 rounded-full w-5/6" />
                                  </div>
                                ) : (
                                  <div className={`text-gray-700 dark:text-gray-200 text-sm ${contentCls}`}>
                                    <ReactMarkdown {...mdProps}>{currentItem.grading ?? ''}</ReactMarkdown>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Primary action buttons */}
            <div className="no-print flex gap-3">
              <Button
                size="lg"
                onClick={() => {
                  if (selectedSubject && selectedCourse && selectedChapter && selectedConcept && selectedMode) {
                    doGenerate({ subjectVal: selectedSubject, courseVal: selectedCourse, chapterVal: selectedChapter, conceptVal: selectedConcept, modeVal: selectedMode, diff: difficulty });
                  }
                }}
                disabled={isGenerating}
                className="flex-1 h-11"
              >
                {isGenerating ? 'Génération en cours…' : (selectedMode === 'apprendre' ? 'Nouvelle explication' : 'Nouveau problème')}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setLevel(5)}
                disabled={isGenerating}
                className="flex-1 h-11 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Changer de mode
              </Button>
            </div>
            {selectedMode !== 'apprendre' && (
              <p className="text-center text-xs text-gray-300 dark:text-gray-700 no-print">⌘ Entrée pour nouveau problème</p>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
