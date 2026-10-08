import {
  mailErrorMessage,
  type MailAccountView,
  type MailClient,
  useMailClient,
} from '@nocobase/app-plugin-mail/client';
import { useCallback, useEffect, useState } from 'react';
import { seedDemoManagement } from './seed-demo-management.js';

export interface DemoMailboxProfile {
  readonly providerType: string;
  readonly providerName: string;
  readonly address: string;
  readonly displayName: string;
  readonly providerLabel: string;
}

export const DEMO_MAILBOX_PROFILES: readonly DemoMailboxProfile[] = [
  {
    providerType: 'mail-example',
    providerName: 'demo',
    address: 'sam@example.test',
    displayName: 'Sam Demo',
    providerLabel: 'Gmail (mock)',
  },
  {
    providerType: 'mail-example-microsoft',
    providerName: 'demo-microsoft',
    address: 'alex-microsoft@example.test',
    displayName: 'Alex Demo',
    providerLabel: 'Microsoft 365 (mock)',
  },
  {
    providerType: 'mail-example-imap-smtp',
    providerName: 'demo-imap-smtp',
    address: 'casey-imap@example.test',
    displayName: 'Casey Demo',
    providerLabel: 'IMAP/SMTP (mock)',
  },
];

const DEMO_SYNC_LOOKBACK_DAYS = 30;
const DEMO_SYNC_TIMEOUT_MS = 30_000;
const DEMO_SYNC_POLL_INTERVAL_MS = 500;

export interface DemoMailboxState {
  readonly accounts: readonly MailAccountView[];
  readonly error?: string;
  readonly loading: boolean;
  readonly retry: () => void;
}

interface DemoMailboxBootstrapEntry {
  readonly promise: Promise<readonly MailAccountView[]>;
  accounts?: readonly MailAccountView[];
}

const accountBootstrapByClient = new WeakMap<
  MailClient,
  DemoMailboxBootstrapEntry
>();

export function useDemoMailbox(): DemoMailboxState {
  const mail = useMailClient();
  const [accounts, setAccounts] = useState<readonly MailAccountView[]>(
    () => getCachedDemoAccounts(mail) ?? [],
  );
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(() => !getCachedDemoAccounts(mail));
  const [revision, setRevision] = useState(0);

  const retry = useCallback((): void => {
    accountBootstrapByClient.delete(mail);
    setError(undefined);
    setLoading(true);
    setRevision((value) => value + 1);
  }, [mail]);

  useEffect(() => {
    let active = true;
    const cachedAccounts = getCachedDemoAccounts(mail);
    if (cachedAccounts) {
      setAccounts(cachedAccounts);
      setError(undefined);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError(undefined);
    void getOrCreateDemoAccounts(mail)
      .then((nextAccounts) => {
        if (active) setAccounts(nextAccounts);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            mailErrorMessage(
              cause,
              cause instanceof Error
                ? cause.message
                : 'Could not load demo mailboxes.',
            ),
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [mail, revision]);

  return { accounts, error, loading, retry };
}

function getOrCreateDemoAccounts(
  mail: MailClient,
): Promise<readonly MailAccountView[]> {
  const existing = accountBootstrapByClient.get(mail);
  if (existing) return existing.promise;

  const bootstrap = bootstrapDemoAccounts(mail);
  const entry: DemoMailboxBootstrapEntry = { promise: bootstrap };
  accountBootstrapByClient.set(mail, entry);
  void bootstrap.then(
    (accounts) => {
      entry.accounts = accounts;
    },
    () => {
      if (accountBootstrapByClient.get(mail) === entry) {
        accountBootstrapByClient.delete(mail);
      }
    },
  );
  return bootstrap;
}

function getCachedDemoAccounts(
  mail: MailClient,
): readonly MailAccountView[] | undefined {
  return accountBootstrapByClient.get(mail)?.accounts;
}

async function bootstrapDemoAccounts(
  mail: MailClient,
): Promise<readonly MailAccountView[]> {
  const existingAccounts = await mail.listAccounts();
  const accounts: MailAccountView[] = [];

  for (const profile of DEMO_MAILBOX_PROFILES) {
    let account = existingAccounts.find(
      (item) =>
        item.provider.type === profile.providerType &&
        item.provider.name === profile.providerName,
    );

    if (!account) {
      account = await mail.connectAccount({
        type: profile.providerType,
        name: profile.providerName,
        address: profile.address,
        displayName: profile.displayName,
        username: 'demo-user',
        password: 'demo-only',
        initialSyncReceivedAfter: syncLookbackDate(),
      });
    }
    accounts.push(account);
  }

  await Promise.all(
    accounts.map((account) => ensureAccountHasMail(mail, account)),
  );
  await seedDemoManagement(mail, accounts);
  return accounts;
}

async function ensureAccountHasMail(
  mail: MailClient,
  account: MailAccountView,
): Promise<void> {
  const currentMessages = await mail.listMessages({
    accountId: account.id,
    pageSize: 1,
  });
  if (currentMessages.items.length > 0) return;

  const run = await mail.startSync({
    accountId: account.id,
    mode: 'initial',
    receivedAfter: account.initialSyncReceivedAfter ?? syncLookbackDate(),
  });
  let latestRun = run;
  const deadline = Date.now() + DEMO_SYNC_TIMEOUT_MS;
  while (latestRun.status === 'pending' || latestRun.status === 'running') {
    if (Date.now() >= deadline) {
      throw new Error(
        'Demo mailbox sync timed out. Retry to check its status.',
      );
    }
    await delay(DEMO_SYNC_POLL_INTERVAL_MS);
    latestRun = await mail.getSyncRun(latestRun.id);
  }
  if (latestRun.status === 'failed' || latestRun.status === 'cancelled') {
    throw new Error(
      latestRun.error?.code ?? 'Demo mailbox sync did not complete.',
    );
  }

  const syncedMessages = await mail.listMessages({
    accountId: account.id,
    pageSize: 1,
  });
  if (syncedMessages.items.length === 0) {
    throw new Error(
      'The demo Provider returned no mail after synchronization.',
    );
  }
}

function syncLookbackDate(): string {
  return new Date(
    Date.now() - DEMO_SYNC_LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}
