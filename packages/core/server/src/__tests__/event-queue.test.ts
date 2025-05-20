/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer, sleep } from '@nocobase/test';
import { Plugin } from '../plugin';

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

describe('memory queue adapter', () => {
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
    expect(app.eventQueue.isConnected()).toBe(false);
    const mockListener = vi.fn();
    await app.eventQueue.subscribe('test1', {
      idle: () => true,
      process: mockListener,
    });
    await expect(app.eventQueue.publish('test1', 'message1')).rejects.toThrowError();
    expect(mockListener).not.toHaveBeenCalled();
  });

  test('closed', async () => {
    const mockListener = vi.fn();
    await app.eventQueue.connect();
    await app.eventQueue.subscribe('test1', {
      idle: () => true,
      process: mockListener,
    });
    await app.eventQueue.close();
    expect(app.eventQueue.isConnected()).toBe(false);
    await expect(app.eventQueue.publish('test1', 'message1')).rejects.toThrowError();
    expect(mockListener).not.toHaveBeenCalled();
  });

  test('subscribe before connect', async () => {
    const mockListener = vi.fn();
    await app.eventQueue.subscribe('test1', {
      idle: () => true,
      process: mockListener,
    });
    await app.eventQueue.connect();
    await app.eventQueue.publish('test1', 'message1');
    await sleep(1000);
    expect(mockListener).toHaveBeenCalled();
    expect(mockListener).toBeCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith('message1', { signal: expect.any(AbortSignal) });
  });

  test('subscribe after connect', async () => {
    const mockListener = vi.fn();
    await app.eventQueue.connect();
    await app.eventQueue.subscribe('test1', {
      idle: () => true,
      process: mockListener,
    });
    await app.eventQueue.publish('test1', 'message1');
    await sleep(1000);
    expect(mockListener).toHaveBeenCalled();
    expect(mockListener).toBeCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith('message1', { signal: expect.any(AbortSignal) });
  });

  test('subscribe twice', async () => {
    const mockListener = vi.fn();
    const idleListener = {
      idle: () => true,
      process: mockListener,
    };
    await app.eventQueue.subscribe('test1', idleListener);
    await app.eventQueue.subscribe('test1', idleListener);
    await app.eventQueue.connect();
    await app.eventQueue.publish('test1', 'message1');
    await sleep(1000);
    expect(mockListener).toHaveBeenCalled();
    expect(mockListener).toBeCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith('message1', { signal: expect.any(AbortSignal) });
  });

  test('idle', async () => {
    const mockListener = vi.fn();
    await app.eventQueue.subscribe('test1', {
      idle: () => false,
      process: mockListener,
    });
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
    expect(mockListener).toHaveBeenCalledWith('message1', { signal: expect.any(AbortSignal) });
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

  test('graceful shutdown', async () => {
    const mockListener = vi.fn();
    await app.eventQueue.subscribe('test1', {
      idle: () => true,
      process: mockListener,
    });
    await app.eventQueue.connect();
    await app.eventQueue.publish('test1', 'message1');
    await app.eventQueue.close();
    expect(mockListener).toBeCalledTimes(0);
  });
});
