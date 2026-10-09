import type { ComponentProps, ReactElement } from 'react';

import { cn } from '../lib/utils.js';

export function Textarea({
  className,
  ...props
}: ComponentProps<'textarea'>): ReactElement {
  return (
    <textarea
      className={cn(
        'min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60',
        className,
      )}
      {...props}
    />
  );
}
