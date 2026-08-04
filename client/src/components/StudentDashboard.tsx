import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import type { Message } from '../types';
import { 
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ReferenceLine 
} from 'recharts';
import { 
  Award, CheckSquare, AlertTriangle, Mail, Send, Inbox, Calendar, ShieldAlert,
  FileText, FileSpreadsheet, Reply
} from 'lucide-react';
import { exportToPDF, exportToExcel } from '../services/export';

export const StudentDashboard: React.FC = () => {
  const { 
    user, currentInstitution, studentGrades, grades, subjects, 
    assignments, attendance, marks, citations, messages, refreshData, users,
    navigateToTab, setNavigateToTab
  } = useApp();

  const [activeTab, setActiveTab] = useState<'grades' | 'attendance' | 'citations' | 'messages'>('grades');
  const [msgTeacherId, setMsgTeacherId] = useState('');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgReplyTo, setMsgReplyTo] = useState<Message | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (navigateToTab === 'messages') {
      setActiveTab('messages');
      setNavigateToTab(null);
    }
  }, [navigateToTab, setNavigateToTab]);

  const unreadIncoming = messages.filter(
    m => m.destinatario_id === user?.id && !m.leido
  ).length;

  // 1. Get student's grade/classroom
  const myGradeLink = studentGrades.find(sg => sg.estudiante_id === user?.id);
  const myGrade = myGradeLink ? grades.find(g => g.id === myGradeLink.grado_id) : null;

  // 2. Get subjects taught in my grade (via assignments)
  const myGradeAssignments = myGrade 
    ? assignments.filter(a => a.grado_id === myGrade.id) 
    : [];

  const myTeacherIds = myGradeAssignments.map(a => a.profesor_id);
  const myTeachers = users.filter(u => myTeacherIds.includes(u.id));

  // Helper labels
  const getSubjectName = (subjId: string) => subjects.find(s => s.id === subjId)?.nombre || 'Materia';
  const getTeacherName = (tId: string) => {
    const t = users.find(u => u.id === tId);
    return t ? `${t.nombre} ${t.apellido}` : 'Docente';
  };

  // 3. Filter student's marks/grades
  const myMarks = marks.filter(m => m.estudiante_id === user?.id);

  // 4. Group marks for Recharts (X axis: Subject Name, Y axis: weighted average grade)
  const getChartData = () => {
    const dataMap: { [subjId: string]: { name: string; weighted: number; weight: number; fallback: number; count: number } } = {};

    myMarks.forEach(m => {
      if (!dataMap[m.materia_id]) {
        dataMap[m.materia_id] = { name: getSubjectName(m.materia_id), weighted: 0, weight: 0, fallback: 0, count: 0 };
      }
      const pct = m.porcentaje || 0;
      dataMap[m.materia_id].weighted += m.nota * pct;
      dataMap[m.materia_id].weight += pct;
      dataMap[m.materia_id].fallback += m.nota;
      dataMap[m.materia_id].count += 1;
    });

    return Object.keys(dataMap).map(subjId => {
      const d = dataMap[subjId];
      const avg = d.weight > 0 ? d.weighted / d.weight : (d.count ? d.fallback / d.count : 0);
      return {
        name: d.name,
        'Nota Promedio': Number(avg.toFixed(2))
      };
    });
  };

  const chartData = getChartData();

  // 5. Filter student's attendance records
  const myAttendance = attendance.filter(a => a.estudiante_id === user?.id);
  const presentCount = myAttendance.filter(a => a.estado === 'presente').length;
  const absentCount = myAttendance.filter(a => a.estado === 'ausente').length;
  const tardinessCount = myAttendance.filter(a => a.estado === 'tardanza').length;
  const presenceRate = myAttendance.length > 0 
    ? Math.round(((presentCount + tardinessCount) / myAttendance.length) * 100)
    : 100;

  // 6. Filter student's citations
  const myCitations = citations.filter(c => c.estudiante_id === user?.id);
  const pendingCitations = myCitations.filter(c => c.estado === 'pendiente');

  // 7. Filter messages with teachers
  const myMessages = messages.filter(
    m => m.remitente_id === user?.id || m.destinatario_id === user?.id
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Mark message as read
  const markAsRead = async (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (msg && !msg.leido && msg.destinatario_id === user?.id) {
      await api.updateMessage(msgId, { leido: true });
      await refreshData();
    }
  };

  // Reply to a message
  const handleReply = (msg: Message) => {
    setMsgReplyTo(msg);
    setMsgTeacherId(msg.remitente_id === user?.id ? msg.destinatario_id : msg.remitente_id);
    setMsgSubject(msg.asunto.startsWith('Re: ') ? msg.asunto : `Re: ${msg.asunto}`);
    setMsgBody('');
  };

  const cancelReply = () => {
    setMsgReplyTo(null);
    setMsgTeacherId('');
    setMsgSubject('');
    setMsgBody('');
  };

  // Message Submit
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgTeacherId || !msgSubject || !msgBody || !user) return;

    try {
      // Find matching subject if available for this teacher
      const matchingAssign = myGradeAssignments.find(a => a.profesor_id === msgTeacherId);
      const subId = matchingAssign ? matchingAssign.materia_id : null;

      await api.createMessage({
        remitente_id: user.id,
        destinatario_id: msgTeacherId,
        materia_id: subId,
        asunto: msgSubject,
        cuerpo: msgBody,
        leido: false,
        created_at: new Date().toISOString()
      });
      setMsgTeacherId('');
      setMsgSubject('');
      setMsgBody('');
      setMsgReplyTo(null);
      await refreshData();
      alert('Mensaje enviado con éxito');
    } catch {
      alert('Error al enviar mensaje');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Alerter for Pending Citations */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mi Portal Estudiantil</h2>
          <p className="text-gray-500 text-sm">
            {myGrade ? `Grado: ${myGrade.nombre} "${myGrade.tipo_grado}"` : 'No asignado a un grado aún.'}
          </p>
        </div>

        {pendingCitations.length > 0 && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 animate-pulse">
            <ShieldAlert className="h-6 w-6 text-red-600 shrink-0" />
            <div>
              <span className="font-bold text-gray-900 text-xs block">CITACIÓN PENDIENTE</span>
              <span className="text-gray-600 text-[11px] block">
                Tienes {pendingCitations.length} citación(es) oficial(es) por atender.
              </span>
            </div>
            <button
              onClick={() => setActiveTab('citations')}
              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-semibold transition-colors"
            >
              Ver
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('grades')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'grades'
              ? 'border-indigo-500 text-q10-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Award className="h-4 w-4" /> Calificaciones y Notas
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'attendance'
              ? 'border-indigo-500 text-q10-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <CheckSquare className="h-4 w-4" /> Registro de Asistencia
        </button>
        <button
          onClick={() => setActiveTab('citations')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'citations'
              ? 'border-indigo-500 text-q10-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <AlertTriangle className="h-4 w-4" /> Citaciones ({myCitations.length})
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'messages'
              ? 'border-indigo-500 text-q10-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Mail className="h-4 w-4" /> Mensajería
          {unreadIncoming > 0 && (
            <span className="ml-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unreadIncoming}
            </span>
          )}
        </button>
      </div>

      {/* Tab: Grades / Charts */}
      {activeTab === 'grades' && (
        <div className="space-y-6 animate-fade-in">
          {/* Recharts chart */}
          <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Rendimiento Académico por Materia</h3>
            {chartData.length === 0 ? (
              <p className="text-sm text-gray-500 py-6">Aún no cuentas con calificaciones registradas.</p>
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      domain={[0, currentInstitution?.tipo === 'colegio' ? 10 : 5]} 
                      tickLine={false} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px' }}
                      labelStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                    />
                    <Legend />
                    <Bar dataKey="Nota Promedio" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                    <Line type="monotone" dataKey="Nota Promedio" stroke="#818cf8" strokeWidth={2} activeDot={{ r: 6 }} />
                    {currentInstitution && (
                      <ReferenceLine 
                        y={currentInstitution.nota_minima_aprobacion} 
                        stroke="#ef4444" 
                        strokeDasharray="4 4" 
                        label={{ 
                          value: `Mínima (${currentInstitution.nota_minima_aprobacion.toFixed(1)})`, 
                          fill: '#f87171', 
                          fontSize: 10,
                          position: 'insideBottomRight'
                        }} 
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Marks List Table */}
          <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Boleta de Calificaciones Detallada</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => exportToPDF({
                    title: 'Calificaciones',
                    headers: ['Materia', 'Evaluación', 'Periodo', 'Nota'],
                    rows: myMarks.map(m => [getSubjectName(m.materia_id), m.tipo_evaluacion, m.periodo, m.nota]),
                    fileName: 'calificaciones'
                  })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" /> PDF
                </button>
                <button
                  onClick={() => exportToExcel({
                    title: 'Calificaciones',
                    headers: ['Materia', 'Evaluación', 'Periodo', 'Nota'],
                    rows: myMarks.map(m => [getSubjectName(m.materia_id), m.tipo_evaluacion, m.periodo, m.nota]),
                    fileName: 'calificaciones'
                  })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium transition-colors"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
                </button>
              </div>
            </div>
            {myMarks.length === 0 ? (
              <p className="text-gray-500 text-sm py-2">No hay calificaciones individuales guardadas.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 text-xs font-semibold">
                      <th className="pb-3">Materia</th>
                      <th className="pb-3">Evaluación</th>
                      <th className="pb-3">Periodo</th>
                      <th className="pb-3 text-right">Nota Obtenida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {myMarks.map(m => {
                      const isPassing = currentInstitution ? m.nota >= currentInstitution.nota_minima_aprobacion : true;
                      return (
                        <tr key={m.id} className="hover:bg-gray-50">
                          <td className="py-3 font-semibold text-gray-900">{getSubjectName(m.materia_id)}</td>
                          <td className="py-3 text-gray-600">{m.tipo_evaluacion}</td>
                          <td className="py-3 text-gray-500">{m.periodo}</td>
                          <td className="py-3 text-right">
                            <span className={`font-bold text-base px-2.5 py-0.5 rounded ${
                              isPassing ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
                            }`}>
                              {m.nota.toFixed(1)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Attendance */}
      {activeTab === 'attendance' && (
        <div className="space-y-6 animate-fade-in">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl">
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Tasa de Asistencia</div>
              <div className="text-3xl font-bold text-q10-600 mt-2">{presenceRate}%</div>
            </div>
            <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl">
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Asistencias</div>
              <div className="text-3xl font-bold text-emerald-600 mt-2">{presentCount}</div>
            </div>
            <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl">
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Inasistencias</div>
              <div className="text-3xl font-bold text-red-600 mt-2">{absentCount}</div>
            </div>
            <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl">
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Tardanzas</div>
              <div className="text-3xl font-bold text-amber-600 mt-2">{tardinessCount}</div>
            </div>
          </div>

          {/* Attendance logs */}
          <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Bitácora de Asistencia</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => exportToPDF({
                    title: 'Asistencias',
                    headers: ['Fecha', 'Materia', 'Docente', 'Estado'],
                    rows: myAttendance.map(a => [a.fecha, getSubjectName(a.materia_id), getTeacherName(a.registrado_por), a.estado]),
                    fileName: 'asistencias'
                  })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" /> PDF
                </button>
                <button
                  onClick={() => exportToExcel({
                    title: 'Asistencias',
                    headers: ['Fecha', 'Materia', 'Docente', 'Estado'],
                    rows: myAttendance.map(a => [a.fecha, getSubjectName(a.materia_id), getTeacherName(a.registrado_por), a.estado]),
                    fileName: 'asistencias'
                  })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium transition-colors"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
                </button>
              </div>
            </div>
            {myAttendance.length === 0 ? (
              <p className="text-gray-500 text-sm">No cuentas con registros de asistencia.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 text-xs font-semibold">
                      <th className="pb-3">Fecha</th>
                      <th className="pb-3">Materia</th>
                      <th className="pb-3">Docente</th>
                      <th className="pb-3 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {myAttendance.map(att => (
                      <tr key={att.id} className="hover:bg-gray-50">
                        <td className="py-3 text-gray-600 font-medium">{att.fecha}</td>
                        <td className="py-3 text-gray-600">{getSubjectName(att.materia_id)}</td>
                        <td className="py-3 text-gray-500">{getTeacherName(att.registrado_por)}</td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                            att.estado === 'presente' 
                              ? 'bg-emerald-100 text-emerald-600' 
                              : att.estado === 'ausente' 
                              ? 'bg-red-100 text-red-600' 
                              : 'bg-amber-100 text-amber-600'
                          }`}>
                            {att.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Citations */}
      {activeTab === 'citations' && (
        <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl animate-fade-in">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Mis Citaciones Académicas</h3>
          {myCitations.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">No tienes citaciones registradas. ¡Buen trabajo!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myCitations.map(cit => (
                <div 
                  key={cit.id} 
                  className={`p-5 rounded-xl border space-y-2.5 ${
                    cit.estado === 'pendiente' 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900 text-sm">Citado por: {getTeacherName(cit.creado_por)}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      cit.estado === 'pendiente' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'
                    }`}>
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
        </div>
      )}

      {/* Tab: Messages */}
      {activeTab === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          {/* Send / Reply message */}
          <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl h-fit">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              {msgReplyTo ? <Reply className="h-4 w-4 text-q10-600" /> : <Send className="h-4 w-4 text-q10-600" />}
              {msgReplyTo ? 'Responder Mensaje' : 'Enviar Mensaje a Profesor'}
            </h3>
            {msgReplyTo && (
              <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500">
                <span className="font-semibold text-gray-700">Respondiendo a:</span>
                <div className="mt-1">{getTeacherName(msgReplyTo.remitente_id)}</div>
                <div className="font-medium text-gray-700">{msgReplyTo.asunto}</div>
                <p className="text-gray-400 mt-1 line-clamp-2">{msgReplyTo.cuerpo}</p>
              </div>
            )}
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Destinatario</label>
                <select
                  required
                  value={msgTeacherId}
                  onChange={e => setMsgTeacherId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none"
                >
                  <option value="">-- Seleccionar --</option>
                  {myTeachers.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre} {t.apellido} ({getSubjectName(myGradeAssignments.find(a => a.profesor_id === t.id)?.materia_id || '')})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Asunto</label>
                <input
                  type="text"
                  required
                  value={msgSubject}
                  onChange={e => setMsgSubject(e.target.value)}
                  placeholder="Duda sobre el examen / proyecto..."
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Contenido del Mensaje</label>
                <textarea
                  required
                  rows={4}
                  value={msgBody}
                  onChange={e => setMsgBody(e.target.value)}
                  placeholder="Redacta tu consulta detallada aquí..."
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-q10-600 hover:bg-q10-700 text-white font-semibold rounded-xl text-sm transition-colors"
                >
                  {msgReplyTo ? 'Responder' : 'Enviar Mensaje'}
                </button>
                {msgReplyTo && (
                  <button
                    type="button"
                    onClick={cancelReply}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-xl text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Messages list */}
          <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Inbox className="h-5 w-5 text-q10-600" /> Conversaciones
              </h3>
              {unreadIncoming > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-1 rounded-full">
                  {unreadIncoming} no leído{unreadIncoming !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {myMessages.length === 0 ? (
                <p className="text-gray-500 text-xs py-4 text-center">No hay mensajes aún.</p>
              ) : (
                myMessages.map(msg => {
                  const isSender = msg.remitente_id === user?.id;
                  const isUnread = !isSender && !msg.leido;
                  return (
                    <div
                      key={msg.id}
                      onClick={() => { setSelectedMessage(msg); if (!isSender) markAsRead(msg.id); }}
                      className={`p-4 rounded-xl border text-xs space-y-1.5 transition-all cursor-pointer ${
                        isUnread
                          ? 'bg-q10-50 border-q10-300 text-q10-700'
                          : isSender
                            ? 'bg-white border-gray-200 text-gray-600'
                            : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}
                    >
                      <div className="flex justify-between items-start font-semibold">
                        <span className="flex items-center gap-1.5">
                          {isUnread && <span className="w-2 h-2 bg-q10-600 rounded-full" />}
                          {isSender ? `Tú → ${getTeacherName(msg.destinatario_id)}` : getTeacherName(msg.remitente_id)}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(msg.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="font-bold text-gray-900">{msg.asunto}</div>
                      <p className="text-gray-500 mt-1 truncate">{msg.cuerpo}</p>
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleReply(msg); }}
                          className="flex items-center gap-1 text-q10-600 hover:text-q10-700 text-[10px] font-semibold transition-colors"
                        >
                          <Reply className="h-3 w-3" /> Responder
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMessage(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedMessage.asunto}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedMessage.remitente_id === user?.id
                    ? `Para: ${getTeacherName(selectedMessage.destinatario_id)}`
                    : `De: ${getTeacherName(selectedMessage.remitente_id)}`}
                  {' · '}
                  {new Date(selectedMessage.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedMessage.cuerpo}</p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => { handleReply(selectedMessage); setSelectedMessage(null); }}
                className="flex items-center gap-1.5 px-4 py-2 bg-q10-600 hover:bg-q10-700 text-white font-semibold rounded-xl text-xs transition-colors"
              >
                <Reply className="h-3.5 w-3.5" /> Responder
              </button>
              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-xl text-xs transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
