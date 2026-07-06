/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { Database, Model } from '@nocobase/database';
import { vi } from 'vitest';

import { createLightExtensionPublicationsResource } from '../resources/lightExtensionPublications';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import { LightExtensionPublicationResolveService } from '../services/LightExtensionPublicationResolveService';

describe('plugin-light-extension publication resolve contract', () => {
  it('returns metadata-only publication snapshots without runtime code or source maps', async () => {
    const { service } = createResolveService(createPublicationRecord());

    const metadata = await service.getMetadata('lep_sales_kpi', {
      can: () => ({}),
    });
    const runtime = await service.getPublication('lep_sales_kpi', {
      can: () => ({}),
    });

    expect(metadata).toMatchObject({
      id: 'lep_sales_kpi',
      repoId: 'ler_sales',
      entryId: 'lee_sales_kpi',
      commitId: 'vsc_commit_1',
      settingsSchemaSnapshot: {
        type: 'object',
      },
      settingsDefaultsSnapshot: {
        threshold: 5,
      },
      settingsSchemaHash: 'schema_hash_1',
      settingsDefaultsHash: 'defaults_hash_1',
      filesHash: 'files_hash_1',
      runtimeCodeHash: 'runtime_hash_1',
      artifact: {
        version: 'v2',
        entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
        filesHash: 'files_hash_1',
        metadata: expect.objectContaining({
          publicationContract: 'light-extension.external-runjs.v1',
        }),
      },
    });
    expect(JSON.stringify(metadata.artifact)).not.toContain('runtime secret');
    expect(JSON.stringify(metadata.artifact)).not.toContain('sourceMap');
    expect(runtime.artifact.code).toContain('runtime secret');
    expect(runtime.artifact.sourceMap).toBe('{"version":3}');
  });

  it('lists repo publications as metadata-only records', async () => {
    const { service, publicationsRepository } = createResolveService(createPublicationRecord());

    const publications = await service.listMetadataByRepo('ler_sales', {
      can: () => ({}),
    });

    expect(publicationsRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: {
          repoId: 'ler_sales',
        },
        sort: ['entryId', '-createdAt'],
      }),
    );
    expect(publications).toEqual([
      expect.objectContaining({
        id: 'lep_sales_kpi',
        repoId: 'ler_sales',
        entryId: 'lee_sales_kpi',
      }),
    ]);
    expect(JSON.stringify(publications[0].artifact)).not.toContain('runtime secret');
    expect(JSON.stringify(publications[0].artifact)).not.toContain('sourceMap');
  });

  it('normalizes metadata-only resource list reads', async () => {
    const service = {
      listMetadataByRepo: vi.fn().mockResolvedValue([{ id: 'lep_sales_kpi' }]),
    } as unknown as LightExtensionPublicationResolveService;
    const resource = createLightExtensionPublicationsResource(service);
    const can = vi.fn().mockReturnValue({});
    const ctx = {
      action: {
        params: {
          filterByTk: 'ler_sales',
        },
      },
      auth: {
        user: {
          id: '7',
        },
      },
      can,
      request: {
        headers: {
          'x-request-id': 'req_publication_list',
          'x-request-source': 'unit-resource',
        },
      },
    } as unknown as Context;

    await resource.actions?.list?.(ctx, async () => {});

    expect(service.listMetadataByRepo).toHaveBeenCalledWith(
      'ler_sales',
      expect.objectContaining({
        actorUserId: '7',
        requestId: 'req_publication_list',
        requestSource: 'unit-resource',
        can,
      }),
    );
    expect((ctx as { body?: unknown }).body).toEqual([{ id: 'lep_sales_kpi' }]);
  });

  it('normalizes metadata-only resource reads and preserves the readPublication permission context', async () => {
    const service = {
      getMetadata: vi.fn().mockResolvedValue({ id: 'lep_sales_kpi' }),
    } as unknown as LightExtensionPublicationResolveService;
    const resource = createLightExtensionPublicationsResource(service);
    const can = vi.fn().mockReturnValue({});
    const ctx = {
      action: {
        params: {
          filterByTk: 'lep_sales_kpi',
        },
      },
      auth: {
        user: {
          id: '7',
        },
      },
      can,
      request: {
        headers: {
          'x-request-id': 'req_publication_get',
          'x-request-source': 'unit-resource',
        },
      },
    } as unknown as Context;

    await resource.actions?.get?.(ctx, async () => {});

    expect(service.getMetadata).toHaveBeenCalledWith(
      'lep_sales_kpi',
      expect.objectContaining({
        actorUserId: '7',
        requestId: 'req_publication_get',
        requestSource: 'unit-resource',
        can,
      }),
    );
    expect((ctx as { body?: unknown }).body).toEqual({ id: 'lep_sales_kpi' });
  });
});

function createResolveService(record: Record<string, unknown>) {
  const publicationsRepository = {
    find: vi.fn().mockResolvedValue([createModel(record)]),
    findOne: vi.fn().mockResolvedValue(createModel(record)),
  };
  const db = {
    getRepository: (name: string) => {
      if (name === 'lightExtensionEntryPublications') {
        return publicationsRepository;
      }
      if (name === 'lightExtensionLogs') {
        return {
          create: vi.fn().mockResolvedValue(createModel({})),
        };
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
      metadata: {
        publicationContract: 'light-extension.external-runjs.v1',
      },
    },
    settingsSchemaSnapshot: {
      type: 'object',
    },
    settingsDefaultsSnapshot: {
      threshold: 5,
    },
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
