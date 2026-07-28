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

const artifactHash = 'a'.repeat(64);

describe('light extension runtime artifact API', () => {
  it('reads immutable artifacts by hash and rejects missing hashes with 404', async () => {
    const artifactRepository = {
      findOne: vi.fn().mockResolvedValueOnce(createModel(createArtifact())).mockResolvedValueOnce(null),
    };
    const service = createService(artifactRepository);

    await expect(service.getArtifact(artifactHash)).resolves.toMatchObject({
      artifactHash,
      code: expect.stringContaining('ACTION_V1'),
    });
    await expect(service.getArtifact('b'.repeat(64))).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_ARTIFACT_NOT_FOUND',
      status: 404,
    });
  });

  it('sets immutable cache headers and a strong ETag', async () => {
    const service = {
      getArtifact: vi.fn().mockResolvedValue(createArtifact()),
    } as unknown as RuntimeResolveService;
    const resource = createLightExtensionRuntimeResource(service);
    const headers: Record<string, string> = {};
    const ctx = {
      action: { params: { values: { artifactHash } } },
      status: 200,
      set(nameOrHeaders: string | Record<string, string>, value?: string) {
        if (typeof nameOrHeaders === 'string') {
          headers[nameOrHeaders] = value || '';
        } else {
          Object.assign(headers, nameOrHeaders);
        }
      },
    } as unknown as Context;

    await resource.actions?.getArtifact?.(ctx, async () => undefined);

    expect((ctx as Context & { body?: unknown }).body).toMatchObject({ artifactHash });
    expect(headers).toEqual({
      ETag: `"${artifactHash}"`,
      'Cache-Control': 'private, max-age=31536000, immutable',
    });
    expect((ctx as Context & { withoutDataWrapping?: boolean }).withoutDataWrapping).toBe(true);
  });
});

function createService(artifactRepository: { findOne: ReturnType<typeof vi.fn> }): RuntimeResolveService {
  const db = {
    getRepository(name: string) {
      if (name === 'lightExtensionRuntimeArtifacts') {
        return artifactRepository;
      }
      throw new Error(`Unexpected repository ${name}`);
    },
  } as unknown as Database;
  return new RuntimeResolveService(db);
}

function createArtifact(): Record<string, unknown> {
  return {
    artifactHash,
    runtimeCodeHash: 'runtime_hash_v1',
    code: "ctx.message.success('ACTION_V1');",
    sourceMap: '{"version":3}',
    version: 'v2',
    entryPath: 'src/client/js-actions/example/index.ts',
    runtimeContract: 'light-extension.runtime-artifact.v1',
    byteSize: 64,
  };
}

function createModel(values: Record<string, unknown>): Model {
  return { get: (key: string) => values[key] } as unknown as Model;
}
type RouteContext = {
  path: string;
  method: string;
  request: { path: string };
  state?: { lightExtensionCapabilitiesAlias?: boolean };
};

type RouteMiddleware = (ctx: RouteContext, next: () => Promise<void>) => Promise<void>;

