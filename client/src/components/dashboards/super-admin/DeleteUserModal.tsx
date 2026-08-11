import React from 'react';
import { Trash2 } from 'lucide-react';
import type { User } from '../../../types';

interface DeleteUserModalProps {
  user: User;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Confirmación de borrado de usuario. */
export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ user, onCancel, onConfirm }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    onClick={onCancel}
  >
    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
      <div className="p-6 text-center">
        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <Trash2 className="h-6 w-6 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar Usuario</h3>
        <p className="text-sm text-gray-500">
          ¿Estás seguro de eliminar a <strong>{user.nombre} {user.apellido}</strong>?
        </p>
        <p className="text-xs text-red-500 mt-2">Esta acción no se puede deshacer.</p>
      </div>
      <div className="px-6 pb-6 flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition-colors"
        >
          Eliminar
        </button>
      </div>
    </div>
  </div>
);
