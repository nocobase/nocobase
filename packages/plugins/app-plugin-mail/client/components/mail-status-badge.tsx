import type { ReactElement } from 'react';

export type MailStatusTone =
  'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface MailStatusBadgeProps {
  readonly label: string;
  readonly tone?: MailStatusTone;
}

const toneClasses: Readonly<Record<MailStatusTone, string>> = {
  neutral: 'border-border bg-muted text-muted-foreground',
  success: 'border-primary/30 bg-primary/10 text-primary',
  warning: 'border-accent bg-accent text-accent-foreground',
  danger: 'border-destructive/30 bg-destructive/10 text-destructive',
  info: 'border-secondary bg-secondary text-secondary-foreground',
};

export function MailStatusBadge({
  label,
  tone = 'neutral',
}: MailStatusBadgeProps): ReactElement {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}
