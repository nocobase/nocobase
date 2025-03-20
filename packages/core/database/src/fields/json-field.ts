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
import _ from 'lodash';

export class JsonField extends Field {
  get dataType() {
    const dialect = this.context.database.sequelize.getDialect();
    const { jsonb } = this.options;
    if (dialect === 'postgres' && jsonb) {
      return DataTypes.JSONB;
    }
    if (dialect === 'mssql') {
      return DataTypes.TEXT;
    }
    return DataTypes.JSON;
  }

  toSequelize() {
    const opts = super.toSequelize();
    if (opts.name?.includes('attachments') || opts.name?.includes('meta')) {
      console.log(222);
    }
    if (this.database.sequelize.getDialect() === 'mssql' && _.isObjectLike(opts.defaultValue)) {
      opts.defaultValue = JSON.stringify(opts.defaultValue);
    }
    return opts;
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
    if (dialect === 'mssql') {
      return DataTypes.TEXT;
    }
    return DataTypes.JSON;
  }

  toSequelize() {
    const opts = super.toSequelize();
    if (this.database.sequelize.getDialect() === 'mssql' && _.isObjectLike(opts.defaultValue)) {
      opts.defaultValue = JSON.stringify(opts.defaultValue);
    }
    return opts;
  }
}

export interface JsonbFieldOptions extends BaseColumnFieldOptions {
  type: 'jsonb';
}
