import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { LogOut, User as UserIcon, Building2, Bell } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, currentInstitution, activeSubdomain, messages, setNavigateToTab } = useApp();

  const unreadMessages = useMemo(() => {
    if (!user) return 0;
    return messages.filter(m => m.destinatario_id === user.id && !m.leido).length;
  }, [messages, user]);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin':
        return { text: 'Super Administrador', bg: 'bg-red-50 text-red-600 border-red-200' };
      case 'admin':
        return { text: 'Administrador', bg: 'bg-amber-50 text-amber-600 border-amber-200' };
      case 'teacher':
        return { text: 'Docente', bg: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
      case 'student':
        return { text: 'Estudiante', bg: 'bg-blue-50 text-blue-600 border-blue-200' };
      default:
        return { text: role, bg: 'bg-gray-100 text-gray-500 border-gray-200' };
    }
  };

  const roleDetails = user ? getRoleLabel(user.rol) : { text: '', bg: '' };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-q10-50 border border-q10-200 rounded-xl text-q10-600">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-md font-bold text-gray-900 leading-tight">
              {currentInstitution ? currentInstitution.nombre : 'Portal General'}
            </h1>
            {activeSubdomain && (
              <span className="text-[11px] font-medium text-gray-500">
                {activeSubdomain}.plataforma.com
              </span>
            )}
          </div>
        </div>

        {/* Notifications & User profile */}
        {user && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => setNavigateToTab('messages')}
              className="relative p-2 bg-gray-100 hover:bg-q10-50 border border-gray-200 hover:border-q10-200 text-gray-500 hover:text-q10-600 rounded-xl transition-all"
              title="Mensajes"
            >
              <Bell className="h-5 w-5" />
              {unreadMessages > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </button>
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-semibold text-gray-800">
                {user.nombre} {user.apellido}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${roleDetails.bg}`}>
                {roleDetails.text}
              </span>
            </div>

            <div className="h-9 w-9 bg-gray-100 rounded-full flex items-center justify-center border border-gray-300 text-q10-600">
              <UserIcon className="h-5 w-5" />
            </div>

            <button
              onClick={logout}
              className="p-2 bg-gray-100 hover:bg-red-50 border border-gray-200 hover:border-red-200 text-gray-500 hover:text-red-600 rounded-xl transition-all"
              title="Cerrar sesión"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        )}
      </header>

      {/* Main workspace */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-4 text-center text-[11px] text-gray-400">
        &copy; {new Date().getFullYear()} Plataforma Educativa Multi-Institución. Entorno de Desarrollo Local.
      </footer>
    </div>
  );
};
