import type { ComponentProps, ReactElement } from 'react';

import { cn } from 'cn';

export type PageContainerProps = ComponentProps<'section'>;

/** The frame of a page: full width, responsive padding, and spacing between sections. */
export function PageContainer({
  className,
  ...props
}: PageContainerProps): ReactElement {
  return (
    <section
      className={cn('w-full space-y-6 p-6 md:p-8', className)}
      {...props}
    />
  );
}
