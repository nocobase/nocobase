// shadcn base-nova source adapted for declaration-emitting ESM builds.
import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import type { ReactElement } from 'react';

import { cn } from 'cn';

export function DropdownMenu(props: MenuPrimitive.Root.Props): ReactElement {
  return <MenuPrimitive.Root data-slot='dropdown-menu' {...props} />;
}

export function DropdownMenuTrigger(
  props: MenuPrimitive.Trigger.Props,
): ReactElement {
  return <MenuPrimitive.Trigger data-slot='dropdown-menu-trigger' {...props} />;
}

export function DropdownMenuContent({
  align = 'start',
  alignOffset = 0,
  side = 'bottom',
  sideOffset = 4,
  className,
  ...props
}: MenuPrimitive.Popup.Props &
  Pick<
    MenuPrimitive.Positioner.Props,
    'align' | 'alignOffset' | 'side' | 'sideOffset'
  >): ReactElement {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        className='isolate z-50 outline-none'
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          data-slot='dropdown-menu-content'
          className={cn(
            'z-50 max-h-(--available-height) min-w-32 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:overflow-hidden data-closed:fade-out-0 data-closed:zoom-out-95',
            className,
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({
  className,
  ...props
}: MenuPrimitive.Item.Props): ReactElement {
  return (
    <MenuPrimitive.Item
      data-slot='dropdown-menu-item'
      className={cn(
        'relative flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
        className,
      )}
      {...props}
    />
  );
}
