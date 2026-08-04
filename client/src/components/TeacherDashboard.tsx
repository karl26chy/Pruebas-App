import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import type { Message, Evaluation } from '../types';
import { 
  CheckSquare, Award, AlertTriangle, Send, Mail, Inbox, Calendar,
  FileText, FileSpreadsheet, Reply, Plus, Trash2, Edit3, ClipboardList
} from 'lucide-react';
import { exportToPDF, exportToExcel } from '../services/export';

export const TeacherDashboard: React.FC = () => {
  const { 
    user, grades, subjects, assignments, studentGrades, 
    users, citations, messages, evaluations, marks, currentInstitution,
    refreshData, navigateToTab, setNavigateToTab 
  } = useApp();

  const [selectedAssignId, setSelectedAssignId] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'marks' | 'evaluations' | 'citations' | 'messages'>('attendance');

  // Attendance
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attRecords, setAttRecords] = useState<{ [studentId: string]: 'presente' | 'ausente' | 'tardanza' }>({});

  // Marks
  const [selectedEvalId, setSelectedEvalId] = useState('');
  const [markRecords, setMarkRecords] = useState<{ [studentId: string]: number }>({});

  // Evaluations CRUD
  const [evalNombre, setEvalNombre] = useState('');
  const [evalFecha, setEvalFecha] = useState('');
  const [evalPorcentaje, setEvalPorcentaje] = useState(10);
  const [evalPeriodo, setEvalPeriodo] = useState('Periodo 1');
  const [editingEvalId, setEditingEvalId] = useState<string | null>(null);

  // Citations
  const [citStudentId, setCitStudentId] = useState('');
  const [citDate, setCitDate] = useState('');
  const [citReason, setCitReason] = useState('');

  // Messages
  const [msgStudentId, setMsgStudentId] = useState('');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgReplyTo, setMsgReplyTo] = useState<Message | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (navigateToTab && typeof navigateToTab === 'string') {
      setActiveSubTab(navigateToTab as typeof activeSubTab);
      setNavigateToTab(null);
    }
  }, [navigateToTab, setNavigateToTab]);

  const unreadIncoming = messages.filter(m => m.destinatario_id === user?.id && !m.leido).length;

  const teacherAssignments = assignments.filter(a => a.profesor_id === user?.id);
  const activeAssignment = teacherAssignments.find(a => a.id === selectedAssignId);
  const activeGrade = activeAssignment ? grades.find(g => g.id === activeAssignment.grado_id) : null;
  const activeSubject = activeAssignment ? subjects.find(s => s.id === activeAssignment.materia_id) : null;

  const enrolledStudentIds = activeGrade 
    ? studentGrades.filter(sg => sg.grado_id === activeGrade.id).map(sg => sg.estudiante_id) : [];

  const gradeStudents = users.filter(u => enrolledStudentIds.includes(u.id) && u.activo);

  const getSubjectName = (subjId: string) => subjects.find(s => s.id === subjId)?.nombre || 'Materia';
  const getGradeName = (gradeId: string) => {
    const g = grades.find(g => g.id === gradeId);
    return g ? `${g.nombre} "${g.tipo_grado}"` : 'Grado';
  };
  const getStudentName = (studId: string) => {
    const s = users.find(u => u.id === studId);
    return s ? `${s.nombre} ${s.apellido}` : 'Estudiante';
  };

  const teacherMessages = messages.filter(
    m => m.remitente_id === user?.id || m.destinatario_id === user?.id
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Filter evaluations for the active assignment
  const activeEvals = evaluations.filter(e => 
    activeAssignment && e.materia_id === activeAssignment.materia_id && e.grado_id === activeAssignment.grado_id
  );

  // Marks: existing records for the selected evaluation + scale by institution
  const notaMax = currentInstitution?.tipo === 'universidad' ? 5 : 10;
  const existingMarksForEval = marks.filter(m =>
    selectedEvalId && m.evaluacion_id === selectedEvalId
  );
  const savedMarksByStudent: { [studentId: string]: number } = {};
  existingMarksForEval.forEach(m => { savedMarksByStudent[m.estudiante_id] = m.nota; });
  const getMarkValue = (studentId: string): number =>
    markRecords[studentId] ?? savedMarksByStudent[studentId] ?? 0;

  // Attendance
  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignment || !user) return;
    try {
      await Promise.all(gradeStudents.map(student => 
        api.createAttendance({
          estudiante_id: student.id,
          materia_id: activeAssignment.materia_id,
          grado_id: activeAssignment.grado_id,
          fecha: attDate,
          estado: attRecords[student.id] || 'presente',
          registrado_por: user.id
        })
      ));
      await refreshData();
      alert('Asistencia registrada con éxito');
    } catch { alert('Error al registrar asistencia'); }
  };

  // Evaluations CRUD
  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalNombre || !evalFecha || !activeAssignment || !user) return;
    try {
      const data = {
        institucion_id: activeAssignment.institucion_id,
        materia_id: activeAssignment.materia_id,
        grado_id: activeAssignment.grado_id,
        nombre: evalNombre,
        fecha_evaluacion: evalFecha,
        porcentaje: Number(evalPorcentaje),
        periodo: evalPeriodo,
        creado_por: user.id
      };
      if (editingEvalId) {
        await api.updateEvaluation(editingEvalId, data);
      } else {
        await api.createEvaluation(data);
      }
      setEvalNombre(''); setEvalFecha(''); setEvalPorcentaje(10); setEditingEvalId(null);
      await refreshData();
      alert(editingEvalId ? 'Evaluación actualizada' : 'Evaluación creada');
    } catch { alert('Error al guardar evaluación'); }
  };

  const handleEditEvaluation = (ev: Evaluation) => {
    setEditingEvalId(ev.id);
    setEvalNombre(ev.nombre);
    setEvalFecha(ev.fecha_evaluacion);
    setEvalPorcentaje(ev.porcentaje);
    setEvalPeriodo(ev.periodo);
  };

  const handleDeleteEvaluation = async (id: string) => {
    if (!confirm('¿Eliminar esta evaluación?')) return;
    try {
      await api.deleteEvaluation(id);
      await refreshData();
    } catch { alert('Error al eliminar'); }
  };

  const cancelEditEval = () => {
    setEditingEvalId(null);
    setEvalNombre(''); setEvalFecha(''); setEvalPorcentaje(10);
  };

  // Marks - using evaluation (upsert: actualiza si ya existe la nota del estudiante en esa evaluación)
  const handleSaveMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignment || !user || !selectedEvalId) return;
    const selectedEval = evaluations.find(ev => ev.id === selectedEvalId);
    const existingByStudent: { [studentId: string]: { id: string } } = {};
    existingMarksForEval.forEach(m => { existingByStudent[m.estudiante_id] = m; });
    try {
      await Promise.all(gradeStudents.map(async student => {
        const score = getMarkValue(student.id);
        const data = {
          estudiante_id: student.id,
          materia_id: activeAssignment.materia_id,
          grado_id: activeAssignment.grado_id,
          evaluacion_id: selectedEvalId,
          tipo_evaluacion: selectedEval?.nombre || '',
          fecha_evaluacion: selectedEval?.fecha_evaluacion || '',
          porcentaje: selectedEval?.porcentaje || 0,
          nota: Number(score),
          periodo: selectedEval?.periodo || 'Periodo 1',
          registrado_por: user.id
        };
        const existing = existingByStudent[student.id];
        if (existing) {
          await api.updateMark(existing.id, data);
        } else {
          await api.createMark(data);
        }
      }));
      await refreshData();
      alert('Notas registradas con éxito');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al registrar notas');
    }
  };

  // Citations
  const handleSaveCitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citStudentId || !citDate || !citReason || !activeAssignment || !user) return;
    try {
      await api.createCitation({
        estudiante_id: citStudentId,
        materia_id: activeAssignment.materia_id,
        fecha_citacion: new Date(citDate).toISOString(),
        motivo: citReason,
        estado: 'pendiente',
        creado_por: user.id
      });
      setCitStudentId(''); setCitDate(''); setCitReason('');
      await refreshData();
      alert('Citación enviada');
    } catch { alert('Error al enviar citación'); }
  };

  const markAsRead = async (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (msg && !msg.leido && msg.destinatario_id === user?.id) {
      await api.updateMessage(msgId, { leido: true });
      await refreshData();
    }
  };

  const handleReply = (msg: Message) => {
    const senderIsStudent = msg.remitente_id !== user?.id;
    setMsgReplyTo(msg);
    setMsgStudentId(senderIsStudent ? msg.remitente_id : msg.destinatario_id);
    setMsgSubject(msg.asunto.startsWith('Re: ') ? msg.asunto : `Re: ${msg.asunto}`);
    setMsgBody('');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgStudentId || !msgSubject || !msgBody || !user) return;
    try {
      await api.createMessage({
        remitente_id: user.id,
        destinatario_id: msgStudentId,
        materia_id: activeAssignment?.materia_id || null,
        asunto: msgSubject,
        cuerpo: msgBody,
        leido: false,
        created_at: new Date().toISOString()
      });
      setMsgStudentId(''); setMsgSubject(''); setMsgBody(''); setMsgReplyTo(null);
      await refreshData();
      alert('Mensaje enviado');
    } catch { alert('Error al enviar mensaje'); }
  };

  const cancelReply = () => {
    setMsgReplyTo(null); setMsgStudentId(''); setMsgSubject(''); setMsgBody('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Panel del Docente</h2>
        <p className="text-gray-500 text-sm">Gestiona tus clases, evaluaciones, asistencia, notas y comunicación.</p>
      </div>

      {/* Class Selector */}
      <div className="bg-white shadow-sm border border-gray-200 p-5 rounded-2xl">
        <label className="block text-xs font-semibold uppercase tracking-wider text-q10-600 mb-2">
          Selecciona tu Materia y Grado
        </label>
        {teacherAssignments.length === 0 ? (
          <p className="text-sm text-gray-500">No tienes materias asignadas.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {teacherAssignments.map(a => (
              <button
                key={a.id}
                onClick={() => { setSelectedAssignId(a.id); setAttRecords({}); setMarkRecords({}); }}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedAssignId === a.id
                    ? 'bg-q10-50 border-q10-500 text-q10-500'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800'
                }`}
              >
                <span className="font-bold block text-gray-900 text-base">{getSubjectName(a.materia_id)}</span>
                <span className="text-xs mt-1 block font-medium">Grado: {getGradeName(a.grado_id)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedAssignId && (
        <div className="space-y-6 animate-fade-in">
          {/* Sub Navigation */}
          <div className="flex border-b border-gray-200 gap-1.5 overflow-x-auto">
            <button onClick={() => setActiveSubTab('attendance')} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all shrink-0 ${activeSubTab === 'attendance' ? 'border-q10-500 text-q10-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              <CheckSquare className="h-4 w-4" /> Asistencia
            </button>
            <button onClick={() => setActiveSubTab('evaluations')} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all shrink-0 ${activeSubTab === 'evaluations' ? 'border-q10-500 text-q10-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              <ClipboardList className="h-4 w-4" /> Evaluaciones
            </button>
            <button onClick={() => setActiveSubTab('marks')} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all shrink-0 ${activeSubTab === 'marks' ? 'border-q10-500 text-q10-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              <Award className="h-4 w-4" /> Notas
            </button>
            <button onClick={() => setActiveSubTab('citations')} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all shrink-0 ${activeSubTab === 'citations' ? 'border-q10-500 text-q10-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              <AlertTriangle className="h-4 w-4" /> Citaciones
            </button>
            <button onClick={() => setActiveSubTab('messages')} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all shrink-0 ${activeSubTab === 'messages' ? 'border-q10-500 text-q10-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              <Mail className="h-4 w-4" /> Mensajería
              {unreadIncoming > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadIncoming}</span>}
            </button>
          </div>

          {/* Attendance */}
          {activeSubTab === 'attendance' && (
            <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-lg font-bold text-gray-900">
                  Asistencia - {activeSubject?.nombre} ({activeGrade?.nombre})
                </h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => exportToPDF({ title: `Asistencia ${activeSubject?.nombre}`, headers: ['Estudiante', 'Estado'], rows: gradeStudents.map(s => [`${s.nombre} ${s.apellido}`, attRecords[s.id] || 'presente']), fileName: `asistencia_${activeSubject?.nombre?.toLowerCase().replace(/\s+/g, '_')}` })} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium transition-colors">
                    <FileText className="h-3.5 w-3.5" /> PDF
                  </button>
                  <button onClick={() => exportToExcel({ title: `Asistencia ${activeSubject?.nombre}`, headers: ['Estudiante', 'Estado'], rows: gradeStudents.map(s => [`${s.nombre} ${s.apellido}`, attRecords[s.id] || 'presente']), fileName: `asistencia_${activeSubject?.nombre?.toLowerCase().replace(/\s+/g, '_')}` })} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium transition-colors">
                    <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
                  </button>
                  <span className="text-xs text-gray-500 font-medium">Fecha:</span>
                  <input type="date" value={attDate} onChange={e => setAttDate(e.target.value)} className="bg-white border border-gray-200 rounded-lg text-sm text-gray-900 px-3 py-1.5 focus:outline-none" />
                </div>
              </div>
              {gradeStudents.length === 0 ? (
                <p className="text-gray-500 text-sm py-4">No hay estudiantes matriculados.</p>
              ) : (
                <form onSubmit={handleSaveAttendance} className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500 text-xs font-semibold uppercase">
                          <th className="pb-3">Estudiante</th>
                          <th className="pb-3 text-center">Presente</th>
                          <th className="pb-3 text-center">Ausente</th>
                          <th className="pb-3 text-center">Tardanza</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                        {gradeStudents.map(student => {
                          const currentVal = attRecords[student.id] || 'presente';
                          return (
                            <tr key={student.id} className="hover:bg-gray-50">
                              <td className="py-3.5 font-medium text-gray-900">{student.nombre} {student.apellido}</td>
                              <td className="py-3.5 text-center">
                                <input type="radio" name={`att-${student.id}`} checked={currentVal === 'presente'} onChange={() => setAttRecords(prev => ({ ...prev, [student.id]: 'presente' }))} className="h-4 w-4 text-q10-600 focus:ring-q10-500 bg-white border-gray-300" />
                              </td>
                              <td className="py-3.5 text-center">
                                <input type="radio" name={`att-${student.id}`} checked={currentVal === 'ausente'} onChange={() => setAttRecords(prev => ({ ...prev, [student.id]: 'ausente' }))} className="h-4 w-4 text-q10-600 focus:ring-q10-500 bg-white border-gray-300" />
                              </td>
                              <td className="py-3.5 text-center">
                                <input type="radio" name={`att-${student.id}`} checked={currentVal === 'tardanza'} onChange={() => setAttRecords(prev => ({ ...prev, [student.id]: 'tardanza' }))} className="h-4 w-4 text-q10-600 focus:ring-q10-500 bg-white border-gray-300" />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end pt-4">
                    <button type="submit" className="px-6 py-2.5 bg-q10-600 hover:bg-q10-700 text-white font-semibold rounded-xl text-sm transition-colors">Guardar Asistencia</button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Evaluations CRUD */}
          {activeSubTab === 'evaluations' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl h-fit">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  {editingEvalId ? <Edit3 className="h-5 w-5 text-q10-600" /> : <Plus className="h-5 w-5 text-q10-600" />}
                  {editingEvalId ? 'Editar Evaluación' : 'Crear Evaluación'}
                </h3>
                <form onSubmit={handleSaveEvaluation} className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Nombre de la Evaluación</label>
                    <input type="text" required value={evalNombre} onChange={e => setEvalNombre(e.target.value)} placeholder="Ej: Proyecto Final, Examen Parcial, Tarea 1" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Fecha de Evaluación</label>
                      <input type="date" required value={evalFecha} onChange={e => setEvalFecha(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Porcentaje (%)</label>
                      <input type="number" min="1" max="100" required value={evalPorcentaje} onChange={e => setEvalPorcentaje(Number(e.target.value))} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Periodo</label>
                    <input type="text" value={evalPeriodo} onChange={e => setEvalPeriodo(e.target.value)} placeholder="Periodo 1, Bimestre I..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 py-2.5 bg-q10-600 hover:bg-q10-700 text-white font-semibold rounded-xl text-sm transition-colors">
                      {editingEvalId ? 'Actualizar' : 'Guardar Evaluación'}
                    </button>
                    {editingEvalId && (
                      <button type="button" onClick={cancelEditEval} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-xl text-sm transition-colors">Cancelar</button>
                    )}
                  </div>
                </form>
              </div>
              <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Evaluaciones Creadas</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {activeEvals.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4 text-center">No hay evaluaciones para esta materia/grado.</p>
                  ) : (
                    activeEvals.map(ev => (
                      <div key={ev.id} className="p-4 bg-white border border-gray-200 rounded-xl space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-semibold text-gray-900 text-sm block">{ev.nombre}</span>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {ev.fecha_evaluacion}</span>
                              <span className="px-1.5 py-0.5 rounded bg-q10-50 text-q10-600 font-semibold">{ev.porcentaje}%</span>
                              <span className="text-gray-400">{ev.periodo}</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => handleEditEvaluation(ev)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-q10-600 transition-colors"><Edit3 className="h-4 w-4" /></button>
                            <button onClick={() => handleDeleteEvaluation(ev.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Marks */}
          {activeSubTab === 'marks' && (
            <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">
                  Calificaciones - {activeSubject?.nombre} ({activeGrade?.nombre})
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => exportToPDF({ title: `Notas ${activeSubject?.nombre}`, headers: ['Estudiante', 'Nota'], rows: gradeStudents.map(s => [`${s.nombre} ${s.apellido}`, getMarkValue(s.id)]), fileName: `notas_${activeSubject?.nombre?.toLowerCase().replace(/\s+/g, '_')}` })} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium transition-colors">
                    <FileText className="h-3.5 w-3.5" /> PDF
                  </button>
                  <button onClick={() => exportToExcel({ title: `Notas ${activeSubject?.nombre}`, headers: ['Estudiante', 'Nota'], rows: gradeStudents.map(s => [`${s.nombre} ${s.apellido}`, getMarkValue(s.id)]), fileName: `notas_${activeSubject?.nombre?.toLowerCase().replace(/\s+/g, '_')}` })} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium transition-colors">
                    <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
                  </button>
                </div>
              </div>

              {/* Evaluation Selector */}
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <label className="block text-xs font-semibold text-gray-500 mb-2">Seleccionar Evaluación para Calificar</label>
                <select
                  required
                  value={selectedEvalId}
                  onChange={e => { setSelectedEvalId(e.target.value); setMarkRecords({}); }}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none"
                >
                  <option value="">-- Seleccionar Evaluación --</option>
                  {activeEvals.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.nombre} ({ev.fecha_evaluacion}) - {ev.porcentaje}% - {ev.periodo}
                    </option>
                  ))}
                </select>
              </div>

              {gradeStudents.length === 0 ? (
                <p className="text-gray-500 text-sm py-4">No hay estudiantes matriculados.</p>
              ) : !selectedEvalId ? (
                <p className="text-gray-500 text-sm py-4 text-center">Selecciona una evaluación para comenzar a calificar.</p>
              ) : (
                <form onSubmit={handleSaveMarks} className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500 text-xs font-semibold uppercase">
                          <th className="pb-3">Estudiante</th>
                          <th className="pb-3 w-40 text-right">Calificación</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                        {gradeStudents.map(student => {
                          const val = markRecords[student.id] ?? savedMarksByStudent[student.id] ?? '';
                          return (
                            <tr key={student.id} className="hover:bg-gray-50">
                              <td className="py-3.5 font-medium text-gray-900">{student.nombre} {student.apellido}</td>
                              <td className="py-2 text-right">
                                <input
                                  type="number" step="0.1" min="0" max={notaMax} required
                                  value={val}
                                  onChange={e => setMarkRecords(prev => ({ ...prev, [student.id]: Number(e.target.value) }))}
                                  placeholder="0.0"
                                  className="w-24 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-900 text-right text-sm focus:outline-none focus:ring-1 focus:ring-q10-500"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end pt-4">
                    <button type="submit" className="px-6 py-2.5 bg-q10-600 hover:bg-q10-700 text-white font-semibold rounded-xl text-sm transition-colors">Guardar Calificaciones</button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Citations */}
          {activeSubTab === 'citations' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl h-fit">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Crear Citación</h3>
                <form onSubmit={handleSaveCitation} className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Estudiante</label>
                    <select required value={citStudentId} onChange={e => setCitStudentId(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none">
                      <option value="">-- Seleccionar --</option>
                      {gradeStudents.map(s => <option key={s.id} value={s.id}>{s.nombre} {s.apellido}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Fecha y Hora</label>
                    <input type="datetime-local" required value={citDate} onChange={e => setCitDate(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Motivo</label>
                    <textarea required rows={3} value={citReason} onChange={e => setCitReason(e.target.value)} placeholder="Detalle del motivo..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none" />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-q10-600 hover:bg-q10-700 text-white font-semibold rounded-xl text-sm transition-colors">Enviar Citación</button>
                </form>
              </div>
              <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Citaciones Enviadas</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {citations.filter(c => c.creado_por === user?.id).map(cit => (
                    <div key={cit.id} className="p-4 bg-white border border-gray-200 rounded-xl space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-gray-900 text-sm">{getStudentName(cit.estudiante_id)}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${cit.estado === 'pendiente' ? 'bg-amber-100 text-amber-500' : 'bg-emerald-100 text-emerald-500'}`}>{cit.estado}</span>
                      </div>
                      <p className="text-xs text-gray-500">{cit.motivo}</p>
                      <div className="text-[10px] text-gray-400 flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(cit.fecha_citacion).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {activeSubTab === 'messages' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl h-fit">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  {msgReplyTo ? <Reply className="h-4 w-4 text-q10-600" /> : <Send className="h-4 w-4 text-q10-600" />}
                  {msgReplyTo ? 'Responder Mensaje' : 'Enviar Mensaje'}
                </h3>
                {msgReplyTo && (
                  <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">Respondiendo a:</span>
                    <div className="mt-1">{getStudentName(msgReplyTo.remitente_id)}</div>
                    <div className="font-medium text-gray-700">{msgReplyTo.asunto}</div>
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Destinatario</label>
                    <select required value={msgStudentId} onChange={e => setMsgStudentId(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none">
                      <option value="">-- Seleccionar --</option>
                      {gradeStudents.map(s => <option key={s.id} value={s.id}>{s.nombre} {s.apellido}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Asunto</label>
                    <input type="text" required value={msgSubject} onChange={e => setMsgSubject(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Mensaje</label>
                    <textarea required rows={4} value={msgBody} onChange={e => setMsgBody(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 py-2.5 bg-q10-600 hover:bg-q10-700 text-white font-semibold rounded-xl text-sm transition-colors">{msgReplyTo ? 'Responder' : 'Enviar'}</button>
                    {msgReplyTo && <button type="button" onClick={cancelReply} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-xl text-sm transition-colors">Cancelar</button>}
                  </div>
                </form>
              </div>
              <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Inbox className="h-5 w-5 text-q10-600" /> Conversaciones</h3>
                  {unreadIncoming > 0 && <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-1 rounded-full">{unreadIncoming} no leído{unreadIncoming !== 1 ? 's' : ''}</span>}
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {teacherMessages.length === 0 ? <p className="text-gray-500 text-xs py-4 text-center">Sin mensajes.</p> : teacherMessages.map(msg => {
                    const isSender = msg.remitente_id === user?.id;
                    const isUnread = !isSender && !msg.leido;
                    return (
                      <div key={msg.id} onClick={() => { setSelectedMessage(msg); if (!isSender) markAsRead(msg.id); }} className={`p-4 rounded-xl border text-xs space-y-1.5 transition-all cursor-pointer ${isUnread ? 'bg-q10-50 border-q10-300 text-q10-700' : isSender ? 'bg-white border-gray-200 text-gray-600' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                        <div className="flex justify-between items-start font-semibold">
                          <span className="flex items-center gap-1.5">{isUnread && <span className="w-2 h-2 bg-q10-600 rounded-full" />}{isSender ? `Tú → ${getStudentName(msg.destinatario_id)}` : getStudentName(msg.remitente_id)}</span>
                          <span className="text-[10px] text-gray-400">{new Date(msg.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="font-bold text-gray-900">{msg.asunto}</div>
                        <p className="text-gray-500 mt-1 truncate">{msg.cuerpo}</p>
                        <div className="flex justify-end pt-1"><button onClick={(e) => { e.stopPropagation(); handleReply(msg); }} className="flex items-center gap-1 text-q10-600 hover:text-q10-700 text-[10px] font-semibold"><Reply className="h-3 w-3" /> Responder</button></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Message Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedMessage(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedMessage.asunto}</h3>
                <p className="text-xs text-gray-500 mt-1">{selectedMessage.remitente_id === user?.id ? `Para: ${getStudentName(selectedMessage.destinatario_id)}` : `De: ${getStudentName(selectedMessage.remitente_id)}`} · {new Date(selectedMessage.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setSelectedMessage(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedMessage.cuerpo}</p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { handleReply(selectedMessage); setSelectedMessage(null); }} className="flex items-center gap-1.5 px-4 py-2 bg-q10-600 hover:bg-q10-700 text-white font-semibold rounded-xl text-xs transition-colors"><Reply className="h-3.5 w-3.5" /> Responder</button>
              <button onClick={() => setSelectedMessage(null)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-xl text-xs transition-colors">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};