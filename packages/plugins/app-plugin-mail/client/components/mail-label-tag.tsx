import type { ReactElement } from 'react';

import type { MailLabel, MailLabelColor } from '../mail-client.js';
import { cn } from '../lib/utils.js';
import { getMailLabelColorStyles } from '../lib/mail-label.js';

export interface MailLabelTagProps {
  readonly label: Pick<MailLabel, 'name' | 'color'>;
  readonly className?: string;
  readonly size?: 'sm' | 'md';
}

export function MailLabelTag({
  label,
  className,
  size = 'sm',
}: MailLabelTagProps): ReactElement {
  const styles = getMailLabelColorStyles(label.color);
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full border font-medium',
        styles.tag,
        size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]',
        className,
      )}
      title={label.name}
    >
      <span
        aria-hidden='true'
        className={cn('size-1.5 shrink-0 rounded-full', styles.dot)}
      />
      <span className='min-w-0 truncate'>{label.name}</span>
    </span>
  );
}

export interface MailLabelColorDotProps {
  readonly color: MailLabelColor;
  readonly className?: string;
  readonly size?: 'sm' | 'md';
}

export function MailLabelColorDot({
  color,
  className,
  size = 'sm',
}: MailLabelColorDotProps): ReactElement {
  const styles = getMailLabelColorStyles(color);
  return (
    <span
      aria-hidden='true'
      className={cn(
        'shrink-0 rounded-full',
        size === 'md' ? 'size-2.5' : 'size-2',
        styles.dot,
        className,
      )}
    />
  );
}
