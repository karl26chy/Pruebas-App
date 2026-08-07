import React, { useState } from 'react';
import { BookOpen, GraduationCap } from 'lucide-react';
import { api } from '../../../services/api';
import { Card, CardTitle, EmptyMessage, Field, INPUT } from '../../ui';
import type { Grade, Institution, StudentGrade, Subject } from '../../../types';
import type { Feedback } from './useSuperAdmin';

interface GradesSubjectsTabProps {
  institutions: Institution[];
  grades: Grade[];
  subjects: Subject[];
  studentGrades: StudentGrade[];
  showMsg: (type: Feedback['type'], text: string) => void;
  onChanged: () => Promise<void>;
}

/** Catálogo de grados por institución y de materias (global). */
export const GradesSubjectsTab: React.FC<GradesSubjectsTabProps> = ({
  institutions, grades, subjects, studentGrades, showMsg, onChanged,
}) => {
  const [instId, setInstId] = useState('');
  const [gradeName, setGradeName] = useState('');
  const [gradeType, setGradeType] = useState('A');
  const [gradeCupo, setGradeCupo] = useState(30);
  const [subjectName, setSubjectName] = useState('');
  const [subjectDesc, setSubjectDesc] = useState('');

  const handleCreateGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeName || !instId) return;
    try {
      await api.createGrade({
        institucion_id: instId,
        nombre: gradeName,
        tipo_grado: gradeType,
        cupo_maximo: Number(gradeCupo),
      });
      setGradeName('');
      setGradeCupo(30);
      showMsg('success', 'Grado creado.');
      await onChanged();
    } catch {
      showMsg('error', 'Error al crear grado.');
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName) return;
    try {
      await api.createSubject({ nombre: subjectName, descripcion: subjectDesc });
      setSubjectName('');
      setSubjectDesc('');
      showMsg('success', 'Materia creada.');
      await onChanged();
    } catch {
      showMsg('error', 'Error al crear materia.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
      <Card>
        <CardTitle icon={<GraduationCap className="h-5 w-5 text-q10-600" />} className="mb-6">
          Grados / Cursos
        </CardTitle>

        <Field label="Institución" className="mb-4">
          <select required value={instId} onChange={e => setInstId(e.target.value)} className={INPUT}>
            <option value="">-- Seleccionar --</option>
            {institutions.map(inst => <option key={inst.id} value={inst.id}>{inst.nombre}</option>)}
          </select>
        </Field>

        <form onSubmit={handleCreateGrade} className="flex gap-2 mb-6">
          <input
            type="text" required value={gradeName} onChange={e => setGradeName(e.target.value)}
            placeholder="6to, 10mo..."
            className="flex-1 min-w-0 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none"
          />
          <input
            type="text" required value={gradeType} onChange={e => setGradeType(e.target.value)}
            placeholder="A"
            className="w-14 px-2 py-2 bg-white border border-gray-200 rounded-xl text-sm text-center focus:outline-none"
          />
          <input
            type="number" min="1" max="200" required value={gradeCupo}
            onChange={e => setGradeCupo(Number(e.target.value))} title="Cupo"
            className="w-20 px-2 py-2 bg-white border border-gray-200 rounded-xl text-sm text-center focus:outline-none"
          />
          <button type="submit" className="px-4 py-2 bg-q10-600 hover:bg-q10-700 text-white font-semibold rounded-xl text-sm shrink-0">
            Agregar
          </button>
        </form>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {instId ? (
            grades.filter(g => g.institucion_id === instId).map(g => {
              const enrolled = studentGrades.filter(sg => sg.grado_id === g.id).length;
              const cupo = g.cupo_maximo || 30;
              return (
                <div key={g.id} className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-200">
                  <span className="text-sm font-semibold text-gray-900">
                    Grado {g.nombre} - "{g.tipo_grado}"
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    enrolled >= cupo ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {enrolled}/{cupo}
                  </span>
                </div>
              );
            })
          ) : (
            <EmptyMessage>Selecciona una institución.</EmptyMessage>
          )}
        </div>
      </Card>

      <Card>
        <CardTitle icon={<BookOpen className="h-5 w-5 text-q10-600" />} className="mb-6">
          Materias Académicas
        </CardTitle>

        <form onSubmit={handleCreateSubject} className="space-y-4 mb-6">
          <input
            type="text" required value={subjectName} onChange={e => setSubjectName(e.target.value)}
            placeholder="Nombre de la materia" className={INPUT}
          />
          <div className="flex gap-3">
            <input
              type="text" value={subjectDesc} onChange={e => setSubjectDesc(e.target.value)}
              placeholder="Descripción..."
              className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none"
            />
            <button type="submit" className="px-4 py-2 bg-q10-600 hover:bg-q10-700 text-white font-semibold rounded-xl text-sm">
              Agregar
            </button>
          </div>
        </form>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {subjects.map(s => (
            <div key={s.id} className="p-3 bg-white rounded-xl border border-gray-200">
              <span className="text-sm font-semibold text-gray-900 block">{s.nombre}</span>
              <span className="text-xs text-gray-400">{s.descripcion}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
