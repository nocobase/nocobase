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
 */
export interface BloomFilter {
  reserve(key: string, errorRate: number, capacity: number): Promise<void>;
  add(key: string, val: string): Promise<void>;
  mAdd(key: string, vals: string[]): Promise<void>;
  exists(key: string, val: string): Promise<boolean>;
}
