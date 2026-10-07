'use client';

// shadcn base-nova source adapted for declaration-emitting ESM builds.
import { Separator as SeparatorPrimitive } from '@base-ui/react/separator';
import type { ReactElement } from 'react';

import { cn } from 'cn';

export function Separator({
  className,
  orientation = 'horizontal',
  ...props
}: SeparatorPrimitive.Props): ReactElement {
  return (
    <SeparatorPrimitive
      data-slot='separator'
      orientation={orientation}
      className={cn(
        'shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch',
        className,
      )}
      {...props}
    />
  );
}
