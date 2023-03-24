import { Database } from '@nocobase/database';

export default {
  async ['collections:setFields'](ctx, next) {
    const { filterByTk, values } = ctx.action.params;

    const fields = values.fields;

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
