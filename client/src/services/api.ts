import type {
  LoginResponse,
  User,
  Institution,
  Grade,
  Subject,
  Assignment,
  StudentGrade,
  Attendance,
  Mark,
  Citation,
  Message,
  Evaluation,
} from '../types';

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') || '/api';

const TOKEN_KEY = 'edu_platform_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    setAuthToken(null);
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('Sesión expirada o inválida. Inicia sesión de nuevo.');
  }

  if (!response.ok) {
    let message = `API error: ${response.status} ${response.statusText}`;
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getMe: () => apiFetch<User>('/auth/me'),

  // Institutions
  getInstitutions: () => apiFetch<Institution[]>('/institutions'),
  getInstitution: (id: string) => apiFetch<Institution>(`/institutions/${id}`),
  createInstitution: (data: Partial<Institution>) =>
    apiFetch<Institution>('/institutions', { method: 'POST', body: JSON.stringify(data) }),
  updateInstitution: (id: string, data: Partial<Institution>) =>
    apiFetch<Institution>(`/institutions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInstitution: (id: string) =>
    apiFetch<Institution>(`/institutions/${id}`, { method: 'DELETE' }),

  // Users
  getUsers: () => apiFetch<User[]>('/users'),
  createUser: (data: Partial<User & { password: string }>) =>
    apiFetch<User>('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: Partial<User & { password?: string }>) =>
    apiFetch<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id: string) =>
    apiFetch<User>(`/users/${id}`, { method: 'DELETE' }),

  // Grades
  getGrades: () => apiFetch<Grade[]>('/grades'),
  createGrade: (data: Partial<Grade>) =>
    apiFetch<Grade>('/grades', { method: 'POST', body: JSON.stringify(data) }),
  updateGrade: (id: string, data: Partial<Grade>) =>
    apiFetch<Grade>(`/grades/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGrade: (id: string) =>
    apiFetch<Grade>(`/grades/${id}`, { method: 'DELETE' }),

  // Subjects
  getSubjects: () => apiFetch<Subject[]>('/subjects'),
  createSubject: (data: Partial<Subject>) =>
    apiFetch<Subject>('/subjects', { method: 'POST', body: JSON.stringify(data) }),
  updateSubject: (id: string, data: Partial<Subject>) =>
    apiFetch<Subject>(`/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSubject: (id: string) =>
    apiFetch<Subject>(`/subjects/${id}`, { method: 'DELETE' }),

  // Assignments
  getAssignments: () => apiFetch<Assignment[]>('/assignments'),
  createAssignment: (data: Partial<Assignment>) =>
    apiFetch<Assignment>('/assignments', { method: 'POST', body: JSON.stringify(data) }),
  deleteAssignment: (id: string) =>
    apiFetch<Assignment>(`/assignments/${id}`, { method: 'DELETE' }),

  // Student Grades Mapping
  getStudentGrades: () => apiFetch<StudentGrade[]>('/student_grades'),
  createStudentGrade: (data: Partial<StudentGrade>) =>
    apiFetch<StudentGrade>('/student_grades', { method: 'POST', body: JSON.stringify(data) }),
  deleteStudentGrade: (id: string) =>
    apiFetch<StudentGrade>(`/student_grades/${id}`, { method: 'DELETE' }),

  // Attendance
  getAttendance: () => apiFetch<Attendance[]>('/attendance'),
  createAttendance: (data: Partial<Attendance>) =>
    apiFetch<Attendance>('/attendance', { method: 'POST', body: JSON.stringify(data) }),

  // Marks
  getMarks: () => apiFetch<Mark[]>('/marks'),
  createMark: (data: Partial<Mark>) =>
    apiFetch<Mark>('/marks', { method: 'POST', body: JSON.stringify(data) }),
  updateMark: (id: string, data: Partial<Mark>) =>
    apiFetch<Mark>(`/marks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Citations
  getCitations: () => apiFetch<Citation[]>('/citations'),
  createCitation: (data: Partial<Citation>) =>
    apiFetch<Citation>('/citations', { method: 'POST', body: JSON.stringify(data) }),
  updateCitation: (id: string, data: Partial<Citation>) =>
    apiFetch<Citation>(`/citations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Messages
  getMessages: () => apiFetch<Message[]>('/messages'),
  createMessage: (data: Partial<Message>) =>
    apiFetch<Message>('/messages', { method: 'POST', body: JSON.stringify(data) }),
  updateMessage: (id: string, data: Partial<Message>) =>
    apiFetch<Message>(`/messages/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Evaluations
  getEvaluations: () => apiFetch<Evaluation[]>('/evaluations'),
  createEvaluation: (data: Partial<Evaluation>) =>
    apiFetch<Evaluation>('/evaluations', { method: 'POST', body: JSON.stringify(data) }),
  updateEvaluation: (id: string, data: Partial<Evaluation>) =>
    apiFetch<Evaluation>(`/evaluations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEvaluation: (id: string) =>
    apiFetch<Evaluation>(`/evaluations/${id}`, { method: 'DELETE' }),
};
