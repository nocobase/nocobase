import { useTranslation } from '@nocobase/i18n/client';
import { useQueryClient } from '@tanstack/react-query';
import { XIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

import { COLORS, type Color } from '../../shared/common.js';
import type { Label } from '../../shared/labels.js';
import { pmKeys } from '../api/keys.js';
import { DatePicker } from './date-picker.js';
import { PmLabelName } from './pm-labels.js';
import { PmMultiSelect } from './pm-multi-select.js';
import { Button } from './ui/button.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select.js';
import { useNotify } from '../hooks/use-notify.js';
import { usePmApi } from '../hooks/use-pm-api.js';
import { fromDateOnly, toDateOnly, useDateFnsLocale } from '../lib/format.js';

/** A label and its value, one row of the properties panel. */
export function PropertyRow({
  label,
  htmlFor,
  children,
}: {
  readonly label: ReactNode;
  readonly htmlFor?: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className='grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-3 text-sm'>
      {htmlFor ? (
        <label htmlFor={htmlFor} className='text-muted-foreground'>
          {label}
        </label>
      ) : (
        <span className='text-muted-foreground'>{label}</span>
      )}
      <div className='min-w-0'>{children}</div>
    </div>
  );
}

export interface SimpleOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

/** A select over plain options; `noneLabel` adds an empty choice, shown as a dash with `noneAsDash`. */
export function PropertySelect({
  id,
  options,
  value,
  noneLabel,
  noneAsDash = false,
  disabled,
  size = 'sm',
  renderValue,
  'aria-label': ariaLabel,
  onChange,
}: {
  readonly id: string;
  readonly options: readonly SimpleOption[];
  readonly value: string | null | undefined;
  readonly noneLabel?: string;
  readonly noneAsDash?: boolean;
  readonly disabled?: boolean;
  /** `sm` for the properties panel, `default` inside a form. */
  readonly size?: 'sm' | 'default';
  /** Draws the selected value, for example as a badge. */
  readonly renderValue?: (value: string) => ReactNode;
  readonly 'aria-label'?: string;
  readonly onChange: (value: string | null) => void;
}): ReactElement {
  const items: SimpleOption[] = [
    ...(noneLabel ? [{ value: 'none', label: noneLabel }] : []),
    ...options,
  ];
  const selected = value ?? 'none';
  // A current value the options lack (a disabled account, a deleted project) still shows.
  if (!items.some((item) => item.value === selected))
    items.push({ value: selected, label: selected });
  return (
    <Select
      items={items}
      value={selected}
      disabled={disabled}
      onValueChange={(next) => {
        if (next === null || next === selected) return;
        onChange(next === 'none' ? null : next);
      }}
    >
      <SelectTrigger
        id={id}
        size={size}
        className='w-full'
        aria-label={ariaLabel}
      >
        <SelectValue>
          {(current: string) =>
            current === 'none' && noneAsDash ? (
              <span className='text-muted-foreground'>
                —<span className='sr-only'>{noneLabel}</span>
              </span>
            ) : renderValue && current !== 'none' ? (
              renderValue(current)
            ) : (
              (items.find((item) => item.value === current)?.label ?? current)
            )
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
        {items.map((item) => (
          <SelectItem
            key={item.value}
            value={item.value}
            disabled={item.disabled}
          >
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** A calendar date with a clear button; values are `YYYY-MM-DD`. */
export function DateField({
  id,
  value,
  disabled,
  clearLabel,
  size = 'sm',
  onChange,
}: {
  readonly id: string;
  readonly value: string | null | undefined;
  readonly disabled?: boolean;
  readonly clearLabel: string;
  readonly size?: 'sm' | 'default';
  readonly onChange: (value: string | null) => void;
}): ReactElement {
  const locale = useDateFnsLocale();
  return (
    <div className='flex w-full min-w-0 items-center gap-1'>
      <DatePicker
        id={id}
        className={
          size === 'sm' ? 'h-7 min-w-0 flex-1 text-sm' : 'min-w-0 flex-1'
        }
        value={fromDateOnly(value)}
        locale={locale}
        formatString='PP'
        disabled={disabled}
        placeholder='—'
        onChange={(date) => onChange(toDateOnly(date))}
      />
      {value ? (
        <Button
          variant='ghost'
          size='icon-xs'
          className='shrink-0'
          aria-label={clearLabel}
          disabled={disabled}
          onClick={() => onChange(null)}
        >
          <XIcon />
        </Button>
      ) : null}
    </div>
  );
}

/** A colour for a new label, spread over the palette by name so labels created in a row differ. */
function colorFor(name: string): Color {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length] ?? 'gray';
}

/** Labels as a chips multi-select; with `canCreate`, typing a new name creates the label. */
export function LabelsField({
  id,
  labels,
  value,
  disabled,
  canCreate,
  onChange,
}: {
  readonly id: string;
  readonly labels: readonly Label[];
  readonly value: readonly string[];
  readonly disabled?: boolean;
  readonly canCreate: boolean;
  readonly onChange: (labelIds: string[]) => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = usePmApi();
  const notify = useNotify();
  const queryClient = useQueryClient();

  async function create(name: string): Promise<string | undefined> {
    try {
      const label = await api.createLabel({ name, color: colorFor(name) });
      queryClient.setQueryData<Label[]>(pmKeys.labels, (current) => [
        ...(current ?? []),
        label,
      ]);
      void queryClient.invalidateQueries({ queryKey: pmKeys.labels });
      return label.id;
    } catch (error) {
      notify.error(error, t('labels.createFailed'));
      return undefined;
    }
  }

  return (
    <PmMultiSelect
      id={id}
      aria-label={t('properties.labels')}
      options={labels.map((label) => ({
        value: label.id,
        label: label.name,
        render: <PmLabelName label={label} />,
      }))}
      value={value}
      disabled={disabled}
      placeholder={t('labels.placeholder')}
      emptyText={t('labels.empty')}
      {...(canCreate ? { onCreate: create } : {})}
      onChange={onChange}
    />
  );
}
