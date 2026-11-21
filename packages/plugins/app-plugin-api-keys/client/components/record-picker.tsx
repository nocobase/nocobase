import { useTranslation } from '@nocobase/i18n/client';
import { ChevronDownIcon } from 'lucide-react';
import { useEffect, useState, type ReactElement } from 'react';

import { Checkbox } from '#components/ui/checkbox';
import { Input } from '#components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#components/ui/popover';
import type { KeyScopeObject } from '../../shared/scopes.js';
import { useApiKeysApi } from '../lib/api.js';
import { API_KEYS_NAMESPACE } from '../namespace.js';

/**
 * The records a key is limited to for one business: all of them (`undefined`), or the ones picked. Read-only, it only
 * says which.
 */
export function RecordPicker({
  business,
  value,
  onChange,
  readOnly = false,
  load,
  allowAll = true,
}: {
  readonly business: string;
  readonly value: readonly string[] | undefined;
  readonly onChange?: (next: readonly string[] | undefined) => void;
  readonly readOnly?: boolean;
  /** Where the records come from; the business's record source by default. */
  readonly load?: (search: string | undefined) => Promise<KeyScopeObject[]>;
  /** Offers "All records"; off where only chosen records may be given. */
  readonly allowAll?: boolean;
}): ReactElement {
  const { t } = useTranslation(API_KEYS_NAMESPACE);
  const api = useApiKeysApi();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState<readonly KeyScopeObject[]>();
  useEffect(() => {
    if (!open) return;
    let active = true;
    const timer = setTimeout(() => {
      (load ?? ((query) => api.objects(business, query)))(
        search.trim() || undefined,
      ).then(
        (found) => {
          if (active) setRecords(found);
        },
        () => {
          if (active) setRecords([]);
        },
      );
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [api, business, search, open, load]);
  const label =
    value === undefined
      ? t('create.allRecords')
      : value.length
        ? t('create.selectedRecords', { count: value.length })
        : t('create.noneSelected');
  const trigger = (
    <span
      data-slot='api-key-records'
      className={
        value !== undefined && !value.length
          ? 'text-destructive'
          : 'text-foreground'
      }
    >
      {label}
    </span>
  );
  return (
    <span className='inline-flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-muted-foreground'>
      {t('create.records')}
      {readOnly || !onChange ? (
        trigger
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger className='inline-flex items-center gap-0.5 rounded-full border bg-background px-2 leading-5 hover:border-primary'>
            {trigger}
            <ChevronDownIcon aria-hidden className='size-3' />
          </PopoverTrigger>
          <PopoverContent align='start' className='grid w-72 gap-2'>
            {allowAll ? (
              <label className='flex items-center gap-2 text-sm'>
                <Checkbox
                  checked={value === undefined}
                  onCheckedChange={(on: boolean) =>
                    onChange(on ? undefined : [])
                  }
                />
                {t('create.useAll')}
              </label>
            ) : null}
            <Input
              value={search}
              placeholder={t('create.searchRecords')}
              aria-label={t('create.searchRecords')}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className='grid max-h-56 gap-1 overflow-y-auto'>
              {records === undefined ? null : records.length === 0 ? (
                <p className='text-sm text-muted-foreground'>
                  {t('create.noRecords')}
                </p>
              ) : (
                records.map((record) => {
                  const picked = value?.includes(record.id) ?? false;
                  return (
                    <label
                      key={record.id}
                      className='flex min-w-0 items-start gap-2 text-sm'
                    >
                      <Checkbox
                        checked={picked}
                        onCheckedChange={(on: boolean) => {
                          const current = value ?? [];
                          onChange(
                            on
                              ? [...current, record.id]
                              : current.filter((id) => id !== record.id),
                          );
                        }}
                      />
                      <span className='min-w-0'>
                        <span className='block break-words'>
                          {record.title}
                        </span>
                        {record.description ? (
                          <span className='block text-xs text-muted-foreground'>
                            {record.description}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </span>
  );
}
