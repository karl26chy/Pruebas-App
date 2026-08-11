import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { BarChart3, PieChart as PieChartIcon, ShieldAlert } from 'lucide-react';
import { Card, CardTitle, EmptyMessage, ExportButtons, StatCard, TableWrapper, TableHead, TableBody } from '../../ui';
import { SubjectPerformanceChart } from '../../charts/SubjectPerformanceChart';
import { maxScoreFor } from '../../../lib/grades';
import type { Institution } from '../../../types';

const COLORS = ['#4f46e5', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899'];

interface LowPerfSubject {
  id: string;
  nombre: string;
  promedio: number;
  deficit: boolean;
}

interface OverviewTabProps {
  institution: Institution | null;
  totals: { students: number; teachers: number; grades: number };
  subjectData: { name: string; Promedio: number }[];
  attendancePieData: { name: string; value: number }[];
  lowPerfSubjects: LowPerfSubject[];
}

/** Resumen institucional: métricas, rendimiento y materias deficientes. */
export const OverviewTab: React.FC<OverviewTabProps> = ({
  institution, totals, subjectData, attendancePieData, lowPerfSubjects,
}) => {
  const exportTable = () => ({
    title: 'Rendimiento por Materia',
    headers: ['Materia', 'Promedio', 'Estado'],
    rows: lowPerfSubjects.map(s => [
      s.nombre,
      s.promedio,
      s.deficit ? `Bajo la mínima (${institution?.nota_minima_aprobacion})` : 'Aceptable',
    ]),
    fileName: 'rendimiento_materias',
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Estudiantes" value={totals.students} valueClassName="text-blue-600" />
        <StatCard label="Total Profesores" value={totals.teachers} valueClassName="text-emerald-600" />
        <StatCard label="Total Grados" value={totals.grades} valueClassName="text-purple-400" />
        <StatCard
          label="Nota Mín. Aprobación"
          value={institution?.nota_minima_aprobacion.toFixed(1)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle icon={<BarChart3 className="h-5 w-5 text-q10-600" />}>
            Rendimiento General por Materia
          </CardTitle>
          {subjectData.length === 0 ? (
            <EmptyMessage className="text-sm text-gray-500 py-8 text-center">
              No hay datos de rendimiento aún.
            </EmptyMessage>
          ) : (
            <SubjectPerformanceChart
              data={subjectData}
              dataKey="Promedio"
              maxScore={maxScoreFor(institution?.tipo)}
              notaMinima={institution?.nota_minima_aprobacion}
              referenceLabel={`Mín (${institution?.nota_minima_aprobacion})`}
            />
          )}
        </Card>

        <Card>
          <CardTitle icon={<PieChartIcon className="h-5 w-5 text-q10-600" />}>
            Distribución de Asistencia
          </CardTitle>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendancePieData}
                  cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                  paddingAngle={4} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {attendancePieData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle icon={<ShieldAlert className="h-5 w-5 text-amber-500" />} className="">
            Materias con Rendimiento Deficiente
          </CardTitle>
          <ExportButtons build={exportTable} />
        </div>

        {lowPerfSubjects.length === 0 ? (
          <EmptyMessage className="text-gray-500 text-sm">
            No hay registros de notas para calcular el rendimiento.
          </EmptyMessage>
        ) : (
          <TableWrapper>
            <TableHead>
              <th className="pb-2">Materia</th>
              <th className="pb-2 text-center">Promedio General</th>
              <th className="pb-2 text-center">Estado</th>
            </TableHead>
            <TableBody>
              {lowPerfSubjects.map(subj => (
                <tr key={subj.id} className="hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-900">{subj.nombre}</td>
                  <td className="py-3 text-center text-gray-600 font-semibold">{subj.promedio}</td>
                  <td className="py-3 text-center">
                    {subj.deficit ? (
                      <span className="px-2.5 py-0.5 rounded bg-red-100 text-red-400 border border-red-100 text-xs font-medium">
                        Bajo la Mínima ({institution?.nota_minima_aprobacion})
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-600 border border-emerald-100 text-xs font-medium">
                        Aceptable
                      </span>
                    )}
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
