import lodash from 'lodash';
import { ACLAvailableStrategy, AvailableStrategyOptions } from './acl-available-strategy';
import { ACLRole, RoleActionParams } from './acl-role';
import { AclAvailableAction, AvailableActionOptions } from './acl-available-action';
import EventEmitter from 'events';

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

export interface DefineOptions {
  role: string;
  strategy?: string | AvailableStrategyOptions;
  actions?: {
    [key: string]: RoleActionParams;
  };
  routes?: any;
}

export interface ListenerContext {
  acl: ACL;
  role: ACLRole;
  params: RoleActionParams;
}

type Listener = (ctx: ListenerContext) => void;

export class ACL extends EventEmitter {
  protected availableActions = new Map<string, AclAvailableAction>();
  protected availableStrategy = new Map<string, ACLAvailableStrategy>();

  roles = new Map<string, ACLRole>();

  actionAlias = new Map<string, string>();

  define(options: DefineOptions): ACLRole {
    const roleName = options.role;
    const role = new ACLRole(this, roleName);

    if (options.strategy) {
      role.strategy = options.strategy;
    }

    const actions = options.actions || {};

    for (const [actionName, actionParams] of Object.entries(actions)) {
      role.grantAction(actionName, actionParams);
    }

    this.roles.set(roleName, role);

    return role;
  }

  getRole(name: string): ACLRole {
    return this.roles.get(name);
  }

  setAvailableAction(name: string, options: AvailableActionOptions) {
    this.availableActions.set(name, new AclAvailableAction(name, options));

    if (options.aliases) {
      const aliases = lodash.isArray(options.aliases) ? options.aliases : [options.aliases];
      for (const alias of aliases) {
        this.actionAlias.set(alias, name);
      }
    }
  }

  setAvailableStrategy(name: string, options: AvailableStrategyOptions) {
    this.availableStrategy.set(name, new ACLAvailableStrategy(options));
  }

  beforeGrantAction(path: string, listener?: Listener) {
    this.addListener(`${path}.beforeGrantAction`, listener);
  }

  can({ role, resource, action }: { role: string; resource: string; action: string }): CanResult | null {
    action = this.resolveActionAlias(action);

    if (!this.isAvailableAction(action)) {
      return null;
    }

    const aclRole = this.roles.get(role);
    const aclResource = aclRole.getResource(resource);

    if (aclResource) {
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

    const roleStrategy = lodash.isString(aclRole.strategy)
      ? this.availableStrategy.get(aclRole.strategy)
      : new ACLAvailableStrategy(aclRole.strategy);

    if (!roleStrategy) {
      return null;
    }

    if (roleStrategy.allow(resource, action)) {
      return { role, resource, action };
    }

    return null;
  }

  protected isAvailableAction(actionName: string) {
    return this.availableActions.has(actionName);
  }

  protected resolveActionAlias(action: string) {
    return this.actionAlias.get(action) ? this.actionAlias.get(action) : action;
  }
}
