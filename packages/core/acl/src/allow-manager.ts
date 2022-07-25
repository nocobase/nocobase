import { ACL } from './acl';

type ConditionFunc = (ctx: any) => Promise<boolean>;

export class AllowManager {
  protected skipActions = new Map<string, Map<string, string | ConditionFunc | true>>();

  protected registeredCondition = new Map<string, ConditionFunc>();

  constructor(public acl: ACL) {
    this.registerAllowCondition('loggedIn', (ctx) => {
      return ctx.state.currentUser;
    });

    this.registerAllowCondition('allowConfigure', async (ctx) => {
      const roleName = ctx.state.currentRole;
      if (!roleName) {
        return false;
      }

      const roleInstance = await ctx.db.getRepository('roles').findOne({
        filter: {
          name: roleName
        },
      });

      return roleInstance?.get('allowConfigure');
    });
  }

  allow(resourceName: string, actionName: string, condition?: string | ConditionFunc) {
    const actionMap = this.skipActions.get(resourceName) || new Map<string, string | ConditionFunc>();
    actionMap.set(actionName, condition || true);

    this.skipActions.set(resourceName, actionMap);
  }

  getAllowedConditions(resourceName: string, actionName: string): Array<ConditionFunc | true> {
    const fetchActionSteps: string[] = ['*', resourceName];

    const results = [];

    for (const fetchActionStep of fetchActionSteps) {
      const resource = this.skipActions.get(fetchActionStep);
      if (resource) {
        const condition = resource.get('*') || resource.get(actionName);
        if (condition) {
          results.push(typeof condition === 'string' ? this.registeredCondition.get(condition) : condition);
        }
      }
    }

    return results;
  }

  registerAllowCondition(name: string, condition: ConditionFunc) {
    this.registeredCondition.set(name, condition);
  }

  aclMiddleware() {
    return async (ctx, next) => {
      const { resourceName, actionName } = ctx.action;
      const skippedConditions = ctx.app.acl.allowManager.getAllowedConditions(resourceName, actionName);
      let skip = false;

      for (const skippedCondition of skippedConditions) {
        if (skippedCondition) {
          let skipResult = false;

          if (typeof skippedCondition === 'function') {
            skipResult = await skippedCondition(ctx);
          } else if (skippedCondition) {
            skipResult = true;
          }

          if (skipResult) {
            skip = true;
            break;
          }
        }
      }

      if (skip) {
        ctx.permission = {
          skip: true,
        };
      }
      await next();
    };
  }
}
