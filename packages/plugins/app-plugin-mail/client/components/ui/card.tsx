import type { ComponentProps, ReactElement } from 'react';

import { cn } from '../../lib/utils.js';

export function Card({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      className={cn(
        'rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10',
        className,
      )}
      data-slot='card'
      {...props}
    />
  );
}
