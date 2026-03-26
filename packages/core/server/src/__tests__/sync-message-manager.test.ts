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
    await sleep(1100);
    expect(mockListener).toBeCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith('message1');
    await app2.pm.get(MyPlugin).sendSyncMessage('message2');
    await sleep(1100);
    expect(mockListener).toBeCalledTimes(2);
    expect(mockListener).toHaveBeenCalledWith('message2');
    await cluster.destroy();
  });

  test('plugin.handleSyncMessage should not be called after app stopped', async () => {
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
    // Verify message works before stop
    await app1.pm.get(MyPlugin).sendSyncMessage('message_before_stop');
    await sleep(1100);
    expect(mockListener).toBeCalledTimes(1);
    mockListener.mockClear();
    // Stop app2 — its pubSubManager should be closed during beforeStop, before db.close()
    await app2.stop();
    // Publish from app1 — app2's handler should NOT be called since pubSub is already closed
    await app1.pm.get(MyPlugin).sendSyncMessage('message_after_stop');
    await sleep(1100);
    expect(mockListener).not.toHaveBeenCalled();
    await cluster.destroy();
  });

  test('debounced handler should not be called after app stopped', async () => {
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
    // Send message without awaiting — the message arrives at app2 and starts a debounce timer,
    // but we don't wait for the adapter's simulated network delay so we can stop app2 first.
    app1.pm.get(MyPlugin).sendSyncMessage('message_debounced');
    // Stop app2 immediately — sets app.stopped=true and cancels pending debounce timers
    await app2.stop();
    // Wait for debounce period to elapse (default debounce is 500ms in mock server)
    await sleep(1000);
    // Handler should NOT have been called because app.stopped was set before debounce fired
    expect(mockListener).not.toHaveBeenCalled();
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
    await sleep(1100);
    expect(mockListener).toBeCalledTimes(2);
    expect(mockListener).toHaveBeenCalledWith('message2');
    await cluster.destroy();
  });
});
