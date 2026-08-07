import React from 'react';
import { Card, CardTitle, EmptyMessage, ExportButtons, TableWrapper, TableHead, TableBody } from '../../ui';
import { SubjectPerformanceChart, type SubjectChartDatum } from '../../charts/SubjectPerformanceChart';
import { maxScoreFor } from '../../../lib/grades';
import type { Institution, Mark } from '../../../types';

interface GradesTabProps {
  chartData: SubjectChartDatum[];
  marks: Mark[];
  institution: Institution | null;
  getSubjectName: (subjectId: string) => string;
}

/** Rendimiento académico: gráfica por materia y boleta detallada. */
export const GradesTab: React.FC<GradesTabProps> = ({
  chartData,
  marks,
  institution,
  getSubjectName,
}) => {
  const exportTable = () => ({
    title: 'Calificaciones',
    headers: ['Materia', 'Evaluación', 'Periodo', 'Nota'],
    rows: marks.map(m => [getSubjectName(m.materia_id), m.tipo_evaluacion, m.periodo, m.nota]),
    fileName: 'calificaciones',
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardTitle>Rendimiento Académico por Materia</CardTitle>
        {chartData.length === 0 ? (
          <EmptyMessage className="text-sm text-gray-500 py-6">
            Aún no cuentas con calificaciones registradas.
          </EmptyMessage>
        ) : (
          <SubjectPerformanceChart
            data={chartData}
            dataKey="Nota Promedio"
            maxScore={maxScoreFor(institution?.tipo)}
            notaMinima={institution?.nota_minima_aprobacion}
            referenceLabel={`Mínima (${institution?.nota_minima_aprobacion.toFixed(1)})`}
            referenceLabelPosition="insideBottomRight"
            height="h-80"
            gridStroke="#1e293b"
            showActiveDot
            highlightTooltipLabel
          />
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="">Boleta de Calificaciones Detallada</CardTitle>
          <ExportButtons build={exportTable} />
        </div>

        {marks.length === 0 ? (
          <EmptyMessage className="text-gray-500 text-sm py-2">
            No hay calificaciones individuales guardadas.
          </EmptyMessage>
        ) : (
          <TableWrapper>
            <TableHead>
              <th className="pb-3">Materia</th>
              <th className="pb-3">Evaluación</th>
              <th className="pb-3">Periodo</th>
              <th className="pb-3 text-right">Nota Obtenida</th>
            </TableHead>
            <TableBody>
              {marks.map(m => {
                const isPassing = institution ? m.nota >= institution.nota_minima_aprobacion : true;
                return (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="py-3 font-semibold text-gray-900">{getSubjectName(m.materia_id)}</td>
                    <td className="py-3 text-gray-600">{m.tipo_evaluacion}</td>
                    <td className="py-3 text-gray-500">{m.periodo}</td>
                    <td className="py-3 text-right">
                      <span
                        className={`font-bold text-base px-2.5 py-0.5 rounded ${
                          isPassing ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
                        }`}
                      >
                        {m.nota.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </TableBody>
          </TableWrapper>
        )}
      </Card>
    </div>
  );
};
