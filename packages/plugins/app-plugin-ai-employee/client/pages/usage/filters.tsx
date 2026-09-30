import { useId, type ReactElement } from 'react';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '../../components/ui/combobox.js';
import { Field, FieldLabel } from '../../components/ui/field.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select.js';
import { useT } from '../../locales/index.js';
import type { UsageFilterOption } from '../../usage-statistics-service.js';
import {
  USAGE_RANGE_KEYS,
  USAGE_RANGE_LABELS,
  type UsageRangeKey,
} from './display.js';

/** Chooses one of the preset ranges, each ending now. */
export function UsageRangeFilter({
  range,
  onChange,
}: {
  range: UsageRangeKey;
  onChange: (range: UsageRangeKey) => void;
}): ReactElement {
  const t = useT();
  const id = useId();
  return (
    <Field className='w-full sm:w-44'>
      <FieldLabel htmlFor={id}>{t('usage.range')}</FieldLabel>
      <Select
        value={range}
        onValueChange={(value) => {
          const next = USAGE_RANGE_KEYS.find((key) => key === value);
          if (next) onChange(next);
        }}
      >
        <SelectTrigger id={id} className='w-full'>
          <SelectValue>{t(USAGE_RANGE_LABELS[range])}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {USAGE_RANGE_KEYS.map((key) => (
            <SelectItem key={key} value={key}>
              {t(USAGE_RANGE_LABELS[key])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

/**
 * Chooses one value from the options the range recorded, filtered locally. A value a restored URL names stays
 * selectable even when the range no longer records it.
 */
export function UsageOptionFilter({
  label,
  placeholder,
  emptyLabel,
  options,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  emptyLabel: string;
  options: readonly UsageFilterOption[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}): ReactElement {
  const id = useId();
  const selected = value
    ? (options.find((option) => option.value === value) ?? {
        value,
        label: value,
      })
    : null;
  const items =
    selected && !options.includes(selected) ? [selected, ...options] : options;
  return (
    <Field className='w-full sm:w-56'>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Combobox
        items={items}
        value={selected}
        itemToStringLabel={(option: UsageFilterOption) => option.label}
        itemToStringValue={(option: UsageFilterOption) => option.value}
        isItemEqualToValue={(
          item: UsageFilterOption,
          current: UsageFilterOption,
        ) => item.value === current.value}
        onValueChange={(option: UsageFilterOption | null) =>
          onChange(option?.value)
        }
      >
        <ComboboxInput
          id={id}
          placeholder={placeholder}
          showClear={Boolean(selected)}
          className='w-full'
        />
        <ComboboxContent>
          <ComboboxEmpty>{emptyLabel}</ComboboxEmpty>
          <ComboboxList>
            {(option: UsageFilterOption) => (
              <ComboboxItem key={option.value} value={option}>
                <span className='min-w-0 truncate'>{option.label}</span>
                {option.label !== option.value ? (
                  <span
                    translate='no'
                    className='ml-auto truncate font-mono text-xs text-muted-foreground'
                  >
                    {option.value}
                  </span>
                ) : null}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
