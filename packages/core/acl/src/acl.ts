/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Action } from '@nocobase/resourcer';
import { assign, parseFilter, Toposort, ToposortOptions } from '@nocobase/utils';
import EventEmitter from 'events';
import compose from 'koa-compose';
import lodash from 'lodash';
import { ACLAvailableAction, AvailableActionOptions } from './acl-available-action';
import { ACLAvailableStrategy, AvailableStrategyOptions, predicate } from './acl-available-strategy';
import { ACLRole, ResourceActionsOptions, RoleActionParams } from './acl-role';
import { AllowManager, ConditionFunc } from './allow-manager';
import FixedParamsManager, { Merger } from './fixed-params-manager';
import SnippetManager, { SnippetOptions } from './snippet-manager';
import { NoPermissionError } from './errors/no-permission-error';
import { mergeAclActionParams, removeEmptyParams } from './utils';

interface CanResult {
  role: string;
  resource: string;
  action: string;
  params?: any;
}

export interface DefineOptions {
  role: string;
  /**
   * @internal
   */
  allowConfigure?: boolean;
  strategy?: string | AvailableStrategyOptions;
  actions?: ResourceActionsOptions;
  /**
   * @internal
   */
  routes?: any;
  snippets?: string[];
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
  role?: string;
  resource: string;
  action: string;
  rawResourceName?: string;
  ctx?: any;
  roles?: string[];
}

export class ACL extends EventEmitter {
  /**
   * @internal
   */
  public availableStrategy = new Map<string, ACLAvailableStrategy>();

  /**
   * @internal
   */
  public allowManager = new AllowManager(this);

  /**
   * @internal
   */
  public snippetManager = new SnippetManager();

  /**
   * @internal
   */
  roles = new Map<string, ACLRole>();

  /**
   * @internal
   */
  actionAlias = new Map<string, string>();

  protected availableActions = new Map<string, ACLAvailableAction>();

  protected fixedParamsManager = new FixedParamsManager();

  protected middlewares: Toposort<any>;

  protected strategyResources: Set<string> | null = null;

