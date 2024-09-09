/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseColumnFieldOptions, Field } from './field';
import { DataTypes, Sequelize } from 'sequelize';
import sqlParser from '../sql-parser';

export class SubqueryField extends Field {
  get dataType() {
    return DataTypes.VIRTUAL;
  }

  init() {
    const { name, sql } = this.options;

    this.listener = async (attributes) => {
      const pushTarget = attributes?.include ? attributes.include : attributes;

      if (pushTarget.length == 0 || pushTarget.indexOf(name) !== -1) {
        pushTarget.push([Sequelize.literal(`(${sql})`), name]);
      }
    };

    this.onSelectQuery = (options) => {
      const { collection } = options;
      const collectionName = collection.name;
      const fieldName = name;
      const str = this.database.sequelize.getQueryInterface().quoteIdentifiers(`${collectionName}.${fieldName}`);
      if (options.sql.includes(str)) {
        const newSQL = options.sql.replace(str, `(${sql})`);
        options.sql = newSQL;
      }
    };
  }

  bind() {
    super.bind();
    this.collection.on('beforeParseAttributes', this.listener);
    this.collection.on('selectQuery', this.onSelectQuery);
  }
  unbind() {
    super.unbind();
    this.collection.off('beforeParseAttributes', this.listener);
    this.collection.off('selectQuery', this.onSelectQuery);
  }
}

export interface SubqueryFieldOptions extends BaseColumnFieldOptions {
  type: 'subquery';
  sql: string;
}
