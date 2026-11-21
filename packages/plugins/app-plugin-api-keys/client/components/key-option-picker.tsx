import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useState, type ReactElement } from 'react';

import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { API_KEYS_NAMESPACE } from '../namespace.js';

export interface KeyOption {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
}

/** Searches keys and picks one by its key id; shows the chosen one with a way to change it. */
export function KeyOptionPicker({
  value,
  onChange,
  search,
  resolve,
  label,
}: {
  readonly value: string;
  readonly onChange: (id: string | undefined) => void;
  readonly search: (query: string) => Promise<readonly KeyOption[]>;
  /** The option chosen, by its id, however far down the list it is. */
  readonly resolve?: (id: string) => Promise<KeyOption | undefined>;
  readonly label: string;
}): ReactElement {
  const { t } = useTranslation(API_KEYS_NAMESPACE);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<readonly KeyOption[]>();
  const [chosen, setChosen] = useState<KeyOption>();
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      search(query.trim()).then(
        (found) => {
          if (!active) return;
          setOptions(found);
          const match = found.find((option) => option.id === value);
          if (match) setChosen(match);
        },
        () => {
          if (active) setOptions([]);
        },
      );
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, search, value]);
  // The option chosen is named even when no search lists it, such as one opened from a link.
  useEffect(() => {
    if (!value || !resolve) return;
    let active = true;
    resolve(value).then(
      (found) => {
        if (active && found) setChosen(found);
      },
      () => undefined,
    );
    return () => {
      active = false;
    };
  }, [value, resolve]);
  if (value)
    return (
      <div className='flex flex-wrap items-center gap-2 text-sm'>
        <span className='text-muted-foreground'>{label}</span>
        <span className='font-medium'>{chosen?.title ?? value}</span>
        {chosen?.description ? (
          <span className='text-muted-foreground'>{chosen.description}</span>
        ) : null}
        <Button
          type='button'
          size='sm'
          variant='outline'
          onClick={() => onChange(undefined)}
        >
          {t('check.change')}
        </Button>
      </div>
    );
  return (
    <div className='grid max-w-md gap-2'>
      <Input
        value={query}
        placeholder={t('check.search')}
        aria-label={label}
        onChange={(event) => setQuery(event.target.value)}
      />
      <ul className='grid gap-1'>
        {(options ?? []).map((option) => (
          <li key={option.id}>
            <button
              type='button'
              className='w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted'
              onClick={() => {
                setChosen(option);
                onChange(option.id);
              }}
            >
              <span className='font-medium'>{option.title}</span>
              {option.description ? (
                <span className='ml-2 text-muted-foreground'>
                  {option.description}
                </span>
              ) : null}
            </button>
          </li>
        ))}
        {options?.length === 0 ? (
          <li className='px-2 text-sm text-muted-foreground'>
            {t('check.none')}
          </li>
        ) : null}
      </ul>
    </div>
  );
}
