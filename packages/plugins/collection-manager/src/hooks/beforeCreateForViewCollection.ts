import { Database } from '@nocobase/database';

export function beforeCreateForViewCollection(db: Database) {
  return async (model, { transaction, context }) => {
    // if (model.get('viewSQL')) {
    //   const name = model.get('name');
    //   const sql = model.get('viewSQL');
    //
    //   await db.sequelize.query(sql, {
    //     transaction,
    //   });
    // }
  };
}
