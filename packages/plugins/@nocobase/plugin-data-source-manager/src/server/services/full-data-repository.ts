/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CountOptions, FindOptions } from '@nocobase/database';

export class FullDataRepository<T> {
  data: Array<T> = [];

  constructor(data: Array<T>) {
    this.data = data;
  }

  async count(countOptions?: CountOptions): Promise<number> {
    return this.data.length;
  }

  async find(options?: FindOptions): Promise<Array<T>> {
    const { limit, offset } = options || {};

    let results = this.data;

    // Handle offset
    if (offset) {
      results = results.slice(offset);
    }

    // Handle limit
    if (limit) {
      results = results.slice(0, limit);
    }

    return results;
  }

  async findAndCount(options: {} = {}): Promise<[Array<T>, number]> {
    const count = await this.count();
    const results = count ? await this.find(options) : [];

    return [results, count];
  }
}
