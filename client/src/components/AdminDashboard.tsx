import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { User } from '../context/AppContext';
import { 
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ReferenceLine, PieChart, Pie, Cell
} from 'recharts';
import { 
  Users, BookOpen, GraduationCap,
  LayoutDashboard, ShieldAlert,
  FileText, FileSpreadsheet, Filter, Eye, CheckCircle, XCircle, Clock,
  BarChart3, PieChart as PieChartIcon, Search, X, Phone, User as UserIcon,
  Heart, AlertCircle, CreditCard, Droplet
} from 'lucide-react';
import { exportToPDF, exportToExcel, exportBoletinToPDF } from '../services/export';

const COLORS = ['#4f46e5', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899'];

export const AdminDashboard: React.FC = () => {
  const { 
    currentInstitution, users, grades, subjects, assignments, 
    studentGrades, marks, attendance, refreshData 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'students'>('overview');
  const [filterGenero, setFilterGenero] = useState<string>('');
  const [filterEdadMin, setFilterEdadMin] = useState<number>(0);
  const [filterEdadMax, setFilterEdadMax] = useState<number>(99);
  const [filterGrado, setFilterGrado] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const instUsers = users.filter(u => u.institucion_id === currentInstitution?.id);
  const instGrades = grades.filter(g => g.institucion_id === currentInstitution?.id);
  const instAssignments = assignments.filter(a => a.institucion_id === currentInstitution?.id);

  const studentUsers = instUsers.filter(u => u.rol === 'student');
  const teacherUsers = instUsers.filter(u => u.rol === 'teacher');

  const getGradeLabel = (gradeId: string) => {
    const g = grades.find(g => g.id === gradeId);
    return g ? `${g.nombre} "${g.tipo_grado}"` : 'Desconocido';
  };

  const getSubjectName = (subjId: string) => subjects.find(s => s.id === subjId)?.nombre || 'Materia';

  const getLowPerformingSubjects = () => {
    if (!currentInstitution) return [];
    const subjectStats: { [key: string]: { total: number; count: number; name: string } } = {};
    const instStudentIds = studentUsers.map(s => s.id);
    const instMarks = marks.filter(m => instStudentIds.includes(m.estudiante_id));
    instMarks.forEach(m => {
      const subject = subjects.find(s => s.id === m.materia_id);
      if (!subject) return;
      if (!subjectStats[m.materia_id]) {
        subjectStats[m.materia_id] = { total: 0, count: 0, name: subject.nombre };
      }
      subjectStats[m.materia_id].total += m.nota;
      subjectStats[m.materia_id].count += 1;
    });
    return Object.keys(subjectStats).map(subjId => ({
      id: subjId,
      nombre: subjectStats[subjId].name,
      promedio: Number((subjectStats[subjId].total / subjectStats[subjId].count).toFixed(2)),
      deficit: subjectStats[subjId].total / subjectStats[subjId].count < currentInstitution.nota_minima_aprobacion
    })).sort((a, b) => a.promedio - b.promedio).slice(0, 5);
  };

  const lowPerfSubjects = getLowPerformingSubjects();

  const overallSubjectData = useMemo(() => {
    const instStudentIds = studentUsers.map(s => s.id);
    const instMarks = marks.filter(m => instStudentIds.includes(m.estudiante_id));
    const map: { [subjId: string]: { total: number; count: number } } = {};
    instMarks.forEach(m => {
      if (!map[m.materia_id]) map[m.materia_id] = { total: 0, count: 0 };
      map[m.materia_id].total += m.nota;
      map[m.materia_id].count += 1;
    });
    return Object.keys(map).map(id => ({
      name: getSubjectName(id),
      Promedio: Number((map[id].total / map[id].count).toFixed(2))
    }));
  }, [marks, studentUsers, subjects]);

  const attendancePieData = useMemo(() => {
    const instStudentIds = studentUsers.map(s => s.id);
    const instAtt = attendance.filter(a => instStudentIds.includes(a.estudiante_id));
    const presente = instAtt.filter(a => a.estado === 'presente').length;
    const ausente = instAtt.filter(a => a.estado === 'ausente').length;
    const tardanza = instAtt.filter(a => a.estado === 'tardanza').length;
    return [
      { name: 'Presente', value: presente || 1 },
      { name: 'Ausente', value: ausente || 1 },
      { name: 'Tardanza', value: tardanza || 1 },
    ];
  }, [attendance, studentUsers]);

  const getAge = (fechaNac?: string): number => {
    if (!fechaNac) return 0;
    const birth = new Date(fechaNac);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  // Search autocomplete: students matching query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return studentUsers.filter(s =>
      `${s.nombre} ${s.apellido}`.toLowerCase().includes(q) ||
      (s.identificacion && s.identificacion.toLowerCase().includes(q)) ||
      s.email.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery, studentUsers]);

  const filteredStudents = useMemo(() => {
    return studentUsers.filter(s => {
      if (filterGenero && s.genero !== filterGenero) return false;
      const age = getAge(s.fecha_nacimiento);
      if (filterEdadMin > 0 && age < filterEdadMin) return false;
      if (filterEdadMax < 99 && age > filterEdadMax) return false;
      if (filterGrado) {
        const sg = studentGrades.find(sg => sg.estudiante_id === s.id);
        if (!sg || sg.grado_id !== filterGrado) return false;
      }
      return true;
    });
  }, [studentUsers, filterGenero, filterEdadMin, filterEdadMax, filterGrado, studentGrades]);

  const getStudentGradeLabel = (studId: string) => {
    const sg = studentGrades.find(sg => sg.estudiante_id === studId);
    if (!sg) return 'Sin asignar';
    const g = grades.find(gr => gr.id === sg.grado_id);
    return g ? `${g.nombre} "${g.tipo_grado}"` : 'Desconocido';
  };

  const getStudentAverage = (studId: string, subjId?: string) => {
    let studentMarks = marks.filter(m => m.estudiante_id === studId);
    if (subjId) studentMarks = studentMarks.filter(m => m.materia_id === subjId);
    if (studentMarks.length === 0) return 0;
    return Number((studentMarks.reduce((acc, m) => acc + m.nota, 0) / studentMarks.length).toFixed(2));
  };

  const getStudentAttendanceRate = (studId: string) => {
    const atts = attendance.filter(a => a.estudiante_id === studId);
    if (atts.length === 0) return 0;
    const present = atts.filter(a => a.estado === 'presente').length;
    return Math.round((present / atts.length) * 100);
  };

  const buildBoletinData = (student: User) => {
    const studentMarks = marks.filter(m => m.estudiante_id === student.id);
    const boletinMaterias = subjects
      .map(subj => {
        const subjMarks = studentMarks.filter(m => m.materia_id === subj.id);
        if (subjMarks.length === 0) return null;
        const avg = Number((subjMarks.reduce((a, m) => a + m.nota, 0) / subjMarks.length).toFixed(2));
        const passing = currentInstitution ? avg >= currentInstitution.nota_minima_aprobacion : true;
        return { nombre: subj.nombre, evaluaciones: subjMarks.length, promedio: avg, estado: passing ? 'Aprobado' : 'Reprobado' };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);
    const studentAtt = attendance.filter(a => a.estudiante_id === student.id);
    const ausencias = studentAtt.filter(a => a.estado === 'ausente').length;
    const tardanzas = studentAtt.filter(a => a.estado === 'tardanza').length;
    const slug = `${student.nombre}_${student.apellido}`.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    return {
      institucion: currentInstitution?.nombre || '',
      estudiante: `${student.nombre} ${student.apellido}`,
      identificacion: student.identificacion || 'N/R',
      grado: getStudentGradeLabel(student.id),
      edad: getAge(student.fecha_nacimiento),
      genero: student.genero || 'N/E',
      materias: boletinMaterias,
      promedioGeneral: getStudentAverage(student.id),
      notaMinima: currentInstitution?.nota_minima_aprobacion ?? 0,
      asistenciaTasa: getStudentAttendanceRate(student.id),
      ausencias,
      tardanzas,
      fileName: `boletin_${slug}`,
    };
  };

  const exportSingleBoletin = (student: User) => {
    exportBoletinToPDF(buildBoletinData(student));
  };

  const studentChartData = useMemo(() => {
    if (!selectedStudent) return [];
    const dataMap: { [subjId: string]: { name: string; nota: number; count: number } } = {};
    const studentMarks = marks.filter(m => m.estudiante_id === selectedStudent.id);
    studentMarks.forEach(m => {
      if (!dataMap[m.materia_id]) {
        dataMap[m.materia_id] = { name: getSubjectName(m.materia_id), nota: 0, count: 0 };
      }
      dataMap[m.materia_id].nota += m.nota;
      dataMap[m.materia_id].count += 1;
    });
    return Object.keys(dataMap).map(subjId => ({
      name: dataMap[subjId].name,
      'Nota Promedio': Number((dataMap[subjId].nota / dataMap[subjId].count).toFixed(2))
    }));
  }, [selectedStudent, marks, subjects]);

  const selectStudent = (s: User) => {
    setSelectedStudent(s);
    setShowAutocomplete(false);
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Administración Institucional</h2>
        <p className="text-gray-500 text-sm">Panel de control y monitoreo de estudiantes - {currentInstitution?.nombre}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-2">
        <button onClick={() => setActiveTab('overview')} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${activeTab === 'overview' ? 'border-q10-500 text-q10-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
          <LayoutDashboard className="h-4 w-4" /> Resumen
        </button>
        <button onClick={() => setActiveTab('students')} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${activeTab === 'students' ? 'border-q10-500 text-q10-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
          <Eye className="h-4 w-4" /> Estudiantes
        </button>
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl">
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Estudiantes</div>
              <div className="text-3xl font-bold text-blue-600 mt-2">{studentUsers.length}</div>
            </div>
            <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl">
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Profesores</div>
              <div className="text-3xl font-bold text-emerald-600 mt-2">{teacherUsers.length}</div>
            </div>
            <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl">
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Grados</div>
              <div className="text-3xl font-bold text-purple-400 mt-2">{instGrades.length}</div>
            </div>
            <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl">
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Nota Mín. Aprobación</div>
              <div className="text-3xl font-bold text-q10-600 mt-2">{currentInstitution?.nota_minima_aprobacion.toFixed(1)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-q10-600" /> Rendimiento General por Materia
              </h3>
              {overallSubjectData.length === 0 ? (
                <p className="text-sm text-gray-500 py-8 text-center">No hay datos de rendimiento aún.</p>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={overallSubjectData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} domain={[0, currentInstitution?.tipo === 'colegio' ? 10 : 5]} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px' }} />
                      <Legend />
                      <Bar dataKey="Promedio" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                      <Line type="monotone" dataKey="Promedio" stroke="#818cf8" strokeWidth={2} />
                      {currentInstitution && (
                        <ReferenceLine y={currentInstitution.nota_minima_aprobacion} stroke="#ef4444" strokeDasharray="4 4" label={{ value: `Mín (${currentInstitution.nota_minima_aprobacion})`, fill: '#f87171', fontSize: 10 }} />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-q10-600" /> Distribución de Asistencia
              </h3>
              <div className="h-72 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={attendancePieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {attendancePieData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-500" /> Materias con Rendimiento Deficiente
              </h3>
              <div className="flex gap-2">
                <button onClick={() => exportToPDF({ title: 'Rendimiento por Materia', headers: ['Materia', 'Promedio', 'Estado'], rows: lowPerfSubjects.map(s => [s.nombre, s.promedio, s.deficit ? `Bajo la mínima (${currentInstitution?.nota_minima_aprobacion})` : 'Aceptable']), fileName: 'rendimiento_materias' })} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium transition-colors">
                  <FileText className="h-3.5 w-3.5" /> PDF
                </button>
                <button onClick={() => exportToExcel({ title: 'Rendimiento por Materia', headers: ['Materia', 'Promedio', 'Estado'], rows: lowPerfSubjects.map(s => [s.nombre, s.promedio, s.deficit ? `Bajo la mínima (${currentInstitution?.nota_minima_aprobacion})` : 'Aceptable']), fileName: 'rendimiento_materias' })} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium transition-colors">
                  <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
                </button>
              </div>
            </div>
            {lowPerfSubjects.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay registros de notas para calcular el rendimiento.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 text-xs font-semibold">
                      <th className="pb-2">Materia</th>
                      <th className="pb-2 text-center">Promedio General</th>
                      <th className="pb-2 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {lowPerfSubjects.map(subj => (
                      <tr key={subj.id} className="hover:bg-gray-50">
                        <td className="py-3 font-medium text-gray-900">{subj.nombre}</td>
                        <td className="py-3 text-center text-gray-600 font-semibold">{subj.promedio}</td>
                        <td className="py-3 text-center">
                          {subj.deficit ? (
                            <span className="px-2.5 py-0.5 rounded bg-red-100 text-red-400 border border-red-100 text-xs font-medium">Bajo la Mínima ({currentInstitution?.nota_minima_aprobacion})</span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-600 border border-emerald-100 text-xs font-medium">Aceptable</span>
                          )}
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

      {/* Tab: Students */}
      {activeTab === 'students' && (
        <div className="animate-fade-in space-y-6">
          {/* Search + Filters */}
          <div className="bg-white shadow-sm border border-gray-200 p-5 rounded-2xl space-y-4">
            {/* Search with Autocomplete */}
            <div ref={searchRef} className="relative">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setShowAutocomplete(true); }}
                    onFocus={() => setShowAutocomplete(true)}
                    placeholder="Buscar estudiante por nombre, identificación o email..."
                    className="w-full pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-q10-500/50"
                  />
                  {searchQuery && (
                    <button onClick={() => { setSearchQuery(''); setShowAutocomplete(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              {/* Autocomplete dropdown */}
              {showAutocomplete && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-72 overflow-y-auto">
                  {searchResults.map(s => (
                    <button key={s.id} onClick={() => selectStudent(s)} className="w-full text-left px-4 py-3 hover:bg-q10-50 border-b border-gray-100 last:border-0 flex items-center gap-3 transition-colors">
                      <div className="h-8 w-8 bg-q10-100 rounded-full flex items-center justify-center text-q10-600 font-bold text-xs">
                        {s.nombre[0]}{s.apellido[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-gray-900 text-sm block truncate">{s.nombre} {s.apellido}</span>
                        <span className="text-xs text-gray-500 block truncate">{s.identificacion || 'Sin ID'} · {getStudentGradeLabel(s.id)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-q10-600 shrink-0" />
              <span className="text-xs font-semibold text-gray-500">Filtros:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Género</label>
                <select value={filterGenero} onChange={e => setFilterGenero(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none">
                  <option value="">Todos</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Edad Mínima</label>
                <input type="number" min="0" max="99" value={filterEdadMin} onChange={e => setFilterEdadMin(Number(e.target.value))} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Edad Máxima</label>
                <input type="number" min="0" max="99" value={filterEdadMax} onChange={e => setFilterEdadMax(Number(e.target.value))} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Grado</label>
                <select value={filterGrado} onChange={e => setFilterGrado(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none">
                  <option value="">Todos</option>
                  {instGrades.map(g => <option key={g.id} value={g.id}>{g.nombre} "{g.tipo_grado}"</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Student List */}
            <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl lg:col-span-1">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Estudiantes ({filteredStudents.length})</h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {filteredStudents.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center">Sin resultados.</p>
                ) : (
                  filteredStudents.map(s => (
                    <button key={s.id} onClick={() => setSelectedStudent(selectedStudent?.id === s.id ? null : s)} className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${selectedStudent?.id === s.id ? 'bg-q10-50 border-q10-500 text-q10-600' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                      <span className="font-semibold block">{s.nombre} {s.apellido}</span>
                      <span className="text-xs text-gray-500 block mt-0.5">{getStudentGradeLabel(s.id)} · {getAge(s.fecha_nacimiento)} años · {s.genero || 'N/E'}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Student Detail */}
            <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl lg:col-span-2">
              {!selectedStudent ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Eye className="h-12 w-12 mb-3" />
                  <p className="text-sm font-medium">Selecciona un estudiante para ver su información y rendimiento</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Personal Info Card */}
                  <div className="bg-gradient-to-r from-q10-500 to-indigo-600 rounded-2xl p-5 text-white">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          {selectedStudent.nombre[0]}{selectedStudent.apellido[0]}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{selectedStudent.nombre} {selectedStudent.apellido}</h3>
                          <p className="text-white/80 text-sm">{getStudentGradeLabel(selectedStudent.id)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="text-right">
                          <div className="text-white/70 text-xs">Promedio General</div>
                          <div className="text-2xl font-bold">{getStudentAverage(selectedStudent.id)}</div>
                        </div>
                        <button
                          onClick={() => exportSingleBoletin(selectedStudent)}
                          title="Exportar boletín de este estudiante a PDF"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5" /> Informes
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-4 border-t border-white/20">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-white/70" />
                        <div><div className="text-[10px] text-white/70">Identificación</div><div className="text-sm font-semibold">{selectedStudent.identificacion || 'N/R'}</div></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-white/70" />
                        <div><div className="text-[10px] text-white/70">Edad / Género</div><div className="text-sm font-semibold">{getAge(selectedStudent.fecha_nacimiento)} años · {selectedStudent.genero || 'N/E'}</div></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-white/70" />
                        <div><div className="text-[10px] text-white/70">EPS</div><div className="text-sm font-semibold">{selectedStudent.eps || 'N/R'}</div></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Droplet className="h-4 w-4 text-white/70" />
                        <div><div className="text-[10px] text-white/70">Tipo Sangre</div><div className="text-sm font-semibold">{selectedStudent.tipo_sangre || 'N/R'}</div></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-white/20">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-white/70" />
                        <div><div className="text-[10px] text-white/70">Contacto Emergencia</div><div className="text-sm font-semibold">
                          {selectedStudent.contacto_emergencia
                            ? `${selectedStudent.contacto_emergencia.nombre} (${selectedStudent.contacto_emergencia.relacion}) - ${selectedStudent.contacto_emergencia.telefono}`
                            : 'N/R'}
                        </div></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-white/70" />
                        <div><div className="text-[10px] text-white/70">Discapacidad</div><div className="text-sm font-semibold">{selectedStudent.discapacidad || 'Ninguna'}</div></div>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Summary */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                      <CheckCircle className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                      <div className="text-lg font-bold text-emerald-600">{getStudentAttendanceRate(selectedStudent.id)}%</div>
                      <div className="text-[11px] text-emerald-600 font-medium">Asistencia</div>
                    </div>
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                      <XCircle className="h-5 w-5 text-red-600 mx-auto mb-1" />
                      <div className="text-lg font-bold text-red-600">{attendance.filter(a => a.estudiante_id === selectedStudent.id && a.estado === 'ausente').length}</div>
                      <div className="text-[11px] text-red-600 font-medium">Ausencias</div>
                    </div>
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                      <Clock className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                      <div className="text-lg font-bold text-amber-600">{attendance.filter(a => a.estudiante_id === selectedStudent.id && a.estado === 'tardanza').length}</div>
                      <div className="text-[11px] text-amber-600 font-medium">Tardanzas</div>
                    </div>
                  </div>

                  {/* Performance Chart */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-gray-900 mb-3">Gráfica de Rendimiento por Materia</h4>
                    {studentChartData.length === 0 ? (
                      <p className="text-sm text-gray-500 py-4 text-center">Sin notas registradas para este estudiante.</p>
                    ) : (
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={studentChartData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={11} domain={[0, currentInstitution?.tipo === 'colegio' ? 10 : 5]} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px' }} />
                            <Legend />
                            <Bar dataKey="Nota Promedio" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                            <Line type="monotone" dataKey="Nota Promedio" stroke="#818cf8" strokeWidth={2} />
                            {currentInstitution && (
                              <ReferenceLine y={currentInstitution.nota_minima_aprobacion} stroke="#ef4444" strokeDasharray="4 4" label={{ value: `Mín (${currentInstitution.nota_minima_aprobacion})`, fill: '#f87171', fontSize: 10 }} />
                            )}
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Grades by Subject Table */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-3">Detalle de Notas por Materia</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 text-gray-500 text-xs font-semibold">
                            <th className="pb-2">Materia</th>
                            <th className="pb-2 text-center">Evaluaciones</th>
                            <th className="pb-2 text-center">Promedio</th>
                            <th className="pb-2 text-center">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                          {subjects.map(subj => {
                            const studentMarks = marks.filter(m => m.estudiante_id === selectedStudent.id && m.materia_id === subj.id);
                            if (studentMarks.length === 0) return null;
                            const avg = Number((studentMarks.reduce((a, m) => a + m.nota, 0) / studentMarks.length).toFixed(2));
                            const passing = currentInstitution ? avg >= currentInstitution.nota_minima_aprobacion : true;
                            return (
                              <tr key={subj.id} className="hover:bg-gray-50">
                                <td className="py-2.5 font-medium text-gray-900">{subj.nombre}</td>
                                <td className="py-2.5 text-center text-gray-500">{studentMarks.length}</td>
                                <td className="py-2.5 text-center font-semibold">{avg}</td>
                                <td className="py-2.5 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${passing ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{passing ? 'Aprobado' : 'Reprobado'}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};