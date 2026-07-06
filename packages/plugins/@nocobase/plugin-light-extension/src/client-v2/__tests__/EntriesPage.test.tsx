/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import type { UseLightExtensionRepoResult } from '../hooks/useLightExtensionRepo';
import LightExtensionEntriesPage from '../pages/LightExtensionEntriesPage';

const mocks = vi.hoisted(() => ({
  t: (key: string) => key,
  api: {
    getRepo: vi.fn(),
    listEntries: vi.fn(),
    scanEntries: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mocks.t,
  }),
}));

vi.mock('../hooks/useLightExtensionRepo', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useLightExtensionRepo: () => mocks.api as unknown as UseLightExtensionRepoResult,
    getLightExtensionErrorDiagnostics: (error: unknown) =>
      error && typeof error === 'object' && Array.isArray((error as { diagnostics?: unknown }).diagnostics)
        ? (error as { diagnostics: unknown[] }).diagnostics
        : [],
  };
});

describe('LightExtensionEntriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.api.getRepo.mockResolvedValue({
      id: 'ler_sales',
      name: 'sales-widgets',
      normalizedName: 'sales-widgets',
      title: 'Sales widgets',
      version: 1,
      lifecycleStatus: 'enabled',
      healthStatus: 'ready',
      headCommitId: 'commit-1',
    });
    mocks.api.listEntries.mockResolvedValue([
      {
        id: 'lee_sales',
        repoId: 'ler_sales',
        target: 'client',
        kind: 'js-block',
        entryName: 'sales-kpi',
        entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
        metaPath: 'src/client/js-blocks/sales-kpi/meta.json',
        settingsPath: 'src/client/js-blocks/sales-kpi/settings.json',
        title: 'Sales KPI',
        description: 'Sales KPI block',
        category: 'sales',
        icon: null,
        tags: ['sales'],
        sort: 10,
        settingsSchema: { type: 'object' },
        activePublicationId: null,
        healthStatus: 'failed',
        diagnostics: [
          {
            code: 'settings_schema_keyword_not_allowed',
            severity: 'error',
            message: 'settings.json keyword "x-reactions" is not supported',
            path: 'src/client/js-blocks/sales-kpi/settings.json',
            kind: 'js-block',
            entryName: 'sales-kpi',
          },
        ],
        validatorVersion: 'light-extension-validator-v1',
        lastScannedCommitId: 'commit-1',
      },
    ]);
    mocks.api.scanEntries.mockResolvedValue({
      repo: {
        id: 'ler_sales',
        name: 'sales-widgets',
        normalizedName: 'sales-widgets',
        title: 'Sales widgets',
        version: 2,
        lifecycleStatus: 'enabled',
        healthStatus: 'ready',
        headCommitId: 'commit-2',
      },
      commitId: 'commit-2',
      accepted: true,
      diagnostics: [],
      entries: [
        {
          created: false,
          entry: {
            id: 'lee_sales',
            repoId: 'ler_sales',
            target: 'client',
            kind: 'js-block',
            entryName: 'sales-kpi',
            entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
            metaPath: 'src/client/js-blocks/sales-kpi/meta.json',
            settingsPath: 'src/client/js-blocks/sales-kpi/settings.json',
            title: 'Sales KPI Updated',
            description: 'Sales KPI block',
            category: 'sales',
            icon: null,
            tags: ['sales'],
            sort: 10,
            settingsSchema: { type: 'object' },
            activePublicationId: null,
            healthStatus: 'ready',
            diagnostics: [],
            validatorVersion: 'light-extension-validator-v1',
            lastScannedCommitId: 'commit-2',
          },
        },
      ],
      capabilities: {},
    });
  });

  it('renders entry metadata, settings presence, and diagnostics summary', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/settings/light-extension/entries?repoId=ler_sales']}>
        <LightExtensionEntriesPage />
      </MemoryRouter>,
    );

    await screen.findByText('Sales KPI');
    expect(screen.getByText('sales-kpi')).toBeTruthy();
    expect(screen.getByText('src/client/js-blocks/sales-kpi/index.tsx')).toBeTruthy();
    expect(screen.getByText('Settings schema')).toBeTruthy();
    expect(screen.getAllByText('Errors: 1').length).toBeGreaterThan(0);
    expect(screen.getByText('settings.json keyword "x-reactions" is not supported')).toBeTruthy();
  });

  it('refreshes entries from scan results', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/settings/light-extension/entries?repoId=ler_sales']}>
        <LightExtensionEntriesPage />
      </MemoryRouter>,
    );

    await screen.findByText('Sales KPI');
    fireEvent.click(screen.getByRole('button', { name: /Scan/ }));

    await waitFor(() => expect(mocks.api.scanEntries).toHaveBeenCalledWith('ler_sales'));
    expect(await screen.findByText('Sales KPI Updated')).toBeTruthy();
  });
});
