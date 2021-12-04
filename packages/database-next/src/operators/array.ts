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

  const subQuery = `exists (select * from json_each(${fieldName}) where json_each.value in ${sqlArray})`;

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

  if (isMySQL(ctx)) {
    funcName = 'json_length';
  }

  return `(select ${ifNull}(${funcName}(${fieldName}), 0) ${operator} 0)`;
};

const getDialect = (ctx) => {
  return ctx.db.sequelize.getDialect();
};

const isPg = (ctx) => {
  return getDialect(ctx) === 'postgres';
};

const isMySQL = (ctx) => {
  return getDialect(ctx) === 'mysql';
};

export default {
  $match(value, ctx) {
    value = escape(JSON.stringify(value.sort()), ctx);

    const fieldName = getFieldName(ctx);
    if (isPg(ctx)) {
      return {
        [Op.contained]: value,
        [Op.contains]: value,
      };
    }

    if (isMySQL(ctx)) {
      return Sequelize.literal(
        `JSON_CONTAINS(${fieldName}, ${value}) AND JSON_CONTAINS(${value}, ${fieldName})`,
      );
    }

    return {
      [Op.eq]: Sequelize.literal(`json(${value})`),
    };
  },

  $notMatch(value, ctx) {
    const fieldName = getFieldName(ctx);
    value = escape(JSON.stringify(value), ctx);

    if (isPg(ctx)) {
      return Sequelize.literal(
        `not (${fieldName} <@ ${escape(
          value,
          ctx,
        )}::JSONB and ${fieldName} @> ${value}::JSONB)`,
      );
    }

    if (isMySQL(ctx)) {
      return Sequelize.literal(
        `not (JSON_CONTAINS(${fieldName}, ${value}) AND JSON_CONTAINS(${value}, ${fieldName}))`,
      );
    }
    return {
      [Op.ne]: Sequelize.literal(`json(${value})`),
    };
  },

  // TODO sql injection
  $anyOf(value, ctx) {
    if (isPg(ctx)) {
      return {
        [Op.contains]: value,
      };
    }

    if (isMySQL(ctx)) {
      const fieldName = getFieldName(ctx);
      value = escape(JSON.stringify(value), ctx);
      return Sequelize.literal(`JSON_OVERLAPS(${fieldName}, ${value})`);
    }

    const subQuery = sqliteExistQuery(value, ctx);

    return Sequelize.literal(subQuery);
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

    if (isMySQL(ctx)) {
      const fieldName = getFieldName(ctx);
      value = escape(JSON.stringify(value), ctx);
      return Sequelize.literal(`NOT JSON_OVERLAPS(${fieldName}, ${value})`);
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
