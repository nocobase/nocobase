/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { Op, Sequelize } from 'sequelize';
import { isMySQL, isPg } from './utils';

const getFieldName = (ctx) => {
  const fullNameSplit = ctx.fullName.split('.');
  const fieldName = ctx.fieldName;
  let columnName = fieldName;
  const associationPath = [];
  if (fullNameSplit.length > 1) {
    for (let i = 0; i < fullNameSplit.length - 1; i++) {
      associationPath.push(fullNameSplit[i]);
    }
  }

  const getModelFromAssociationPath = () => {
    let model = ctx.model;
    for (const association of associationPath) {
      model = model.associations[association].target;
    }

    return model;
  };

  const model = getModelFromAssociationPath();

  let columnPrefix = model.name;

  if (model.rawAttributes[fieldName]) {
    columnName = model.rawAttributes[fieldName].field || fieldName;
  }

  if (associationPath.length > 0) {
    const association = associationPath.join('->');
    columnPrefix = association;
  }

  columnName = `${columnPrefix}.${columnName}`;
  return columnName;
};

const escape = (value, ctx) => {
  const sequelize: Sequelize = ctx.db.sequelize;
  return sequelize.escape(value);
};

const getQueryInterface = (ctx) => {
  const sequelize = ctx.db.sequelize;
  return sequelize.getQueryInterface();
};

const sqliteExistQuery = (value, ctx) => {
  const fieldName = getFieldName(ctx);
  const queryInterface = getQueryInterface(ctx);

  const name = queryInterface.quoteIdentifiers(fieldName);

  const sqlArray = `(${value.map((v) => `'${v}'`).join(', ')})`;

  const subQuery = `exists (select * from json_each(${name}) where json_each.value in ${sqlArray})`;

  return subQuery;
};

const emptyQuery = (ctx, operator: '=' | '>') => {
  const fieldName = getFieldName(ctx);

  let funcName = 'json_array_length';
  let ifNull = 'IFNULL';

  if (isPg(ctx)) {
    funcName = 'jsonb_array_length';
    ifNull = 'coalesce';
  }

  if (isMySQL(ctx)) {
    funcName = 'json_length';
  }

  const queryInterface = getQueryInterface(ctx);

  return `(select ${ifNull}(${funcName}(${queryInterface.quoteIdentifiers(fieldName)}), 0) ${operator} 0)`;
};

export default {
  $match(value, ctx) {
    const queryInterface = getQueryInterface(ctx);
    const fieldName = getFieldName(ctx);

    if (isPg(ctx)) {
      const name = queryInterface.quoteIdentifiers(fieldName);
      const queryValue = escape(JSON.stringify(value), ctx);
      return Sequelize.literal(`${name} @> ${queryValue}::JSONB AND ${name} <@ ${queryValue}::JSONB`);
    }

    value = escape(JSON.stringify(value.sort()), ctx);

    if (isMySQL(ctx)) {
      const name = queryInterface.quoteIdentifiers(fieldName);
      return Sequelize.literal(`JSON_CONTAINS(${name}, ${value}) AND JSON_CONTAINS(${value}, ${name})`);
    }

    return {
      [Op.eq]: Sequelize.literal(`json(${value})`),
    };
  },

  $notMatch(value, ctx) {
    const queryInterface = getQueryInterface(ctx);
    value = escape(JSON.stringify(value), ctx);

    if (isPg(ctx)) {
      const name = queryInterface.quoteIdentifiers(getFieldName(ctx));
      return Sequelize.literal(`not (${name} <@ ${value}::JSONB and ${name} @> ${value}::JSONB)`);
    }

    if (isMySQL(ctx)) {
      const name = queryInterface.quoteIdentifiers(getFieldName(ctx));
      return Sequelize.literal(`not (JSON_CONTAINS(${name}, ${value}) AND JSON_CONTAINS(${value}, ${name}))`);
    }
    return {
      [Op.ne]: Sequelize.literal(`json(${value})`),
    };
  },

  $anyOf(value, ctx) {
    const fieldName = getFieldName(ctx);
    value = _.castArray(value);
    const queryInterface = getQueryInterface(ctx);

    if (isPg(ctx)) {
      const name = queryInterface.quoteIdentifiers(getFieldName(ctx));
      return Sequelize.literal(
        `${name} ?| ${escape(
          value.map((i) => `${i}`),
          ctx,
        )}`,
      );
    }

    if (isMySQL(ctx)) {
      value = escape(JSON.stringify(value), ctx);
      const name = queryInterface.quoteIdentifiers(getFieldName(ctx));
      return Sequelize.literal(`JSON_OVERLAPS(${name}, ${value})`);
    }

    const subQuery = sqliteExistQuery(value, ctx);

    return Sequelize.literal(subQuery);
  },

  $noneOf(value, ctx) {
    let where;
    value = _.castArray(value);

    const queryInterface = getQueryInterface(ctx);

    if (isPg(ctx)) {
      const name = queryInterface.quoteIdentifiers(getFieldName(ctx));
      // pg single quote
      where = Sequelize.literal(
        `not (${name} ?| ${escape(
          value.map((i) => `${i}`),
          ctx,
        )})`,
      );
    } else if (isMySQL(ctx)) {
      const fieldName = getFieldName(ctx);
      value = escape(JSON.stringify(value), ctx);
      const name = queryInterface.quoteIdentifiers(getFieldName(ctx));
      where = Sequelize.literal(`NOT JSON_OVERLAPS(${name}, ${value})`);
    } else {
      const subQuery = sqliteExistQuery(value, ctx);

      where = Sequelize.literal(`not ${subQuery}`);
    }

    return {
      [Op.or]: [where, { [Op.is]: null }],
    };
  },

  $arrayEmpty(value, ctx) {
    const subQuery = emptyQuery(ctx, '=');

    return {
      [Op.and]: [Sequelize.literal(`${subQuery}`)],
    };
  },

  $arrayNotEmpty(value, ctx) {
    const subQuery = emptyQuery(ctx, '>');

    return {
      [Op.and]: [Sequelize.literal(`${subQuery}`)],
    };
  },
} as Record<string, any>;
