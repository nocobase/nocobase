import * as React from 'react';
import { cn } from 'cn';

function Pagination({
  className,
  ...props
}: React.ComponentProps<'nav'>): React.ReactElement {
  return (
    <nav
      role='navigation'
      data-slot='pagination'
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<'ul'>): React.ReactElement {
  return (
    <ul
      data-slot='pagination-content'
      className={cn('flex items-center gap-0.5', className)}
      {...props}
    />
  );
}

function PaginationItem({
  ...props
}: React.ComponentProps<'li'>): React.ReactElement {
  return <li data-slot='pagination-item' {...props} />;
}

export { Pagination, PaginationContent, PaginationItem };
