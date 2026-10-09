import { CircleAlert, CircleCheck } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

import { Alert, AlertDescription } from '#components/ui/alert';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '#components/ui/field';

import { errorId } from './field-props.js';

export interface AuthFieldProps {
  readonly id: string;
  readonly label: ReactNode;
  /** Shown at the end of the label row, such as a "Forgot password?" link. */
  readonly labelAside?: ReactNode;
  /** Shown under the control and its error, at the end of the row, such as a "Forgot password?" link. It follows the control in tab order. */
  readonly below?: ReactNode;
  readonly error?: ReactNode;
  readonly children: ReactNode;
}

/** A label, its control and the control's error message. The control takes `invalidProps(id, error)`. */
export function AuthField({
  below,
  children,
  error,
  id,
  label,
  labelAside,
}: AuthFieldProps): ReactElement {
  return (
    <Field data-invalid={error ? true : undefined}>
      <div className='flex items-center gap-2'>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {labelAside ? (
          <span className='ml-auto text-sm [&_a]:underline-offset-4 [&_a:hover]:underline'>
            {labelAside}
          </span>
        ) : null}
      </div>
      {children}
      {error ? <FieldError id={errorId(id)}>{error}</FieldError> : null}
      {below ? (
        <div className='flex justify-end text-sm text-muted-foreground [&_a]:underline-offset-4 [&_a:hover]:text-foreground [&_a:hover]:underline'>
          {below}
        </div>
      ) : null}
    </Field>
  );
}

export interface AuthFormStatusProps {
  readonly children: ReactNode;
  readonly type: 'error' | 'success';
}

/** A message about the whole form: an alert for an error, a status for a success. */
export function AuthFormStatus({
  children,
  type,
}: AuthFormStatusProps): ReactElement {
  const error = type === 'error';
  return (
    <Alert
      role={error ? 'alert' : 'status'}
      variant={error ? 'destructive' : 'default'}
    >
      {error ? (
        <CircleAlert aria-hidden='true' />
      ) : (
        <CircleCheck aria-hidden='true' />
      )}
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

export interface AuthFormSubmitProps {
  /** The submit button. */
  readonly children: ReactNode;
  /** A centred line of links under the button, such as "Don't have an account? Sign up". */
  readonly footer?: ReactNode;
}

/** The submit button and the footer line beneath it. */
export function AuthFormSubmit({
  children,
  footer,
}: AuthFormSubmitProps): ReactElement {
  return (
    <Field>
      {children}
      {footer ? (
        <FieldDescription className='text-center'>{footer}</FieldDescription>
      ) : null}
    </Field>
  );
}
