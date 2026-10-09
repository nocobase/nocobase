import type { ComponentProps, ReactElement } from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/utils.js';

type BadgeVariantProps = {
  readonly variant?: 'default' | 'secondary' | 'outline' | 'destructive';
};

const badgeVariants: (props?: BadgeVariantProps) => string = cva(
  'inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        outline: 'border-border text-foreground',
        destructive:
          'bg-destructive/10 text-destructive dark:bg-destructive/20',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

function Badge({
  className,
  variant,
  ...props
}: ComponentProps<'span'> & BadgeVariantProps): ReactElement {
  return (
    <span
      data-slot='badge'
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge };
