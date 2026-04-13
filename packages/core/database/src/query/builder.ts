/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FindOptions as SequelizeFindOptions, Order } from 'sequelize';
import { BelongsToArrayAssociation } from '../belongs-to-array/belongs-to-array-repository';
import { Collection } from '../collection';
import { Database } from '../database';
import { Field } from '../fields';
import FilterParser from '../filter-parser';
import { Col, QueryFormatter } from './formatter';
import { MySQLQueryFormatter } from './formatters/mysql';
import { OracleQueryFormatter } from './formatters/oracle';
import { PostgresQueryFormatter } from './formatters/postgres';
import { SQLiteQueryFormatter } from './formatters/sqlite';
import { buildHaving } from './having';
import { QueryField, QueryOptions } from './types';

type QuerySelection = { field: QueryField; alias?: string };

const ALLOWED_AGG_FUNCS = ['sum', 'count', 'avg', 'min', 'max'];
const ALLOWED_ORDER_DIRECTIONS = ['ASC', 'DESC'];

function createQueryFormatter(database: Database): QueryFormatter {
  switch (database.sequelize.getDialect()) {
    case 'sqlite':
      return new SQLiteQueryFormatter(database.sequelize);
    case 'postgres':
      return new PostgresQueryFormatter(database.sequelize);
    case 'mysql':
    case 'mariadb':
      return new MySQLQueryFormatter(database.sequelize);
    case 'oracle':
      return new OracleQueryFormatter(database.sequelize);
    default:
      return new (class extends QueryFormatter {
        formatDate(field: Col, _format: string, _timezone?: string) {
          return field;
        }
        formatUnixTimestamp(field: string, _format: string, _accuracy?: 'second' | 'millisecond', _timezone?: string) {
          return this.sequelize.col(field);
        }
      })(database.sequelize);
  }
}

function parseSelectedField(database: Database, collection: Collection, selected: QuerySelection) {
  const collectionName = collection.name;
  const fields = collection.fields;
  let target: string | undefined;
  let name: string;
  const fieldPath = Array.isArray(selected.field) ? selected.field : selected.field.split('.').filter(Boolean);

  if (fieldPath.length === 1) {
    name = fieldPath[0];
  } else {
    [target, name] = fieldPath;
  }

  const rawAttributes = collection.model.getAttributes();
  let field = rawAttributes[name]?.field || name;
  let fieldType = fields.get(name)?.type;
  let fieldOptions = fields.get(name)?.options;

  if (target) {
    const targetField = fields.get(target) as Field;
    const targetCollection = database.getCollection(targetField.target as string);
    const targetFields = targetCollection.fields;
    fieldType = targetFields.get(name)?.type;
    fieldOptions = targetFields.get(name)?.options;
    field = `${target}.${field}`;
    name = `${target}.${name}`;
  } else {
    field = `${collectionName}.${field}`;
  }

  return {
    ...selected,
    field,
    name,
    type: fieldType,
    options: fieldOptions,
    alias: selected.alias || name,
    target,
  };
}

export function buildQuery(database: Database, collection: Collection, options: QueryOptions = {}) {
  const sequelize = database.sequelize;
  const formatter = createQueryFormatter(database);
  const measures = (options.measures || []).map((measure) => parseSelectedField(database, collection, measure));
  const dimensions = (options.dimensions || []).map((dimension) => parseSelectedField(database, collection, dimension));
  const orders = (options.orders || []).map((order) => parseSelectedField(database, collection, order));
  const models: Record<string, { type?: string }> = {};

  [...measures, ...dimensions, ...orders].forEach((item: any) => {
    if (item.target && !models[item.target]) {
      models[item.target] = { type: collection.fields.get(item.target)?.type };
    }
  });

  const include = Object.entries(models).map(([target, { type }]) => {
    let includeOptions: any = {
      association: target,
      attributes: [],
    };
    if (type === 'belongsToMany') {
      includeOptions.through = { attributes: [] };
    }
    if (type === 'belongsToArray') {
      const association = collection.model.associations[target] as unknown as BelongsToArrayAssociation;
      if (association) {
        includeOptions = {
          ...includeOptions,
          ...association.generateInclude(),
        };
      }
    }
    return includeOptions;
  });

  const filterParser = new FilterParser(options.filter, { collection });
  const { where, include: filterInclude } = filterParser.toSequelizeParams();
  if (filterInclude) {
    const stack = [...filterInclude];
    while (stack.length) {
      const item: any = stack.pop();
      const parentCollection = database.getCollection((item.parentCollection || collection.name) as string);
      const field = parentCollection.fields.get(item.association);
      if (field?.type === 'belongsToMany') {
        item.through = { attributes: [] };
      }
      if (field?.target && item.include?.length) {
        for (const child of item.include) {
          child.parentCollection = field.target as string;
          stack.push(child);
        }
      }
    }
  }

  let hasAgg = false;
  const attributes: any[] = [];
  const fieldMap: Record<string, any> = {};
  const projectedFieldMap: Record<string, any> = {};

  measures.forEach((measure: any) => {
    const { field, aggregation, alias, distinct } = measure;
    const col = sequelize.col(field);
    const attribute = [];
    if (aggregation) {
      if (!ALLOWED_AGG_FUNCS.includes(aggregation)) {
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
    projectedFieldMap[alias || field] = attribute[0];
  });

  const group: any[] = [];
  dimensions.forEach((dimension: any) => {
    const { field, format, alias, type, options: fieldOptions } = dimension;
    const attribute = [];
    if (format) {
      attribute.push(formatter.format({ type, field, format, timezone: options.timezone, fieldOptions }));
    } else {
      attribute.push(sequelize.col(field));
    }
    if (alias) {
      attribute.push(alias);
    }
    attributes.push(attribute.length > 1 ? attribute : attribute[0]);
    if (hasAgg) {
      group.push(attribute[0]);
    }
    fieldMap[alias || field] = dimension;
    projectedFieldMap[alias || field] = attribute[0];
  });

  const order: Order = orders.map((item: any) => {
    const alias = sequelize.getQueryInterface().quoteIdentifier(item.alias);
    const projectedField =
      projectedFieldMap[item.alias] || projectedFieldMap[item.name] || projectedFieldMap[item.field as string];
    const name = hasAgg ? projectedField || sequelize.literal(alias) : sequelize.col(item.field as string);
    let sort = ALLOWED_ORDER_DIRECTIONS.includes(item.order?.toUpperCase()) ? item.order.toUpperCase() : 'ASC';
    if (item.nulls === 'first') {
      sort += ' NULLS FIRST';
    }
    if (item.nulls === 'last') {
      sort += ' NULLS LAST';
    }
    return [name, sort] as [typeof name, string];
  });

  const queryOptions: SequelizeFindOptions = {
    where,
    having: buildHaving(database, formatter, fieldMap, options.having, options.timezone),
    attributes,
    include: [...include, ...(filterInclude || [])],
    group,
    order,
    subQuery: false,
    raw: true,
  };

  if (!hasAgg || dimensions.length) {
    queryOptions.limit = options.limit || 2000;
    queryOptions.offset = options.offset || 0;
  }

  return { queryOptions, fieldMap };
}

export function normalizeQueryResult(data: any[], fieldMap: Record<string, any>) {
  return data.map((record: any) => {
    Object.entries(record).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return;
      }
      const type = fieldMap[key]?.type;
      if (['bigInt', 'integer', 'float', 'double', 'decimal'].includes(type)) {
        record[key] = Number(value);
      }
    });
    return record;
  });
}
