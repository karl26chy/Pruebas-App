/* eslint react-refresh/only-export-components: "off" */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setAuthToken, getAuthToken } from '../services/api';
import type {
  Role,
  ContactoEmergencia,
  User,
  Institution,
  Grade,
  Subject,
  Assignment,
  StudentGrade,
  Attendance,
  Mark,
  Citation,
  Message,
  Evaluation,
} from '../types';

export type { Role, ContactoEmergencia, User, Institution };

interface AppContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  institutions: Institution[];
  users: User[];
  grades: Grade[];
  subjects: Subject[];
  assignments: Assignment[];
  studentGrades: StudentGrade[];
  attendance: Attendance[];
  marks: Mark[];
  citations: Citation[];
  messages: Message[];
  evaluations: Evaluation[];
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
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
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
    const handleUnauthorized = () => {
      setUser(null);
      localStorage.removeItem(USER_KEY);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        setLoading(true);
        setError(null);

        const savedSubdomain = localStorage.getItem(SUBDOMAIN_KEY);
        if (savedSubdomain) {
          setSimulatedSubdomainState(savedSubdomain);
        }

        let hasSession = false;
        const savedToken = getAuthToken();
        if (savedToken) {
          try {
            const me = await api.getMe();
            setUser(me);
            localStorage.setItem(USER_KEY, JSON.stringify(me));
            hasSession = true;
          } catch {
            setAuthToken(null);
            localStorage.removeItem(USER_KEY);
            setUser(null);
          }
        }

        const instList = await api.getInstitutions();
        setInstitutions(instList);

        if (hasSession) {
          const [userList, gradeList, subList, assignList, sgList, attList, markList, citList, msgList, evalList] =
            await Promise.all([
              api.getUsers(),
              api.getGrades(),
              api.getSubjects(),
              api.getAssignments(),
              api.getStudentGrades(),
              api.getAttendance(),
              api.getMarks(),
              api.getCitations(),
              api.getMessages(),
              api.getEvaluations(),
            ]);

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
        }
      } catch (err: unknown) {
        console.error('Failed to load data from API:', err);
        setError('No se pudo conectar con el servidor API. Verifica que el backend esté activo.');
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const loadInitialData = useCallback(async () => {
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
    } catch (err: unknown) {
      console.error('Failed to load initial data:', err);
      setError('No se pudo conectar con el servidor API. Verifica que el backend esté activo.');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

  const currentInstitution = institutions.find(inst => inst.subdominio === activeSubdomain) || null;

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      const { token, user } = await api.login(email, password);
      setAuthToken(token);

      const userInstitution = institutions.find(inst => inst.id === user.institucion_id);

      if (user.rol !== 'super_admin') {
        if (activeSubdomain && userInstitution?.subdominio !== activeSubdomain) {
          setError(`Este usuario pertenece a ${userInstitution?.nombre || 'otra institución'} y no al subdominio actual.`);
          setAuthToken(null);
          setUser(null);
          return false;
        }

        if (userInstitution && !userInstitution.activa) {
          setError('La institución asociada está desactivada.');
          setAuthToken(null);
          setUser(null);
          return false;
        }

        if (!activeSubdomain && userInstitution) {
          setSimulatedSubdomain(userInstitution.subdominio);
        }
      } else {
        if (activeSubdomain) {
          setError('El Super Administrador solo puede iniciar sesión en el portal general/administración.');
          setAuthToken(null);
          setUser(null);
          return false;
        }
      }

      setUser(user);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      await loadInitialData();
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al intentar iniciar sesión.');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
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
