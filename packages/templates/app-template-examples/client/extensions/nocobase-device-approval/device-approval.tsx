import { useTranslation } from '@nocobase/i18n/client';
import { CircleAlert, CircleCheck, CircleX, Clock } from 'lucide-react';
import {
  useId,
  useState,
  type FormEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

import { Alert, AlertDescription } from '#components/ui/alert';
import { Button } from '#components/ui/button';
import { Field, FieldGroup, FieldLabel } from '#components/ui/field';
import { Input } from '#components/ui/input';
import { Spinner } from '#components/ui/spinner';
import { cn } from 'cn';

import {
  formatUserCode,
  useDeviceApproval,
  type DeviceApprovalStatus,
} from './use-device-approval.js';

export interface DeviceApprovalProps {
  /** The code from the address (`?user_code=`); without one the person types it. */
  readonly userCode?: string | null;
  /** Called with the code the person typed: put it in the address, so a reload keeps it. */
  readonly onUserCodeChange: (userCode: string) => void;
  readonly className?: string;
}

/**
 * Approves or denies a device sign-in (RFC 8628) for the signed-in person: the code from the address, or one they
 * type, checked against the server and shown so they can compare it with their device, then Approve or Deny. Render it
 * on a page only signed-in people reach, inside the application's authentication layout.
 */
export function DeviceApproval({
  className,
  onUserCodeChange,
  userCode,
}: DeviceApprovalProps): ReactElement {
  const { t } = useTranslation();
  const approval = useDeviceApproval(userCode ?? undefined);
  const { status } = approval;

  if (status === 'idle')
    return <CodeEntry className={className} onSubmit={onUserCodeChange} />;

  const busy = status === 'approving' || status === 'denying';
  const enterAnother = (
    <Button onClick={() => onUserCodeChange('')} type='button' variant='link'>
      {t('deviceApproval.otherCode', { defaultValue: 'Enter another code' })}
    </Button>
  );

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {status === 'checking' ? (
        <p className='flex items-center justify-center gap-2 text-sm text-muted-foreground'>
          <Spinner aria-hidden='true' />
          {t('deviceApproval.checking', {
            defaultValue: 'Checking the code…',
          })}
        </p>
      ) : (
        <CodeDisplay clientId={approval.clientId} userCode={userCode ?? ''} />
      )}
      {status === 'ready' || busy ? (
        <div className='flex flex-col gap-4'>
          <p className='text-center text-sm text-muted-foreground'>
            {t('deviceApproval.confirm', {
              defaultValue:
                'Check that this code matches the one your device shows.',
            })}
          </p>
          <div className='grid grid-cols-2 gap-2'>
            <Button
              disabled={busy}
              onClick={() => void approval.deny()}
              type='button'
              variant='outline'
            >
              {status === 'denying'
                ? t('deviceApproval.denying', { defaultValue: 'Denying…' })
                : t('deviceApproval.deny', { defaultValue: 'Deny' })}
            </Button>
            <Button
              disabled={busy}
              onClick={() => void approval.approve()}
              type='button'
            >
              {status === 'approving'
                ? t('deviceApproval.approving', {
                    defaultValue: 'Approving…',
                  })
                : t('deviceApproval.approve', { defaultValue: 'Approve' })}
            </Button>
          </div>
        </div>
      ) : null}
      <Outcome onRetry={approval.retry} status={status} />
      {status === 'invalid' ||
      status === 'expired' ||
      status === 'notYours' ||
      status === 'error' ? (
        <div className='flex justify-center'>{enterAnother}</div>
      ) : null}
    </div>
  );
}

