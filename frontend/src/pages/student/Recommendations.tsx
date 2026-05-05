import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  Code2,
  ExternalLink,
  FlaskConical,
  GraduationCap,
  Loader2,
  Sparkles,
  Target,
} from 'lucide-react';
import { getStudentMlInsights } from '../../api';
import type { CourseRecommendationItem, StudentMlInsightsDto } from '../../api';
import { useAuth } from '../../hooks/useAuth';
import { getStudentIdForMlApi } from '../../utils/studentContext';
import type { YoutubeLecture } from './youtubeLectureRecommendations';
import { resolveEmbeddableLecture, toEmbedUrl, youtubeLecturesForSubject } from './youtubeLectureRecommendations';

function InlineYoutubeLectureBlock({
  subjectKey,
  courseTitle,
  noOuterMargin,
}: {
  subjectKey: string;
  courseTitle: string;
  /** When true, omit top margin so the parent controls spacing after the description. */
  noOuterMargin?: boolean;
}) {
  const candidates = useMemo(() => youtubeLecturesForSubject(subjectKey), [subjectKey]);
  const [lecture, setLecture] = useState<YoutubeLecture | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLecture(null);
    resolveEmbeddableLecture(candidates).then((lec) => {
      if (!cancelled) setLecture(lec);
    });
    return () => {
      cancelled = true;
    };
  }, [subjectKey, candidates]);

  return (
    <div
      className={`space-y-4 border-t border-slate-100 pt-4 ${noOuterMargin ? 'mt-0' : 'mt-5'}`}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recommended lecture video</p>
        <p className="mt-1 text-sm font-semibold text-brand-navy">{courseTitle}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
          Curated from university and public-education channels (not general entertainment).
        </p>
      </div>
      {!lecture && (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin shrink-0" aria-hidden />
          Finding a playable lecture…
        </div>
      )}
      {lecture && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-black/5">
          <div className="aspect-video w-full">
            <iframe
              title={lecture.title}
              src={toEmbedUrl(lecture.watchUrl)}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <a
            href={lecture.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-brand-indigo hover:bg-slate-50"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            Open &ldquo;{lecture.title}&rdquo; on YouTube
          </a>
        </div>
      )}
    </div>
  );
}

function subjectIcon(subjectKey: string) {
  const k = subjectKey.toLowerCase();
  if (k.includes('computer') || k === 'cs') return Code2;
  if (k.includes('chem')) return FlaskConical;
  if (k.includes('math') || k.includes('phys')) return BookOpen;
  return GraduationCap;
}

function formatSubjectLabel(key: string | null | undefined): string {
  if (!key || key === '—') return 'your subjects';
  return key.replace(/_/g, ' ');
}

function topTwoLectureProbabilities(probs: StudentMlInsightsDto['lectureModelTopProbabilities']) {
  const raw = probs ?? [];
  const norm = (p: number) => (p <= 1 ? p : p / 100);
  return [...raw].sort((a, b) => norm(b.probability) - norm(a.probability)).slice(0, 2);
}

