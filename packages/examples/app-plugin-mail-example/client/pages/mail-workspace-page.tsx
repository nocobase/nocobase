import { MailWorkspacePage as MailWorkspace } from '@nocobase/app-plugin-mail/client';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { DemoMailboxGate } from '../components/demo-mailbox-gate.js';

export default function MailExampleWorkspacePage(): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-mail-example');
  return (
    <DemoMailboxGate>
      {() => (
        <MailWorkspace
          title={t('workspace.title')}
          description={t('workspace.description')}
          templateVariables={{ name: 'Alex', project: 'Mail example' }}
        />
      )}
    </DemoMailboxGate>
  );
}
