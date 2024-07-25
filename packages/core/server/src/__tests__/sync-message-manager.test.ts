/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { createMultiMockServer, sleep } from '@nocobase/test';
import { uid } from '@nocobase/utils';

describe('sync-message-manager', () => {
  test('subscribe + publish', async () => {
    const [node1, node2] = await createMultiMockServer({ basename: 'base1' });
    const mockListener = vi.fn();
    await node1.syncMessageManager.subscribe('test1', mockListener);
    await node2.syncMessageManager.subscribe('test1', mockListener);
    await node2.syncMessageManager.publish('test1', 'message1');
    expect(mockListener).toHaveBeenCalled();
    expect(mockListener).toBeCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith('message1');
    await node1.destroy();
    await node2.destroy();
  });

  test('transaction', async () => {
    const [node1, node2] = await createMultiMockServer({ basename: 'base1' });
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
    await node1.destroy();
    await node2.destroy();
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
    const [app1, app2] = await createMultiMockServer({
      basename: uid(),
      number: 2, // 创建几个 app 实例
      plugins: [MyPlugin],
    });
    await app1.pm.get(MyPlugin).sendSyncMessage('message1');
    expect(mockListener).toBeCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith('message1');
    await app2.pm.get(MyPlugin).sendSyncMessage('message2');
    expect(mockListener).toBeCalledTimes(2);
    expect(mockListener).toHaveBeenCalledWith('message2');
    await app1.destroy();
    await app2.destroy();
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
    const [app1, app2] = await createMultiMockServer({
      basename: uid(),
      number: 2, // 创建几个 app 实例
      plugins: [MyPlugin],
    });
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
    await app1.destroy();
    await app2.destroy();
  });
});
