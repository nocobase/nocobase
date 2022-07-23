export async function setCurrentRole(ctx, next) {
  if (!ctx.state.currentUser) {
    return next();
  }

  let currentRole = ctx.get('X-Role');

  if (currentRole === 'anonymous') {
    ctx.state.currentRole = currentRole;
    return next();
  }

  const RolesUsers = ctx.db.getCollection('rolesUsers').model;
  const userRoles = await RolesUsers.findAll({
    where: {
      userId: ctx.state.currentUser.id
    }
  });

  if (userRoles.length == 1) {
    currentRole = userRoles[0].roleName;
  } else if (userRoles.length > 1) {
    const role = userRoles.find((item) => item.roleName === currentRole);
    if (!role) {
      const defaultRole = userRoles.find((item) => item.default);
      currentRole = (defaultRole || userRoles[0])?.roleName;
    }
  }

  if (currentRole) {
    ctx.state.currentRole = currentRole;
  }

  await next();
}
