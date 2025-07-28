/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockCluster, sleep } from '@nocobase/test';

import Plugin from '..';

describe('file-manager > cluster', () => {
  let cluster;

  beforeEach(async () => {
    cluster = await createMockCluster({
      plugins: ['file-manager'],
    });
  });

  afterEach(() => cluster.destroy());

  describe('sync message', () => {
    it('storage cache should be sync between every nodes', async () => {
      const [app1, app2] = cluster.nodes;

      const StorageRepo = app1.db.getRepository('storages');

      const s1 = await StorageRepo.findOne({
        filter: {
          default: true,
        },
      });

      const p1 = app1.pm.get(Plugin) as Plugin;
      const p2 = app2.pm.get(Plugin) as Plugin;

      expect(p1.storagesCache[s1.id]).toEqual(s1.toJSON());
      expect(p2.storagesCache[s1.id]).toEqual(s1.toJSON());

      await s1.update({
        path: 'a',
      });
      expect(p1.storagesCache[s1.id].path).toEqual('a');
      await sleep(550);
      expect(p2.storagesCache[s1.id].path).toEqual('a');
    });
  });
});
