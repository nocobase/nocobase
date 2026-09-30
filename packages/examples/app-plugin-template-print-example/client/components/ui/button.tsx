import type { ReactElement } from 'react';
import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/utils.js';

export type ButtonProps = ButtonPrimitive.Props & {
  readonly variant?: 'default' | 'outline';
  readonly size?: 'default' | 'sm';
};

const buttonVariants = cva(
  'inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-transparent px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        outline:
          'border-border bg-background hover:bg-muted hover:text-foreground',
      },
      size: { default: 'h-8', sm: 'h-7 px-2.5 text-xs' },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonProps): ReactElement {
  return (
    <ButtonPrimitive
      data-slot='button'
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button };
