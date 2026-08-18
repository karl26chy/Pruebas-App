import React, { useCallback, useEffect, useState } from 'react';
import { FileSpreadsheet, FileText, Palette, RefreshCw } from 'lucide-react';
import { api } from '../../../services/api';
import { Card, CardTitle, TableWrapper, TableHead, TableBody } from '../../ui';
import { REPORT_TEMPLATE_FALLBACK } from '../../../lib/reports/template-metadata';
import type { ReportTemplateInfo } from '../../../types';
import type { Feedback } from './useSuperAdmin';

/**
 * "Formatos de boletín": catálogo de plantillas disponibles que el Super Admin
 * puede asignar a cada institución. Los templates se registran en el proyecto
 * (registry backend + renderers), se despliegan y aparecen aquí de forma
 * automática. No es un editor visual: solo exposición del catálogo.
 */
export const ReportTemplatesTab: React.FC<{
  showMsg: (type: Feedback['type'], text: string) => void;
}> = ({ showMsg }) => {
  const [templates, setTemplates] = useState<ReportTemplateInfo[] | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTemplates(await api.getReportTemplates());
    } catch {
      setTemplates(REPORT_TEMPLATE_FALLBACK);
      showMsg('error', 'No se pudo cargar el catálogo de formatos desde el servidor.');
    } finally {
      setLoading(false);
    }
  }, [showMsg]);

  useEffect(() => {
    load();
  }, [load]);

  const list = templates ?? REPORT_TEMPLATE_FALLBACK;

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <CardTitle icon={<Palette className="h-5 w-5 text-q10-600" />}>
          Formatos de Boletín
        </CardTitle>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-xs font-medium disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refrescar
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-5">
        Estos son los formatos de boletín disponibles para asignar a cada institución. Para agregar
        un formato nuevo se registra en el proyecto y queda disponible aquí automáticamente.
      </p>

      <TableWrapper>
        <TableHead uppercase>
          <th className="pb-3">Formato</th>
          <th className="pb-3">ID</th>
          <th className="pb-3">Descripción</th>
          <th className="pb-3 text-center">PDF</th>
          <th className="pb-3 text-center">Excel</th>
        </TableHead>
        <TableBody>
          {list.map(t => (
            <tr key={t.id} className="hover:bg-gray-50 transition-colors">
              <td className="py-3.5 font-medium text-gray-900">{t.name}</td>
              <td className="py-3.5">
                <code className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs">{t.id}</code>
              </td>
              <td className="py-3.5 text-gray-500">{t.description || '—'}</td>
              <td className="py-3.5 text-center">
                {t.pdf ? (
                  <FileText className="h-4 w-4 text-emerald-600 inline-block" />
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
              <td className="py-3.5 text-center">
                {t.excel ? (
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600 inline-block" />
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
            </tr>
          ))}
        </TableBody>
      </TableWrapper>
    </Card>
  );
};
