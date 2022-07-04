import { Action } from '@nocobase/resourcer';
import EventEmitter from 'events';
import parse from 'json-templates';
import compose from 'koa-compose';
import lodash from 'lodash';
import { AclAvailableAction, AvailableActionOptions } from './acl-available-action';
import { ACLAvailableStrategy, AvailableStrategyOptions, predicate } from './acl-available-strategy';
import { ACLRole, RoleActionParams } from './acl-role';
import { AllowManager } from './allow-manager';

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
  actionName: string;
  resourceName: string;
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
  protected middlewares = [];

  public allowManager = new AllowManager(this);

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

    this.beforeGrantAction((ctx) => {
      const actionName = this.resolveActionAlias(ctx.actionName);

      if (lodash.isPlainObject(ctx.params)) {
        if ((actionName === 'create' || actionName === 'update') && ctx.params.fields) {
          ctx.params = {
            ...lodash.omit(ctx.params, 'fields'),
            whitelist: ctx.params.fields,
          };
        }

        if (actionName === 'view' && ctx.params.fields) {
          const appendFields = ['id', 'createdAt', 'updatedAt'];
          ctx.params = {
            ...lodash.omit(ctx.params, 'fields'),
            fields: [...ctx.params.fields, ...appendFields],
          };
        }
      }
    });

    this.middlewares.push(this.allowManager.aclMiddleware());
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

  getAvailableAction(name: string) {
    const actionName = this.actionAlias.get(name) || name;
    return this.availableActions.get(actionName);
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
    const aclRole = this.roles.get(role);

    if (!aclRole) {
      return null;
    }

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
      } else {
        return null;
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

  use(fn: any) {
    this.middlewares.push(fn);
  }

  allow(resourceName: string, actionNames: string[] | string, condition?: any) {
    if (!Array.isArray(actionNames)) {
      actionNames = [actionNames];
    }

    for (const actionName of actionNames) {
      this.allowManager.allow(resourceName, actionName, condition);
    }
  }

  parseJsonTemplate(json: any, ctx: any) {
    return parse(json)({
      ctx: {
        state: JSON.parse(JSON.stringify(ctx.state)),
      },
    });
  }

  middleware() {
    const acl = this;

    const filterParams = (ctx, resourceName, params) => {
      if (params?.filter?.createdById) {
        const collection = ctx.db.getCollection(resourceName);
        if (collection && !collection.getField('createdById')) {
          return lodash.omit(params, 'filter.createdById');
        }
      }

      return params;
    };

    return async function ACLMiddleware(ctx, next) {
      const roleName = ctx.state.currentRole || 'anonymous';
      const { resourceName, actionName } = ctx.action;

      const resourcerAction: Action = ctx.action;

      ctx.can = (options: Omit<CanArgs, 'role'>) => {
        return acl.can({ role: roleName, ...options });
      };

      ctx.permission = {
        can: ctx.can({ resource: resourceName, action: actionName }),
      };

      return compose(acl.middlewares)(ctx, async () => {
        const permission = ctx.permission;

        if (permission.skip) {
          return next();
        }

        if (!permission.can || typeof permission.can !== 'object') {
          ctx.throw(403, 'No permissions');
          return;
        }

        const { params } = permission.can;

        if (params) {
          const filteredParams = filterParams(ctx, resourceName, params);
          const parsedParams = acl.parseJsonTemplate(filteredParams, ctx);
          resourcerAction.mergeParams(parsedParams);
        }

        await next();
      });
    };
  }
}