export default function Recommendations() {
  const { currentUser } = useAuth();
  const studentId = getStudentIdForMlApi(currentUser ?? null);
  const [data, setData] = useState<StudentMlInsightsDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const lectureTopTwo = useMemo(() => (data ? topTwoLectureProbabilities(data.lectureModelTopProbabilities) : []), [data]);
  /** API orders by lowest marks first; only first two are shown as course cards. */
  const courseRecommendationsTopTwo = useMemo(
    () => (data ? data.recommendedCourses.slice(0, 2) : []),
    [data],
  );

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      setError('No student profile id on your account. Ask an admin to link linkedProfileId.');
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getStudentMlInsights(studentId);
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load recommendations');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const scrollToWhy = () => {
    document.getElementById('why-recommendations')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!studentId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 page-fade">
      <div>
        <p className="text-sm font-semibold text-brand-indigo">Personalized for you</p>
        <h1 className="mt-1 text-2xl font-bold text-brand-navy">Recommended courses for you</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          When you have grades on the <span className="font-semibold text-brand-navy">Results</span> page, recommendations
          use that same data. Otherwise we fall back to the linked course_recommendation marks row and your retention
          tier.
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading recommendations…
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          <p>{error}</p>
          {(error.includes('Student not found') || error.includes('404')) && (
            <p className="mt-2 text-xs leading-relaxed text-rose-800">
              Sign out and sign in again with a <span className="font-semibold">student</span> account so the server can
              create your <span className="font-mono">profiles</span> document. If you only have a faculty account, register
              a separate student account from the login page.
            </p>
          )}
        </div>
      )}

      {data && !loading && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-white px-6 py-5 shadow-sm transition-all duration-300 ease-out hover:border-indigo-200/80 hover:shadow-md">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-indigo text-white">
                <Target className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Your goal</p>
                <p className="text-lg font-bold text-brand-navy">
                  Improve in {formatSubjectLabel(data.mlRecommendedSubject)}
                </p>
                <p className="mt-1 max-w-xl text-sm text-slate-600">{data.learningGoalHint}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={scrollToWhy}
              className="inline-flex items-center gap-1 rounded-xl bg-brand-indigo px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-brand-indigo/90 hover:shadow-lg hover:shadow-brand-indigo/25 active:translate-y-0 active:scale-[0.98]"
            >
              View learning plan <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-violet-50/90 px-5 py-4 text-sm text-slate-800 transition-all duration-200 ease-out hover:border-violet-200/90 hover:shadow-sm">
            <p className="font-semibold text-brand-navy">Lecture recommendation model</p>
            <p className="mt-1 text-xs text-slate-600">
              {(data.lectureInferenceSource ?? 'none') === 'runtime_python_rf' && (
                <>Live <span className="font-mono">predict_recommendation.py</span> (RandomForest) using your marks.</>
              )}
              {(data.lectureInferenceSource ?? 'none') === 'mongo_dataset' && (
                <>Stored RF label from <span className="font-mono">course_recommendation</span> (Python not run or model file missing).</>
              )}
              {(data.lectureInferenceSource ?? 'none') === 'results_dashboard' && (
                <>
                  Lecture-style priorities are derived from your <span className="font-semibold">Results</span> page
                  averages (weaker areas rank higher), not from the separate ML marks row.
                </>
              )}
              {(data.lectureInferenceSource ?? 'none') === 'none' && (
                <>No results on file and no marks row linked — ask faculty to post results or seed{' '}
                <span className="font-mono">course_recommendation</span>.</>
              )}
            </p>
            {lectureTopTwo.length > 0 && (
              <ul className="mt-3 space-y-1.5 rounded-lg bg-white/70 px-3 py-2">
                {lectureTopTwo.map((p) => (
                  <li key={p.subject} className="flex justify-between text-xs font-medium">
                    <span className="font-mono text-brand-navy">{p.subject}</span>
                    <span className="text-slate-600">
                      {(p.probability <= 1 ? p.probability * 100 : p.probability).toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-[10px] text-slate-500">
              {(data.lectureInferenceSource ?? '') === 'results_dashboard'
                ? 'Showing top 2 subject buckets by need score (inverted from your Results averages).'
                : 'Showing top 2 subjects by model probability.'}
            </p>
          </div>

          <p className="text-xs text-slate-500">
            {(data.lectureInferenceSource ?? '') === 'results_dashboard'
              ? 'Showing your top 2 courses by lowest average % on the Results page (highest priority to improve).'
              : 'Showing your top 2 course recommendations (weakest marks first — highest priority to improve).'}
          </p>
          <div className="grid items-stretch gap-5 sm:grid-cols-2">
            {courseRecommendationsTopTwo.map((c: CourseRecommendationItem) => {
              const Icon = subjectIcon(c.subjectKey);
              const tagColor =
                c.tag === 'Core'
                  ? 'bg-violet-100 text-violet-800'
                  : c.tag === 'Elective'
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-amber-100 text-amber-900';
              return (
                <article
                  key={c.id + c.title}
                  className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-brand-indigo/30 hover:shadow-card-hover"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-slate text-brand-indigo">
                      <Icon className="h-6 w-6" aria-hidden />
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tagColor}`}>{c.tag}</span>
                  </div>
                  <h2 className="mt-4 text-lg font-bold leading-snug text-brand-navy">{c.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.description}</p>
                  <div className="mt-5 shrink-0">
                    <div className="mb-1 flex justify-between text-xs font-medium text-slate-500">
                      <span>Your progress (marks-based)</span>
                      <span>{c.progressPercent}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-indigo to-emerald-500 transition-all"
                        style={{ width: `${Math.min(100, Math.max(4, c.progressPercent))}%` }}
                      />
                    </div>
                  </div>
                  <InlineYoutubeLectureBlock
                    noOuterMargin
                    subjectKey={c.subjectKey}
                    courseTitle={c.title}
                  />
                </article>
              );
            })}
          </div>

          <div
            id="why-recommendations"
            className="rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm transition-all duration-200 ease-out hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex gap-3">
                <Sparkles className="h-8 w-8 shrink-0 text-amber-500" aria-hidden />
                <div>
                  <h2 className="text-lg font-bold text-brand-navy">Why these courses?</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                  “These course recommendations are based on your academic performance. Use Mentor Chat to improve.”
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-sm font-semibold text-brand-indigo hover:underline"
              >
                Back to top
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
