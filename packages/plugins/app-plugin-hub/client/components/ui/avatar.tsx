// shadcn source adapted for declaration-emitting ESM builds.
import type { ComponentProps, ReactElement } from 'react';

import { cn } from 'cn';

export function Avatar({
  className,
  ...props
}: ComponentProps<'span'>): ReactElement {
  return (
    <span
      data-slot='avatar'
      className={cn(
        'relative flex size-10 shrink-0 overflow-hidden rounded-xl',
        className,
      )}
      {...props}
    />
  );
}

export function AvatarFallback({
  className,
  ...props
}: ComponentProps<'span'>): ReactElement {
  return (
    <span
      data-slot='avatar-fallback'
      className={cn(
        'flex size-full items-center justify-center bg-muted text-sm font-medium text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}
