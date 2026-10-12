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

/** Quiet semantic status labels; reserve solid primary fills for actions. */
export function StatusBadge({
  tone = 'neutral',
  className,
  ...props
}: Omit<ComponentProps<typeof Badge>, 'variant'> & {
  readonly tone?: keyof typeof tones;
}): ReactElement {
  return (
    <Badge
      {...props}
      variant='outline'
      className={cn(tones[tone], className)}
    />
  );
}
