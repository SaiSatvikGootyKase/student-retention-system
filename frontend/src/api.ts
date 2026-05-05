// Centralized API client for all backend calls

const BASE = '/api/v1';

/** Build query string; omits undefined/null/empty so Spring never sees "undefined". */
export function buildQuery(params?: Record<string, string | undefined | null>): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && String(val) !== '') {
      sp.append(key, String(val));
    }
  }
  const q = sp.toString();
  return q ? `?${q}` : '';
}

/** Spring Boot default error JSON and similar shapes (uses `error` + `path`, not always `message`). */
function formatFailedRequestMessage(status: number, bodyText: string): string {
  try {
    const j = JSON.parse(bodyText) as {
      message?: string;
      error?: string;
      path?: string;
    };
    if (j.message) return j.message;
    if (j.error && j.path) return `${j.error}: ${j.path}`;
    if (j.error) return j.error;
  } catch {
    /* not JSON */
  }
  const t = bodyText.trim();
  if (t && t.length < 500) return t;
  return `Request failed (${status})`;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  const text = await res.text();
  if (!res.ok) {
    const msg = formatFailedRequestMessage(res.status, text);
    throw new Error(msg || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined as T;
  }
}

// Auth — expectedRole must match the Student / Faculty tab (enforced server-side).
export const login = (email: string, password: string, expectedRole: 'STUDENT' | 'FACULTY') =>
  request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, expectedRole }),
  });

export const registerAccount = (body: {
  name: string;
  email: string;
  passwordHash: string;
  role: 'STUDENT' | 'FACULTY';
  department?: string;
}) => request<User>('/auth/register', { method: 'POST', body: JSON.stringify(body) });

// Assignments
export const getAssignments = (params: { facultyId?: string; studentId?: string }) =>
  request<Assignment[]>(`/assignments${buildQuery(params)}`);
export const createAssignment = (data: Partial<Assignment>) =>
  request<Assignment>('/assignments', { method: 'POST', body: JSON.stringify(data) });
