/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useLightExtensionEntries } from '../hooks/useLightExtensionEntries';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  t: vi.fn((key: string) => key),
}));

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({
    api: {
      request: mocks.request,
    },
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mocks.t,
  }),
}));

describe('useLightExtensionEntries publication selector snapshots', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads entry publications through the documented selector route and uses publication snapshots', async () => {
    mocks.request.mockResolvedValueOnce({
      data: {
        data: {
          entryId: 'lee_sales',
          activePublicationId: 'lep_v2',
          publications: [createPublication('lep_v2')],
        },
      },
    });
    const { result } = renderHook(() => useLightExtensionEntries());

    let selectorResult: Awaited<ReturnType<typeof result.current.listEntryPublications>> | undefined;
    await act(async () => {
      selectorResult = await result.current.listEntryPublications('lee_sales');
    });

    expect(mocks.request).toHaveBeenCalledWith({
      url: '/light-extension-entries/lee_sales/publications',
      method: 'get',
    });
    expect(selectorResult).toMatchObject({
      activePublicationId: 'lep_v2',
      publications: [
        {
          id: 'lep_v2',
          settingsSchemaSnapshot: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                default: 'Publication title',
              },
            },
          },
          settingsDefaultsHash: 'defaults_hash_lep_v2',
        },
      ],
    });
    expect(JSON.stringify(selectorResult)).not.toContain('Entry draft title');
  });

  it('loads selectable entries with active publication snapshots instead of entry draft settings schemas', async () => {
    mocks.request.mockResolvedValueOnce({
      data: {
        data: [
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
            activePublicationId: 'lep_v2',
            healthStatus: 'ready',
            diagnostics: [],
            activePublication: createPublication('lep_v2'),
          },
        ],
      },
    });
    const { result } = renderHook(() => useLightExtensionEntries());

    let entries: Awaited<ReturnType<typeof result.current.listSelectableEntries>> | undefined;
    await act(async () => {
      entries = await result.current.listSelectableEntries({ repoId: 'ler_sales' });
    });

    expect(mocks.request).toHaveBeenCalledWith({
      url: 'lightExtensionEntries:listSelectable',
      method: 'post',
      data: {
        repoId: 'ler_sales',
      },
    });
    expect(entries?.[0]).toMatchObject({
      id: 'lee_sales',
      activePublication: {
        settingsSchemaSnapshot: {
          type: 'object',
        },
        settingsDefaultsHash: 'defaults_hash_lep_v2',
      },
    });
    expect(JSON.stringify(entries)).not.toContain('Entry draft title');
    expect(entries?.[0]).not.toHaveProperty('settingsSchema');
  });
});

function createPublication(id: string) {
  return {
    id,
    repoId: 'ler_sales',
    entryId: 'lee_sales',
    commitId: 'vsc_commit_2',
    entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
    target: 'client',
    kind: 'js-block',
    surfaceStyle: 'render',
    runtimeVersion: 'v2',
    artifact: {
      version: 'v2',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      filesHash: `files_hash_${id}`,
      metadata: {},
      diagnostics: [],
    },
    settingsSchemaSnapshot: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          default: 'Publication title',
        },
      },
    },
    settingsDefaultsSnapshot: {
      title: 'Publication title',
    },
    settingsSchemaHash: `schema_hash_${id}`,
    settingsDefaultsHash: `defaults_hash_${id}`,
    filesHash: `files_hash_${id}`,
    runtimeCodeHash: `runtime_hash_${id}`,
    diagnostics: [],
    createdAt: '2026-07-06T00:00:00.000Z',
  };
}
