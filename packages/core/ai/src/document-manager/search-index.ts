/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Index as BaseIndex, ExportHandler, IndexOptions } from 'flexsearch';
import { IdMapper } from './id-mapper';

export class Index {
  private index: BaseIndex;
  private ids = new IdMapper();

  constructor(options?: IndexOptions) {
    this.index = new BaseIndex(options);
  }

  async add(id: string | number, text: string) {
    const numericId = this.ids.toNumeric(id);
    return this.index.addAsync(numericId, text);
  }

  async remove(id: string | number) {
    const numericId = this.ids.getNumeric(id);
    if (numericId === undefined) {
      return;
    }

    await this.index.removeAsync(numericId);
    this.ids.remove(id);
  }

  async search(query: string, options?: any): Promise<(string | number)[]> {
    const result = (await this.index.searchAsync(query, options)) as number[];
    return result.map((id) => this.ids.toExternal(id));
  }

  export(handler: ExportHandler) {
    return this.index.export(handler);
  }

  import(key: string, data: string) {
    return this.index.import(key, data);
  }
}