describe('plugin-light-extension runtime resolve API', () => {
  it('normalizes resource input and passes request context to the service', async () => {
    const resolve = vi.fn().mockResolvedValue({ entryId: 'entry_1', artifactHash: 'a'.repeat(64) });
    const resource = createLightExtensionRuntimeResource({ resolve } as unknown as RuntimeResolveService);
    const sourceBinding = createSourceBinding();
    const ctx = {
      action: {
        params: {
          values: {
            sourceMode: 'light-extension',
            sourceBinding,
            settings: { region: 'APAC' },
          },
        },
      },
      auth: { user: { id: 9 } },
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
        settings: { region: 'APAC' },
      },
      expect.objectContaining({
        actorUserId: '9',
        requestId: 'req_resource_runtime',
        requestSource: 'unit-resource',
      }),
    );
    expect((ctx as { body?: unknown }).body).toMatchObject({ entryId: 'entry_1', artifactHash: 'a'.repeat(64) });
  });

  it.each(['/api', '/foo/api'])('registers documented route aliases under %s', async (prefix) => {
    const routes = await loadRoutes(prefix);
    const capabilitiesPath = `${prefix}/light-extensions/capabilities`;
    const capabilitiesCtx = createRouteContext('GET', capabilitiesPath);
    let routedCapabilitiesPath = '';

    await routes.get('light-extension-capabilities')?.(capabilitiesCtx, async () => {
      routedCapabilitiesPath = capabilitiesCtx.path;
      expect(capabilitiesCtx.state?.lightExtensionCapabilitiesAlias).toBe(true);
    });

    expect(routedCapabilitiesPath).toBe(`${prefix}/lightExtensionCapabilities:get`);
    expect(capabilitiesCtx.path).toBe(capabilitiesPath);
    expect(capabilitiesCtx.request.path).toBe(capabilitiesPath);

    const compilePath = `${prefix}/light-extensions/repo%201/compile-preview`;
    const compileCtx = createRouteContext('POST', compilePath);
    let routedCompilePath = '';

    await routes.get('light-extension-compile-preview')?.(compileCtx, async () => {
      routedCompilePath = compileCtx.path;
    });

    expect(routedCompilePath).toBe(`${prefix}/lightExtensions:compilePreview/repo%201`);
    expect(compileCtx.path).toBe(compilePath);
    expect(compileCtx.request.path).toBe(compilePath);

    const runtimePath = `${prefix}/light-extension-runtime/resolve`;
    const runtimeCtx = createRouteContext('POST', runtimePath);
    let routedRuntimePath = '';

    await routes.get('light-extension-runtime-resolve')?.(runtimeCtx, async () => {
      routedRuntimePath = runtimeCtx.path;
    });

    expect(routedRuntimePath).toBe(`${prefix}/lightExtensionRuntime:resolve`);
    expect(runtimeCtx.path).toBe(runtimePath);
    expect(runtimeCtx.request.path).toBe(runtimePath);

    const artifactHash = 'a'.repeat(64);
    const artifactPath = `${prefix}/light-extension-runtime/artifacts/${artifactHash}`;
    const artifactCtx = createRouteContext('GET', artifactPath);
    let routedArtifactPath = '';

    await routes.get('light-extension-runtime-artifact')?.(artifactCtx, async () => {
      routedArtifactPath = artifactCtx.path;
    });

    expect(routedArtifactPath).toBe(`${prefix}/lightExtensionRuntime:getArtifact/${artifactHash}`);
    expect(artifactCtx.path).toBe(artifactPath);
    expect(artifactCtx.request.path).toBe(artifactPath);
  });

  it('ignores malformed encoded alias parameters', async () => {
    const routes = await loadRoutes('/api');
    const route = routes.get('light-extension-compile-preview');
    const malformedPath = '/api/light-extensions/%E0%A4%A/compile-preview';
    const malformedCtx = createRouteContext('POST', malformedPath);
    let nextPath = '';

    await route?.(malformedCtx, async () => {
      nextPath = malformedCtx.path;
    });

    expect(nextPath).toBe(malformedPath);
    expect(malformedCtx.request.path).toBe(malformedPath);
  });

  it('restores every alias path when downstream middleware throws', async () => {
    const routes = await loadRoutes('/api');
    const cases = [
      ['light-extension-capabilities', 'GET', '/api/light-extensions/capabilities'],
      ['light-extension-compile-preview', 'POST', '/api/light-extensions/repo%201/compile-preview'],
      ['light-extension-runtime-resolve', 'POST', '/api/light-extension-runtime/resolve'],
      ['light-extension-runtime-artifact', 'GET', `/api/light-extension-runtime/artifacts/${artifactHash}`],
    ] as const;

    for (const [tag, method, path] of cases) {
      const ctx = createRouteContext(method, path);
      const route = routes.get(tag);
      expect(route).toBeDefined();
      if (!route) {
        throw new Error(`Missing alias route ${tag}`);
      }
      await expect(
        route(ctx, async () => {
          throw new Error('downstream failed');
        }),
      ).rejects.toThrow('downstream failed');
      expect(ctx.path).toBe(path);
      expect(ctx.request.path).toBe(path);
    }
  });

  it('matches each alias method and path exactly', async () => {
    const routes = await loadRoutes('/api');
    const cases = [
      ['light-extension-capabilities', 'POST', '/api/light-extensions/capabilities'],
      ['light-extension-compile-preview', 'GET', '/api/light-extensions/repo-1/compile-preview'],
      ['light-extension-runtime-resolve', 'GET', '/api/light-extension-runtime/resolve'],
      ['light-extension-runtime-artifact', 'POST', `/api/light-extension-runtime/artifacts/${artifactHash}`],
      ['light-extension-capabilities', 'GET', '/api/light-extensions/capabilities/'],
      ['light-extension-compile-preview', 'POST', '/api/light-extensions/repo-1/compile-preview/'],
      ['light-extension-runtime-resolve', 'POST', '/api/light-extension-runtime/resolve/'],
      ['light-extension-runtime-artifact', 'GET', '/api/light-extension-runtime/artifacts/'],
    ] as const;

    for (const [tag, method, path] of cases) {
      const ctx = createRouteContext(method, path);
      const route = routes.get(tag);
      if (!route) {
        throw new Error(`Missing alias route ${tag}`);
      }
      let downstreamPath = '';
      await route(ctx, async () => {
        downstreamPath = ctx.path;
      });
      expect(downstreamPath).toBe(path);
      expect(ctx.path).toBe(path);
      expect(ctx.request.path).toBe(path);
      expect(ctx.state?.lightExtensionCapabilitiesAlias).toBeUndefined();
    }
  });
});

async function loadRoutes(prefix: string): Promise<Map<string, RouteMiddleware>> {
  const routes = new Map<string, RouteMiddleware>();
  const app = {
    db: {} as Database,
    environment: { getVariables: vi.fn(() => ({})) },
    acl: { allow: vi.fn(), registerSnippet: vi.fn() },
    auditManager: { registerActions: vi.fn(), log: vi.fn() },
    pm: {
      get: vi.fn(() => null),
      getPlugins: vi.fn(() => new Map()),
    },
    resourceManager: {
      define: vi.fn(),
      options: { prefix },
    },
    on: vi.fn(),
    off: vi.fn(),
    use: vi.fn((middleware: RouteMiddleware, options?: { tag?: string }) => {
      if (options?.tag) {
        routes.set(options.tag, middleware);
      }
    }),
  } as unknown as Application;
  const plugin = new PluginLightExtensionServer(app, {
    name: 'light-extension',
    packageName: NAMESPACE,
  });

  await plugin.load();
  return routes;
}

function createRouteContext(method: string, path: string): RouteContext {
  return { method, path, request: { path } };
}

function createSourceBinding(): LightExtensionRuntimeSourceBinding {
  return {
    type: 'light-extension-entry',
    repoId: 'repo_1',
    entryId: 'entry_1',
    kind: 'js-block',
  };
}
