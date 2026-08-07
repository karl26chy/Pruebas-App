import React, { useState } from 'react';
import { Calendar, Edit3, Plus, Trash2 } from 'lucide-react';
import { api } from '../../../services/api';
import { Card, CardTitle, EmptyMessage, Field, INPUT, PRIMARY_BUTTON, SECONDARY_BUTTON } from '../../ui';
import type { Assignment, Evaluation } from '../../../types';

interface EvaluationsTabProps {
  assignment: Assignment;
  evaluations: Evaluation[];
  teacherId: string;
  onSaved: () => Promise<void>;
}

const VACIO = { nombre: '', fecha: '', porcentaje: 10, periodo: 'Periodo 1' };

/** Alta, edición y borrado de las evaluaciones de la clase activa. */
export const EvaluationsTab: React.FC<EvaluationsTabProps> = ({
  assignment, evaluations, teacherId, onSaved,
}) => {
  const [form, setForm] = useState(VACIO);
  const [editingId, setEditingId] = useState<string | null>(null);

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ ...VACIO, periodo: form.periodo });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.fecha) return;
    try {
      const data = {
        institucion_id: assignment.institucion_id,
        materia_id: assignment.materia_id,
        grado_id: assignment.grado_id,
        nombre: form.nombre,
        fecha_evaluacion: form.fecha,
        porcentaje: Number(form.porcentaje),
        periodo: form.periodo,
        creado_por: teacherId,
      };
      if (editingId) {
        await api.updateEvaluation(editingId, data);
      } else {
        await api.createEvaluation(data);
      }
      setForm({ ...VACIO, periodo: form.periodo });
      setEditingId(null);
      await onSaved();
      alert(editingId ? 'Evaluación actualizada' : 'Evaluación creada');
    } catch {
      alert('Error al guardar evaluación');
    }
  };

  const handleEdit = (ev: Evaluation) => {
    setEditingId(ev.id);
    setForm({
      nombre: ev.nombre,
      fecha: ev.fecha_evaluacion,
      porcentaje: ev.porcentaje,
      periodo: ev.periodo,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta evaluación?')) return;
    try {
      await api.deleteEvaluation(id);
      await onSaved();
    } catch {
      alert('Error al eliminar');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="h-fit">
        <CardTitle
          icon={editingId ? <Edit3 className="h-5 w-5 text-q10-600" /> : <Plus className="h-5 w-5 text-q10-600" />}
          className="mb-6"
        >
          {editingId ? 'Editar Evaluación' : 'Crear Evaluación'}
        </CardTitle>

        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Nombre de la Evaluación">
            <input
              type="text" required value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Proyecto Final, Examen Parcial, Tarea 1"
              className={INPUT}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Fecha de Evaluación">
              <input
                type="date" required value={form.fecha}
                onChange={e => setForm({ ...form, fecha: e.target.value })}
                className={INPUT}
              />
            </Field>
            <Field label="Porcentaje (%)">
              <input
                type="number" min="1" max="100" required value={form.porcentaje}
                onChange={e => setForm({ ...form, porcentaje: Number(e.target.value) })}
                className={INPUT}
              />
            </Field>
          </div>

          <Field label="Periodo">
            <input
              type="text" value={form.periodo}
              onChange={e => setForm({ ...form, periodo: e.target.value })}
              placeholder="Periodo 1, Bimestre I..."
              className={INPUT}
            />
          </Field>

          <div className="flex gap-2">
            <button type="submit" className={`flex-1 ${PRIMARY_BUTTON}`}>
              {editingId ? 'Actualizar' : 'Guardar Evaluación'}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className={SECONDARY_BUTTON}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </Card>

      <Card>
        <CardTitle className="mb-6">Evaluaciones Creadas</CardTitle>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {evaluations.length === 0 ? (
            <EmptyMessage>No hay evaluaciones para esta materia/grado.</EmptyMessage>
          ) : (
            evaluations.map(ev => (
              <div key={ev.id} className="p-4 bg-white border border-gray-200 rounded-xl space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-gray-900 text-sm block">{ev.nombre}</span>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {ev.fecha_evaluacion}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-q10-50 text-q10-600 font-semibold">
                        {ev.porcentaje}%
                      </span>
                      <span className="text-gray-400">{ev.periodo}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(ev)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-q10-600 transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ev.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
