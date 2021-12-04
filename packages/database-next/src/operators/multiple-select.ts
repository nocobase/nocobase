import { Op, Sequelize } from 'sequelize';

const getFieldName = (ctx) => {
  const paths = ctx.path.split('.');
  const fieldName = paths[paths.length - 2];
  return fieldName;
};

const escape = (value, ctx) => {
  const sequelize: Sequelize = ctx.db.sequelize;
  return sequelize.escape(value);
};

const sqliteExistQuery = (value, ctx) => {
  const fieldName = getFieldName(ctx);

  const sqlArray = `(${value
    .map((v) => JSON.stringify(v.toString()))
    .join(', ')})`;

  const subQuery = `exists (select * from json_each(${fieldName}) where json_each.value in ${escape(
    sqlArray,
    ctx,
  )})`;

  return subQuery;
};

const sqliteEmptyQuery = (ctx, operator: '=' | '>') => {
  const fieldName = getFieldName(ctx);

  let funcName = 'json_array_length';
  let ifNull = 'IFNULL';

  if (isPg(ctx)) {
    funcName = 'jsonb_array_length';
    ifNull = 'coalesce';
  }

  return `(select ${ifNull}(${funcName}(${fieldName}), 0) ${operator} 0)`;
};

const getDialect = (ctx) => {
  return ctx.db.sequelize.getDialect();
};

const isPg = (ctx) => {
  return getDialect(ctx) === 'postgres';
};

export default {
  $match(value, ctx) {
    if (isPg(ctx)) {
      return {
        [Op.contained]: value,
        [Op.contains]: value,
      };
    }

    return {
      [Op.eq]: Sequelize.fn('json', escape(JSON.stringify(value), ctx)),
    };
  },

  $notMatch(value, ctx) {
    if (isPg(ctx)) {
      const fieldName = getFieldName(ctx);
      // pg single quote
      const queryValue = JSON.stringify(value).replace("'", "''");
      return Sequelize.literal(
        `not (${fieldName} <@ ${escape(
          queryValue,
          ctx,
        )}::JSONB and ${fieldName} @> ${escape(queryValue, ctx)}::JSONB)`,
      );
    }

    return {
      [Op.ne]: Sequelize.fn('json', JSON.stringify(escape(value, ctx))),
    };
  },

  // TODO sql injection
  $anyOf(value, ctx) {
    if (isPg(ctx)) {
      return {
        [Op.contains]: value,
      };
    }

    const subQuery = sqliteExistQuery(value, ctx);

    return {
      [Op.and]: [Sequelize.literal(subQuery)],
    };
  },

  $noneOf(value, ctx) {
    if (isPg(ctx)) {
      const fieldName = getFieldName(ctx);
      // pg single quote
      const queryValue = JSON.stringify(value).replace("'", "''");
      return Sequelize.literal(
        `not (${fieldName} @> ${escape(queryValue, ctx)}::JSONB)`,
      );
    }

    const subQuery = sqliteExistQuery(value, ctx);

    return {
      [Op.and]: [Sequelize.literal(`not ${subQuery}`)],
    };
  },

  $empty(value, ctx) {
    const subQuery = sqliteEmptyQuery(ctx, '=');

    return {
      [Op.and]: [Sequelize.literal(`${subQuery}`)],
    };
  },

  $notEmpty(value, ctx) {
    const subQuery = sqliteEmptyQuery(ctx, '>');

    return {
      [Op.and]: [Sequelize.literal(`${subQuery}`)],
    };
  },
};
