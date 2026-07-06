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

describe('plugin-light-extension readPublication vs usePublication boundary', () => {
  it('keeps metadata reads separate from runtime code resolution', async () => {
    const { service, auditService, publicationsRepository } = createResolveService(createPublicationRecord());
    const recordPublicationUseDenied = vi
      .spyOn(auditService, 'recordPublicationUseDenied')
      .mockResolvedValue(undefined);
    const readOnlyCan = vi.fn(({ action }: { action: string }) => (action === 'readPublication' ? {} : null));

    const metadata = await service.getMetadata('lep_sales_kpi', {
      requestId: 'req_read_publication',
      actorUserId: '8',
      can: readOnlyCan,
    });

    expect(readOnlyCan).toHaveBeenCalledWith({
      resource: 'lightExtension',
      action: 'readPublication',
    });
    expect(JSON.stringify(metadata)).not.toContain('runtime secret');
    expect(JSON.stringify(metadata)).not.toContain('sourceMap');

    publicationsRepository.findOne.mockClear();
    await expect(
      service.resolveRuntime(
        {
          sourceMode: 'light-extension',
          sourceBinding: createSourceBinding(),
          settings: {},
        },
        {
          requestId: 'req_use_publication_denied',
          actorUserId: '8',
          requestSource: 'unit-read-only',
          can: readOnlyCan,
        },
      ),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_PERMISSION_DENIED',
      status: 403,
    });

    expect(publicationsRepository.findOne).not.toHaveBeenCalled();
    expect(recordPublicationUseDenied).toHaveBeenCalledWith(
      expect.objectContaining({
        publicationId: 'lep_sales_kpi',
        requestId: 'req_use_publication_denied',
        actorUserId: '8',
        reasonCode: 'LIGHT_EXTENSION_PERMISSION_DENIED',
        requestSource: 'unit-read-only',
      }),
    );
    expect(JSON.stringify(recordPublicationUseDenied.mock.calls)).not.toContain('runtime secret');
    expect(JSON.stringify(recordPublicationUseDenied.mock.calls)).not.toContain('sourceMap');
  });

  it('does not let usePublication imply metadata readPublication', async () => {
    const { service, auditService } = createResolveService(createPublicationRecord());
    const recordPublicationReadDenied = vi
      .spyOn(auditService, 'recordPublicationReadDenied')
      .mockResolvedValue(undefined);
    const useOnlyCan = vi.fn(({ action }: { action: string }) => (action === 'usePublication' ? {} : null));

    const runtime = await service.resolveRuntime(
      {
        sourceMode: 'light-extension',
        sourceBinding: createSourceBinding(),
        settings: {},
      },
      {
        requestId: 'req_use_publication',
        can: useOnlyCan,
      },
    );

    expect(runtime.code).toContain('runtime secret');
    await expect(
      service.getMetadata('lep_sales_kpi', {
        requestId: 'req_read_publication_denied',
        actorUserId: '9',
        requestSource: 'unit-use-only',
        can: useOnlyCan,
      }),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_PERMISSION_DENIED',
      status: 403,
    });
    expect(recordPublicationReadDenied).toHaveBeenCalledWith(
      expect.objectContaining({
        publicationId: 'lep_sales_kpi',
        requestId: 'req_read_publication_denied',
        actorUserId: '9',
        reasonCode: 'LIGHT_EXTENSION_PERMISSION_DENIED',
        requestSource: 'unit-use-only',
      }),
    );
  });
});

function createResolveService(record: Record<string, unknown>) {
  const publicationsRepository = {
    findOne: vi.fn().mockResolvedValue(createModel(record)),
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
    auditService,
    publicationsRepository,
  };
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

function createPublicationRecord(): Record<string, unknown> {
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
      code: "const secret = 'runtime secret';\nctx.render(secret);\n",
      sourceMap: '{"version":3}',
      version: 'v2',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      filesHash: 'files_hash_1',
      diagnostics: [],
    },
    settingsSchemaSnapshot: {
      type: 'object',
      properties: {},
    },
    settingsDefaultsSnapshot: {},
    settingsSchemaHash: 'schema_hash_1',
    settingsDefaultsHash: 'defaults_hash_1',
    filesHash: 'files_hash_1',
    runtimeCodeHash: 'runtime_hash_1',
    diagnostics: [],
    createdAt: new Date('2026-07-06T00:00:00.000Z'),
  };
}

function createModel(values: Record<string, unknown>): Model {
  return {
    get: (key: string) => values[key],
  } as unknown as Model;
}
