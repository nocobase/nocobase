import type { ReactElement } from 'react';
import {
  Combobox,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxValue,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxItem,
  useComboboxAnchor,
} from '../../components/ui/combobox.js';

export interface EmployeeSelectOption {
  value: string;
  label: string;
  group?: string;
}

interface OptionGroup {
  value: string;
  items: string[];
}

export function EmployeeMultiSelect({
  disabled,
  id,
  options,
  value,
  onChange,
  placeholder,
  removeLabel,
  emptyLabel,
}: {
  disabled: boolean;
  /** Id of the search input, for the `FieldLabel` that names the control. */
  id: string;
  options: EmployeeSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  removeLabel: string;
  emptyLabel: string;
}): ReactElement {
  const anchor = useComboboxAnchor();
  const labels = new Map(options.map((option) => [option.value, option.label]));
  const groups: OptionGroup[] = [];
  for (const option of options) {
    const groupName = option.group ?? '';
    const group = groups.find((item) => item.value === groupName);
    if (group) group.items.push(option.value);
    else groups.push({ value: groupName, items: [option.value] });
  }
  return (
    <Combobox
      multiple
      items={groups}
      value={value}
      disabled={disabled}
      itemToStringLabel={(item: string) => labels.get(item) ?? item}
      onValueChange={(next: string[]) => {
        if (!disabled) onChange(next);
      }}
    >
      <ComboboxChips
        ref={anchor}
        className={disabled ? 'opacity-50' : undefined}
      >
        <ComboboxValue>
          {value.map((key) => (
            <ComboboxChip
              key={key}
              removeLabel={`${removeLabel} ${labels.get(key) ?? key}`}
            >
              {labels.get(key) ?? key}
            </ComboboxChip>
          ))}
        </ComboboxValue>
        <ComboboxChipsInput
          id={id}
          placeholder={placeholder}
          disabled={disabled}
        />
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>{emptyLabel}</ComboboxEmpty>
        <ComboboxList>
          {(group: OptionGroup) => (
            <ComboboxGroup key={group.value} items={group.items}>
              {group.value ? (
                <ComboboxLabel>{group.value}</ComboboxLabel>
              ) : null}
              <ComboboxCollection>
                {(key: string) => (
                  <ComboboxItem key={key} value={key}>
                    {labels.get(key) ?? key}
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
