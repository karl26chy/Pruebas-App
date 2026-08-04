import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { ShieldAlert, RefreshCw } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, loading, error, refreshData } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-900">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-10 w-10 text-q10-500 animate-spin" />
          <span className="text-sm font-medium text-gray-500">Cargando datos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-6 shadow-sm text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-red-50 border border-red-200 rounded-full text-red-600">
              <ShieldAlert className="h-8 w-8" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Error de Conexión</h2>
          <p className="text-sm text-gray-500">
            {error}
          </p>
          <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded-lg border border-gray-200 text-left font-mono">
            ¿Cómo solucionarlo?<br />
            1. Verifica que el backend esté corriendo.<br />
            2. Local: ejecuta 'npm run dev' en la carpeta 'api' (con PostgreSQL activo).<br />
            3. Producción: 'docker compose up -d' en la raíz del proyecto.<br />
            4. Recarga esta página.
          </div>
          <button
            onClick={() => refreshData()}
            className="w-full py-2.5 bg-q10-600 hover:bg-q10-700 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Reintentar Conexión
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Render dashboard based on role
  const renderDashboard = () => {
    switch (user.rol) {
      case 'super_admin':
        return <SuperAdminDashboard />;
      case 'admin':
        return <AdminDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      case 'student':
        return <StudentDashboard />;
      default:
        return (
          <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Rol Desconocido</h3>
            <p className="text-gray-500 text-sm">El rol "{user.rol}" no está configurado.</p>
          </div>
        );
    }
  };

  return <Layout>{renderDashboard()}</Layout>;
};

function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}

export default App;
