'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { ArrowLeft, Sun, Moon, TrendingUp, TrendingDown, Minus, LayoutDashboard } from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────

function avg(arr) {
  if (!arr.length) return null;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

function scoreColor(score) {
  if (score >= 75) return 'text-emerald-500';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
}

function scoreBgClass(score) {
  if (score >= 75) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

function formatDateFr(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('fr-CA', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Sub-components ───────────────────────────────────────────────────────────

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

function ScoreBadge({ score, size = 'md' }) {
  const cls = scoreColor(score);
  if (size === 'xl') {
    return (
      <div className={`text-6xl font-bold tabular-nums ${cls}`}>
        {score}<span className="text-2xl text-gray-400 dark:text-gray-600 font-normal ml-1">/100</span>
      </div>
    );
  }
  if (size === 'lg') {
    return (
      <span className={`text-3xl font-bold tabular-nums ${cls}`}>
        {score}<span className="text-base text-gray-400 font-normal ml-1">/100</span>
      </span>
    );
  }
  return (
    <span className={`text-lg font-bold tabular-nums ${cls}`}>
      {score}<span className="text-xs text-gray-400 font-normal ml-0.5">/100</span>
    </span>
  );
}

function ScoreBar({ score, className = '' }) {
  return (
    <div className={`h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-700 ${scoreBgClass(score)}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

function TrendIcon({ scores }) {
  if (scores.length < 2) return <Minus size={14} className="text-gray-400" />;
  const delta = scores[0] - scores[1];
  if (delta > 5) return <TrendingUp size={14} className="text-emerald-500" />;
  if (delta < -5) return <TrendingDown size={14} className="text-red-500" />;
  return <Minus size={14} className="text-gray-400" />;
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { resolvedTheme, setTheme } = useTheme();
  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

  const [grades, setGrades] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('acedoo_grades');
      if (raw) setGrades(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return <main className="min-h-screen bg-[#fafafa] dark:bg-gray-950" />;
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  const allScores = grades.map(g => g.score).filter(s => s != null);
  const overallAvg = avg(allScores);

  const subjectMap = {};
  for (const g of grades) {
    if (g.score == null) continue;
    if (!subjectMap[g.subject]) subjectMap[g.subject] = [];
    subjectMap[g.subject].push(g.score);
  }
  const subjectStats = Object.entries(subjectMap)
    .map(([subject, scores]) => ({ subject, avg: avg(scores), count: scores.length }))
    .sort((a, b) => b.count - a.count);

  const conceptMap = {};
  for (const g of grades) {
    if (g.score == null) continue;
    if (!conceptMap[g.concept]) {
      conceptMap[g.concept] = { scores: [], subject: g.subject, latest: g.timestamp };
    }
    conceptMap[g.concept].scores.push(g.score);
    if (g.timestamp > conceptMap[g.concept].latest) {
      conceptMap[g.concept].latest = g.timestamp;
    }
  }
  const conceptStats = Object.entries(conceptMap)
    .map(([concept, data]) => ({
      concept,
      subject: data.subject,
      avg: avg(data.scores),
      best: Math.max(...data.scores),
      latest: data.scores[0],
      count: data.scores.length,
      recentScores: data.scores.slice(0, 2),
      lastAttempt: data.latest,
    }))
    .sort((a, b) => new Date(b.lastAttempt) - new Date(a.lastAttempt));

  const recentActivity = grades.slice(0, 10);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[#fafafa] dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-4 py-8">
      <div className="w-full max-w-4xl mx-auto space-y-8">

        {/* Nav */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-1.5">
              <LayoutDashboard size={15} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Tableau de bord</span>
            </div>
          </div>
          <ThemeToggle resolvedTheme={resolvedTheme} onToggle={toggleTheme} />
        </div>

        {/* Empty state */}
        {grades.length === 0 && (
          <div className="text-center py-24 space-y-3">
            <p className="text-5xl select-none">📊</p>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Aucune correction encore</h2>
            <p className="text-gray-400 dark:text-gray-500 text-sm max-w-xs mx-auto">
              Soumets une photo de ta démarche sur un problème pour voir ta progression ici.
            </p>
            <Link
              href="/"
              className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Commencer à pratiquer
            </Link>
          </div>
        )}

        {grades.length > 0 && (
          <>
            {/* Overall score */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-900 p-8 text-center space-y-3">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Moyenne générale</p>
              {overallAvg !== null ? (
                <>
                  <ScoreBadge score={overallAvg} size="xl" />
                  <p className="text-sm text-gray-400">
                    {allScores.length} correction{allScores.length > 1 ? 's' : ''}
                  </p>
                  <ScoreBar score={overallAvg} className="max-w-xs mx-auto" />
                </>
              ) : (
                <p className="text-gray-400">—</p>
              )}
            </div>

            {/* Per-subject */}
            {subjectStats.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider px-1">
                  Par matière
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {subjectStats.map(({ subject, avg: sAvg, count }) => (
                    <div
                      key={subject}
                      className="rounded-xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-900 p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">{subject}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400">{count} essai{count > 1 ? 's' : ''}</span>
                          <ScoreBadge score={sAvg} size="md" />
                        </div>
                      </div>
                      <ScoreBar score={sAvg} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Per-concept */}
            {conceptStats.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider px-1">
                  Par concept
                </h2>
                <div className="rounded-xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-900 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800/60">
                  {conceptStats.map(({ concept, subject, avg: cAvg, best, latest, count, recentScores }) => (
                    <div key={concept} className="flex items-center gap-4 px-5 py-3.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{concept}</p>
                        <p className="text-xs text-gray-400">
                          {subject} · {count} essai{count > 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Meilleur</p>
                          <p className={`text-sm font-bold ${scoreColor(best)}`}>{best}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Dernier</p>
                          <p className={`text-sm font-bold ${scoreColor(latest)}`}>{latest}</p>
                        </div>
                        <TrendIcon scores={recentScores} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Recent activity */}
            {recentActivity.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider px-1">
                  Activité récente
                </h2>
                <div className="rounded-xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-900 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800/60">
                  {recentActivity.map((g) => (
                    <div key={g.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${scoreBgClass(g.score)}`}>
                        {g.score}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{g.concept}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {g.subject} — {formatDateFr(g.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

      </div>
    </main>
  );
}
