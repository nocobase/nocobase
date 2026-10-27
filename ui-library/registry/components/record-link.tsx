import type { ComponentProps, ReactElement } from 'react';
import { Link } from 'react-router';
import { cn } from 'cn';

/** A record name or identifier that opens its route from a list or table. */
export function RecordLink({
  className,
  ...props
}: ComponentProps<typeof Link>): ReactElement {
  return (
    <Link
      {...props}
      data-slot='record-link'
      className={cn(
        'cursor-pointer font-medium text-foreground no-underline decoration-1 underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className,
      )}
    />
  );
}
