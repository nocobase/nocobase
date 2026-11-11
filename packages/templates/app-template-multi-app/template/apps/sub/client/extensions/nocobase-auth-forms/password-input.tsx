import { Eye, EyeOff } from 'lucide-react';
import { useState, type ComponentProps, type ReactElement } from 'react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '#components/ui/input-group';

export interface PasswordInputProps extends Omit<
  ComponentProps<'input'>,
  'type'
> {
  readonly showLabel?: string;
  readonly hideLabel?: string;
}

/** A password input with a button that shows or hides what was typed. */
export function PasswordInput({
  hideLabel = 'Hide password',
  showLabel = 'Show password',
  ...props
}: PasswordInputProps): ReactElement {
  const [visible, setVisible] = useState(false);
  return (
    <InputGroup>
      <InputGroupInput {...props} type={visible ? 'text' : 'password'} />
      <InputGroupAddon align='inline-end'>
        <InputGroupButton
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
          size='icon-xs'
        >
          {visible ? <EyeOff aria-hidden='true' /> : <Eye aria-hidden='true' />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
