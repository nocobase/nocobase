import type { ComponentProps, ReactElement } from 'react';
import { cn } from 'cn';
import { Badge } from '#components/ui/badge';

const tones = {
  neutral: 'border-border bg-muted text-muted-foreground',
  info: 'border-primary/15 bg-primary/8 text-primary',
  warning:
    'border-(--status-warning)/20 bg-(--status-warning-background) text-(--status-warning)',
  success:
    'border-(--status-success)/20 bg-(--status-success-background) text-(--status-success)',
};

/** Quiet semantic status labels with self-contained compact sizing. */
export function StatusBadge({
  tone = 'neutral',
  size,
  className,
  ...props
}: Omit<ComponentProps<typeof Badge>, 'variant'> & {
  readonly tone?: keyof typeof tones;
  readonly size?: 'sm';
}): ReactElement {
  return (
    <Badge
      {...props}
      data-size={size}
      variant='outline'
      className={cn(
        tones[tone],
        size === 'sm' && 'min-h-5.5 px-1.5 py-0 text-xs leading-[1.3]',
        className,
      )}
    />
  );
}
