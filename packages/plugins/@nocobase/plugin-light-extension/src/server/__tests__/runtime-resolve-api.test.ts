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
import type { Application } from '@nocobase/server';
import { vi } from 'vitest';

import { NAMESPACE } from '../../constants';
import type { LightExtensionRuntimeSourceBinding } from '../../shared/types';
import PluginLightExtensionServer from '../plugin';
import { createLightExtensionRuntimeResource } from '../resources/lightExtensionRuntime';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import { LightExtensionPublicationResolveService } from '../services/LightExtensionPublicationResolveService';
import { RuntimeResolveService } from '../services/RuntimeResolveService';

type RouteMiddleware = (
  ctx: {
    path: string;
    method: string;
    request?: {
      path: string;
    };
  },
  next: () => Promise<void>,
) => Promise<void>;

describe('plugin-light-extension runtime resolve API', () => {
  it('returns runtime code, source map, merged settings, and cache metadata through usePublication', async () => {
    const { service, publicationsRepository } = createRuntimeResolveService(createPublicationRecord());
    const can = vi.fn(({ action }: { action: string }) => (action === 'usePublication' ? {} : null));

    const result = await service.resolveRuntime(
      {
        sourceMode: 'light-extension',
        sourceBinding: createSourceBinding(),
        settings: {
          region: 'EMEA',
          nested: {
            label: 'Revenue',
          },
        },
      },
      {
        requestId: 'req_runtime_resolve',
        actorUserId: '7',
        can,
      },
    );

    expect(can).toHaveBeenCalledWith({
      resource: 'lightExtension',
      action: 'usePublication',
    });
    expect(publicationsRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByTk: 'lep_sales_kpi',
      }),
    );
    expect(result).toMatchObject({
      publicationId: 'lep_sales_kpi',
      entryId: 'lee_sales_kpi',
      runtimeCodeHash: 'runtime_hash_1',
      code: expect.stringContaining('runtime secret'),
      version: 'v2',
      sourceMap: '{"version":3}',
      settings: {
        threshold: 5,
        region: 'EMEA',
        nested: {
          enabled: true,
          label: 'Revenue',
        },
      },
      cache: {
        immutable: true,
        etag: expect.stringMatching(/^"[a-f0-9]{64}"$/),
      },
    });
  });

  it('rejects runtime bindings whose kind does not match the publication snapshot', async () => {
    const { service } = createRuntimeResolveService(createPublicationRecord());

    await expect(
      service.resolveRuntime(
        {
          sourceMode: 'light-extension',
          sourceBinding: createSourceBinding({ kind: 'js-field' }),
          settings: {},
        },
        {
          can: ({ action }: { action: string }) => (action === 'usePublication' ? {} : null),
        },
      ),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_BINDING_OUTDATED',
      status: 409,
      details: {
        publicationId: 'lep_sales_kpi',
        mismatches: [
          {
            field: 'kind',
            expected: 'js-field',
            actual: 'js-block',
          },
        ],
      },
    });
  });

  it('normalizes the runtime resolve resource input and passes request context to the service', async () => {
    const resolve = vi.fn().mockResolvedValue({
      publicationId: 'lep_sales_kpi',
      entryId: 'lee_sales_kpi',
      runtimeCodeHash: 'runtime_hash_1',
      code: 'ctx.render("ok");',
      version: 'v2',
      settings: {},
      cache: {
        etag: '"etag"',
        immutable: true,
      },
    });
    const resource = createLightExtensionRuntimeResource({
      resolve,
    } as unknown as RuntimeResolveService);
    const can = vi.fn().mockReturnValue({});
    const sourceBinding = createSourceBinding();
    const ctx = {
      action: {
        params: {
          values: {
            sourceMode: 'light-extension',
            sourceBinding,
            settings: {
              region: 'APAC',
            },
          },
        },
      },
      auth: {
        user: {
          id: 9,
        },
      },
      can,
      request: {
        headers: {
          'x-request-id': 'req_resource_runtime',
          'x-request-source': 'unit-resource',
        },
      },
    } as unknown as Context;

    await resource.actions?.resolve?.(ctx, async () => {});

    expect(resolve).toHaveBeenCalledWith(
      {
        sourceMode: 'light-extension',
        sourceBinding,
        settings: {
          region: 'APAC',
        },
      },
      expect.objectContaining({
        actorUserId: '9',
        requestId: 'req_resource_runtime',
        requestSource: 'unit-resource',
        can,
      }),
    );
    expect((ctx as { body?: unknown }).body).toMatchObject({
      publicationId: 'lep_sales_kpi',
      code: 'ctx.render("ok");',
    });
  });

  it('registers the documented POST runtime resolve route alias', async () => {
    const registeredRoutes: Array<{ middleware: RouteMiddleware; options?: { tag?: string } }> = [];
    const app = {
      db: {} as Database,
      acl: {
        registerSnippet: vi.fn(),
      },
      pm: {
        get: vi.fn(() => null),
        getPlugins: vi.fn(() => new Map()),
      },
      resourceManager: {
        define: vi.fn(),
        options: {
          prefix: '/api',
        },
      },
      on: vi.fn(),
      off: vi.fn(),
      use: vi.fn((middleware: RouteMiddleware, options?: { tag?: string }) => {
        registeredRoutes.push({
          middleware,
          options,
        });
      }),
    } as unknown as Application;
    const plugin = new PluginLightExtensionServer(app, {
      name: 'light-extension',
      packageName: NAMESPACE,
    });

    await plugin.load();

    const runtimeRoute = registeredRoutes.find((route) => route.options?.tag === 'light-extension-runtime-resolve');
    const ctx = {
      method: 'POST',
      path: '/api/light-extension-runtime/resolve',
      request: {
        path: '/api/light-extension-runtime/resolve',
      },
    };
    let routedPath = '';

    await runtimeRoute?.middleware(ctx, async () => {
      routedPath = ctx.path;
    });

    expect(routedPath).toBe('/api/lightExtensionRuntime:resolve');
    expect(ctx.path).toBe('/api/light-extension-runtime/resolve');
    expect(ctx.request.path).toBe('/api/light-extension-runtime/resolve');
  });

  it('returns 422 with field-level issues when settings do not match the publication snapshot schema', async () => {
    const { service } = createRuntimeResolveService(createPublicationRecord());

    await expect(
      service.resolveRuntime(
        {
          sourceMode: 'light-extension',
          sourceBinding: createSourceBinding(),
          settings: {
            threshold: 99,
            region: 'NA',
            contactEmail: 'not-an-email',
            extraPayload: 'hidden',
          },
        },
        {
          can: ({ action }: { action: string }) => (action === 'usePublication' ? {} : null),
        },
      ),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_SETTINGS_INVALID',
      status: 422,
      details: {
        reasonCode: 'settings_invalid',
        publicationId: 'lep_sales_kpi',
        issues: expect.arrayContaining([
          expect.objectContaining({
            path: '$.threshold',
            code: 'settings_maximum',
          }),
          expect.objectContaining({
            path: '$.region',
            code: 'settings_enum_mismatch',
          }),
          expect.objectContaining({
            path: '$.contactEmail',
            code: 'settings_format',
          }),
          expect.objectContaining({
            path: '$.extraPayload',
            code: 'settings_unknown_property',
          }),
        ]),
      },
    });
  });

  it('prunes stale settings before resolving a follow-active publication', async () => {
    const { service } = createRuntimeResolveService(
      {
        ...createPublicationRecord(),
        id: 'lep_sales_active',
        settingsSchemaHash: 'schema_active',
        settingsSchemaSnapshot: {
          type: 'object',
          properties: {
            activePlan: {
              type: 'string',
            },
          },
        },
        settingsDefaultsSnapshot: {
          activePlan: 'active-default',
        },
      },
      {
        activePublicationId: 'lep_sales_active',
      },
    );

    const result = await service.resolveRuntime(
      {
        sourceMode: 'light-extension',
        sourceBinding: createSourceBinding({
          publicationId: 'lep_sales_legacy',
          versionPolicy: 'follow-active',
        }),
        settings: {
          legacyPlan: 'legacy-value',
        },
      },
      {
        can: ({ action }: { action: string }) => (action === 'usePublication' ? {} : null),
      },
    );

    expect(result).toMatchObject({
      publicationId: 'lep_sales_active',
      settings: {
        activePlan: 'active-default',
      },
      cache: {
        immutable: false,
      },
    });
    expect(JSON.stringify(result.settings)).not.toContain('legacyPlan');
  });

  it('can derive settings defaults from the publication schema snapshot when defaults snapshot is absent', async () => {
    const { service } = createRuntimeResolveService({
      ...createPublicationRecord(),
      settingsDefaultsSnapshot: null,
    });

    const result = await service.resolveRuntime(
      {
        sourceMode: 'light-extension',
        sourceBinding: createSourceBinding(),
        settings: {
          nested: {
            label: 'Fallback',
          },
        },
      },
      {
        can: ({ action }: { action: string }) => (action === 'usePublication' ? {} : null),
      },
    );

    expect(result.settings).toMatchObject({
      threshold: 5,
      region: 'APAC',
      contactEmail: 'ops@example.com',
      nested: {
        enabled: true,
        label: 'Fallback',
      },
    });
  });

  it('blocks runtime code for disabled repos and missing or disabled entries', async () => {
    const blockedCases = [
      {
        name: 'disabled repo',
        repoLifecycleStatus: 'disabled',
        entryHealthStatus: 'ready',
        reasonCode: 'repo_disabled',
      },
      {
        name: 'archived repo',
        repoLifecycleStatus: 'archived',
        entryHealthStatus: 'ready',
        reasonCode: 'repo_archived',
      },
      {
        name: 'missing entry',
        repoLifecycleStatus: 'enabled',
        entryHealthStatus: 'missing',
        reasonCode: 'entry_missing',
      },
      {
        name: 'disabled entry',
        repoLifecycleStatus: 'enabled',
        entryHealthStatus: 'disabled',
        reasonCode: 'entry_disabled',
      },
    ];

    for (const blockedCase of blockedCases) {
      const { service } = createRuntimeResolveService(createPublicationRecord(), blockedCase);

      await expect(
        service.resolveRuntime(
          {
            sourceMode: 'light-extension',
            sourceBinding: createSourceBinding(),
            settings: {},
          },
          {
            can: ({ action }: { action: string }) => (action === 'usePublication' ? {} : null),
          },
        ),
      ).rejects.toMatchObject({
        code: 'LIGHT_EXTENSION_LIFECYCLE_CONFLICT',
        status: 409,
        details: {
          reasonCode: blockedCase.reasonCode,
          publicationId: 'lep_sales_kpi',
        },
      });
    }
  });

  it('blocks runtime code for historical ready publications whose kind is not enabled', async () => {
    const { service } = createRuntimeResolveService(
      {
        ...createPublicationRecord(),
        id: 'lep_run_task',
        entryId: 'lee_run_task',
        entryPath: 'src/client/runjs/run-task/index.ts',
        kind: 'runjs',
        surfaceStyle: 'run',
      },
      {
        entryId: 'lee_run_task',
        entryKind: 'runjs',
      },
    );

    await expect(
      service.resolveRuntime(
        {
          sourceMode: 'light-extension',
          sourceBinding: createSourceBinding({
            publicationId: 'lep_run_task',
            entryId: 'lee_run_task',
            kind: 'runjs',
          }),
          settings: {},
        },
        {
          can: ({ action }: { action: string }) => (action === 'usePublication' ? {} : null),
        },
      ),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_LIFECYCLE_CONFLICT',
      status: 409,
      details: {
        reasonCode: 'kind_disabled',
        publicationId: 'lep_run_task',
        kind: 'runjs',
      },
    });
  });

  it('uses 422 for runtime resolve input contract failures', async () => {
    const { service, publicationsRepository } = createRuntimeResolveService(createPublicationRecord());

    await expect(
      service.resolveRuntime(
        {
          sourceMode: 'inline',
          sourceBinding: createSourceBinding(),
          settings: {},
        } as never,
        {
          can: ({ action }: { action: string }) => (action === 'usePublication' ? {} : null),
        },
      ),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_INVALID_INPUT',
      status: 422,
      details: {
        reasonCode: 'invalid_input',
      },
    });
    expect(publicationsRepository.findOne).not.toHaveBeenCalled();
  });
});

