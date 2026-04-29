'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import {
  Atom, Sigma, FlaskConical, Dna,
  Cog, Zap, AudioWaveform, TrendingUp, Grid3X3, Beaker, Hexagon, TreePine,
  ThumbsUp, ThumbsDown, BookOpen, FileText,
  ArrowLeft, Dice6,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  Facile: 'bg-green-900/50 text-green-400 border-green-700/50',
  Moyen: 'bg-yellow-900/50 text-yellow-400 border-yellow-700/50',
  Difficile: 'bg-red-900/50 text-red-400 border-red-700/50',
};
const DIFF_INACTIVE = 'bg-transparent border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-500';

const TIMER_OPTIONS = [
  { label: '⏱', value: 0, title: 'Pas de minuterie' },
  { label: '5 min', value: 300 },
  { label: '10 min', value: 600 },
  { label: '15 min', value: 900 },
];

const RATINGS_CONFIG = [
  {
    key: 'compris', label: 'Compris', Icon: ThumbsUp, rotate: false,
    iconCls: 'text-emerald-400',
    hoverCls: 'hover:border-emerald-500/50 hover:shadow-[0_0_16px_rgba(16,185,129,0.3)]',
    activeCls: 'border-emerald-500/60 bg-emerald-500/10',
    barCls: 'bg-emerald-500',
  },
  {
    key: 'moyen', label: 'Moyen', Icon: ThumbsUp, rotate: true,
    iconCls: 'text-amber-400',
    hoverCls: 'hover:border-amber-500/50 hover:shadow-[0_0_16px_rgba(245,158,11,0.3)]',
    activeCls: 'border-amber-500/60 bg-amber-500/10',
    barCls: 'bg-amber-500',
  },
  {
    key: 'difficile', label: 'Difficile', Icon: ThumbsDown, rotate: false,
    iconCls: 'text-red-400',
    hoverCls: 'hover:border-red-500/50 hover:shadow-[0_0_16px_rgba(239,68,68,0.3)]',
    activeCls: 'border-red-500/60 bg-red-500/10',
    barCls: 'bg-red-500',
  },
];

const RATING_MAP = Object.fromEntries(RATINGS_CONFIG.map(r => [r.key, r]));

// ── Markdown ────────────────────────────────────────────────────────────────

const mdProps = {
  remarkPlugins: [remarkMath],
  rehypePlugins: [[rehypeKatex, { throwOnError: false, errorColor: '#ff6b6b', strict: false }]],
};

const contentCls =
  'text-base leading-relaxed ' +
  '[&_p]:mb-4 [&_p:last-child]:mb-0 ' +
  '[&_strong]:font-semibold [&_strong]:text-white ' +
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

