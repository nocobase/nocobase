import { UserRepository } from '@nocobase/plugin-user-groups';
/**
 * a middle ware which will set the user's roles.
 * @param ctx 
 * @param next 
 * @returns 
 */
export async function setCurrentRole(ctx, next) {
  let currentRole = ctx.get('X-Role');

  if (currentRole === 'anonymous') {
    ctx.state.currentRole = currentRole;
    return next();
  }

  if (!ctx.state.currentUser) {
    return next();
  }

  // const repository = ctx.db.getRepository('users.roles', ctx.state.currentUser.id);
  // const roles = await repository.find();

  //get the user's self roles and user's parents groups roles.(inherated roles)
  const userRepository = ctx.db.getCollection('users').repository as UserRepository;
  const roles = await userRepository.getTreeRoles(ctx.state.currentUser.id);
  
  ctx.state.currentUser.setDataValue('roles', roles);

  if (roles.length == 1) {
    currentRole = roles[0].name;
  } else if (roles.length > 1) {
    const role = roles.find((item) => item.name === currentRole);
    if (!role) {
      const defaultRole = roles.find((item) => item?.rolesUsers?.default);
      currentRole = (defaultRole || roles[0])?.name;
    }
  }

  if (currentRole) {
    ctx.state.currentRole = currentRole;
  }

  await next();
}
