/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { createMockCluster, sleep } from '@nocobase/test';

describe('sync-message-manager', () => {
  test('subscribe + publish', async () => {
    const cluster = await createMockCluster();
    const [node1, node2] = cluster.nodes;
    const mockListener = vi.fn();
    await node1.syncMessageManager.subscribe('test1', mockListener);
    await node2.syncMessageManager.subscribe('test1', mockListener);
    await node2.syncMessageManager.publish('test1', 'message1');
    expect(mockListener).toHaveBeenCalled();
    expect(mockListener).toBeCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith('message1');
    await cluster.destroy();
  });

  test('transaction', async () => {
    const cluster = await createMockCluster();
    const [node1, node2] = cluster.nodes;
    const mockListener = vi.fn();
    await node1.syncMessageManager.subscribe('test1', mockListener);
    const transaction = await node2.db.sequelize.transaction();
    node2.syncMessageManager.publish('test1', 'message1', { transaction });
    await sleep(1000);
    expect(mockListener).not.toHaveBeenCalled();
    await transaction.commit();
    await sleep(1100);
    expect(mockListener).toHaveBeenCalled();
    expect(mockListener).toBeCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith('message1');
    await cluster.destroy();
  });

  test('plugin.handleSyncMessage', async () => {
    const mockListener = vi.fn();
    class MyPlugin extends Plugin {
      get name() {
        return 'test1';
      }
      async handleSyncMessage(message) {
        mockListener(message);
      }
    }
    const cluster = await createMockCluster({
      plugins: [MyPlugin],
    });
    const [app1, app2] = cluster.nodes;
    await app1.pm.get(MyPlugin).sendSyncMessage('message1');
    expect(mockListener).toBeCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith('message1');
    await app2.pm.get(MyPlugin).sendSyncMessage('message2');
    expect(mockListener).toBeCalledTimes(2);
    expect(mockListener).toHaveBeenCalledWith('message2');
    await cluster.destroy();
  });

  test('plugin.handleSyncMessage + transaction', async () => {
    const mockListener = vi.fn();
    class MyPlugin extends Plugin {
      get name() {
        return 'test1';
      }
      async handleSyncMessage(message) {
        mockListener(message);
      }
    }
    const cluster = await createMockCluster({
      plugins: [MyPlugin],
    });
    const [app1, app2] = cluster.nodes;
    const transaction = await app1.db.sequelize.transaction();
    app1.pm.get(MyPlugin).sendSyncMessage('message1', { transaction });
    await sleep(1000);
    expect(mockListener).not.toHaveBeenCalled();
    await transaction.commit();
    await sleep(1100);
    expect(mockListener).toBeCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith('message1');
    await app2.pm.get(MyPlugin).sendSyncMessage('message2');
    expect(mockListener).toBeCalledTimes(2);
    expect(mockListener).toHaveBeenCalledWith('message2');
    await cluster.destroy();
  });
});
