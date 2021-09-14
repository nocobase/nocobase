import { Context, Next } from '@nocobase/actions';

export interface DemoBlackListedActionsOptions {
  emails?: string[];
  blacklist?: string[];
}

const defaultBlacklist = ['create', 'update', 'destroy', 'sort', 'upload'];

export function demoBlacklistedActions(options: DemoBlackListedActionsOptions = {}) {
  const { emails, blacklist = defaultBlacklist } = options;
  return async (ctx: Context, next: Next) => {
    const currentUser = ctx.state.currentUser;
    if (currentUser && emails.includes(currentUser.email)) {
      return next();
    }
    const { actionName } = ctx.action.params;
    if (blacklist.includes(actionName)) {
      ctx.body = {
        data: {},
        meta: {},
      };
      return;
    }
    await next();
  }
}
