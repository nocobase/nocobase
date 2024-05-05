/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Repository } from '../repository';
import { BaseValueParser } from './base-value-parser';

export class ToOneValueParser extends BaseValueParser {
  async setValue(value: any) {
    const dataIndex = this.ctx?.column?.dataIndex || [];
    if (Array.isArray(dataIndex) && dataIndex.length < 2) {
      this.errors.push(`data index invalid`);
      return;
    }
    const key = this.ctx.column.dataIndex[1];
    const repository = this.field.database.getRepository(this.field.target) as Repository;
    const instance = await repository.findOne({ filter: { [key]: this.trim(value) } });
    if (instance) {
      this.value = instance.get(this.field.targetKey || 'id');
    } else {
      this.errors.push(`"${value}" does not exist`);
    }
  }
}
