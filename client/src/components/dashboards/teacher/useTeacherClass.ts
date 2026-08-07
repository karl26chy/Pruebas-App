import { useApp } from '../../../context/useApp';
import { fullName, gradeLabel } from '../../../lib/people';
import { maxScoreFor } from '../../../lib/grades';

/** Clase activa del docente: la asignación materia-grado seleccionada. */
export function useTeacherClass(selectedAssignId: string) {
  const {
    user, grades, subjects, assignments, studentGrades,
    users, evaluations, marks, currentInstitution,
  } = useApp();

  const teacherAssignments = assignments.filter(a => a.profesor_id === user?.id);
  const activeAssignment = teacherAssignments.find(a => a.id === selectedAssignId);
  const activeGrade = activeAssignment ? grades.find(g => g.id === activeAssignment.grado_id) : null;
  const activeSubject = activeAssignment ? subjects.find(s => s.id === activeAssignment.materia_id) : null;

  const enrolledStudentIds = activeGrade
    ? studentGrades.filter(sg => sg.grado_id === activeGrade.id).map(sg => sg.estudiante_id)
    : [];
  const gradeStudents = users.filter(u => enrolledStudentIds.includes(u.id) && u.activo);

  const getSubjectName = (subjId: string) => subjects.find(s => s.id === subjId)?.nombre || 'Materia';
  const getGradeName = (gradeId: string) => gradeLabel(grades.find(g => g.id === gradeId)) || 'Grado';
  const getStudentName = (studId: string) => fullName(users.find(u => u.id === studId)) || 'Estudiante';

  /** Evaluaciones definidas para la materia y grado activos. */
  const activeEvals = evaluations.filter(
    e => activeAssignment && e.materia_id === activeAssignment.materia_id && e.grado_id === activeAssignment.grado_id
  );

  return {
    user,
    currentInstitution,
    teacherAssignments,
    activeAssignment,
    activeGrade,
    activeSubject,
    gradeStudents,
    activeEvals,
    marks,
    notaMax: maxScoreFor(currentInstitution?.tipo),
    getSubjectName,
    getGradeName,
    getStudentName,
  };
}