export const updateAssignment = (id: string, data: Partial<Assignment>) =>
  request<Assignment>(`/assignments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteAssignment = (id: string) =>
  request<void>(`/assignments/${id}`, { method: 'DELETE' });
export const completeAssignment = (id: string) =>
  request<Assignment>(`/assignments/${id}/complete`, { method: 'PUT' });
export type SubmitAssignmentPayload = {
  studentId: string;
  content: string;
  attachmentFileName?: string;
  attachmentMimeType?: string;
  attachmentBase64?: string;
};

export const submitAssignment = (assignmentId: string, body: SubmitAssignmentPayload) =>
  request<Assignment>(`/assignments/${assignmentId}/submit`, { method: 'POST', body: JSON.stringify(body) });
export const gradeSubmission = (assignmentId: string, studentId: string, grade: string, feedback: string) =>
  request<Assignment>(`/assignments/${assignmentId}/submissions/${studentId}/grade`, {
    method: 'PUT',
    body: JSON.stringify({ grade, feedback }),
  });

// Announcements
export const getAnnouncements = (params?: { facultyId?: string; course?: string }) =>
  request<Announcement[]>(`/announcements${buildQuery(params)}`);
export const createAnnouncement = (data: Partial<Announcement>) =>
  request<Announcement>('/announcements', { method: 'POST', body: JSON.stringify(data) });
export const deleteAnnouncement = (id: string) =>
  request<void>(`/announcements/${id}`, { method: 'DELETE' });

// Fees
export const getFees = (studentId: string) => request<Fee[]>(`/fees${buildQuery({ studentId })}`);
export const payFee = (feeId: string) => request<Fee>(`/fees/${feeId}/pay`, { method: 'PUT' });

// Timetable
export const getTimetable = (params: { studentId?: string; facultyId?: string }) =>
  request<TimetableEntry[]>(`/timetable${buildQuery(params)}`);
export const createTimetableEntry = (data: Partial<TimetableEntry>) =>
  request<TimetableEntry>('/timetable', { method: 'POST', body: JSON.stringify(data) });

// Results
export const getResults = (params: { studentId?: string; facultyId?: string }) =>
  request<Result[]>(`/results${buildQuery(params)}`);
export const createResult = (data: Partial<Result>) =>
  request<Result>('/results', { method: 'POST', body: JSON.stringify(data) });
export const updateResult = (id: string, data: Partial<Result>) =>
  request<Result>(`/results/${id}`, { method: 'PUT', body: JSON.stringify(data) });

// Chat
export const getConversation = (userId1: string, userId2: string) =>
  request<ChatMessage[]>(`/chat/conversation${buildQuery({ userId1, userId2 })}`);
export const sendMessage = (senderId: string, receiverId: string, message: string) =>
  request<ChatMessage>('/chat', { method: 'POST', body: JSON.stringify({ senderId, receiverId, message }) });
export const markChatRead = (receiverId: string) =>
  request<void>(`/chat/read/${encodeURIComponent(receiverId)}`, { method: 'PUT' });

// Attendance
export const getAttendance = (params: { studentId?: string; facultyId?: string; course?: string; date?: string }) =>
  request<Attendance[]>(`/attendance${buildQuery(params)}`);
export const markAttendance = (facultyId: string, data: { studentId: string; course: string; date: string; status: string }) =>
  request<Attendance>(`/attendance/${encodeURIComponent(facultyId)}/mark`, { method: 'POST', body: JSON.stringify(data) });
export const getAttendanceSummary = (studentId: string) =>
  request<Record<string, number>>(`/attendance/summary/${encodeURIComponent(studentId)}`);

// Exams
export const getExams = (params: { facultyId?: string; course?: string }) =>
  request<Exam[]>(`/exams${buildQuery(params)}`);
export const createExam = (data: Partial<Exam>) =>
  request<Exam>('/exams', { method: 'POST', body: JSON.stringify(data) });
export const updateExam = (id: string, data: Partial<Exam>) =>
  request<Exam>(`/exams/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteExam = (id: string) =>
  request<void>(`/exams/${encodeURIComponent(id)}`, { method: 'DELETE' });

// Faculty dashboard (risk KPIs, charts, sorted roster)
export const getTeacherDashboardSummary = (facultyUserId?: string) =>
  request<TeacherDashboardSummary>(`/teachers/dashboard/summary${buildQuery({ facultyUserId })}`);
export const getTeacherDashboardStudentsRisk = (facultyUserId?: string) =>
  request<StudentRiskRow[]>(`/teachers/dashboard/students-risk${buildQuery({ facultyUserId })}`);

// Student ML (dropout tier + lecture recommendations from course_recommendation)
export const getStudentMlInsights = (studentId: string) =>
  request<StudentMlInsightsDto>(`/students/${encodeURIComponent(studentId)}/ml-insights`);

/** Full profile including `dropoutMlFeatures` (camelCase) for the retention form. */
export type StudentProfileResponse = {
  studentId: string;
  name: string;
  email: string;
  major?: string;
  enrollmentDate?: string;
  demographics: Record<string, unknown>;
  dropoutMlFeatures?: unknown;
  dropoutProfileComplete?: boolean;
  predictedDropout?: boolean | null;
};

export const getStudentProfile = (userIdOrProfileId: string) =>
  request<StudentProfileResponse>(`/students/${encodeURIComponent(userIdOrProfileId)}/profile`);

export const patchStudentDropoutProfile = (studentOrUserId: string, body: DropoutMlProfilePayload) =>
  request<{ dropoutProfileComplete: boolean; studentId: string; message: string }>(
    `/students/${encodeURIComponent(studentOrUserId)}/dropout-profile`,
    { method: 'PATCH', body: JSON.stringify(body) }
  );

// Users
export const getUsers = () => request<User[]>('/users');
/** Mentor-scoped: students → their mentor; faculty → mentee user rows. */
export const getContacts = (forUserId: string) =>
  request<User[]>(`/users/contacts${buildQuery({ forUserId })}`);
export const getUser = (id: string) => request<User>(`/users/${encodeURIComponent(id)}`);
export const updateUser = (id: string, data: Partial<User>) =>
  request<User>(`/users/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });

// Types (inline to avoid circular imports)
export interface LoginResponse {
  userId: string;
  name: string;
  email: string;
  role: string;
  linkedProfileId?: string;
  phone?: string;
  department?: string;
  avatarUrl?: string;
  /** False until required dropout fields are submitted (new students). */
  dropoutProfileComplete?: boolean;
}

/** Payload for PATCH /students/{id}/dropout-profile (camelCase). */
export interface DropoutMlProfilePayload {
  school: string;
  gender: string;
  age: number;
  address: string;
  familySize: string;
  parentalStatus: string;
  motherEducation: number;
  fatherEducation: number;
  motherJob: string;
  fatherJob: string;
  reasonForChoosingSchool: string;
  guardian: string;
  travelTime: number;
  studyTime: number;
  numberOfFailures: number;
  schoolSupport: string;
  familySupport: string;
  extraPaidClass: string;
  extraCurricularActivities: string;
  attendedNursery: string;
  wantsHigherEducation: string;
  internetAccess: string;
  inRelationship: string;
  familyRelationship: number;
  freeTime: number;
  goingOut: number;
  weekendAlcohol: number;
  weekdayAlcohol: number;
  healthStatus: number;
  numberOfAbsences: number;
  grade1: number;
  grade2: number;
  finalGrade: number;
  droppedOut: boolean;
}
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  department?: string;
  avatarUrl?: string;
  linkedProfileId?: string;
}
export interface Assignment {
  id: string;
  title: string;
  description: string;
  course: string;
  dueDate: string;
  facultyId: string;
  assignedStudentIds: string[];
  submissions: Submission[];
  completed?: boolean;
  completedAt?: string;
  createdAt: string;
}
export interface Submission {
  studentId: string;
  content: string;
  attachmentFileName?: string;
  attachmentMimeType?: string;
  attachmentBase64?: string;
  submittedAt: string;
  grade?: string;
  feedback?: string;
  status: string;
}
export interface Announcement {
  id: string;
  title: string;
  body: string;
  course: string;
  facultyId: string;
  createdAt: string;
}
export interface Fee {
  id: string;
  studentId: string;
  description: string;
  amount: number;
  dueDate: string;
  status: string;
  paidAt?: string;
}
export interface TimetableEntry {
  id: string;
  course: string;
  subject: string;
  facultyId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
  studentIds: string[];
}
export interface Result {
  id: string;
  studentId: string;
  course: string;
  semester: string;
  subject: string;
  marksObtained: number;
  maxMarks: number;
  grade: string;
  facultyId: string;
  createdAt: string;
}
export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string;
  read: boolean;
}
export interface Attendance {
  id: string;
  studentId: string;
  facultyId: string;
  course: string;
  date: string;
  status: string;
}
export interface Exam {
  id: string;
  title: string;
  course: string;
  date: string;
  venue: string;
  durationMinutes: number;
  facultyId: string;
  description: string;
}

export interface TeacherDashboardSummary {
  advisorySection?: string | null;
  totalStudents: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  atRiskCount: number;
  activeInterventions: number;
  avgPerformancePercent: number;
  trendWeekLabels: string[];
  trendAssignmentsPct: number[];
  trendAttendancePct: number[];
  trendParticipationPct: number[];
}

export interface StudentRiskRow {
  studentId: string;
  displayStudentId: string;
  fullName: string;
  major: string;
  section?: string;
  performancePercent: number;
  riskTier: string;
  lastUpdatedIso: string;
}

export interface CourseRecommendationItem {
  id: string;
  title: string;
  tag: string;
  description: string;
  progressPercent: number;
  subjectKey: string;
}

export interface SubjectProbabilityDto {
  subject: string;
  probability: number;
}

export interface StudentMlInsightsDto {
  studentId: string;
  riskTier: string;
  riskScore: number;
  riskLevelLabel: string;
  dropoutDatasetLabel: boolean | null;
  predictedDropout: boolean | null;
  dropoutInsightSummary: string;
  mlRecommendedSubject: string | null;
  learningGoalHint: string;
  marksRowFound: boolean;
  recommendedCourses: CourseRecommendationItem[];
  /** runtime_python_rf | mongo_dataset | none */
  lectureInferenceSource: string;
  lectureModelTopProbabilities: SubjectProbabilityDto[];
}
