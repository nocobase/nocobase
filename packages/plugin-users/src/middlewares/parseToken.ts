import { Context, Next } from '@nocobase/actions';
import { decodeAccessToken } from '../actions/jwt';

// TODO(feature): 表名应在 options 中配置
// 中间件默认只解决解析 token 和附加对应 user 的工作，不解决是否提前报 401 退出。

// 因为是否提供匿名访问资源是应用决定的，不是使用插件就一定不能匿名访问。
export function parseToken(options?: any) {
  return async function parseToken(ctx: Context, next: Next) {
    const user = await findUserByToken(ctx);

    if (user) {
      ctx.state.currentUser = user;
      setCurrentRole(ctx, user);
    }
    return next();
  };
}

function setCurrentRole(ctx, user) {
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

async function findUserByToken(ctx: Context) {
  const token = getTokenFromCtx(ctx);
  if (!token) {
    return null;
  }

  const userId = await parseUserIdFromToken(token);

  return await ctx.db.getRepository('users').findOne({
    filter: {
      id: userId,
    },
    appends: ['roles'],
  });
}

function getTokenFromCtx(ctx: Context) {
  return ctx.get('Authorization').replace(/^Bearer\s+/gi, '');
}

async function parseUserIdFromToken(token) {
  const result = await decodeAccessToken(token);
  return result['userId'];
}
