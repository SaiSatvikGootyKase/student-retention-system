import type { DropoutMlProfilePayload } from '../api';

/** Same option lists as the training CSV / backend validation. */
export const YES_NO = ['yes', 'no'] as const;
export const SCHOOLS = ['GP', 'MS'] as const;
export const GENDERS = ['F', 'M'] as const;
export const ADDR = ['U', 'R'] as const;
export const FAM = ['GT3', 'LE3'] as const;
export const PAR = ['A', 'T'] as const;
export const JOBS = ['at_home', 'teacher', 'health', 'services', 'other'] as const;
export const REASONS = ['course', 'home', 'reputation', 'other'] as const;
export const GUARDIANS = ['mother', 'father', 'other'] as const;

export function emptyPayload(schoolDefault: string): DropoutMlProfilePayload {
  return {
    school: schoolDefault.trim() || 'GP',
    gender: 'F',
    age: 18,
    address: 'U',
    familySize: 'GT3',
    parentalStatus: 'A',
    motherEducation: 4,
    fatherEducation: 4,
    motherJob: 'at_home',
    fatherJob: 'teacher',
    reasonForChoosingSchool: 'course',
    guardian: 'mother',
    travelTime: 2,
    studyTime: 2,
    numberOfFailures: 0,
    schoolSupport: 'no',
    familySupport: 'yes',
    extraPaidClass: 'no',
    extraCurricularActivities: 'no',
    attendedNursery: 'yes',
    wantsHigherEducation: 'yes',
    internetAccess: 'yes',
    inRelationship: 'no',
    familyRelationship: 4,
    freeTime: 3,
    goingOut: 2,
    weekendAlcohol: 1,
    weekdayAlcohol: 1,
    healthStatus: 3,
    numberOfAbsences: 0,
    grade1: 8,
    grade2: 8,
    finalGrade: 8,
    droppedOut: false,
  };
}

function num(v: unknown, fallback: number): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return fallback;
}

function str(v: unknown, fallback: string): string {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim();
  return s || fallback;
}

function bool(v: unknown, fallback: boolean): boolean {
  if (typeof v === 'boolean') return v;
  return fallback;
}

/** Map GET /students/{id}/profile → `dropoutMlFeatures` into form payload (merge gaps with defaults). */
export function dropoutFeaturesToPayload(raw: unknown, schoolDefault: string): DropoutMlProfilePayload {
  const d = emptyPayload(schoolDefault);
  if (!raw || typeof raw !== 'object') return d;
  const f = raw as Record<string, unknown>;
  return {
    school: str(f.school, d.school),
    gender: str(f.gender, d.gender),
    age: num(f.age, d.age),
    address: str(f.address, d.address),
    familySize: str(f.familySize, d.familySize),
    parentalStatus: str(f.parentalStatus, d.parentalStatus),
    motherEducation: num(f.motherEducation, d.motherEducation),
    fatherEducation: num(f.fatherEducation, d.fatherEducation),
    motherJob: str(f.motherJob, d.motherJob),
    fatherJob: str(f.fatherJob, d.fatherJob),
    reasonForChoosingSchool: str(f.reasonForChoosingSchool, d.reasonForChoosingSchool),
    guardian: str(f.guardian, d.guardian),
    travelTime: num(f.travelTime, d.travelTime),
    studyTime: num(f.studyTime, d.studyTime),
    numberOfFailures: num(f.numberOfFailures, d.numberOfFailures),
    schoolSupport: str(f.schoolSupport, d.schoolSupport),
    familySupport: str(f.familySupport, d.familySupport),
    extraPaidClass: str(f.extraPaidClass, d.extraPaidClass),
    extraCurricularActivities: str(f.extraCurricularActivities, d.extraCurricularActivities),
    attendedNursery: str(f.attendedNursery, d.attendedNursery),
    wantsHigherEducation: str(f.wantsHigherEducation, d.wantsHigherEducation),
    internetAccess: str(f.internetAccess, d.internetAccess),
    inRelationship: str(f.inRelationship, d.inRelationship),
    familyRelationship: num(f.familyRelationship, d.familyRelationship),
    freeTime: num(f.freeTime, d.freeTime),
    goingOut: num(f.goingOut, d.goingOut),
    weekendAlcohol: num(f.weekendAlcohol, d.weekendAlcohol),
    weekdayAlcohol: num(f.weekdayAlcohol, d.weekdayAlcohol),
    healthStatus: num(f.healthStatus, d.healthStatus),
    numberOfAbsences: num(f.numberOfAbsences, d.numberOfAbsences),
    grade1: Math.min(10, Math.max(0, num(f.grade1, d.grade1))),
    grade2: Math.min(10, Math.max(0, num(f.grade2, d.grade2))),
    finalGrade: Math.min(10, Math.max(0, num(f.finalGrade, d.finalGrade))),
    droppedOut: bool(f.droppedOut, d.droppedOut),
  };
}
