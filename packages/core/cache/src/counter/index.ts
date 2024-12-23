/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * @experimental
 * atomic counter
 */
export interface Counter {
  get(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  incr(key: string, ttl: number): Promise<number>;
  incrby(key: string, val: number): Promise<number>;
  incrby(key: string, val: number, ttl: number): Promise<number>;
  reset(key: string): Promise<void>;
}

export { MemoryCounter } from './memory-counter';
export { RedisCounter } from './redis-counter';
export { LockCounter } from './lock-counter';
