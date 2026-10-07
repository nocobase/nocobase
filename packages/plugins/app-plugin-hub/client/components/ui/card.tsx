// shadcn base-nova source adapted for declaration-emitting ESM builds.
import type { ComponentProps, ReactElement } from 'react';

import { cn } from 'cn';

export function Card({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot='card'
      className={cn(
        'rounded-xl border bg-card text-card-foreground shadow-sm',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div data-slot='card-header' className={cn('p-5', className)} {...props} />
  );
}

export function CardContent({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot='card-content'
      className={cn('px-5 pb-5', className)}
      {...props}
    />
  );
}

export function CardFooter({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot='card-footer'
      className={cn('border-t p-5', className)}
      {...props}
    />
  );
}
