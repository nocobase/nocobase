import { Database } from '@nocobase/database';

export function beforeCreateForViewCollection(db: Database) {
  return async (model, { transaction, context }) => {
    if (!model.get('view')) {
      return;
    }

    const name = model.get('name');
    const exists = await db.getRepository('collections').count({
      filterByTk: name,
    });

    if (exists) {
      const prefix = model.get('schema') || 'public';
      const viewName = `${prefix}_${name}`;
      model.set('name', viewName);
    }
  };
}
