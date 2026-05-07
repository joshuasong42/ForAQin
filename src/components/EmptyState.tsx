'use client';

import { ReactNode } from 'react';

export default function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {icon && <div className="mb-3 text-text-muted">{icon}</div>}
      <div className="font-serif text-lg text-text-primary mb-1">{title}</div>
      {description && <div className="text-sm text-text-muted mb-4 max-w-sm leading-relaxed">{description}</div>}
      {action}
    </div>
  );
}
