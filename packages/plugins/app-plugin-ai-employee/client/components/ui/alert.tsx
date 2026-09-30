// shadcn base-nova source adapted for declaration-emitting ESM builds.
import { cva } from 'class-variance-authority';
import type { ComponentProps, ReactElement } from 'react';

import { cn } from '../../lib/utils.js';

export type AlertProps = ComponentProps<'div'> & {
  readonly variant?: 'default' | 'destructive';
};

export function Alert({
  className,
  variant = 'default',
  ...props
}: AlertProps): ReactElement {
  return (
    <div
      data-slot='alert'
      role='alert'
      className={cn(alertVariants({ variant }), className)}
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
      className={cn(
        'font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground',
        className,
      )}
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
      className={cn(
        'text-sm text-balance text-muted-foreground md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4',
        className,
      )}
      {...props}
    />
  );
}

const alertVariants = cva(
  "group/alert relative grid w-full gap-0.5 rounded-lg border px-2.5 py-2 text-left text-sm has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground',
        destructive:
          'bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);
