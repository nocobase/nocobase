// shadcn base-nova source adapted for declaration-emitting ESM builds.
import type { ComponentProps, ReactElement } from 'react';

import { cn } from 'cn';

export type CardProps = ComponentProps<'div'> & {
  readonly size?: 'default' | 'sm';
};

export function Card({
  className,
  size = 'default',
  ...props
}: CardProps): ReactElement {
  return (
    <div
      data-slot='card'
      data-size={size}
      className={cn(
        'group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl bg-card py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/10 [--card-spacing:--spacing(4)] data-[size=sm]:[--card-spacing:--spacing(3)]',
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
    <div
      data-slot='card-header'
      className={cn(
        'grid auto-rows-min items-start gap-1 px-(--card-spacing) [.border-b]:pb-(--card-spacing)',
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot='card-title'
      className={cn('text-base leading-snug font-medium', className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot='card-description'
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot='card-content'
      className={cn('px-(--card-spacing)', className)}
      {...props}
    />
  );
}
