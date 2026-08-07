import React from 'react';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  /** Clase de color del número, por ejemplo "text-emerald-600". */
  valueClassName?: string;
}

/** Tarjeta de métrica: rótulo en versalitas y cifra grande. */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  valueClassName = 'text-q10-600',
}) => (
  <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl">
    <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{label}</div>
    <div className={`text-3xl font-bold ${valueClassName} mt-2`}>{value}</div>
  </div>
);
