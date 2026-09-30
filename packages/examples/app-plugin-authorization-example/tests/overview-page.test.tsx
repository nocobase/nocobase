// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
const fixture = vi.hoisted(() => ({
  canReset: true,
  request: vi.fn(async () => ({ data: {} })),
}));
vi.mock('@nocobase/app-client', () => ({
  apiClientToken: {},
  useService: () => fixture,
}));
vi.mock('../client/pages/use-example.js', () => ({
  useExample: () => ({
    data: { canReset: fixture.canReset, roles: [] },
    reload: vi.fn(),
  }),
}));
import OverviewPage from '../client/pages/overview-page.js';
import enUS from '../client/locales/en-US.js';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import type { ReactNode } from 'react';
import { NS } from '../catalog.js';

// The page renders under this plugin's routes.
const runtime = await createTestI18nRuntime({ namespaces: { [NS]: enUS } });
function wrapper({ children }: { readonly children: ReactNode }) {
  return (
    <TestI18nProvider runtime={runtime} namespace={NS}>
      {children}
    </TestI18nProvider>
  );
}
beforeEach(() => {
  fixture.canReset = true;
  fixture.request.mockClear();
});
it('requires confirmation before resetting the shared practice records, and hides the control from demo accounts', async () => {
  const { unmount } = render(<OverviewPage />, { wrapper });
  fireEvent.click(
    screen.getByRole('button', { name: 'Reset practice records' }),
  );
  expect(screen.getByText(enUS.reset.confirm)).toBeInTheDocument();
  expect(fixture.request).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.queryByText(enUS.reset.confirm)).not.toBeInTheDocument();
  fireEvent.click(
    screen.getByRole('button', { name: 'Reset practice records' }),
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Reset practice records' }),
  );
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent(enUS.reset.done),
  );
  expect(fixture.request).toHaveBeenCalledExactlyOnceWith({
    method: 'POST',
    path: '/authorization-example/reset',
    json: {},
  });
  unmount();

  fixture.canReset = false;
  render(<OverviewPage />, { wrapper });
  expect(
    screen.queryByRole('button', { name: 'Reset practice records' }),
  ).not.toBeInTheDocument();
});
