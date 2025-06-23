/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'node:path';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

import { MockServer, createMockServer, sleep } from '@nocobase/test';
import { Plugin } from '../plugin';
import { QUEUE_PRIORITY } from '../event-queue';

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

class MockPlugin1 extends Plugin {
  processing = new Map<string, any>();
  processedMessages: any[] = [];

  get name() {
    return 'mock-plugin-1';
  }

  async load() {
    this.app.eventQueue.subscribe(this.name, {
      interval: 500,
      concurrency: 2,
      idle: () => !this.processing.size,
      process: async (message, { id }) => {
        this.processing.set(id, message);
        await sleep(500);
        if (!message) {
          throw new Error('Message is invalid');
        }
        this.processedMessages.push(message);
        this.processing.delete(id);
      },
    });
  }
}

describe('memory queue adapter', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      name: randomUUID(),
      plugins: [MockPlugin, MockPlugin1],
      skipStart: true,
    });
  });

  afterEach(async () => {
    if (app.eventQueue.isConnected()) {
      app.eventQueue.close();
    }
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
    expect(mockListener).toHaveBeenCalledWith('message1', {
      signal: expect.any(AbortSignal),
      id: expect.any(String),
      retried: 0,
    });
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
    expect(mockListener).toHaveBeenCalledWith('message1', {
      signal: expect.any(AbortSignal),
      id: expect.any(String),
      retried: 0,
    });
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
    expect(mockListener).toHaveBeenCalledWith('message1', {
      signal: expect.any(AbortSignal),
      id: expect.any(String),
      retried: 0,
    });
  });

  test('not idle', async () => {
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

  test('idle', async () => {
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
    expect(mockListener).toHaveBeenCalledWith('message1', {
      signal: expect.any(AbortSignal),
      id: expect.any(String),
      retried: 0,
    });
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

  describe('error handling and retry', () => {
    test('message processing failure with retry', async () => {
      const mockListener = vi.fn().mockImplementation(() => {
        throw new Error('Processing failed');
      });

      await app.eventQueue.subscribe('test1', {
        idle: () => true,
        process: mockListener,
      });

      await app.eventQueue.connect();
      await app.eventQueue.publish('test1', 'message1', { maxRetries: 3 });

      await sleep(500);
      expect(mockListener).toBeCalledTimes(4);

      const mockPlugin = app.pm.get(MockPlugin);
      expect(mockPlugin.processedMessages).toHaveLength(0);
    });
    test('timeout handling during message processing', async () => {
      const result = [];
      const mockListener = vi.fn().mockImplementation(async (content, { signal }) => {
        await delay(750, null, { signal });
        result.push(content);
      });

      await app.eventQueue.subscribe('test1', {
        idle: () => true,
        process: mockListener,
      });

      await app.eventQueue.connect();
      await app.eventQueue.publish('test1', 'message1', { timeout: 500, maxRetries: 1 });

      await sleep(1000);
      expect(mockListener).toBeCalledTimes(2);
      expect(result).toHaveLength(0);

      await app.eventQueue.publish('test1', 'message2', { timeout: 1000 });

      await sleep(1200);
      expect(mockListener).toBeCalledTimes(3);
      expect(result).toHaveLength(1);
    });
  });

  describe('concurrency control', () => {
    test('concurrent message processing with custom concurrency', async () => {
      const mockPlugin = app.pm.get(MockPlugin1);
      await app.start();
      for (const i of [1, 2, 3, 4, 5]) {
        await app.eventQueue.publish('mock-plugin-1', i);
      }
      expect(mockPlugin.processing.size).toBe(0);
      await sleep(600);
      expect(mockPlugin.processedMessages).toHaveLength(2);
      expect(mockPlugin.processing.size).toBe(2);

      await sleep(500);
      expect(mockPlugin.processedMessages).toHaveLength(4);
      expect(mockPlugin.processing.size).toBe(1);

      await sleep(500);
      expect(mockPlugin.processedMessages).toHaveLength(5);
      expect(mockPlugin.processing.size).toBe(0);
    });

    test('processing failure with concurrency', async () => {
      await app.start();
      const mockPlugin = app.pm.get(MockPlugin1);

      await app.eventQueue.publish('mock-plugin-1', 1);
      await app.eventQueue.publish('mock-plugin-1', 0);

      await sleep(600);

      expect(mockPlugin.processedMessages).toHaveLength(1);
    });
  });

  describe('priority', () => {
    test('publish with priority', async () => {
      const mockListener = vi.fn();
      await app.eventQueue.subscribe('test1', {
        idle: () => true,
        process: mockListener,
      });
      await app.eventQueue.connect();

      await app.eventQueue.publish('test1', 'message1');
      await app.eventQueue.publish('test1', 'message2', { priority: QUEUE_PRIORITY.LOW });
      await app.eventQueue.publish('test1', 'message3', { priority: QUEUE_PRIORITY.HIGH });

      await sleep(1000);
      expect(mockListener).toBeCalledTimes(3);
      expect(mockListener.mock.calls[0][0]).toBe('message3');
      expect(mockListener.mock.calls[1][0]).toBe('message1');
      expect(mockListener.mock.calls[2][0]).toBe('message2');
    });
  });

  describe('storage', () => {
    test('graceful shutdown, will create storage', async () => {
      const mockListener = vi.fn();
      const queueFile = path.resolve(process.cwd(), 'storage', 'apps', app.name, 'event-queue.json');
      await expect(fs.stat(queueFile)).rejects.toThrowError();
      await app.eventQueue.subscribe('test1', {
        idle: () => true,
        process: mockListener,
      });
      await app.eventQueue.connect();
      await app.eventQueue.publish('test1', 'message1');
      await app.eventQueue.close();
      expect(mockListener).toBeCalledTimes(0);

      await sleep(300);
      expect(mockListener).toBeCalledTimes(0);
      await expect(fs.stat(queueFile)).resolves.toBeDefined();
      const queueFileContent = await fs.readFile(queueFile, 'utf-8');
      const queueFileJSON = JSON.parse(queueFileContent);
      const channels = Object.keys(queueFileJSON);
      expect(channels).toHaveLength(1);
      expect(channels[0].endsWith('.test1')).toBe(true);
      expect(queueFileJSON[channels[0]]).toMatchObject([
        {
          content: 'message1',
        },
      ]);

      await app.eventQueue.connect();
      await expect(fs.stat(queueFile)).rejects.toThrowError();

      await sleep(300);
      expect(mockListener).toBeCalledTimes(1);

      await app.eventQueue.close();
      await expect(fs.stat(queueFile)).rejects.toThrowError();
    });
  });
});
