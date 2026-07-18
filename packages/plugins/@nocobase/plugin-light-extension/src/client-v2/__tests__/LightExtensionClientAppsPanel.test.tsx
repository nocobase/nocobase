/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { LightExtensionClientAppDescriptor } from '../api/lightExtensionClientAppsRequests';
import LightExtensionClientAppsPanel from '../components/LightExtensionClientAppsPanel';
import {
  LightExtensionClientAppHookError,
  type UseLightExtensionClientAppsResult,
} from '../hooks/useLightExtensionClientApps';

const mocks = vi.hoisted(() => ({
  t: (key: string) => key,
  deniedActions: new Set<string>(),
  api: {
    list: vi.fn(),
    upload: vi.fn(),
    delete: vi.fn(),
    listReferences: vi.fn(),
  },
}));

vi.mock('@nocobase/client-v2', () => ({
  useACLRoleContext: () => ({
    parseAction: (action: string) => (mocks.deniedActions.has(action) ? null : {}),
  }),
}));

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({ t: mocks.t }),
  };
});

vi.mock('../hooks/useLightExtensionClientApps', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../hooks/useLightExtensionClientApps')>();
  return {
    ...actual,
    useLightExtensionClientApps: () => mocks.api as unknown as UseLightExtensionClientAppsResult,
  };
});

const currentApp: LightExtensionClientAppDescriptor = {
  entryId: 'lee_customer',
  repoId: 'ler_customer',
  key: 'customer-console',
  kind: 'client-app',
  title: 'Customer console',
  description: null,
  category: null,
  icon: null,
  tags: [],
  sort: null,
  entryHtml: 'dist/application.html',
  staticRoot: 'dist',
  contentHash: 'hash-old',
  fileCount: 4,
  byteSize: 4096,
  updatedAt: '2026-07-17T00:00:00.000Z',
  available: true,
  enabled: true,
  ready: true,
};

