'use client';

import React from 'react';

export type Stats = {
  id: string;
  label: string;
  value: string | number;
};

const GRID_COLS_MAP: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-3',
};

export function QuickStats({ stats = [] }: { stats?: Stats[] }) {
  if (stats.length === 0) {
    return (
      <div className="card p-4 text-center">
        <p className="text-sm text-ink-500">No statistics available yet.</p>
      </div>
    );
  }

  const count = Math.max(1, Math.min(stats.length, 3));
  const gridClass = GRID_COLS_MAP[count] ?? 'grid-cols-1 sm:grid-cols-3';

  return (
    <div className={`grid ${gridClass} gap-3`}>
      {stats.map((s) => (
        <div key={s.id} className="card p-3 text-center">
          <div className="text-sm text-ink-500">{s.label}</div>
          <div className="text-lg font-semibold text-ink-900 mt-1">{s.value}</div>
        </div>
      ))}
    </div>
  );
}

export default QuickStats;
