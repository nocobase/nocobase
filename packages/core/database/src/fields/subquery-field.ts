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

export class SubqueryField extends Field {
  get dataType() {
    return DataTypes.VIRTUAL;
  }

  init() {
    const { name, sql } = this.options;

    this.listener = async (attributes) => {
      const pushTarget = attributes?.include ? attributes.include : attributes;

      pushTarget.push([Sequelize.literal(`(${sql})`), name]);
    };
  }

  bind() {
    super.bind();
    this.collection.on('beforeParseAttributes', this.listener);
  }
  unbind() {
    super.unbind();
    this.collection.off('beforeParseAttributes', this.listener);
  }
}

export interface SubqueryFieldOptions extends BaseColumnFieldOptions {
  type: 'subquery';
  sql: string;
}
