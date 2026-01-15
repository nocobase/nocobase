/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import MiniSearch, { Options as MiniSearchOptions } from 'minisearch';

export class DocumentManager {
  memoryIndexes: Map<string, MiniSearch> = new Map();

  addMemoeryIndex(name: string, options: MiniSearchOptions) {
    const index = new MiniSearch(options);
    this.memoryIndexes.set(name, index);
    return index;
  }

  getMemoryIndex(name: string): MiniSearch | undefined {
    return this.memoryIndexes.get(name);
  }
}
