import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import type { ReactElement } from 'react';

export function DropdownMenu(props: MenuPrimitive.Root.Props): ReactElement {
  return <MenuPrimitive.Root data-slot='dropdown-menu' {...props} />;
}

export function DropdownMenuTrigger(
  props: MenuPrimitive.Trigger.Props,
): ReactElement {
  return <MenuPrimitive.Trigger data-slot='dropdown-menu-trigger' {...props} />;
}

export interface DropdownMenuContentProps extends Omit<
  MenuPrimitive.Popup.Props,
  'className'
> {
  readonly align?: MenuPrimitive.Positioner.Props['align'];
  readonly alignOffset?: MenuPrimitive.Positioner.Props['alignOffset'];
  readonly side?: MenuPrimitive.Positioner.Props['side'];
  readonly sideOffset?: MenuPrimitive.Positioner.Props['sideOffset'];
  readonly className?: string;
}

export function DropdownMenuContent({
  align = 'start',
  alignOffset = 0,
  side = 'bottom',
  sideOffset = 4,
  className = '',
  ...props
}: DropdownMenuContentProps): ReactElement {
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
          className={`z-50 max-h-(--available-height) min-w-32 overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none ${className}`}
          data-slot='dropdown-menu-content'
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

export interface DropdownMenuItemProps extends Omit<
  MenuPrimitive.Item.Props,
  'className'
> {
  readonly className?: string;
}

export function DropdownMenuItem({
  className = '',
  ...props
}: DropdownMenuItemProps): ReactElement {
  return (
    <MenuPrimitive.Item
      className={`relative flex cursor-default items-center rounded-md px-2 py-1.5 text-sm outline-none select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 ${className}`}
      data-slot='dropdown-menu-item'
      {...props}
    />
  );
}
