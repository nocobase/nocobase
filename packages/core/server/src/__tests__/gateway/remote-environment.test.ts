/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { IncomingMessage, ServerResponse } from 'http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppSupervisor } from '../../app-supervisor';
import { Gateway } from '../../gateway';

describe('unavailable remote environment', () => {
  afterEach(async () => {
    await Gateway.getInstance().destroy();
    await AppSupervisor.getInstance().destroy();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it.each([true, false])('does not bootstrap locally when the model exists: %s', async (exists) => {
    vi.stubEnv('APP_MODE', 'supervisor');
    const supervisor = AppSupervisor.getInstance();
    Object.assign(supervisor.getDiscoveryAdapter(), {
      proxyWeb: vi.fn().mockResolvedValue(false),
      getAppModel: vi.fn(),
    });
    vi.spyOn(supervisor, 'getAppModel').mockResolvedValue(exists ? { name: 'demo' } : null);
    const bootstrap = vi.spyOn(supervisor, 'bootstrapApp');
    const req = { url: '/api/__app/demo/test', headers: {} } as IncomingMessage;
    const end = vi.fn();
    const res = { setHeader: vi.fn(), end } as unknown as ServerResponse;
    await Gateway.getInstance().requestHandler(req, res);
    expect(bootstrap).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(exists ? 503 : 404);
    expect(JSON.parse(end.mock.calls[0][0]).error).toMatchObject({
      code: exists ? 'APP_ENVIRONMENT_UNAVAILABLE' : 'APP_NOT_FOUND',
      ...(exists ? { message: 'deployment environment for application demo is unavailable' } : {}),
    });
  });

  it('returns 503 without querying models when the adapter cannot look them up', async () => {
    vi.stubEnv('APP_MODE', 'supervisor');
    const supervisor = AppSupervisor.getInstance();
    Object.assign(supervisor.getDiscoveryAdapter(), {
      proxyWeb: vi.fn().mockResolvedValue(false),
      getAppModel: undefined,
    });
    const getAppModel = vi.spyOn(supervisor, 'getAppModel');
    const bootstrap = vi.spyOn(supervisor, 'bootstrapApp');
    const req = { url: '/api/__app/demo/test', headers: {} } as IncomingMessage;
    const end = vi.fn();
    const res = { setHeader: vi.fn(), end } as unknown as ServerResponse;
    await Gateway.getInstance().requestHandler(req, res);
    expect(getAppModel).not.toHaveBeenCalled();
    expect(bootstrap).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(503);
    expect(JSON.parse(end.mock.calls[0][0]).error.code).toBe('APP_ENVIRONMENT_UNAVAILABLE');
  });

  it('does not query models or write a fallback response after successful proxying', async () => {
    vi.stubEnv('APP_MODE', 'supervisor');
    const supervisor = AppSupervisor.getInstance();
    Object.assign(supervisor.getDiscoveryAdapter(), { proxyWeb: vi.fn().mockResolvedValue(true) });
    const getAppModel = vi.spyOn(supervisor, 'getAppModel');
    const req = { url: '/api/__app/demo/test', headers: {} } as IncomingMessage;
    const end = vi.fn();
    const res = { setHeader: vi.fn(), end } as unknown as ServerResponse;
    await Gateway.getInstance().requestHandler(req, res);
    expect(getAppModel).not.toHaveBeenCalled();
    expect(end).not.toHaveBeenCalled();
  });
});
