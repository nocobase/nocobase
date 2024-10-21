/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { QueryParser } from './query-parser';
import { OrderProps, QueryParams } from '../types';
import { Context } from '@nocobase/actions';
import { OracleFormatter } from '../formatter/oracle-formatter';
import { Database } from '@nocobase/database';

export class OracleQueryParser extends QueryParser {
  declare formatter: OracleFormatter;

  constructor(db: Database) {
    super(db);
    this.formatter = new OracleFormatter(db.sequelize);
  }

  parseOrders(ctx: Context, orders: OrderProps[], hasAgg: boolean) {
    const { collection: collectionName, dimensions } = ctx.action.params.values as QueryParams;
    const collection = this.db.getCollection(collectionName);
    if (!orders.length) {
      if (dimensions.length) {
        orders.push(dimensions[0]);
      } else {
        let filterTks = collection.filterTargetKey;
        if (!Array.isArray(filterTks)) {
          filterTks = [filterTks];
        }
        orders.push(...filterTks.map((field) => ({ field, alias: field })));
      }
    }
    const order = super.parseOrders(ctx, orders, hasAgg);
    return order;
  }
}
