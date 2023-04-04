import JSON5 from 'json5';
import { query } from '../query';

export const getData = async (ctx, next) => {
  const { filterByTk } = ctx.action.params;
  const r = ctx.db.getRepository('chartsQueries');
  try {
    const instance = await r.findOne({ filterByTk });
    const result = await query[instance.type](instance.options, { db: ctx.db, skipError: true });
    if (typeof result === 'string') {
      ctx.body = JSON5.parse(result);
    } else {
      ctx.body = result;
    }
  } catch (error) {
    ctx.body = [];
    ctx.logger.info('chartsQueries', error);
  }
  return next();
};

export const validate = async (ctx, next) => {
  const { values } = ctx.action.params;
  ctx.body = {
    errorMessage: '',
  };
  try {
    await query.sql(values, { db: ctx.db, validateSQL: true });
  } catch (error) {
    ctx.body = {
      errorMessage: error.message,
    };
  }
  return next();
};

export const listMetadata = async (ctx, next) => {
  const r = ctx.db.getRepository('chartsQueries');
  const items = await r.find({ sort: '-id' });
  ctx.body = items.map((item) => {
    return {
      id: item.id,
      title: item.title,
      type: item.type,
      fields: item.fields,
    };
  });
  return next();
};
