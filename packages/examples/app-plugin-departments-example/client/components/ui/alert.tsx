// shadcn source adapted for declaration-emitting ESM builds.
import type { ComponentProps, ReactElement } from 'react';

import { cn } from 'cn';

export function Alert({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot='alert'
      role='alert'
      className={cn(
        'relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg border px-4 py-3 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5',
        className,
      )}
      {...props}
    />
  );
}

export function AlertTitle({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot='alert-title'
      className={cn('col-start-2 font-medium', className)}
      {...props}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot='alert-description'
      className={cn('col-start-2 text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}
