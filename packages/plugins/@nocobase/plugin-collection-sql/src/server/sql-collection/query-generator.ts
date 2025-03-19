/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { GroupOption, Order, ProjectionAlias, WhereOptions } from 'sequelize';
import { SQLModel } from './sql-model';
import { lodash } from '@nocobase/utils';
import { Collection } from '@nocobase/database';

export function selectQuery(
  tableName: string,
  options: {
    attributes?: (string | ProjectionAlias)[];
    where?: WhereOptions;
    order?: Order;
    group?: GroupOption;
    limit?: number;
    offset?: number;
  },
  model: SQLModel,
) {
  options = options || {};
  if (lodash.isEmpty(options)) {
    return `${model.sql};`;
  }
  const queryItems = [];
  let attributes = options.attributes && options.attributes.slice();
  if (attributes) {
    const fields = Array.from((model.collection as Collection)?.fields.keys() || []);
    attributes = attributes.filter((attr: any) => attr === '*' || typeof attr !== 'string' || fields.includes(attr));
  }
  attributes = this.escapeAttributes(attributes, { model });
  attributes = attributes || ['*'];

  // Add WHERE to sub or main query
  if (Object.prototype.hasOwnProperty.call(options, 'where')) {
    options.where = this.getWhereConditions(options.where, model.name, model, options);
    if (options.where) {
      queryItems.push(` WHERE ${options.where}`);
    }
  }

  // Add GROUP BY to sub or main query
  if (options.group) {
    options.group = Array.isArray(options.group)
      ? options.group.map((t) => this.aliasGrouping(t, model, model.name, options)).join(', ')
      : this.aliasGrouping(options.group, model, model.name, options);

    if (options.group) {
      queryItems.push(` GROUP BY ${options.group}`);
    }
  }

  // Add ORDER to sub or main query
  if (options.order) {
    const orders = this.getQueryOrders(options, model, false);
    if (orders.mainQueryOrder.length) {
      queryItems.push(` ORDER BY ${orders.mainQueryOrder.join(', ')}`);
    }
  }

  // Add LIMIT, OFFSET to sub or main query
  const limitOrder = this.addLimitAndOffset(options, model);
  if (limitOrder) {
    queryItems.push(limitOrder);
  }

  const query = `SELECT ${attributes.join(', ')} FROM (${model.sql}) ${this.getAliasToken()} ${this.quoteIdentifier(
    model.name,
  )}${queryItems.join('')}`;

  return `${query};`;
}
