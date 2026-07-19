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
  entryHtml: 'dist/application.html',
  fileCount: 4,
  byteSize: 4096,
  updatedAt: '2026-07-17T00:00:00.000Z',
};

describe('LightExtensionClientAppsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.deniedActions.clear();
    mocks.api.list.mockResolvedValue([]);
    mocks.api.upload.mockResolvedValue(currentApp);
    mocks.api.delete.mockResolvedValue(undefined);
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

  it('shows an accessible permission state without exposing the server message', async () => {
    mocks.api.list.mockRejectedValueOnce(
      new LightExtensionClientAppHookError({
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

  it('checks references only when deletion is attempted', async () => {
    mocks.api.list.mockResolvedValueOnce([currentApp]);
    mocks.api.delete.mockRejectedValueOnce(
      new LightExtensionClientAppHookError({
        code: 'LIGHT_EXTENSION_REFERENCE_EXISTS',
        status: 409,
        message: 'referenced',
        details: {
          references: [
            { entryId: currentApp.entryId, ownerKind: 'multiPortal.frontend', ownerId: 'workspace-customer' },
          ],
        },
      }),
    );
    render(<LightExtensionClientAppsPanel repoId="ler_customer" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Remove application Customer console' }));
    const dialog = await screen.findByRole('dialog', { name: 'Remove this application?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Remove' }));
    expect(await within(dialog).findByText('workspace-customer')).toBeInTheDocument();
    expect(mocks.api.delete).toHaveBeenCalledWith(currentApp.entryId);
  });
});
