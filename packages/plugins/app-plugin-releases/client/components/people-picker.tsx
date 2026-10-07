/** People to choose, through the application's picker (`ReleasesPeoplePickerContext`), else typed ids. */
import { useContext, useState, type ReactElement } from 'react';

import {
  ReleasesPeoplePickerContext,
  type PeoplePickerProps,
} from '../lib/people-picker.js';
import { Input } from './ui/input.js';

function TypedIds({
  value,
  onChange,
  id,
  disabled,
  placeholder,
}: PeoplePickerProps): ReactElement {
  const [text, setText] = useState(value.join(', '));
  return (
    <Input
      id={id}
      disabled={disabled}
      placeholder={placeholder}
      value={text}
      onChange={(event) => {
        setText(event.target.value);
        onChange(
          event.target.value
            .split(',')
            .map((part) => part.trim())
            .filter(Boolean),
        );
      }}
    />
  );
}

export function PeoplePicker(props: PeoplePickerProps): ReactElement {
  const picker = useContext(ReleasesPeoplePickerContext);
  if (picker) return <picker.Picker {...props} />;
  return <TypedIds {...props} />;
}
