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

export interface PasswordResetRequestValues {
  readonly email: string;
}

export interface PasswordResetRequestLabels {
  readonly email: string;
  readonly submit: string;
  readonly submitting: string;
  /** Shown while `success` is set. */
  readonly success: string;
}

const defaultPasswordResetRequestLabels: PasswordResetRequestLabels = {
  email: 'Email',
  submit: 'Send reset link',
  submitting: 'Sending…',
  success: 'If the account exists, a reset link has been sent.',
};

export interface PasswordResetRequestFormProps {
  readonly onSubmit: (
    values: PasswordResetRequestValues,
  ) => void | Promise<void>;
  readonly submitting?: boolean;
  /** Shows `labels.success` once the request has been accepted. */
  readonly success?: boolean;
  readonly error?: ReactNode;
  readonly fieldErrors?: Partial<
    Record<keyof PasswordResetRequestValues, ReactNode>
  >;
  readonly labels?: Partial<PasswordResetRequestLabels>;
  readonly footer?: ReactNode;
  readonly className?: string;
}

/** Ask for a password reset link by email. */
export function PasswordResetRequestForm({
  className,
  error,
  fieldErrors,
  footer,
  labels: labelOverrides,
  onSubmit,
  submitting = false,
  success = false,
}: PasswordResetRequestFormProps): ReactElement {
  const labels = { ...defaultPasswordResetRequestLabels, ...labelOverrides };
  const emailId = `${useId()}-email`;
  const [email, setEmail] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void onSubmit({ email: email.trim() });
  };

  return (
    <form className={className} onSubmit={handleSubmit}>
      <FieldGroup>
        <AuthField error={fieldErrors?.email} id={emailId} label={labels.email}>
          <Input
            autoComplete='email'
            autoFocus
            id={emailId}
            onChange={(event) => setEmail(event.target.value)}
            required
            type='email'
            value={email}
            {...invalidProps(emailId, fieldErrors?.email)}
          />
        </AuthField>
        {error ? (
          <AuthFormStatus type='error'>{error}</AuthFormStatus>
        ) : success ? (
          <AuthFormStatus type='success'>{labels.success}</AuthFormStatus>
        ) : null}
        <AuthFormSubmit footer={footer}>
          <Button className='w-full' disabled={submitting} type='submit'>
            {submitting ? labels.submitting : labels.submit}
          </Button>
        </AuthFormSubmit>
      </FieldGroup>
    </form>
  );
}
