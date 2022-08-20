import { Op, Sequelize } from 'sequelize';
import { isMySQL, isPg } from './utils';

const getFieldName = (ctx) => {
  const fieldName = ctx.fieldName;
  return fieldName;
};

const escape = (value, ctx) => {
  const sequelize: Sequelize = ctx.db.sequelize;
  return sequelize.escape(value);
};

const sqliteExistQuery = (value, ctx) => {
  const fieldName = getFieldName(ctx);
  const name = ctx.fullName === fieldName ? `"${ctx.model.name}"."${fieldName}"` : `"${fieldName}"`;

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

  return `(select ${ifNull}(${funcName}(${fieldName}), 0) ${operator} 0)`;
};

export default {
  $match(value, ctx) {
    const fieldName = getFieldName(ctx);

    if (isPg(ctx)) {
      return {
        [Op.contained]: value,
        [Op.contains]: value,
      };
    }

    value = escape(JSON.stringify(value.sort()), ctx);

    if (isMySQL(ctx)) {
      const name = ctx.fullName === fieldName ? `\`${ctx.model.name}\`.\`${fieldName}\`` : `\`${fieldName}\``;
      return Sequelize.literal(`JSON_CONTAINS(${name}, ${value}) AND JSON_CONTAINS(${value}, ${name})`);
    }

    return {
      [Op.eq]: Sequelize.literal(`json(${value})`),
    };
  },

  $notMatch(value, ctx) {
    const fieldName = getFieldName(ctx);
    value = escape(JSON.stringify(value), ctx);

    if (isPg(ctx)) {
      const name = ctx.fullName === fieldName ? `"${ctx.model.name}"."${fieldName}"` : `"${fieldName}"`;
      return Sequelize.literal(`not (${name} <@ ${value}::JSONB and ${name} @> ${value}::JSONB)`);
    }

    if (isMySQL(ctx)) {
      const name = ctx.fullName === fieldName ? `\`${ctx.model.name}\`.\`${fieldName}\`` : `\`${fieldName}\``;
      return Sequelize.literal(`not (JSON_CONTAINS(${name}, ${value}) AND JSON_CONTAINS(${value}, ${name}))`);
    }
    return {
      [Op.ne]: Sequelize.literal(`json(${value})`),
    };
  },

  $anyOf(value, ctx) {
    const fieldName = getFieldName(ctx);

    if (isPg(ctx)) {
      const name = ctx.fullName === fieldName ? `"${ctx.model.name}"."${fieldName}"` : `"${fieldName}"`;
      return Sequelize.literal(
        `${name} ?| ${escape(
          value.map((i) => `${i}`),
          ctx,
        )}`,
      );
    }

    if (isMySQL(ctx)) {
      value = escape(JSON.stringify(value), ctx);
      const name = ctx.fullName === fieldName ? `\`${ctx.model.name}\`.\`${fieldName}\`` : `\`${fieldName}\``;
      return Sequelize.literal(`JSON_OVERLAPS(${name}, ${value})`);
    }

    const subQuery = sqliteExistQuery(value, ctx);

    return Sequelize.literal(subQuery);
  },

  $noneOf(value, ctx) {
    let where;

    if (isPg(ctx)) {
      const fieldName = getFieldName(ctx);
      const name = ctx.fullName === fieldName ? `"${ctx.model.name}"."${fieldName}"` : `"${fieldName}"`;
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
      const name = ctx.fullName === fieldName ? `\`${ctx.model.name}\`.\`${fieldName}\`` : `\`${fieldName}\``;
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
};
