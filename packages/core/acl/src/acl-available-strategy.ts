import lodash from 'lodash';
import { ACL } from './acl';

type StrategyValue = false | '*' | string | string[];

export const NOCOBASE_MAIN_NAMESPACE = 'nocobase-main';

export interface AvailableStrategyOptions {
  displayName?: string;
  actions?: false | string | string[];
  allowConfigure?: boolean;
  resource?: '*';
}

export const predicate = {
  own: {
    filter: {
      createdById: '{{ ctx.state.currentUser.id }}',
    },
  },
  all: {},
};

export class ACLAvailableStrategy {
  acl: ACL;
  options: AvailableStrategyOptions;
  actionsAsObject: {
    [namespace: string]: {
      [action: string]: string;
    };
  };

  allowConfigure: boolean;

  constructor(acl: ACL, options: AvailableStrategyOptions) {
    this.acl = acl;
    this.options = options;
    this.allowConfigure = options.allowConfigure;

    let actions = this.options.actions;
    if (lodash.isString(actions) && actions != '*') {
      actions = [actions];
    }

    if (lodash.isArray(actions)) {
      this.actionsAsObject = actions.reduce((carry, action) => {
        const splitResult = this.splitActionString(action);
        const { namespace, action: actionName, predicate } = splitResult;

        if (!carry[namespace]) {
          carry[namespace] = {};
        }

        carry[namespace][actionName] = predicate;
        return carry;
      }, {});
    }
  }

  matchAction(resourceName, actionName: string) {
    if (this.options.actions == '*') {
      return true;
    }

    const namespace = this.getNamespace(resourceName);

    if (Object.prototype.hasOwnProperty.call(this.actionsAsObject?.[namespace] || {}, actionName)) {
      const predicateName = this.actionsAsObject[namespace][actionName];
      if (predicateName) {
        return lodash.cloneDeep(predicate[predicateName]);
      }

      return true;
    }

    return false;
  }

  allow(resourceName: string, actionName: string) {
    return this.matchAction(resourceName, this.acl.resolveActionAlias(actionName));
  }

  private splitActionString(actionString: string): {
    namespace: string;
    action: string;
    predicate?: string;
  } {
    // namespace|action:predicate

    let [namespace, actionWithPredicate] = actionString.split('|');
    if (!actionWithPredicate) {
      actionWithPredicate = namespace;
      namespace = NOCOBASE_MAIN_NAMESPACE;
    }

    const [action, predicate] = actionWithPredicate.split(':');

    return {
      namespace,
      action,
      predicate,
    };
  }
  private getNamespace(resourceName: string) {
    const [namespace, resource] = resourceName.split('|');

    if (resource) {
      return namespace;
    }

    return NOCOBASE_MAIN_NAMESPACE;
  }
}
