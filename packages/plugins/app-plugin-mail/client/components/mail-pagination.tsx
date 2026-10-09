import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { MAIL_PLUGIN_NS } from '../namespace.js';
import { Button } from './ui/button.js';
import { Input } from './ui/input.js';
import { NativeSelect } from './ui/native-select.js';

export const MAIL_PAGE_SIZE = 20;
const MAIL_PAGE_SIZES: readonly number[] = [20, 50, 100];

export function MailPagination({
  page,
  pageSize,
  total,
  hasNext,
  disabled,
  onPageChange,
  onPageSizeChange,
}: {
  readonly page: number;
  readonly pageSize: number;
  readonly total?: number;
  readonly hasNext: boolean;
  readonly disabled?: boolean;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (pageSize: number) => void;
}): ReactElement {
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  const [draft, setDraft] = useState<{ page: number; value: string }>();
  const pageCount =
    total === undefined ? undefined : Math.max(1, Math.ceil(total / pageSize));
  const lastPage = pageCount ?? (hasNext ? undefined : page);
  const value = draft?.page === page ? draft.value : String(page);
  const target = Number(value);
  const valid =
    Number.isSafeInteger(target) &&
    target >= 1 &&
    target <= Math.floor(Number.MAX_SAFE_INTEGER / pageSize) &&
    (lastPage === undefined || target <= lastPage);
  const pages = [
    ...new Set([
      1,
      page - 1,
      page,
      page + 1,
      ...(pageCount === undefined ? [] : [pageCount]),
    ]),
  ]
    .filter((number) => number >= 1 && number <= (lastPage ?? page + 1))
    .sort((a, b) => a - b);
  const changePage = (next: number) => {
    if (disabled || next === page) return;
    setDraft(undefined);
    onPageChange(next);
  };
  return (
    <nav
      aria-label={t('pagination.label', { defaultValue: 'Pagination' })}
      className='flex shrink-0 flex-wrap items-center justify-end gap-2 border-t p-3'
    >
      <span
        className='mr-auto text-sm tabular-nums text-muted-foreground'
        role='status'
      >
        <span>
          {t('pagination.page', {
            defaultValue: `Page ${page} · ${pageSize} per page`,
            page,
            pageSize,
          })}
        </span>
        {total !== undefined
          ? ` · ${t('pagination.total', { defaultValue: `${total} records`, count: total })}`
          : null}
      </span>
      <NativeSelect
        aria-label={t('pagination.pageSize', { defaultValue: 'Rows per page' })}
        className='w-auto'
        disabled={disabled}
        value={pageSize}
        onChange={(event) => {
          setDraft(undefined);
          onPageSizeChange(Number(event.target.value));
        }}
      >
        {MAIL_PAGE_SIZES.map((size) => (
          <option key={size} value={size}>
            {t('pagination.perPage', {
              defaultValue: `${size} per page`,
              count: size,
            })}
          </option>
        ))}
      </NativeSelect>
      <Button
        variant='outline'
        className='h-8 min-w-8 px-2'
        aria-label={t('workspace.previousPage', {
          defaultValue: 'Previous page',
        })}
        disabled={disabled || page <= 1}
        onClick={() => changePage(page - 1)}
      >
        <ChevronLeft aria-hidden='true' className='size-4' />
      </Button>
      {pages.map((number, index) => (
        <span key={number} className='flex items-center gap-2'>
          {index > 0 && number - pages[index - 1] > 1 ? (
            <span aria-hidden='true' className='text-muted-foreground'>
              …
            </span>
          ) : null}
          <Button
            variant={number === page ? 'default' : 'outline'}
            className='h-8 min-w-8 px-2'
            aria-label={t('pagination.selectPage', {
              defaultValue: `Page ${number}`,
              page: number,
            })}
            aria-current={number === page ? 'page' : undefined}
            disabled={disabled}
            onClick={() => changePage(number)}
          >
            {number}
          </Button>
        </span>
      ))}
      <Button
        variant='outline'
        className='h-8 min-w-8 px-2'
        aria-label={t('workspace.nextPage', { defaultValue: 'Next page' })}
        disabled={
          disabled || (pageCount === undefined ? !hasNext : page >= pageCount)
        }
        onClick={() => changePage(page + 1)}
      >
        <ChevronRight aria-hidden='true' className='size-4' />
      </Button>
      <form
        className='flex items-center gap-2'
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) changePage(target);
        }}
      >
        <Input
          aria-label={t('pagination.jumpTo', { defaultValue: 'Go to page' })}
          className='h-8 w-16'
          type='number'
          min={1}
          max={lastPage}
          step={1}
          disabled={disabled}
          value={value}
          onChange={(event) => setDraft({ page, value: event.target.value })}
        />
        <Button
          type='submit'
          variant='outline'
          className='h-8 min-w-8 px-2'
          disabled={disabled || !valid || target === page}
        >
          {t('pagination.go', { defaultValue: 'Go' })}
        </Button>
      </form>
    </nav>
  );
}
