'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const SUBJECTS = [
  'Math 103 — Calcul différentiel',
  'Math 203 — Calcul intégral',
  'Math 307 — Algèbre linéaire et géométrie vectorielle',
  'Physique 101 — Mécanique',
  'Physique 201 — Électricité et magnétisme',
  'Physique 203 — Ondes et physique moderne',
  'Chimie 101 — Chimie générale',
  'Chimie 202 — Chimie des solutions',
  'Bio 921 — Biologie cellulaire',
  'Bio 922 — Évolution et diversité du vivant',
];

const DIFFICULTIES = ['Facile', 'Moyen', 'Difficile'];

const DIFFICULTY_STYLE = {
  Facile: 'bg-green-900/50 text-green-400',
  Moyen: 'bg-yellow-900/50 text-yellow-400',
  Difficile: 'bg-red-900/50 text-red-400',
};

const TIMER_OPTIONS = [
  { label: '⏱', value: 0, title: 'Pas de minuterie' },
  { label: '5 min', value: 300, title: 'Minuterie 5 minutes' },
  { label: '10 min', value: 600, title: 'Minuterie 10 minutes' },
  { label: '15 min', value: 900, title: 'Minuterie 15 minutes' },
];

const RATINGS = ['😕', '😐', '😊'];
const RATING_COLOR = { '😕': 'bg-red-500', '😐': 'bg-yellow-500', '😊': 'bg-green-500' };
const RATING_LABEL = { '😕': 'À retravailler', '😐': 'Moyen', '😊': 'Compris' };

const mdProps = {
  remarkPlugins: [remarkMath],
  rehypePlugins: [[rehypeKatex, { throwOnError: false, errorColor: '#ff6b6b', strict: false }]],
};

const contentCls =
  '[&_p]:mb-4 [&_p:last-child]:mb-0 ' +
  '[&_strong]:font-semibold [&_strong]:text-white ' +
  '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 ' +
  '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 ' +
  '[&_li]:mb-1 ' +
  '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 ' +
  '[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4';

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
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    onChunk(text);
  }
}

function formatTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function printCard(id) {
  document.querySelectorAll('[data-print-id]').forEach((el) => el.classList.remove('print-target'));
  document.querySelector(`[data-print-id="${id}"]`)?.classList.add('print-target');
  window.print();
  document.querySelector(`[data-print-id="${id}"]`)?.classList.remove('print-target');
}

function encodeForUrl(data) {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  return btoa(String.fromCharCode(...bytes));
}

function decodeFromUrl(encoded) {
  const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function SubjectBar({ subject, counts }) {
  const total = counts.total;
  const shortName = subject.split('—')[0].trim();
  const worstRating = counts['😕'] > 0 ? '😕' : counts['😐'] > 0 ? '😐' : '😊';

  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{shortName}</span>
        <span className="text-gray-600">{total} prob.</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-800 gap-px">
        {RATINGS.slice().reverse().map((r) =>
          counts[r] > 0 ? (
            <div
              key={r}
              title={`${RATING_LABEL[r]} : ${counts[r]}`}
              className={`${RATING_COLOR[r]} transition-all`}
              style={{ width: `${(counts[r] / total) * 100}%` }}
            />
          ) : null,
        )}
      </div>
      {counts['😕'] > 0 && (
        <p className="text-xs text-red-400 mt-0.5">
          {counts['😕']} difficile{counts['😕'] > 1 ? 's' : ''} — à retravailler
        </p>
      )}
    </div>
  );
}

