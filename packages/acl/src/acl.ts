import lodash from 'lodash';
import { ACLAvailableStrategy, AvailableStrategyOptions, predicate } from './acl-available-strategy';
import { ACLRole, RoleActionParams } from './acl-role';
import { AclAvailableAction, AvailableActionOptions } from './acl-available-action';
import EventEmitter from 'events';

interface CanResult {
  role: string;
  resource: string;
  action: string;
  params?: any;
}

export interface DefineOptions {
  role: string;
  allowConfigure?: boolean;
  strategy?: string | Omit<AvailableStrategyOptions, 'acl'>;
  actions?: {
    [key: string]: RoleActionParams;
  };
  routes?: any;
}

export interface ListenerContext {
  acl: ACL;
  role: ACLRole;
  path: string;
  params: RoleActionParams;
}

type Listener = (ctx: ListenerContext) => void;

interface CanArgs {
  role: string;
  resource: string;
  action: string;
}

export class ACL extends EventEmitter {
  protected availableActions = new Map<string, AclAvailableAction>();
  protected availableStrategy = new Map<string, ACLAvailableStrategy>();

  roles = new Map<string, ACLRole>();

  actionAlias = new Map<string, string>();

  configResources: string[] = [];

  constructor() {
    super();

    this.beforeGrantAction((ctx) => {
      if (lodash.isPlainObject(ctx.params) && ctx.params.own) {
        ctx.params = lodash.merge(ctx.params, predicate.own);
      }
    });
  }

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

  removeRole(name: string) {
    return this.roles.delete(name);
  }

  registerConfigResources(names: string[]) {
    names.forEach((name) => this.registerConfigResource(name));
  }

  registerConfigResource(name: string) {
    this.configResources.push(name);
  }

  isConfigResource(name: string) {
    return this.configResources.includes(name);
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

  getAvailableActions() {
    return this.availableActions;
  }

  setAvailableStrategy(name: string, options: Omit<AvailableStrategyOptions, 'acl'>) {
    this.availableStrategy.set(name, new ACLAvailableStrategy(this, options));
  }

  beforeGrantAction(listener?: Listener) {
    this.addListener('beforeGrantAction', listener);
  }

  can({ role, resource, action }: CanArgs): CanResult | null {
    if (!this.isAvailableAction(action)) {
      return null;
    }

    const aclRole = this.roles.get(role);
    const aclResource = aclRole.getResource(resource);

    if (aclResource) {
      const actionParams = aclResource.getAction(action);

      if (actionParams) {
        // handle single action config
        return {
          role,
          resource,
          action,
          params: actionParams,
        };
      }
    }

    if (!aclRole.strategy) {
      return null;
    }

    const roleStrategy = lodash.isString(aclRole.strategy)
      ? this.availableStrategy.get(aclRole.strategy)
      : new ACLAvailableStrategy(this, aclRole.strategy);

    if (!roleStrategy) {
      return null;
    }

    const roleStrategyParams = roleStrategy.allow(resource, this.resolveActionAlias(action));

    if (roleStrategyParams) {
      const result = { role, resource, action };

      if (lodash.isPlainObject(roleStrategyParams)) {
        result['params'] = roleStrategyParams;
      }

      return result;
    }

    return null;
  }

  protected isAvailableAction(actionName: string) {
    return this.availableActions.has(this.resolveActionAlias(actionName));
  }

  public resolveActionAlias(action: string) {
    return this.actionAlias.get(action) ? this.actionAlias.get(action) : action;
  }

  middleware() {
    const aclInstance = this;

    return async function ACLMiddleware(ctx, next) {
      const roleName = ctx.state.currentRole;
      const { resourceName, actionName } = ctx.action;

      ctx.can = (options: Omit<CanArgs, 'role'>) => {
        return aclInstance.can({ role: roleName, ...options });
      };

      const canResult = ctx.can({ resource: resourceName, action: actionName });

      if (!canResult) {
        ctx.throw(403, 'no permission');
        return;
      }

      await next();
    };
  }
}
