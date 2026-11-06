import type { ReactElement } from 'react';
import { cn } from 'cn';

function Skeleton({
  className,
  ...props
}: React.ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot='skeleton'
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };
