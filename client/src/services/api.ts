const API_BASE = 'http://localhost:5000';

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // Institutions
  getInstitutions: () => apiFetch<any[]>('/institutions'),
  getInstitution: (id: string) => apiFetch<any>(`/institutions/${id}`),
  createInstitution: (data: any) => apiFetch<any>('/institutions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateInstitution: (id: string, data: any) => apiFetch<any>(`/institutions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteInstitution: (id: string) => apiFetch<any>(`/institutions/${id}`, {
    method: 'DELETE',
  }),

  // Users
  getUsers: () => apiFetch<any[]>('/users'),
  createUser: (data: any) => apiFetch<any>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateUser: (id: string, data: any) => apiFetch<any>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteUser: (id: string) => apiFetch<any>(`/users/${id}`, {
    method: 'DELETE',
  }),

  // Grades
  getGrades: () => apiFetch<any[]>('/grades'),
  createGrade: (data: any) => apiFetch<any>('/grades', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateGrade: (id: string, data: any) => apiFetch<any>(`/grades/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteGrade: (id: string) => apiFetch<any>(`/grades/${id}`, {
    method: 'DELETE',
  }),

  // Subjects
  getSubjects: () => apiFetch<any[]>('/subjects'),
  createSubject: (data: any) => apiFetch<any>('/subjects', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateSubject: (id: string, data: any) => apiFetch<any>(`/subjects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteSubject: (id: string) => apiFetch<any>(`/subjects/${id}`, {
    method: 'DELETE',
  }),

  // Assignments
  getAssignments: () => apiFetch<any[]>('/assignments'),
  createAssignment: (data: any) => apiFetch<any>('/assignments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteAssignment: (id: string) => apiFetch<any>(`/assignments/${id}`, {
    method: 'DELETE',
  }),

  // Student Grades Mapping (which student is in which grade)
  getStudentGrades: () => apiFetch<any[]>('/student_grades'),
  createStudentGrade: (data: any) => apiFetch<any>('/student_grades', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteStudentGrade: (id: string) => apiFetch<any>(`/student_grades/${id}`, {
    method: 'DELETE',
  }),

  // Attendance
  getAttendance: () => apiFetch<any[]>('/attendance'),
  createAttendance: (data: any) => apiFetch<any>('/attendance', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Marks
  getMarks: () => apiFetch<any[]>('/marks'),
  createMark: (data: any) => apiFetch<any>('/marks', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateMark: (id: string, data: any) => apiFetch<any>(`/marks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Citations
  getCitations: () => apiFetch<any[]>('/citations'),
  createCitation: (data: any) => apiFetch<any>('/citations', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateCitation: (id: string, data: any) => apiFetch<any>(`/citations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Messages
  getMessages: () => apiFetch<any[]>('/messages'),
  createMessage: (data: any) => apiFetch<any>('/messages', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateMessage: (id: string, data: any) => apiFetch<any>(`/messages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  // Evaluations
  getEvaluations: () => apiFetch<any[]>('/evaluations'),
  createEvaluation: (data: any) => apiFetch<any>('/evaluations', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateEvaluation: (id: string, data: any) => apiFetch<any>(`/evaluations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteEvaluation: (id: string) => apiFetch<any>(`/evaluations/${id}`, {
    method: 'DELETE',
  }),
};
