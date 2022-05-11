import { Context, Next } from '@nocobase/actions';
import UsersPlugin from '../server';

export function parseToken(options?: { plugin: UsersPlugin }) {
  return async function parseToken(ctx: Context, next: Next) {
    const user = await findUserByToken(ctx, options.plugin);
    if (user) {
      ctx.state.currentUser = user;
      setCurrentRole(ctx);
    }
    return next();
  };
}

export function setCurrentRole(ctx) {
  let currentRole = ctx.get('X-Role');

  if (currentRole === 'anonymous') {
    ctx.state.currentRole = currentRole;
    return;
  }

  const userRoles = ctx.state.currentUser.roles;

  if (userRoles.length == 1) {
    currentRole = userRoles[0].name;
  } else if (userRoles.length > 1) {
    const role = userRoles.find((role) => role.name === currentRole);
    if (!role) {
      const defaultRole = userRoles.find((role) => role?.rolesUsers?.default);
      currentRole = (defaultRole || userRoles[0])?.name;
    }
  }

  if (currentRole) {
    ctx.state.currentRole = currentRole;
  }
}

async function findUserByToken(ctx: Context, plugin: UsersPlugin) {
  const token = ctx.getBearerToken();
  if (!token) {
    return null;
  }

  try {
    const { userId } = await plugin.jwtService.decode(token);

    return await ctx.db.getRepository('users').findOne({
      filter: {
        id: userId,
      },
      appends: ['roles'],
    });
  } catch (error) {
    return null;
  }
}
