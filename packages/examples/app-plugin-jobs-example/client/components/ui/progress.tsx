import type { ReactElement } from 'react';
import { Progress as ProgressPrimitive } from '@base-ui/react/progress';

import { cn } from 'cn';

function Progress({
  className,
  children,
  value,
  ...props
}: ProgressPrimitive.Root.Props): ReactElement {
  return (
    <ProgressPrimitive.Root
      value={value}
      data-slot='progress'
      className={cn('flex flex-wrap gap-3', className)}
      {...props}
    >
      {children}
      <ProgressPrimitive.Track
        data-slot='progress-track'
        className='relative flex h-1.5 w-full items-center overflow-x-hidden rounded-full bg-muted'
      >
        <ProgressPrimitive.Indicator
          data-slot='progress-indicator'
          className='h-full bg-primary transition-all duration-500'
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  );
}

function ProgressLabel({
  className,
  ...props
}: ProgressPrimitive.Label.Props): ReactElement {
  return (
    <ProgressPrimitive.Label
      data-slot='progress-label'
      className={cn('text-sm font-medium', className)}
      {...props}
    />
  );
}

function ProgressValue({
  className,
  ...props
}: ProgressPrimitive.Value.Props): ReactElement {
  return (
    <ProgressPrimitive.Value
      data-slot='progress-value'
      className={cn(
        'ml-auto text-sm text-muted-foreground tabular-nums',
        className,
      )}
      {...props}
    />
  );
}

export { Progress, ProgressLabel, ProgressValue };
