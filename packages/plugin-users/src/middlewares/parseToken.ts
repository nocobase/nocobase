import { Context, Next } from '@nocobase/actions';
import UsersPlugin from '../server';

export function parseToken(options?: { plugin: UsersPlugin }) {
  return async function parseToken(ctx: Context, next: Next) {
    const user = await findUserByToken(ctx, options.plugin);
    if (user) {
      ctx.state.currentUser = user;
      setCurrentRole(ctx, user);
    }
    return next();
  };
}

function setCurrentRole(ctx, user) {
  const roleName = ctx.get('X-Role');

  if (roleName === 'anonymous') {
    ctx.state.currentRole = roleName;
    return;
  }

  const userRoles = user.get('roles');
  let userRole;

  if (userRoles.length == 1) {
    userRole = userRoles[0].get('name');
  } else if (userRoles.length > 1) {
    const defaultRole = userRoles.findIndex((role) => role.get('rolesUsers').default);
    userRole = (defaultRole !== -1 ? userRoles[defaultRole] : userRoles[0]).get('name');
  }

  if (userRole) {
    ctx.state.currentRole = userRole;
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
    console.warn(error);
  }
}
