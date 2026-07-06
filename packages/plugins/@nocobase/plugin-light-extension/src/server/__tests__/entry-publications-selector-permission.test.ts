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
import PluginLightExtensionServer from '../plugin';
import { createLightExtensionEntriesResource } from '../resources/lightExtensionEntries';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import type { LightExtensionEntryScanner } from '../services/LightExtensionEntryScanner';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import { LightExtensionPublicationResolveService } from '../services/LightExtensionPublicationResolveService';

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

describe('plugin-light-extension entry publication selector', () => {
  it('lists only enabled ready entries with active publication snapshots and no current entry schema', async () => {
    const { service } = createSelectorService();
    const can = vi.fn(({ action }: { action: string }) => (action === 'usePublication' ? {} : null));

    const entries = await service.listSelectableEntries({}, { can });

    expect(can).toHaveBeenCalledWith({
      resource: 'lightExtension',
      action: 'usePublication',
    });
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      id: 'lee_ready',
      activePublicationId: 'lep_ready_active',
      activePublication: {
        id: 'lep_ready_active',
        settingsSchemaSnapshot: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              default: 'Publication title',
            },
          },
        },
        settingsDefaultsHash: 'defaults_hash_lep_ready_active',
      },
    });
    expect(JSON.stringify(entries)).not.toContain('Current entry settings schema');
    expect(JSON.stringify(entries)).not.toContain('runtime secret');
    expect(JSON.stringify(entries)).not.toContain('sourceMap');
  });

  it('returns selectable publication metadata for an entry through usePublication only', async () => {
    const { service } = createSelectorService();
    const result = await service.listSelectablePublicationsByEntry('lee_ready', {
      can: ({ action }: { action: string }) => (action === 'usePublication' ? {} : null),
    });

    expect(result).toMatchObject({
      entryId: 'lee_ready',
      activePublicationId: 'lep_ready_active',
      publications: [
        expect.objectContaining({
          id: 'lep_ready_active',
          settingsSchemaSnapshot: expect.objectContaining({
            type: 'object',
          }),
          settingsDefaultsHash: 'defaults_hash_lep_ready_active',
        }),
        expect.objectContaining({
          id: 'lep_ready_old',
          settingsDefaultsHash: 'defaults_hash_lep_ready_old',
        }),
      ],
    });
    expect(JSON.stringify(result)).not.toContain('runtime secret');
    expect(JSON.stringify(result)).not.toContain('sourceMap');
  });

  it('does not allow readPublication-only callers to use selector APIs', async () => {
    const { service, entriesRepository, auditService } = createSelectorService();
    const recordUseDenied = vi.spyOn(auditService, 'recordPublicationUseDenied').mockResolvedValue(undefined);
    const readOnlyCan = vi.fn(({ action }: { action: string }) => (action === 'readPublication' ? {} : null));

    await expect(
      service.listSelectablePublicationsByEntry('lee_ready', {
        requestId: 'req_selector_denied',
        actorUserId: '8',
        requestSource: 'unit-selector',
        can: readOnlyCan,
      }),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_PERMISSION_DENIED',
      status: 403,
    });

    expect(entriesRepository.findOne).not.toHaveBeenCalled();
    expect(recordUseDenied).toHaveBeenCalledWith(
      expect.objectContaining({
        publicationId: 'entry:lee_ready',
        requestId: 'req_selector_denied',
        actorUserId: '8',
        reasonCode: 'LIGHT_EXTENSION_PERMISSION_DENIED',
        requestSource: 'unit-selector',
      }),
    );
  });

  it('normalizes entry publication selector resource input and preserves request context', async () => {
    const publicationResolveService = {
      listSelectablePublicationsByEntry: vi.fn().mockResolvedValue({
        entryId: 'lee_ready',
        activePublicationId: 'lep_ready_active',
        publications: [],
      }),
    } as unknown as LightExtensionPublicationResolveService;
    const resource = createLightExtensionEntriesResource(
      {} as LightExtensionEntryScanner,
      undefined,
      publicationResolveService,
    );
    const can = vi.fn().mockReturnValue({});
    const ctx = {
      action: {
        params: {
          filterByTk: 'lee_ready',
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
          'x-request-id': 'req_selector_resource',
          'x-request-source': 'unit-resource',
        },
      },
    } as unknown as Context;

    await resource.actions?.listPublications?.(ctx, async () => {});

    expect(publicationResolveService.listSelectablePublicationsByEntry).toHaveBeenCalledWith(
      'lee_ready',
      expect.objectContaining({
        actorUserId: '7',
        requestId: 'req_selector_resource',
        requestSource: 'unit-resource',
        can,
      }),
    );
    expect((ctx as { body?: unknown }).body).toMatchObject({
      entryId: 'lee_ready',
      activePublicationId: 'lep_ready_active',
    });
  });

  it('registers the documented GET entry publications selector route alias', async () => {
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

    const selectorRoute = registeredRoutes.find((route) => route.options?.tag === 'light-extension-entry-publications');
    const ctx = {
      method: 'GET',
      path: '/api/light-extension-entries/lee_ready/publications',
      request: {
        path: '/api/light-extension-entries/lee_ready/publications',
      },
    };
    let routedPath = '';

    await selectorRoute?.middleware(ctx, async () => {
      routedPath = ctx.path;
    });

    expect(routedPath).toBe('/api/lightExtensionEntries:listPublications/lee_ready');
    expect(ctx.path).toBe('/api/light-extension-entries/lee_ready/publications');
    expect(ctx.request.path).toBe('/api/light-extension-entries/lee_ready/publications');
  });
});

