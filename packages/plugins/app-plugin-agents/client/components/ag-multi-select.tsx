import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, type ReactNode, useState } from 'react';

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

export interface AgMultiSelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
  /** Rendered in the list and the chip instead of the plain label (a colored dot, an icon). */
  readonly render?: ReactNode;
}

const CREATE_PREFIX = '\u0000create:';

/**
 * A chips multi-select over id values, built on the Base UI `Combobox multiple` the schedule reference uses.
 *
 * With `onCreate`, typing a name no option has offers "Create …"; choosing it calls `onCreate` with the typed text
 * and selects the id it resolves to (labels are created this way,).
 */
export function AgMultiSelect({
  id,
  options,
  value,
  onChange,
  onCreate,
  placeholder,
  emptyText,
  disabled,
  'aria-label': ariaLabel,
}: {
  readonly id?: string;
  readonly options: readonly AgMultiSelectOption[];
  readonly value: readonly string[];
  readonly onChange: (value: string[]) => void;
  readonly onCreate?: (name: string) => Promise<string | undefined>;
  readonly placeholder?: string;
  readonly emptyText?: string;
  readonly disabled?: boolean;
  readonly 'aria-label'?: string;
}): ReactElement {
  const { t } = useTranslation();
  const anchor = useComboboxAnchor();
  const [input, setInput] = useState('');
  const [creating, setCreating] = useState(false);

  const byValue = new Map(options.map((option) => [option.value, option]));
  const typed = input.trim();
  const canCreate =
    onCreate !== undefined &&
    typed !== '' &&
    !options.some(
      (option) => option.label.toLowerCase() === typed.toLowerCase(),
    );
  const items = [
    ...options.map((option) => option.value),
    ...(canCreate ? [CREATE_PREFIX + typed] : []),
  ];
  const labelOf = (item: string): string =>
    item.startsWith(CREATE_PREFIX)
      ? t('common.createNamed', { name: item.slice(CREATE_PREFIX.length) })
      : (byValue.get(item)?.label ?? item);

  async function handleChange(next: string[]): Promise<void> {
    const created = next.find((item) => item.startsWith(CREATE_PREFIX));
    const kept = next.filter((item) => !item.startsWith(CREATE_PREFIX));
    if (!created || !onCreate) {
      onChange(kept);
      return;
    }
    setCreating(true);
    try {
      const newId = await onCreate(created.slice(CREATE_PREFIX.length));
      onChange(newId ? [...kept, newId] : kept);
      setInput('');
    } finally {
      setCreating(false);
    }
  }

  return (
    <Combobox
      multiple
      autoHighlight
      items={items}
      value={[...value]}
      disabled={disabled || creating}
      itemToStringLabel={labelOf}
      inputValue={input}
      onInputValueChange={setInput}
      onValueChange={(next: string[]) => void handleChange(next)}
    >
      <ComboboxChips ref={anchor} className='min-h-8'>
        <ComboboxValue>
          {value.map((item) => (
            // A disabled option cannot be removed either (a role the viewer may not revoke, ).
            <ComboboxChip key={item} showRemove={!byValue.get(item)?.disabled}>
              {byValue.get(item)?.render ?? labelOf(item)}
            </ComboboxChip>
          ))}
        </ComboboxValue>
        <ComboboxChipsInput
          id={id}
          aria-label={ariaLabel}
          placeholder={value.length === 0 ? placeholder : undefined}
        />
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>{emptyText ?? t('common.noOptions')}</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem
              key={item}
              value={item}
              disabled={byValue.get(item)?.disabled}
            >
              {byValue.get(item)?.render ?? labelOf(item)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
