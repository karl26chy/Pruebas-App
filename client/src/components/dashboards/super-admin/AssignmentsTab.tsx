import React, { useState } from 'react';
import { BookOpenCheck, GraduationCap } from 'lucide-react';
import { api } from '../../../services/api';
import { Card, CardTitle, EmptyMessage, Field, INPUT, PRIMARY_BUTTON } from '../../ui';
import type { Assignment, Grade, Institution, StudentGrade, Subject, User } from '../../../types';
import type { Feedback } from './useSuperAdmin';

interface AssignmentsTabProps {
  institutions: Institution[];
  users: User[];
  grades: Grade[];
  subjects: Subject[];
  assignments: Assignment[];
  studentGrades: StudentGrade[];
  getUserLabel: (userId: string) => string;
  getSubjectLabel: (subjectId: string) => string;
  getGradeLabel: (gradeId: string) => string;
  showMsg: (type: Feedback['type'], text: string) => void;
  onChanged: () => Promise<void>;
}

/** Asignación de materias a profesores y matrícula de estudiantes en grados. */
export const AssignmentsTab: React.FC<AssignmentsTabProps> = ({
  institutions, users, grades, subjects, assignments, studentGrades,
  getUserLabel, getSubjectLabel, getGradeLabel, showMsg, onChanged,
}) => {
  const [assignInstId, setAssignInstId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [gradeId, setGradeId] = useState('');

  const [studInstId, setStudInstId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studGradeId, setStudGradeId] = useState('');

  const filteredAssignments = assignments.filter(a => a.institucion_id === assignInstId);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId || !subjectId || !gradeId || !assignInstId) return;

    const exists = assignments.some(
      a => a.profesor_id === teacherId && a.materia_id === subjectId && a.grado_id === gradeId
    );
    if (exists) {
      showMsg('error', 'Esta asignación ya existe.');
      return;
    }

    try {
      await api.createAssignment({
        profesor_id: teacherId,
        materia_id: subjectId,
        grado_id: gradeId,
        institucion_id: assignInstId,
      });
      setTeacherId(''); setSubjectId(''); setGradeId('');
      showMsg('success', 'Asignación guardada.');
      await onChanged();
    } catch {
      showMsg('error', 'Error al crear asignación.');
    }
  };

  /** Matricular respeta el cupo del grado, salvo que sea un traslado. */
  const handleAssignStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !studGradeId) return;

    const existing = studentGrades.find(sg => sg.estudiante_id === studentId);
    const targetGrade = grades.find(g => g.id === studGradeId);
    const enrolled = studentGrades.filter(sg => sg.grado_id === studGradeId).length;
    const cupo = targetGrade?.cupo_maximo || 30;
    const isTransfer = existing && existing.grado_id !== studGradeId;

    if (!isTransfer && enrolled >= cupo) {
      showMsg('error', `Cupo máximo (${cupo}) alcanzado.`);
      return;
    }

    try {
      if (existing) await api.deleteStudentGrade(existing.id);
      await api.createStudentGrade({ estudiante_id: studentId, grado_id: studGradeId });
      setStudentId(''); setStudGradeId('');
      showMsg('success', 'Estudiante matriculado.');
      await onChanged();
    } catch {
      showMsg('error', 'Error al matricular.');
    }
  };

  const institutionOptions = institutions.map(inst => (
    <option key={inst.id} value={inst.id}>{inst.nombre}</option>
  ));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
      <Card>
        <CardTitle icon={<BookOpenCheck className="h-5 w-5 text-q10-600" />}>
          Asignar Materia a Profesor
        </CardTitle>

        <Field label="Institución" className="mb-4">
          <select
            required value={assignInstId}
            onChange={e => { setAssignInstId(e.target.value); setTeacherId(''); setSubjectId(''); setGradeId(''); }}
            className={INPUT}
          >
            <option value="">-- Seleccionar --</option>
            {institutionOptions}
          </select>
        </Field>

        {assignInstId && (
          <form onSubmit={handleCreateAssignment} className="space-y-4 mb-6">
            <Field label="Profesor">
              <select required value={teacherId} onChange={e => setTeacherId(e.target.value)} className={INPUT}>
                <option value="">-- Seleccionar --</option>
                {users
                  .filter(u => u.rol === 'teacher' && u.institucion_id === assignInstId)
                  .map(t => <option key={t.id} value={t.id}>{t.nombre} {t.apellido}</option>)}
              </select>
            </Field>

            <Field label="Materia">
              <select required value={subjectId} onChange={e => setSubjectId(e.target.value)} className={INPUT}>
                <option value="">-- Seleccionar --</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </Field>

            <Field label="Grado">
              <select required value={gradeId} onChange={e => setGradeId(e.target.value)} className={INPUT}>
                <option value="">-- Seleccionar --</option>
                {grades
                  .filter(g => g.institucion_id === assignInstId)
                  .map(g => <option key={g.id} value={g.id}>{g.nombre} "{g.tipo_grado}"</option>)}
              </select>
            </Field>

            <button type="submit" className={`w-full ${PRIMARY_BUTTON}`}>Guardar Asignación</button>
          </form>
        )}

        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Asignaciones Activas
        </h4>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {filteredAssignments.map(a => (
            <div key={a.id} className="p-3 bg-white rounded-xl border border-gray-200 text-xs">
              <span className="font-semibold text-gray-900 block">{getUserLabel(a.profesor_id)}</span>
              <div className="mt-1 text-gray-500 flex justify-between">
                <span>{getSubjectLabel(a.materia_id)}</span>
                <span>{getGradeLabel(a.grado_id)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle icon={<GraduationCap className="h-5 w-5 text-q10-600" />}>
          Matricular Estudiante
        </CardTitle>

        <Field label="Institución" className="mb-4">
          <select
            required value={studInstId}
            onChange={e => { setStudInstId(e.target.value); setStudentId(''); setStudGradeId(''); }}
            className={INPUT}
          >
            <option value="">-- Seleccionar --</option>
            {institutionOptions}
          </select>
        </Field>

        {studInstId && (
          <form onSubmit={handleAssignStudent} className="space-y-4 mb-6">
            <Field label="Estudiante">
              <select required value={studentId} onChange={e => setStudentId(e.target.value)} className={INPUT}>
                <option value="">-- Seleccionar --</option>
                {users
                  .filter(u => u.rol === 'student' && u.institucion_id === studInstId)
                  .map(s => <option key={s.id} value={s.id}>{s.nombre} {s.apellido}</option>)}
              </select>
            </Field>

            <Field label="Grado">
              <select required value={studGradeId} onChange={e => setStudGradeId(e.target.value)} className={INPUT}>
                <option value="">-- Seleccionar --</option>
                {grades.filter(g => g.institucion_id === studInstId).map(g => {
                  const enrolled = studentGrades.filter(sg => sg.grado_id === g.id).length;
                  const cupo = g.cupo_maximo || 30;
                  return (
                    <option key={g.id} value={g.id}>
                      {g.nombre} "{g.tipo_grado}" ({enrolled}/{cupo})
                    </option>
                  );
                })}
              </select>
            </Field>

            <button type="submit" className={`w-full ${PRIMARY_BUTTON}`}>Matricular</button>
          </form>
        )}

        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Matrículas</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {studInstId ? (
            studentGrades
              .filter(sg =>
                users.some(u => u.rol === 'student' && u.institucion_id === studInstId && u.id === sg.estudiante_id)
              )
              .map(sg => (
                <div key={sg.id} className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-200 text-xs">
                  <span className="font-semibold text-gray-900">{getUserLabel(sg.estudiante_id)}</span>
                  <span className="px-2 py-0.5 rounded bg-q10-50 text-q10-600 font-medium">
                    {getGradeLabel(sg.grado_id)}
                  </span>
                </div>
              ))
          ) : (
            <EmptyMessage>Selecciona una institución.</EmptyMessage>
          )}
        </div>
      </Card>
    </div>
  );
};
