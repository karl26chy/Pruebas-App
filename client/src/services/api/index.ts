import { authApi } from './auth.api';
import { createResourceApi } from './resource.api';

export { getAuthToken, setAuthToken, UNAUTHORIZED_EVENT, ApiError } from '../http';
import type {
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
} from '../../types';

export const institutions = createResourceApi<Institution>('institutions');
export const users = createResourceApi<User & { password?: string }>('users');
export const grades = createResourceApi<Grade>('grades');
export const subjects = createResourceApi<Subject>('subjects');
export const assignments = createResourceApi<Assignment>('assignments');
export const studentGrades = createResourceApi<StudentGrade>('student_grades');
export const attendance = createResourceApi<Attendance>('attendance');
export const marks = createResourceApi<Mark>('marks');
export const citations = createResourceApi<Citation>('citations');
export const messages = createResourceApi<Message>('messages');
export const evaluations = createResourceApi<Evaluation>('evaluations');

/**
 * Fachada estable del API. Mantiene la forma que consumen los componentes
 * mientras por debajo todo se apoya en los clientes por recurso.
 */
export const api = {
  // Auth
  login: authApi.login,
  getMe: authApi.getMe,

  // Institutions
  getInstitutions: institutions.list,
  getInstitution: institutions.get,
  createInstitution: institutions.create,
  updateInstitution: institutions.update,
  deleteInstitution: institutions.remove,

  // Users
  getUsers: users.list,
  createUser: users.create,
  updateUser: users.update,
  deleteUser: users.remove,

  // Grades
  getGrades: grades.list,
  createGrade: grades.create,
  updateGrade: grades.update,
  deleteGrade: grades.remove,

  // Subjects
  getSubjects: subjects.list,
  createSubject: subjects.create,
  updateSubject: subjects.update,
  deleteSubject: subjects.remove,

  // Assignments
  getAssignments: assignments.list,
  createAssignment: assignments.create,
  deleteAssignment: assignments.remove,

  // Student Grades Mapping
  getStudentGrades: studentGrades.list,
  createStudentGrade: studentGrades.create,
  deleteStudentGrade: studentGrades.remove,

  // Attendance
  getAttendance: attendance.list,
  createAttendance: attendance.create,

  // Marks
  getMarks: marks.list,
  createMark: marks.create,
  updateMark: marks.update,

  // Citations
  getCitations: citations.list,
  createCitation: citations.create,
  updateCitation: citations.update,

  // Messages
  getMessages: messages.list,
  createMessage: messages.create,
  updateMessage: messages.patch,

  // Evaluations
  getEvaluations: evaluations.list,
  createEvaluation: evaluations.create,
  updateEvaluation: evaluations.update,
  deleteEvaluation: evaluations.remove,
};
