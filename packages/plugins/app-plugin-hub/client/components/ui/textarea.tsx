// shadcn source adapted for declaration-emitting ESM builds.
import type { ComponentProps, ReactElement } from 'react';

import { cn } from 'cn';

export function Textarea({
  className,
  ...props
}: ComponentProps<'textarea'>): ReactElement {
  return (
    <textarea
      data-slot='textarea'
      className={cn(
        'min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
