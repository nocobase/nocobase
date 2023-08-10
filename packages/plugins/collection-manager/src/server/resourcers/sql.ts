import { Context, Next } from '@nocobase/actions';

const handleLimit = (sql: string) => {
  // The result is for preview only, so add or replace limit clause to avoid too many results
  if (/limit\s+\d+/i.test(sql)) {
    sql = sql.replace(/limit\s+\d+/i, 'limit 5');
  } else if (/;\s*$/.test(sql)) {
    sql = sql.replace(/;\s*$/, ' limit 5');
  } else {
    sql = `${sql} limit 5`;
  }
  return sql;
};

export default {
  name: 'sql',
  actions: {
    execute: async (ctx: Context, next: Next) => {
      let {
        values: { sql },
      } = ctx.action.params;
      sql = sql.trim().split(';').shift();
      if (!sql) {
        ctx.throw(400, ctx.t('SQL is empty'));
      }
      if (!/^select/i.test(sql) && !/^with([\s\S]+)select([\s\S]+)/i.test(sql)) {
        ctx.throw(400, ctx.t('Only select query allowed'));
      }
      sql = handleLimit(sql);
      const [data] = await ctx.db.sequelize.query(sql);
      ctx.body = data;
      await next();
    },
  },
};
