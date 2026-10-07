// shadcn source adapted for declaration-emitting ESM builds.
import type { ComponentProps, ReactElement } from 'react';

import { cn } from 'cn';

export function Empty({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot='empty'
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center justify-center gap-5 rounded-xl border border-dashed px-6 py-16 text-center',
        className,
      )}
      {...props}
    />
  );
}

export function EmptyMedia({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot='empty-media'
      className={cn(
        'flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground [&_svg]:size-5',
        className,
      )}
      {...props}
    />
  );
}

export function EmptyHeader({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot='empty-header'
      className={cn('flex max-w-md flex-col items-center gap-2', className)}
      {...props}
    />
  );
}

export function EmptyTitle({
  className,
  ...props
}: ComponentProps<'h2'>): ReactElement {
  return (
    <h2
      data-slot='empty-title'
      className={cn('font-semibold', className)}
      {...props}
    />
  );
}

export function EmptyDescription({
  className,
  ...props
}: ComponentProps<'p'>): ReactElement {
  return (
    <p
      data-slot='empty-description'
      className={cn('text-sm leading-6 text-muted-foreground', className)}
      {...props}
    />
  );
}

export function EmptyContent({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot='empty-content'
      className={cn('flex items-center justify-center', className)}
      {...props}
    />
  );
}
