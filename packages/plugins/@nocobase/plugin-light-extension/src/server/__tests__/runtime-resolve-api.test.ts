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
  it('returns runtime code, source map, merged settings, and cache metadata through useRuntime', async () => {
    const { service, entriesRepository } = createRuntimeResolveService();
    const can = vi.fn(({ action }: { action: string }) => (action === 'useRuntime' ? {} : null));

    const result = await service.resolve(
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
      action: 'useRuntime',
    });
    expect(entriesRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByTk: 'lee_sales_kpi',
      }),
    );
    expect(result).toMatchObject({
      entryId: 'lee_sales_kpi',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
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
        immutable: false,
        etag: expect.stringMatching(/^"[a-f0-9]{64}"$/),
      },
    });
  });

  it('rejects runtime bindings whose identity does not match the entry current runtime', async () => {
    const { service } = createRuntimeResolveService();

    await expect(
      service.resolve(
        {
          sourceMode: 'light-extension',
          sourceBinding: createSourceBinding({ kind: 'js-field' }),
          settings: {},
        },
        {
          can: ({ action }: { action: string }) => (action === 'useRuntime' ? {} : null),
        },
      ),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_BINDING_OUTDATED',
      status: 409,
      details: {
        entryId: 'lee_sales_kpi',
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
      entryId: 'lee_sales_kpi',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      runtimeCodeHash: 'runtime_hash_1',
      code: 'ctx.render("ok");',
      version: 'v2',
      settings: {},
      cache: {
        etag: '"etag"',
        immutable: false,
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
      entryId: 'lee_sales_kpi',
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

  it('returns 422 with field-level issues when settings do not match the entry current schema', async () => {
    const { service } = createRuntimeResolveService();

    await expect(
      service.resolve(
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
          can: ({ action }: { action: string }) => (action === 'useRuntime' ? {} : null),
        },
      ),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_SETTINGS_INVALID',
      status: 422,
      details: {
        reasonCode: 'settings_invalid',
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

  it('blocks runtime code for disabled repos, unhealthy entries, disabled kinds, and missing artifacts', async () => {
    const blockedCases = [
      {
        name: 'disabled repo',
        repoLifecycleStatus: 'disabled',
        reasonCode: 'repo_disabled',
      },
      {
        name: 'archived repo',
        repoLifecycleStatus: 'archived',
        reasonCode: 'repo_archived',
      },
      {
        name: 'missing entry',
        entryHealthStatus: 'missing',
        reasonCode: 'entry_missing',
      },
      {
        name: 'disabled entry',
        entryHealthStatus: 'disabled',
        reasonCode: 'entry_disabled',
      },
      {
        name: 'event kind',
        entryKind: 'event',
        sourceKind: 'event',
        reasonCode: 'kind_disabled',
      },
      {
        name: 'missing runtime',
        runtimeArtifact: null,
        compiledCommitId: null,
        reasonCode: 'runtime_missing',
      },
    ];

    for (const blockedCase of blockedCases) {
      const { service } = createRuntimeResolveService(blockedCase);

      await expect(
        service.resolve(
          {
            sourceMode: 'light-extension',
            sourceBinding: createSourceBinding({
              kind: blockedCase.sourceKind || 'js-block',
            }),
            settings: {},
          },
          {
            can: ({ action }: { action: string }) => (action === 'useRuntime' ? {} : null),
          },
        ),
      ).rejects.toMatchObject({
        code: 'LIGHT_EXTENSION_LIFECYCLE_CONFLICT',
        status: 409,
        details: {
          reasonCode: blockedCase.reasonCode,
          entryId: 'lee_sales_kpi',
        },
      });
    }
  });

  it('uses 422 for runtime resolve input contract failures before loading entries', async () => {
    const { service, entriesRepository } = createRuntimeResolveService();

    await expect(
      service.resolve(
        {
          sourceMode: 'inline',
          sourceBinding: createSourceBinding(),
          settings: {},
        } as never,
        {
          can: ({ action }: { action: string }) => (action === 'useRuntime' ? {} : null),
        },
      ),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_INVALID_INPUT',
      status: 422,
      details: {
        reasonCode: 'invalid_input',
      },
    });
    expect(entriesRepository.findOne).not.toHaveBeenCalled();
  });
});

function createRuntimeResolveService(
  options: {
    repoLifecycleStatus?: string;
    entryHealthStatus?: string;
    entryKind?: string;
    sourceKind?: string;
    runtimeArtifact?: Record<string, unknown> | null;
    compiledCommitId?: string | null;
  } = {},
) {
  const entryRecord = createEntryRecord(options);
  const reposRepository = {
    findOne: vi.fn().mockResolvedValue(
      createModel({
        id: 'ler_sales',
        lifecycleStatus: options.repoLifecycleStatus || 'enabled',
      }),
    ),
  };
  const entriesRepository = {
    findOne: vi.fn().mockResolvedValue(createModel(entryRecord)),
  };
  const logsRepository = {
    create: vi.fn().mockResolvedValue(createModel({})),
  };
  const db = {
    getRepository: (name: string) => {
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
    service: new RuntimeResolveService(db, auditService, permissionService),
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
    ...input,
  };
}

function createEntryRecord(
  input: {
    entryHealthStatus?: string;
    entryKind?: string;
    runtimeArtifact?: Record<string, unknown> | null;
    compiledCommitId?: string | null;
  } = {},
): Record<string, unknown> {
  const kind = input.entryKind || 'js-block';
  const entryPath =
    kind === 'event' ? 'src/client/events/page-open/index.ts' : 'src/client/js-blocks/sales-kpi/index.tsx';
  const runtimeArtifact =
    typeof input.runtimeArtifact === 'undefined'
      ? {
          code: "const secret = 'runtime secret';\nctx.render(secret);\n",
          sourceMap: '{"version":3}',
          version: 'v2',
          entryPath,
          filesHash: 'files_hash_1',
          diagnostics: [],
          metadata: {
            runtimeContract: 'light-extension.current-runtime.v1',
          },
        }
      : input.runtimeArtifact;

  return {
    id: 'lee_sales_kpi',
    repoId: 'ler_sales',
    target: 'client',
    kind,
    entryName: 'sales-kpi',
    entryPath,
    metaPath: null,
    settingsPath: null,
    title: 'Sales KPI',
    description: null,
    category: null,
    icon: null,
    tags: null,
    sort: null,
    settingsSchema: {
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
    compiledCommitId: typeof input.compiledCommitId === 'undefined' ? 'vsc_commit_1' : input.compiledCommitId,
    runtimeArtifact,
    runtimeVersion: runtimeArtifact ? 'v2' : null,
    surfaceStyle: runtimeArtifact ? 'render' : null,
    runtimeCodeHash: runtimeArtifact ? 'runtime_hash_1' : null,
    filesHash: runtimeArtifact ? 'files_hash_1' : null,
    settingsDefaultsHash: runtimeArtifact ? 'defaults_hash_1' : null,
    compiledAt: runtimeArtifact ? '2026-07-06T00:00:00.000Z' : null,
    healthStatus: input.entryHealthStatus || 'ready',
    diagnostics: [],
    validatorVersion: 'test',
    lastScannedCommitId: 'vsc_commit_1',
    lastScannedAt: null,
    createdAt: null,
    updatedAt: null,
  };
}

function createModel(values: Record<string, unknown>): Model {
  return {
    get: (key: string) => values[key],
    update: vi.fn(async (nextValues: Record<string, unknown>) => {
      Object.assign(values, nextValues);
      return createModel(values);
    }),
  } as unknown as Model;
}
