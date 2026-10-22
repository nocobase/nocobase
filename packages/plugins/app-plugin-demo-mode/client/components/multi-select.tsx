import { type ReactElement } from 'react';

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from './ui/combobox.js';

/** A searchable chips multi-select over plain string values, such as table names. */
export function MultiSelect({
  options,
  value,
  onChange,
  placeholder,
  emptyText,
  disabled,
  'aria-label': ariaLabel,
}: {
  readonly options: readonly string[];
  readonly value: readonly string[];
  readonly onChange: (value: string[]) => void;
  readonly placeholder?: string;
  readonly emptyText: string;
  readonly disabled?: boolean;
  readonly 'aria-label'?: string;
}): ReactElement {
  const anchor = useComboboxAnchor();
  return (
    <Combobox
      multiple
      autoHighlight
      items={[...options]}
      value={[...value]}
      disabled={disabled}
      onValueChange={(next: string[]) => onChange(next)}
    >
      <ComboboxChips ref={anchor} className='min-h-9'>
        <ComboboxValue>
          {value.map((item) => (
            <ComboboxChip key={item}>{item}</ComboboxChip>
          ))}
        </ComboboxValue>
        <ComboboxChipsInput
          aria-label={ariaLabel}
          placeholder={value.length === 0 ? placeholder : undefined}
        />
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>{emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
