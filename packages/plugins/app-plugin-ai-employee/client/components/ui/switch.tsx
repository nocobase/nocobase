'use client';

// Adapted from the repository's shadcn base-nova template.
import { Switch as SwitchPrimitive } from '@base-ui/react/switch';
import type { ReactElement } from 'react';

import { cn } from '../../lib/utils.js';

export type SwitchProps = SwitchPrimitive.Root.Props & {
  size?: 'sm' | 'default';
};

function Switch({
  className,
  size = 'default',
  ...props
}: SwitchProps): ReactElement {
  return (
    <SwitchPrimitive.Root
      data-slot='switch'
      data-size={size}
      className={cn(
        'peer group/switch relative inline-flex shrink-0 items-center rounded-full border-0 p-0.5 transition-all outline-none group-has-[:focus-visible]/field-label:ring-0 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-5 data-[size=default]:w-9 data-[size=sm]:h-4 data-[size=sm]:w-7 dark:aria-invalid:ring-destructive/40 data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80 data-disabled:cursor-not-allowed data-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {/* Track minus both insets and thumb equals travel: 9 - 1 - 4 = 4; 7 - 1 - 3 = 3. */}
      <SwitchPrimitive.Thumb
        data-slot='switch-thumb'
        className='pointer-events-none block shrink-0 rounded-full bg-background ring-0 transition-transform group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 group-data-[size=default]/switch:data-checked:translate-x-4 group-data-[size=sm]/switch:data-checked:translate-x-3 group-data-[size=default]/switch:rtl:data-checked:-translate-x-4 group-data-[size=sm]/switch:rtl:data-checked:-translate-x-3 dark:data-checked:bg-primary-foreground data-unchecked:translate-x-0 dark:data-unchecked:bg-foreground'
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
