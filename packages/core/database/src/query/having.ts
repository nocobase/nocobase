/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isPlainObject } from 'lodash';
import { Op, WhereOptions } from 'sequelize';
import { Database } from '../database';
import { QueryFormatter } from './formatter';

type QueryFieldMeta = {
  field: string;
  alias?: string;
  aggregation?: string;
  distinct?: boolean;
  format?: string;
  type?: string;
  options?: any;
};

function buildFieldExpression(
  database: Database,
  formatter: QueryFormatter,
  fieldMap: Record<string, QueryFieldMeta>,
  key: string,
  timezone?: string,
) {
  const meta = fieldMap[key];
  if (!meta) {
    throw new Error(`Invalid having field: ${key}`);
  }

  const col = database.sequelize.col(meta.field);

  if (meta.aggregation) {
    return database.sequelize.fn(meta.aggregation, meta.distinct ? database.sequelize.fn('DISTINCT', col) : col);
  }

  if (meta.format) {
    return formatter.format({
      type: meta.type as string,
      field: meta.field,
      format: meta.format,
      timezone,
      fieldOptions: meta.options,
    });
  }

  return col;
}

function isOperatorCondition(database: Database, value: unknown) {
  return isPlainObject(value) && Object.keys(value).some((key) => database.operators.has(key));
}

function buildFieldCondition(
  database: Database,
  formatter: QueryFormatter,
  fieldMap: Record<string, QueryFieldMeta>,
  key: string,
  value: any,
  timezone?: string,
) {
  const field = buildFieldExpression(database, formatter, fieldMap, key, timezone);

  if (!isOperatorCondition(database, value)) {
    return database.sequelize.where(field, { [Op.eq]: value });
  }

  const condition = {};
  for (const [operatorKey, operatorValue] of Object.entries(value)) {
    const operator = database.operators.get(operatorKey);
    if (typeof operator !== 'symbol') {
      throw new Error(`Unsupported having operator: ${operatorKey}`);
    }
    condition[operator] = operatorValue;
  }

  return database.sequelize.where(field, condition);
}

function buildHavingNode(
  database: Database,
  formatter: QueryFormatter,
  fieldMap: Record<string, QueryFieldMeta>,
  node: any,
  timezone?: string,
): WhereOptions {
  if (!isPlainObject(node)) {
    throw new Error('Having must be an object');
  }

  const conditions = [];

  for (const [key, value] of Object.entries(node)) {
    if ((key === '$and' || key === '$or') && Array.isArray(value)) {
      const operator = database.operators.get(key);
      if (typeof operator !== 'symbol') {
        throw new Error(`Unsupported having operator: ${key}`);
      }
      conditions.push({
        [operator]: value.map((item) => buildHavingNode(database, formatter, fieldMap, item, timezone)),
      });
      continue;
    }

    conditions.push(buildFieldCondition(database, formatter, fieldMap, key, value, timezone));
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return {
    [Op.and]: conditions,
  };
}

export function buildHaving(
  database: Database,
  formatter: QueryFormatter,
  fieldMap: Record<string, QueryFieldMeta>,
  having?: any,
  timezone?: string,
) {
  if (!having) {
    return undefined;
  }

  return buildHavingNode(database, formatter, fieldMap, having, timezone);
}
