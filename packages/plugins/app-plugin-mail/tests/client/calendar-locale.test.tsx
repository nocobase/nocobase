import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { act, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import { MailSyncPolicyFields } from '../../client/components/mail-sync-policy-fields.js';
import locales from '../../client/locales/index.js';
import { MAIL_PLUGIN_NS } from '../../client/namespace.js';

it('translates an exported date field in every language without remounting', async () => {
  const runtime = await createTestI18nRuntime({
    namespaces: { [MAIL_PLUGIN_NS]: locales },
  });
  render(
    <TestI18nProvider runtime={runtime}>
      <MailSyncPolicyFields
        value={{ receivedAfter: '' }}
        labels={{ receivedAfter: 'Received after' }}
        onChange={() => {}}
      />
    </TestI18nProvider>,
  );
  for (const language of Object.keys(locales)) {
    await act(() => runtime.changeLanguage(language));
    const { default: copy } = await locales[language]();
    expect(
      screen.getByRole('button', { name: 'Received after' }),
    ).toHaveTextContent(copy.settings.initialSync.pickDate);
  }
});
