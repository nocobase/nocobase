export async function checkAction(ctx, next) {
  const currentRole = ctx.state.currentRole;
  if (currentRole) {
    const roleInstance = await ctx.db.getRepository('roles').findOne({
      filter: {
        name: currentRole,
      },
      appends: ['menuUiSchemas'],
    });

    ctx.body = {
      ...ctx.app.acl.getRole(currentRole).toJSON(),
      allowAll: currentRole === 'root',
      allowConfigure: roleInstance.get('allowConfigure'),
      allowMenuItemIds: roleInstance.get('menuUiSchemas').map((uiSchema) => uiSchema.get('x-uid')),
    };
  }

  await next();
}
