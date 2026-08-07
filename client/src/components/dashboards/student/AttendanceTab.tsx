import React from 'react';
import { Card, CardTitle, EmptyMessage, ExportButtons, StatCard, TableWrapper, TableHead, TableBody } from '../../ui';
import type { AttendanceCounts } from '../../../lib/attendance';
import type { Attendance } from '../../../types';

interface AttendanceTabProps {
  records: Attendance[];
  counts: AttendanceCounts;
  presenceRate: number;
  getSubjectName: (subjectId: string) => string;
  getTeacherName: (teacherId: string) => string;
}

const ESTADO_STYLE: Record<string, string> = {
  presente: 'bg-emerald-100 text-emerald-600',
  ausente: 'bg-red-100 text-red-600',
  tardanza: 'bg-amber-100 text-amber-600',
};

/** Métricas y bitácora de asistencia del estudiante. */
export const AttendanceTab: React.FC<AttendanceTabProps> = ({
  records,
  counts,
  presenceRate,
  getSubjectName,
  getTeacherName,
}) => {
  const exportTable = () => ({
    title: 'Asistencias',
    headers: ['Fecha', 'Materia', 'Docente', 'Estado'],
    rows: records.map(a => [a.fecha, getSubjectName(a.materia_id), getTeacherName(a.registrado_por), a.estado]),
    fileName: 'asistencias',
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <StatCard label="Tasa de Asistencia" value={`${presenceRate}%`} />
        <StatCard label="Asistencias" value={counts.presente} valueClassName="text-emerald-600" />
        <StatCard label="Inasistencias" value={counts.ausente} valueClassName="text-red-600" />
        <StatCard label="Tardanzas" value={counts.tardanza} valueClassName="text-amber-600" />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="">Bitácora de Asistencia</CardTitle>
          <ExportButtons build={exportTable} />
        </div>

        {records.length === 0 ? (
          <EmptyMessage className="text-gray-500 text-sm">
            No cuentas con registros de asistencia.
          </EmptyMessage>
        ) : (
          <TableWrapper>
            <TableHead>
              <th className="pb-3">Fecha</th>
              <th className="pb-3">Materia</th>
              <th className="pb-3">Docente</th>
              <th className="pb-3 text-right">Estado</th>
            </TableHead>
            <TableBody>
              {records.map(att => (
                <tr key={att.id} className="hover:bg-gray-50">
                  <td className="py-3 text-gray-600 font-medium">{att.fecha}</td>
                  <td className="py-3 text-gray-600">{getSubjectName(att.materia_id)}</td>
                  <td className="py-3 text-gray-500">{getTeacherName(att.registrado_por)}</td>
                  <td className="py-3 text-right">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${ESTADO_STYLE[att.estado]}`}>
                      {att.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </TableBody>
          </TableWrapper>
        )}
      </Card>
    </div>
  );
};
