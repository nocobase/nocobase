// shadcn base-nova source adapted for declaration-emitting ESM builds.
import { Button as ButtonPrimitive } from '@base-ui/react/button';
import type { ReactElement } from 'react';

import { cn } from 'cn';
import { buttonVariants } from './button-variants.js';

export type ButtonProps = ButtonPrimitive.Props & {
  readonly size?: 'default' | 'sm' | 'lg' | 'icon';
  readonly variant?: 'default' | 'outline' | 'ghost' | 'destructive';
};

export function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonProps): ReactElement {
  return (
    <ButtonPrimitive
      data-slot='button'
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
