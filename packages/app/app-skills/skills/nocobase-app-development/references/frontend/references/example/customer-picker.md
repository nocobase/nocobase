# Choosing a related record: `customer-picker.tsx`

Part of the [projects worked example](../example.md).

**Depends on**: [session alert](session-expired-alert.md), [copy](copy.md).

**Add first**: `yes n | pnpm exec shadcn add combobox`, then format the files it creates ([how](../shadcn.md#1-what-the-template-ships-and-how-to-add-the-rest)).

Rules: ["Choosing a related record" in `form.md`](../form.md#choosing-a-related-record).

```tsx
// client/pages/projects/customer-picker.tsx
import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useEffect, useState } from 'react';

import { SessionExpiredAlert } from '#components/session-expired-alert';
import { Button } from '#components/ui/button';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '#components/ui/combobox';

/** One option: the id the form stores and the name the user reads. */
interface CustomerOption {
  readonly value: string;
  readonly label: string;
}

export interface CustomerPickerProps {
  readonly id: string;
  /** The selected customer's id as a string; an empty string when none is selected. */
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onBlur: () => void;
  readonly invalid: boolean;
}

/** Assumes GET /api/customers takes `pageSize` (at most 100) and returns { data: { id, name }[], meta: { page, pageSize, total } }. */
export function CustomerPicker({
  id,
  value,
  onChange,
  onBlur,
  invalid,
}: CustomerPickerProps): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState<{
    readonly key: number;
    readonly options?: CustomerOption[];
    readonly error?: unknown;
  }>();

  useEffect(() => {
    const controller = new AbortController();
    const key = reloadCount;
    api
      .request<{
        data: { id: string; name: string }[];
        meta: { page: number; pageSize: number; total: number };
      }>({
        path: 'customers',
        query: { pageSize: 100 },
        signal: controller.signal,
      })
      .then(
        ({ data }) => {
          if (controller.signal.aborted) return;
          setResult({
            key,
            options: data.map((customer) => ({
              value: customer.id,
              label: customer.name,
            })),
          });
        },
        (error: unknown) => {
          if (!controller.signal.aborted) setResult({ key, error });
        },
      );
    return () => controller.abort();
  }, [api, reloadCount]);

  const loading = result?.key !== reloadCount;
  const error = loading ? undefined : result?.error;
  const options = result?.options ?? [];
  // The form stores the id; the combobox works with option objects, so find the one the id names.
  const selected = options.find((option) => option.value === value) ?? null;

  if (error instanceof ApiClientError && error.status === 401) {
    return <SessionExpiredAlert />;
  }
  if (error) {
    // The control has no dropdown to show an error in, so explain it in its place (guideline S4).
    const forbidden = error instanceof ApiClientError && error.status === 403;
    return (
      <div
        role='alert'
        className='flex items-center gap-2 text-sm text-destructive'
      >
        <span>
          {forbidden
            ? t('projects.customer.forbidden')
            : t('projects.customer.loadFailed')}
        </span>
        {forbidden ? null : (
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => setReloadCount((count) => count + 1)}
          >
            {t('status.retry')}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Combobox
      items={options}
      value={selected}
      onValueChange={(item: CustomerOption | null) =>
        onChange(item?.value ?? '')
      }
      itemToStringLabel={(item: CustomerOption) => item.label}
      isItemEqualToValue={(item: CustomerOption, current: CustomerOption) =>
        item.value === current.value
      }
    >
      <ComboboxInput
        id={id}
        // Disabled until the options arrive, so an edit form never shows an id without its name.
        disabled={loading}
        placeholder={
          loading ? t('status.loading') : t('projects.customer.placeholder')
        }
        aria-invalid={invalid}
        onBlur={onBlur}
        showClear
      />
      <ComboboxContent>
        <ComboboxEmpty>{t('projects.customer.empty')}</ComboboxEmpty>
        <ComboboxList>
          {(item: CustomerOption) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
```
