const map2obj = (map: Map<string, string>) => {
  const obj = {};
  for(let [key, value] of map){
    obj[key] = value;
  }
 return obj;
}

export async function checkAction(ctx, next) {
  const currentRole = ctx.state.currentRole;
  if (currentRole) {
    const roleInstance = await ctx.db.getRepository('roles').findOne({
      filter: {
        name: currentRole,
      },
      appends: ['menuUiSchemas'],
    });

    const anonymous = await ctx.db.getRepository('roles').findOne({
      filter: {
        name: 'anonymous',
      },
    });

    const role = ctx.app.acl.getRole(currentRole);

    ctx.body = {
      ...role.toJSON(),
      resources: [...role.resources.keys()],
      actionAlias: map2obj(ctx.app.acl.actionAlias),
      allowAll: currentRole === 'root',
      allowConfigure: roleInstance.get('allowConfigure'),
      allowMenuItemIds: roleInstance.get('menuUiSchemas').map((uiSchema) => uiSchema.get('x-uid')),
      allowAnonymous: !!anonymous,
    };
  } else {
    throw new Error('Role not found');
  }

  await next();
}
