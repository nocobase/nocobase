/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Op, cast, where, col, Sequelize } from 'sequelize';
import { isPg } from './utils';

function escapeLike(value: string) {
  return value.replace(/[_%]/g, '\\$&');
}

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

// Helper function to handle field casting for PostgreSQL
function getFieldExpression(value, ctx, operator) {
  if (isPg(ctx)) {
    const fieldName = getFieldName(ctx);
    const queryInterface = ctx.db.sequelize.getQueryInterface();
    const quotedField = queryInterface.quoteIdentifiers(fieldName);

    return Sequelize.literal(`CAST(${quotedField} AS TEXT) ${operator} ${ctx.db.sequelize.escape(value)}`);
  }

  // For MySQL and other databases, return the operator directly
  const op =
    operator === 'LIKE'
      ? Op.like
      : operator === 'NOT LIKE'
        ? Op.notLike
        : operator === 'ILIKE'
          ? Op.like
          : operator === 'NOT ILIKE'
            ? Op.notLike
            : Op.like;

  return { [op]: value };
}

export default {
  $includes(value, ctx) {
    if (value === null) {
      return {
        [Op.is]: null,
      };
    }
    if (Array.isArray(value)) {
      const conditions = value.map((item) =>
        getFieldExpression(`%${escapeLike(item)}%`, ctx, isPg(ctx) ? 'ILIKE' : 'LIKE'),
      );

      return {
        [Op.or]: conditions,
      };
    }

    return getFieldExpression(`%${escapeLike(value)}%`, ctx, isPg(ctx) ? 'ILIKE' : 'LIKE');
  },

  $notIncludes(value, ctx) {
    if (value === null) {
      return {
        [Op.not]: null,
      };
    }
    if (Array.isArray(value)) {
      const conditions = value.map((item) =>
        getFieldExpression(`%${escapeLike(item)}%`, ctx, isPg(ctx) ? 'NOT ILIKE' : 'NOT LIKE'),
      );

      return {
        [Op.and]: conditions,
      };
    }

    return getFieldExpression(`%${escapeLike(value)}%`, ctx, isPg(ctx) ? 'NOT ILIKE' : 'NOT LIKE');
  },

  $startsWith(value, ctx) {
    if (Array.isArray(value)) {
      const conditions = value.map((item) =>
        getFieldExpression(`${escapeLike(item)}%`, ctx, isPg(ctx) ? 'ILIKE' : 'LIKE'),
      );

      return {
        [Op.or]: conditions,
      };
    }

    return getFieldExpression(`${escapeLike(value)}%`, ctx, isPg(ctx) ? 'ILIKE' : 'LIKE');
  },

  $notStartsWith(value, ctx) {
    if (Array.isArray(value)) {
      const conditions = value.map((item) =>
        getFieldExpression(`${escapeLike(item)}%`, ctx, isPg(ctx) ? 'NOT ILIKE' : 'NOT LIKE'),
      );

      return {
        [Op.and]: conditions,
      };
    }

    return getFieldExpression(`${escapeLike(value)}%`, ctx, isPg(ctx) ? 'NOT ILIKE' : 'NOT LIKE');
  },

  $endWith(value, ctx) {
    if (Array.isArray(value)) {
      const conditions = value.map((item) =>
        getFieldExpression(`%${escapeLike(item)}`, ctx, isPg(ctx) ? 'ILIKE' : 'LIKE'),
      );

      return {
        [Op.or]: conditions,
      };
    }

    return getFieldExpression(`%${escapeLike(value)}`, ctx, isPg(ctx) ? 'ILIKE' : 'LIKE');
  },

  $notEndWith(value, ctx) {
    if (Array.isArray(value)) {
      const conditions = value.map((item) =>
        getFieldExpression(`%${escapeLike(item)}`, ctx, isPg(ctx) ? 'NOT ILIKE' : 'NOT LIKE'),
      );

      return {
        [Op.and]: conditions,
      };
    }

    return getFieldExpression(`%${escapeLike(value)}`, ctx, isPg(ctx) ? 'NOT ILIKE' : 'NOT LIKE');
  },
} as Record<string, any>;
