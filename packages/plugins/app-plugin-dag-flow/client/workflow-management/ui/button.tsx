// Adapted from the shadcn base-nova Button; only the outline variant is needed here.
import { Button as ButtonPrimitive } from '@base-ui/react/button';
import type { ReactElement } from 'react';
export function Button({
  className,
  ...props
}: ButtonPrimitive.Props): ReactElement {
  return (
    <ButtonPrimitive
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 ${typeof className === 'string' ? className : ''}`}
      {...props}
    />
  );
}
