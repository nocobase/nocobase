// shadcn source adapted for declaration-emitting ESM builds.
import type { ComponentProps, ReactElement } from 'react';

import { cn } from 'cn';

export function Table({
  className,
  ...props
}: ComponentProps<'table'>): ReactElement {
  return (
    <div
      data-slot='table-container'
      className='relative w-full overflow-x-auto'
    >
      <table
        data-slot='table'
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
      data-slot='table-header'
      className={cn('[&_tr]:border-b', className)}
      {...props}
    />
  );
}

export function TableBody({
  className,
  ...props
}: ComponentProps<'tbody'>): ReactElement {
  return (
    <tbody
      data-slot='table-body'
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  );
}

export function TableRow({
  className,
  ...props
}: ComponentProps<'tr'>): ReactElement {
  return (
    <tr
      data-slot='table-row'
      className={cn('border-b transition-colors hover:bg-muted/40', className)}
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
      data-slot='table-head'
      className={cn(
        'h-10 px-4 text-left align-middle text-xs font-medium text-muted-foreground',
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
    <td
      data-slot='table-cell'
      className={cn('px-4 py-3 align-middle', className)}
      {...props}
    />
  );
}
