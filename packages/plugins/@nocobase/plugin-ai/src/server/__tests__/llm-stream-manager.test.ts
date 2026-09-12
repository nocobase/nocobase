/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CacheManager } from '@nocobase/cache';
import { LLMStreamCachedManager } from '../manager/llm-stream-manager';

describe('LLMStreamCachedManager', () => {
  let cacheManager: CacheManager;
  let llmStreamCachedManager: LLMStreamCachedManager;

  beforeEach(() => {
    cacheManager = new CacheManager();
    llmStreamCachedManager = new LLMStreamCachedManager({
      app: {
        cacheManager,
        options: {
          cacheManager: {
            defaultStore: cacheManager.defaultStore,
          },
        },
      },
    } as any);
  });

  afterEach(async () => {
    await cacheManager.close();
  });

  it('should append and clear chunks by sessionId', async () => {
    const cached = llmStreamCachedManager.getCached('session-1');

    await cached.append('chunk-1');
    await cached.append('chunk-2');

    const internalCache = await cacheManager.getCache('ai-llm-stream-cache').get<string[]>('session-1');
    expect(internalCache).toEqual(['chunk-1', 'chunk-2']);

    await cached.clear();

    expect(await cacheManager.getCache('ai-llm-stream-cache').get<string[]>('session-1')).toBeUndefined();
  });

  it('should stream cached chunks until stream_end arrives', async () => {
    const cached = llmStreamCachedManager.getCached('session-2');
    const written: string[] = [];

    const streamPromise = (async () => {
      for await (const chunk of cached.stream({
        pollInterval: 10,
        initialWaitTimeout: 200,
      })) {
        written.push(chunk);
      }
    })();

    await sleep(20);
    await cached.append('data: {"type":"content","body":"hello"}\n\n');
    await sleep(20);
    await cached.append('data: {"type":"stream_end"}\n\n');

    await streamPromise;

    expect(written).toEqual(['data: {"type":"content","body":"hello"}\n\n', 'data: {"type":"stream_end"}\n\n']);
  });

  it('should skip chunks before the last skipped mark', async () => {
    const cached = llmStreamCachedManager.getCached('session-3');

    await cached.append('data: {"type":"content","body":"old-1"}\n\n');
    await cached.skipped();
    await cached.append('data: {"type":"content","body":"old-2"}\n\n');
    await cached.skipped();
    await cached.append('data: {"type":"content","body":"next"}\n\n');
    await cached.append('data: {"type":"stream_end"}\n\n');

    const written: string[] = [];
    for await (const chunk of cached.stream({
      pollInterval: 10,
      initialWaitTimeout: 200,
    })) {
      written.push(chunk);
    }

    expect(written).toEqual(['data: {"type":"content","body":"next"}\n\n', 'data: {"type":"stream_end"}\n\n']);
  });

  it('should keep skipped marks separated when buffered chunks are flushed', async () => {
    const bufferedCacheManager = new CacheManager({
      defaultStore: 'buffered-memory',
      stores: {
        'buffered-memory': {
          store: 'memory',
        },
      },
    });
    const bufferedLLMStreamCachedManager = new LLMStreamCachedManager({
      app: {
        cacheManager: bufferedCacheManager,
        options: {
          cacheManager: {
            defaultStore: bufferedCacheManager.defaultStore,
          },
        },
      },
    } as any);
    const cached = bufferedLLMStreamCachedManager.getCached('session-buffered');

    await cached.append('data: {"type":"content","body":"old-1"}\n\n');
    await cached.skipped();
    await cached.append('data: {"type":"content","body":"next"}\n\n');
    await cached.append('data: {"type":"stream_end"}\n\n');
    await sleep(1100);

    const internalCache = await bufferedCacheManager.getCache('ai-llm-stream-cache').get<string[]>('session-buffered');
    expect(internalCache).toEqual([
      'data: {"type":"content","body":"old-1"}\n\n',
      '__skipped__',
      'data: {"type":"content","body":"next"}\n\ndata: {"type":"stream_end"}\n\n',
    ]);

    const written: string[] = [];
    for await (const chunk of cached.stream({
      pollInterval: 10,
      initialWaitTimeout: 200,
    })) {
      written.push(chunk);
    }

    expect(written).toEqual(['data: {"type":"content","body":"next"}\n\ndata: {"type":"stream_end"}\n\n']);

    await cached.clear();
    await bufferedCacheManager.close();
  });

  it('should stop waiting when no new chunks arrive after partial cache is streamed', async () => {
    const cached = llmStreamCachedManager.getCached('session-4');

    await cached.append('data: {"type":"content","body":"partial"}\n\n');

    const written: string[] = [];
    for await (const chunk of cached.stream({
      pollInterval: 10,
      initialWaitTimeout: 20,
    })) {
      written.push(chunk);
    }

    expect(written).toEqual(['data: {"type":"content","body":"partial"}\n\n']);
  });

  it('should stop streaming when aborted', async () => {
    const cached = llmStreamCachedManager.getCached('session-5');
    const abortController = new AbortController();
    const startedAt = Date.now();

    setTimeout(() => abortController.abort(), 20);

    const written: string[] = [];
    for await (const chunk of cached.stream({
      pollInterval: 1000,
      initialWaitTimeout: 5000,
      signal: abortController.signal,
    })) {
      written.push(chunk);
    }

    expect(written).toEqual([]);
    expect(Date.now() - startedAt).toBeLessThan(500);
  });
});

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
