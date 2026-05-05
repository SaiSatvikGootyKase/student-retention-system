/** Curated lecture links per ML subject key (matches backend StudentMlInsightsService keys). */

export type YoutubeLecture = {
  title: string;
  watchUrl: string;
};

function embedUrl(watchUrl: string): string {
  try {
    const u = new URL(watchUrl);
    const v = u.searchParams.get('v');
    if (v) return `https://www.youtube.com/embed/${v}`;
    if (u.pathname.startsWith('/embed/')) return watchUrl;
  } catch {
    /* ignore */
  }
  return watchUrl;
}

export function toEmbedUrl(watchUrl: string): string {
  return embedUrl(watchUrl);
}

export const YOUTUBE_LECTURES_BY_SUBJECT: Record<string, YoutubeLecture[]> = {
  Math: [
    { title: 'Algebra basics — variables & expressions', watchUrl: 'https://www.youtube.com/watch?v=NybHckSEQBI' },
    { title: 'Linear equations introduction', watchUrl: 'https://www.youtube.com/watch?v=9DrJQMUrHcU' },
    { title: 'Introduction to algebra (Khan Academy)', watchUrl: 'https://www.youtube.com/watch?v=vDqO8xzXcPI' },
  ],
  /** Only reputable academic sources (Purdue OWL, Khan Academy, BBC Learning English). */
  English: [
    {
      title: 'Purdue OWL — thesis statements for academic writing',
      watchUrl: 'https://www.youtube.com/watch?v=LKXkemYldmw',
    },
    {
      title: 'Khan Academy — introduction to grammar',
      watchUrl: 'https://www.youtube.com/watch?v=O-6q-siuMik',
    },
    {
      title: 'BBC Learning English — grammar tips for academic exams',
      watchUrl: 'https://www.youtube.com/watch?v=qXPrOoBXM7s',
    },
    {
      title: 'Khan Academy — articles and parts of speech',
      watchUrl: 'https://www.youtube.com/watch?v=4EsDY2VbIXs',
    },
  ],
  Computer_Science: [
    { title: 'Data structures — arrays & linked lists overview', watchUrl: 'https://www.youtube.com/watch?v=RBSGKlAvoiM' },
    { title: 'Big O notation explained', watchUrl: 'https://www.youtube.com/watch?v=Mo4vesMu8ss' },
  ],
  Physics: [
    { title: 'Intro to vectors & kinematics', watchUrl: 'https://www.youtube.com/watch?v=wWB236kd35U' },
    { title: "Newton's laws — core intuition", watchUrl: 'https://www.youtube.com/watch?v=kKKM8Y-u7ds' },
  ],
  Chemistry: [
    { title: 'Atoms, elements & periodic table basics', watchUrl: 'https://www.youtube.com/watch?v=QN437XdRDSw' },
    { title: 'Chemical bonding introduction', watchUrl: 'https://www.youtube.com/watch?v=33VBhRZpzYU' },
  ],
  '—': [
    { title: 'Effective study habits for STEM courses', watchUrl: 'https://www.youtube.com/watch?v=IlU-zDU6aQ0' },
    { title: 'Note-taking for lectures', watchUrl: 'https://www.youtube.com/watch?v=AffuwyJaUWw' },
  ],
};

export function youtubeLecturesForSubject(subjectKey: string | undefined): YoutubeLecture[] {
  if (!subjectKey || subjectKey === '—') return YOUTUBE_LECTURES_BY_SUBJECT['—'];
  const direct = YOUTUBE_LECTURES_BY_SUBJECT[subjectKey];
  if (direct?.length) return direct;
  return YOUTUBE_LECTURES_BY_SUBJECT['—'];
}

/**
 * Pick the first candidate YouTube reports via oEmbed (usually embeddable).
 * If oEmbed fails (network/CORS), returns the first candidate.
 */
async function oEmbedReportsOk(watchUrl: string, timeoutMs: number): Promise<boolean> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const oembed = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watchUrl)}`;
    const res = await fetch(oembed, { method: 'GET', signal: ctrl.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function resolveEmbeddableLecture(candidates: YoutubeLecture[]): Promise<YoutubeLecture> {
  if (!candidates.length) {
    return { title: 'Study skills', watchUrl: 'https://www.youtube.com/watch?v=IlU-zDU6aQ0' };
  }
  for (const lec of candidates) {
    if (await oEmbedReportsOk(lec.watchUrl, 4500)) {
      return lec;
    }
  }
  return candidates[0];
}
