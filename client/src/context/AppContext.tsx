import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export type Role = 'super_admin' | 'admin' | 'teacher' | 'student';

export interface ContactoEmergencia {
  nombre: string;
  telefono: string;
  relacion: string;
}

export interface User {
  id: string;
  email: string;
  rol: Role;
  nombre: string;
  apellido: string;
  identificacion?: string;
  genero?: string;
  fecha_nacimiento?: string;
  eps?: string;
  tipo_sangre?: string;
  contacto_emergencia?: ContactoEmergencia;
  discapacidad?: string;
  institucion_id: string | null;
  activo: boolean;
}

export interface Institution {
  id: string;
  nombre: string;
  subdominio: string;
  tipo: 'colegio' | 'universidad';
  nota_minima_aprobacion: number;
  activa: boolean;
}

interface AppContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  institutions: Institution[];
  users: User[];
  grades: any[];
  subjects: any[];
  assignments: any[];
  studentGrades: any[];
  attendance: any[];
  marks: any[];
  citations: any[];
  messages: any[];
  evaluations: any[];
  activeSubdomain: string | null;
  setSimulatedSubdomain: (subdomain: string | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshData: () => Promise<void>;
  currentInstitution: Institution | null;
  navigateToTab: string | null;
  setNavigateToTab: (tab: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const parseSubdomain = (): string | null => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || /^(\d+\.){3}\d+$/.test(hostname)) {
    return null;
  }
  const parts = hostname.split('.');
  if (parts.length > 2) {
    // Check if it's something like "colegiosanignacio.plataforma.com" -> "colegiosanignacio"
    return parts[0];
  }
  return null;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simulatedSubdomain, setSimulatedSubdomainState] = useState<string | null>(null);

  // DB States
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [studentGrades, setStudentGrades] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [citations, setCitations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [navigateToTab, setNavigateToTab] = useState<string | null>(null);

  // LocalStorage keys
  const USER_KEY = 'edu_platform_user';
  const SUBDOMAIN_KEY = 'edu_platform_subdomain';

  const activeSubdomain = parseSubdomain() || simulatedSubdomain;

  const setSimulatedSubdomain = (subdomain: string | null) => {
    setSimulatedSubdomainState(subdomain);
    if (subdomain) {
      localStorage.setItem(SUBDOMAIN_KEY, subdomain);
    } else {
      localStorage.removeItem(SUBDOMAIN_KEY);
    }
  };

  useEffect(() => {
    // Restore from localStorage
    const savedUser = localStorage.getItem(USER_KEY);
    const savedSubdomain = localStorage.getItem(SUBDOMAIN_KEY);
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (savedSubdomain) {
      setSimulatedSubdomainState(savedSubdomain);
    }
    
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [
        instList,
        userList,
        gradeList,
        subList,
        assignList,
        sgList,
        attList,
        markList,
        citList,
        msgList,
        evalList
      ] = await Promise.all([
        api.getInstitutions(),
        api.getUsers(),
        api.getGrades(),
        api.getSubjects(),
        api.getAssignments(),
        api.getStudentGrades(),
        api.getAttendance(),
        api.getMarks(),
        api.getCitations(),
        api.getMessages(),
        api.getEvaluations()
      ]);

      setInstitutions(instList);
      setUsers(userList);
      setGrades(gradeList);
      setSubjects(subList);
      setAssignments(assignList);
      setStudentGrades(sgList);
      setAttendance(attList);
      setMarks(markList);
      setCitations(citList);
      setMessages(msgList);
      setEvaluations(evalList);
    } catch (err: any) {
      console.error('Failed to load initial data from JSON Server:', err);
      setError('No se pudo conectar con el servidor API. Verifica que npm run server esté activo.');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await loadInitialData();
  };

  const currentInstitution = institutions.find(inst => inst.subdominio === activeSubdomain) || null;

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      // Wait for a fresh list of users in case one was just created
      const freshUsers = await api.getUsers();
      setUsers(freshUsers);

      const foundUser = freshUsers.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (!foundUser) {
        setError('Credenciales inválidas. Inténtalo de nuevo.');
        return false;
      }

      if (!foundUser.activo) {
        setError('Tu cuenta está desactivada. Contacta al administrador.');
        return false;
      }

      // If user is not super_admin, they must match the active institution
      if (foundUser.rol !== 'super_admin') {
        const userInstitution = institutions.find(inst => inst.id === foundUser.institucion_id);
        
        // If we are simulating or reading a subdomain, check if it matches
        if (activeSubdomain && userInstitution?.subdominio !== activeSubdomain) {
          setError(`Este usuario pertenece a ${userInstitution?.nombre || 'otra institución'} y no al subdominio actual.`);
          return false;
        }

        // Check if institution is active
        if (userInstitution && !userInstitution.activa) {
          setError('La institución asociada está desactivada.');
          return false;
        }

        // If there's no active subdomain on localhost, auto-select the user's subdomain
        if (!activeSubdomain && userInstitution) {
          setSimulatedSubdomain(userInstitution.subdominio);
        }
      } else {
        // Super admin cannot log in to an institution subdomain directly, or rather they manage all.
        // It's recommended to view it under superadmin context
        if (activeSubdomain) {
          setError('El Super Administrador solo puede iniciar sesión en el portal general/administración.');
          return false;
        }
      }

      setUser(foundUser);
      localStorage.setItem(USER_KEY, JSON.stringify(foundUser));
      return true;
    } catch (err) {
      setError('Error al intentar iniciar sesión.');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
    // Don't clear simulatedSubdomain so the user remains on the same virtual subdomain for testing
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        error,
        institutions,
        users,
        grades,
        subjects,
        assignments,
        studentGrades,
        attendance,
        marks,
        citations,
        messages,
        evaluations,
        activeSubdomain,
        setSimulatedSubdomain,
        login,
        logout,
      refreshData,
      currentInstitution,
      navigateToTab,
      setNavigateToTab
    }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
