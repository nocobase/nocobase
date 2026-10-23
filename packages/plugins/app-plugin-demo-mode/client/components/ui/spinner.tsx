import type { ComponentProps, ReactElement } from 'react';
import { cn } from 'cn';
import { Loader2Icon } from 'lucide-react';

/** A decorative progress spinner; the control it sits in names what is in progress. */
function Spinner({ className, ...props }: ComponentProps<'svg'>): ReactElement {
  return (
    <Loader2Icon
      data-slot='spinner'
      aria-hidden
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  );
}

export { Spinner };
