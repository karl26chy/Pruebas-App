import React, { useState } from 'react';
import { api } from '../../../services/api';
import { Card, EmptyMessage, ExportButtons, PRIMARY_BUTTON, TableWrapper, TableHead, TableBody } from '../../ui';
import type { Assignment, Subject, Grade, User } from '../../../types';

type Estado = 'presente' | 'ausente' | 'tardanza';
const ESTADOS: Estado[] = ['presente', 'ausente', 'tardanza'];

interface AttendanceTabProps {
  assignment: Assignment;
  subject?: Subject | null;
  grade?: Grade | null;
  students: User[];
  teacherId: string;
  onSaved: () => Promise<void>;
}

/** Toma de asistencia de la clase activa para una fecha concreta. */
export const AttendanceTab: React.FC<AttendanceTabProps> = ({
  assignment, subject, grade, students, teacherId, onSaved,
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<Record<string, Estado>>({});

  const estadoDe = (studentId: string): Estado => records[studentId] || 'presente';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await Promise.all(students.map(student =>
        api.createAttendance({
          estudiante_id: student.id,
          materia_id: assignment.materia_id,
          grado_id: assignment.grado_id,
          fecha: date,
          estado: estadoDe(student.id),
          registrado_por: teacherId,
        })
      ));
      await onSaved();
      alert('Asistencia registrada con éxito');
    } catch {
      alert('Error al registrar asistencia');
    }
  };

  const exportTable = () => ({
    title: `Asistencia ${subject?.nombre}`,
    headers: ['Estudiante', 'Estado'],
    rows: students.map(s => [`${s.nombre} ${s.apellido}`, estadoDe(s.id)]),
    fileName: `asistencia_${subject?.nombre?.toLowerCase().replace(/\s+/g, '_')}`,
  });

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-bold text-gray-900">
          Asistencia - {subject?.nombre} ({grade?.nombre})
        </h3>
        <div className="flex items-center gap-2">
          <ExportButtons build={exportTable} />
          <span className="text-xs text-gray-500 font-medium">Fecha:</span>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg text-sm text-gray-900 px-3 py-1.5 focus:outline-none"
          />
        </div>
      </div>

      {students.length === 0 ? (
        <EmptyMessage className="text-gray-500 text-sm py-4">No hay estudiantes matriculados.</EmptyMessage>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <TableWrapper>
            <TableHead uppercase>
              <th className="pb-3">Estudiante</th>
              <th className="pb-3 text-center">Presente</th>
              <th className="pb-3 text-center">Ausente</th>
              <th className="pb-3 text-center">Tardanza</th>
            </TableHead>
            <TableBody>
              {students.map(student => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="py-3.5 font-medium text-gray-900">
                    {student.nombre} {student.apellido}
                  </td>
                  {ESTADOS.map(estado => (
                    <td key={estado} className="py-3.5 text-center">
                      <input
                        type="radio"
                        name={`att-${student.id}`}
                        checked={estadoDe(student.id) === estado}
                        onChange={() => setRecords(prev => ({ ...prev, [student.id]: estado }))}
                        className="h-4 w-4 text-q10-600 focus:ring-q10-500 bg-white border-gray-300"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </TableBody>
          </TableWrapper>

          <div className="flex justify-end pt-4">
            <button type="submit" className={`px-6 ${PRIMARY_BUTTON}`}>
              Guardar Asistencia
            </button>
          </div>
        </form>
      )}
    </Card>
  );
};