function createSelectorService() {
  const entriesRepository = {
    find: vi.fn().mockResolvedValue(
      [
        createEntryRecord({
          id: 'lee_ready',
          repoId: 'ler_enabled',
          activePublicationId: 'lep_ready_active',
          healthStatus: 'ready',
        }),
        createEntryRecord({
          id: 'lee_no_active',
          repoId: 'ler_enabled',
          activePublicationId: null,
          healthStatus: 'ready',
        }),
        createEntryRecord({
          id: 'lee_failed',
          repoId: 'ler_enabled',
          activePublicationId: 'lep_failed_active',
          healthStatus: 'failed',
        }),
        createEntryRecord({
          id: 'lee_disabled_repo',
          repoId: 'ler_disabled',
          activePublicationId: 'lep_disabled_repo_active',
          healthStatus: 'ready',
        }),
      ].map(createModel),
    ),
    findOne: vi.fn(({ filterByTk }: { filterByTk?: string }) =>
      Promise.resolve(
        createModel(
          createEntryRecord({
            id: filterByTk || 'lee_ready',
            repoId: 'ler_enabled',
            activePublicationId: 'lep_ready_active',
            healthStatus: 'ready',
          }),
        ),
      ),
    ),
  };
  const repoModels = [
    createModel({
      id: 'ler_enabled',
      lifecycleStatus: 'enabled',
    }),
    createModel({
      id: 'ler_disabled',
      lifecycleStatus: 'disabled',
    }),
  ];
  const reposRepository = {
    findOne: vi.fn(({ filterByTk }: { filterByTk?: string }) =>
      Promise.resolve(repoModels.find((repo) => repo.get('id') === filterByTk) || null),
    ),
  };
  const publicationModels = [
    createModel(createPublicationRecord('lep_ready_active', 'lee_ready')),
    createModel(createPublicationRecord('lep_ready_old', 'lee_ready')),
    createModel(createPublicationRecord('lep_failed_active', 'lee_failed')),
    createModel(createPublicationRecord('lep_disabled_repo_active', 'lee_disabled_repo', 'ler_disabled')),
  ];
  const publicationsRepository = {
    find: vi.fn(({ filter }: { filter?: { entryId?: string } }) =>
      Promise.resolve(publicationModels.filter((publication) => publication.get('entryId') === filter?.entryId)),
    ),
    findOne: vi.fn(({ filterByTk }: { filterByTk?: string }) =>
      Promise.resolve(publicationModels.find((publication) => publication.get('id') === filterByTk) || null),
    ),
  };
  const logsRepository = {
    create: vi.fn().mockResolvedValue(createModel({})),
  };
  const db = {
    getRepository: (name: string) => {
      if (name === 'lightExtensionEntries') {
        return entriesRepository;
      }
      if (name === 'lightExtensionRepos') {
        return reposRepository;
      }
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

  return {
    service: new LightExtensionPublicationResolveService(db, auditService, permissionService),
    auditService,
    entriesRepository,
  };
}

function createEntryRecord(input: {
  id: string;
  repoId: string;
  activePublicationId: string | null;
  healthStatus: string;
}): Record<string, unknown> {
  return {
    id: input.id,
    repoId: input.repoId,
    target: 'client',
    kind: 'js-block',
    entryName: input.id,
    entryPath: `src/client/js-blocks/${input.id}/index.tsx`,
    metaPath: null,
    settingsPath: `src/client/js-blocks/${input.id}/settings.json`,
    title: input.id,
    description: null,
    category: null,
    icon: null,
    tags: null,
    sort: null,
    settingsSchema: {
      title: 'Current entry settings schema',
    },
    activePublicationId: input.activePublicationId,
    healthStatus: input.healthStatus,
    diagnostics: [],
    validatorVersion: 'test',
    lastScannedCommitId: 'vsc_commit_1',
    lastScannedAt: null,
    createdAt: null,
    updatedAt: null,
  };
}

function createPublicationRecord(id: string, entryId: string, repoId = 'ler_enabled'): Record<string, unknown> {
  return {
    id,
    repoId,
    entryId,
    commitId: `commit_${id}`,
    entryPath: `src/client/js-blocks/${entryId}/index.tsx`,
    target: 'client',
    kind: 'js-block',
    surfaceStyle: 'render',
    runtimeVersion: 'v2',
    artifact: {
      code: "const secret = 'runtime secret';\nctx.render(secret);\n",
      sourceMap: 'sourceMap',
      version: 'v2',
      entryPath: `src/client/js-blocks/${entryId}/index.tsx`,
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
    createdAt: new Date('2026-07-06T00:00:00.000Z'),
  };
}

function createModel(values: Record<string, unknown>): Model {
  return {
    get: (key: string) => values[key],
  } as unknown as Model;
}