function CodeEntry({
  className,
  onSubmit,
}: {
  readonly className?: string | undefined;
  readonly onSubmit: (userCode: string) => void;
}): ReactElement {
  const { t } = useTranslation();
  const id = useId();
  const [typed, setTyped] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const code = typed.trim();
    if (code) onSubmit(formatUserCode(code));
  };
  return (
    <form className={cn('flex flex-col gap-6', className)} onSubmit={submit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={id}>
            {t('deviceApproval.codeLabel', { defaultValue: 'Code' })}
          </FieldLabel>
          <Input
            autoCapitalize='characters'
            autoComplete='one-time-code'
            autoFocus
            className='font-mono tracking-widest uppercase'
            id={id}
            onChange={(event) => setTyped(event.target.value)}
            placeholder='ABCD-EFGH'
            spellCheck={false}
            value={typed}
          />
        </Field>
      </FieldGroup>
      <p className='text-sm text-muted-foreground'>
        {t('deviceApproval.enterCode', {
          defaultValue: 'Enter the code your device shows.',
        })}
      </p>
      <Button disabled={typed.trim() === ''} type='submit'>
        {t('deviceApproval.continue', { defaultValue: 'Continue' })}
      </Button>
    </form>
  );
}

function CodeDisplay({
  clientId,
  userCode,
}: {
  readonly clientId?: string | undefined;
  readonly userCode: string;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <div className='flex flex-col items-center gap-1 rounded-lg border bg-muted p-4 text-center'>
      <span className='text-xs text-muted-foreground'>
        {t('deviceApproval.codeLabel', { defaultValue: 'Code' })}
      </span>
      <span
        className='font-mono text-2xl font-semibold tracking-widest'
        data-user-code
      >
        {formatUserCode(userCode)}
      </span>
      {clientId ? (
        <span className='text-sm text-muted-foreground'>
          {t('deviceApproval.client', {
            client: clientId,
            defaultValue: 'Requested by {{client}}',
          })}
        </span>
      ) : null}
    </div>
  );
}

function Outcome({
  onRetry,
  status,
}: {
  readonly onRetry: () => void;
  readonly status: DeviceApprovalStatus;
}): ReactElement | null {
  const { t } = useTranslation();
  const message = (
    icon: ReactNode,
    text: string,
    tone: 'default' | 'destructive',
    action?: ReactNode,
  ) => (
    <Alert role={tone === 'destructive' ? 'alert' : 'status'} variant={tone}>
      {icon}
      <AlertDescription>
        {text}
        {action}
      </AlertDescription>
    </Alert>
  );
  switch (status) {
    case 'approved':
      return message(
        <CircleCheck aria-hidden='true' />,
        t('deviceApproval.approved', {
          defaultValue:
            'Device approved. Return to your terminal to continue; you can close this page.',
        }),
        'default',
      );
    case 'denied':
      return message(
        <CircleX aria-hidden='true' />,
        t('deviceApproval.denied', {
          defaultValue:
            'Request denied. The device was not signed in; you can close this page.',
        }),
        'default',
      );
    case 'expired':
      return message(
        <Clock aria-hidden='true' />,
        t('deviceApproval.expired', {
          defaultValue:
            'This code has expired. Start the sign-in on your device again.',
        }),
        'destructive',
      );
    case 'invalid':
      return message(
        <CircleAlert aria-hidden='true' />,
        t('deviceApproval.invalid', {
          defaultValue:
            'This code is not valid. Check it against your device and try again.',
        }),
        'destructive',
      );
    case 'notYours':
      return message(
        <CircleAlert aria-hidden='true' />,
        t('deviceApproval.notYours', {
          defaultValue:
            'This code is already being approved by another account.',
        }),
        'destructive',
      );
    case 'error':
      return message(
        <CircleAlert aria-hidden='true' />,
        t('deviceApproval.error', {
          defaultValue: 'Something went wrong. Try again.',
        }),
        'destructive',
        <Button
          className='h-auto p-0'
          onClick={onRetry}
          type='button'
          variant='link'
        >
          {t('deviceApproval.retry', { defaultValue: 'Try again' })}
        </Button>,
      );
    default:
      return null;
  }
}
