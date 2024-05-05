/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { skip } from '../skip-middleware';

describe('Skip Middleware', () => {
  it('should skip middleware', async () => {
    const skipMiddleware = skip({ resourceName: 'posts', actionName: 'list' });
    const ctx: any = {
      action: {
        resourceName: 'posts',
        actionName: 'list',
      },
      permission: {},
    };

    await skipMiddleware(ctx, async () => {
      expect(ctx.permission.skip).toBeTruthy();
    });

    const ctx2: any = {
      action: {
        resourceName: 'posts',
        actionName: 'create',
      },
      permission: {},
    };

    await skipMiddleware(ctx2, async () => {
      expect(ctx2.permission.skip).toBeFalsy();
    });
  });
});
