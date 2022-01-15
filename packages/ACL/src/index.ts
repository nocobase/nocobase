import lodash from 'lodash';

type StrategyValue = false | '*' | string | string[];

interface AclActionOptions {
  displayName: string;
  type: 'new-data' | 'old-data';
  aliases?: string | string[];
}

class AclAction {
  options: AclActionOptions;
  constructor(options: AclActionOptions) {
    this.options = options;
  }
}

interface AclStrategyOptions {
  displayName: string;
  actions: StrategyValue;
  resource: StrategyValue;
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

  actions = new Map<string, ResourceActionParams>();

  constructor(options?: AclResourceOptions) {
    if (!options) {
      options = { actions: {} };
    }

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

  getAction(name: string) {
    return this.actions.get(name);
  }

  setAction(name: string, params: ResourceActionParams) {
    this.actions.set(name, params || {});
  }
}

export class AclRole {
  strategy: string;
  resources = new Map<string, AclResource>();

  getResource(name: string): AclResource | undefined {
    return this.resources.get(name);
  }

  setResource(name: string, resource: AclResource) {
    this.resources.set(name, resource);
  }
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

interface ResourceActionParams {
  filter?: any;
}

type ResourceActions = { [key: string]: ResourceActionParams };

interface AddResourceOptions {
  role: string;
  resource: string;
  actions: AclResourceActionsOption;
}

interface SetResourceOptions {
  role: string;
  resource: string;
  action: string;
  params?: ResourceActionParams;
}

export class ACL {
  actions = new Map<string, AclAction>();
  strategies = new Map<string, AclStrategy>();
  roles = new Map<string, AclRole>();

  actionAlias = new Map<string, string>();

  setAction(name: string, options: AclActionOptions) {
    this.actions.set(name, new AclAction(options));

    if (options.aliases) {
      const aliases = lodash.isArray(options.aliases) ? options.aliases : [options.aliases];
      for (const alias of aliases) {
        this.actionAlias.set(alias, name);
      }
    }
  }

  getAction(name: string) {
    return this.actions.get(name);
  }

  strategy(options: StrategyOptions) {
    const role = this.roles.get(options.role);
    const strategy = this.strategies.get(options.strategy);
    role.strategy = options.strategy;
  }

  addStrategy(name: string, options: AclStrategyOptions) {
    const strategy = new AclStrategy(options);
    this.strategies.set(name, strategy);
  }

  addRole(name: string) {
    return this.roles.set(name, new AclRole());
  }

  getRole(name: string) {
    return this.roles.get(name);
  }

  setResourceAction(options: SetResourceOptions) {
    const role: AclRole | undefined = this.getRole(options.role);
    let roleResource: AclResource = role.getResource(options.resource);
    if (!roleResource) {
      roleResource = new AclResource();
      role.setResource(options.resource, roleResource);
    }

    roleResource.setAction(options.action, options.params);
  }

  addResource(options: AddResourceOptions) {
    const role = this.getRole(options.role);

    const aclResource = new AclResource({
      actions: options.actions,
    });

    role.resources.set(options.resource, aclResource);
  }

  resolveActionAlias(action: string) {
    return this.actionAlias.get(action) ? this.actionAlias.get(action) : action;
  }

  can(role: string, resource: string, action: string): CanResult | null {
    const aclRole = this.roles.get(role);
    const aclResource = aclRole.getResource(resource);

    if (aclResource) {
      if (aclResource.denyAll) {
        return null;
      }

      if (aclResource.allowAll) {
        return { role, resource, action };
      }

      const aclActionConfig = aclResource.actions.get(this.resolveActionAlias(action));

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
