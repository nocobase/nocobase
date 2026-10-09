import {
  useId,
  useState,
  type FormEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

import { Button } from '#components/ui/button';
import { FieldGroup } from '#components/ui/field';
import { Input } from '#components/ui/input';

import { invalidProps } from './field-props.js';
import { AuthField, AuthFormStatus, AuthFormSubmit } from './form-parts.js';

export interface PasswordRegistrationValues {
  readonly name: string;
  readonly username: string;
  readonly email: string;
  readonly password: string;
}

export interface PasswordRegistrationLabels {
  readonly name: string;
  readonly username: string;
  readonly email: string;
  readonly password: string;
  readonly confirmPassword: string;
  readonly submit: string;
  readonly submitting: string;
  /** Shown under the confirmation when it differs from the password; the form checks this itself. */
  readonly passwordMismatch: string;
}

const defaultPasswordRegistrationLabels: PasswordRegistrationLabels = {
  name: 'Name',
  username: 'Username',
  email: 'Email',
  password: 'Password',
  confirmPassword: 'Confirm password',
  submit: 'Create account',
  submitting: 'Creating account…',
  passwordMismatch: "Passwords don't match.",
};

export interface PasswordRegistrationFormProps {
  /** Called once the password and its confirmation match. */
  readonly onSubmit: (
    values: PasswordRegistrationValues,
  ) => void | Promise<void>;
  readonly submitting?: boolean;
  readonly error?: ReactNode;
  readonly fieldErrors?: Partial<
    Record<keyof PasswordRegistrationValues, ReactNode>
  >;
  readonly labels?: Partial<PasswordRegistrationLabels>;
  /** Rendered under the submit button, usually a line linking back to sign-in. */
  readonly footer?: ReactNode;
  readonly className?: string;
}

/** Create an account with a name, username, email and password. */
export function PasswordRegistrationForm({
  className,
  error,
  fieldErrors,
  footer,
  labels: labelOverrides,
  onSubmit,
  submitting = false,
}: PasswordRegistrationFormProps): ReactElement {
  const labels = { ...defaultPasswordRegistrationLabels, ...labelOverrides };
  const id = useId();
  const ids = {
    name: `${id}-name`,
    username: `${id}-username`,
    email: `${id}-email`,
    password: `${id}-password`,
    confirmation: `${id}-confirmation`,
  };
  const [values, setValues] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmation: '',
  });
  const [mismatch, setMismatch] = useState(false);
  const set =
    (field: keyof typeof values) =>
    (event: { target: { value: string } }): void =>
      setValues((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (values.password !== values.confirmation) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    void onSubmit({
      name: values.name.trim(),
      username: values.username.trim(),
      email: values.email.trim(),
      password: values.password,
    });
  };

  const confirmationError = mismatch ? labels.passwordMismatch : undefined;

  return (
    <form className={className} onSubmit={handleSubmit}>
      <FieldGroup>
        <AuthField error={fieldErrors?.name} id={ids.name} label={labels.name}>
          <Input
            autoComplete='name'
            autoFocus
            id={ids.name}
            onChange={set('name')}
            required
            value={values.name}
            {...invalidProps(ids.name, fieldErrors?.name)}
          />
        </AuthField>
        <AuthField
          error={fieldErrors?.username}
          id={ids.username}
          label={labels.username}
        >
          <Input
            autoComplete='username'
            id={ids.username}
            onChange={set('username')}
            required
            value={values.username}
            {...invalidProps(ids.username, fieldErrors?.username)}
          />
        </AuthField>
        <AuthField
          error={fieldErrors?.email}
          id={ids.email}
          label={labels.email}
        >
          <Input
            autoComplete='email'
            id={ids.email}
            onChange={set('email')}
            required
            type='email'
            value={values.email}
            {...invalidProps(ids.email, fieldErrors?.email)}
          />
        </AuthField>
        <AuthField
          error={fieldErrors?.password}
          id={ids.password}
          label={labels.password}
        >
          <Input
            autoComplete='new-password'
            id={ids.password}
            onChange={set('password')}
            required
            type='password'
            value={values.password}
            {...invalidProps(ids.password, fieldErrors?.password)}
          />
        </AuthField>
        <AuthField
          error={confirmationError}
          id={ids.confirmation}
          label={labels.confirmPassword}
        >
          <Input
            autoComplete='new-password'
            id={ids.confirmation}
            onChange={set('confirmation')}
            required
            type='password'
            value={values.confirmation}
            {...invalidProps(ids.confirmation, confirmationError)}
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
