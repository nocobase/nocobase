import { Context } from '@nocobase/actions';
import { Repository } from '@nocobase/database';

export async function setCurrentRole(ctx: Context, next) {
  const currentRole = ctx.get('X-Role');

  if (currentRole === 'anonymous') {
    ctx.state.currentRole = currentRole;
    return next();
  }

  if (!ctx.state.currentUser) {
    return next();
  }

  const repository = ctx.db.getRepository('users.roles', ctx.state.currentUser.id) as unknown as Repository;
  const roles = await repository.find();
  ctx.state.currentUser.setDataValue('roles', roles);

  ctx.state.currentRole = roles.find((role) => role.name === currentRole)?.name;

  await next();
}
