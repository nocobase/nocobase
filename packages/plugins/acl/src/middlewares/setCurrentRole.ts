export async function setCurrentRole(ctx, next) {
  let currentRole = ctx.get('X-Role');

  if (currentRole === 'anonymous') {
    ctx.state.currentRole = currentRole;
    return next();
  }

  if (!ctx.state.currentUserId) {
    return next();
  }

  const roleNames = ctx.state.roleNames;
  if (Array.isArray(roleNames) && roleNames.length > 0) {
    if (roleNames.indexOf(currentRole) > -1) {
      ctx.state.currentRole = currentRole;
    } else {
      ctx.state.currentRole = roleNames[0];
    }
  } else {
    // if currentRole is not in system role names, force set currentRole = anonymous
    ctx.state.currentRole = 'anonymous';
  }

  await next();
}
