import React from 'react';

/** Estilos compartidos por los controles de formulario. */
export const INPUT =
  'w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none';

export const INPUT_LARGE =
  'w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-q10-500/50';

export const PRIMARY_BUTTON =
  'py-2.5 bg-q10-600 hover:bg-q10-700 text-white font-semibold rounded-xl text-sm transition-colors';

export const SECONDARY_BUTTON =
  'px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-xl text-sm transition-colors';

interface FieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

/** Etiqueta pequeña sobre un control. */
export const Field: React.FC<FieldProps> = ({ label, children, className = '' }) => (
  <div className={className}>
    <label className="block text-xs text-gray-500 mb-1">{label}</label>
    {children}
  </div>
);
