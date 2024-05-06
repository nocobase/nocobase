/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataSource } from './data-source';

export class DataSourceFactory {
  public collectionTypes: Map<string, typeof DataSource> = new Map();

  register(type: string, dataSourceClass: typeof DataSource) {
    this.collectionTypes.set(type, dataSourceClass);
  }

  getClass(type: string): typeof DataSource {
    return this.collectionTypes.get(type);
  }

  create(type: string, options: any = {}): DataSource {
    const klass = this.collectionTypes.get(type);
    if (!klass) {
      throw new Error(`Data source type "${type}" not found`);
    }

    // @ts-ignore
    return new klass(options);
  }
}
