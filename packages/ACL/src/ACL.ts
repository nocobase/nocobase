import lodash from 'lodash';
import { AclResource, AclResourceActionsOption } from './AclResource';
import { ResourceActionParams } from './AclResourceAction';
import { AclAction, AclActionOptions } from './AclAction';
import { AclStrategy, AclStrategyOptions } from './AclStrategy';
import { AclRole } from './AclRole';

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

interface RemoveResourceOptions {
  role: string;
  resource: string;
  action: string;
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

  removeResourceAction(options: RemoveResourceOptions) {
    const role: AclRole = this.getRole(options.role);
    const roleResource: AclResource = role.getResource(options.resource);
    if (roleResource) {
      roleResource.removeAction(options.action);
    }
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
