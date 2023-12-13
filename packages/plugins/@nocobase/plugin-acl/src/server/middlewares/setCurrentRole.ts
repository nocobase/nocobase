import { Context } from '@nocobase/actions';
import { Cache } from '@nocobase/cache';
import { Model, Repository } from '@nocobase/database';

export async function setCurrentRole(ctx: Context, next) {
  const currentRole = ctx.get('X-Role');

  if (currentRole === 'anonymous') {
    ctx.state.currentRole = currentRole;
    return next();
  }

  if (!ctx.state.currentUser) {
    return next();
  }

  const cache = ctx.cache as Cache;
  const repository = ctx.db.getRepository('users.roles', ctx.state.currentUser.id) as unknown as Repository;
  const roles = (await cache.wrap(`roles:${ctx.state.currentUser.id}`, () =>
    repository.find({
      raw: true,
    }),
  )) as Model[];
  ctx.state.currentUser.roles = roles;

  // 1. If the X-Role is set, use the specified role
  if (currentRole) {
    ctx.state.currentRole = roles.find((role) => role.name === currentRole)?.name;
  }
  // 2. If the X-Role is not set, use the default role
  else {
    const defaultRole = roles.find((item) => item?.rolesUsers?.default);
    ctx.state.currentRole = (defaultRole || roles[0])?.name;
  }

  if (!ctx.state.currentRole) {
    return ctx.throw(401, { code: 'ROLE_NOT_FOUND_ERR', message: 'The user role does not exist.' });
  }

  await next();
}
