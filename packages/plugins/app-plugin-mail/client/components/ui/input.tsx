import { Input as InputPrimitive } from '@base-ui/react/input';
import type { ComponentProps, ReactElement } from 'react';

import { cn } from '../../lib/utils.js';

export type InputProps = ComponentProps<'input'>;

export function Input({ className, type, ...props }: InputProps): ReactElement {
  return (
    <InputPrimitive
      className={cn(
        'h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30',
        className,
      )}
      data-slot='input'
      type={type}
      {...props}
    />
  );
}
