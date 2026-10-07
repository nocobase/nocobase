// shadcn source adapted for declaration-emitting ESM builds.
import type { ComponentProps, ReactElement } from 'react';

import { cn } from 'cn';

export function Badge({
  className,
  ...props
}: ComponentProps<'span'>): ReactElement {
  return (
    <span
      data-slot='badge'
      className={cn(
        'inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium',
        className,
      )}
      {...props}
    />
  );
}
