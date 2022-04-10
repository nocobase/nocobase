export async function bindMenuToRole({ schemaInstance, db, options }) {
  const { transaction } = options;
  const addNewMenuRoles = await db.getRepository('roles').find({
    filter: {
      allowNewMenu: true,
    },
  });

  for (const role of addNewMenuRoles) {
    await db.getRepository('roles.menuUiSchemas', role.get('name')).add({
      tk: schemaInstance.get('x-uid'),
      transaction,
    });
  }
}
