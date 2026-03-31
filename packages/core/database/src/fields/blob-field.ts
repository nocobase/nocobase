/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';

export class BlobField extends Field {
  get dataType() {
    if (this.options.length) {
      return DataTypes.BLOB(this.options.length);
    }
    return DataTypes.BLOB;
  }
}

export interface BlobFieldOptions extends BaseColumnFieldOptions {
  type: 'blob';
  length?: 'tiny' | 'medium' | 'long';
}
