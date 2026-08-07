import { useApp } from '../../../context/useApp';
import { averageBySubject } from '../../../lib/grades';
import { countByStatus, attendanceRateWithTardiness } from '../../../lib/attendance';
import { fullName } from '../../../lib/people';

/** Datos derivados del portal del estudiante: su grado, notas y asistencia. */
export function useStudentDashboard() {
  const {
    user, currentInstitution, studentGrades, grades, subjects,
    assignments, attendance, marks, citations, users,
  } = useApp();

  // Grado en el que está matriculado y materias que se dictan en él.
  const myGradeLink = studentGrades.find(sg => sg.estudiante_id === user?.id);
  const myGrade = myGradeLink ? grades.find(g => g.id === myGradeLink.grado_id) : null;
  const myGradeAssignments = myGrade ? assignments.filter(a => a.grado_id === myGrade.id) : [];

  const myTeacherIds = myGradeAssignments.map(a => a.profesor_id);
  const myTeachers = users.filter(u => myTeacherIds.includes(u.id));

  const getSubjectName = (subjId: string) => subjects.find(s => s.id === subjId)?.nombre || 'Materia';
  const getTeacherName = (teacherId: string) =>
    fullName(users.find(u => u.id === teacherId)) || 'Docente';

  const myMarks = marks.filter(m => m.estudiante_id === user?.id);

  const chartData = averageBySubject(myMarks).map(({ materiaId, promedio }) => ({
    name: getSubjectName(materiaId),
    'Nota Promedio': promedio,
  }));

  const myAttendance = attendance.filter(a => a.estudiante_id === user?.id);
  const attendanceCounts = countByStatus(myAttendance);
  const presenceRate = attendanceRateWithTardiness(myAttendance);

  const myCitations = citations.filter(c => c.estudiante_id === user?.id);
  const pendingCitations = myCitations.filter(c => c.estado === 'pendiente');

  return {
    user,
    currentInstitution,
    myGrade,
    myGradeAssignments,
    myTeachers,
    getSubjectName,
    getTeacherName,
    myMarks,
    chartData,
    myAttendance,
    attendanceCounts,
    presenceRate,
    myCitations,
    pendingCitations,
  };
}
