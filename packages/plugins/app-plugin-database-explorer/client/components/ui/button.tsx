import { Button as ButtonPrimitive } from '@base-ui/react/button';
import type { VariantProps } from 'class-variance-authority';

import { cn } from 'cn';

import { buttonVariants } from './button-variants.js';

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants>): React.ReactElement {
  return (
    <ButtonPrimitive
      data-slot='button'
      className={
        typeof className === 'function'
          ? (state) => cn(buttonVariants({ variant, size }), className(state))
          : cn(buttonVariants({ variant, size }), className)
      }
      {...props}
    />
  );
}

export { Button };
