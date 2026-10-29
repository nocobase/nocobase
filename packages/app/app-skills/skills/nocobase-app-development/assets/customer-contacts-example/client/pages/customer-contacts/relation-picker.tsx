import { useEffect, useId, useRef, useState, type Ref } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { useAuthorizationRevision } from '@nocobase/app-plugin-authorization/client';
import { ChevronsUpDown } from 'lucide-react';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#components/ui/popover';
import { useListData } from '#hooks/use-list-data';
import { StatusChoice, ReadFeedback } from './shared.js';
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
  const pages = Math.max(1, Math.ceil((request.data?.meta.total ?? 0) / 5));
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
            className='w-full justify-between'
          />
        }
      >
        <span className='truncate'>{title}</span>
        <ChevronsUpDown />
      </PopoverTrigger>
      <PopoverContent
        aria-label={label}
        align='start'
        className='w-80 max-w-[calc(100vw-2rem)] max-h-[min(28rem,var(--available-height))] overflow-hidden'
      >
        <Input
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
            if (e.key === 'Enter' && !composingRef.current) e.preventDefault();
          }}
        />
        {kind === 'customers' && (
          <StatusChoice
            all
            value={status}
            onChange={(next) => {
              setStatus(next);
              setPage(1);
            }}
          />
        )}
        <div className='min-h-0 overflow-y-auto' aria-live='polite'>
          {request.loading || request.error ? (
            <ReadFeedback error={request.error} retry={request.reload} />
          ) : request.data?.data.length ? (
            <div className='flex flex-col gap-1'>
              {request.data.data.map((option) => (
                <Button
                  type='button'
                  key={option.id}
                  variant={option.id === value ? 'secondary' : 'ghost'}
                  className='h-auto justify-start whitespace-normal text-left'
                  aria-pressed={option.id === value}
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                >
                  {option.name}
                </Button>
              ))}
            </div>
          ) : (
            <p className='p-2 text-muted-foreground'>
              {t('customerContacts.noResults')}
            </p>
          )}
        </div>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <Button
            type='button'
            variant='outline'
            disabled={page <= 1 || request.loading}
            onClick={() => setPage((p) => p - 1)}
          >
            {t('customerContacts.previous')}
          </Button>
          <span className='text-xs'>
            {t('customerContacts.page', { page, pages })}
          </span>
          <Button
            type='button'
            variant='outline'
            disabled={page >= pages || request.loading}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('customerContacts.next')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
