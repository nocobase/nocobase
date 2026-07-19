/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { Database } from '@nocobase/database';
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
    request?: { path: string };
  },
  next: () => Promise<void>,
) => Promise<void>;

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

  it('registers the compile-preview alias and ignores malformed encoded repo IDs', async () => {
    const routes = await loadRoutes('/api');
    const route = routes.get('light-extension-compile-preview');
    const compilePath = '/api/light-extensions/repo%201/compile-preview';
    const compileCtx = createRouteContext('POST', compilePath);
    let routedPath = '';

    await route?.(compileCtx, async () => {
      routedPath = compileCtx.path;
    });

    expect(routedPath).toBe('/api/lightExtensions:compilePreview/repo%201');
    expect(compileCtx.path).toBe(compilePath);
    expect(compileCtx.request.path).toBe(compilePath);

    const malformedPath = '/api/light-extensions/%E0%A4%A/compile-preview';
    const malformedCtx = createRouteContext('POST', malformedPath);
    let nextPath = '';

    await route?.(malformedCtx, async () => {
      nextPath = malformedCtx.path;
    });

    expect(nextPath).toBe(malformedPath);
    expect(malformedCtx.request.path).toBe(malformedPath);
  });
});

async function loadRoutes(prefix: string): Promise<Map<string, RouteMiddleware>> {
  const routes = new Map<string, RouteMiddleware>();
  const app = {
    db: {} as Database,
    acl: { allow: vi.fn(), registerSnippet: vi.fn() },
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

function createRouteContext(method: string, path: string) {
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
