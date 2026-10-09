import type { ReactElement } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select.js';

export interface ChoiceOption {
  readonly value: string;
  readonly label: string;
}

/** A select over a short fixed list, for form fields. */
export function Choice({
  value,
  options,
  onChange,
  label,
  className,
  disabled,
}: {
  readonly value: string;
  readonly options: readonly ChoiceOption[];
  readonly onChange: (value: string) => void;
  readonly label: string;
  readonly className?: string;
  readonly disabled?: boolean;
}): ReactElement {
  return (
    <Select
      items={options}
      value={value}
      disabled={disabled}
      onValueChange={(next) => {
        if (typeof next === 'string') onChange(next);
      }}
    >
      <SelectTrigger aria-label={label} className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
