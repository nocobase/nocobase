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

export interface PasswordResetValues {
  readonly password: string;
}

export interface PasswordResetLabels {
  readonly password: string;
  readonly confirmPassword: string;
  readonly submit: string;
  readonly submitting: string;
  /** Shown under the confirmation when it differs from the password; the form checks this itself. */
  readonly passwordMismatch: string;
}

const defaultPasswordResetLabels: PasswordResetLabels = {
  password: 'New password',
  confirmPassword: 'Confirm new password',
  submit: 'Reset password',
  submitting: 'Resetting…',
  passwordMismatch: "Passwords don't match.",
};

export interface PasswordResetFormProps {
  /** Called once the new password and its confirmation match. */
  readonly onSubmit: (values: PasswordResetValues) => void | Promise<void>;
  readonly submitting?: boolean;
  /** Disables every field, for example while the reset link is missing its token. */
  readonly disabled?: boolean;
  readonly error?: ReactNode;
  readonly fieldErrors?: Partial<Record<keyof PasswordResetValues, ReactNode>>;
  readonly labels?: Partial<PasswordResetLabels>;
  readonly footer?: ReactNode;
  readonly className?: string;
}

/** Choose a new password, from the link a reset request sent. */
export function PasswordResetForm({
  className,
  disabled = false,
  error,
  fieldErrors,
  footer,
  labels: labelOverrides,
  onSubmit,
  submitting = false,
}: PasswordResetFormProps): ReactElement {
  const labels = { ...defaultPasswordResetLabels, ...labelOverrides };
  const id = useId();
  const passwordId = `${id}-password`;
  const confirmationId = `${id}-confirmation`;
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [mismatch, setMismatch] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (disabled) return;
    if (password !== confirmation) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    void onSubmit({ password });
  };

  const confirmationError = mismatch ? labels.passwordMismatch : undefined;

  return (
    <form className={className} onSubmit={handleSubmit}>
      <FieldGroup>
        <AuthField
          error={fieldErrors?.password}
          id={passwordId}
          label={labels.password}
        >
          <Input
            autoComplete='new-password'
            autoFocus
            disabled={disabled}
            id={passwordId}
            onChange={(event) => setPassword(event.target.value)}
            required
            type='password'
            value={password}
            {...invalidProps(passwordId, fieldErrors?.password)}
          />
        </AuthField>
        <AuthField
          error={confirmationError}
          id={confirmationId}
          label={labels.confirmPassword}
        >
          <Input
            autoComplete='new-password'
            disabled={disabled}
            id={confirmationId}
            onChange={(event) => setConfirmation(event.target.value)}
            required
            type='password'
            value={confirmation}
            {...invalidProps(confirmationId, confirmationError)}
          />
        </AuthField>
        {error ? <AuthFormStatus type='error'>{error}</AuthFormStatus> : null}
        <AuthFormSubmit footer={footer}>
          <Button
            className='w-full'
            disabled={disabled || submitting}
            size='lg'
            type='submit'
          >
            {submitting ? labels.submitting : labels.submit}
          </Button>
        </AuthFormSubmit>
      </FieldGroup>
    </form>
  );
}
