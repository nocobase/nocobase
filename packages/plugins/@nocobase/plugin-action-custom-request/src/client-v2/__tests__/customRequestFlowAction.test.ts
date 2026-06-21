/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { customRequestFlowAction } from '../customRequestFlowAction';
import type { CustomRequestStepParams } from '../customRequestFlowActionTypes';

const createContext = (request = vi.fn()) => {
  return {
    request,
    message: {
      error: vi.fn(),
      success: vi.fn(),
    },
    t: vi.fn((key: string) => key),
    exit: vi.fn(),
    model: {
      getStepParams: vi.fn(() => ({})),
    },
  };
};

const runCustomRequestAction = customRequestFlowAction.handler as unknown as (
  ctx: ReturnType<typeof createContext>,
  params: CustomRequestStepParams,
) => Promise<unknown>;

describe('customRequestFlowAction', () => {
  it('should show configure message without sending request when custom request is not configured', async () => {
    const request = vi.fn();
    const ctx = createContext(request);

    await runCustomRequestAction(ctx, { key: 'req-not-configured' });

    expect(ctx.message.error).toHaveBeenCalledWith('Please configure the request settings first');
    expect(ctx.exit).toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
  });

  it('should show configure message without sending request when custom request has no key', async () => {
    const request = vi.fn();
    const ctx = createContext(request);

    await runCustomRequestAction(ctx, {});

    expect(ctx.message.error).toHaveBeenCalledWith('Please configure the request settings first');
    expect(ctx.exit).toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
  });

  it('should send custom request when saved config has url', async () => {
    const request = vi.fn().mockResolvedValue({ data: { data: { ok: true } } });
    const ctx = createContext(request);

    await runCustomRequestAction(ctx, { key: 'req-ready', configured: true, responseType: 'json', variablePaths: [] });

    expect(ctx.message.error).not.toHaveBeenCalled();
    expect(ctx.message.success).toHaveBeenCalledWith('Request success');
    expect(ctx.exit).not.toHaveBeenCalled();
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith({
      url: '/customRequests:send/req-ready',
      method: 'POST',
      responseType: 'json',
      data: {
        vars: undefined,
      },
    });
  });

  it('should keep sending custom request for legacy saved config without configured flag', async () => {
    const request = vi.fn().mockResolvedValue({ data: { data: { ok: true } } });
    const ctx = createContext(request);

    await runCustomRequestAction(ctx, { key: 'req-legacy-ready', variablePaths: [] });

    expect(ctx.message.error).not.toHaveBeenCalled();
    expect(ctx.message.success).toHaveBeenCalledWith('Request success');
    expect(ctx.exit).not.toHaveBeenCalled();
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith({
      url: '/customRequests:send/req-legacy-ready',
      method: 'POST',
      responseType: 'json',
      data: {
        vars: undefined,
      },
    });
  });

  it('should throw request errors for configured custom request', async () => {
    const requestError = new Error('remote service unavailable');
    const request = vi.fn().mockRejectedValue(requestError);
    const ctx = createContext(request);

    await expect(runCustomRequestAction(ctx, { key: 'req-ready', configured: true, variablePaths: [] })).rejects.toBe(
      requestError,
    );

    expect(ctx.message.error).not.toHaveBeenCalled();
    expect(ctx.message.success).not.toHaveBeenCalled();
    expect(ctx.exit).toHaveBeenCalled();
    expect(request).toHaveBeenCalledTimes(1);
  });
});
