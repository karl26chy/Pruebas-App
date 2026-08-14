import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, FileText, Loader2, ShieldAlert } from 'lucide-react';
import { api } from '../../../services/api';
import { useApp } from '../../../context/useApp';
import { periodLabel } from '../../../lib/periods';
import { gradeLabel, fullName } from '../../../lib/people';
import { getTemplate, resolveConfig } from '../../../lib/reports/registry';
import { Modal, Field, INPUT } from '../../ui';
import type { AcademicPeriod, User } from '../../../types';

interface BoletinModalProps {
  student: User;
  onClose: () => void;
}

/** Generación de un boletín individual: selección de período, confirmación y
 *  formato PDF/Excel. No descarga nada al abrir el modal. */
export const BoletinModal: React.FC<BoletinModalProps> = ({ student, onClose }) => {
  const { user, grades, studentGrades } = useApp();
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [periodId, setPeriodId] = useState('');
  const [busy, setBusy] = useState<'pdf' | 'excel' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const instId = user?.institucion_id;

  useEffect(() => {
    let activo = true;
    if (instId) {
      api.getAcademicPeriods()
        .then(list => {
          if (!activo) return;
          const propios = list
            .filter(p => p.institucion_id === instId)
            .sort((a, b) => (Number(b.anio) - Number(a.anio)) || (Number(a.numero) - Number(b.numero)));
          setPeriods(propios);
          setPeriodId(prev => prev || propios.find(p => p.activo)?.id || propios[0]?.id || '');
        })
        .catch(() => setError('No se pudieron cargar los períodos.'));
    }
    return () => { activo = false; };
  }, [instId]);

  const selectedPeriod = periods.find(p => p.id === periodId) || null;
  const grade = studentGrades.find(sg => sg.estudiante_id === student.id);
  const gradeNombre = grade ? gradeLabel(grades.find(g => g.id === grade.grado_id)) : 'Sin asignar';

  const generar = async (format: 'pdf' | 'excel') => {
    if (!periodId) return setError('Selecciona un período académico.');
    setBusy(format);
    setError(null);
    try {
      const data = await api.getStudentReport(student.id, periodId);
      const template = getTemplate(data);
      const config = resolveConfig(data);
      if (format === 'pdf') template.renderPDF(data, config);
      else template.renderExcel(data, config);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el boletín.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal onClose={onClose} size="lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Generar Boletín</h3>
        <span className="text-xs text-gray-400">Documento individual por período</span>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 mb-5">
        <p className="text-sm text-gray-500">
          Estudiante: <span className="font-bold text-gray-900">{fullName(student)}</span>
        </p>
        <p className="text-sm text-gray-500">
          Identificación: <span className="font-medium text-gray-700">{student.identificacion || 'N/R'}</span>
        </p>
        <p className="text-sm text-gray-500">
          Grado: <span className="font-medium text-gray-700">{gradeNombre}</span>
        </p>
      </div>

      {periods.length === 0 ? (
        <p className="text-sm text-amber-600">
          Esta institución aún no tiene períodos académicos. Crea uno en la sección Periodos.
        </p>
      ) : (
        <Field label="Seleccionar período" className="mb-5">
          <select value={periodId} onChange={e => setPeriodId(e.target.value)} className={INPUT}>
            {periods.map(p => (
              <option key={p.id} value={p.id}>
                {periodLabel(p)}
              </option>
            ))}
          </select>
        </Field>
      )}

      {selectedPeriod && (
        <p className="text-sm text-gray-600 mb-5">
          ¿Estás seguro de que deseas descargar el boletín de{' '}
          <strong>{fullName(student)}</strong> correspondiente al{' '}
          <strong>{periodLabel(selectedPeriod)}</strong>?
        </p>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 mb-5">
          <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-sm"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={!periodId || busy !== null}
          onClick={() => generar('pdf')}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-q10-600 hover:bg-q10-700 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          Descargar PDF
        </button>
        <button
          type="button"
          disabled={!periodId || busy !== null}
          onClick={() => generar('excel')}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy === 'excel' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
          Descargar Excel
        </button>
      </div>
    </Modal>
  );
};
