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
  it('returns an immutable artifact pointer and merged settings without runtime code', async () => {
    const { service, entriesRepository } = createRuntimeResolveService();

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
      },
    );

    expect(entriesRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByTk: 'lee_sales_kpi',
      }),
    );
    expect(result).toMatchObject({
      entryId: 'lee_sales_kpi',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      artifactHash: 'a'.repeat(64),
      artifactUrl: `/api/light-extension-runtime/artifacts/${'a'.repeat(64)}`,
      runtimeCodeHash: 'runtime_hash_1',
      version: 'v2',
      settings: {
        threshold: 5,
        region: 'EMEA',
        nested: {
          enabled: true,
          label: 'Revenue',
        },
      },
      settingsHash: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(result).not.toHaveProperty('code');
    expect(result).not.toHaveProperty('sourceMap');
  });

  it('deeply merges object defaults and preserves optional or hidden values using normal schema validation', async () => {
    const settingsSchema = {
      type: 'object',
      required: ['displayOptions'],
      properties: {
        mode: {
          type: 'string',
          default: 'advanced',
        },
        displayOptions: {
          type: 'object',
          required: ['advancedColor'],
          properties: {
            enableColor: {
              type: 'boolean',
              default: false,
            },
            advancedColor: {
              type: 'string',
              default: '#1677ff',
              'x-visible-when': {
                path: 'displayOptions.enableColor',
                operator: '$eq',
                value: true,
              },
            },
            optionalLabel: {
              type: 'string',
              'x-visible-when': {
                path: 'displayOptions.enableColor',
                operator: '$eq',
                value: true,
              },
            },
          },
        },
      },
    };
    const { service } = createRuntimeResolveService({ settingsSchema });

    await expect(
      service.resolve(
        {
          sourceMode: 'light-extension',
          sourceBinding: createSourceBinding(),
          settings: {
            displayOptions: {
              enableColor: false,
            },
          },
        },
        {},
      ),
    ).resolves.toMatchObject({
      settings: {
        mode: 'advanced',
        displayOptions: {
          enableColor: false,
          advancedColor: '#1677ff',
        },
      },
    });

    await expect(
      service.resolve(
        {
          sourceMode: 'light-extension',
          sourceBinding: createSourceBinding(),
          settings: {
            displayOptions: {
              enableColor: false,
              advancedColor: '#00ff00',
              optionalLabel: 'preserved while hidden',
            },
          },
        },
        {},
      ),
    ).resolves.toMatchObject({
      settings: {
        displayOptions: {
          enableColor: false,
          advancedColor: '#00ff00',
          optionalLabel: 'preserved while hidden',
        },
      },
    });
  });

  it('rejects invalid hidden values and nested unknown properties with field-level issues', async () => {
    const settingsSchema = {
      type: 'object',
      properties: {
        displayOptions: {
          type: 'object',
          properties: {
            enableColor: { type: 'boolean', default: false },
            pageSize: {
              type: 'integer',
              minimum: 1,
              'x-visible-when': {
                path: 'displayOptions.enableColor',
                operator: '$eq',
                value: true,
              },
            },
          },
        },
      },
    };
    const { service } = createRuntimeResolveService({ settingsSchema });

    await expect(
      service.resolve(
        {
          sourceMode: 'light-extension',
          sourceBinding: createSourceBinding(),
          settings: {
            displayOptions: {
              enableColor: false,
              pageSize: 0,
              unknown: true,
            },
          },
        },
        {},
      ),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_SETTINGS_INVALID',
      status: 422,
      details: {
        issues: expect.arrayContaining([
          expect.objectContaining({ path: '$.displayOptions.pageSize', code: 'settings_minimum' }),
          expect.objectContaining({ path: '$.displayOptions.unknown', code: 'settings_unknown_property' }),
        ]),
      },
    });
  });

  it.each([
    ['a missing settings schema', null],
    ['an empty settings schema', {}],
    ['an object schema without properties', { type: 'object' }],
  ])('rejects settings when the entry has %s', async (_label, settingsSchema) => {
    const { service } = createRuntimeResolveService({
      settingsSchema,
      settingsSchemaHash: settingsSchema ? 'schema_hash_empty' : null,
      settingsDefaultsHash: settingsSchema ? 'defaults_hash_empty' : null,
    });

    await expect(
      service.resolve(
        {
          sourceMode: 'light-extension',
          sourceBinding: createSourceBinding(),
          settings: { unexpected: true },
        },
        {},
      ),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_SETTINGS_INVALID',
      status: 422,
      details: {
        issues: [expect.objectContaining({ path: '$.unexpected', code: 'settings_unknown_property' })],
      },
    });
  });

  it('rejects unsafe settings keys without mutating the result prototype', async () => {
    const { service } = createRuntimeResolveService({
      settingsSchema: { type: 'object', properties: {} },
      settingsSchemaHash: 'schema_hash_empty',
      settingsDefaultsHash: 'defaults_hash_empty',
    });
    const settings = JSON.parse('{"__proto__":{"inheritedSetting":"attacker"}}') as Record<string, unknown>;

    await expect(
      service.resolve(
        {
          sourceMode: 'light-extension',
          sourceBinding: createSourceBinding(),
          settings,
        },
        {},
      ),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_SETTINGS_INVALID',
      status: 422,
      details: {
        issues: [expect.objectContaining({ path: '$.__proto__', code: 'settings_unknown_property' })],
      },
    });
    expect(({} as { inheritedSetting?: unknown }).inheritedSetting).toBeUndefined();
  });

  it('rejects legacy failed entries instead of running their last successful artifact', async () => {
    const { service } = createRuntimeResolveService({
      entryHealthStatus: 'failed',
      entryPath: 'src/client/js-blocks/sales-kpi-next/index.tsx',
      artifactEntryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
    });

    await expect(
      service.resolve(
        {
          sourceMode: 'light-extension',
          sourceBinding: createSourceBinding(),
          settings: {},
        },
        {},
      ),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_RUNTIME_UNAVAILABLE',
      details: {
        reasonCode: 'runtime_missing',
      },
    });
  });

  it('filters selectable entries whose runtime was compiled from a non-head commit', async () => {
    const { service } = createRuntimeResolveService({
      repoHeadCommitId: 'vsc_commit_2',
    });

    await expect(service.listSelectableEntries()).resolves.toEqual([]);
  });

  it('returns the schema hash independently from the defaults hash', async () => {
    const { service } = createRuntimeResolveService();

    await expect(service.listSelectableEntries()).resolves.toEqual([
      expect.objectContaining({
        settingsSchemaHash: 'schema_hash_1',
        settingsDefaultsHash: 'defaults_hash_1',
      }),
    ]);
  });

  it('keeps no-schema entries selectable when both settings hashes are null', async () => {
    const { service } = createRuntimeResolveService({
      settingsSchema: null,
      settingsSchemaHash: null,
      settingsDefaultsHash: null,
    });

    await expect(service.listSelectableEntries()).resolves.toEqual([
      expect.objectContaining({
        settingsSchema: null,
        settingsSchemaHash: null,
        settingsDefaultsHash: null,
        runtimeAvailable: true,
      }),
    ]);
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
        {},
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
      artifactHash: 'a'.repeat(64),
      artifactUrl: `/api/light-extension-runtime/artifacts/${'a'.repeat(64)}`,
      runtimeCodeHash: 'runtime_hash_1',
      version: 'v2',
      settings: {},
      settingsHash: 'settings_hash',
    });
    const resource = createLightExtensionRuntimeResource({
      resolve,
    } as unknown as RuntimeResolveService);
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
      }),
    );
    expect((ctx as { body?: unknown }).body).toMatchObject({
      entryId: 'lee_sales_kpi',
      artifactHash: 'a'.repeat(64),
    });
  });

  it('registers documented route aliases and ignores malformed compile-preview repo ids', async () => {
    const registeredRoutes: Array<{ middleware: RouteMiddleware; options?: { tag?: string } }> = [];
    const app = {
      db: {} as Database,
      acl: {
        allow: vi.fn(),
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

    const artifactRoute = registeredRoutes.find((route) => route.options?.tag === 'light-extension-runtime-artifact');
    const artifactHash = 'a'.repeat(64);
    const artifactCtx = {
      method: 'GET',
      path: `/api/light-extension-runtime/artifacts/${artifactHash}`,
      request: {
        path: `/api/light-extension-runtime/artifacts/${artifactHash}`,
      },
    };
    let artifactRoutedPath = '';

    await artifactRoute?.middleware(artifactCtx, async () => {
      artifactRoutedPath = artifactCtx.path;
    });

    expect(artifactRoutedPath).toBe(`/api/lightExtensionRuntime:getArtifact/${artifactHash}`);
    expect(artifactCtx.path).toBe(`/api/light-extension-runtime/artifacts/${artifactHash}`);

    const compileRoute = registeredRoutes.find((route) => route.options?.tag === 'light-extension-compile-preview');
    const compileCtx = {
      method: 'POST',
      path: '/api/light-extensions/repo%201/compile-preview',
      request: {
        path: '/api/light-extensions/repo%201/compile-preview',
      },
    };
    let compileRoutedPath = '';

    await compileRoute?.middleware(compileCtx, async () => {
      compileRoutedPath = compileCtx.path;
    });

    expect(compileRoutedPath).toBe('/api/lightExtensions:compilePreview/repo%201');
    expect(compileCtx.path).toBe('/api/light-extensions/repo%201/compile-preview');
    expect(compileCtx.request.path).toBe('/api/light-extensions/repo%201/compile-preview');

    const malformedCtx = {
      method: 'POST',
      path: '/api/light-extensions/%E0%A4%A/compile-preview',
      request: {
        path: '/api/light-extensions/%E0%A4%A/compile-preview',
      },
    };
    let malformedNextPath = '';

    await expect(
      compileRoute?.middleware(malformedCtx, async () => {
        malformedNextPath = malformedCtx.path;
      }),
    ).resolves.toBeUndefined();

    expect(malformedNextPath).toBe('/api/light-extensions/%E0%A4%A/compile-preview');
    expect(malformedCtx.request.path).toBe('/api/light-extensions/%E0%A4%A/compile-preview');
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
        {},
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

  it('blocks runtime code for unavailable repos, unhealthy entries, unsupported kinds, and missing artifacts', async () => {
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
        name: 'unsupported persisted kind',
        entryKind: 'legacy-kind',
        sourceKind: 'legacy-kind',
        reasonCode: 'kind_unsupported',
      },
      {
        name: 'missing runtime',
        runtimeArtifact: null,
        compiledCommitId: null,
        reasonCode: 'runtime_missing',
      },
      {
        name: 'runtime compiled from a non-head commit',
        repoHeadCommitId: 'vsc_commit_2',
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
          {},
        ),
      ).rejects.toMatchObject({
        code: 'LIGHT_EXTENSION_RUNTIME_UNAVAILABLE',
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
        {},
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
    repoHeadCommitId?: string | null;
    entryPath?: string;
    artifactEntryPath?: string;
    settingsSchema?: Record<string, unknown> | null;
    settingsSchemaHash?: string | null;
    settingsDefaultsHash?: string | null;
  } = {},
) {
  const entryRecord = createEntryRecord(options);
  const reposRepository = {
    findOne: vi.fn().mockResolvedValue(
      createModel({
        id: 'ler_sales',
        lifecycleStatus: options.repoLifecycleStatus || 'enabled',
        headCommitId: typeof options.repoHeadCommitId === 'undefined' ? 'vsc_commit_1' : options.repoHeadCommitId,
      }),
    ),
  };
  const entriesRepository = {
    find: vi.fn().mockResolvedValue([createModel(entryRecord)]),
    findOne: vi.fn().mockResolvedValue(createModel(entryRecord)),
  };
  const db = {
    getRepository: (name: string) => {
      if (name === 'lightExtensionRepos') {
        return reposRepository;
      }
      if (name === 'lightExtensionEntries') {
        return entriesRepository;
      }
      throw new Error(`Unexpected repository ${name}`);
    },
  } as unknown as Database;
  return {
    service: new RuntimeResolveService(db),
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
    entryPath?: string;
    artifactEntryPath?: string;
    settingsSchema?: Record<string, unknown> | null;
    settingsSchemaHash?: string | null;
    settingsDefaultsHash?: string | null;
  } = {},
): Record<string, unknown> {
  const kind = input.entryKind || 'js-block';
  const entryPath = input.entryPath || 'src/client/js-blocks/sales-kpi/index.tsx';
  const artifactEntryPath = input.artifactEntryPath || entryPath;
  const runtimeArtifact =
    typeof input.runtimeArtifact === 'undefined'
      ? {
          code: "const secret = 'runtime secret';\nctx.render(secret);\n",
          sourceMap: '{"version":3}',
          version: 'v2',
          entryPath: artifactEntryPath,
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
    descriptorPath: 'src/client/js-blocks/sales-kpi/entry.json',
    title: 'Sales KPI',
    description: null,
    category: null,
    icon: null,
    tags: null,
    sort: null,
    settingsSchema:
      typeof input.settingsSchema === 'undefined'
        ? {
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
          }
        : input.settingsSchema,
    settingsSchemaHash: typeof input.settingsSchemaHash === 'undefined' ? 'schema_hash_1' : input.settingsSchemaHash,
    compiledCommitId: typeof input.compiledCommitId === 'undefined' ? 'vsc_commit_1' : input.compiledCommitId,
    runtimeArtifact,
    runtimeVersion: runtimeArtifact ? 'v2' : null,
    surfaceStyle: runtimeArtifact ? 'render' : null,
    runtimeCodeHash: runtimeArtifact ? 'runtime_hash_1' : null,
    artifactHash: runtimeArtifact ? 'a'.repeat(64) : null,
    filesHash: runtimeArtifact ? 'files_hash_1' : null,
    settingsDefaultsHash: runtimeArtifact
      ? typeof input.settingsDefaultsHash === 'undefined'
        ? 'defaults_hash_1'
        : input.settingsDefaultsHash
      : null,
    compiledAt: runtimeArtifact ? '2026-07-06T00:00:00.000Z' : null,
    healthStatus: input.entryHealthStatus || 'ready',
    diagnostics: [],
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
