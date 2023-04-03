import { Database } from '@nocobase/database';

export function beforeCreateForViewCollection(db: Database) {
  return async (model, { transaction, context }) => {
    if (!model.get('view') || !db.inDialect('postgres')) {
      return;
    }

    const name = model.get('name');

    const exists = await db.getRepository('collections').count({
      filterByTk: name,
    });

    if (exists) {
      const prefix = model.get('schema') || 'public';
      const viewName = `${prefix}_${name}`;

      // set collection viewName
      if (!model.get('viewName')) {
        model.set('viewName', name);
      }

      // set collection name
      model.set('name', viewName);
    }
  };
}
