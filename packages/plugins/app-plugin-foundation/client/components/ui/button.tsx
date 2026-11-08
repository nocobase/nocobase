// shadcn base-nova source adapted for declaration-emitting ESM builds.
import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { buttonVariants } from './button-variants.js';
import type { ReactElement } from 'react';

import { cn } from 'cn';

export type ButtonProps = ButtonPrimitive.Props & {
  readonly size?:
    'default' | 'xs' | 'sm' | 'lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg';
  readonly variant?:
    'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
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
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
