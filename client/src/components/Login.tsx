import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, GraduationCap, Building2, Key, Mail } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, institutions, activeSubdomain, setSimulatedSubdomain, error } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    await login(email, password);
    setLoading(false);
  };

  const autofill = (emailVal: string, passVal: string) => {
    setEmail(emailVal);
    setPassword(passVal);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-q10-900 via-q10-800 to-q10-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center">
          <div className="p-3 bg-q10-50 border border-q10-200 rounded-2xl text-q10-600">
            <GraduationCap className="h-12 w-12" />
          </div>
        </div>
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">
          Plataforma Educativa
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Inicia sesión para acceder a tu panel institucional
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        {/* Subdomain / Virtual Institution Selector for Testing */}
        <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <label className="block text-xs font-semibold uppercase tracking-wider text-q10-600 mb-3 flex items-center gap-1.5">
            <Building2 className="h-4 w-4" /> Entorno de Pruebas (Simulador de Subdominios)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => {
                setSimulatedSubdomain(null);
                autofill('super@admin.com', 'password123');
              }}
              className={`p-3 text-xs rounded-xl font-medium border text-left transition-all ${
                activeSubdomain === null
                  ? 'bg-q10-50 border-q10-500 text-q10-500'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-800'
              }`}
            >
              <span className="font-bold block text-gray-900 text-[13px] mb-0.5">Super Admin Portal</span>
              admin.plataforma.com
            </button>
            {institutions.map(inst => (
              <button
                key={inst.id}
                onClick={() => {
                  setSimulatedSubdomain(inst.subdominio);
                  // Autofill based on institution and standard emails
                  if (inst.subdominio === 'colegiosanignacio') {
                    autofill('admin@sanignacio.com', 'password123');
                  } else if (inst.subdominio === 'udea') {
                    autofill('admin@udea.edu.co', 'password123');
                  } else {
                    autofill('', '');
                  }
                }}
                className={`p-3 text-xs rounded-xl font-medium border text-left transition-all relative overflow-hidden ${
                  activeSubdomain === inst.subdominio
                    ? 'bg-q10-50 border-q10-500 text-q10-500'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-800'
                } ${!inst.activa ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {!inst.activa && (
                  <span className="absolute top-1 right-1 bg-red-100 text-red-600 px-1 py-0.5 rounded text-[8px]">
                    Inactiva
                  </span>
                )}
                <span className="font-bold block text-gray-900 text-[13px] mb-0.5 truncate">{inst.nombre}</span>
                {inst.subdominio}.plataforma.com
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-gray-400">
            * Haz clic en una tarjeta de arriba para simular que estás navegando desde ese subdominio de la institución y auto-rellenar las credenciales de administrador correspondientes.
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white border border-gray-200 rounded-2xl py-8 px-4 shadow-sm sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo Electrónico
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-q10-500/50 focus:border-q10-500 transition-colors"
                  placeholder="ejemplo@plataforma.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Key className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-q10-500/50 focus:border-q10-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-q10-600 hover:bg-q10-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-q10-500 transition-colors disabled:opacity-50"
              >
                {loading ? 'Iniciando sesión...' : 'Ingresar a la Plataforma'}
              </button>
            </div>
          </form>

          {/* Quick Access Credentials Panel */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Shield className="h-4 w-4" /> Cuentas de Demostración Disponibles
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {activeSubdomain === null ? (
                <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs">
                  <div>
                    <span className="font-semibold text-gray-900 block">Carlos Gómez (Super Admin)</span>
                    <span className="text-gray-500 text-[11px]">super@admin.com</span>
                  </div>
                  <button
                    onClick={() => autofill('super@admin.com', 'password123')}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-q10-500 hover:text-q10-700 rounded transition-colors"
                  >
                    Usar
                  </button>
                </div>
              ) : activeSubdomain === 'colegiosanignacio' ? (
                <>
                  <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs">
                    <div>
                      <span className="font-semibold text-gray-900 block">Beatriz Pérez (Admin San Ignacio)</span>
                      <span className="text-gray-500 text-[11px]">admin@sanignacio.com</span>
                    </div>
                    <button
                      onClick={() => autofill('admin@sanignacio.com', 'password123')}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-q10-500 hover:text-q10-700 rounded transition-colors"
                    >
                      Usar
                    </button>
                  </div>
                  <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs">
                    <div>
                      <span className="font-semibold text-gray-900 block">Luis Alvarez (Prof. Sociales)</span>
                      <span className="text-gray-500 text-[11px]">luis.sociales@sanignacio.com</span>
                    </div>
                    <button
                      onClick={() => autofill('luis.sociales@sanignacio.com', 'password123')}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-q10-500 hover:text-q10-700 rounded transition-colors"
                    >
                      Usar
                    </button>
                  </div>
                  <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs">
                    <div>
                      <span className="font-semibold text-gray-900 block">Marta López (Prof. Matemáticas)</span>
                      <span className="text-gray-500 text-[11px]">marta.mates@sanignacio.com</span>
                    </div>
                    <button
                      onClick={() => autofill('marta.mates@sanignacio.com', 'password123')}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-q10-500 hover:text-q10-700 rounded transition-colors"
                    >
                      Usar
                    </button>
                  </div>
                  <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs">
                    <div>
                      <span className="font-semibold text-gray-900 block">Mateo Ramírez (Estudiante 6to)</span>
                      <span className="text-gray-500 text-[11px]">estudiante1@sanignacio.com</span>
                    </div>
                    <button
                      onClick={() => autofill('estudiante1@sanignacio.com', 'password123')}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-q10-500 hover:text-q10-700 rounded transition-colors"
                    >
                      Usar
                    </button>
                  </div>
                  <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs">
                    <div>
                      <span className="font-semibold text-gray-900 block">Sofía Díaz (Estudiante 6to)</span>
                      <span className="text-gray-500 text-[11px]">estudiante2@sanignacio.com</span>
                    </div>
                    <button
                      onClick={() => autofill('estudiante2@sanignacio.com', 'password123')}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-q10-500 hover:text-q10-700 rounded transition-colors"
                    >
                      Usar
                    </button>
                  </div>
                </>
              ) : activeSubdomain === 'udea' ? (
                <>
                  <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs">
                    <div>
                      <span className="font-semibold text-gray-900 block">Juan Restrepo (Admin UdeA)</span>
                      <span className="text-gray-500 text-[11px]">admin@udea.edu.co</span>
                    </div>
                    <button
                      onClick={() => autofill('admin@udea.edu.co', 'password123')}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-q10-500 hover:text-q10-700 rounded transition-colors"
                    >
                      Usar
                    </button>
                  </div>
                  <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs">
                    <div>
                      <span className="font-semibold text-gray-900 block">Ricardo Franco (Prof. Cálculo)</span>
                      <span className="text-gray-500 text-[11px]">prof.calculo@udea.edu.co</span>
                    </div>
                    <button
                      onClick={() => autofill('prof.calculo@udea.edu.co', 'password123')}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-q10-500 hover:text-q10-700 rounded transition-colors"
                    >
                      Usar
                    </button>
                  </div>
                  <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs">
                    <div>
                      <span className="font-semibold text-gray-900 block">Daniel Ochoa (Estudiante Cálculo)</span>
                      <span className="text-gray-500 text-[11px]">estudiante.calculo@udea.edu.co</span>
                    </div>
                    <button
                      onClick={() => autofill('estudiante.calculo@udea.edu.co', 'password123')}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-q10-500 hover:text-q10-700 rounded transition-colors"
                    >
                      Usar
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-gray-400 text-xs py-2">Selecciona un subdominio válido de prueba.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
