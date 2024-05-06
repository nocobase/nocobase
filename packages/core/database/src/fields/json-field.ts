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

export class JsonField extends Field {
  get dataType() {
    const dialect = this.context.database.sequelize.getDialect();
    const { jsonb } = this.options;
    if (dialect === 'postgres' && jsonb) {
      return DataTypes.JSONB;
    }
    return DataTypes.JSON;
  }
}

export interface JsonFieldOptions extends BaseColumnFieldOptions {
  type: 'json';
}

export class JsonbField extends Field {
  get dataType() {
    const dialect = this.context.database.sequelize.getDialect();
    if (dialect === 'postgres') {
      return DataTypes.JSONB;
    }
    return DataTypes.JSON;
  }
}

export interface JsonbFieldOptions extends BaseColumnFieldOptions {
  type: 'jsonb';
}