export default function Home() {
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [difficulty, setDifficulty] = useState('Moyen');
  const [timerDuration, setTimerDuration] = useState(0);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [sharedId, setSharedId] = useState(null);
  const [, forceUpdate] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  const itemsRef = useRef(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    // Load shared problem from URL first
    try {
      const params = new URLSearchParams(window.location.search);
      const shared = params.get('p');
      if (shared) {
        const data = decodeFromUrl(shared);
        if (data.problem && data.subject) {
          setItems([{
            id: Date.now(),
            subject: data.subject,
            difficulty: data.difficulty ?? 'Moyen',
            problem: data.problem,
            solution: null,
            generatingProblem: false,
            generatingSolution: false,
            timerEnd: null,
            rating: null,
          }]);
          prevCountRef.current = 1;
          window.history.replaceState({}, '', '/');
          setHydrated(true);
          return;
        }
      }
    } catch {}

    // Otherwise restore from localStorage
    try {
      const saved = localStorage.getItem('acedoo-session');
      if (saved) {
        const parsed = JSON.parse(saved);
        const restored = parsed
          .filter((it) => it.problem)
          .map((it) => ({ ...it, generatingProblem: false, generatingSolution: false }));
        setItems(restored);
        prevCountRef.current = restored.length;
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem('acedoo-session', JSON.stringify(items));
    } catch {}
  }, [items, hydrated]);

  useEffect(() => {
    if (items.length > prevCountRef.current && itemsRef.current) {
      itemsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    prevCountRef.current = items.length;
  }, [items.length]);

  useEffect(() => {
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        const btn = document.querySelector('[data-generate-btn]');
        if (btn && !btn.disabled) btn.click();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const hasActiveTimer = items.some((it) => it.timerEnd && it.timerEnd > Date.now());
  useEffect(() => {
    if (!hasActiveTimer) return;
    const id = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [hasActiveTimer]);

  const isGenerating = items.length > 0 && items[0].generatingProblem;
  const ratedItems = items.filter((it) => it.rating);

  const sessionStats =
    ratedItems.length > 0
      ? RATINGS.map((r) => ({ emoji: r, count: ratedItems.filter((it) => it.rating === r).length }))
      : null;

  const subjectStats =
    ratedItems.length > 0
      ? Object.entries(
          ratedItems.reduce((acc, it) => {
            if (!acc[it.subject]) acc[it.subject] = { '😕': 0, '😐': 0, '😊': 0, total: 0 };
            acc[it.subject][it.rating]++;
            acc[it.subject].total++;
            return acc;
          }, {}),
        )
          .map(([subj, counts]) => ({ subject: subj, counts }))
          .sort((a, b) => b.counts['😕'] - a.counts['😕'] || b.counts.total - a.counts.total)
      : null;

  function updateItem(id, updater) {
    setItems((prev) => prev.map((it) => (it.id === id ? updater(it) : it)));
  }

  function pickRandom() {
    const others = SUBJECTS.filter((s) => s !== subject);
    setSubject(others[Math.floor(Math.random() * others.length)]);
  }

  function clearSession() {
    setItems([]);
    localStorage.removeItem('acedoo-session');
    setShowProgress(false);
  }

  async function doGenerate({ subj, diff, similarTo }) {
    setError('');
    const id = Date.now();
    setItems((prev) => [
      { id, subject: subj, difficulty: diff, problem: '', solution: null,
        generatingProblem: true, generatingSolution: false, timerEnd: null, rating: null },
      ...prev,
    ]);
    let ok = false;
    try {
      await streamInto('/api/generate-problem', { subject: subj, difficulty: diff, similarTo }, (text) =>
        updateItem(id, (it) => ({ ...it, problem: text })),
      );
      ok = true;
    } catch (err) {
      setError(err.message || 'Une erreur est survenue. Vérifiez votre clé API dans .env.local.');
      setItems((prev) => prev.filter((it) => it.id !== id));
    } finally {
      updateItem(id, (it) => ({
        ...it,
        generatingProblem: false,
        timerEnd: ok && timerDuration > 0 ? Date.now() + timerDuration * 1000 : null,
      }));
    }
  }

  async function revealSolution(id) {
    const item = items.find((it) => it.id === id);
    if (!item) return;
    updateItem(id, (it) => ({ ...it, generatingSolution: true }));
    try {
      await streamInto('/api/generate-solution', { subject: item.subject, problem: item.problem }, (text) =>
        updateItem(id, (it) => ({ ...it, solution: text })),
      );
    } catch {}
    finally {
      updateItem(id, (it) => ({ ...it, generatingSolution: false }));
    }
  }

  async function copyProblem(id) {
    const item = items.find((it) => it.id === id);
    if (!item) return;
    await navigator.clipboard.writeText(item.problem);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function shareLink(id) {
    const item = items.find((it) => it.id === id);
    if (!item) return;
    const encoded = encodeForUrl({ subject: item.subject, difficulty: item.difficulty, problem: item.problem });
    const url = `${window.location.origin}/?p=${encoded}`;
    await navigator.clipboard.writeText(url);
    setSharedId(id);
    setTimeout(() => setSharedId(null), 2000);
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center px-4 py-16">
      <div className="w-full max-w-2xl">
        <h1 className="text-5xl font-bold text-center mb-3 tracking-tight">Acedoo</h1>
        <p className="text-center text-gray-400 mb-10 text-lg">
          Pratique infinie pour le DEC en Sciences de la Nature
        </p>

        {/* Session stats bar */}
        {sessionStats && (
          <div className="no-print mb-4 flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-xl text-sm">
            <div className="flex items-center gap-5">
              <span className="text-gray-500 text-xs uppercase tracking-wider">Session</span>
              {sessionStats.map(({ emoji, count }) => (
                <span key={emoji} className="flex items-center gap-1.5">
                  <span className="text-lg">{emoji}</span>
                  <span className="text-gray-300 font-medium">{count}</span>
                </span>
              ))}
              <span className="text-gray-600 text-xs">
                {ratedItems.length} noté{ratedItems.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowProgress((v) => !v)}
                className="text-xs text-gray-500 hover:text-gray-200 transition-colors"
              >
                {showProgress ? 'Masquer' : 'Progression'}
              </button>
              <button
                onClick={clearSession}
                className="text-xs text-gray-700 hover:text-red-400 transition-colors"
              >
                Effacer
              </button>
            </div>
          </div>
        )}

        {/* Progress dashboard */}
        {showProgress && subjectStats && (
          <div className="no-print mb-6 p-5 bg-gray-900 border border-gray-800 rounded-xl">
            <h2 className="text-xs text-gray-500 uppercase tracking-wider mb-4">Progression par matière</h2>
            {subjectStats.map(({ subject: subj, counts }) => (
              <SubjectBar key={subj} subject={subj} counts={counts} />
            ))}
            <div className="flex gap-4 mt-4 pt-3 border-t border-gray-800">
              {RATINGS.map((r) => (
                <span key={r} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className={`w-2 h-2 rounded-full ${RATING_COLOR[r]}`} />
                  {RATING_LABEL[r]}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="no-print flex flex-col gap-3">
          <div className="flex gap-2">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isGenerating}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              onClick={pickRandom}
              disabled={isGenerating}
              title="Sujet aléatoire"
              className="bg-gray-800 border border-gray-700 hover:border-gray-500 rounded-lg px-4 py-3 text-lg transition-colors disabled:opacity-50"
            >
              🎲
            </button>
          </div>

          <div className="flex gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                disabled={isGenerating}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  difficulty === d
                    ? 'bg-blue-700 text-white'
                    : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-200'
                }`}
              >
                {d}
              </button>
            ))}
            <div className="w-px bg-gray-700 mx-1" />
            {TIMER_OPTIONS.map(({ label, value, title }) => (
              <button
                key={value}
                onClick={() => setTimerDuration(value)}
                disabled={isGenerating}
                title={title}
                className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                  timerDuration === value
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-800 border border-gray-700 text-gray-500 hover:text-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            data-generate-btn
            onClick={() => doGenerate({ subj: subject, diff: difficulty })}
            disabled={isGenerating}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:cursor-not-allowed rounded-lg px-4 py-3 font-semibold transition-colors"
          >
            {isGenerating ? 'Génération en cours…' : 'Générer un problème'}
          </button>
          <p className="text-center text-xs text-gray-700">⌘ Entrée pour générer</p>
        </div>

        {error && (
          <div className="no-print mt-6 p-4 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Empty state */}
        {hydrated && items.length === 0 && (
          <div className="no-print mt-12 text-center text-gray-700 space-y-2">
            <p className="text-4xl">📐</p>
            <p className="text-sm">Choisis une matière et clique sur <strong className="text-gray-500">Générer un problème</strong>.</p>
            <p className="text-xs">Note-toi avec 😕 😐 😊 après chaque problème pour suivre ta progression.</p>
          </div>
        )}

        {/* Problem cards */}
        {items.length > 0 && (
          <div ref={itemsRef} className="mt-8 flex flex-col gap-5">
            {items.map((item, index) => {
              const msLeft = item.timerEnd ? item.timerEnd - Date.now() : null;
              const timerExpired = msLeft !== null && msLeft <= 0;
              const timeDisplay = msLeft !== null && msLeft > 0 ? formatTime(msLeft) : null;

              return (
                <div
                  key={item.id}
                  data-print-id={item.id}
                  className={`p-6 bg-gray-900 border rounded-xl transition-opacity duration-300 ${
                    index === 0 ? 'border-gray-700' : 'border-gray-800 opacity-50 hover:opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-blue-400 font-medium uppercase tracking-wider">
                        {item.subject}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DIFFICULTY_STYLE[item.difficulty]}`}>
                        {item.difficulty}
                      </span>
                      {item.timerEnd && (
                        <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                          timerExpired ? 'bg-red-900/50 text-red-400' : 'bg-gray-800 text-gray-400'
                        }`}>
                          {timerExpired ? 'Temps écoulé' : `⏱ ${timeDisplay}`}
                        </span>
                      )}
                    </div>
                    {!item.generatingProblem && item.problem && (
                      <div className="no-print flex items-center gap-3 ml-4 shrink-0">
                        <button
                          onClick={() => copyProblem(item.id)}
                          className="text-xs text-gray-600 hover:text-gray-300 transition-colors"
                        >
                          {copiedId === item.id ? '✓ Copié' : '⎘ Copier'}
                        </button>
                        <button
                          onClick={() => shareLink(item.id)}
                          title="Copier le lien de partage"
                          className="text-xs text-gray-600 hover:text-gray-300 transition-colors"
                        >
                          {sharedId === item.id ? '✓ Lien copié' : '🔗 Partager'}
                        </button>
                        <button
                          onClick={() => printCard(item.id)}
                          className="text-xs text-gray-600 hover:text-gray-300 transition-colors"
                        >
                          ⎙ PDF
                        </button>
                      </div>
                    )}
                  </div>

                  {item.generatingProblem && !item.problem && (
                    <div className="text-gray-500 text-sm animate-pulse">Génération en cours…</div>
                  )}
                  {item.problem && (
                    <div className={`text-gray-100 ${contentCls}`}>
                      <ReactMarkdown {...mdProps}>{item.problem}</ReactMarkdown>
                    </div>
                  )}

                  {!item.generatingProblem && item.problem && (
                    <div className="mt-5 space-y-4">
                      <div className="no-print flex items-center gap-3">
                        {!item.rating ? (
                          <>
                            <span className="text-xs text-gray-600">Comment ça s&apos;est passé ?</span>
                            {RATINGS.map((r) => (
                              <button
                                key={r}
                                onClick={() => updateItem(item.id, (it) => ({ ...it, rating: r }))}
                                className="text-xl hover:scale-125 transition-transform"
                              >
                                {r}
                              </button>
                            ))}
                          </>
                        ) : (
                          <>
                            <span className="text-lg">{item.rating}</span>
                            <button
                              onClick={() => updateItem(item.id, (it) => ({ ...it, rating: null }))}
                              className="text-xs text-gray-700 hover:text-gray-400 transition-colors"
                            >
                              Changer
                            </button>
                          </>
                        )}
                      </div>

                      <div className="no-print flex gap-3 flex-wrap">
                        {!item.solution && (
                          <button
                            onClick={() => revealSolution(item.id)}
                            disabled={item.generatingSolution}
                            className="text-sm text-gray-500 hover:text-gray-200 border border-gray-700 hover:border-gray-500 rounded-lg px-4 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {item.generatingSolution ? 'Chargement…' : 'Voir la solution'}
                          </button>
                        )}
                        <button
                          onClick={() => doGenerate({ subj: item.subject, diff: item.difficulty, similarTo: item.problem })}
                          disabled={isGenerating}
                          className="text-sm text-gray-500 hover:text-gray-200 border border-gray-700 hover:border-gray-500 rounded-lg px-4 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Problème similaire
                        </button>
                      </div>

                      {item.solution && (
                        <div className="pt-4 border-t border-gray-700">
                          <div className="text-xs text-green-400 font-medium mb-3 uppercase tracking-wider">
                            Solution
                          </div>
                          <div className={`text-gray-300 ${contentCls}`}>
                            <ReactMarkdown {...mdProps}>{item.solution}</ReactMarkdown>
                          </div>
                          <div className="no-print mt-4">
                            <button
                              onClick={() => doGenerate({ subj: item.subject, diff: item.difficulty, similarTo: item.problem })}
                              disabled={isGenerating}
                              className="text-sm text-gray-500 hover:text-gray-200 border border-gray-700 hover:border-gray-500 rounded-lg px-4 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Problème similaire
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
