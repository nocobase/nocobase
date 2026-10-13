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

/**
 * Quiet semantic status labels; reserve solid primary fills for actions. `size='sm'` is the small badge, for a status
 * beside a title or on a dense card (`data-size` in `client/styles.css`).
 */
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
      className={cn(tones[tone], className)}
    />
  );
}
