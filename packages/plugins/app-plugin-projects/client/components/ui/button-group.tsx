import type { ComponentProps, ReactElement } from 'react';
import { cva } from 'class-variance-authority';

import { cn } from 'cn';
import { Separator } from './separator.js';

const buttonGroupVariants: (props?: {
  readonly orientation?: 'horizontal' | 'vertical' | null;
}) => string = cva(
  'flex w-fit items-stretch *:focus-visible:relative *:focus-visible:z-10 has-[>[data-slot=button-group]]:gap-2',
  {
    variants: {
      orientation: {
        horizontal:
          '*:data-slot:rounded-r-none [&>[data-slot]:not(:has(~[data-slot]))]:rounded-r-lg! [&>[data-slot]~[data-slot]]:rounded-l-none [&>[data-slot]~[data-slot]]:border-l-0',
        vertical:
          'flex-col *:data-slot:rounded-b-none [&>[data-slot]:not(:has(~[data-slot]))]:rounded-b-lg! [&>[data-slot]~[data-slot]]:rounded-t-none [&>[data-slot]~[data-slot]]:border-t-0',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
    },
  },
);

function ButtonGroup({
  className,
  orientation,
  ...props
}: ComponentProps<'div'> & {
  readonly orientation?: 'horizontal' | 'vertical';
}): ReactElement {
  return (
    <div
      role='group'
      data-slot='button-group'
      data-orientation={orientation}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  );
}

function ButtonGroupSeparator({
  className,
  orientation = 'vertical',
  ...props
}: ComponentProps<typeof Separator>): ReactElement {
  return (
    <Separator
      data-slot='button-group-separator'
      orientation={orientation}
      className={cn(
        'relative self-stretch bg-input data-horizontal:mx-px data-horizontal:w-auto data-vertical:my-px data-vertical:h-auto',
        className,
      )}
      {...props}
    />
  );
}

export { ButtonGroup, ButtonGroupSeparator };