describe('LightExtensionClientAppsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.deniedActions.clear();
    mocks.api.list.mockResolvedValue([]);
    mocks.api.upload.mockResolvedValue(currentApp);
    mocks.api.delete.mockResolvedValue(undefined);
    mocks.api.listReferences.mockResolvedValue([]);
  });

  it('uploads the first application with keyboard-operable controls and shows its current state', async () => {
    const onChanged = vi.fn();
    render(<LightExtensionClientAppsPanel onChanged={onChanged} repoId="ler_customer" />);

    const openButton = await screen.findByRole('button', { name: 'Upload application' });
    openButton.focus();
    await userEvent.keyboard('{Enter}');
    const dialog = await screen.findByRole('dialog', { name: 'Upload light extension application' });
    const file = new File(['zip'], 'customer-console.zip', { type: 'application/zip' });
    await userEvent.upload(within(dialog).getByLabelText('Application ZIP'), file);
    const submitButton = within(dialog).getByRole('button', { name: 'Upload' });
    submitButton.focus();
    await userEvent.keyboard('{Enter}');

    await waitFor(() => expect(mocks.api.upload).toHaveBeenCalledWith('ler_customer', file, undefined));
    expect(await screen.findByText('Customer console')).toBeInTheDocument();
    expect(screen.getByText('customer-console')).toBeInTheDocument();
    expect(screen.getByText('dist/application.html')).toBeInTheDocument();
    expect(screen.getByText('4 files')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(onChanged).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: 'Replace files Customer console' }));
    const replaceDialog = await screen.findByRole('dialog', { name: 'Replace application files' });
    const cancelButton = within(replaceDialog).getByRole('button', { name: 'Cancel' });
    cancelButton.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Replace application files' })).not.toBeInTheDocument(),
    );
  });

  it('replaces an existing application and immediately renders the returned current state', async () => {
    const replacedApp = {
      ...currentApp,
      contentHash: 'hash-new',
      fileCount: 7,
      byteSize: 8192,
      updatedAt: '2026-07-18T00:00:00.000Z',
    };
    mocks.api.list.mockResolvedValueOnce([currentApp]);
    mocks.api.upload.mockResolvedValueOnce(replacedApp);
    render(<LightExtensionClientAppsPanel repoId="ler_customer" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Replace files Customer console' }));
    const dialog = await screen.findByRole('dialog', { name: 'Replace application files' });
    const file = new File(['replacement'], 'customer-console.zip', { type: 'application/zip' });
    await userEvent.upload(within(dialog).getByLabelText('Application ZIP'), file);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Replace files' }));

    await waitFor(() =>
      expect(mocks.api.upload).toHaveBeenCalledWith('ler_customer', file, {
        entryId: currentApp.entryId,
        contentHash: currentApp.contentHash,
      }),
    );
    expect(await screen.findByText('7 files')).toBeInTheDocument();
    expect(screen.queryByText('4 files')).not.toBeInTheDocument();
    expect(screen.getByText(new Date(replacedApp.updatedAt).toLocaleString())).toBeInTheDocument();
    expect(screen.getByText('Light extension application files replaced')).toBeInTheDocument();
  });

  it('keeps the old application visible and ready when replacement fails', async () => {
    mocks.api.list.mockResolvedValueOnce([currentApp]);
    mocks.api.upload.mockRejectedValueOnce(
      new LightExtensionClientAppHookError({
        operation: 'upload',
        code: 'LIGHT_EXTENSION_INVALID_INPUT',
        status: 400,
        message: 'invalid archive',
        details: { category: 'client-app-archive' },
      }),
    );
    render(<LightExtensionClientAppsPanel repoId="ler_customer" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Replace files Customer console' }));
    const dialog = await screen.findByRole('dialog', { name: 'Replace application files' });
    await userEvent.upload(
      within(dialog).getByLabelText('Application ZIP'),
      new File(['broken'], 'customer-console.zip', { type: 'application/zip' }),
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Replace files' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'The ZIP file is not a valid light extension application',
    );
    expect(screen.getByText('4 files')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('Customer console')).toBeInTheDocument();
    expect(screen.getByText(new Date(currentApp.updatedAt || '').toLocaleString())).toBeInTheDocument();
    expect(screen.queryByText('Light extension application files replaced')).not.toBeInTheDocument();
  });

  it('shows an accessible permission state without exposing the server message', async () => {
    mocks.api.list.mockRejectedValueOnce(
      new LightExtensionClientAppHookError({
        operation: 'list',
        code: 'LIGHT_EXTENSION_PERMISSION_DENIED',
        status: 403,
        message: 'raw permission error',
      }),
    );
    render(<LightExtensionClientAppsPanel repoId="ler_customer" />);

    expect(await screen.findByText('Access denied')).toBeInTheDocument();
    expect(screen.getByText('You do not have permission to manage light extension applications')).toBeInTheDocument();
    expect(screen.queryByText('raw permission error')).not.toBeInTheDocument();
  });

  it('shows reference locations and prevents deleting an application used by a workspace', async () => {
    mocks.api.list.mockResolvedValueOnce([currentApp]);
    mocks.api.listReferences.mockResolvedValueOnce([
      { entryId: currentApp.entryId, ownerId: 'workspace-customer', label: 'Customer workspace' },
    ]);
    render(<LightExtensionClientAppsPanel repoId="ler_customer" />);

    expect(await screen.findByText('Customer workspace')).toBeInTheDocument();
    expect(mocks.api.listReferences).toHaveBeenCalledWith(currentApp.entryId);
    expect(screen.getByRole('button', { name: 'Remove application Customer console' })).toBeDisabled();
    expect(mocks.api.delete).not.toHaveBeenCalled();
  });

  it('hides upload, replace, and delete actions when the role only has list permission', async () => {
    mocks.deniedActions.add('lightExtensionClientApps:upload');
    mocks.deniedActions.add('lightExtensionClientApps:delete');
    mocks.api.list.mockResolvedValueOnce([currentApp]);

    render(<LightExtensionClientAppsPanel repoId="ler_customer" />);

    expect(await screen.findByText('Customer console')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Upload application' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Replace files Customer console' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove application Customer console' })).not.toBeInTheDocument();
  });

  it('confirms deletion from the keyboard when reference checks prove the application is unused', async () => {
    mocks.api.list.mockResolvedValueOnce([currentApp]);
    render(<LightExtensionClientAppsPanel repoId="ler_customer" />);

    const removeButton = await screen.findByRole('button', { name: 'Remove application Customer console' });
    await waitFor(() => expect(removeButton).toBeEnabled());
    removeButton.focus();
    await userEvent.keyboard('{Enter}');
    const dialog = await screen.findByRole('dialog', { name: 'Remove this application?' });
    const confirmButton = within(dialog).getByRole('button', { name: 'Remove' });
    confirmButton.focus();
    await userEvent.keyboard('{Enter}');

    await waitFor(() => expect(mocks.api.delete).toHaveBeenCalledWith(currentApp.entryId));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Remove application Customer console' })).not.toBeInTheDocument(),
    );
    expect(screen.getByText('Light extension application removed')).toBeInTheDocument();
  });
});
