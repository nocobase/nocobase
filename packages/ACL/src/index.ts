import lodash from 'lodash';

type StrategyValue = false | '*' | string | string[];

interface AclActionOptions {
  displayName: string;
  type: 'new-data' | 'old-data';
}

interface AclStrategyOptions {
  displayName: string;
  actions: StrategyValue;
  resource?: StrategyValue;
}

function strategyValueMatched(strategy: StrategyValue, value: string) {
  if (strategy === '*') {
    return true;
  }

  if (lodash.isString(strategy) && strategy === value) {
    return true;
  }

  if (lodash.isArray(strategy) && strategy.includes(value)) {
    return true;
  }

  return false;
}

class AclStrategy {
  options: AclStrategyOptions;
  allowAll: boolean;
  denyAll: boolean;
  constructor(options: AclStrategyOptions) {
    this.options = options;
  }

  matchResource(resourceName: string) {
    return strategyValueMatched(this.options.resource, resourceName);
  }

  matchAction(actionName: string) {
    return strategyValueMatched(this.options.actions, actionName);
  }

  allow(resourceName: string, actionName: string) {
    return this.matchResource(resourceName) && this.matchAction(actionName);
  }
}

type AclResourceActionsOption = false | '*' | ResourceActions;

interface AclResourceOptions {
  actions: AclResourceActionsOption;
}

class AclResource {
  allowAll: boolean;
  denyAll: boolean;

  actions = new Map<string, ResourceAction>();

  constructor(options: AclResourceOptions) {
    if (options.actions === false) {
      this.denyAll = true;
    } else if (options.actions === '*') {
      this.allowAll = true;
    } else {
      const actionsOption: ResourceActions = options.actions;
      for (const actionName of Object.keys(actionsOption)) {
        this.actions.set(actionName, actionsOption[actionName]);
      }
    }
  }
}

export class AclRole {
  strategy: string;
  resources = new Map<string, AclResource>();
}

interface StrategyOptions {
  role: string;
  strategy: string;
}

interface CanResult {
  role: string;
  resource: string;
  action: string;
  params?: any;
}

interface ResourceAction {
  filter?: any;
}

type ResourceActions = { [key: string]: ResourceAction };

interface AddResourceOptions {
  role: string;
  resource: string;
  actions: AclResourceActionsOption;
}

export class ACL {
  actions = new Map<string, AclActionOptions>();
  strategies = new Map<string, AclStrategy>();
  roles = new Map<string, AclRole>();

  strategy(options: StrategyOptions) {
    const role = this.roles.get(options.role);
    const strategy = this.strategies.get(options.strategy);
    role.strategy = options.strategy;
  }

  addStrategy(name: string, options: AclStrategyOptions) {
    const strategy = new AclStrategy(options);
    this.strategies.set(name, strategy);
  }

  addResource(options: AddResourceOptions) {
    const role = this.roles.get(options.role);

    const aclResource = new AclResource({
      actions: options.actions,
    });

    role.resources.set(options.resource, aclResource);
  }

  can(role: string, resource: string, action: string): CanResult | null {
    const aclRole = this.roles.get(role);
    const aclResource = aclRole.resources.get(resource);

    if (aclResource) {
      if (aclResource.denyAll) {
        return null;
      }

      if (aclResource.allowAll) {
        return { role, resource, action };
      }

      const aclActionConfig = aclResource.actions.get(action);
      if (aclActionConfig) {
        // handle single action config
        return {
          role,
          resource,
          action,
          params: aclActionConfig,
        };
      }
    }

    const roleStrategy = this.strategies.get(aclRole.strategy);

    if (!roleStrategy) {
      return null;
    }

    if (roleStrategy.allow(resource, action)) {
      return { role, resource, action };
    }

    return null;
  }
}
