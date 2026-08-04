export type Role = 'super_admin' | 'admin' | 'teacher' | 'student';

export interface ContactoEmergencia {
  nombre: string;
  telefono: string;
  relacion: string;
}

export interface Institution {
  id: string;
  nombre: string;
  subdominio: string;
  tipo: 'colegio' | 'universidad';
  nota_minima_aprobacion: number;
  activa: boolean;
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

export interface Grade {
  id: string;
  institucion_id: string;
  nombre: string;
  tipo_grado: string;
  cupo_maximo: number;
}

export interface Subject {
  id: string;
  nombre: string;
  descripcion: string;
}

export interface Assignment {
  id: string;
  profesor_id: string;
  materia_id: string;
  grado_id: string;
  institucion_id: string;
}

export interface StudentGrade {
  id: string;
  estudiante_id: string;
  grado_id: string;
}

export interface Attendance {
  id: string;
  estudiante_id: string;
  materia_id: string;
  grado_id: string;
  fecha: string;
  estado: 'presente' | 'ausente' | 'tardanza';
  registrado_por: string;
}

export interface Mark {
  id: string;
  estudiante_id: string;
  materia_id: string;
  grado_id: string;
  evaluacion_id: string;
  tipo_evaluacion: string;
  fecha_evaluacion: string;
  porcentaje: number;
  nota: number;
  periodo: string;
  registrado_por: string;
}

export interface Citation {
  id: string;
  estudiante_id: string;
  materia_id: string;
  fecha_citacion: string;
  motivo: string;
  estado: 'pendiente' | 'realizada' | 'cancelada';
  creado_por: string;
}

export interface Message {
  id: string;
  remitente_id: string;
  destinatario_id: string;
  materia_id: string | null;
  asunto: string;
  cuerpo: string;
  leido: boolean;
  created_at: string;
}

export interface Evaluation {
  id: string;
  institucion_id: string;
  materia_id: string;
  grado_id: string;
  nombre: string;
  fecha_evaluacion: string;
  porcentaje: number;
  periodo: string;
  creado_por: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
