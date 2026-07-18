/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ServerResponse } from 'http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clientAppGatewayRequestHandler } from '../../../../plugins/@nocobase/plugin-client/src/server/clientAppGateway';
import { AppSupervisor } from '../app-supervisor';
import Application from '../application';
import { Gateway, type GatewayRequestHandler, type IncomingRequest } from '../gateway';

const ENV_KEYS = [
  'API_BASE_PATH',
  'APP_MODERN_CLIENT_PREFIX',
  'APP_PUBLIC_PATH',
  'PLUGIN_STATICS_PATH',
  'WS_PATH',
] as const;

type TestEnvironment = Partial<Record<(typeof ENV_KEYS)[number], string>>;

function clientAppPortal(uid: string, routePath: string, entryId = `${uid}-entry`) {
  return {
    uid,
    routePath,
    frontend: { type: 'client-app' as const, entryId },
  };
}

function layoutPortal(uid: string, routePath: string) {
  return {
    uid,
    routePath,
    frontend: { type: 'layout' as const, layoutUid: `${uid}-layout` },
  };
}

function createResponse() {
  const end = vi.fn();
  const setHeader = vi.fn();
  const response = {
    statusCode: 200,
    end,
    setHeader,
  } as unknown as ServerResponse;
  return { end, response, setHeader };
}

function createRequest(url: string, options: { headers?: Record<string, string>; method?: string } = {}) {
  return {
    headers: options.headers || {},
    method: options.method || 'GET',
    url,
  } satisfies IncomingRequest;
}

async function runHandler(req: IncomingRequest) {
  const { response, ...responseSpies } = createResponse();
  const result = await clientAppGatewayRequestHandler(req, response, {} as Application);
  return { ...responseSpies, response, result };
}

