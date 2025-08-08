/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MemoryPubSubAdapter, MockServer, createMockServer, sleep } from '@nocobase/test';
import { PubSubManager } from '../pub-sub-manager';

describe('connect', () => {
  let app: MockServer;
  let pubSubManager: PubSubManager;

  beforeEach(async () => {
    app = await createMockServer({
      pubSubManager: {
        channelPrefix: 'pubsub1',
      },
      skipStart: true,
    });
    pubSubManager = app.pubSubManager;
    pubSubManager.setAdapter(new MemoryPubSubAdapter());
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('not connected', async () => {
    const mockListener = vi.fn();
    await pubSubManager.subscribe('test1', mockListener);
    await pubSubManager.publish('test1', 'message1');
    expect(mockListener).not.toHaveBeenCalled();
  });

  test('closed', async () => {
    const mockListener = vi.fn();
    await app.start();
    await pubSubManager.subscribe('test1', mockListener);
    await pubSubManager.close();
    await pubSubManager.publish('test1', 'message1');
    expect(mockListener).not.toHaveBeenCalled();
  });

  test('subscribe before connect', async () => {
    const mockListener = vi.fn();
    await pubSubManager.subscribe('test1', mockListener);
    await app.start();
    await pubSubManager.publish('test1', 'message1');
    expect(mockListener).toHaveBeenCalled();
    expect(mockListener).toBeCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith('message1');
  });

  test('subscribe after connect', async () => {
    await app.start();
    const mockListener = vi.fn();
    await pubSubManager.subscribe('test1', mockListener);
    await pubSubManager.publish('test1', 'message1');
    expect(mockListener).toHaveBeenCalled();
    expect(mockListener).toBeCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith('message1');
  });
});

describe('skipSelf, unsubscribe, debounce', () => {
  let app: MockServer;
  let pubSubManager: PubSubManager;

  beforeEach(async () => {
    app = await createMockServer({
      pubSubManager: {
        channelPrefix: 'pubsub1',
      },
      skipStart: true,
    });
    pubSubManager = app.pubSubManager;
    pubSubManager.setAdapter(new MemoryPubSubAdapter());
    await app.start();
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('skipSelf: false', async () => {
    const mockListener = vi.fn();
    await pubSubManager.subscribe('test1', mockListener);
    await pubSubManager.publish('test1', 'message1');
    expect(mockListener).toHaveBeenCalled();
    expect(mockListener).toBeCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith('message1');
  });

  test('skipSelf: true', async () => {
    const mockListener = vi.fn();
    await pubSubManager.subscribe('test1', mockListener);
    await pubSubManager.publish('test1', 'message1', { skipSelf: true });
    expect(mockListener).not.toHaveBeenCalled();
  });

  test('debounce', async () => {
    const mockListener = vi.fn();
    await pubSubManager.subscribe('test1', mockListener, { debounce: 1000 });
    pubSubManager.publish('test1', 'message1');
    pubSubManager.publish('test1', 'message1');
    pubSubManager.publish('test1', 'message1');
    pubSubManager.publish('test1', 'message1');
    pubSubManager.publish('test1', 'message1');
    pubSubManager.publish('test1', 'message1');
    pubSubManager.publish('test1', 'message2');
    pubSubManager.publish('test1', 'message2');
    pubSubManager.publish('test1', 'message2');
    pubSubManager.publish('test1', 'message2');
    pubSubManager.publish('test1', 'message2');
    pubSubManager.publish('test1', 'message2');
    await sleep(500);
    expect(pubSubManager['handlerManager']['uniqueMessageHandlers'].size).toBe(2);
    await sleep(2000);
    expect(pubSubManager['handlerManager']['uniqueMessageHandlers'].size).toBe(0);
    expect(mockListener).toBeCalledTimes(2);
  });

  test('message format', async () => {
    const mockListener = vi.fn();
    await pubSubManager.subscribe('test1', mockListener);
    await pubSubManager.publish('test1', 1);
    expect(mockListener).toBeCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith(1);
    const msg2 = ['message1'];
    await pubSubManager.publish('test1', msg2);
    expect(mockListener).toBeCalledTimes(2);
    expect(mockListener).toHaveBeenCalledWith(msg2);
    const msg3 = { type: 'test' };
    await pubSubManager.publish('test1', msg3);
    expect(mockListener).toBeCalledTimes(3);
    expect(mockListener).toHaveBeenCalledWith(msg3);
    await pubSubManager.publish('test1', true);
    expect(mockListener).toBeCalledTimes(4);
    expect(mockListener).toHaveBeenCalledWith(true);
    await pubSubManager.publish('test1', false);
    expect(mockListener).toBeCalledTimes(5);
    expect(mockListener).toHaveBeenCalledWith(false);
    await pubSubManager.publish('test1', null);
    expect(mockListener).toBeCalledTimes(6);
    expect(mockListener).toHaveBeenCalledWith(null);
  });

  test('unsubscribe', async () => {
    const mockListener = vi.fn();
    await pubSubManager.subscribe('test1', mockListener);
    await pubSubManager.publish('test1', 'message1');
    expect(mockListener).toHaveBeenCalled();
    expect(mockListener).toBeCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith('message1');
    await pubSubManager.unsubscribe('test1', mockListener);
    await pubSubManager.publish('test1', 'message1');
    expect(mockListener).toBeCalledTimes(1);
  });
});

describe('Pub/Sub', () => {
  let publisher: MockServer;
  let subscriber: MockServer;

  beforeEach(async () => {
    const pubsub = new MemoryPubSubAdapter();
    publisher = await createMockServer({
      name: 'publisher',
      pubSubManager: { channelPrefix: 'pubsub1' },
      skipStart: true,
    });
    publisher.pubSubManager.setAdapter(pubsub);
    await publisher.start();

    subscriber = await createMockServer({
      name: 'subscriber',
      pubSubManager: { channelPrefix: 'pubsub1' },
      skipStart: true,
    });
    subscriber.pubSubManager.setAdapter(pubsub);
    await subscriber.start();
  });

  afterEach(async () => {
    await publisher.destroy();
    await subscriber.destroy();
  });

  test('subscribe publish', async () => {
    const mockListener = vi.fn();
    await subscriber.pubSubManager.subscribe('test1', mockListener);
    await publisher.pubSubManager.publish('test1', 'message1');
    expect(mockListener).toHaveBeenCalled();
    expect(mockListener).toBeCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith('message1');
  });

  test('subscribe twice', async () => {
    const mockListener = vi.fn();
    await subscriber.pubSubManager.subscribe('test1', mockListener);
    await subscriber.pubSubManager.subscribe('test1', mockListener);
    await publisher.pubSubManager.publish('test1', 'message1');
    expect(mockListener).toHaveBeenCalled();
    expect(mockListener).toBeCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith('message1');
  });

  test('publish only self', async () => {
    const mockListener = vi.fn();
    await subscriber.pubSubManager.subscribe('test1', mockListener);
    await publisher.pubSubManager.subscribe('test1', mockListener);
    await publisher.pubSubManager.publish('test1', 'message1', { onlySelf: true });
    expect(mockListener).toHaveBeenCalled();
    expect(mockListener).toBeCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith('message1');
  });
});

describe('app.pubSubManager', () => {
  let app: MockServer;
  let pubSubManager: PubSubManager;

  beforeEach(async () => {
    app = await createMockServer({
      pubSubManager: {
        channelPrefix: 'app1',
      },
    });
    pubSubManager = app.pubSubManager;
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('adapter', async () => {
    expect(await pubSubManager.isConnected()).toBe(true);
  });

  test('subscribe + publish', async () => {
    const mockListener = vi.fn();
    await pubSubManager.subscribe('test1', mockListener);
    await pubSubManager.publish('test1', 'message1');
    expect(mockListener).toHaveBeenCalled();
    expect(mockListener).toBeCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith('message1');
  });
});
