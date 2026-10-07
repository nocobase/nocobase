// shadcn base-nova source adapted for declaration-emitting ESM builds.
import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva } from 'class-variance-authority';
import type { ReactElement } from 'react';

import { cn } from 'cn';

export type ButtonProps = ButtonPrimitive.Props & {
  readonly size?:
    'default' | 'xs' | 'sm' | 'lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg';
  readonly variant?:
    'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
};

export function Button({
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

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
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
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-8 gap-1.5 px-2.5',
        xs: 'h-6 gap-1 rounded-lg px-2 text-xs',
        sm: 'h-7 gap-1 rounded-lg px-2.5 text-xs',
        lg: 'h-9 gap-1.5 px-2.5',
        icon: 'size-8',
        'icon-xs': 'size-6 rounded-lg',
        'icon-sm': 'size-7 rounded-lg',
        'icon-lg': 'size-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);
