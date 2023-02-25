import { query } from '../query';
import JSON5 from 'json5';

export const getData = async (ctx, next) => {
  const { filterByTk } = ctx.action.params;
  const r = ctx.db.getRepository('chartsQueries');
  const instance = await r.findOne({ filterByTk });
  const result = await query[instance.type](instance.options, { db: ctx.db });
  if(typeof result === 'string'){
    ctx.body = JSON5.parse(result);
  }else{
    ctx.body = result;
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
