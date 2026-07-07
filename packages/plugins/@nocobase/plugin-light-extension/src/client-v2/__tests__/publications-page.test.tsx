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
import type { UseLightExtensionPublicationsResult } from '../hooks/useLightExtensionPublications';
import LightExtensionPublicationsPage from '../pages/LightExtensionPublicationsPage';

const mocks = vi.hoisted(() => ({
  t: (key: string) => key,
  repoApi: {
    getRepo: vi.fn(),
    listEntries: vi.fn(),
  },
  publicationApi: {
    listPublications: vi.fn(),
    publish: vi.fn(),
    activatePublication: vi.fn(),
    emergencyRollback: vi.fn(),
    isLoading: vi.fn().mockReturnValue(false),
    getError: vi.fn().mockReturnValue(null),
    clearError: vi.fn(),
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
    useLightExtensionRepo: () => mocks.repoApi as unknown as UseLightExtensionRepoResult,
  };
});

vi.mock('../hooks/useLightExtensionPublications', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useLightExtensionPublications: () => mocks.publicationApi as unknown as UseLightExtensionPublicationsResult,
  };
});

describe('LightExtensionPublicationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.repoApi.getRepo.mockResolvedValue({
      id: 'ler_sales',
      name: 'sales-widgets',
      normalizedName: 'sales-widgets',
      title: 'Sales widgets',
      version: 1,
      lifecycleStatus: 'enabled',
      healthStatus: 'ready',
      headCommitId: 'vsc_commit_2',
    });
    mocks.repoApi.listEntries.mockResolvedValue([
      {
        id: 'lee_sales',
        repoId: 'ler_sales',
        target: 'client',
        kind: 'js-block',
        entryName: 'sales-kpi',
        entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
        metaPath: null,
        settingsPath: 'src/client/js-blocks/sales-kpi/settings.json',
        title: 'Sales KPI',
        description: null,
        category: null,
        icon: null,
        tags: null,
        sort: null,
        settingsSchema: { type: 'object' },
        activePublicationId: 'lep_v2',
        healthStatus: 'ready',
        diagnostics: [],
      },
    ]);
    mocks.publicationApi.listPublications.mockResolvedValue([
      createPublication('lep_v2', 'vsc_commit_2'),
      createPublication('lep_v1', 'vsc_commit_1'),
    ]);
    mocks.publicationApi.publish.mockResolvedValue({
      repo: { id: 'ler_sales' },
      commitId: 'vsc_commit_2',
      clientRequestId: 'publish_req',
      status: 'success',
      httpStatus: 200,
      entryResults: [],
      diagnostics: [],
    });
    mocks.publicationApi.activatePublication.mockResolvedValue({
      entryId: 'lee_sales',
      repoId: 'ler_sales',
      oldPublicationId: 'lep_v2',
      activePublicationId: 'lep_v1',
      publication: createPublication('lep_v1', 'vsc_commit_1'),
      emergency: false,
    });
  });

  it('renders publications and rolls back by activating an old publication', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/settings/light-extension?panel=publications&repoId=ler_sales']}>
        <LightExtensionPublicationsPage />
      </MemoryRouter>,
    );

    await screen.findAllByText('Sales KPI');
    expect(screen.getByText('lep_v2')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();

    const rollbackButtons = screen.getAllByRole('button', { name: /Rollback/ });
    fireEvent.click(rollbackButtons[rollbackButtons.length - 1]);

    await waitFor(() =>
      expect(mocks.publicationApi.activatePublication).toHaveBeenCalledWith({
        entryId: 'lee_sales',
        toPublicationId: 'lep_v1',
        expectedCurrentPublicationId: 'lep_v2',
      }),
    );
    expect(await screen.findByText('Publication activated')).toBeTruthy();
  });

  it('publishes and activates current head with per-entry CAS expectations', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/settings/light-extension?panel=publications&repoId=ler_sales']}>
        <LightExtensionPublicationsPage />
      </MemoryRouter>,
    );

    await screen.findAllByText('Sales KPI');
    fireEvent.click(screen.getByRole('button', { name: /Publish and activate/ }));
    await screen.findByText('Publish and activate current head commit?');
    const confirmButtons = screen.getAllByRole('button', { name: /Publish and activate/ });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() =>
      expect(mocks.publicationApi.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          repoId: 'ler_sales',
          entryIds: ['lee_sales'],
          commitId: 'vsc_commit_2',
          activate: true,
          expectedCurrentPublicationIdByEntry: {
            lee_sales: 'lep_v2',
          },
        }),
      ),
    );
  });
});

function createPublication(id: string, commitId: string) {
  return {
    id,
    repoId: 'ler_sales',
    entryId: 'lee_sales',
    commitId,
    entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
    target: 'client',
    kind: 'js-block',
    surfaceStyle: 'render',
    runtimeVersion: 'v2',
    artifact: {
      version: 'v2',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      filesHash: `${id}_files_hash`,
      metadata: {},
      diagnostics: [],
    },
    settingsSchemaSnapshot: { type: 'object' },
    settingsDefaultsSnapshot: {},
    settingsSchemaHash: `${id}_schema_hash`,
    settingsDefaultsHash: `${id}_defaults_hash`,
    filesHash: `${id}_files_hash`,
    runtimeCodeHash: `${id}_runtime_hash`,
    diagnostics: [],
    createdAt: '2026-07-06T00:00:00.000Z',
  };
}
