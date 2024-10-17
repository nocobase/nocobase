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

export class OracleQueryParser extends QueryParser {
  parseOrders(ctx: Context, orders: OrderProps[], hasAgg: boolean) {
    const { collection: collectionName } = ctx.action.params.values as QueryParams;
    const collection = this.db.getCollection(collectionName);
    const order = super.parseOrders(ctx, orders, hasAgg);
    if (!order.length) {
      let filterTks = collection.filterTargetKey;
      if (!Array.isArray(filterTks)) {
        filterTks = [filterTks];
      }
      filterTks.forEach((filterTk) => {
        order.push([this.db.sequelize.col(filterTk), 'ASC']);
      });
    }
    return order;
  }
}
