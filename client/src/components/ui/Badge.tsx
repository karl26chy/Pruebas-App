import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

/** Etiqueta de estado. El color se pasa por clases desde quien la usa. */
export const Badge: React.FC<BadgeProps> = ({ children, className = '' }) => (
  <span className={`px-2 py-0.5 rounded text-xs font-medium ${className}`}>{children}</span>
);

interface StatusBadgeProps {
  passing: boolean;
  children: React.ReactNode;
}

/** Verde si cumple, rojo si no: aprobado/reprobado, activo/inactivo… */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ passing, children }) => (
  <span
    className={`px-2 py-0.5 rounded text-[11px] font-medium ${
      passing ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
    }`}
  >
    {children}
  </span>
);
