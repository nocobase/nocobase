import { cn } from 'cn';

function Skeleton({
  className,
  ...props
}: React.ComponentProps<'div'>): import('react').ReactElement {
  return (
    <div
      data-slot='skeleton'
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };
