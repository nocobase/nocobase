/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Cache } from '@nocobase/cache';
import PluginAIServer from '../plugin';
import { sleep } from '@nocobase/utils';

const CACHE_NAME = 'ai-llm-stream-cache';
const LOCK_KEY_PREFIX = 'ai-llm-stream-lock';
const WRITE_LOCK_TTL = 3000;
const CACHE_TTL = 10 * 60 * 1000;
const STREAM_END_MARK = '"type":"stream_end"';
const SKIPPED_MARK = '__skipped__';
const DEFAULT_POLL_INTERVAL = 50;
const DEFAULT_INITIAL_WAIT_TIMEOUT = 1000;

export class LLMStreamCachedManager {
  private cachePromise?: Promise<Cache>;

  constructor(private readonly plugin: PluginAIServer) {}

  getCached(sessionId: string) {
    return new LLMStreamCached(sessionId, this);
  }

  async clear(sessionId: string) {
    await this.withLock(sessionId, async () => {
      const cache = await this.getCache();
      await cache.del(sessionId);
    });
  }

  async append(sessionId: string, chunk: string) {
    await this.withLock(sessionId, async () => {
      const cache = await this.getCache();
      const chunks = (await cache.get<string[]>(sessionId)) ?? [];
      chunks.push(chunk);
      await cache.set(sessionId, chunks, CACHE_TTL);
    });
  }

  async *stream(
    sessionId: string,
    options?: {
      pollInterval?: number;
      initialWaitTimeout?: number;
    },
  ): AsyncGenerator<string, void, void> {
    const pollInterval = options?.pollInterval ?? DEFAULT_POLL_INTERVAL;
    const initialWaitTimeout = options?.initialWaitTimeout ?? DEFAULT_INITIAL_WAIT_TIMEOUT;
    let offset = 0;
    let waited = 0;
    let completed = false;

    while (!completed) {
      const chunks = await this.getChunks(sessionId);
      const lastSkippedIndex = chunks.lastIndexOf(SKIPPED_MARK);

      if (lastSkippedIndex >= offset) {
        offset = lastSkippedIndex + 1;
      }

      while (offset < chunks.length) {
        const chunk = chunks[offset++];
        yield chunk;
        waited = 0;
        if (chunk.includes(STREAM_END_MARK)) {
          completed = true;
          break;
        }
      }

      if (completed) {
        return;
      }

      if (!chunks.length) {
        if (offset > 0) {
          return;
        }
        if (waited >= initialWaitTimeout) {
          return;
        }
        waited += pollInterval;
      }

      await sleep(pollInterval);
    }
  }

  private async getChunks(sessionId: string) {
    const cache = await this.getCache();
    return (await cache.get<string[]>(sessionId)) ?? [];
  }

  private async getCache() {
    this.cachePromise ??= this.plugin.app.cacheManager.createCache({
      name: CACHE_NAME,
      store: this.plugin.app.cacheManager.defaultStore,
    });
    return this.cachePromise;
  }

  private async withLock<T>(sessionId: string, fn: () => Promise<T>) {
    return await this.plugin.app.lockManager.runExclusive(this.getLockKey(sessionId), fn, WRITE_LOCK_TTL);
  }

  private getLockKey(sessionId: string) {
    return `${LOCK_KEY_PREFIX}:${sessionId}`;
  }
}

export class LLMStreamCached {
  constructor(
    private readonly sessionId: string,
    private readonly manager: LLMStreamCachedManager,
  ) {}

  async clear() {
    await this.manager.clear(this.sessionId);
  }

  async append(chunk: string) {
    await this.manager.append(this.sessionId, chunk);
  }

  async skipped() {
    await this.append(SKIPPED_MARK);
  }

  async *stream(options?: { pollInterval?: number; initialWaitTimeout?: number }): AsyncGenerator<string, void, void> {
    for await (const chunk of this.manager.stream(this.sessionId, options)) {
      yield chunk;
    }
  }
}
