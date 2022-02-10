import { BelongsToManyRepository } from '@nocobase/database';

export async function bindMenuToRow({ schemaInstance, db, options }) {
  const { transaction } = options;
  const addNewMenuRoles = await db.getRepository('roles').find({
    filter: {
      allowNewMenu: true,
    },
  });

  for (const role of addNewMenuRoles) {
    await db.getRepository('roles.menuUiSchemas', role.get('name')).set({
      tk: schemaInstance.get('uid'),
      transaction,
    });
  }
}
