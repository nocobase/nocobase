import { ChevronDown } from 'lucide-react';
import type { ComponentProps, ReactElement } from 'react';

import { cn } from '../../lib/utils.js';

export type NativeSelectProps = ComponentProps<'select'>;

export function NativeSelect({
  className,
  children,
  ...props
}: NativeSelectProps): ReactElement {
  return (
    <span className='relative block'>
      <select
        className={cn(
          'h-9 w-full appearance-none rounded-lg border border-input bg-transparent px-3 pr-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30',
          className,
        )}
        data-slot='native-select'
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden='true'
        className='pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground'
      />
    </span>
  );
}