function SubjectBar({ subject, counts }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{subject.split('—')[0].trim()}</span>
        <span className="text-gray-600">{counts.total} prob.</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-800 gap-px">
        {RATINGS_CONFIG.slice().reverse().map(r =>
          counts[r.key] > 0 ? (
            <div
              key={r.key}
              title={`${r.label} : ${counts[r.key]}`}
              className={`${r.barCls} transition-all`}
              style={{ width: `${(counts[r.key] / counts.total) * 100}%` }}
            />
          ) : null
        )}
      </div>
      {counts.difficile > 0 && (
        <p className="text-xs text-red-400 mt-0.5">
          {counts.difficile} difficile{counts.difficile > 1 ? 's' : ''} — à retravailler
        </p>
      )}
    </div>
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
          : `border-gray-800 bg-gray-900 ${hoverCls}`
        }`}
    >
      <div className="p-3 rounded-xl bg-gray-800/80 group-hover:bg-gray-800 transition-colors">
        <Icon size={28} className={accentCls} />
      </div>
      <div className="text-center space-y-0.5">
        <p className="font-semibold text-sm text-gray-100 leading-tight">{title}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </button>
  );
}

function BreadcrumbNav({ level, subject, course, chapter, concept, mode, onBack, onHome, onPickRandom, isGenerating }) {
  const sc = subject ? SUBJECT_MAP[subject] : null;
  const cc = course ? parseCourse(course) : null;
  const ch = chapter ? parseChapter(chapter) : null;
  const mc = mode ? MODE_MAP[mode] : null;

  return (
    <div className="no-print flex items-center justify-between mb-8 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onBack}
          className="shrink-0 p-1.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-200"
        >
          <ArrowLeft size={18} />
        </button>
        <nav className="flex items-center gap-1 text-sm min-w-0 flex-wrap">
          <button onClick={onHome} className="text-gray-600 hover:text-gray-300 transition-colors shrink-0">
            Accueil
          </button>
          {sc && (
            <>
              <span className="text-gray-700 select-none">/</span>
              <span className={`${sc.accentCls} font-medium shrink-0`}>{sc.label}</span>
            </>
          )}
          {cc && (
            <>
              <span className="text-gray-700 select-none">/</span>
              <span className="text-gray-400 shrink-0 hidden sm:inline">{cc.name}</span>
              <span className="text-gray-600 text-xs shrink-0 hidden sm:inline ml-0.5">({cc.code})</span>
            </>
          )}
          {ch && level >= 4 && (
            <>
              <span className="text-gray-700 select-none hidden sm:inline">/</span>
              <span className="text-gray-500 text-xs hidden sm:inline truncate max-w-[180px]">{ch.title}</span>
            </>
          )}
          {concept && level >= 5 && (
            <>
              <span className="text-gray-700 select-none hidden sm:inline">/</span>
              <span className="text-gray-500 text-xs hidden sm:inline truncate max-w-[160px]">{concept}</span>
            </>
          )}
          {mc && level >= 6 && (
            <>
              <span className="text-gray-700 select-none hidden sm:inline">/</span>
              <span className={`${mc.iconCls} text-xs hidden sm:inline shrink-0`}>{mc.label}</span>
            </>
          )}
        </nav>
      </div>
      <button
        onClick={onPickRandom}
        disabled={isGenerating}
        title="Problème aléatoire"
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-800 border border-gray-700 hover:border-gray-500 text-sm text-gray-500 hover:text-gray-200 transition-all disabled:opacity-40"
      >
        <Dice6 size={15} />
        <span className="hidden sm:inline">Aléatoire</span>
      </button>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function Home() {
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
  const [showProgress, setShowProgress] = useState(false);
  const prevCountRef = useRef(0);

  // Computed
  const currentItem = items[0] ?? null;
  const isGenerating = currentItem?.generatingProblem ?? false;
  const hasActiveTimer = items.some(it => it.timerEnd && it.timerEnd > Date.now());
  const ratedItems = items.filter(it => it.rating && RATING_MAP[it.rating]);
  const sessionStats = ratedItems.length > 0
    ? RATINGS_CONFIG.map(r => ({ key: r.key, label: r.label, count: ratedItems.filter(it => it.rating === r.key).length }))
    : null;
  const subjectStats = ratedItems.length > 0
    ? Object.entries(
        ratedItems.reduce((acc, it) => {
          if (!acc[it.subject]) acc[it.subject] = { compris: 0, moyen: 0, difficile: 0, total: 0 };
          acc[it.subject][it.rating]++;
          acc[it.subject].total++;
          return acc;
        }, {})
      ).map(([subj, counts]) => ({ subject: subj, counts }))
        .sort((a, b) => b.counts.difficile - a.counts.difficile || b.counts.total - a.counts.total)
    : null;

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
            timerEnd: null, rating: null,
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
          ...it, generatingProblem: false, generatingSolution: false,
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
    const id = Date.now();
    const manuelVal = concepts[subjectVal]?.cours[courseVal]?.manuel ?? '';
    setItems(prev => [{
      id, subject: subjectVal, course: courseVal, chapter: chapterVal, concept: conceptVal,
      difficulty: diff, mode: modeVal, problem: '', solution: null, hint: null,
      generatingProblem: true, generatingSolution: false, generatingHint: false,
      timerEnd: null, rating: null,
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

  function clearSession() {
    setItems([]);
    localStorage.removeItem('acedoo-session');
    setShowProgress(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 px-4 py-8">
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
          />
        )}

        {/* ─── LEVEL 1: HOME ─── */}
        {level === 1 && (
          <div className="space-y-10">
            <div className="text-center space-y-3 pt-10 pb-2">
              <h1 className="text-6xl font-bold tracking-tight">Acedoo</h1>
              <p className="text-gray-400 text-lg">
                Pratique infinie pour le DEC en Sciences de la Nature
              </p>
              <div className="pt-2">
                <button
                  onClick={pickRandom}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800/80 hover:bg-gray-800 border border-gray-700 hover:border-gray-500 text-sm text-gray-400 hover:text-gray-200 transition-all"
                >
                  <Dice6 size={16} />
                  Problème aléatoire
                </button>
              </div>
            </div>

            {sessionStats && (
              <div className="no-print p-4 bg-gray-900 border border-gray-800 rounded-xl text-sm">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-gray-500 text-xs uppercase tracking-wider">Session</span>
                    {sessionStats.map(({ key, count }) => {
                      const rc = RATING_MAP[key];
                      return (
                        <span key={key} className="flex items-center gap-1.5">
                          <rc.Icon
                            size={14}
                            className={rc.iconCls}
                            style={rc.rotate ? { transform: 'rotate(90deg)' } : undefined}
                          />
                          <span className="text-gray-300 font-medium">{count}</span>
                        </span>
                      );
                    })}
                    <span className="text-gray-600 text-xs">
                      {ratedItems.length} noté{ratedItems.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setShowProgress(v => !v)}
                      className="text-xs text-gray-500 hover:text-gray-200 transition-colors">
                      {showProgress ? 'Masquer' : 'Progression'}
                    </button>
                    <button onClick={clearSession}
                      className="text-xs text-gray-700 hover:text-red-400 transition-colors">
                      Effacer
                    </button>
                  </div>
                </div>
                {showProgress && subjectStats && (
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    {subjectStats.map(({ subject: subj, counts }) => (
                      <SubjectBar key={subj} subject={subj} counts={counts} />
                    ))}
                    <div className="flex gap-4 mt-3 pt-3 border-t border-gray-800">
                      {RATINGS_CONFIG.map(r => (
                        <span key={r.key} className="flex items-center gap-1.5 text-xs text-gray-600">
                          <span className={`w-2 h-2 rounded-full ${r.barCls}`} />
                          {r.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

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
              <h2 className="text-2xl font-bold text-gray-100">
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
                    className={`group w-full text-left p-4 rounded-xl border border-gray-800 bg-gray-900
                      ${subjectCfg?.hoverCls ?? ''} hover:scale-[1.02] transition-all duration-200`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`shrink-0 text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-gray-800 border border-gray-700 ${subjectCfg?.accentCls ?? 'text-gray-400'} mt-0.5`}>
                        {num}
                      </span>
                      <p className="text-sm font-medium text-gray-200 leading-snug">{title}</p>
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
              <h2 className="text-2xl font-bold text-gray-100">
                {parseChapter(selectedChapter).title}
              </h2>
              <p className="text-gray-500 text-sm mt-1">Choisis un concept</p>
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <span className="text-xs text-gray-600 uppercase tracking-wider mr-1">Difficulté</span>
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
                  className={`group w-full text-left p-4 rounded-xl border border-gray-800 bg-gray-900
                    ${subjectCfg?.hoverCls ?? ''} hover:scale-[1.02] transition-all duration-200
                    text-sm font-medium text-gray-200 leading-snug`}
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
              <h2 className="text-2xl font-bold text-gray-100">
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
              <div className="p-4 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Settings bar — hidden in apprendre mode */}
            {currentItem?.mode !== 'apprendre' && (
              <div className="no-print flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-700 uppercase tracking-wider">Difficulté</span>
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
                          ? 'bg-gray-600 text-white border border-gray-500'
                          : 'bg-gray-800 border border-gray-700 text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Problem / explanation card */}
            {currentItem && (() => {
              const itemSubjectCfg = SUBJECT_MAP[currentItem.subject];
              return (
                <div
                  key={currentItem.id}
                  data-print-id={currentItem.id}
                  className="rounded-2xl border border-gray-700/60 bg-gradient-to-b from-gray-900 to-gray-950 overflow-hidden animate-in fade-in slide-in-from-bottom-1 duration-200"
                  style={itemSubjectCfg ? { boxShadow: `0 0 40px rgba(${itemSubjectCfg.glowRgb}, 0.12)` } : undefined}
                >
                  <div className="p-8 space-y-5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className={`text-xs font-medium uppercase tracking-wider ${itemSubjectCfg?.accentCls ?? 'text-blue-400'}`}>
                          {currentItem.concept}
                        </span>
                        <p className="text-xs text-gray-600 mt-0.5">
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
                            <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${expired ? 'bg-red-900/50 text-red-400' : 'bg-gray-800 text-gray-400'}`}>
                              {expired ? 'Temps écoulé' : `⏱ ${formatTime(msLeft)}`}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Skeleton loading */}
                    {currentItem.generatingProblem && !currentItem.problem && (
                      <div className="space-y-3 animate-pulse">
                        <div className="h-4 bg-gray-700/60 rounded-full w-full" />
                        <div className="h-4 bg-gray-700/60 rounded-full w-5/6" />
                        <div className="h-4 bg-gray-700/60 rounded-full w-4/5" />
                        <div className="h-4 bg-gray-700/40 rounded-full w-3/4" />
                        <div className="h-4 bg-gray-700/40 rounded-full w-2/3" />
                      </div>
                    )}

                    {/* Content */}
                    {currentItem.problem && (
                      <div className={`text-gray-100 ${contentCls}`}>
                        <ReactMarkdown {...mdProps}>{currentItem.problem}</ReactMarkdown>
                      </div>
                    )}

                    {/* Post-generation actions */}
                    {!currentItem.generatingProblem && currentItem.problem && (
                      <div className="space-y-4 pt-3 border-t border-gray-800/60">

                        {/* Icon rating buttons — hidden in apprendre mode */}
                        {currentItem.mode !== 'apprendre' && (
                          <div className="no-print">
                            {!currentItem.rating ? (
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-xs text-gray-600">Comment ça s&apos;est passé ?</span>
                                {RATINGS_CONFIG.map(r => (
                                  <button
                                    key={r.key}
                                    onClick={() => updateItem(currentItem.id, it => ({ ...it, rating: r.key }))}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-700/60 bg-gray-800/40
                                      ${r.hoverCls} hover:scale-[1.05] transition-all duration-200`}
                                  >
                                    <r.Icon
                                      size={15}
                                      className={r.iconCls}
                                      style={r.rotate ? { transform: 'rotate(90deg)' } : undefined}
                                    />
                                    <span className={`text-xs font-medium ${r.iconCls}`}>{r.label}</span>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                {(() => {
                                  const rc = RATING_MAP[currentItem.rating];
                                  return rc ? (
                                    <>
                                      <rc.Icon
                                        size={15}
                                        className={rc.iconCls}
                                        style={rc.rotate ? { transform: 'rotate(90deg)' } : undefined}
                                      />
                                      <span className={`text-sm font-medium ${rc.iconCls}`}>{rc.label}</span>
                                    </>
                                  ) : null;
                                })()}
                                <button
                                  onClick={() => updateItem(currentItem.id, it => ({ ...it, rating: null }))}
                                  className="text-xs text-gray-700 hover:text-gray-400 transition-colors"
                                >
                                  Changer
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Hint block — hidden in apprendre mode */}
                        {currentItem.mode !== 'apprendre' && currentItem.hint && (
                          <div className="p-4 bg-amber-950/30 border border-amber-800/40 rounded-lg">
                            <div className="text-xs text-amber-400 font-medium mb-2 uppercase tracking-wider">💡 Indice</div>
                            <div className={`text-amber-100/80 text-sm ${contentCls}`}>
                              <ReactMarkdown {...mdProps}>{currentItem.hint}</ReactMarkdown>
                            </div>
                          </div>
                        )}

                        {/* Utility action row */}
                        <div className="no-print flex gap-2 flex-wrap">
                          {currentItem.mode !== 'apprendre' && !currentItem.hint && !currentItem.solution && (
                            <button
                              onClick={() => revealHint(currentItem.id)}
                              disabled={currentItem.generatingHint}
                              className="text-sm text-amber-700 hover:text-amber-400 border border-amber-900/50 hover:border-amber-700/60 rounded-lg px-4 py-2 transition-colors disabled:opacity-40"
                            >
                              {currentItem.generatingHint ? 'Chargement…' : '💡 Voir un indice'}
                            </button>
                          )}
                          {currentItem.mode !== 'apprendre' && !currentItem.solution && (
                            <button
                              onClick={() => revealSolution(currentItem.id)}
                              disabled={currentItem.generatingSolution}
                              className="text-sm text-gray-500 hover:text-gray-200 border border-gray-700 hover:border-gray-500 rounded-lg px-4 py-2 transition-colors disabled:opacity-40"
                            >
                              {currentItem.generatingSolution ? 'Chargement…' : 'Voir la solution'}
                            </button>
                          )}
                          <button
                            onClick={() => copyProblem(currentItem.id)}
                            className="text-xs text-gray-600 hover:text-gray-300 border border-gray-800 rounded-lg px-3 py-2 transition-colors"
                          >
                            {copiedId === currentItem.id ? '✓ Copié' : '⎘ Copier'}
                          </button>
                          <button
                            onClick={() => shareLink(currentItem.id)}
                            className="text-xs text-gray-600 hover:text-gray-300 border border-gray-800 rounded-lg px-3 py-2 transition-colors"
                          >
                            {sharedId === currentItem.id ? '✓ Lien copié' : '🔗 Partager'}
                          </button>
                          <button
                            onClick={() => printCard(currentItem.id)}
                            className="text-xs text-gray-600 hover:text-gray-300 border border-gray-800 rounded-lg px-3 py-2 transition-colors"
                          >
                            ⎙ PDF
                          </button>
                        </div>

                        {/* Solution block — hidden in apprendre mode */}
                        {currentItem.mode !== 'apprendre' && currentItem.solution && (
                          <div className="pt-4 border-t border-gray-700">
                            <div className="text-xs text-green-400 font-medium mb-3 uppercase tracking-wider">Solution</div>
                            <div className={`text-gray-300 ${contentCls}`}>
                              <ReactMarkdown {...mdProps}>{currentItem.solution}</ReactMarkdown>
                            </div>
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
                className="flex-1 h-11 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-gray-100"
              >
                Changer de mode
              </Button>
            </div>
            {selectedMode !== 'apprendre' && (
              <p className="text-center text-xs text-gray-700 no-print">⌘ Entrée pour nouveau problème</p>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
