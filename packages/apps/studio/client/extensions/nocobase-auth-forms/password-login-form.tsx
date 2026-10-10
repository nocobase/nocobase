import {
  useId,
  useState,
  type FormEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import { invalidProps } from './field-props.js';
import { AuthField, AuthFormStatus, AuthFormSubmit } from './form-parts.js';
import { PasswordInput } from './password-input.js';

export interface PasswordLoginValues {
  readonly identifier: string;
  readonly password: string;
}

export interface PasswordLoginLabels {
  readonly identifier: string;
  readonly password: string;
  readonly submit: string;
  readonly submitting: string;
  readonly showPassword: string;
  readonly hidePassword: string;
}

const defaultPasswordLoginLabels: PasswordLoginLabels = {
  identifier: 'Username or email',
  password: 'Password',
  submit: 'Sign in',
  submitting: 'Signing in…',
  showPassword: 'Show password',
  hidePassword: 'Hide password',
};

export interface PasswordLoginFormProps {
  /** Called with the trimmed identifier and the password when the form is submitted. */
  readonly onSubmit: (values: PasswordLoginValues) => void | Promise<void>;
  /** Disables the submit button and shows `labels.submitting`. */
  readonly submitting?: boolean;
  /** A message about the whole attempt, such as wrong credentials. */
  readonly error?: ReactNode;
  readonly fieldErrors?: Partial<Record<keyof PasswordLoginValues, ReactNode>>;
  readonly labels?: Partial<PasswordLoginLabels>;
  /** Rendered under the password input, right-aligned, usually a link to the forgot-password page. It comes after the input in tab order. */
  readonly forgotPasswordLink?: ReactNode;
  /** Rendered under the submit button, usually a line linking to sign-up. */
  readonly footer?: ReactNode;
  readonly className?: string;
}

/** Sign in with a username or email and a password. */
export function PasswordLoginForm({
  className,
  error,
  fieldErrors,
  footer,
  forgotPasswordLink,
  labels: labelOverrides,
  onSubmit,
  submitting = false,
}: PasswordLoginFormProps): ReactElement {
  const labels = { ...defaultPasswordLoginLabels, ...labelOverrides };
  const id = useId();
  const identifierId = `${id}-identifier`;
  const passwordId = `${id}-password`;
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void onSubmit({ identifier: identifier.trim(), password });
  };

  return (
    <form className={className} onSubmit={handleSubmit}>
      <FieldGroup>
        <AuthField
          error={fieldErrors?.identifier}
          id={identifierId}
          label={labels.identifier}
        >
          <Input
            autoComplete='username'
            autoFocus
            id={identifierId}
            onChange={(event) => setIdentifier(event.target.value)}
            required
            value={identifier}
            {...invalidProps(identifierId, fieldErrors?.identifier)}
          />
        </AuthField>
        <AuthField
          below={forgotPasswordLink}
          error={fieldErrors?.password}
          id={passwordId}
          label={labels.password}
        >
          <PasswordInput
            autoComplete='current-password'
            hideLabel={labels.hidePassword}
            id={passwordId}
            onChange={(event) => setPassword(event.target.value)}
            required
            showLabel={labels.showPassword}
            value={password}
            {...invalidProps(passwordId, fieldErrors?.password)}
          />
        </AuthField>
        {error ? <AuthFormStatus type='error'>{error}</AuthFormStatus> : null}
        <AuthFormSubmit footer={footer}>
          <Button className='w-full' disabled={submitting} type='submit'>
            {submitting ? labels.submitting : labels.submit}
          </Button>
        </AuthFormSubmit>
      </FieldGroup>
    </form>
  );
}