  constructor() {
    super();

    this.middlewares = new Toposort<any>();

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
      }
    });

    this.use(this.allowManager.aclMiddleware(), {
      tag: 'allow-manager',
      before: 'core',
    });

    this.addCoreMiddleware();
  }

  setStrategyResources(resources: Array<string> | null) {
    this.strategyResources = new Set(resources);
  }

  getStrategyResources() {
    return this.strategyResources ? [...this.strategyResources] : null;
  }

  appendStrategyResource(resource: string) {
    if (!this.strategyResources) {
      this.strategyResources = new Set();
    }
    this.strategyResources.add(resource);
  }

  removeStrategyResource(resource: string) {
    this.strategyResources.delete(resource);
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

  getRoles(names: string[]): ACLRole[] {
    return names.map((name) => this.getRole(name)).filter((x) => Boolean(x));
  }

  removeRole(name: string) {
    return this.roles.delete(name);
  }

  setAvailableAction(name: string, options: AvailableActionOptions = {}) {
    this.availableActions.set(name, new ACLAvailableAction(name, options));

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

  setAvailableStrategy(name: string, options: AvailableStrategyOptions) {
    this.availableStrategy.set(name, new ACLAvailableStrategy(this, options));
  }

  beforeGrantAction(listener?: Listener) {
    this.addListener('beforeGrantAction', listener);
  }

  can(options: CanArgs): CanResult | null {
    if (options.role) {
      return lodash.cloneDeep(this.getCanByRole(options));
    }
    if (options.roles?.length) {
      return lodash.cloneDeep(this.getCanByRoles(options));
    }

    return null;
  }

  private getCanByRoles(options: CanArgs) {
    let canResult: CanResult | null = null;

    for (const role of options.roles) {
      const result = this.getCanByRole({
        role,
        ...options,
      });
      if (!canResult) {
        canResult = result;
        canResult && removeEmptyParams(canResult.params);
      } else if (canResult && result) {
        canResult.params = mergeAclActionParams(canResult.params, result.params);
      }
    }

    return canResult;
  }

  private getCanByRole(options: CanArgs) {
    const { role, resource, action, rawResourceName } = options;
    const aclRole = this.roles.get(role);

    if (!aclRole) {
      return null;
    }

    const actionPath = `${rawResourceName ? rawResourceName : resource}:${action}`;
    const snippetAllowed = aclRole.snippetAllowed(actionPath);

    const fixedParams = this.fixedParamsManager.getParams(rawResourceName ? rawResourceName : resource, action);

    const mergeParams = (result: CanResult) => {
      const params = result['params'] || {};

      const mergedParams = assign(params, fixedParams);

      if (Object.keys(mergedParams).length) {
        result['params'] = mergedParams;
      } else {
        delete result['params'];
      }

      return result;
    };

    const aclResource = aclRole.getResource(resource);

    if (aclResource) {
      const actionParams = aclResource.getAction(action);

      if (actionParams) {
        // handle single action config
        return mergeParams({
          role,
          resource,
          action,
          params: actionParams,
        });
      } else {
        return null;
      }
    }

    const roleStrategy = aclRole.getStrategy();

    if (!roleStrategy && !snippetAllowed) {
      return null;
    }

    let roleStrategyParams;

    if (this.strategyResources === null || this.strategyResources.has(resource)) {
      roleStrategyParams = roleStrategy?.allow(resource, this.resolveActionAlias(action));
    }

    if (!roleStrategyParams && snippetAllowed) {
      roleStrategyParams = {};
    }

    if (roleStrategyParams) {
      const result = { role, resource, action, params: {} };

      if (lodash.isPlainObject(roleStrategyParams)) {
        result['params'] = roleStrategyParams;
      }

      return mergeParams(result);
    }

    return null;
  }

  /**
   * @internal
   */
  public resolveActionAlias(action: string) {
    return this.actionAlias.get(action) ? this.actionAlias.get(action) : action;
  }

  use(fn: any, options?: ToposortOptions) {
    this.middlewares.add(fn, {
      group: 'prep',
      ...options,
    });
  }

  allow(resourceName: string, actionNames: string[] | string, condition?: string | ConditionFunc) {
    return this.skip(resourceName, actionNames, condition);
  }

  /**
   * @deprecated
   */
  skip(resourceName: string, actionNames: string[] | string, condition?: string | ConditionFunc) {
    if (!Array.isArray(actionNames)) {
      actionNames = [actionNames];
    }

    for (const actionName of actionNames) {
      this.allowManager.allow(resourceName, actionName, condition);
    }
  }

  /**
   * @internal
   */
  async parseJsonTemplate(json: any, ctx: any) {
    if (json.filter) {
      ctx.logger?.info?.('parseJsonTemplate.raw', JSON.parse(JSON.stringify(json.filter)));
      const timezone = ctx?.get?.('x-timezone');
      const state = JSON.parse(JSON.stringify(ctx.state));
      const filter = await parseFilter(json.filter, {
        timezone,
        now: new Date().toISOString(),
        vars: {
          ctx: {
            state,
          },
          $user: getUser(ctx),
          $nRole: () => state.currentRole,
        },
      });
      json.filter = filter;
      ctx.logger?.info?.('parseJsonTemplate.parsed', filter);
    }
    return json;
  }

  middleware() {
    const acl = this;

    return async function ACLMiddleware(ctx, next) {
      const roleName = ctx.state.currentRole || 'anonymous';
      const { resourceName: rawResourceName, actionName } = ctx.action;

      let resourceName = rawResourceName;
      if (rawResourceName.includes('.')) {
        resourceName = rawResourceName.split('.').pop();
      }

      if (ctx.getCurrentRepository) {
        const currentRepository = ctx.getCurrentRepository();
        if (currentRepository && currentRepository.targetCollection) {
          resourceName = ctx.getCurrentRepository().targetCollection.name;
        }
      }

      ctx.can = (options: Omit<CanArgs, 'role'>) => {
        const roles = ctx.state.currentRoles || [roleName];
        const can = acl.can({ roles, ...options });
        if (!can) {
          return null;
        }
        return can;
      };

      ctx.permission = {
        can: ctx.can({ resource: resourceName, action: actionName, rawResourceName }),
        resourceName,
        actionName,
      };

      return await compose(acl.middlewares.nodes)(ctx, next);
    };
  }

  /**
   * @internal
   */
  async getActionParams(ctx) {
    const roleNames = ctx.state.currentRoles?.length ? ctx.state.currentRoles : 'anonymous';
    const { resourceName: rawResourceName, actionName } = ctx.action;

    let resourceName = rawResourceName;
    if (rawResourceName.includes('.')) {
      resourceName = rawResourceName.split('.').pop();
    }

    if (ctx.getCurrentRepository) {
      const currentRepository = ctx.getCurrentRepository();
      if (currentRepository && currentRepository.targetCollection) {
        resourceName = ctx.getCurrentRepository().targetCollection.name;
      }
    }

    ctx.can = (options: Omit<CanArgs, 'role'>) => {
      const can = this.can({ roles: roleNames, ...options });
      if (can) {
        return lodash.cloneDeep(can);
      }
      return null;
    };

    ctx.permission = {
      can: ctx.can({ resource: resourceName, action: actionName, rawResourceName }),
      resourceName,
      actionName,
    };

    await compose(this.middlewares.nodes)(ctx, async () => {});
  }

  addFixedParams(resource: string, action: string, merger: Merger) {
    this.fixedParamsManager.addParams(resource, action, merger);
  }

  registerSnippet(snippet: SnippetOptions) {
    this.snippetManager.register(snippet);
  }

  /**
   * @internal
   */
  filterParams(ctx, resourceName, params) {
    if (params?.filter?.createdById) {
      const collection = ctx.db.getCollection(resourceName);
      if (!collection || !collection.getField('createdById')) {
        throw new NoPermissionError('createdById field not found');
      }
    }

    // 检查 $or 条件中的 createdById
    if (params?.filter?.$or?.length) {
      const checkCreatedById = (items) => {
        return items.some(
          (x) =>
            'createdById' in x || x.$or?.some((y) => 'createdById' in y) || x.$and?.some((y) => 'createdById' in y),
        );
      };

      if (checkCreatedById(params.filter.$or)) {
        const collection = ctx.db.getCollection(resourceName);
        if (!collection || !collection.getField('createdById')) {
          throw new NoPermissionError('createdById field not found');
        }
      }
    }

    return params;
  }

  protected addCoreMiddleware() {
    const acl = this;

    this.middlewares.add(
      async (ctx, next) => {
        const resourcerAction: Action = ctx.action;
        const { resourceName, actionName } = ctx.permission;

        const permission = ctx.permission;

        ctx.log?.debug && ctx.log.debug('ctx permission', permission);

        if ((!permission.can || typeof permission.can !== 'object') && !permission.skip) {
          ctx.throw(403, 'No permissions');
          return;
        }

        const params = permission.can?.params || acl.fixedParamsManager.getParams(resourceName, actionName);

        ctx.log?.debug && ctx.log.debug('acl params', params);

        try {
          if (params && resourcerAction.mergeParams) {
            const filteredParams = acl.filterParams(ctx, resourceName, params);
            const parsedParams = await acl.parseJsonTemplate(filteredParams, ctx);

            ctx.permission.parsedParams = parsedParams;
            ctx.log?.debug && ctx.log.debug('acl parsedParams', parsedParams);
            ctx.permission.rawParams = lodash.cloneDeep(resourcerAction.params);

            if (parsedParams.appends && resourcerAction.params.fields) {
              for (const queryField of resourcerAction.params.fields) {
                if (parsedParams.appends.indexOf(queryField) !== -1) {
                  // move field to appends
                  if (!resourcerAction.params.appends) {
                    resourcerAction.params.appends = [];
                  }
                  resourcerAction.params.appends.push(queryField);
                  resourcerAction.params.fields = resourcerAction.params.fields.filter((f) => f !== queryField);
                }
              }
            }

            const isEmptyFields = resourcerAction.params.fields && resourcerAction.params.fields.length === 0;

            resourcerAction.mergeParams(parsedParams, {
              appends: (x, y) => {
                if (!x) {
                  return [];
                }
                if (!y) {
                  return x;
                }
                return (x as any[]).filter((i) => y.includes(i.split('.').shift()));
              },
            });

            if (isEmptyFields) {
              resourcerAction.params.fields = [];
            }

            ctx.permission.mergedParams = lodash.cloneDeep(resourcerAction.params);
          }
        } catch (e) {
          if (e instanceof NoPermissionError) {
            ctx.throw(403, 'No permissions');
            return;
          }

          throw e;
        }

        await next();
      },
      {
        tag: 'core',
        group: 'core',
      },
    );
  }

  protected isAvailableAction(actionName: string) {
    return this.availableActions.has(this.resolveActionAlias(actionName));
  }
}

function getUser(ctx) {
  return async ({ fields }) => {
    const userFields = fields.filter((f) => f && ctx.db.getFieldByPath('users.' + f));
    ctx.logger?.info('filter-parse: ', { userFields });
    if (!ctx.state.currentUser) {
      return;
    }
    if (!userFields.length) {
      return;
    }
    const user = await ctx.db.getRepository('users').findOne({
      filterByTk: ctx.state.currentUser.id,
      fields: userFields,
    });
    ctx.logger?.info('filter-parse: ', {
      $user: user?.toJSON(),
    });
    return user;
  };
}
