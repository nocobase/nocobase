import { ApiClientError } from '@nocobase/app-client';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import IssueDetailPage from '../../client/pages/issues/detail/index.js';

const mocks = vi.hoisted(() => ({
  detail: {} as { data: unknown; isError: boolean; error: unknown },
  update: vi.fn(),
}));
vi.mock('@nocobase/app-plugin-projects/client/issues', async (original) => ({
  ...(await original<
    typeof import('@nocobase/app-plugin-projects/client/issues')
  >()),
  useIssueDetail: () => mocks.detail,
  useIssueUpdate: mocks.update,
}));
vi.mock('@nocobase/app-plugin-projects/client/kit', async (original) => ({
  ...(await original<
    typeof import('@nocobase/app-plugin-projects/client/kit')
  >()),
  PmLoadError: ({ action }: { action: ReactNode }) => (
    <section>Access denied{action}</section>
  ),
}));
vi.mock('@nocobase/i18n/client', async (original) => ({
  ...(await original<typeof import('@nocobase/i18n/client')>()),
  useTranslation: () => ({
    t: (key: string) =>
      key === 'personalTasks.signInAgain' ? 'Sign in again' : key,
  }),
}));
vi.mock('../../client/issues/detail/issue-parent.js', () => ({
  useIssueParent: () => ({
    path: '/my-issues/executing',
    search: '?q=keep',
    levels: [],
  }),
}));
vi.mock('../../client/issues/detail/issue-parent-outlet.js', () => ({
  IssueParentOutlet: () => null,
}));
vi.mock('../../client/issues/detail/labels.js', () => ({
  useIssuePageWording: () => ({ t: (key: string) => key }),
}));
afterEach(cleanup);

describe('full personal detail after permission changes', () => {
  it.each([401, 403, 404])(
    'does not mount actions or content from the last successful query after %s',
    (status) => {
      mocks.update.mockClear();
      mocks.detail = {
        data: { id: 'A', title: 'Cached private title' },
        isError: true,
        error: new ApiClientError('Unavailable', {
          status,
          method: 'GET',
          url: '/issues/A',
        }),
      };
      render(
        <MemoryRouter initialEntries={['/my-issues/executing/A#reply']}>
          <Routes>
            <Route
              path='/my-issues/executing/:issueId'
              element={<IssueDetailPage />}
            />
          </Routes>
        </MemoryRouter>,
      );
      expect(screen.getByText('Access denied')).toBeVisible();
      expect(screen.queryByText('Cached private title')).toBeNull();
      expect(mocks.update).not.toHaveBeenCalled();
      if (status === 401)
        expect(
          screen.getByRole('link', { name: 'Sign in again' }),
        ).toHaveAttribute('href', '/login');
      else
        expect(
          screen.getByRole('button', { name: 'issue.backToList' }),
        ).toHaveAttribute('href', '/my-issues/executing?q=keep#reply');
    },
  );
});
