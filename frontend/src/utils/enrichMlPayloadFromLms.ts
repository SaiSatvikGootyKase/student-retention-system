import { getAttendanceSummary, getResults } from '../api';
import type { DropoutMlProfilePayload, Result } from '../api';

/** Count course rows that look like failures (letter F / low percentage). */
function countFailuresFromResults(results: Result[]): number {
  return results.filter(r => {
    const g = (r.grade || '').trim().toUpperCase();
    if (g === 'F' || g.includes('FAIL')) return true;
    if (r.maxMarks > 0 && r.marksObtained / r.maxMarks < 0.35) return true;
    return false;
  }).length;
}

/**
 * Fills `numberOfFailures` from {@link getResults} and `numberOfAbsences` from {@link getAttendanceSummary}
 * so the profile form does not ask for those manually.
 */
export async function enrichMlPayloadFromLms(
  form: DropoutMlProfilePayload,
  studentRecordId: string | undefined
): Promise<DropoutMlProfilePayload> {
  if (!studentRecordId?.trim()) {
    return { ...form, droppedOut: false };
  }
  const sid = studentRecordId.trim();
  let numberOfFailures = form.numberOfFailures;
  let numberOfAbsences = form.numberOfAbsences;
  try {
    const results = await getResults({ studentId: sid });
    numberOfFailures = countFailuresFromResults(results);
  } catch {
    /* keep form value */
  }
  try {
    const sum = await getAttendanceSummary(sid);
    numberOfAbsences = Number(sum.absent ?? 0);
  } catch {
    /* keep form value */
  }
  return {
    ...form,
    numberOfFailures,
    numberOfAbsences,
    droppedOut: false,
    attendedNursery: form.attendedNursery?.trim() || 'no',
    inRelationship: form.inRelationship?.trim() || 'no',
    weekendAlcohol: form.weekendAlcohol ?? 1,
    weekdayAlcohol: form.weekdayAlcohol ?? 1,
  };
}
