// shadcn base-nova source adapted for declaration-emitting ESM builds.
import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import type { ReactElement } from 'react';

import { cn } from 'cn';

export function Tabs(props: TabsPrimitive.Root.Props): ReactElement {
  return <TabsPrimitive.Root data-slot='tabs' className='block' {...props} />;
}

export function TabsList({
  className,
  ...props
}: TabsPrimitive.List.Props): ReactElement {
  return (
    <TabsPrimitive.List
      data-slot='tabs-list'
      className={cn('flex w-full gap-1 overflow-x-auto', className)}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: TabsPrimitive.Tab.Props): ReactElement {
  return (
    <TabsPrimitive.Tab
      data-slot='tabs-trigger'
      className={(state) =>
        cn(
          'border-b-2 px-3 pb-3 text-sm font-medium outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50',
          state.active
            ? 'border-primary text-foreground'
            : 'border-transparent text-muted-foreground',
          typeof className === 'function' ? className(state) : className,
        )
      }
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: TabsPrimitive.Panel.Props): ReactElement {
  return (
    <TabsPrimitive.Panel
      data-slot='tabs-content'
      className={cn('outline-none', className)}
      {...props}
    />
  );
}
