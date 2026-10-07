// shadcn base-nova source adapted for declaration-emitting ESM builds.
import { Input as InputPrimitive } from '@base-ui/react/input';
import type { ComponentProps, ReactElement } from 'react';

import { cn } from 'cn';

export type InputProps = ComponentProps<'input'>;

export function Input({ className, type, ...props }: InputProps): ReactElement {
  return (
    <InputPrimitive
      data-slot='input'
      type={type}
      className={cn(
        'h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
