/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen, userEvent, waitFor } from '@nocobase/test/client';
import { App } from 'antd';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BackupsTable } from '../components/BackupsTable';
import { BackupsContext } from '../contexts';

const { createAccessCode, getHeaders, getUri } = vi.hoisted(() => ({
  createAccessCode: vi.fn(),
  getHeaders: vi.fn(),
  getUri: vi.fn(),
}));

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    useFlowContext: () => ({
      api: {
        auth: { createAccessCode },
        axios: { defaults: { baseURL: '/api' }, getUri },
        getHeaders,
      },
    }),
  };
});

vi.mock('../locale', () => ({ useT: () => (key: string) => key }));
vi.mock('../components/RestoreFromBackup', () => ({ RestoreFromBackup: () => <button type="button">Restore</button> }));

const temporaryUrl = '/api/backups:download?filterByTk=backup.nbdata&_code=test-code&__appName=sub1';
const backup = {
  name: 'backup.nbdata',
  fileSize: '500 MB',
  createdAt: '2026-07-10T00:00:00.000Z',
  inProgress: false,
};
const contextValue = {
  data: { data: [backup] },
  loading: false,
  refresh: vi.fn(),
  refreshAsync: vi.fn(),
};

const renderTable = () =>
  render(
    <App>
      <BackupsContext.Provider value={contextValue}>
        <BackupsTable />
      </BackupsContext.Provider>
    </App>,
  );

describe('BackupsTable client-v2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getHeaders.mockReturnValue({ 'X-App': 'sub1' });
    getUri.mockReturnValue(temporaryUrl);
  });

  it('downloads with a URL-bound access code', async () => {
    let resolveAccessCode!: (code: string) => void;
    createAccessCode.mockReturnValue(
      new Promise((resolve) => {
        resolveAccessCode = resolve;
      }),
    );
    const anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const user = userEvent.setup();

    renderTable();

    const downloadButton = await screen.findByRole('button', { name: 'Download' });
    await user.click(downloadButton);
    expect(downloadButton).toHaveAttribute('aria-busy', 'true');
    expect(downloadButton).toBeDisabled();
    resolveAccessCode('test-code');

    await waitFor(() => {
      expect(createAccessCode).toHaveBeenCalledWith({
        url: 'backups:download?filterByTk=backup.nbdata',
      });
      expect(getUri).toHaveBeenCalledWith({
        baseURL: '',
        url: '/api/backups:download',
        params: {
          filterByTk: 'backup.nbdata',
          _code: 'test-code',
          __appName: 'sub1',
        },
      });
      expect(anchorClickSpy).toHaveBeenCalledTimes(1);
    });

    const link = anchorClickSpy.mock.instances[0] as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe(temporaryUrl);
    expect(link.download).toBe('backup.nbdata');
    expect(link).not.toBeInTheDocument();
    anchorClickSpy.mockRestore();
  });

  it('shows an error when access code creation fails', async () => {
    createAccessCode.mockRejectedValue(new Error('access code failed'));
    const user = userEvent.setup();

    renderTable();

    const downloadButton = await screen.findByRole('button', { name: 'Download' });
    await user.click(downloadButton);

    expect(await screen.findByText('Failed to create download link. Please try again.')).toBeInTheDocument();
  });
});
