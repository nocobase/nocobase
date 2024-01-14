import lodash from 'lodash';
import { ACL } from './acl';

type StrategyValue = false | '*' | string | string[];

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
  actionsAsObject: { [key: string]: string };

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
        const [actionName, predicate] = action.split(':');
        carry[actionName] = predicate;
        return carry;
      }, {});
    }
  }

  matchAction(actionName: string) {
    if (this.options.actions == '*') {
      return true;
    }

    if (Object.prototype.hasOwnProperty.call(this.actionsAsObject || {}, actionName)) {
      const predicateName = this.actionsAsObject[actionName];
      if (predicateName) {
        return lodash.cloneDeep(predicate[predicateName]);
      }

      return true;
    }

    return false;
  }

  allow(resourceName: string, actionName: string) {
    return this.matchAction(this.acl.resolveActionAlias(actionName));
  }
}
