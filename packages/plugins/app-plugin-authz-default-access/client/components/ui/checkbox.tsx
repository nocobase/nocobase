// Generated with shadcn base-nova and adapted for declaration-emitting ESM builds.
import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox';
import { CheckIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { cn } from 'cn';

export type CheckboxProps = CheckboxPrimitive.Root.Props;

export function Checkbox({ className, ...props }: CheckboxProps): ReactElement {
  return (
    <CheckboxPrimitive.Root
      data-slot='checkbox'
      aria-labelledby={props['aria-label'] ? '' : undefined}
      className={cn(
        'peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input transition-colors outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:bg-input/30 dark:data-checked:bg-primary',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot='checkbox-indicator'
        className='grid place-content-center text-current [&>svg]:size-3.5'
      >
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
