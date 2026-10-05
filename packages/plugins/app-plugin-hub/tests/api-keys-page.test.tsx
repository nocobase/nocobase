import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  answerApi,
  renderWithApp,
  type ApiCall,
  type RenderedApp,
} from '@nocobase/app-testing/client';
import hub from '../client/index.js';
import enUS from '../client/locales/en-US.js';
import {
  emptyHubCapabilities,
  type HubCapabilities,
} from '../client/permissions.js';
import { ApiKeys } from '../client/pages/hub/api-keys.js';

/** Answers the page's API requests; each test says what the Hub server returns. */
const api = vi.fn<(call: ApiCall) => unknown>();
const capabilities = {
  ...emptyHubCapabilities(),
  'manage-api-keys': true,
  'upload-release': true,
  deploy: true,
};
const apps = [
  {
    id: 'crm',
    name: 'CRM',
    permissions: ['upload-release', 'deploy'] as const,
  },
  {
    id: 'erp',
    name: 'ERP',
    permissions: ['upload-release', 'deploy'] as const,
  },
];
const renderApiKeys = (
  hubCapabilities: HubCapabilities = capabilities,
): Promise<RenderedApp> =>
  renderWithApp(<ApiKeys apps={apps} capabilities={hubCapabilities} />, {
    plugins: [hub()],
    namespace: '@nocobase/app-plugin-hub',
    fetch: answerApi(api),
  });
const key = {
  id: 'key-id',
  canCopy: true,
  apps: [
    { id: 'crm', name: 'CRM' },
    { id: 'erp', name: 'ERP' },
  ],
  name: 'CI',
  prefix: 'hub_app_abcd',
  scopes: ['upload-release'],
  status: 'active',
  createdBy: 'admin',
  creatorName: 'Administrator',
  createdAt: '2026-09-15T00:00:00Z',
  lastUsedAt: null,
  expiresAt: null,
};
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
beforeEach(() => {
  vi.stubGlobal('navigator', Object.create(navigator));
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: undefined,
  });
  api.mockReset();
});

