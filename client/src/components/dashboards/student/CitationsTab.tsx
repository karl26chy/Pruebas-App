import React from 'react';
import { Calendar } from 'lucide-react';
import { Card, CardTitle, EmptyMessage } from '../../ui';
import type { Citation } from '../../../types';

interface CitationsTabProps {
  citations: Citation[];
  getTeacherName: (teacherId: string) => string;
}

/** Citaciones académicas recibidas por el estudiante. */
export const CitationsTab: React.FC<CitationsTabProps> = ({ citations, getTeacherName }) => (
  <Card className="animate-fade-in">
    <CardTitle className="mb-6">Mis Citaciones Académicas</CardTitle>

    {citations.length === 0 ? (
      <EmptyMessage className="text-gray-500 text-sm py-4">
        No tienes citaciones registradas. ¡Buen trabajo!
      </EmptyMessage>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {citations.map(cit => (
          <div
            key={cit.id}
            className={`p-5 rounded-xl border space-y-2.5 ${
              cit.estado === 'pendiente' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900 text-sm">
                Citado por: {getTeacherName(cit.creado_por)}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                  cit.estado === 'pendiente' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {cit.estado}
              </span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{cit.motivo}</p>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-semibold pt-1 border-t border-gray-100">
              <Calendar className="h-3.5 w-3.5" />
              Agendada para: {new Date(cit.fecha_citacion).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    )}
  </Card>
);
