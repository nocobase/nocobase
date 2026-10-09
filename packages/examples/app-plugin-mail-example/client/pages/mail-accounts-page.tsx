import { MailAccountsPage } from '@nocobase/app-plugin-mail/client';
import type { ReactElement } from 'react';

import { DemoMailboxGate } from '../components/demo-mailbox-gate.js';
import { DEMO_MAILBOX_PROFILES } from '../hooks/use-demo-mailbox.js';

const DEMO_PROVIDER_KEYS = DEMO_MAILBOX_PROFILES.map(
  (profile) => `${profile.providerType}:${profile.providerName}`,
);

export default function MailExampleAccountsPage(): ReactElement {
  return (
    <DemoMailboxGate>
      {() => (
        <MailAccountsPage
          credentialDefaults={{ username: 'demo-user', password: 'demo-only' }}
          providerKeys={DEMO_PROVIDER_KEYS}
        />
      )}
    </DemoMailboxGate>
  );
}
