import { getRoleNameObj } from '../util';

export async function setCurrentRole(ctx, next) {
  let currentRole = ctx.get('X-Role');

  if (currentRole === 'anonymous') {
    ctx.state.currentRole = currentRole;
    return next();
  }

  if (!ctx.state.currentUserId) {
    return next();
  }

  const currentUserAppends = (ctx.state.currentUserAppends || []) as Array<string>;
  currentUserAppends.push('roles');
  ctx.state.currentUserAppends = currentUserAppends;

  const roleNames = ctx.state.roleNames;

  const roleNameObj = await getRoleNameObj(ctx.cache, ctx.db);
  if (!roleNameObj[currentRole]) {
    // if current role is not in system, then select one role from roleNames
    for (const roleName of roleNames) {
      if (roleName !== currentRole) {
        ctx.state.currentRole = roleName;
        break;
      }
    }
    return next();
  }

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
