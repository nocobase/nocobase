import { query } from '../query';

export const getData = async (ctx, next) => {
  const { filterByTk } = ctx.action.params;
  const r = ctx.db.getRepository('chartsQueries');
  const instance = await r.findOne({ filterByTk });
  ctx.body = await query[instance.type](instance.options, { db: ctx.db });
  return next();
};

export const listSchema = async (ctx, next) => {
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
