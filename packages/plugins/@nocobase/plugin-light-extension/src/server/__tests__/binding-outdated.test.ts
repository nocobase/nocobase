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

import type { LightExtensionRuntimeSourceBinding } from '../../shared/types';
import { createLightExtensionRuntimeResource } from '../resources/lightExtensionRuntime';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import { LightExtensionPublicationResolveService } from '../services/LightExtensionPublicationResolveService';
import { RuntimeResolveService } from '../services/RuntimeResolveService';

describe('plugin-light-extension binding outdated guard', () => {
  it('returns 409 when sourceBinding identity no longer matches the pinned publication', async () => {
    const { runtimeService } = createRuntimeResolveService(createPublicationRecord());
    const resource = createLightExtensionRuntimeResource(runtimeService);
    const ctx = {
      action: {
        params: {
          values: {
            sourceMode: 'light-extension',
            sourceBinding: createSourceBinding({
              repoId: 'ler_other',
            }),
            settings: {},
          },
        },
      },
      can: ({ action }: { action: string }) => (action === 'usePublication' ? {} : null),
      request: {
        headers: {
          'x-request-id': 'req_binding_outdated',
        },
      },
    } as unknown as Context;

    await resource.actions?.resolve?.(ctx, async () => {});

    expect((ctx as { status?: number }).status).toBe(409);
    expect((ctx as { body?: { errors?: Array<Record<string, unknown>> } }).body?.errors?.[0]).toMatchObject({
      code: 'LIGHT_EXTENSION_BINDING_OUTDATED',
      status: 409,
      details: {
        publicationId: 'lep_sales_kpi',
        mismatches: [
          {
            field: 'repoId',
            expected: 'ler_other',
            actual: 'ler_sales',
          },
        ],
      },
    });
    expect(JSON.stringify((ctx as { body?: unknown }).body)).not.toContain('runtime secret');
    expect(JSON.stringify((ctx as { body?: unknown }).body)).not.toContain('sourceMap');
  });

  it('reserves an explicit error for follow-active bindings until that policy is implemented', async () => {
    const { service, publicationsRepository } = createRuntimeResolveService(createPublicationRecord());

    await expect(
      service.resolveRuntime(
        {
          sourceMode: 'light-extension',
          sourceBinding: createSourceBinding({
            versionPolicy: 'follow-active',
          }),
          settings: {},
        },
        {
          can: ({ action }: { action: string }) => (action === 'usePublication' ? {} : null),
        },
      ),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_VERSION_POLICY_UNSUPPORTED',
      status: 422,
    });
    expect(publicationsRepository.findOne).not.toHaveBeenCalled();
  });
});

function createRuntimeResolveService(record: Record<string, unknown>) {
  const publicationsRepository = {
    findOne: vi.fn().mockResolvedValue(createModel(record)),
  };
  const logsRepository = {
    create: vi.fn().mockResolvedValue(createModel({})),
  };
  const db = {
    getRepository: (name: string) => {
      if (name === 'lightExtensionEntryPublications') {
        return publicationsRepository;
      }
      if (name === 'lightExtensionLogs') {
        return logsRepository;
      }

      throw new Error(`Unexpected repository ${name}`);
    },
  } as unknown as Database;
  const auditService = new LightExtensionAuditService(db);
  const permissionService = new LightExtensionPermissionService(auditService);
  const service = new LightExtensionPublicationResolveService(db, auditService, permissionService);

  return {
    service,
    runtimeService: new RuntimeResolveService(service),
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
