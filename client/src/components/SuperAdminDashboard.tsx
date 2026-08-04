import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Institution, User } from '../context/AppContext';
import { api } from '../services/api';
import { 
  Plus, ToggleLeft, ToggleRight, ShieldAlert, CheckCircle2,
  Building2, Users, BookOpen, GraduationCap, Link2, UserPlus,
  BookOpenCheck, Eye, EyeOff, X, Phone, Heart, Droplet, CreditCard,
  AlertCircle, User as UserIcon, Key, Mail
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const { institutions, refreshData, users, grades, subjects, assignments, studentGrades } = useApp();

  const [activeTab, setActiveTab] = useState<'institutions' | 'users' | 'grades_subjects' | 'assignments'>('institutions');

  // Institution states
  const [nombre, setNombre] = useState('');
  const [subdominio, setSubdominio] = useState('');
  const [tipo, setTipo] = useState<'colegio' | 'universidad'>('colegio');
  const [notaMinima, setNotaMinima] = useState(6.0);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // User CRUD states
  const [selectedInstId, setSelectedInstId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPass, setUserPass] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'teacher' | 'student'>('student');
  const [userNombre, setUserNombre] = useState('');
  const [userApellido, setUserApellido] = useState('');
  const [userGenero, setUserGenero] = useState('');
  const [userFechaNac, setUserFechaNac] = useState('');
  const [userIdentificacion, setUserIdentificacion] = useState('');
  const [userEps, setUserEps] = useState('');
  const [userTipoSangre, setUserTipoSangre] = useState('');
  const [userDiscapacidad, setUserDiscapacidad] = useState('');
  const [userContactoEmergencia, setUserContactoEmergencia] = useState({ nombre: '', telefono: '', relacion: '' });
  const [showUserPass, setShowUserPass] = useState(false);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [userPasswords, setUserPasswords] = useState<Record<string, string>>({});

  // Grade/Subject states
  const [gradeName, setGradeName] = useState('');
  const [gradeType, setGradeType] = useState('A');
  const [gradeCupo, setGradeCupo] = useState(30);
  const [grdInstId, setGrdInstId] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectDesc, setSubjectDesc] = useState('');

  // Assignment states
  const [assignInstId, setAssignInstId] = useState('');
  const [assignTeacherId, setAssignTeacherId] = useState('');
  const [assignSubjectId, setAssignSubjectId] = useState('');
  const [assignGradeId, setAssignGradeId] = useState('');

  // Student-Grade assignment states
  const [studAssignInstId, setStudAssignInstId] = useState('');
  const [studAssignStudentId, setStudAssignStudentId] = useState('');
  const [studAssignGradeId, setStudAssignGradeId] = useState('');

  // Stats
  const activeCount = institutions.filter(i => i.activa).length;
  const adminCount = users.filter(u => u.rol === 'admin').length;

  // Helpers
  const getGradeLabel = (gid: string) => {
    const g = grades.find(g => g.id === gid);
    return g ? `${g.nombre} "${g.tipo_grado}"` : 'Desconocido';
  };
  const getSubjectLabel = (sid: string) => {
    const s = subjects.find(s => s.id === sid);
    return s ? s.nombre : 'Desconocida';
  };
  const getUserLabel = (uid: string) => {
    const u = users.find(u => u.id === uid);
    return u ? `${u.nombre} ${u.apellido}` : 'Desconocido';
  };

  const getAge = (fechaNac?: string): number => {
    if (!fechaNac) return 0;
    const birth = new Date(fechaNac);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const getInstName = (instId: string | null) => {
    if (!instId) return 'Sin institución';
    return institutions.find(i => i.id === instId)?.nombre || 'Desconocida';
  };

  const instUsers = users.filter(u => u.institucion_id === selectedInstId);

  const filteredAssignments = assignments.filter(a => a.institucion_id === assignInstId);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  // Institution handlers
  const handleCreateInst = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !subdominio) return;
    const exists = institutions.some(i => i.subdominio.toLowerCase() === subdominio.toLowerCase());
    if (exists) { showMsg('error', 'El subdominio ya existe.'); return; }
    try {
      setLoading(true);
      await api.createInstitution({ nombre, subdominio: subdominio.toLowerCase().replace(/[^a-z0-9]/g, ''), tipo, nota_minima_aprobacion: Number(notaMinima), activa: true });
      setNombre(''); setSubdominio(''); setNotaMinima(tipo === 'colegio' ? 6.0 : 3.0);
      showMsg('success', 'Institución creada.');
      await refreshData();
    } catch { showMsg('error', 'Error al crear institución.'); }
    finally { setLoading(false); }
  };

  const toggleStatus = async (inst: Institution) => {
    try {
      await api.updateInstitution(inst.id, { ...inst, activa: !inst.activa });
      await refreshData();
      showMsg('success', `Estado de ${inst.nombre} actualizado.`);
    } catch { showMsg('error', 'No se pudo actualizar.'); }
  };

  // User CRUD
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail || !userNombre || !userApellido || !selectedInstId || !userPass) return;
    try {
      const created = await api.createUser({
        email: userEmail, password: userPass, rol: userRole,
        nombre: userNombre, apellido: userApellido,
        identificacion: userIdentificacion || undefined,
        genero: userGenero || undefined,
        fecha_nacimiento: userFechaNac || undefined,
        eps: userEps || undefined,
        tipo_sangre: userTipoSangre || undefined,
        discapacidad: userDiscapacidad || undefined,
        contacto_emergencia: userContactoEmergencia.nombre ? userContactoEmergencia : undefined,
        institucion_id: selectedInstId, activo: true
      });
      setUserPasswords(prev => ({ ...prev, [created.id]: userPass }));
      setUserEmail(''); setUserNombre(''); setUserApellido('');
      setUserGenero(''); setUserFechaNac(''); setUserIdentificacion('');
      setUserEps(''); setUserTipoSangre(''); setUserDiscapacidad('');
      setUserContactoEmergencia({ nombre: '', telefono: '', relacion: '' });
      setUserPass('');
      showMsg('success', 'Usuario creado.');
      await refreshData();
    } catch { showMsg('error', 'Error al crear usuario.'); }
  };

  const toggleUserActive = async (targetUser: User) => {
    try {
      await api.updateUser(targetUser.id, { ...targetUser, activo: !targetUser.activo });
      await refreshData();
    } catch { showMsg('error', 'Error al cambiar estado.'); }
  };

  // Grade/Subject handlers
  const handleCreateGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeName || !grdInstId) return;
    try {
      await api.createGrade({ institucion_id: grdInstId, nombre: gradeName, tipo_grado: gradeType, cupo_maximo: Number(gradeCupo) });
      setGradeName(''); setGradeCupo(30);
      showMsg('success', 'Grado creado.');
      await refreshData();
    } catch { showMsg('error', 'Error al crear grado.'); }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName) return;
    try {
      await api.createSubject({ nombre: subjectName, descripcion: subjectDesc });
      setSubjectName(''); setSubjectDesc('');
      showMsg('success', 'Materia creada.');
      await refreshData();
    } catch { showMsg('error', 'Error al crear materia.'); }
  };

  // Assignment handlers
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTeacherId || !assignSubjectId || !assignGradeId || !assignInstId) return;
    try {
      const exists = assignments.some(a => a.profesor_id === assignTeacherId && a.materia_id === assignSubjectId && a.grado_id === assignGradeId);
      if (exists) { showMsg('error', 'Esta asignación ya existe.'); return; }
      await api.createAssignment({ profesor_id: assignTeacherId, materia_id: assignSubjectId, grado_id: assignGradeId, institucion_id: assignInstId });
      setAssignTeacherId(''); setAssignSubjectId(''); setAssignGradeId('');
      showMsg('success', 'Asignación guardada.');
      await refreshData();
    } catch { showMsg('error', 'Error al crear asignación.'); }
  };

  const handleAssignStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studAssignStudentId || !studAssignGradeId) return;
    const existing = studentGrades.find(sg => sg.estudiante_id === studAssignStudentId);
    const targetGrade = grades.find(g => g.id === studAssignGradeId);
    const enrolled = studentGrades.filter(sg => sg.grado_id === studAssignGradeId).length;
    const cupo = targetGrade?.cupo_maximo || 30;
    const isTransfer = existing && existing.grado_id !== studAssignGradeId;
    if (!isTransfer && enrolled >= cupo) { showMsg('error', `Cupo máximo (${cupo}) alcanzado.`); return; }
    try {
      if (existing) await api.deleteStudentGrade(existing.id);
      await api.createStudentGrade({ estudiante_id: studAssignStudentId, grado_id: studAssignGradeId });
      setStudAssignStudentId(''); setStudAssignGradeId('');
      showMsg('success', 'Estudiante matriculado.');
      await refreshData();
    } catch { showMsg('error', 'Error al matricular.'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Consola de Super Administrador</h2>
          <p className="text-gray-500 text-sm">Gestión global de instituciones, usuarios, grados, materias y asignaciones</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 shadow-sm p-6 rounded-2xl">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Instituciones</div>
          <div className="text-3xl font-bold text-q10-600 mt-2">{institutions.length}</div>
        </div>
        <div className="bg-white border border-gray-200 shadow-sm p-6 rounded-2xl">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Activas</div>
          <div className="text-3xl font-bold text-emerald-600 mt-2">{activeCount}</div>
        </div>
        <div className="bg-white border border-gray-200 shadow-sm p-6 rounded-2xl">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Administradores</div>
          <div className="text-3xl font-bold text-amber-600 mt-2">{adminCount}</div>
        </div>
        <div className="bg-white border border-gray-200 shadow-sm p-6 rounded-2xl">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Usuarios Totales</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{users.length}</div>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border text-sm flex items-center gap-2 ${
          msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-2 overflow-x-auto">
        <button onClick={() => setActiveTab('institutions')} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all shrink-0 ${activeTab === 'institutions' ? 'border-q10-500 text-q10-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
          <Building2 className="h-4 w-4" /> Instituciones
        </button>
        <button onClick={() => setActiveTab('users')} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all shrink-0 ${activeTab === 'users' ? 'border-q10-500 text-q10-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
          <Users className="h-4 w-4" /> Usuarios
        </button>
        <button onClick={() => setActiveTab('grades_subjects')} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all shrink-0 ${activeTab === 'grades_subjects' ? 'border-q10-500 text-q10-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
          <BookOpen className="h-4 w-4" /> Grados y Materias
        </button>
        <button onClick={() => setActiveTab('assignments')} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all shrink-0 ${activeTab === 'assignments' ? 'border-q10-500 text-q10-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
          <Link2 className="h-4 w-4" /> Asignaciones
        </button>
      </div>

      {/* Tab: Institutions */}
      {activeTab === 'institutions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white border border-gray-200 shadow-sm p-6 rounded-2xl h-fit">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Plus className="h-5 w-5 text-q10-600" /> Crear Institución
            </h3>
            <form onSubmit={handleCreateInst} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
                <input type="text" required value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Colegio San Ignacio" className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-q10-500/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Subdominio</label>
                <div className="relative">
                  <input type="text" required value={subdominio} onChange={e => setSubdominio(e.target.value)} placeholder="colegiosanignacio" className="w-full pl-4 pr-32 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-q10-500/50" />
                  <span className="absolute right-3 top-2.5 text-xs text-gray-500 font-semibold">.plataforma.com</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
                <select value={tipo} onChange={e => { const v = e.target.value as 'colegio' | 'universidad'; setTipo(v); setNotaMinima(v === 'colegio' ? 6.0 : 3.0); }} className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-q10-500/50">
                  <option value="colegio">Colegio (1-10)</option>
                  <option value="universidad">Universidad (1-5)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nota Mínima ({tipo === 'colegio' ? '1-10' : '1-5'})</label>
                <input type="number" step="0.1" min="1" max={tipo === 'colegio' ? '10' : '5'} required value={notaMinima} onChange={e => setNotaMinima(Number(e.target.value))} className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-q10-500/50" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 bg-q10-600 hover:bg-q10-700 text-white font-semibold rounded-xl transition-colors mt-2">
                {loading ? 'Creando...' : 'Guardar Institución'}
              </button>
            </form>
          </div>
          <div className="bg-white border border-gray-200 shadow-sm p-6 rounded-2xl lg:col-span-2">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Instituciones Registradas</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="pb-3">Nombre</th>
                    <th className="pb-3">Subdominio</th>
                    <th className="pb-3 text-center">Tipo</th>
                    <th className="pb-3 text-center">Nota Mín.</th>
                    <th className="pb-3 text-center">Estado</th>
                    <th className="pb-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {institutions.map(inst => (
                    <tr key={inst.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 font-medium text-gray-900">{inst.nombre}</td>
                      <td className="py-3.5 text-gray-500">{inst.subdominio}.plataforma.com</td>
                      <td className="py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${inst.tipo === 'universidad' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>{inst.tipo}</span>
                      </td>
                      <td className="py-3.5 text-center text-gray-600 font-semibold">{inst.nota_minima_aprobacion.toFixed(1)}</td>
                      <td className="py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${inst.activa ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{inst.activa ? 'Activa' : 'Inactiva'}</span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button onClick={() => toggleStatus(inst)} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors border ${inst.activa ? 'bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-200' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200'}`}>
                          {inst.activa ? <><ToggleLeft className="h-4 w-4" /> Desactivar</> : <><ToggleRight className="h-4 w-4" /> Activar</>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Users */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl h-fit">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-q10-600" /> Crear Usuario
            </h3>
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">Institución</label>
              <select required value={selectedInstId} onChange={e => setSelectedInstId(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none">
                <option value="">-- Seleccionar --</option>
                {institutions.map(inst => <option key={inst.id} value={inst.id}>{inst.nombre}</option>)}
              </select>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Nombre</label><input type="text" required value={userNombre} onChange={e => setUserNombre(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Apellido</label><input type="text" required value={userApellido} onChange={e => setUserApellido(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none" /></div>
              </div>
              <div><label className="block text-xs text-gray-500 mb-1">Email</label><input type="email" required value={userEmail} onChange={e => setUserEmail(e.target.value)} placeholder="usuario@colegio.com" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Contraseña</label><div className="relative"><input type={showUserPass ? 'text' : 'password'} required value={userPass} onChange={e => setUserPass(e.target.value)} className="w-full px-3 py-2 pr-10 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none" /><button type="button" onClick={() => setShowUserPass(!showUserPass)} className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600">{showUserPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
              <div><label className="block text-xs text-gray-500 mb-1">Rol</label>
                <select value={userRole} onChange={e => setUserRole(e.target.value as 'admin' | 'teacher' | 'student')} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none">
                  <option value="student">Estudiante</option>
                  <option value="teacher">Profesor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              {userRole === 'student' && (
              <>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Identificación</label>
                  <input type="text" value={userIdentificacion} onChange={e => setUserIdentificacion(e.target.value)} placeholder="CC/TI" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none" />
                </div>
                <div><label className="block text-xs text-gray-500 mb-1">Género</label>
                  <select value={userGenero} onChange={e => setUserGenero(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none">
                    <option value="">--</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Fecha Nac.</label>
                  <input type="date" value={userFechaNac} onChange={e => setUserFechaNac(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none" />
                </div>
                <div><label className="block text-xs text-gray-500 mb-1">EPS</label>
                  <input type="text" value={userEps} onChange={e => setUserEps(e.target.value)} placeholder="Sura, Coomeva..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Tipo Sangre</label>
                  <select value={userTipoSangre} onChange={e => setUserTipoSangre(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none">
                    <option value="">--</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div><label className="block text-xs text-gray-500 mb-1">Discapacidad</label>
                  <input type="text" value={userDiscapacidad} onChange={e => setUserDiscapacidad(e.target.value)} placeholder="Ninguna, visual, etc." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none" />
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-500 mb-2">Contacto de Emergencia</p>
                <div className="grid grid-cols-3 gap-2">
                  <div><label className="block text-[10px] text-gray-400 mb-1">Nombre</label>
                    <input type="text" value={userContactoEmergencia.nombre} onChange={e => setUserContactoEmergencia(p => ({ ...p, nombre: e.target.value }))} className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none" />
                  </div>
                  <div><label className="block text-[10px] text-gray-400 mb-1">Teléfono</label>
                    <input type="text" value={userContactoEmergencia.telefono} onChange={e => setUserContactoEmergencia(p => ({ ...p, telefono: e.target.value }))} className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none" />
                  </div>
                  <div><label className="block text-[10px] text-gray-400 mb-1">Relación</label>
                    <input type="text" value={userContactoEmergencia.relacion} onChange={e => setUserContactoEmergencia(p => ({ ...p, relacion: e.target.value }))} placeholder="Madre/Padre" className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none" />
                  </div>
                </div>
              </div>
              </>
              )}
              <button type="submit" className="w-full py-2.5 bg-q10-600 hover:bg-q10-700 text-white font-semibold rounded-xl text-sm transition-colors">Registrar Usuario</button>
            </form>
          </div>
          <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Usuarios por Institución</h3>
              <select value={selectedInstId} onChange={e => setSelectedInstId(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none">
                <option value="">-- Seleccionar Institución --</option>
                {institutions.map(inst => <option key={inst.id} value={inst.id}>{inst.nombre}</option>)}
              </select>
            </div>
            {selectedInstId ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 text-xs font-semibold uppercase">
                      <th className="pb-3">Nombre</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3 text-center">Rol</th>
                      <th className="pb-3 text-center">Estado</th>
                      <th className="pb-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {instUsers.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="py-3 font-medium text-gray-900">{u.nombre} {u.apellido}</td>
                        <td className="py-3 text-gray-500">{u.email}</td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${u.rol === 'admin' ? 'bg-amber-100 text-amber-500' : u.rol === 'teacher' ? 'bg-emerald-100 text-emerald-500' : 'bg-blue-100 text-blue-600'}`}>{u.rol}</span>
                        </td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${u.activo ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-400'}`}>{u.activo ? 'Activo' : 'Desactivado'}</span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => setViewUser(u)} className="p-1.5 rounded-lg text-gray-400 hover:text-q10-600 hover:bg-q10-50 transition-colors" title="Ver información">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button onClick={() => toggleUserActive(u)} className={`px-2 py-1 rounded text-xs border ${u.activo ? 'bg-red-50 hover:bg-red-50 text-red-400 border-red-100' : 'bg-emerald-50 hover:bg-emerald-950/40 text-emerald-600 border-emerald-100'}`}>{u.activo ? 'Desactivar' : 'Activar'}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-sm py-8 text-center">Selecciona una institución para ver sus usuarios.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab: Grades & Subjects */}
      {activeTab === 'grades_subjects' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-q10-600" /> Grados / Cursos
            </h3>
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">Institución</label>
              <select required value={grdInstId} onChange={e => setGrdInstId(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none">
                <option value="">-- Seleccionar --</option>
                {institutions.map(inst => <option key={inst.id} value={inst.id}>{inst.nombre}</option>)}
              </select>
            </div>
            <form onSubmit={handleCreateGrade} className="flex gap-2 mb-6">
              <input type="text" required value={gradeName} onChange={e => setGradeName(e.target.value)} placeholder="6to, 10mo..." className="flex-1 min-w-0 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none" />
              <input type="text" required value={gradeType} onChange={e => setGradeType(e.target.value)} placeholder="A" className="w-14 px-2 py-2 bg-white border border-gray-200 rounded-xl text-sm text-center focus:outline-none" />
              <input type="number" min="1" max="200" required value={gradeCupo} onChange={e => setGradeCupo(Number(e.target.value))} title="Cupo" className="w-20 px-2 py-2 bg-white border border-gray-200 rounded-xl text-sm text-center focus:outline-none" />
              <button type="submit" className="px-4 py-2 bg-q10-600 hover:bg-q10-700 text-white font-semibold rounded-xl text-sm shrink-0">Agregar</button>
            </form>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {grdInstId ? grades.filter(g => g.institucion_id === grdInstId).map(g => {
                const enrolled = studentGrades.filter(sg => sg.grado_id === g.id).length;
                const cupo = g.cupo_maximo || 30;
                return (
                  <div key={g.id} className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-200">
                    <span className="text-sm font-semibold text-gray-900">Grado {g.nombre} - "{g.tipo_grado}"</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${enrolled >= cupo ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{enrolled}/{cupo}</span>
                  </div>
                );
              }) : <p className="text-sm text-gray-500 py-4 text-center">Selecciona una institución.</p>}
            </div>
          </div>
          <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-q10-600" /> Materias Académicas
            </h3>
            <form onSubmit={handleCreateSubject} className="space-y-4 mb-6">
              <input type="text" required value={subjectName} onChange={e => setSubjectName(e.target.value)} placeholder="Nombre de la materia" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none" />
              <div className="flex gap-3">
                <input type="text" value={subjectDesc} onChange={e => setSubjectDesc(e.target.value)} placeholder="Descripción..." className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none" />
                <button type="submit" className="px-4 py-2 bg-q10-600 hover:bg-q10-700 text-white font-semibold rounded-xl text-sm">Agregar</button>
              </div>
            </form>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {subjects.map(s => (
                <div key={s.id} className="p-3 bg-white rounded-xl border border-gray-200">
                  <span className="text-sm font-semibold text-gray-900 block">{s.nombre}</span>
                  <span className="text-xs text-gray-400">{s.descripcion}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Assignments */}
      {activeTab === 'assignments' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpenCheck className="h-5 w-5 text-q10-600" /> Asignar Materia a Profesor
            </h3>
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">Institución</label>
              <select required value={assignInstId} onChange={e => { setAssignInstId(e.target.value); setAssignTeacherId(''); setAssignSubjectId(''); setAssignGradeId(''); }} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none">
                <option value="">-- Seleccionar --</option>
                {institutions.map(inst => <option key={inst.id} value={inst.id}>{inst.nombre}</option>)}
              </select>
            </div>
            {assignInstId && (
              <form onSubmit={handleCreateAssignment} className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Profesor</label>
                  <select required value={assignTeacherId} onChange={e => setAssignTeacherId(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none">
                    <option value="">-- Seleccionar --</option>
                    {users.filter(u => u.rol === 'teacher' && u.institucion_id === assignInstId).map(t => <option key={t.id} value={t.id}>{t.nombre} {t.apellido}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Materia</label>
                  <select required value={assignSubjectId} onChange={e => setAssignSubjectId(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none">
                    <option value="">-- Seleccionar --</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Grado</label>
                  <select required value={assignGradeId} onChange={e => setAssignGradeId(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none">
                    <option value="">-- Seleccionar --</option>
                    {grades.filter(g => g.institucion_id === assignInstId).map(g => <option key={g.id} value={g.id}>{g.nombre} "{g.tipo_grado}"</option>)}
                  </select>
                </div>
                <button type="submit" className="w-full py-2.5 bg-q10-600 hover:bg-q10-700 text-white font-semibold rounded-xl text-sm transition-colors">Guardar Asignación</button>
              </form>
            )}
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Asignaciones Activas</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {filteredAssignments.map(a => (
                <div key={a.id} className="p-3 bg-white rounded-xl border border-gray-200 text-xs">
                  <span className="font-semibold text-gray-900 block">{getUserLabel(a.profesor_id)}</span>
                  <div className="mt-1 text-gray-500 flex justify-between">
                    <span>{getSubjectLabel(a.materia_id)}</span>
                    <span>{getGradeLabel(a.grado_id)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-q10-600" /> Matricular Estudiante
            </h3>
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">Institución</label>
              <select required value={studAssignInstId} onChange={e => { setStudAssignInstId(e.target.value); setStudAssignStudentId(''); setStudAssignGradeId(''); }} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none">
                <option value="">-- Seleccionar --</option>
                {institutions.map(inst => <option key={inst.id} value={inst.id}>{inst.nombre}</option>)}
              </select>
            </div>
            {studAssignInstId && (
              <form onSubmit={handleAssignStudent} className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Estudiante</label>
                  <select required value={studAssignStudentId} onChange={e => setStudAssignStudentId(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none">
                    <option value="">-- Seleccionar --</option>
                    {users.filter(u => u.rol === 'student' && u.institucion_id === studAssignInstId).map(s => <option key={s.id} value={s.id}>{s.nombre} {s.apellido}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Grado</label>
                  <select required value={studAssignGradeId} onChange={e => setStudAssignGradeId(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none">
                    <option value="">-- Seleccionar --</option>
                    {grades.filter(g => g.institucion_id === studAssignInstId).map(g => {
                      const enrolled = studentGrades.filter(sg => sg.grado_id === g.id).length;
                      const cupo = g.cupo_maximo || 30;
                      return <option key={g.id} value={g.id}>{g.nombre} "{g.tipo_grado}" ({enrolled}/{cupo})</option>;
                    })}
                  </select>
                </div>
                <button type="submit" className="w-full py-2.5 bg-q10-600 hover:bg-q10-700 text-white font-semibold rounded-xl text-sm transition-colors">Matricular</button>
              </form>
            )}
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Matrículas</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {studAssignInstId ? studentGrades.filter(sg => users.filter(u => u.rol === 'student' && u.institucion_id === studAssignInstId).some(su => su.id === sg.estudiante_id)).map(sg => (
                <div key={sg.id} className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-200 text-xs">
                  <span className="font-semibold text-gray-900">{getUserLabel(sg.estudiante_id)}</span>
                  <span className="px-2 py-0.5 rounded bg-q10-50 text-q10-600 font-medium">{getGradeLabel(sg.grado_id)}</span>
                </div>
              )) : <p className="text-sm text-gray-500 py-4 text-center">Selecciona una institución.</p>}
            </div>
          </div>
        </div>
      )}

      {/* User detail modal */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setViewUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-q10-500 to-indigo-600 rounded-t-2xl p-6 text-white">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {viewUser.nombre?.[0]}{viewUser.apellido?.[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{viewUser.nombre} {viewUser.apellido}</h3>
                    <p className="text-white/80 text-sm">{viewUser.email}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold ${viewUser.rol === 'admin' ? 'bg-amber-400/30 text-amber-100' : viewUser.rol === 'teacher' ? 'bg-emerald-400/30 text-emerald-100' : viewUser.rol === 'super_admin' ? 'bg-purple-400/30 text-purple-100' : 'bg-blue-400/30 text-blue-100'}`}>{viewUser.rol}</span>
                  </div>
                </div>
                <button onClick={() => setViewUser(null)} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 pt-4 border-t border-white/20">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-white/70" />
                  <div><div className="text-[10px] text-white/70">Identificación</div><div className="text-sm font-semibold">{viewUser.identificacion || 'N/R'}</div></div>
                </div>
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-white/70" />
                  <div><div className="text-[10px] text-white/70">Edad / Género</div><div className="text-sm font-semibold">{viewUser.fecha_nacimiento ? `${getAge(viewUser.fecha_nacimiento)} años` : 'N/R'} · {viewUser.genero || 'N/E'}</div></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${viewUser.activo ? 'bg-emerald-400/30 text-emerald-100' : 'bg-red-400/30 text-red-100'}`}>{viewUser.activo ? 'Activo' : 'Inactivo'}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-white/20">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-white/70" />
                  <div><div className="text-[10px] text-white/70">Credenciales de Acceso</div><div className="text-sm font-semibold">{viewUser.email}</div></div>
                </div>
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-white/70" />
                  <div><div className="text-[10px] text-white/70">Contraseña</div><div className="text-sm font-semibold">{userPasswords[viewUser.id] || 'No disponible'}</div></div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-3 pt-3 border-t border-white/20">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-white/70" />
                  <div><div className="text-[10px] text-white/70">EPS</div><div className="text-sm font-semibold">{viewUser.eps || 'N/R'}</div></div>
                </div>
                <div className="flex items-center gap-2">
                  <Droplet className="h-4 w-4 text-white/70" />
                  <div><div className="text-[10px] text-white/70">Tipo Sangre</div><div className="text-sm font-semibold">{viewUser.tipo_sangre || 'N/R'}</div></div>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-white/70" />
                  <div><div className="text-[10px] text-white/70">Institución</div><div className="text-sm font-semibold">{getInstName(viewUser.institucion_id)}</div></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-white/20">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-white/70" />
                  <div><div className="text-[10px] text-white/70">Contacto Emergencia</div><div className="text-sm font-semibold">
                    {viewUser.contacto_emergencia && viewUser.contacto_emergencia.nombre
                      ? `${viewUser.contacto_emergencia.nombre} (${viewUser.contacto_emergencia.relacion || 'N/R'}) - ${viewUser.contacto_emergencia.telefono || 'N/R'}`
                      : 'N/R'}
                  </div></div>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-white/70" />
                  <div><div className="text-[10px] text-white/70">Discapacidad</div><div className="text-sm font-semibold">{viewUser.discapacidad || 'Ninguna'}</div></div>
                </div>
              </div>
            </div>
            <div className="p-6 flex justify-end">
              <button onClick={() => setViewUser(null)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-sm transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};