function createRuntimeResolveService(
  record: Record<string, unknown>,
  options: {
    repoLifecycleStatus?: string;
    entryHealthStatus?: string;
    activePublicationId?: string;
    entryId?: string;
    entryKind?: string;
  } = {},
) {
  const publicationsRepository = {
    findOne: vi.fn().mockResolvedValue(createModel(record)),
  };
  const reposRepository = {
    findOne: vi.fn().mockResolvedValue(
      createModel({
        id: 'ler_sales',
        lifecycleStatus: options.repoLifecycleStatus || 'enabled',
      }),
    ),
  };
  const entriesRepository = {
    findOne: vi.fn().mockResolvedValue(
      createModel({
        id: options.entryId || 'lee_sales_kpi',
        repoId: 'ler_sales',
        kind: options.entryKind || 'js-block',
        healthStatus: options.entryHealthStatus || 'ready',
        activePublicationId: options.activePublicationId,
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
    reposRepository,
    entriesRepository,
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
      metadata: {
        publicationContract: 'light-extension.external-runjs.v1',
      },
    },
    settingsSchemaSnapshot: {
      type: 'object',
      required: ['threshold'],
      properties: {
        threshold: {
          type: 'number',
          default: 5,
          minimum: 0,
          maximum: 10,
        },
        region: {
          type: 'string',
          default: 'APAC',
          enum: ['APAC', 'EMEA'],
        },
        contactEmail: {
          type: 'string',
          default: 'ops@example.com',
          format: 'email',
        },
        nested: {
          type: 'object',
          properties: {
            enabled: {
              type: 'boolean',
              default: true,
            },
            label: {
              type: 'string',
              default: 'KPI',
            },
          },
        },
      },
    },
    settingsDefaultsSnapshot: {
      threshold: 5,
      region: 'APAC',
      contactEmail: 'ops@example.com',
      nested: {
        enabled: true,
        label: 'KPI',
      },
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
