import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import locales from '../../client/locales/index.js';
import { pmKeys } from '../../client/api/keys.js';
import {
  useIssueUpdate,
  type IssueChanges,
} from '../../client/pages/issues/detail/use-issue-update.js';
import type { Issue } from '../../shared/issues.js';

const issue: Issue = {
  id: 'i1',
  number: 1,
  identifier: 'PM-1',
  title: 'Original title',
  description: 'Original description',
  statusKey: 'backlog',
  needsYou: null,
  next: null,
  priority: 'none',
  ownerUserId: 'b',
  executor: null,
  parentIssueId: null,
  stage: null,
  projectId: null,
  startDate: null,
  dueDate: null,
  revision: 1,
  createdById: 'a',
  createdAt: '2026-10-15T00:00:00Z',
  updatedAt: '2026-10-15T00:00:00Z',
  lastActivityAt: '2026-10-15T00:00:00Z',
  deletedAt: null,
};

async function setup(changes: IssueChanges, status = 200, locale = 'en-US') {
  const client = new QueryClient();
  const key = pmKeys.issue('PM-1');
  client.setQueryData(key, issue);
  const request = vi.fn<(call: ApiCall) => unknown>(() =>
    status === 200
      ? { data: { issue: { ...issue, ...changes, revision: 3 } } }
      : Response.json(
          {
            error: {
              code: status === 409 ? 'conflict' : 'forbidden',
              reason: status === 409 ? 'REVISION_CONFLICT' : 'FORBIDDEN',
              message: 'Rejected',
            },
          },
          { status },
        ),
  );
  function Editor() {
    const update = useIssueUpdate(issue, key);
    return (
      <button
        onClick={() => void update.mutateAsync(changes).catch(() => undefined)}
      >
        Save
      </button>
    );
  }
  const view = await renderWithApp(
    <QueryClientProvider client={client}>
      <Editor />
    </QueryClientProvider>,
    {
      namespace: '@nocobase/app-plugin-projects',
      namespaces: { '@nocobase/app-plugin-projects': locales },
      locale,
      fetch: answerApi(request),
    },
  );
  // A detail poll or realtime refresh replaces the cache after the draft was started.
  await act(async () =>
    client.setQueryData(key, { ...issue, description: 'A saved', revision: 2 }),
  );
  return { ...view, client, key, request };
}

describe('issue update revision', () => {
  it.each(['description', 'title'] as const)(
    'keeps an explicit %s draft revision after a cache refresh',
    async (field) => {
      const { request } = await setup({ [field]: 'B draft', revision: 1 });
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      await waitFor(() => expect(request).toHaveBeenCalledOnce());
      expect(request.mock.calls[0]?.[0]).toMatchObject({
        method: 'PATCH',
        json: { [field]: 'B draft', revision: 1 },
      });
    },
  );

  it('uses the newest cached revision and only the changed field for immediate properties', async () => {
    const { request } = await setup({ priority: 'high' });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(request).toHaveBeenCalledOnce());
    expect(request.mock.calls[0]?.[0].json).toEqual({
      priority: 'high',
      revision: 2,
    });
  });

  it.each(['en-US', 'zh-CN'])(
    'rejects stale drafts once, refreshes and explains manual recovery (%s)',
    async (locale) => {
      const { request, client, key, toasts } = await setup(
        { description: 'B draft', revision: 1 },
        409,
        locale,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      await waitFor(() => expect(toasts()).toHaveLength(1));
      expect(toasts()[0]?.title).toContain(
        locale === 'en-US' ? 'Copy your draft' : '请复制草稿',
      );
      expect(request).toHaveBeenCalledOnce();
      expect(client.getQueryState(key)?.isInvalidated).toBe(true);
      expect(client.getQueryData(key)).toMatchObject({
        description: 'A saved',
        revision: 2,
      });
    },
  );
});
