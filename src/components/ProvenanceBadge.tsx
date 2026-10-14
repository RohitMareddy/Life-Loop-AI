import React from 'react';
import { ProvenanceTag } from '../types';

interface Props {
  tag: ProvenanceTag;
  className?: string;
}

export const ProvenanceBadge: React.FC<Props> = ({ tag, className = '' }) => {
  const configs: Record<ProvenanceTag, { label: string; bg: string; text: string; border: string }> = {
    USER_PROVIDED: {
      label: 'User Provided',
      bg: 'bg-stone-50',
      text: 'text-stone-700',
      border: 'border-stone-200',
    },
    AI_EXTRACTED: {
      label: 'AI Extracted',
      bg: 'bg-emerald-50/70',
      text: 'text-emerald-800',
      border: 'border-emerald-200/80',
    },
    CALCULATED: {
      label: 'Calculated Metric',
      bg: 'bg-sky-50/70',
      text: 'text-sky-800',
      border: 'border-sky-200/80',
    },
    INFERRED: {
      label: 'Inferred',
      bg: 'bg-amber-50/70',
      text: 'text-amber-800',
      border: 'border-amber-200/80',
    },
    REQUIRES_VERIFICATION: {
      label: 'Requires Verification',
      bg: 'bg-rose-50/70',
      text: 'text-rose-800',
      border: 'border-rose-200/80',
    },
  };

  const c = configs[tag] || configs.CALCULATED;

  return (
    <span
      className={`inline-flex items-center text-[11px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded border ${c.bg} ${c.text} ${c.border} ${className}`}
      title={`Provenance: ${c.label}`}
    >
      {c.label}
    </span>
  );
};
