import { useEffect, useState, type ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import type {
  ReviewerReference,
  ReviewerReferenceType,
} from '../../shared/parameter-configuration.js';
import type { ParameterApi } from '../lib/parameter-api.js';
import { useLoader } from '../lib/use-loader.js';
import { NAMESPACE } from '../lib/format.js';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
} from './ui/combobox.js';
import { Button } from './ui/button.js';

/** Queries one scoped reference type only after a name is entered. */
export function ReviewerReferenceSelect({
  api,
  type,
  value,
  disabled,
  onChange,
}: {
  readonly api: ParameterApi;
  readonly type: ReviewerReferenceType;
  readonly value: string;
  readonly disabled: boolean;
  readonly onChange: (id: string) => void;
}): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selection, setSelection] = useState<ReviewerReference | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);
  const selected = useLoader(
    value ? () => api.reference(type, value) : undefined,
    `selected:${type}:${value}`,
  );
  const result = useLoader(
    search && query.trim() === search && !disabled
      ? () => api.references(type, search, page)
      : undefined,
    `search:${type}:${query}:${search}:${page}:${disabled}`,
  );
  const items = result.data?.data ?? [];
  const current =
    selection?.id === value
      ? selection
      : (selected.data ?? (value ? { id: value, name: value } : null));
  return (
    <Combobox<ReviewerReference>
      items={items}
      filter={null}
      value={current}
      disabled={disabled}
      itemToStringLabel={(item) => item.name}
      itemToStringValue={(item) => item.id}
      isItemEqualToValue={(item, selectedValue) => item.id === selectedValue.id}
      onInputValueChange={(input, details) => {
        if (
          details.reason === 'input-change' ||
          details.reason === 'input-clear'
        ) {
          setQuery(input);
          setPage(1);
        }
      }}
      onValueChange={(item) => {
        setSelection(item);
        onChange(item?.id ?? '');
        setQuery('');
      }}
    >
      <ComboboxInput
        aria-label={t('parameters.reference')}
        placeholder={t('parameters.searchReference')}
        className='min-w-0 w-full'
      />
      <ComboboxContent>
        <ComboboxList>
          {(item: ReviewerReference) => (
            <ComboboxItem key={item.id} value={item}>
              {item.name}
            </ComboboxItem>
          )}
        </ComboboxList>
        {(!items.length || result.error) && (
          <p
            role={result.error ? 'alert' : 'status'}
            className='p-3 text-sm text-muted-foreground'
          >
            {result.error ||
              (!query.trim()
                ? t('parameters.searchReference')
                : !result.data
                  ? t('parameters.loading')
                  : t('parameters.noMatches'))}
          </p>
        )}
        {result.data && result.data.meta.total > result.data.meta.pageSize && (
          <div className='flex items-center justify-between gap-2 border-t p-2'>
            <Button
              type='button'
              variant='ghost'
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              {t('parameters.previousPage')}
            </Button>
            <span className='text-xs'>
              {page} /{' '}
              {Math.ceil(result.data.meta.total / result.data.meta.pageSize)}
            </span>
            <Button
              type='button'
              variant='ghost'
              disabled={
                page * result.data.meta.pageSize >= result.data.meta.total
              }
              onClick={() => setPage(page + 1)}
            >
              {t('parameters.nextPage')}
            </Button>
          </div>
        )}
      </ComboboxContent>
    </Combobox>
  );
}
