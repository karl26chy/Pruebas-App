import React, { useEffect, useState } from 'react';
import { Award, AlertTriangle, CheckSquare, ClipboardList, Mail } from 'lucide-react';
import { useApp } from '../../../context/useApp';
import { useMessaging } from '../../../hooks/useMessaging';
import { Card, EmptyMessage, Tabs, type TabItem } from '../../ui';
import { MessageComposer, MessageThread, MessageDetailModal } from '../../messaging';
import { useTeacherClass } from './useTeacherClass';
import { AttendanceTab } from './AttendanceTab';
import { EvaluationsTab } from './EvaluationsTab';
import { MarksTab } from './MarksTab';
import { CitationsTab } from './CitationsTab';

type TeacherTab = 'attendance' | 'evaluations' | 'marks' | 'citations' | 'messages';

export const TeacherDashboard: React.FC = () => {
  const { refreshData, navigateToTab, setNavigateToTab } = useApp();
  const [selectedAssignId, setSelectedAssignId] = useState('');
  const [activeTab, setActiveTab] = useState<TeacherTab>('attendance');

  const {
    user, teacherAssignments, activeAssignment, activeGrade, activeSubject,
    gradeStudents, activeEvals, marks, notaMax,
    getSubjectName, getGradeName, getStudentName,
  } = useTeacherClass(selectedAssignId);

  const messaging = useMessaging({
    // Los mensajes del docente se asocian a la materia de la clase activa.
    resolveMateriaId: () => activeAssignment?.materia_id ?? null,
  });

  useEffect(() => {
    if (navigateToTab && typeof navigateToTab === 'string') {
      setActiveTab(navigateToTab as TeacherTab);
      setNavigateToTab(null);
    }
  }, [navigateToTab, setNavigateToTab]);

  const tabs: TabItem<TeacherTab>[] = [
    { id: 'attendance', label: 'Asistencia', icon: <CheckSquare className="h-4 w-4" /> },
    { id: 'evaluations', label: 'Evaluaciones', icon: <ClipboardList className="h-4 w-4" /> },
    { id: 'marks', label: 'Notas', icon: <Award className="h-4 w-4" /> },
    { id: 'citations', label: 'Citaciones', icon: <AlertTriangle className="h-4 w-4" /> },
    { id: 'messages', label: 'Mensajería', icon: <Mail className="h-4 w-4" />, badge: messaging.unreadIncoming },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Panel del Docente</h2>
        <p className="text-gray-500 text-sm">
          Gestiona tus clases, evaluaciones, asistencia, notas y comunicación.
        </p>
      </div>

      <Card className="p-5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-q10-600 mb-2">
          Selecciona tu Materia y Grado
        </label>
        {teacherAssignments.length === 0 ? (
          <EmptyMessage className="text-sm text-gray-500">No tienes materias asignadas.</EmptyMessage>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {teacherAssignments.map(a => (
              <button
                key={a.id}
                onClick={() => setSelectedAssignId(a.id)}
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
      </Card>

      {activeAssignment && user && (
        <div className="space-y-6 animate-fade-in">
          <Tabs items={tabs} active={activeTab} onChange={setActiveTab} scrollable />

          {activeTab === 'attendance' && (
            <AttendanceTab
              key={activeAssignment.id}
              assignment={activeAssignment}
              subject={activeSubject}
              grade={activeGrade}
              students={gradeStudents}
              teacherId={user.id}
              onSaved={refreshData}
            />
          )}

          {activeTab === 'evaluations' && (
            <EvaluationsTab
              assignment={activeAssignment}
              evaluations={activeEvals}
              teacherId={user.id}
              onSaved={refreshData}
            />
          )}

          {activeTab === 'marks' && (
            <MarksTab
              key={activeAssignment.id}
              assignment={activeAssignment}
              subject={activeSubject}
              grade={activeGrade}
              students={gradeStudents}
              evaluations={activeEvals}
              marks={marks}
              teacherId={user.id}
              notaMax={notaMax}
              onSaved={refreshData}
            />
          )}

          {activeTab === 'citations' && (
            <CitationsTab
              assignment={activeAssignment}
              students={gradeStudents}
              teacherId={user.id}
              getStudentName={getStudentName}
              onSaved={refreshData}
            />
          )}

          {activeTab === 'messages' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <MessageComposer
                title="Enviar Mensaje"
                recipients={gradeStudents.map(s => ({ id: s.id, label: `${s.nombre} ${s.apellido}` }))}
                replyTo={messaging.replyTo}
                nameOf={getStudentName}
                recipientId={messaging.form.recipientId}
                onRecipientChange={messaging.form.setRecipientId}
                subject={messaging.form.subject}
                onSubjectChange={messaging.form.setSubject}
                body={messaging.form.body}
                onBodyChange={messaging.form.setBody}
                onSubmit={messaging.send}
                onCancelReply={messaging.cancelReply}
              />
              <MessageThread
                messages={messaging.thread}
                currentUserId={user.id}
                unreadCount={messaging.unreadIncoming}
                nameOf={getStudentName}
                onOpen={messaging.openMessage}
                onReply={messaging.startReply}
              />
            </div>
          )}
        </div>
      )}

      {messaging.selectedMessage && (
        <MessageDetailModal
          message={messaging.selectedMessage}
          currentUserId={user?.id}
          nameOf={getStudentName}
          onClose={() => messaging.setSelectedMessage(null)}
          onReply={messaging.startReply}
        />
      )}
    </div>
  );
};
