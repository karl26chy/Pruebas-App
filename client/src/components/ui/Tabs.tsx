import React from 'react';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  /** Contador opcional que se pinta como globo rojo. */
  badge?: number;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  /** Los paneles con muchas pestañas permiten desplazamiento horizontal. */
  scrollable?: boolean;
  /**
   * Color del borde de la pestaña activa. El portal del estudiante usa
   * históricamente indigo en lugar del azul corporativo.
   */
  activeBorderClass?: string;
  className?: string;
}

export function Tabs<T extends string>({
  items,
  active,
  onChange,
  scrollable = false,
  activeBorderClass = 'border-q10-500',
  className = '',
}: TabsProps<T>) {
  return (
    <div className={`flex border-b border-gray-200 ${scrollable ? 'gap-1.5 overflow-x-auto' : 'gap-2'} ${className}`}>
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            scrollable ? 'shrink-0' : ''
          } ${
            active === item.id
              ? `${activeBorderClass} text-q10-600`
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          {item.icon}
          {item.label}
          {item.badge !== undefined && item.badge > 0 && (
            <span className="ml-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {item.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
