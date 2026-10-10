import type { ComponentProps, ReactElement } from 'react';

import { cn } from 'cn';

export type PageContainerProps = ComponentProps<'section'>;

/**
 * The frame of a page: the full width, the responsive padding, and the spacing between its sections.
 *
 * A page renders one. Content that renders inside another page — an inline child route, a tab panel — already sits in
 * that page's container and adds none of its own, while a covering `RouteChildPage` is a surface of its own and
 * places one inside it.
 */
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
