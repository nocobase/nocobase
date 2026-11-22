import {
  mailErrorMessage,
  useMailClient,
  type MailWorkspaceActionProps,
} from '@nocobase/app-plugin-mail/client';
import { useTranslation } from '@nocobase/i18n/client';
import { FlaskConical } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import {
  DEMO_MAILBOX_PROFILES,
  setUpDemoMailboxes,
} from '../hooks/demo-mailboxes.js';

/**
 * A Mail workspace action (`mail.slots.workspaceActions`) that connects the three offline demo mailboxes and seeds
 * sample templates, signatures and labels. It disappears once every demo mailbox is connected.
 */
export function DemoSetupAction({
  accounts,
  reload,
}: MailWorkspaceActionProps): ReactElement | null {
  const { t } = useTranslation('@nocobase/app-plugin-mail-example');
  const mail = useMailClient();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string>();
  const connected = DEMO_MAILBOX_PROFILES.every((profile) =>
    accounts.some(
      (account) =>
        account.provider.type === profile.providerType &&
        account.provider.name === profile.providerName,
    ),
  );
  if (connected && !running) return null;

  const run = (): void => {
    setRunning(true);
    setError(undefined);
    void setUpDemoMailboxes(mail)
      .then(() => reload())
      .catch((cause: unknown) => {
        setError(mailErrorMessage(cause, t('demo.setupFailed')));
      })
      .finally(() => setRunning(false));
  };

  return (
    <span className='inline-flex items-center gap-2'>
      <button
        className='inline-flex h-9 items-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium hover:bg-muted disabled:opacity-50'
        disabled={running}
        onClick={run}
        type='button'
      >
        <FlaskConical aria-hidden='true' className='size-4' />
        {running ? t('demo.preparing') : t('demo.setUp')}
      </button>
      {error ? (
        <span className='text-sm text-destructive' role='alert'>
          {error}
        </span>
      ) : null}
    </span>
  );
}
