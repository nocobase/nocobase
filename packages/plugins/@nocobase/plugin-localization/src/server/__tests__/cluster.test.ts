/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockCluster, sleep } from '@nocobase/test';

describe('cluster', () => {
  it('publish', async () => {
    process.env.APP_ENV = 'production';
    const cluster = await createMockCluster({
      plugins: ['localization'],
    });
    const [app1, app2] = cluster.nodes;
    await app1.emitAsync('afterLoad');
    await app2.emitAsync('afterLoad');
    const agent1 = app1.agent();
    const repo1 = app1.db.getRepository('localizationTexts');
    await repo1.create({
      updateAssociationValues: ['translations'],
      values: [
        {
          module: 'test',
          text: 'text',
          translations: [
            {
              locale: 'en-US',
              translation: 'translation',
            },
          ],
        },
      ],
    });
    const { resources } = await app1.localeManager.get('en-US');
    expect(resources.test).toBeUndefined();
    const { resources: resources1 } = await app2.localeManager.get('en-US');
    expect(resources1.test).toBeUndefined();
    await agent1.resource('localization').publish();
    await sleep(1000);
    const { resources: resources2 } = await app1.localeManager.get('en-US');
    expect(resources2.test).toBeDefined();
    expect(resources2.test.text).toBe('translation');
    const { resources: resources3 } = await app2.localeManager.get('en-US');
    expect(resources3.test).toBeDefined();
    expect(resources3.test.text).toBe('translation');
    await cluster.destroy();
  });
});
