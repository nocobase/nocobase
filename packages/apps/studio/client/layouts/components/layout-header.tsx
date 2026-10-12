import type { ComponentProps } from 'react';
import { cn } from 'cn';

export function LayoutHeader({
  className,
  ...props
}: ComponentProps<'header'>) {
  return (
    <header
      className={cn(
        'flex h-16 shrink-0 items-center border-b border-border/70 bg-background/85 px-3 backdrop-blur-xl md:px-4',
        className,
      )}
      {...props}
    />
  );
}
