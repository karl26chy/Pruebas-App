import React, { useState } from 'react';
import { Plus, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { api } from '../../../services/api';
import { Card, CardTitle, INPUT_LARGE, TableWrapper, TableHead, TableBody } from '../../ui';
import { DeleteInstitutionModal } from './DeleteInstitutionModal';
import type { Institution } from '../../../types';
import type { Feedback } from './useSuperAdmin';

interface InstitutionsTabProps {
  institutions: Institution[];
  showMsg: (type: Feedback['type'], text: string) => void;
  onChanged: () => Promise<void>;
}

/** Alta de instituciones y activación/desactivación de las existentes. */
export const InstitutionsTab: React.FC<InstitutionsTabProps> = ({
  institutions, showMsg, onChanged,
}) => {
  const [nombre, setNombre] = useState('');
  const [subdominio, setSubdominio] = useState('');
  const [tipo, setTipo] = useState<'colegio' | 'universidad'>('colegio');
  const [notaMinima, setNotaMinima] = useState(6.0);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<Institution | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !subdominio) return;

    const exists = institutions.some(i => i.subdominio.toLowerCase() === subdominio.toLowerCase());
    if (exists) {
      showMsg('error', 'El subdominio ya existe.');
      return;
    }

    try {
      setLoading(true);
      await api.createInstitution({
        nombre,
        subdominio: subdominio.toLowerCase().replace(/[^a-z0-9]/g, ''),
        tipo,
        nota_minima_aprobacion: Number(notaMinima),
        activa: true,
      });
      setNombre('');
      setSubdominio('');
      setNotaMinima(tipo === 'colegio' ? 6.0 : 3.0);
      showMsg('success', 'Institución creada.');
      await onChanged();
    } catch {
      showMsg('error', 'Error al crear institución.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (inst: Institution) => {
    try {
      await api.updateInstitution(inst.id, { ...inst, activa: !inst.activa });
      await onChanged();
      showMsg('success', `Estado de ${inst.nombre} actualizado.`);
    } catch {
      showMsg('error', 'No se pudo actualizar.');
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await api.deleteInstitution(deleting.id);
      setDeleting(null);
      showMsg('success', `Institución "${deleting.nombre}" eliminada.`);
      await onChanged();
    } catch (err) {
      setDeleting(null);
      showMsg('error', err instanceof Error ? err.message : 'Error al eliminar institución.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="h-fit">
        <CardTitle icon={<Plus className="h-5 w-5 text-q10-600" />} className="mb-6">
          Crear Institución
        </CardTitle>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
            <input
              type="text" required value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Colegio San Ignacio" className={INPUT_LARGE}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Subdominio</label>
            <div className="relative">
              <input
                type="text" required value={subdominio} onChange={e => setSubdominio(e.target.value)}
                placeholder="colegiosanignacio"
                className="w-full pl-4 pr-32 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-q10-500/50"
              />
              <span className="absolute right-3 top-2.5 text-xs text-gray-500 font-semibold">
                .plataforma.com
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
            <select
              value={tipo}
              onChange={e => {
                const v = e.target.value as 'colegio' | 'universidad';
                setTipo(v);
                setNotaMinima(v === 'colegio' ? 6.0 : 3.0);
              }}
              className={INPUT_LARGE}
            >
              <option value="colegio">Colegio (1-10)</option>
              <option value="universidad">Universidad (1-5)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Nota Mínima ({tipo === 'colegio' ? '1-10' : '1-5'})
            </label>
            <input
              type="number" step="0.1" min="1" max={tipo === 'colegio' ? '10' : '5'} required
              value={notaMinima} onChange={e => setNotaMinima(Number(e.target.value))}
              className={INPUT_LARGE}
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-3 bg-q10-600 hover:bg-q10-700 text-white font-semibold rounded-xl transition-colors mt-2"
          >
            {loading ? 'Creando...' : 'Guardar Institución'}
          </button>
        </form>
      </Card>

      <Card className="lg:col-span-2">
        <CardTitle className="mb-6">Instituciones Registradas</CardTitle>
        <TableWrapper>
          <TableHead uppercase>
            <th className="pb-3">Nombre</th>
            <th className="pb-3">Subdominio</th>
            <th className="pb-3 text-center">Tipo</th>
            <th className="pb-3 text-center">Nota Mín.</th>
            <th className="pb-3 text-center">Estado</th>
            <th className="pb-3 text-right">Acción</th>
          </TableHead>
          <TableBody>
            {institutions.map(inst => (
              <tr key={inst.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3.5 font-medium text-gray-900">{inst.nombre}</td>
                <td className="py-3.5 text-gray-500">{inst.subdominio}.plataforma.com</td>
                <td className="py-3.5 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${
                    inst.tipo === 'universidad' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {inst.tipo}
                  </span>
                </td>
                <td className="py-3.5 text-center text-gray-600 font-semibold">
                  {inst.nota_minima_aprobacion.toFixed(1)}
                </td>
                <td className="py-3.5 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                    inst.activa ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {inst.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => toggleStatus(inst)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors border ${
                        inst.activa
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200'
                      }`}
                    >
                      {inst.activa
                        ? <><ToggleLeft className="h-4 w-4" /> Desactivar</>
                        : <><ToggleRight className="h-4 w-4" /> Activar</>}
                    </button>
                    <button
                      onClick={() => setDeleting(inst)} title="Eliminar institución"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </TableBody>
        </TableWrapper>
      </Card>

      {deleting && (
        <DeleteInstitutionModal
          institution={deleting}
          onCancel={() => setDeleting(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
};
