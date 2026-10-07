// shadcn base-nova source adapted for declaration-emitting ESM builds. Callers pass their own tone classes.
import { cn } from 'cn';
import type { ComponentProps, ReactElement } from 'react';

export function Badge({
  className,
  ...props
}: ComponentProps<'span'>): ReactElement {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        className,
      )}
      data-slot='badge'
      {...props}
    />
  );
}
