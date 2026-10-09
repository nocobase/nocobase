import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva } from 'class-variance-authority';
import type { ReactElement } from 'react';

import { cn } from '../../lib/utils.js';

export type ButtonProps = ButtonPrimitive.Props & {
  readonly variant?: 'default' | 'outline' | 'ghost' | 'destructive';
};

const buttonVariants = cva(
  'inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent px-4 text-sm font-medium transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        outline:
          'border-border bg-background hover:bg-muted hover:text-foreground dark:bg-input/30 dark:hover:bg-input/50',
        ghost: 'hover:bg-muted hover:text-foreground',
        destructive:
          'bg-destructive/10 text-destructive hover:bg-destructive/20',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export function Button({
  className,
  variant = 'default',
  ...props
}: ButtonProps): ReactElement {
  return (
    <ButtonPrimitive
      className={cn(buttonVariants({ variant, className }))}
      data-slot='button'
      {...props}
    />
  );
}
