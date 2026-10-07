import type { ComponentProps, ReactElement } from 'react';
import { Input as InputPrimitive } from '@base-ui/react/input';

import { cn } from 'cn';

export function Input({
  className,
  ...props
}: ComponentProps<'input'>): ReactElement {
  return (
    <InputPrimitive
      data-slot='input'
      className={cn(
        'h-9 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
