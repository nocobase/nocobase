/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockCluster, createMockServer, sleep } from '@nocobase/test';
import { Plugin } from '../plugin';
import { MemoryEventQueueAdapter, QueueEventOptions } from '../event-queue';

class MockPlugin extends Plugin {
  idle = true;

  processedMessages: any[] = [];

  get name() {
    return 'mock-plugin';
  }

  async load() {
    this.app.eventQueue.subscribe(this.name, {
      interval: 500,
      idle: () => this.idle,
      process: async (message) => {
        this.idle = false;
        await sleep(500);
        this.processedMessages.push(message);
        this.idle = true;
      },
    });
  }
}

const memoryQueues: Map<string, any[]> = new Map();

class MockMemoryEventQueueAdapter extends MemoryEventQueueAdapter {
  protected queues = memoryQueues;
}

describe('single node', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: [MockPlugin],
      skipStart: true,
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('not connected', async () => {
    const mockListener = vi.fn();
    await app.eventQueue.subscribe('test1', () => mockListener);
    await app.eventQueue.publish('test1', 'message1');
    expect(mockListener).not.toHaveBeenCalled();
  });

  test('closed', async () => {
    const mockListener = vi.fn();
    await app.eventQueue.connect();
    await app.eventQueue.subscribe('test1', () => mockListener);
    await app.eventQueue.close();
    await app.eventQueue.publish('test1', 'message1');
    expect(mockListener).not.toHaveBeenCalled();
  });

  test('subscribe before connect', async () => {
    const mockListener = vi.fn();
    await app.eventQueue.subscribe('test1', () => mockListener);
    await app.eventQueue.connect();
    await app.eventQueue.publish('test1', 'message1');
    await sleep(1000);
    expect(mockListener).toHaveBeenCalled();
    expect(mockListener).toBeCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith('message1');
  });

  test('subscribe after connect', async () => {
    const mockListener = vi.fn();
    await app.eventQueue.connect();
    await app.eventQueue.subscribe('test1', () => mockListener);
    await app.eventQueue.publish('test1', 'message1');
    await sleep(1000);
    expect(mockListener).toHaveBeenCalled();
    expect(mockListener).toBeCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith('message1');
  });

  test('subscribe twice', async () => {
    const mockListener = vi.fn();
    const idleListener = () => mockListener;
    await app.eventQueue.subscribe('test1', idleListener);
    await app.eventQueue.subscribe('test1', idleListener);
    await app.eventQueue.connect();
    await app.eventQueue.publish('test1', 'message1');
    await sleep(1000);
    expect(mockListener).toHaveBeenCalled();
    expect(mockListener).toBeCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith('message1');
  });

  test('idle', async () => {
    const mockListener = vi.fn();
    const idleListener = () => null;
    await app.eventQueue.subscribe('test1', idleListener);
    await app.eventQueue.connect();
    await app.eventQueue.publish('test1', 'message1');
    await sleep(1000);
    expect(mockListener).toBeCalledTimes(0);
  });

  test('object configuration', async () => {
    const mockListener = vi.fn();
    const event = {
      idle: () => true,
      process: mockListener,
    };
    await app.eventQueue.subscribe('test1', event);
    await app.eventQueue.connect();
    await app.eventQueue.publish('test1', 'message1');
    await sleep(1000);
    expect(mockListener).toHaveBeenCalled();
    expect(mockListener).toBeCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith('message1');
  });

  test('plugin consume', async () => {
    await app.start();
    const mockPlugin = app.pm.get(MockPlugin);
    expect(mockPlugin.idle).toBe(true);
    expect(mockPlugin.processedMessages).toHaveLength(0);

    await app.eventQueue.publish(mockPlugin.name, 'message1');
    await app.eventQueue.publish(mockPlugin.name, 'message2');

    await sleep(300);
    expect(mockPlugin.processedMessages).toHaveLength(0);
    expect(mockPlugin.idle).toBe(false);

    await sleep(500);
    expect(mockPlugin.processedMessages).toHaveLength(1);
    expect(mockPlugin.processedMessages[0]).toEqual('message1');
    expect(mockPlugin.idle).toBe(false);

    await sleep(500);
    expect(mockPlugin.processedMessages).toHaveLength(2);
    expect(mockPlugin.idle).toBe(true);
  });
});

describe('cluster', () => {
  let cluster;

  beforeEach(async () => {
    cluster = await createMockCluster({
      plugins: [MockPlugin],
    });
    for (const node of cluster.nodes) {
      node.eventQueue.setAdapter(new MockMemoryEventQueueAdapter());
      await node.eventQueue.connect();
    }
  });

  afterEach(async () => {
    await cluster.destroy();
  });

  test('adapter', async () => {
    const [node1, node2] = cluster.nodes;
    expect(node1.eventQueue.isConnected()).toBe(true);
    expect(node2.eventQueue.isConnected()).toBe(true);
  });

  test('plugin consume', async () => {
    const [node1, node2] = cluster.nodes;
    const node1Plugin = node1.pm.get(MockPlugin);
    const node2Plugin = node2.pm.get(MockPlugin);
    await node1.eventQueue.publish(node1Plugin.name, 'message1');
    await node1.eventQueue.publish(node1Plugin.name, 'message1');

    await sleep(250);
    expect(node1Plugin.processedMessages).toHaveLength(0);
    expect(node1Plugin.idle).toBe(false);
    expect(node2Plugin.processedMessages).toHaveLength(0);
    expect(node2Plugin.idle).toBe(false);

    await sleep(500);

    expect(node1Plugin.processedMessages).toHaveLength(1);
    expect(node1Plugin.idle).toBe(true);
    expect(node2Plugin.processedMessages).toHaveLength(1);
    expect(node2Plugin.idle).toBe(true);
  });
});
