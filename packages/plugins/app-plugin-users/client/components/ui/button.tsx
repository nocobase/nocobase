// shadcn base-nova source adapted for declaration-emitting ESM builds.
import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva } from 'class-variance-authority';
import type { ReactElement } from 'react';

import { cn } from 'cn';

export type ButtonProps = ButtonPrimitive.Props & {
  readonly size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm';
  readonly variant?: 'default' | 'outline' | 'ghost' | 'destructive';
};

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        outline: 'border-border bg-background hover:bg-muted',
        ghost: 'hover:bg-muted',
        destructive:
          'bg-destructive/10 text-destructive hover:bg-destructive/20',
      },
      size: {
        default: 'h-9 gap-1.5 px-3',
        sm: 'h-8 gap-1 px-2.5',
        lg: 'h-10 gap-2 px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonProps): ReactElement {
  return (
    <ButtonPrimitive
      data-slot='button'
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
