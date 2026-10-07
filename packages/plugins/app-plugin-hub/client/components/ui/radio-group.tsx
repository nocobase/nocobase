// shadcn base-nova source adapted for declaration-emitting ESM builds.
import { Radio } from '@base-ui/react/radio';
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group';
import type { ReactElement } from 'react';

import { cn } from 'cn';

export function RadioGroup(
  props: RadioGroupPrimitive.Props<string>,
): ReactElement {
  return <RadioGroupPrimitive data-slot='radio-group' {...props} />;
}

export function RadioGroupItem({
  className,
  ...props
}: Radio.Root.Props<string>): ReactElement {
  return (
    <Radio.Root
      data-slot='radio-group-item'
      className={cn(
        'size-4 shrink-0 rounded-full border border-input bg-background outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-checked:border-primary',
        className,
      )}
      {...props}
    >
      <Radio.Indicator className='grid size-full place-items-center'>
        <span className='size-2 rounded-full bg-primary' />
      </Radio.Indicator>
    </Radio.Root>
  );
}
