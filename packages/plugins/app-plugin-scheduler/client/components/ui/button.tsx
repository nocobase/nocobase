// Adapted from the shadcn base-nova Button; the pages only need the outline treatment.
import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cn } from 'cn';
import type { ReactElement } from 'react';

export type ButtonProps = ButtonPrimitive.Props & {
  readonly size?: 'default' | 'sm';
};

export function Button({
  className,
  size = 'default',
  ...props
}: ButtonProps): ReactElement {
  return (
    <ButtonPrimitive
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium whitespace-nowrap transition-all outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
        size === 'sm' ? 'h-8 px-2.5' : 'h-9 px-3',
        typeof className === 'string' ? className : undefined,
      )}
      data-slot='button'
      {...props}
    />
  );
}
