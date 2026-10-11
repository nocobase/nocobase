import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { IssueCodeSection } from '../../client/issues/detail/code-section.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
import { previewKeys } from '../../client/previews/api.js';
import { STUDIO_GIT_TOPIC, type IssuePullRequest } from '../../shared/git.js';
import type { IssuePreviews } from '../../shared/previews.js';

const { api, listeners, realtime } = vi.hoisted(() => {
  const listeners = new Map<string, Set<() => void>>();
  return {
    api: { request: vi.fn() },
    listeners,
    realtime: {
      subscribe: (topic: string, listener: () => void) => {
        const handlers = listeners.get(topic) ?? new Set<() => void>();
        listeners.set(topic, handlers);
        handlers.add(listener);
        return () => {
          handlers.delete(listener);
          if (handlers.size === 0) listeners.delete(topic);
        };
      },
    },
  };
});

vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useService: () => realtime,
}));
vi.mock('../../client/access/notify.js', () => ({
  useNotify: () => ({ success: vi.fn(), error: vi.fn() }),
}));

const pullRequest: IssuePullRequest = {
  id: 'pr12',
  repo: 'acme/shop',
  number: 12,
  url: 'https://github.com/acme/shop/pull/12',
  title: 'Create the first pull request',
  state: 'open',
  draft: false,
  headRef: 'agent/PM-40',
  baseRef: 'main',
  headSha: 'a'.repeat(40),
  mergeCommitSha: null,
  authorLogin: 'developer',
  mergeableState: 'clean',
  ciState: 'success',
  checks: [],
  mergedAt: null,
  mergedBy: null,
  mergedManually: false,
  closedAt: null,
  snapshotAt: null,
  linkedBy: { type: 'agent', id: null, name: null },
  autoCompleteDisabled: false,
  linkedAt: '2026-10-11T00:00:00.000Z',
  mergeBlocker: null,
};
const issue: IssueDetail = {
  id: 'i1',
  number: 40,
  identifier: 'PM-40',
  title: 'Choose whether a preview is needed',
  description: '',
  statusKey: 'inProgress',
  priority: 'medium',
  ownerUserId: 'owner',
  executor: null,
  parentIssueId: null,
  stage: null,
  projectId: 'project',
  startDate: null,
  dueDate: null,
  revision: 1,
  createdById: 'owner',
  createdAt: '2026-10-11T00:00:00.000Z',
  updatedAt: '2026-10-11T00:00:00.000Z',
  lastActivityAt: '2026-10-11T00:00:00.000Z',
  deletedAt: null,
  owner: { id: 'owner', name: 'Owner' },
  executorName: null,
  project: { id: 'project', name: 'Project', leadUserId: 'owner' },
  labels: [],
  subtaskCount: 0,
  blockedCount: 0,
  parent: null,
  statuses: [],
  activities: [],
  activitiesNextCursor: null,
  threads: [],
  threadsNextCursor: null,
  subscribers: [],
  attachments: [],
  checklist: null,
  pendingApproval: null,
  recentApprovals: [],
  subtasks: [],
  blockedBy: [],
  blocks: [],
  relatedTo: [],
  blockers: [],
  hiddenBlockerCount: 0,
};
const emptyPreviews: IssuePreviews = {
  issueId: 'i1',
  identifier: 'PM-40',
  previews: [],
  labels: [],
  notRequired: true,
  blocker: null,
  canEdit: true,
  canSetEnvironmentVariables: false,
};
const clients: QueryClient[] = [];

beforeEach(() => {
  api.request.mockReset();
});
afterEach(() => {
  cleanup();
  for (const client of clients.splice(0)) client.clear();
});

describe.each([
  { locale: 'en-US', resources: enUS },
  { locale: 'zh-CN', resources: zhCN },
])('preview realtime updates in $locale', ({ locale, resources }) => {
  it.each([false, true])(
    'refreshes the first externally created PR and its label status (failed=%s)',
    async (failed) => {
      let linked: readonly IssuePullRequest[] = [];
      let previews = emptyPreviews;
      api.request.mockImplementation(({ path }: { path: string }) => {
        if (path === 'git/pullRequests')
          return Promise.resolve({
            data: linked,
            meta: {
              suggestions: [],
              canMerge: true,
              canLink: true,
              applicable: true,
            },
          });
        if (path === 'previews/status')
          return Promise.resolve({ data: previews });
        if (path === 'deploys/marks')
          return Promise.resolve({ data: { i1: [] } });
        return Promise.reject(new Error(`Unexpected ${path}`));
      });
      const runtime = await createTestI18nRuntime({
        application: { namespace: 'studio', resources },
        locale,
      });
      const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      clients.push(client);
      const view = render(
        <TestI18nProvider runtime={runtime} namespace='studio'>
          <QueryClientProvider client={client}>
            <MemoryRouter>
              <IssueCodeSection
                issue={issue}
                linking={false}
                setLinking={() => undefined}
              />
            </MemoryRouter>
          </QueryClientProvider>
        </TestI18nProvider>,
      );
      await waitFor(() =>
        expect(client.getQueryData(previewKeys.issue('i1'))).toEqual(
          emptyPreviews,
        ),
      );
      expect(screen.queryByText(pullRequest.title)).toBeNull();

      // An agent or CLI links the first PR while this page's empty preview query is no longer polling.
      linked = [pullRequest];
      previews = {
        ...emptyPreviews,
        labels: [
          {
            pullRequestId: pullRequest.id,
            present: failed ? null : true,
            managed: !failed,
            failed,
          },
        ],
      };
      const handlers = listeners.get(STUDIO_GIT_TOPIC);
      expect(handlers?.size).toBeGreaterThan(0);
      act(() => {
        for (const listener of [...(handlers ?? [])]) listener();
      });
      expect(await screen.findByText(pullRequest.title)).toBeVisible();
      fireEvent.click(
        screen.getByRole('button', {
          name: resources.studioGit.section.details.replace(
            '{{label}}',
            `${pullRequest.repo}#${pullRequest.number}`,
          ),
        }),
      );
      expect(
        await screen.findByText(
          failed
            ? resources.previews.preference.syncFailed
            : resources.previews.preference.skipped,
        ),
      ).toBeVisible();
      expect(
        screen.queryByText(resources.studioGit.section.noPreview),
      ).toBeNull();
      view.unmount();
      expect(listeners.size).toBe(0);
    },
  );
});
