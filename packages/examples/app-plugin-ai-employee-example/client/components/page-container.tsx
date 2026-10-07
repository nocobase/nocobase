import type { ComponentProps, ReactElement } from 'react';
import { twMerge } from 'tailwind-merge';

export type PageContainerProps = ComponentProps<'section'>;

export function PageContainer({
  className,
  ...props
}: PageContainerProps): ReactElement {
  return (
    <section
      className={twMerge('w-full space-y-6 p-6 md:p-8', className)}
      {...props}
    />
  );
}
