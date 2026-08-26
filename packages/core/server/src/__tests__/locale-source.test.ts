/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer } from '@nocobase/test';

describe('locale source', () => {
  it('syncs selected sources', async () => {
    const app = await createMockServer();
    const spy = vi.fn(async () => ({ test: { Test: '' } }));

    app.localeManager.registerSource('test', {
      title: 'Test',
      sync: spy,
    });
    app.localeManager.registerSource('passive', {
      title: 'Passive',
    });

    await app.localeManager.syncSources({} as any, []);
    expect(spy).toBeCalledTimes(0);

    const resources = await app.localeManager.syncSources({} as any, ['test']);
    expect(spy).toBeCalledTimes(1);
    expect(resources).toEqual({ client: {}, test: { Test: '' } });

    await app.localeManager.syncSources({} as any, ['passive']);
    expect(spy).toBeCalledTimes(1);

    await app.destroy();
  });
});
