import React from 'react';
import {
  AlertCircle, Building2, CreditCard, Droplet, Heart, Key, Mail, Phone,
  User as UserIcon, X,
} from 'lucide-react';
import { getAge } from '../../../lib/people';
import type { User } from '../../../types';

const ROL_BADGE: Record<string, string> = {
  admin: 'bg-amber-400/30 text-amber-100',
  teacher: 'bg-emerald-400/30 text-emerald-100',
  super_admin: 'bg-purple-400/30 text-purple-100',
  student: 'bg-blue-400/30 text-blue-100',
};

interface UserDetailModalProps {
  user: User;
  /** Contraseña en claro recordada en esta sesión, si la hay. */
  password?: string;
  institutionName: string;
  onClose: () => void;
}

const Item: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({
  icon, label, children,
}) => (
  <div className="flex items-center gap-2">
    {icon}
    <div>
      <div className="text-[10px] text-white/70">{label}</div>
      <div className="text-sm font-semibold">{children}</div>
    </div>
  </div>
);

/** Ficha completa de un usuario de cualquier institución. */
export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user, password, institutionName, onClose,
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      onClick={e => e.stopPropagation()}
    >
      <div className="bg-gradient-to-r from-q10-500 to-indigo-600 rounded-t-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {user.nombre?.[0]}{user.apellido?.[0]}
            </div>
            <div>
              <h3 className="text-xl font-bold">{user.nombre} {user.apellido}</h3>
              <p className="text-white/80 text-sm">{user.email}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold ${ROL_BADGE[user.rol] || ROL_BADGE.student}`}>
                {user.rol}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 pt-4 border-t border-white/20">
          <Item icon={<CreditCard className="h-4 w-4 text-white/70" />} label="Identificación">
            {user.identificacion || 'N/R'}
          </Item>
          <Item icon={<UserIcon className="h-4 w-4 text-white/70" />} label="Edad / Género">
            {user.fecha_nacimiento ? `${getAge(user.fecha_nacimiento)} años` : 'N/R'} · {user.genero || 'N/E'}
          </Item>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
              user.activo ? 'bg-emerald-400/30 text-emerald-100' : 'bg-red-400/30 text-red-100'
            }`}>
              {user.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-white/20">
          <Item icon={<Mail className="h-4 w-4 text-white/70" />} label="Credenciales de Acceso">
            {user.email}
          </Item>
          <Item icon={<Key className="h-4 w-4 text-white/70" />} label="Contraseña">
            {password || 'No disponible'}
          </Item>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-3 pt-3 border-t border-white/20">
          <Item icon={<Heart className="h-4 w-4 text-white/70" />} label="EPS">
            {user.eps || 'N/R'}
          </Item>
          <Item icon={<Droplet className="h-4 w-4 text-white/70" />} label="Tipo Sangre">
            {user.tipo_sangre || 'N/R'}
          </Item>
          <Item icon={<Building2 className="h-4 w-4 text-white/70" />} label="Institución">
            {institutionName}
          </Item>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-white/20">
          <Item icon={<Phone className="h-4 w-4 text-white/70" />} label="Contacto Emergencia">
            {user.contacto_emergencia && user.contacto_emergencia.nombre
              ? `${user.contacto_emergencia.nombre} (${user.contacto_emergencia.relacion || 'N/R'}) - ${user.contacto_emergencia.telefono || 'N/R'}`
              : 'N/R'}
          </Item>
          <Item icon={<AlertCircle className="h-4 w-4 text-white/70" />} label="Discapacidad">
            {user.discapacidad || 'Ninguna'}
          </Item>
        </div>
      </div>

      <div className="p-6 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-sm transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
);
