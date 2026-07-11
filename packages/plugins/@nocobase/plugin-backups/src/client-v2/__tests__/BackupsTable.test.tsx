/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, render, screen, userEvent, waitFor } from '@nocobase/test/client';
import { App } from 'antd';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BackupsTable } from '../components/BackupsTable';
import { BackupsContext } from '../contexts';

const mocks = vi.hoisted(() => ({
  createTemporaryUrl: vi.fn(),
  request: vi.fn(),
}));

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    useFlowContext: () => ({
      api: {
        auth: {
          createTemporaryUrl: mocks.createTemporaryUrl,
        },
        request: mocks.request,
      },
    }),
  };
});

vi.mock('../locale', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('../components/RestoreFromBackup', () => ({
  RestoreFromBackup: () => <button type="button">Restore</button>,
}));

describe('BackupsTable client-v2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses a temporary URL and prevents duplicate signing requests', async () => {
    let resolveTemporaryUrl!: (value: { url: string; expiresAt: number }) => void;
    mocks.createTemporaryUrl.mockReturnValue(
      new Promise<{ url: string; expiresAt: number }>((resolve) => {
        resolveTemporaryUrl = resolve;
      }),
    );
    const anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const user = userEvent.setup();

    render(
      <App>
        <BackupsContext.Provider
          value={{
            data: {
              data: [
                {
                  name: 'backup.nbdata',
                  fileSize: '500 MB',
                  createdAt: '2026-07-10T00:00:00.000Z',
                  inProgress: false,
                },
              ],
            },
            loading: false,
            refresh: vi.fn(),
            refreshAsync: vi.fn(),
          }}
        >
          <BackupsTable />
        </BackupsContext.Provider>
      </App>,
    );

    const downloadButton = await screen.findByRole('button', { name: 'Download' });
    await user.click(downloadButton);
    await user.click(downloadButton);

    await waitFor(() => {
      expect(downloadButton).toHaveAttribute('aria-busy', 'true');
      expect(mocks.createTemporaryUrl).toHaveBeenCalledTimes(1);
      expect(mocks.createTemporaryUrl).toHaveBeenCalledWith({
        url: 'backups:download',
        params: {
          filterByTk: 'backup.nbdata',
        },
      });
    });

    await act(async () => {
      resolveTemporaryUrl({
        url: '/api/backups:download?filterByTk=backup.nbdata&accessCode=test-code',
        expiresAt: Date.now() + 30_000,
      });
    });

    await waitFor(() => {
      expect(anchorClickSpy).toHaveBeenCalledTimes(1);
      expect(downloadButton).toHaveAttribute('aria-busy', 'false');
    });

    const link = anchorClickSpy.mock.instances[0] as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/api/backups:download?filterByTk=backup.nbdata&accessCode=test-code');
    expect(link.download).toBe('backup.nbdata');
    expect(link).not.toBeInTheDocument();
  });

  it('resets download state when temporary URL creation fails', async () => {
    let rejectTemporaryUrl!: (reason: Error) => void;
    mocks.createTemporaryUrl.mockReturnValue(
      new Promise<{ url: string; expiresAt: number }>((_resolve, reject) => {
        rejectTemporaryUrl = reject;
      }),
    );
    const user = userEvent.setup();

    render(
      <App>
        <BackupsContext.Provider
          value={{
            data: {
              data: [
                {
                  name: 'backup.nbdata',
                  fileSize: '500 MB',
                  createdAt: '2026-07-10T00:00:00.000Z',
                  inProgress: false,
                },
              ],
            },
            loading: false,
            refresh: vi.fn(),
            refreshAsync: vi.fn(),
          }}
        >
          <BackupsTable />
        </BackupsContext.Provider>
      </App>,
    );

    const downloadButton = await screen.findByRole('button', { name: 'Download' });
    await user.click(downloadButton);
    await waitFor(() => {
      expect(downloadButton).toHaveAttribute('aria-busy', 'true');
      expect(mocks.createTemporaryUrl).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      rejectTemporaryUrl(new Error('temporary URL failed'));
    });
    await waitFor(() => {
      expect(downloadButton).toHaveAttribute('aria-busy', 'false');
    });
  });
});
