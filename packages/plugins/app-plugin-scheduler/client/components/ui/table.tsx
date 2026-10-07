// shadcn source adapted for declaration-emitting ESM builds.
import { cn } from 'cn';
import type { ComponentProps, ReactElement } from 'react';

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
  return <thead className={cn('[&_tr]:border-b', className)} {...props} />;
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
  return <td className={cn('px-4 py-3 align-middle', className)} {...props} />;
}
