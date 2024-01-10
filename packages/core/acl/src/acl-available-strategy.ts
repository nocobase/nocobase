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
        let [namespace, actionString] = action.split('.');

        if (!actionString) {
          actionString = namespace;
          namespace = NOCOBASE_MAIN_NAMESPACE;
        }

        if (!carry[namespace]) {
          carry[namespace] = {};
        }

        const [actionName, predicate] = actionString.split(':');
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

    if (this.actionsAsObject?.[namespace]?.[actionName]) {
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

  private getNamespace(resourceName: string) {
    const [namespace, resource] = resourceName.split('.');
    if (resource) {
      return namespace;
    }

    return NOCOBASE_MAIN_NAMESPACE;
  }
}
