import { render, screen } from '@testing-library/react';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { expect, it } from 'vitest';
import type { InboxEntry } from '../../client/extensions/nocobase-inbox/model.js';
import { useEntryText } from '../../client/inbox/contributions/projects-wording.js';
import locales from '../../client/locales/index.js';

const entry: InboxEntry = {
  item: {
    id: 'item',
    deliveryId: 'delivery',
    notificationId: 'notice',
    title: 'Permission required',
    body: '',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  notice: {
    notificationId: 'notice',
    source: 'projects',
    kind: 'info',
    type: 'stage_action_problem',
    subject: { type: 'issue', id: 'issue', label: 'Issue' },
    decisionKey: null,
    count: 1,
    resolvedAt: null,
    outcome: null,
    data: {
      reason: 'executorCannotImplement',
      agentName: 'Builder',
      agentId: 'builder',
    },
  },
};
function Notice() {
  const wording = useEntryText();
  return <p>{wording(entry).sentence}</p>;
}
for (const locale of ['en-US', 'zh-CN']) {
  it(`explains the missing permission and remedies in ${locale}`, async () => {
    const runtime = await createTestI18nRuntime({
      locale,
      application: { namespace: '@nocobase/studio', resources: locales },
    });
    render(
      <TestI18nProvider runtime={runtime}>
        <Notice />
      </TestI18nProvider>,
    );
    expect(screen.getByText(/Builder/)).toHaveTextContent('studio.git/open-pr');
    expect(screen.getByText(/Builder/)).toHaveTextContent(
      locale === 'zh-CN'
        ? '给它开 PR 的权限，或改派有该权限的 agent'
        : 'Grant that permission or assign an agent that has it',
    );
  });
}
