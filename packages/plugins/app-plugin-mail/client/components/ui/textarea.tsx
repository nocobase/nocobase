import type { ComponentProps, ReactElement } from 'react';

import { cn } from '../../lib/utils.js';

export type TextareaProps = ComponentProps<'textarea'>;

export function Textarea({ className, ...props }: TextareaProps): ReactElement {
  return (
    <textarea
      className={cn(
        'min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30',
        className,
      )}
      data-slot='textarea'
      {...props}
    />
  );
}