describe('App API Keys management', () => {
  it('creates a scoped key, shows the secret once and clears it after closing', async () => {
    let hasKey = false;
    api.mockImplementation((input) => {
      if (input.method === 'POST') {
        hasKey = true;
        return { data: { key, secret: 'hub_app_test_secret' } };
      }
      return { data: hasKey ? [key] : [] };
    });
    const view = await renderApiKeys();
    await screen.findByText('No API Keys yet');
    fireEvent.click(screen.getByRole('button', { name: 'Create API Key' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByLabelText('Upload release')).toBeDisabled();
    expect(
      within(dialog).queryByLabelText('Read releases'),
    ).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText('Deploy release')).toBeInTheDocument();
    const submit = within(dialog).getByRole('button', {
      name: 'Create API Key',
    });
    expect(submit).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText('Name'), {
      target: { value: 'CI' },
    });
    fireEvent.click(within(dialog).getByLabelText('CRM (crm)'));
    const search = within(dialog).getByRole('searchbox', {
      name: 'Search applications…',
    });
    fireEvent.change(search, { target: { value: 'ERP' } });
    expect(
      within(dialog).queryByLabelText('CRM (crm)'),
    ).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByLabelText('ERP (erp)'));
    expect(within(dialog).getByRole('status')).toHaveTextContent('2 selected');
    fireEvent.change(search, { target: { value: 'no-such-app' } });
    expect(
      within(dialog).getByText('No matching applications.'),
    ).toBeInTheDocument();
    fireEvent.change(search, { target: { value: '' } });
    expect(within(dialog).getByLabelText('CRM (crm)')).toBeChecked();
    fireEvent.click(within(dialog).getByLabelText('Upload release'));
    fireEvent.click(submit);
    await screen.findByText('hub_app_test_secret');
    expect(api).toHaveBeenCalledWith({
      path: 'hub/apiKeys',
      method: 'POST',
      json: {
        name: 'CI',
        appIds: ['crm', 'erp'],
        allApps: false,
        scopes: ['upload-release'],
        expiresAt: null,
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByText('hub_app_test_secret')).not.toBeInTheDocument();
    await screen.findByText('hub_app_abcd…');
    view.unmount();
    await renderApiKeys();
    await screen.findByText('hub_app_abcd…');
    expect(screen.queryByText('hub_app_test_secret')).not.toBeInTheDocument();
  });
  it('requires a custom expiration and clears it when switching to no expiration', async () => {
    api.mockReturnValue({ data: [] });
    await renderApiKeys();
    await screen.findByText('No API Keys yet');
    fireEvent.click(screen.getByRole('button', { name: 'Create API Key' }));
    const dialog = within(screen.getByRole('dialog'));
    fireEvent.change(dialog.getByLabelText('Name'), {
      target: { value: 'CI' },
    });
    fireEvent.click(dialog.getByLabelText('CRM (crm)'));
    fireEvent.click(dialog.getByLabelText('Upload release'));
    const submit = dialog.getByRole('button', { name: 'Create API Key' });
    expect(submit).toBeEnabled();
    const expiration = dialog.getByRole('combobox', { name: 'Expiration' });
    fireEvent.change(expiration, { target: { value: 'custom' } });
    expect(submit).toBeDisabled();
    fireEvent.change(dialog.getByLabelText('Expires'), {
      target: { value: '2099-01-01T12:00' },
    });
    expect(submit).toBeEnabled();
    fireEvent.change(expiration, { target: { value: 'never' } });
    expect(dialog.queryByLabelText('Expires')).not.toBeInTheDocument();
    fireEvent.change(expiration, { target: { value: 'custom' } });
    expect(dialog.getByLabelText('Expires')).toHaveValue('');
    expect(submit).toBeDisabled();
  });
  it('submits a dynamic all-App grant without copying the current App list', async () => {
    api.mockImplementation((input) =>
      input.method === 'POST'
        ? {
            data: {
              key: { ...key, allApps: true, apps: [] },
              secret: 'test-only-secret',
            },
          }
        : { data: [] },
    );
    await renderApiKeys();
    await screen.findByText('No API Keys yet');
    fireEvent.click(screen.getByRole('button', { name: 'Create API Key' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Name'), {
      target: { value: 'Global CI' },
    });
    fireEvent.click(
      within(dialog).getByLabelText('All applications (including future apps)'),
    );
    expect(
      within(dialog).queryByLabelText('CRM (crm)'),
    ).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByLabelText('Deploy release'));
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Create API Key' }),
    );
    await screen.findByText('test-only-secret');
    expect(api).toHaveBeenCalledWith({
      path: 'hub/apiKeys',
      method: 'POST',
      json: {
        name: 'Global CI',
        allApps: true,
        appIds: [],
        scopes: ['deploy'],
        expiresAt: null,
      },
    });
  });
  it('requires confirmation before disabling or deleting and handles failure', async () => {
    const user = userEvent.setup();
    api.mockReturnValue({ data: [key] });
    await renderApiKeys();
    await screen.findByText('CI');
    await user.click(screen.getByRole('button', { name: 'Actions for CI' }));
    await user.click(
      await screen.findByRole('menuitem', { name: 'Disable', exact: true }),
    );
    expect(api).toHaveBeenCalledTimes(1);
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Cancel',
      }),
    );
    expect(api).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Actions for CI' }));
    await user.click(
      await screen.findByRole('menuitem', { name: 'Disable', exact: true }),
    );
    api
      .mockReturnValueOnce({ data: { ...key, status: 'disabled' } })
      .mockReturnValue({ data: [{ ...key, status: 'disabled' }] });
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Disable',
        exact: true,
      }),
    );
    await screen.findByText('Disabled');
    expect(api).toHaveBeenCalledWith({
      path: 'hub/apiKeys/key-id/disable',
      method: 'POST',
    });
    await user.click(screen.getByRole('button', { name: 'Actions for CI' }));
    await user.click(
      await screen.findByRole('menuitem', { name: 'Delete', exact: true }),
    );
    api.mockImplementationOnce(() => {
      throw new Error('failed');
    });
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Delete',
        exact: true,
      }),
    );
    await waitFor(() =>
      expect(
        screen.getByText(
          'The action could not be completed. Check your permissions and try again.',
        ),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText('CI')).toBeInTheDocument();
  });
  it('retrieves a saved key only on request and clears it when the dialog closes', async () => {
    api.mockImplementation((input) =>
      input.path.endsWith('/reveal')
        ? { data: { secret: 'saved-test-secret' } }
        : { data: [key] },
    );
    await renderApiKeys();
    await screen.findByText('CI');
    expect(screen.queryByText('saved-test-secret')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Copy API Key CI' }));
    await screen.findByText('saved-test-secret');
    expect(api).toHaveBeenCalledWith({
      path: 'hub/apiKeys/key-id/reveal',
      method: 'POST',
    });
    expect(screen.getByRole('button', { name: 'Copy key' })).toBeEnabled();
    const clipboardDescriptor = Object.getOwnPropertyDescriptor(
      navigator,
      'clipboard',
    );
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    try {
      fireEvent.click(screen.getByRole('button', { name: 'Copy key' }));
      await screen.findByRole('button', { name: 'Copied' });
      expect(writeText).toHaveBeenCalledWith('saved-test-secret');
    } finally {
      if (clipboardDescriptor)
        Object.defineProperty(navigator, 'clipboard', clipboardDescriptor);
      else Reflect.deleteProperty(navigator, 'clipboard');
    }

    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByText('saved-test-secret')).not.toBeInTheDocument();
  });
  it('explains unavailable legacy keys instead of silently ignoring clicks', async () => {
    api.mockReturnValue({ data: [{ ...key, canCopy: false }] });
    await renderApiKeys();
    const copy = await screen.findByRole('button', { name: 'Copy API Key CI' });
    expect(copy).toHaveTextContent('Copy unavailable');
    fireEvent.click(copy);
    await screen.findByText(enUS.apiKeys.copyUnavailable);
    expect(api).toHaveBeenCalledTimes(1);
  });

  it('copies the full key directly and confirms success without exposing it in a dialog', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    api.mockImplementation(({ path }) =>
      path.endsWith('/reveal')
        ? { data: { secret: 'full-test-secret' } }
        : { data: [key] },
    );
    await renderApiKeys();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Copy API Key CI' }),
    );
    await screen.findByText('Copied');
    expect(writeText).toHaveBeenCalledWith('full-test-secret');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('full-test-secret')).not.toBeInTheDocument();
  });

  it('offers manual copying when clipboard permission is denied', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('Permission denied'));
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    api.mockImplementation(({ path }) =>
      path.endsWith('/reveal')
        ? { data: { secret: 'manual-test-secret' } }
        : { data: [key] },
    );
    await renderApiKeys();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Copy API Key CI' }),
    );
    await screen.findByText('manual-test-secret');
    await screen.findByText(enUS.apiKeys.copyFailed);
    expect(screen.queryByText('Copied')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByText('manual-test-secret')).not.toBeInTheDocument();
  });

  it('reports reveal failures without attempting to copy', async () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    api.mockReturnValueOnce({ data: [key] }).mockImplementationOnce(() => {
      throw new Error('Not recoverable');
    });
    await renderApiKeys();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Copy API Key CI' }),
    );
    await screen.findByText(enUS.apiKeys.revealFailed);
    expect(writeText).not.toHaveBeenCalled();
  });

  it('does not fetch keys for users without management access', async () => {
    await renderApiKeys(emptyHubCapabilities());
    expect(
      await screen.findByText(
        'You do not have permission to manage Hub API Keys.',
      ),
    ).toBeInTheDocument();
    expect(api).not.toHaveBeenCalled();
  });
});
