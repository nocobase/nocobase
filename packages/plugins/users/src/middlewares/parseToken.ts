import { Context, Next } from '@nocobase/actions';
import { getTokenStatus, TokenStatus } from '../util';

// todo need handle return  ,should use more useful tip
export async function parseToken(ctx: Context, next: Next) {
  const token = ctx.getBearerToken();
  if (!token) {
    return next();
  }
  const { jwtService } = ctx.app.getPlugin('@nocobase/plugin-users');

  try {
    const { userId, roleNames } = await jwtService.decode(token);
    const tokenStatus = await getTokenStatus(ctx.cache, userId);
    switch (tokenStatus) {
      case TokenStatus.LOGIN:
        ctx.state.currentUserId = userId;
        ctx.state.roleNames = roleNames;
        break;
      case TokenStatus.LOGOUT:
      case TokenStatus.EXPIRE:
      default:
    }
    return next();
  } catch (error) {
    return next();
  }
}
