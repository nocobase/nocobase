import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox';
import { Check, Minus } from 'lucide-react';
import type { ReactElement } from 'react';

import { cn } from '../../lib/utils.js';

export type CheckboxProps = CheckboxPrimitive.Root.Props;

export function Checkbox({
  className,
  indeterminate = false,
  ...props
}: CheckboxProps): ReactElement {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground data-indeterminate:border-primary data-indeterminate:bg-primary data-indeterminate:text-primary-foreground aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30',
        className,
      )}
      data-slot='checkbox'
      indeterminate={indeterminate}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className='grid place-content-center text-current [&>svg]:size-3.5'
        data-slot='checkbox-indicator'
      >
        {indeterminate ? (
          <Minus aria-hidden='true' />
        ) : (
          <Check aria-hidden='true' />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
