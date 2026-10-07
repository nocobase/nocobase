// shadcn source adapted for declaration-emitting ESM builds.
import type { ComponentProps, ReactElement } from 'react';

import { cn } from 'cn';

export function Label({
  className,
  ...props
}: ComponentProps<'label'>): ReactElement {
  return (
    <label
      data-slot='label'
      className={cn(
        'flex items-center gap-2 text-sm font-medium select-none',
        className,
      )}
      {...props}
    />
  );
}
