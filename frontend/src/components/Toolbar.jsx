import React from 'react';

export default function Avatar({ name = '?', color = '#7c5cf0', size = 32, ring = false, className = '' }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      title={name}
      className={`flex items-center justify-center rounded-full font-semibold text-white shrink-0 ${ring ? 'ring-2 ring-white dark:ring-ink-800' : ''} ${className}`}
      style={{ backgroundColor: color, width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
}
