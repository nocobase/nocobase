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
import { RestoreFromBackup } from '../components/RestoreFromBackup';
import { RestoreFromLocal } from '../components/RestoreFromLocal';
import type { BackupFile } from '../components/BackupsTable';

const backup: BackupFile = {
  name: 'backup.nbdata',
  fileSize: '1 KB',
  createdAt: '2026-07-22T00:00:00.000Z',
  inProgress: false,
};

const RestoreTestPage = () => (
  <>
    <RestoreFromLocal />
    <RestoreFromBackup backup={backup} />
  </>
);

class RestoreTestPlugin extends Plugin {
  async load() {
    this.router.add('root', {
      path: '/',
      Component: RestoreTestPage,
    });
  }
}

function renderRestorePage() {
  const app = createMockClient({ plugins: [RestoreTestPlugin] });
  app.apiMock.onGet('backups:appInfo').reply(200, {
    data: {
      database: {
        dialect: 'postgres',
        schema: 'current_schema',
      },
    },
  });

  const Root = app.getRootComponent();
  render(<Root />);
  return app;
}

async function submitLocalRestore(errorMessage: string) {
  const app = renderRestorePage();
  app.apiMock.onPost('backups:upload').reply(500, {
    errors: [{ message: errorMessage }],
  });

  fireEvent.click(await screen.findByText('Restore backup from local'));

  const file = new File(['backup'], 'backup.nbdata', { type: 'application/octet-stream' });
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  const schemaInput = document.querySelector('input[type="text"][autocomplete="new-password"]') as HTMLInputElement;
  const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;

  fireEvent.change(fileInput, { target: { files: [file] } });
  fireEvent.change(schemaInput, { target: { value: 'current_schema' } });
  fireEvent.change(passwordInput, { target: { value: 'wrong-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

  expect(await screen.findByText(errorMessage)).toBeInTheDocument();
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText('backup.nbdata')).toBeInTheDocument();
  expect(schemaInput).toHaveValue('current_schema');
  expect(passwordInput).toHaveValue('wrong-password');
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Submit' })).not.toBeDisabled();
  });
}

describe('backup restore errors', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it.each([
    'Unable to restore: database underscored mismatch',
    'Unable to restore: database schema mismatch',
    'Not a valid backup file',
    'Error decrypting backup, please check your password',
  ])('shows the local restore error and preserves the form: %s', async (errorMessage) => {
    await submitLocalRestore(errorMessage);
  });

  it('shows errors from restoring an existing backup and preserves the form', async () => {
    const app = renderRestorePage();
    app.apiMock.onPost('backups:restore').reply(500, {
      errors: [{ message: 'Unable to restore: database schema mismatch' }],
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Restore', exact: true }));

    const schemaInput = document.querySelector('input[type="text"][autocomplete="new-password"]') as HTMLInputElement;
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    fireEvent.change(schemaInput, { target: { value: 'current_schema' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Unable to restore: database schema mismatch')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(schemaInput).toHaveValue('current_schema');
    expect(passwordInput).toHaveValue('wrong-password');
  });

  it('closes the local restore dialog after the restore task starts successfully', async () => {
    const app = renderRestorePage();
    app.apiMock.onPost('backups:upload').reply(200, {
      data: {
        task: 'restore-task',
      },
    });

    fireEvent.click(await screen.findByText('Restore backup from local'));
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: {
        files: [new File(['backup'], 'backup.nbdata', { type: 'application/octet-stream' })],
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(app.apiMock.history.post).toHaveLength(1);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
