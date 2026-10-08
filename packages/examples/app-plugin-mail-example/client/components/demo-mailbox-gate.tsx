import type { MailAccountView } from '@nocobase/app-plugin-mail/client';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement, ReactNode } from 'react';
import { useDemoMailbox } from '../hooks/use-demo-mailbox.js';
import {
  ExamplePageContainer,
  ExamplePageHeader,
} from './example-page-layout.js';

export function DemoMailboxGate({
  children,
}: {
  readonly children: (
    accounts: readonly MailAccountView[],
    retry: () => void,
  ) => ReactNode;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-mail-example');
  const { accounts, error, loading, retry } = useDemoMailbox();

  if (loading || accounts.length === 0) {
    return (
      <ExamplePageContainer>
        <ExamplePageHeader
          title={t('accounts.title')}
          description={t('accounts.description')}
        />
        <section className='rounded-xl border bg-card p-6'>
          {error ? (
            <div className='space-y-3' role='alert'>
              <p className='text-sm text-destructive'>{error}</p>
              <button
                className='rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-muted'
                onClick={retry}
                type='button'
              >
                {t('demo.retry')}
              </button>
            </div>
          ) : (
            <p aria-live='polite' className='text-sm text-muted-foreground'>
              {t('demo.preparing')}
            </p>
          )}
        </section>
      </ExamplePageContainer>
    );
  }

  return <>{children(accounts, retry)}</>;
}
