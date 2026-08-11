import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal, PRIMARY_BUTTON, SECONDARY_BUTTON } from '../../ui';

interface PeriodConfirmModalProps {
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
  danger?: boolean;
}

/** Confirmación de acciones de periodos (abrir, cerrar, eliminar). */
export const PeriodConfirmModal: React.FC<PeriodConfirmModalProps> = ({
  title,
  message,
  confirmLabel,
  onCancel,
  onConfirm,
  busy = false,
  danger = false,
}) => (
  <Modal onClose={onCancel} size="sm">
    <div className="text-center">
      <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-3">
        <AlertTriangle className="h-6 w-6 text-amber-500" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
    <div className="flex gap-3 pt-2">
      <button
        type="button" onClick={onCancel} disabled={busy}
        className={`flex-1 ${SECONDARY_BUTTON} disabled:opacity-60`}
      >
        Cancelar
      </button>
      <button
        type="button" onClick={onConfirm} disabled={busy}
        className={`flex-1 disabled:opacity-60 ${
          danger
            ? 'py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition-colors'
            : PRIMARY_BUTTON
        }`}
      >
        {busy ? 'Procesando...' : confirmLabel}
      </button>
    </div>
  </Modal>
);
