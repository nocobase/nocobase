import { act, fireEvent, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';
import { render } from './render.js';
import { useHostToaster } from './host-toaster.js';
import type { ConfigEditorProps } from '../client/components/config-editor.js';

const mocks = vi.hoisted(() => ({
  client: { request: vi.fn() },
  authorization: {
    can: vi.fn(async () => true),
    onInvalidated: vi.fn(() => () => undefined),
  },
}));
vi.mock('@nocobase/app-client', () => ({
  ApiClientError: class extends Error {},
  useApiClient: () => mocks.client,
  useService: () => mocks.authorization,
  useToaster: () => useHostToaster(),
  resolveAppUrl: (value: string) => value,
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  authorizationClientToken: Symbol(),
}));
vi.mock('@nocobase/i18n/client', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
    i18n: { language: 'en-US' },
  }),
}));
vi.mock('../client/components/config-editor.js', () => ({
  ConfigEditor: ({ value, onChange }: ConfigEditorProps) => (
    <textarea
      aria-label='Draft'
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));
import AppPage from '../client/pages/hub/app-page.js';
import ConfigurationPage from '../client/pages/hub/tabs/configuration-page.js';

afterEach(() => vi.useRealTimers());

it('keeps the config editor and draft mounted across polling and deployment completion', async () => {
  vi.useFakeTimers();
  let complete = false;
  let detailRequests = 0;
  let configRequests = 0;
  mocks.client.request.mockImplementation(
    async ({ path }: { path: string }) => {
      if (path === 'hub/apps/customer/config') {
        configRequests += 1;
        return {
          data: {
            mode: 'file',
            content: complete ? 'port: 9000\n' : 'port: 8000\n',
          },
        };
      }
      if (path !== 'hub/apps/customer')
        throw new Error(`Unexpected request: ${path}`);
      detailRequests += 1;
      return {
        data: {
          app: {
            id: 'customer',
            name: 'Customer',
            currentDeploymentId: complete ? 'deployment-2' : 'deployment-1',
            updatedAt: '',
          },
          runtime: { hostAvailable: true, state: 'running' },
          currentVersion: '1.0.0',
          hasReleases: true,
          hasPendingDeployment: !complete,
          enabled: true,
          startupMode: 'eager',
          hostUrl: null,
          deployment: {
            desiredReleaseId: 'release-1',
            observedReleaseId: 'release-1',
            observedState: 'running',
            activation: 'eager',
            basePath: '/customer',
            updatedAt: '',
          },
        },
      };
    },
  );
  await act(async () => {
    render(
      <MemoryRouter initialEntries={['/apps/customer/configuration']}>
        <Routes>
          <Route path='/apps/:appId' element={<AppPage />}>
            <Route path='configuration' element={<ConfigurationPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    await import('../client/components/config-editor.js');
  });
  const editor = screen.getByLabelText('Draft');
  fireEvent.change(editor, { target: { value: 'port: 7000\n' } });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(3000);
  });
  expect(detailRequests).toBeGreaterThanOrEqual(3);
  expect(configRequests).toBe(1);
  expect(screen.getByLabelText('Draft')).toBe(editor);
  expect(editor).toHaveValue('port: 7000\n');
  complete = true;
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1500);
  });
  expect(configRequests).toBe(2);
  expect(screen.getByLabelText('Draft')).toBe(editor);
  expect(editor).toHaveValue('port: 7000\n');
  expect(
    screen.getByText(/Server configuration has changed/),
  ).toBeInTheDocument();
});
