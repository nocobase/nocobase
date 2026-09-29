import React, { type ComponentProps, type ReactElement } from 'react';
import { Input as InputPrimitive } from '@base-ui/react/input';

// Keep the input inside this workflow package so its artifact is self-contained.
export function Input(props: ComponentProps<'input'>): ReactElement {
  return (
    <InputPrimitive
      className='h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50'
      {...props}
    />
  );
}
