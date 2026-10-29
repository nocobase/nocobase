import { useEffect, useId, useRef, useState, type Ref } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { useAuthorizationRevision } from '@nocobase/app-plugin-authorization/client';
import { cn } from 'cn';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Search,
  SearchX,
} from 'lucide-react';
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
import { useListData } from '#hooks/use-list-data';
import { ToggleGroup, ToggleGroupItem } from '#components/ui/toggle-group';
import { ReadFeedback } from './shared.js';
import { base, type List, type Option } from './model.js';

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
  return <Picker key={revision} {...props} />;
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
}: Parameters<typeof RelationPicker>[0]) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const composingRef = useRef(false);
  const [composition, setComposition] = useState(false);
  const id = useId();
  useEffect(() => {
    if (composition) return;
    const timer = setTimeout(() => {
      setSearch(text.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [text, composition]);
  const selected = useListData<{ data: Option }>(
    `${base}/${kind}/${encodeURIComponent(value)}`,
    { active: Boolean(value) },
  );
  const query = new URLSearchParams({
    search,
    page: String(page),
    pageSize: '5',
    ...(kind === 'customers' && status !== 'all' ? { status } : {}),
  });
  const request = useListData<List<Option>>(
    `${base}/${kind}/options?${query}`,
    { active: open },
  );
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
  const total = request.data?.meta.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / 5));
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
        className='w-(--anchor-width) min-w-72 max-w-[calc(100vw-2rem)] max-h-[min(28rem,var(--available-height))] gap-0 overflow-hidden p-0'
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
                if (!next[0]) return;
                setStatus(next[0]);
                setPage(1);
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
          className='min-h-0 flex-1 overflow-y-auto p-1'
          aria-live='polite'
          aria-busy={request.loading}
        >
          {request.loading || request.error ? (
            <div className='p-1'>
              <ReadFeedback error={request.error} retry={request.reload} />
            </div>
          ) : request.data?.data.length ? (
            <div className='flex flex-col gap-0.5'>
              {request.data.data.map((option) => {
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
        <div className='flex items-center justify-between gap-2 border-t px-2 py-1.5'>
          <span className='text-xs text-muted-foreground'>
            {request.data && !request.loading
              ? t('customerContacts.resultCount', { count: total })
              : null}
          </span>
          <div className='flex items-center gap-1'>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              aria-label={t('customerContacts.previous')}
              disabled={page <= 1 || request.loading}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft />
            </Button>
            <span className='min-w-16 text-center text-xs tabular-nums'>
              {t('customerContacts.page', { page, pages })}
            </span>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              aria-label={t('customerContacts.next')}
              disabled={page >= pages || request.loading}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
