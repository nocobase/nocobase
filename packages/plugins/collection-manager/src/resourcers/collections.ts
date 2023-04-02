import { Database } from '@nocobase/database';

export default {
  async ['collections:setFields'](ctx, next) {
    const { filterByTk, values } = ctx.action.params;

    // WARN: 删掉 key 才能保存
    const fields = values.fields?.map(f => {
      delete f.key;
      return f;
    });

    const db = ctx.app.db as Database;

    const collection = await db.getRepository('collections').findOne({
      filter: {
        name: filterByTk,
      },
    });

    await db.getRepository('collections').update({
      filterByTk,
      values: {
        fields,
      },
    });

    await collection.loadFields();

    await next();
  },
};
