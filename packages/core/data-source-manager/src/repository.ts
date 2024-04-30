/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* istanbul ignore file -- @preserve */

import { IModel, IRepository } from './types';
import * as console from 'console';

export class Repository implements IRepository {
  async create(options) {
    console.log('Repository.create....');
  }

  async update(options) {}

  async find(options?: any): Promise<IModel[]> {
    return [];
  }

  async findOne(options?: any): Promise<IModel> {
    return {
      toJSON() {
        return {};
      },
    };
  }

  async destroy(options) {}

  count(options?: any): Promise<Number> {
    return Promise.resolve(undefined);
  }

  findAndCount(options?: any): Promise<[IModel[], Number]> {
    return Promise.resolve([[], undefined]);
  }
}
