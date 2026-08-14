import React from 'react';

/** Envoltorio con desplazamiento horizontal para tablas anchas. */
export const TableWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">{children}</table>
  </div>
);

export const TableHead: React.FC<{ children: React.ReactNode; uppercase?: boolean }> = ({
  children,
  uppercase = false,
}) => (
  <thead>
    <tr className={`border-b border-gray-200 text-gray-500 text-xs font-semibold ${uppercase ? 'uppercase' : ''}`}>
      {children}
    </tr>
  </thead>
);

export const TableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tbody className="divide-y divide-gray-100 text-sm">{children}</tbody>
);
