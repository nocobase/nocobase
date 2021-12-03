import { Op, Sequelize } from 'sequelize';
import { filter } from 'lodash';

const sqliteExistQuery = (value, ctx) => {
  const paths = ctx.path.split('.');
  const fieldName = paths[paths.length - 2];

  const sqlArray = `(${value
    .map((v) => JSON.stringify(v.toString()))
    .join(', ')})`;

  const subQuery = `exists (select * from json_each(${fieldName}) where json_each.value in ${sqlArray})`;

  return subQuery;
};

const sqliteEmptyQuery = (ctx, operator: '=' | '>') => {
  const paths = ctx.path.split('.');
  const fieldName = paths[paths.length - 2];

  return `(select IFNULL(json_array_length(${fieldName}), 0) ${operator} 0)`;
};

export default {
  $match(value, ctx) {
    return { [Op.eq]: Sequelize.fn('json', JSON.stringify(value)) };
  },

  $notMatch(value, ctx) {
    return { [Op.ne]: Sequelize.fn('json', JSON.stringify(value)) };
  },

  // TODO sql injection
  $anyOf(value, ctx) {
    const subQuery = sqliteExistQuery(value, ctx);

    return {
      [Op.and]: [Sequelize.literal(subQuery)],
    };
  },

  $noneOf(value, ctx) {
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
