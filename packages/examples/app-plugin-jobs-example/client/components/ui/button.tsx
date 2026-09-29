import type { ReactElement } from 'react';
import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/utils.js';

type ButtonVariantProps = {
  readonly variant?:
    'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  readonly size?: 'default' | 'sm' | 'lg';
};

const buttonVariants: (props?: ButtonVariantProps) => string = cva(
  'inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-transparent px-2.5 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        outline:
          'border-border bg-background hover:bg-muted hover:text-foreground',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-muted hover:text-foreground',
        destructive:
          'bg-destructive/10 text-destructive hover:bg-destructive/20',
      },
      size: {
        default: '',
        sm: 'h-7 px-2 text-xs',
        lg: 'h-9 px-3',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export type ButtonProps = ButtonPrimitive.Props & {
  readonly variant?:
    'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  readonly size?: 'default' | 'sm' | 'lg';
};

export function Button({
  className,
  size,
  variant,
  ...props
}: ButtonProps): ReactElement {
  return (
    <ButtonPrimitive
      data-slot='button'
      className={cn(buttonVariants({ size, variant }), className)}
      {...props}
    />
  );
}
