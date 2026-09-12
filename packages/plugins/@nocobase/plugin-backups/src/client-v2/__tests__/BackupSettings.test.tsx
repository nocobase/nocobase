/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockClient, Plugin } from '@nocobase/client-v2';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MAX_BACKUP_KEEP_COUNT } from '../../constants';
import BackupSettings from '../pages/BackupSettings';

class BackupSettingsTestPlugin extends Plugin {
  async load() {
    this.router.add('root', {
      path: '/',
      Component: BackupSettings,
    });
  }
}

function renderBackupSettings() {
  const app = createMockClient({ plugins: [BackupSettingsTestPlugin] });
  app.apiMock.onGet('backupSettings:get/1').reply(200, {
    data: {
      id: 1,
      scheduled: false,
      cron: '0 0 * * *',
      keep: 100,
      enableFilesBackup: false,
    },
  });
  app.apiMock.onGet('storages:list').reply(200, { data: [] });

  const Root = app.getRootComponent();
  render(<Root />);
  return app;
}

describe('backup settings', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('limits backup retention values to the configured maximum', async () => {
    renderBackupSettings();
    const input = await screen.findByRole('spinbutton');
    await waitFor(() => expect(input).toHaveValue('100'));

    expect(input).toHaveAttribute('aria-valuemin', '1');
    expect(input).toHaveAttribute('aria-valuemax', String(MAX_BACKUP_KEEP_COUNT));
  });

  it('shows the server error when saving fails', async () => {
    const app = renderBackupSettings();
    app.apiMock.onPost('backupSettings:update/1').reply(400, {
      errors: [{ message: 'Maximum number of backups must be less than or equal to 1000' }],
    });
    const input = await screen.findByRole('spinbutton');
    await waitFor(() => expect(input).toHaveValue('100'));
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await waitFor(() => expect(submitButton).not.toBeDisabled());

    fireEvent.click(submitButton);

    await waitFor(() => expect(app.apiMock.history.post).toHaveLength(1));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Maximum number of backups must be less than or equal to 1000',
    );
    await waitFor(() => expect(submitButton).not.toBeDisabled());
  });
});
