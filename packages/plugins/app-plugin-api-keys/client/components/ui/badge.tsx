// shadcn source adapted for declaration-emitting ESM builds.
import type { ComponentProps, ReactElement } from 'react';

import { cn } from 'cn';

export type BadgeProps = ComponentProps<'span'> & {
  readonly variant?: 'default' | 'secondary';
};

export function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps): ReactElement {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variant === 'default'
          ? 'bg-primary text-primary-foreground'
          : 'bg-secondary text-secondary-foreground',
        className,
      )}
      {...props}
    />
  );
}
