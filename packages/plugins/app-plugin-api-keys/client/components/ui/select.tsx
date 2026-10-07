// shadcn base-nova source adapted for declaration-emitting ESM builds.
import { Select as SelectPrimitive } from '@base-ui/react/select';
import { Check, ChevronDown } from 'lucide-react';
import type { ReactElement } from 'react';

import { cn } from 'cn';

export const Select: typeof SelectPrimitive.Root = SelectPrimitive.Root;

export function SelectValue(props: SelectPrimitive.Value.Props): ReactElement {
  return <SelectPrimitive.Value className='flex flex-1 text-left' {...props} />;
}
export function SelectTrigger({
  className,
  children,
  ...props
}: SelectPrimitive.Trigger.Props): ReactElement {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'flex h-9 items-center justify-between gap-2 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={<ChevronDown className='size-4 text-muted-foreground' />}
      />
    </SelectPrimitive.Trigger>
  );
}
export function SelectContent({
  className,
  children,
  sideOffset = 4,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<SelectPrimitive.Positioner.Props, 'sideOffset'>): ReactElement {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        sideOffset={sideOffset}
        className='isolate z-50'
      >
        <SelectPrimitive.Popup
          className={cn(
            'max-h-(--available-height) min-w-36 overflow-y-auto rounded-lg bg-popover p-1 shadow-md ring-1 ring-foreground/10',
            className,
          )}
          {...props}
        >
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}
export function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props): ReactElement {
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex cursor-default items-center rounded-md py-1.5 pr-8 pl-2 text-sm outline-none focus:bg-accent data-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className='absolute right-2'>
        <Check className='size-4' />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}
