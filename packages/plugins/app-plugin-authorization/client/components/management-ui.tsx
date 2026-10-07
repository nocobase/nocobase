import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

import { useAuthorizationTranslation } from '../i18n.js';
import { FilterBar, FilterBarSpacer, SearchField } from './filters.js';
import {
  PAGE_SIZE,
  clampPage,
  pageCount,
  pageNumbers,
  pageRangeLabel,
} from './pagination.js';
import { Button } from './ui/button.js';
import { cn } from 'cn';
import { Card } from './ui/card.js';
import { TableCell, TableRow } from './ui/table.js';

export function ManagementToolbar({
  search,
  searchLabel,
  searchPlaceholder,
  onSearch,
  actionLabel,
  onAction,
  actionDisabled,
  filters,
}: {
  filters?: ReactNode;
  search: string;
  /** What the field searches, for anyone who cannot see the placeholder. */
  searchLabel?: string;
  searchPlaceholder?: string;
  onSearch: (value: string) => void;
  actionLabel: string;
  onAction: () => void;
  actionDisabled?: boolean;
}): ReactElement {
  const t = useAuthorizationTranslation();
  return (
    <FilterBar>
      {/* The search field clears itself, so this bar needs no separate clear control. */}
      <SearchField
        label={searchLabel ?? t('common.search')}
        placeholder={searchPlaceholder ?? t('common.search')}
        value={search}
        onChange={onSearch}
      />
      {filters}
      <FilterBarSpacer />
      <Button onClick={onAction} disabled={actionDisabled}>
        {actionLabel}
      </Button>
    </FilterBar>
  );
}

/** Pages rows the panel already holds. It never asks the server for another page. */
export function TablePager({
  total,
  page,
  pageSize = PAGE_SIZE,
  label,
  onPage,
}: {
  total: number;
  page: number;
  pageSize?: number;
  /** What is being paged, so several pagers on one screen stay distinguishable. */
  label: string;
  onPage: (page: number) => void;
}): ReactElement | null {
  const t = useAuthorizationTranslation();
  if (total === 0) return null;
  const current = clampPage(page, total, pageSize);
  const pages = pageCount(total, pageSize);
  const numbers = pageNumbers(total, pageSize);
  return (
    <nav
      aria-label={t('pagination.navLabel', { label })}
      className='flex items-center gap-2 border-t px-4 py-2.5 text-xs text-muted-foreground'
    >
      <span className='tabular-nums'>
        {pageRangeLabel(t, total, current, pageSize)}
      </span>
      <span className='flex-1' />
      <div className='flex items-center gap-1'>
        <Button
          aria-label={t('pagination.previous')}
          disabled={current === 1}
          size='sm'
          variant='outline'
          onClick={() => onPage(current - 1)}
        >
          <ChevronLeft />
        </Button>
        {numbers.map((number) => (
          <Button
            key={number}
            aria-current={number === current ? 'page' : undefined}
            aria-label={t('pagination.page', { number })}
            size='sm'
            variant={number === current ? 'default' : 'outline'}
            onClick={() => onPage(number)}
          >
            {number}
          </Button>
        ))}
        <Button
          aria-label={t('pagination.next')}
          disabled={current === pages}
          size='sm'
          variant='outline'
          onClick={() => onPage(current + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}

export function ManagementTable({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}): ReactElement {
  return <Card className={cn('overflow-hidden', className)}>{children}</Card>;
}

export function EmptyTableRow({
  colSpan,
  children,
}: {
  colSpan: number;
  children: ReactNode;
}): ReactElement {
  return (
    <TableRow className='hover:bg-transparent'>
      <TableCell
        className='px-5 py-12 text-center text-sm text-muted-foreground'
        colSpan={colSpan}
      >
        {children}
      </TableCell>
    </TableRow>
  );
}

export function SidePanel({
  title,
  description,
  onClose,
  children,
  wide = false,
  scrollable = true,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  scrollable?: boolean;
}): ReactElement {
  const t = useAuthorizationTranslation();
  return (
    <div
      className='fixed inset-0 z-50 flex justify-end bg-black/30'
      role='presentation'
      onMouseDown={onClose}
    >
      <section
        className={`flex h-full w-full flex-col overflow-hidden border-l bg-popover shadow-2xl ${wide ? 'max-w-5xl' : 'max-w-2xl'}`}
        role='dialog'
        aria-modal='true'
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className='z-10 flex shrink-0 items-start justify-between border-b bg-popover px-6 py-5'>
          <div>
            <h2 className='text-lg font-semibold'>{title}</h2>
            {description ? (
              <p className='mt-1 text-sm text-muted-foreground'>
                {description}
              </p>
            ) : null}
          </div>
          <Button size='sm' variant='ghost' onClick={onClose}>
            {t('common.close')}
          </Button>
        </header>
        <div
          className={`min-h-0 flex-1 ${scrollable ? 'overflow-y-auto p-6' : 'overflow-hidden'}`}
        >
          {children}
        </div>
      </section>
    </div>
  );
}
