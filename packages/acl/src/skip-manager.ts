import { ACL } from './acl';
import { Context } from '@nocobase/actions';
import lodash from 'lodash';

type ConditionFunc = (ctx: Context) => boolean;

export class SkipManager {
  protected skipActions = new Map<string, Map<string, string | ConditionFunc | true>>();

  protected registeredCondition = new Map<string, ConditionFunc>();

  constructor(public acl: ACL) {
    this.registerSkipCondition('logined', (ctx) => {
      return ctx.state.currentUser;
    });
  }

  skip(resourceName: string, actionName: string, condition?: string | ConditionFunc) {
    const actionMap = this.skipActions.get(resourceName) || new Map<string, string | ConditionFunc>();
    actionMap.set(actionName, condition || true);

    this.skipActions.set(resourceName, actionMap);
  }

  getSkippedCondition(resourceName: string, actionName: string): ConditionFunc | true {
    const fetchActionSteps: string[] = ['*', resourceName];

    for (const fetchActionStep of fetchActionSteps) {
      const resource = this.skipActions.get(fetchActionStep);
      if (resource) {
        const condition = resource.get('*') || resource.get(actionName);
        if (condition) {
          return typeof condition === 'string' ? this.registeredCondition.get(condition) : condition;
        }
      }
    }
  }

  registerSkipCondition(name: string, condition: ConditionFunc) {
    this.registeredCondition.set(name, condition);
  }
}
