/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import { DimensionProps, MeasureProps, OrderProps } from '../types';
import { Formatter } from '../formatter/formatter';
import { Database } from '@nocobase/database';

const AllowedAggFuncs = ['sum', 'count', 'avg', 'min', 'max'];

export class QueryParser {
  db: Database;
  formatter: Formatter;

  constructor(db: Database) {
    this.db = db;
    this.formatter = {
      format: ({ field }) => db.sequelize.col(field),
    } as Formatter;
  }

  parseMeasures(ctx: Context, measures: MeasureProps[]) {
    let hasAgg = false;
    const sequelize = this.db.sequelize;
    const attributes = [];
    const fieldMap = {};
    measures.forEach((measure: MeasureProps & { field: string }) => {
      const { field, aggregation, alias, distinct } = measure;
      const attribute = [];
      const col = sequelize.col(field);
      if (aggregation) {
        if (!AllowedAggFuncs.includes(aggregation)) {
          throw new Error(`Invalid aggregation function: ${aggregation}`);
        }
        hasAgg = true;
        attribute.push(sequelize.fn(aggregation, distinct ? sequelize.fn('DISTINCT', col) : col));
      } else {
        attribute.push(col);
      }
      if (alias) {
        attribute.push(alias);
      }
      attributes.push(attribute.length > 1 ? attribute : attribute[0]);
      fieldMap[alias || field] = measure;
    });
    return { attributes, fieldMap, hasAgg };
  }

  parseDimensions(ctx: Context, dimensions: (DimensionProps & { field: string })[], hasAgg: boolean, timezone: string) {
    const sequelize = this.db.sequelize;
    const attributes = [];
    const group = [];
    const fieldMap = {};
    dimensions.forEach((dimension: DimensionProps & { field: string }) => {
      const { field, format, alias, type, options } = dimension;
      const attribute = [];
      const col = sequelize.col(field);
      if (format) {
        attribute.push(this.formatter.format({ type, field, format, timezone, options }));
      } else {
        attribute.push(col);
      }
      if (alias) {
        attribute.push(alias);
      }
      attributes.push(attribute.length > 1 ? attribute : attribute[0]);
      if (hasAgg) {
        group.push(attribute[0]);
      }
      fieldMap[alias || field] = dimension;
    });
    return { attributes, group, fieldMap };
  }

  parseOrders(ctx: Context, orders: OrderProps[], hasAgg: boolean) {
    const sequelize = this.db.sequelize;
    const order = [];
    orders.forEach((item: OrderProps) => {
      const alias = sequelize.getQueryInterface().quoteIdentifier(item.alias);
      const name = hasAgg ? sequelize.literal(alias) : sequelize.col(item.field as string);
      let sort = item.order || 'ASC';
      if (item.nulls === 'first') {
        sort += ' NULLS FIRST';
      }
      if (item.nulls === 'last') {
        sort += ' NULLS LAST';
      }
      order.push([name, sort]);
    });
    return order;
  }

  parse() {
    return async (ctx: Context, next: Next) => {
      const { measures, dimensions, orders, include, where, limit, offset } = ctx.action.params.values;
      const { attributes: measureAttributes, fieldMap: measureFieldMap, hasAgg } = this.parseMeasures(ctx, measures);
      const {
        attributes: dimensionAttributes,
        group,
        fieldMap: dimensionFieldMap,
      } = this.parseDimensions(ctx, dimensions, hasAgg, ctx.get?.('x-timezone'));
      const order = this.parseOrders(ctx, orders, hasAgg);

      const queryParams = {
        where,
        attributes: [...measureAttributes, ...dimensionAttributes],
        include,
        group,
        order,
        subQuery: false,
        raw: true,
      };
      if (!hasAgg || dimensions.length) {
        queryParams['limit'] = limit || 2000;
        queryParams['offset'] = offset || 0;
      }
      ctx.action.params.values = {
        ...ctx.action.params.values,
        queryParams,
        fieldMap: { ...measureFieldMap, ...dimensionFieldMap },
      };
      await next();
    };
  }
}
