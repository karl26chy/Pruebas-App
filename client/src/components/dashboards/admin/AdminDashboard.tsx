import React, { useState } from 'react';
import { CalendarDays, Eye, LayoutDashboard } from 'lucide-react';
import { Tabs, type TabItem } from '../../ui';
import { useAdminDashboard } from './useAdminDashboard';
import { OverviewTab } from './OverviewTab';
import { StudentsTab } from './StudentsTab';
import { PeriodsTab } from './PeriodsTab';

type AdminTab = 'overview' | 'students' | 'periods';

const TABS: TabItem<AdminTab>[] = [
  { id: 'overview', label: 'Resumen', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'students', label: 'Estudiantes', icon: <Eye className="h-4 w-4" /> },
  { id: 'periods', label: 'Periodos Académicos', icon: <CalendarDays className="h-4 w-4" /> },
];

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const {
    currentInstitution, instGrades, studentUsers, teacherUsers, subjects,
    marks, attendance, studentGrades, getSubjectName, lowPerfSubjects,
    overallSubjectData, attendancePieData, getStudentGradeLabel,
    getStudentAverage, getStudentAttendanceRate, buildBoletinData,
  } = useAdminDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Administración Institucional</h2>
        <p className="text-gray-500 text-sm">
          Panel de control y monitoreo de estudiantes - {currentInstitution?.nombre}
        </p>
      </div>

      <Tabs items={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' && (
        <OverviewTab
          institution={currentInstitution}
          totals={{
            students: studentUsers.length,
            teachers: teacherUsers.length,
            grades: instGrades.length,
          }}
          subjectData={overallSubjectData}
          attendancePieData={attendancePieData}
          lowPerfSubjects={lowPerfSubjects}
        />
      )}

      {activeTab === 'students' && (
        <StudentsTab
          students={studentUsers}
          grades={instGrades}
          studentGrades={studentGrades}
          subjects={subjects}
          marks={marks}
          attendance={attendance}
          institution={currentInstitution}
          getSubjectName={getSubjectName}
          getStudentGradeLabel={getStudentGradeLabel}
          getStudentAverage={getStudentAverage}
          getStudentAttendanceRate={getStudentAttendanceRate}
          buildBoletinData={buildBoletinData}
        />
      )}

      {activeTab === 'periods' && <PeriodsTab />}
    </div>
  );
};
