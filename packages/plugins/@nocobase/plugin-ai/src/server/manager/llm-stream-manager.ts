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

const CACHE_NAME = 'ai-llm-stream-cache';
const CACHE_TTL = 10 * 60 * 1000;
const STREAM_END_MARK = '"type":"stream_end"';
const SKIPPED_MARK = '__skipped__';
const DEFAULT_INITIAL_WAIT_TIMEOUT = 10000;

type LLMStreamOptions = {
  pollInterval?: number;
  initialWaitTimeout?: number;
  signal?: AbortSignal;
};

export class LLMStreamCachedManager {
  private cachePromise?: Promise<Cache>;

  constructor(private readonly plugin: PluginAIServer) {}

  getCached(sessionId: string) {
    if (this.store !== 'memory') {
      return new BufferedLLMStreamCached(sessionId, this);
    }
    return new LLMStreamCached(sessionId, this);
  }

  async clear(sessionId: string) {
    const cache = await this.getCache();
    await cache.del(sessionId);
  }

  async append(sessionId: string, chunk: string) {
    const cache = await this.getCache();
    const chunks = (await cache.get<string[]>(sessionId)) ?? [];
    chunks.push(chunk);
    await cache.set(sessionId, chunks, CACHE_TTL);
  }

  async *stream(sessionId: string, options?: LLMStreamOptions): AsyncGenerator<string, void, void> {
    const pollInterval = options?.pollInterval ?? (this.store !== 'memory' ? 1000 : 100);
    const initialWaitTimeout = options?.initialWaitTimeout ?? DEFAULT_INITIAL_WAIT_TIMEOUT;
    const signal = options?.signal;
    let offset = 0;
    let waited = 0;
    let completed = false;

    while (!completed) {
      if (signal?.aborted) {
        return;
      }

      const chunks = await this.getChunks(sessionId);
      const lastSkippedIndex = chunks.lastIndexOf(SKIPPED_MARK);
      let hasNewChunks = false;

      if (lastSkippedIndex >= offset) {
        offset = lastSkippedIndex + 1;
      }

      while (offset < chunks.length) {
        if (signal?.aborted) {
          return;
        }
        hasNewChunks = true;
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

      if (!hasNewChunks) {
        if (waited >= initialWaitTimeout) {
          return;
        }
        waited += pollInterval;
      }

      if (await abortableSleep(pollInterval, signal)) {
        return;
      }
    }
  }

  private async getChunks(sessionId: string) {
    const cache = await this.getCache();
    return (await cache.get<string[]>(sessionId)) ?? [];
  }

  private async getCache() {
    this.cachePromise ??= this.plugin.app.cacheManager.createCache({
      name: CACHE_NAME,
      store: this.store,
    });
    return this.cachePromise;
  }

  private get store() {
    return this.plugin.app.options.cacheManager?.defaultStore ?? 'memory';
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

  async *stream(options?: LLMStreamOptions): AsyncGenerator<string, void, void> {
    for await (const chunk of this.manager.stream(this.sessionId, options)) {
      yield chunk;
    }
  }
}

export class BufferedLLMStreamCached extends LLMStreamCached {
  private buffer = new ChunksBuffer();
  private interval: NodeJS.Timeout | undefined;

  async clear() {
    clearInterval(this.interval);
    delete this.interval;
    await this.flush();
    await super.clear();
  }

  async append(chunk: string) {
    if (!this.interval) {
      this.interval = setInterval(() => {
        void this.flush();
      }, 1000);
    }
    this.buffer.append(chunk);
  }

  private async flush() {
    if (this.buffer.isEmpty()) {
      return;
    }
    const chunks = this.buffer.compact();
    this.buffer.clear();
    const appendChunks = async () => {
      for (const chunk of chunks) {
        await super.append(chunk);
      }
    };
    await appendChunks();
  }
}

class ChunksBuffer {
  private _size = 0;
  private _chunks: string[] = [];

  append(chunk: string) {
    this._size += chunk.length;
    this._chunks.push(chunk);
  }

  clear() {
    this._size = 0;
    this._chunks = [];
  }

  isEmpty() {
    return this._size === 0;
  }

  get size() {
    return this._size;
  }

  get chunks() {
    return this._chunks;
  }

  compact() {
    const chunks: string[] = [];
    let buffer = '';

    for (const chunk of this._chunks) {
      if (chunk === SKIPPED_MARK) {
        if (buffer) {
          chunks.push(buffer);
          buffer = '';
        }
        chunks.push(SKIPPED_MARK);
      } else {
        buffer += chunk;
      }
    }

    if (buffer) {
      chunks.push(buffer);
    }

    return chunks;
  }
}

function abortableSleep(ms: number, signal?: AbortSignal): Promise<boolean> {
  if (signal?.aborted) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      cleanup();
      resolve(false);
    }, ms);
    const cleanup = () => {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abort);
    };
    const abort = () => {
      cleanup();
      resolve(true);
    };

    signal?.addEventListener('abort', abort, { once: true });
  });
}