describe('client-app gateway routing', () => {
  let originalEnvironment: TestEnvironment;
  let getAppManifestItems: ReturnType<typeof vi.fn>;
  let getRequestHandleAppName: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    originalEnvironment = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
    process.env.API_BASE_PATH = '/api';
    process.env.APP_MODERN_CLIENT_PREFIX = 'v';
    process.env.APP_PUBLIC_PATH = '/';
    process.env.PLUGIN_STATICS_PATH = '/static/plugins/';
    process.env.WS_PATH = '/ws';

    getAppManifestItems = vi.fn(async () => []);
    getRequestHandleAppName = vi.fn(async () => 'main');
    vi.spyOn(AppSupervisor, 'getInstance').mockReturnValue({ getAppManifestItems } as unknown as AppSupervisor);
    vi.spyOn(Gateway, 'getInstance').mockReturnValue({ getRequestHandleAppName } as unknown as Gateway);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    for (const key of ENV_KEYS) {
      const value = originalEnvironment[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it('registers async handlers through the existing Gateway hook', () => {
    const handler: GatewayRequestHandler = async () => false;

    Gateway.registerRequestHandler(handler);
    Gateway.unregisterRequestHandler(handler);
  });

  it.each([
    ['/v/customer/', 'clientAppPath='],
    ['/v/customer/orders/1', 'clientAppPath=orders%2F1'],
    ['/v/customer/assets/app.js?x=1&clientAppPath=attacker', 'x=1&clientAppPath=assets%2Fapp.js'],
  ])('rewrites main-app client routes and preserves the original query for %s', async (url, expectedQuery) => {
    getAppManifestItems.mockResolvedValue([clientAppPortal('customer-portal', '/customer')]);
    const req = createRequest(url);

    const { result } = await runHandler(req);

    expect(result).toBe(false);
    expect(req.url).toBe(`/api/multiPortals:serveClientApp/customer-portal?${expectedQuery}`);
    expect(req.headers['x-nocobase-client-app-workspace-root']).toBe('/v/customer');
    expect(req.headers['x-nocobase-client-app-api-base-url']).toBe('/api');
    expect(req.headers['x-nocobase-client-app-signin-path']).toBe('/v/signin');
    expect(getAppManifestItems).toHaveBeenCalledWith('main', 'multi-portal');
  });

  it('uses the longest segment-bounded client-app portal match', async () => {
    getAppManifestItems.mockResolvedValue([
      clientAppPortal('customer-portal', '/customer'),
      clientAppPortal('customer-admin-portal', '/v/customer/admin'),
    ]);

    const longestMatch = createRequest('/v/customer/admin/users');
    await runHandler(longestMatch);
    expect(longestMatch.url).toBe('/api/multiPortals:serveClientApp/customer-admin-portal?clientAppPath=users');

    const boundaryMiss = createRequest('/v/customer-admin/');
    await runHandler(boundaryMiss);
    expect(boundaryMiss.url).toBe('/v/customer-admin/');
  });

  it('bypasses layout portals, including the legacy layout field', async () => {
    getAppManifestItems.mockResolvedValue([
      layoutPortal('layout-portal', '/layout'),
      { uid: 'legacy-layout-portal', routePath: '/legacy-layout', layout: 'desktop' },
    ]);

    const layoutRequest = createRequest('/v/layout/');
    const legacyLayoutRequest = createRequest('/v/legacy-layout/');
    await runHandler(layoutRequest);
    await runHandler(legacyLayoutRequest);

    expect(layoutRequest.url).toBe('/v/layout/');
    expect(legacyLayoutRequest.url).toBe('/v/legacy-layout/');
  });

  it('selects main and path-derived sub-app manifests under a non-root public path', async () => {
    process.env.APP_PUBLIC_PATH = '/nocobase';
    getAppManifestItems.mockImplementation(async (appName: string) => {
      return appName === 'demo'
        ? [clientAppPortal('demo-customer-portal', '/customer')]
        : [clientAppPortal('main-customer-portal', '/customer'), clientAppPortal('assets-portal', '/assets')];
    });

    const mainRequest = createRequest('/nocobase/v/customer/orders/1');
    await runHandler(mainRequest);
    expect(mainRequest.url).toBe('/api/multiPortals:serveClientApp/main-customer-portal?clientAppPath=orders%2F1');

    const subAppRequest = createRequest('/nocobase/v/apps/demo/customer/orders/1?x=1');
    await runHandler(subAppRequest);
    expect(subAppRequest.url).toBe(
      '/api/multiPortals:serveClientApp/demo-customer-portal?x=1&clientAppPath=orders%2F1',
    );
    expect(subAppRequest.headers['x-app']).toBe('demo');
    expect(subAppRequest.headers['x-nocobase-client-app-request-url']).toBe(
      '/nocobase/v/apps/demo/customer/orders/1?x=1',
    );
    expect(subAppRequest.headers['x-nocobase-client-app-workspace-root']).toBe('/nocobase/v/apps/demo/customer');
    expect(subAppRequest.headers['x-nocobase-client-app-public-path']).toBe('/nocobase');
    expect(subAppRequest.headers['x-nocobase-client-app-api-base-url']).toBe('/api/__app/demo');
    expect(subAppRequest.headers['x-nocobase-client-app-signin-path']).toBe('/nocobase/v/apps/demo/signin');
    expect(getAppManifestItems).toHaveBeenLastCalledWith('demo', 'multi-portal');
    expect(getRequestHandleAppName).toHaveBeenCalledTimes(1);

    const assetRequest = createRequest('/nocobase/v/assets/app.js');
    await runHandler(assetRequest);
    expect(assetRequest.url).toBe('/nocobase/v/assets/app.js');
  });

  it('uses the existing app selector when the app is not encoded in the path', async () => {
    getRequestHandleAppName.mockResolvedValue('alpha');
    getAppManifestItems.mockResolvedValue([clientAppPortal('alpha-portal', '/customer')]);
    const req = createRequest('/v/customer/');

    await runHandler(req);

    expect(getAppManifestItems).toHaveBeenCalledWith('alpha', 'multi-portal');
    expect(req.url).toBe('/api/multiPortals:serveClientApp/alpha-portal?clientAppPath=');
  });

  it('honors a configurable modern client prefix', async () => {
    process.env.APP_MODERN_CLIENT_PREFIX = '/console/';
    getAppManifestItems.mockResolvedValue([clientAppPortal('customer-portal', '/console/customer')]);
    const req = createRequest('/console/customer/orders/1');

    await runHandler(req);

    expect(req.url).toBe('/api/multiPortals:serveClientApp/customer-portal?clientAppPath=orders%2F1');
  });

  it('does not negatively cache a cold manifest', async () => {
    getAppManifestItems
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([clientAppPortal('customer-portal', '/customer')]);

    const coldRequest = createRequest('/v/customer/');
    await runHandler(coldRequest);
    expect(coldRequest.url).toBe('/v/customer/');

    const recoveredRequest = createRequest('/v/customer/');
    await runHandler(recoveredRequest);
    expect(recoveredRequest.url).toBe('/api/multiPortals:serveClientApp/customer-portal?clientAppPath=');
    expect(getAppManifestItems).toHaveBeenCalledTimes(2);
  });

  it.each(['/v/customer/%2e%2e/secret', '/v/customer/%5csecret', '/v/customer/%00secret', '/v/customer/%E0%A4%A'])(
    'rejects unsafe decoded client-app paths: %s',
    async (url) => {
      getAppManifestItems.mockResolvedValue([clientAppPortal('customer-portal', '/customer')]);
      const req = createRequest(url);

      const { end, response, result, setHeader } = await runHandler(req);

      expect(result).toBe(true);
      expect(response.statusCode).toBe(400);
      expect(setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain; charset=utf-8');
      expect(end).toHaveBeenCalledWith('Bad Request');
      expect(req.url).toBe(url);
    },
  );

  it.each([
    ['/api/app:getInfo', 'GET'],
    ['/ws', 'GET'],
    ['/static/plugins/@nocobase/plugin-client/client.js', 'GET'],
    ['/v/assets/index.js', 'GET'],
    ['/v/static/index.js', 'GET'],
    ['/v/customer/__health_check', 'GET'],
    ['/v/customer/', 'POST'],
    ['/v/unmatched/', 'GET'],
  ])('bypasses infrastructure, non-read, and unmatched requests: %s', async (url, method) => {
    getAppManifestItems.mockResolvedValue([
      clientAppPortal('customer-portal', '/customer'),
      clientAppPortal('assets-portal', '/assets'),
      clientAppPortal('static-portal', '/static'),
    ]);
    const req = createRequest(url, { method });

    const { result } = await runHandler(req);

    expect(result).toBe(false);
    expect(req.url).toBe(url);
  });
});
