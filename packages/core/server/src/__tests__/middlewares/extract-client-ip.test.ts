/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { extractClientIp } from '../../middlewares';

describe('extract client ip middleware', () => {
  it('should extract frist ip in X-Forwarded-For', async () => {
    const extractClientIpMiddleware = extractClientIp();
    const ctx: any = {
      get: (key) => ctx[key],
      ['X-Forwarded-For']: '   192.198.1.10   ,   100.100.100.100',
      request: {
        ip: '192.168.1.20',
      },
      state: {},
    };
    await extractClientIpMiddleware(ctx, async () => {});
    expect(ctx.state.clientIp).toEqual('192.198.1.10');
  });
  it('should extract frist ip in X-Forwarded-For', async () => {
    const extractClientIpMiddleware = extractClientIp();
    const ctx: any = {
      get: (key) => ctx[key],
      ['X-Forwarded-For']: '   192.198.1.11  ',
      request: {
        ip: '192.168.1.20',
      },
      state: {},
    };
    await extractClientIpMiddleware(ctx, async () => {});
    expect(ctx.state.clientIp).toEqual('192.198.1.11');
  });

  it('should extract request.ip if X-Forwarded-For is null', async () => {
    const extractClientIpMiddleware = extractClientIp();
    const ctx: any = {
      get: (key) => ctx[key],
      request: {
        ip: '192.168.1.20',
      },
      state: {},
    };
    await extractClientIpMiddleware(ctx, async () => {});
    expect(ctx.state.clientIp).toEqual('192.168.1.20');
  });
});
