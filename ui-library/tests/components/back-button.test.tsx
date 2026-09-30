import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';

import { BackButton } from '../../registry/components/back-button';
import { readmeTranslations } from '../readme-translations';

// Strict, with the keys the components README lists, as in data-table.test.tsx: a label looked up under a key the
// README does not list fails the test, rather than rendering its English default.
const translations = readmeTranslations('components');

type Runtime = Awaited<ReturnType<typeof createTestI18nRuntime>>;

function createRuntime(locale: 'en-US' | 'zh-CN'): Promise<Runtime> {
  return createTestI18nRuntime({
    locale,
    application: {
      namespace: '@nocobase/ui-library',
      resources: {
        'en-US': () => Promise.resolve({ default: translations['en-US'] }),
        'zh-CN': () => Promise.resolve({ default: translations['zh-CN'] }),
      },
    },
  });
}

const english = await createRuntime('en-US');

function renderAt(url: string, child: ReactElement, runtime = english) {
  const router = createMemoryRouter(
    [
      {
        path: '/projects',
        element: (
          <>
            <h1>List</h1>
            <Outlet />
          </>
        ),
        // A child page with a two-segment path, like a second route to the same overlay: `..` is still the list.
        children: [
          { path: ':projectId', element: child },
          { path: 'import/:batchId', element: child },
        ],
      },
      { path: '/overview', element: <h1>Overview</h1> },
    ],
    { initialEntries: [url] },
  );
  render(
    <TestI18nProvider runtime={runtime}>
      <RouterProvider router={router} />
    </TestI18nProvider>,
  );
  return router;
}

describe('BackButton', () => {
  it('leads to the parent route and keeps the query string', async () => {
    const router = renderAt('/projects/12?q=alpha&page=2', <BackButton />);

    const link = screen.getByRole('link', { name: 'Back' });
    expect(link).toHaveAttribute('href', '/projects?q=alpha&page=2');

    fireEvent.click(link);
    await waitFor(() => {
      expect(
        screen.queryByRole('link', { name: 'Back' }),
      ).not.toBeInTheDocument();
    });
    expect(router.state.location.pathname).toBe('/projects');
    expect(router.state.location.search).toBe('?q=alpha&page=2');
    // Leaving the child page replaces its entry, as closing an overlay does.
    expect(router.state.historyAction).toBe('REPLACE');
  });

  it('resolves the parent by route, not by path segment', () => {
    renderAt('/projects/import/7', <BackButton />);

    expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/projects',
    );
  });

  it('takes a destination and a label of its own', () => {
    renderAt(
      '/projects/12',
      <BackButton to='/overview'>Back to the overview</BackButton>,
    );

    expect(
      screen.getByRole('link', { name: 'Back to the overview' }),
    ).toHaveAttribute('href', '/overview');
  });

  it('reads its label from the locale the page renders in', async () => {
    renderAt('/projects/12', <BackButton />, await createRuntime('zh-CN'));

    expect(screen.getByRole('link', { name: '返回' })).toHaveAttribute(
      'href',
      '/projects',
    );
  });
});
