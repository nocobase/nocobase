// shadcn source adapted for declaration-emitting ESM builds.
import type { ComponentProps, ReactElement } from 'react';

import { cn } from 'cn';

export function Table({
  className,
  ...props
}: ComponentProps<'table'>): ReactElement {
  return (
    <div className='relative w-full overflow-x-auto'>
      <table
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  );
}
export function TableHeader({
  className,
  ...props
}: ComponentProps<'thead'>): ReactElement {
  return (
    <thead
      className={cn(
        '[&_tr]:border-b bg-muted/30 text-xs tracking-wide text-muted-foreground uppercase',
        className,
      )}
      {...props}
    />
  );
}
export function TableBody({
  className,
  ...props
}: ComponentProps<'tbody'>): ReactElement {
  return (
    <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  );
}
export function TableRow({
  className,
  ...props
}: ComponentProps<'tr'>): ReactElement {
  return (
    <tr
      className={cn('border-b transition-colors hover:bg-muted/30', className)}
      {...props}
    />
  );
}
export function TableHead({
  className,
  ...props
}: ComponentProps<'th'>): ReactElement {
  return (
    <th
      scope='col'
      className={cn(
        'px-5 py-3 text-left align-middle text-xs font-medium text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}
export function TableCell({
  className,
  ...props
}: ComponentProps<'td'>): ReactElement {
  return (
    <td className={cn('h-16 px-5 py-3 align-middle', className)} {...props} />
  );
}
