/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model } from '@nocobase/database';
import { vi } from 'vitest';

import type { LightExtensionRuntimeSourceBinding } from '../../shared/types';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import { LightExtensionPublicationResolveService } from '../services/LightExtensionPublicationResolveService';

describe('plugin-light-extension settings snapshot runtime', () => {
  it('merges settings defaults from the pinned publication snapshot instead of current entry schema', async () => {
    const { service } = createResolveService([
      createPublicationRecord({
        id: 'lep_v1',
        settingsDefaultsSnapshot: {
          title: 'Old title',
          limit: 10,
        },
        settingsSchemaHash: 'schema_hash_v1',
        settingsDefaultsHash: 'defaults_hash_v1',
      }),
      createPublicationRecord({
        id: 'lep_v2',
        settingsDefaultsSnapshot: {
          title: 'New title',
          limit: 20,
        },
        settingsSchemaHash: 'schema_hash_v2',
        settingsDefaultsHash: 'defaults_hash_v2',
      }),
    ]);

    const v1Runtime = await service.resolveRuntime(
      {
        sourceMode: 'light-extension',
        sourceBinding: createSourceBinding({ publicationId: 'lep_v1' }),
        settings: {
          limit: 11,
        },
      },
      {
        can: usePublicationOnly,
      },
    );
    const v2Runtime = await service.resolveRuntime(
      {
        sourceMode: 'light-extension',
        sourceBinding: createSourceBinding({ publicationId: 'lep_v2' }),
        settings: {},
      },
      {
        can: usePublicationOnly,
      },
    );

    expect(v1Runtime.settings).toEqual({
      title: 'Old title',
      limit: 11,
    });
    expect(v2Runtime.settings).toEqual({
      title: 'New title',
      limit: 20,
    });
  });

  it('keeps runtime code identity stable while resolving per-FlowModel settings independently', async () => {
    const { service } = createResolveService([createPublicationRecord({ id: 'lep_shared' })]);

    const firstRuntime = await service.resolveRuntime(
      {
        sourceMode: 'light-extension',
        sourceBinding: createSourceBinding({ publicationId: 'lep_shared' }),
        settings: {
          title: 'First block',
        },
      },
      {
        can: usePublicationOnly,
      },
    );
    const secondRuntime = await service.resolveRuntime(
      {
        sourceMode: 'light-extension',
        sourceBinding: createSourceBinding({ publicationId: 'lep_shared' }),
        settings: {
          title: 'Second block',
        },
      },
      {
        can: usePublicationOnly,
      },
    );

    expect(firstRuntime.runtimeCodeHash).toBe(secondRuntime.runtimeCodeHash);
    expect(firstRuntime.code).toBe(secondRuntime.code);
    expect(firstRuntime.settings).toMatchObject({
      title: 'First block',
      limit: 10,
    });
    expect(secondRuntime.settings).toMatchObject({
      title: 'Second block',
      limit: 10,
    });
    expect(firstRuntime.cache.etag).not.toBe(secondRuntime.cache.etag);
  });

  it('returns 422 field-level settings issues from the publication snapshot validator', async () => {
    const { service } = createResolveService([createPublicationRecord({ id: 'lep_invalid' })]);

    await expect(
      service.resolveRuntime(
        {
          sourceMode: 'light-extension',
          sourceBinding: createSourceBinding({ publicationId: 'lep_invalid' }),
          settings: {
            title: 123,
            limit: 99,
          },
        },
        {
          can: usePublicationOnly,
        },
      ),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_SETTINGS_INVALID',
      status: 422,
      details: {
        reasonCode: 'settings_invalid',
        publicationId: 'lep_invalid',
        issues: expect.arrayContaining([
          expect.objectContaining({
            path: '$.title',
            code: 'settings_type_mismatch',
          }),
          expect.objectContaining({
            path: '$.limit',
            code: 'settings_maximum',
          }),
        ]),
      },
    });
  });
});

function createResolveService(publications: Record<string, unknown>[]) {
  const publicationModels = publications.map(createModel);
  const publicationsRepository = {
    findOne: vi.fn(({ filterByTk }: { filterByTk?: string }) =>
      Promise.resolve(publicationModels.find((publication) => publication.get('id') === filterByTk) || null),
    ),
  };
  const reposRepository = {
    findOne: vi.fn().mockResolvedValue(
      createModel({
        id: 'ler_sales',
        lifecycleStatus: 'enabled',
      }),
    ),
  };
  const entriesRepository = {
    findOne: vi.fn().mockResolvedValue(
      createModel({
        id: 'lee_sales_kpi',
        repoId: 'ler_sales',
        kind: 'js-block',
        settingsSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              default: 'Current entry schema title',
            },
          },
        },
        activePublicationId: 'lep_v2',
        healthStatus: 'ready',
      }),
    ),
  };
  const logsRepository = {
    create: vi.fn().mockResolvedValue(createModel({})),
  };
  const db = {
    getRepository: (name: string) => {
      if (name === 'lightExtensionEntryPublications') {
        return publicationsRepository;
      }
      if (name === 'lightExtensionRepos') {
        return reposRepository;
      }
      if (name === 'lightExtensionEntries') {
        return entriesRepository;
      }
      if (name === 'lightExtensionLogs') {
        return logsRepository;
      }

      throw new Error(`Unexpected repository ${name}`);
    },
  } as unknown as Database;
  const auditService = new LightExtensionAuditService(db);
  const permissionService = new LightExtensionPermissionService(auditService);

  return {
    service: new LightExtensionPublicationResolveService(db, auditService, permissionService),
    publicationsRepository,
  };
}

function usePublicationOnly({ action }: { action: string }) {
  return action === 'usePublication' ? {} : null;
}

function createSourceBinding(
  input: Partial<LightExtensionRuntimeSourceBinding> = {},
): LightExtensionRuntimeSourceBinding {
  return {
    type: 'light-extension-entry',
    repoId: 'ler_sales',
    entryId: 'lee_sales_kpi',
    kind: 'js-block',
    publicationId: 'lep_sales_kpi',
    versionPolicy: 'pinned',
    ...input,
  };
}

function createPublicationRecord(input: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: 'lep_sales_kpi',
    repoId: 'ler_sales',
    entryId: 'lee_sales_kpi',
    commitId: 'vsc_commit_1',
    entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
    target: 'client',
    kind: 'js-block',
    surfaceStyle: 'render',
    runtimeVersion: 'v2',
    artifact: {
      code: "ctx.render('shared runtime');\n",
      sourceMap: '{"version":3}',
      version: 'v2',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      filesHash: 'files_hash_1',
      diagnostics: [],
    },
    settingsSchemaSnapshot: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          default: 'Default title',
        },
        limit: {
          type: 'number',
          default: 10,
          maximum: 50,
        },
      },
    },
    settingsDefaultsSnapshot: {
      title: 'Default title',
      limit: 10,
    },
    settingsSchemaHash: 'schema_hash_1',
    settingsDefaultsHash: 'defaults_hash_1',
    filesHash: 'files_hash_1',
    runtimeCodeHash: 'runtime_hash_1',
    diagnostics: [],
    createdAt: new Date('2026-07-06T00:00:00.000Z'),
    ...input,
  };
}

function createModel(values: Record<string, unknown>): Model {
  return {
    get: (key: string) => values[key],
  } as unknown as Model;
}
