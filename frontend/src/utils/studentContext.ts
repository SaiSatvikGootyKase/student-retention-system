import type { LoginResponse } from '../api';

/**
 * MongoDB stores grades, fees, assignments, etc. under the {@code profiles} document id (Student entity).
 * The auth user id is the {@code users} document id — use {@code linkedProfileId} when present.
 */
export function getStudentRecordId(user: LoginResponse | null): string | undefined {
  if (!user || user.role !== 'STUDENT') return undefined;
  return user.linkedProfileId?.trim() || user.userId;
}

/**
 * For ML / risk APIs that accept either student id or user id and can auto-provision a student row.
 * Prefer {@code userId} so stale {@code linkedProfileId} values do not block self-heal after backend updates.
 */
export function getStudentIdForMlApi(user: LoginResponse | null): string | undefined {
  if (!user || user.role !== 'STUDENT') return undefined;
  const uid = user.userId?.trim();
  if (uid) return uid;
  return user.linkedProfileId?.trim();
}

/** Student Mongo id from a row returned by GET /users (uses linkedProfileId when sync linked the account). */
export function studentMongoIdFromUserRow(u: { id: string; linkedProfileId?: string | null }): string {
  return (u.linkedProfileId && u.linkedProfileId.trim()) || u.id;
}
