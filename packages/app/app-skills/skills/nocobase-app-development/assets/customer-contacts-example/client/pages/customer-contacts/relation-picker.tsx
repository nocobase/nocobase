import { useEffect, useId, useRef, useState, type Ref } from 'react';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useAuthorizationRevision } from '@nocobase/app-plugin-authorization/client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { cn } from 'cn';
import { Check, ChevronsUpDown, Search, SearchX } from 'lucide-react';
import { Button } from '#components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '#components/ui/input-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#components/ui/popover';
import { Spinner } from '#components/ui/spinner';
import { ToggleGroup, ToggleGroupItem } from '#components/ui/toggle-group';
import { useListData } from '#hooks/use-list-data';
import { ReadFeedback } from './shared.js';
import { base, type List, type Option } from './model.js';

const PAGE_SIZE = 10;

export function RelationPicker(props: {
  kind: 'customers' | 'salesReps';
  value: string;
  onChange: (id: string) => void;
  label: string;
  disabled?: boolean;
  onValidityChange?: (valid: boolean) => void;
  triggerRef?: Ref<HTMLButtonElement>;
  errorId?: string;
  invalid?: boolean;
  required?: boolean;
}) {
  const revision = useAuthorizationRevision();
  return <Picker key={revision} revision={revision} {...props} />;
}
function Picker({
  kind,
  value,
  onChange,
  label,
  disabled,
  onValidityChange,
  triggerRef,
  errorId,
  invalid,
  required,
  revision,
}: Parameters<typeof RelationPicker>[0] & { revision: unknown }) {
  const { t } = useTranslation();
  const api = useApiClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const composingRef = useRef(false);
  const [composition, setComposition] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (composition) return;
    const timer = setTimeout(() => setSearch(text.trim()), 300);
    return () => clearTimeout(timer);
  }, [text, composition]);
  const selected = useListData<{ data: Option }>(
    `${base}/${kind}/${encodeURIComponent(value)}`,
    { active: Boolean(value) },
  );
  const filter = kind === 'customers' && status !== 'all' ? status : undefined;
  // Each search and filter is its own query, so a change restarts from the
  // first server page and a late response for an old query is never shown.
  const options = useInfiniteQuery({
    queryKey: [base, kind, 'options', revision, search, filter],
    queryFn: ({ pageParam, signal }) =>
      api.request<List<Option>>({
        path: `${base}/${kind}/options`,
        query: { search, page: pageParam, pageSize: PAGE_SIZE, status: filter },
        signal,
      }),
    initialPageParam: 1,
    getNextPageParam: ({ meta }) =>
      meta.page * meta.pageSize < meta.total ? meta.page + 1 : undefined,
    enabled: open,
    retry: false,
  });
  const {
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  } = options;
  const items = [
    ...new Map(
      (options.data?.pages ?? [])
        .flatMap((page) => page.data)
        .map((option) => [option.id, option]),
    ).values(),
  ];
  // Load the next server page when the end of the list scrolls into view;
  // a list shorter than the panel keeps loading until it can scroll.
  useEffect(() => {
    const end = endRef.current;
    if (!end || !hasNextPage || isFetchingNextPage || isFetchNextPageError)
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void fetchNextPage();
      },
      { root: listRef.current, rootMargin: '0px 0px 48px 0px' },
    );
    observer.observe(end);
    return () => observer.disconnect();
  }, [
    open,
    items.length,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  ]);
  const valid = Boolean(
    value &&
    !selected.loading &&
    !selected.error &&
    selected.data &&
    selected.data.data.active !== false,
  );
  useEffect(() => onValidityChange?.(valid), [valid, onValidityChange]);
  const title = !value
    ? t('customerContacts.select')
    : selected.error || selected.data?.data.active === false
      ? t('customerContacts.unavailable')
      : (selected.data?.data.name ?? t('customerContacts.loading'));
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            ref={triggerRef}
            aria-describedby={errorId}
            aria-invalid={invalid}
            aria-required={required}
            variant='outline'
            disabled={disabled}
            aria-label={label}
            className='w-full justify-between font-normal'
          />
        }
      >
        <span className={cn('truncate', !valid && 'text-muted-foreground')}>
          {title}
        </span>
        <ChevronsUpDown className='text-muted-foreground' />
      </PopoverTrigger>
      <PopoverContent
        aria-label={label}
        align='start'
        className='w-(--anchor-width) min-w-72 max-w-[calc(100vw-2rem)] max-h-[min(24rem,var(--available-height))] gap-0 overflow-hidden p-0'
      >
        <div className='flex flex-col gap-2 border-b p-2'>
          <InputGroup>
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              id={id}
              aria-label={t('customerContacts.searchOptions')}
              placeholder={t('customerContacts.searchOptions')}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onCompositionStart={() => {
                composingRef.current = true;
                setComposition(true);
              }}
              onCompositionEnd={(e) => {
                composingRef.current = false;
                setComposition(false);
                setText(e.currentTarget.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !composingRef.current)
                  e.preventDefault();
              }}
            />
          </InputGroup>
          {kind === 'customers' && (
            <ToggleGroup
              aria-label={t('customerContacts.status')}
              size='sm'
              spacing={1}
              className='flex-wrap'
              value={[status]}
              onValueChange={(next: string[]) => {
                if (next[0]) setStatus(next[0]);
              }}
            >
              {(['all', 'active', 'paused', 'closed'] as const).map((value) => (
                <ToggleGroupItem
                  key={value}
                  value={value}
                  className='text-muted-foreground data-pressed:bg-primary/10 data-pressed:text-primary'
                >
                  {t(`customerContacts.${value}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
        </div>
        <div
          ref={listRef}
          className='min-h-0 flex-1 overflow-y-auto p-1'
          aria-live='polite'
          aria-busy={options.isFetching}
        >
          {options.isPending ? (
            <div className='flex justify-center py-6'>
              <Spinner className='text-muted-foreground' />
            </div>
          ) : options.isError && !isFetchNextPageError ? (
            <div className='p-1'>
              <ReadFeedback
                error={options.error}
                retry={() => void options.refetch()}
              />
            </div>
          ) : items.length ? (
            <div className='flex flex-col gap-0.5'>
              {items.map((option) => {
                const current = option.id === value;
                return (
                  <Button
                    type='button'
                    key={option.id}
                    variant={current ? 'secondary' : 'ghost'}
                    className='h-auto w-full justify-between py-1.5 text-left font-normal whitespace-normal'
                    aria-pressed={current}
                    onClick={() => {
                      onChange(option.id);
                      setOpen(false);
                    }}
                  >
                    <span className='min-w-0 break-words'>{option.name}</span>
                    {current && <Check className='text-primary' />}
                  </Button>
                );
              })}
              {isFetchNextPageError ? (
                <div className='p-1'>
                  <ReadFeedback
                    error={options.error}
                    retry={() => void fetchNextPage()}
                  />
                </div>
              ) : hasNextPage ? (
                <div ref={endRef} className='flex justify-center py-2'>
                  {isFetchingNextPage && (
                    <Spinner className='size-4 text-muted-foreground' />
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <div className='flex flex-col items-center gap-1 px-2 py-6 text-center'>
              <SearchX className='size-5 text-muted-foreground' />
              <p className='font-medium'>{t('customerContacts.noResults')}</p>
              <p className='text-xs text-muted-foreground'>
                {t('customerContacts.noResultsHint')}
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
