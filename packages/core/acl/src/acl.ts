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
import { NoPermissionError } from './errors/no-permission-error';
import FixedParamsManager, { Merger, GeneralMerger } from './fixed-params-manager';
import SnippetManager, { SnippetOptions } from './snippet-manager';
import { mergeAclActionParams, removeEmptyParams } from './utils';
import Database, { Collection } from '@nocobase/database';

export interface CanResult {
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

export type UserProvider = (args: { fields: string[] }) => Promise<any>;

export interface ParseJsonTemplateOptions {
  timezone?: string;
  state?: any;
  userProvider?: UserProvider;
}

type ProcessValuesOptions = {
  values: Record<string, any> | Record<string, any>[];
  updateAssociationValues: string[];
  aclParams: any;
  collection: Collection;
  lastFieldPath?: string;
  protectedKeys?: string[];
  can?: (options: Omit<CanArgs, 'role'>) => CanResult | null;
  parseOptions?: ParseJsonTemplateOptions;
};

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
      if (options.roles.includes('root')) {
        options.roles = ['root'];
      }
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

    if (role === 'root') {
      return {
        resource,
        action,
        role,
      };
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
    if (!condition) {
      condition = 'public';
    }

    if (!Array.isArray(actionNames)) {
      actionNames = [actionNames];
    }

    for (const actionName of actionNames) {
      this.allowManager.allow(resourceName, actionName, condition);
    }
  }

  middleware() {
    const acl = this;

    return async function ACLMiddleware(ctx, next) {
      ctx.acl = acl;

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

  addGeneralFixedParams(merger: GeneralMerger) {
    this.fixedParamsManager.addGeneralParams(merger);
  }

  addFixedParams(resource: string, action: string, merger: Merger) {
    this.fixedParamsManager.addParams(resource, action, merger);
  }

  registerSnippet(snippet: SnippetOptions) {
    this.snippetManager.register(snippet);
  }

  async sanitizeAssociationValues(options: {
    resourceName: string;
    actionName: string;
    values: any;
    updateAssociationValues?: string[];
    protectedKeys?: string[];
    aclParams?: any;
    roles?: string[];
    currentRole?: string;
    currentUser?: any;
    db?: any;
    database?: any;
    timezone?: string;
    userProvider?: UserProvider;
  }) {
    const { resourceName, actionName, values, updateAssociationValues = [], protectedKeys = [], aclParams } = options;

    if (lodash.isEmpty(values)) {
      return values;
    }

    const collection = (options.database ?? options.db).getCollection(resourceName);
    const params = aclParams ?? this.fixedParamsManager.getParams(resourceName, actionName);
    const roles = options.roles;
    const can = (canOptions: Omit<CanArgs, 'role'>) =>
      this.can({ roles: roles?.length ? roles : ['anonymous'], ...canOptions });

    const parseOptions: ParseJsonTemplateOptions = {
      timezone: options.timezone,
      userProvider: options.userProvider,
      state: {
        currentRole: options.currentRole,
        currentRoles: options.roles,
        currentUser: options.currentUser,
      },
    };

    return await processValues({
      values,
      updateAssociationValues,
      aclParams: params,
      collection,
      lastFieldPath: '',
      protectedKeys,
      can,
      parseOptions,
    });
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
            const db = ctx.database ?? ctx.db;
            const collection = db?.getCollection?.(resourceName);
            checkFilterParams(collection, params?.filter);
            const parsedFilter = await parseJsonTemplate(params.filter, {
              state: ctx.state,
              timezone: getTimezone(ctx),
              userProvider: createUserProvider({
                db: ctx.db,
                currentUser: ctx.state?.currentUser,
              }),
            });
            const parsedParams = params.filter ? { ...params, filter: parsedFilter ?? params.filter } : params;

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

type AllowedRecordKeysResult = {
  allowedKeys: Set<any>;
  missingKeys: Set<any>;
};

function getTimezone(ctx: any) {
  return ctx?.request?.get?.('x-timezone') ?? ctx?.request?.header?.['x-timezone'] ?? ctx?.req?.headers?.['x-timezone'];
}

export function createUserProvider({ db, currentUser }: { db: Database; currentUser?: any }): UserProvider {
  return async ({ fields }) => {
    if (!db) {
      return;
    }
    if (!currentUser) {
      return;
    }
    const userFields = fields.filter((f) => f && db.getFieldByPath('users.' + f));
    if (!userFields.length) {
      return;
    }
    const user = await db.getRepository('users').findOne({
      filterByTk: currentUser.id,
      fields: userFields,
    });
    return user;
  };
}

function containsCreatedByIdFilter(input: any, seen = new Set<any>()): boolean {
  if (!input) {
    return false;
  }

  if (Array.isArray(input)) {
    return input.some((item) => containsCreatedByIdFilter(item, seen));
  }

  if (!lodash.isPlainObject(input)) {
    return false;
  }

  if (seen.has(input)) {
    return false;
  }
  seen.add(input);

  for (const [key, value] of Object.entries(input)) {
    if (isCreatedByIdKey(key)) {
      return true;
    }

    if (containsCreatedByIdFilter(value, seen)) {
      return true;
    }
  }

  return false;
}

function isCreatedByIdKey(key: string): boolean {
  return key === 'createdById' || key.startsWith('createdById.') || key.startsWith('createdById$');
}

/**
 * @internal
 */
async function processValues(options: ProcessValuesOptions) {
  const {
    values,
    updateAssociationValues,
    aclParams,
    collection,
    lastFieldPath = '',
    protectedKeys = [],
    can,
    parseOptions,
  } = options;
  if (Array.isArray(values)) {
    const result = [];

    for (const item of values) {
      if (!lodash.isPlainObject(item)) {
        result.push(item);
        continue;
      }

      const processed = await processValues({
        values: item,
        updateAssociationValues,
        aclParams,
        collection,
        lastFieldPath,
        protectedKeys,
        can,
        parseOptions,
      });

      if (processed !== null && processed !== undefined) {
        result.push(processed);
      }
    }

    return result;
  }

  if (!values || !lodash.isPlainObject(values)) {
    return values;
  }

  if (!collection) {
    return values;
  }

  let v = values;
  if (aclParams?.whitelist) {
    const combined = lodash.uniq([...aclParams.whitelist, ...protectedKeys]);
    v = lodash.pick(values, combined);
  }

  for (const [fieldName, fieldValue] of Object.entries(v)) {
    if (protectedKeys.includes(fieldName)) {
      continue;
    }

    const field = collection.getField(fieldName);
    const isAssociation =
      field && ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany', 'belongsToArray'].includes(field.type);

    if (!isAssociation) {
      continue;
    }

    const targetCollection = collection.db.getCollection(field.target);
    if (!targetCollection) {
      delete v[fieldName];
      continue;
    }

    const fieldPath = lastFieldPath ? `${lastFieldPath}.${fieldName}` : fieldName;
    const recordKey = field.type === 'hasOne' ? targetCollection.model.primaryKeyAttribute : field.targetKey;

    const canUpdateAssociation = updateAssociationValues.includes(fieldPath);

    if (!canUpdateAssociation) {
      const normalized = normalizeAssociationValue(fieldValue, recordKey);

      if (normalized === undefined && !protectedKeys.includes(fieldName)) {
        delete v[fieldName];
      } else {
        v[fieldName] = normalized;
      }

      // runtime.log?.debug?.(`Not allow to update association, only keep keys`, {
      //   fieldPath,
      //   fieldValue,
      //   updateAssociationValues,
      //   recordKey,
      //   normalizedValue: v[fieldName],
      // });
      continue;
    }

    const createParams = can?.({
      resource: field.target,
      action: 'create',
    });

    const updateParams = can?.({
      resource: field.target,
      action: 'update',
    });

    if (Array.isArray(fieldValue)) {
      const processed = [];
      let allowedRecordKeys: Set<any> | undefined;
      let existingRecordKeys: Set<any> | undefined;

      if (updateParams) {
        const allowedResult = await collectAllowedRecordKeys(
          fieldValue,
          recordKey,
          updateParams?.params?.filter,
          targetCollection,
          parseOptions,
        );
        allowedRecordKeys = allowedResult?.allowedKeys;
        if (createParams && allowedResult?.missingKeys?.size) {
          existingRecordKeys = await collectExistingRecordKeys(recordKey, targetCollection, allowedResult.missingKeys);
        }
      }

      for (const item of fieldValue) {
        const r = await processAssociationChild({
          value: item,
          recordKey,
          updateAssociationValues,
          createParams,
          updateParams,
          target: targetCollection,
          fieldPath,
          allowedRecordKeys,
          existingRecordKeys,
          can,
          parseOptions,
        });
        if (r !== null && r !== undefined) {
          processed.push(r);
        }
      }

      v[fieldName] = processed;
      continue;
    }

    const r = await processAssociationChild({
      value: fieldValue,
      recordKey,
      updateAssociationValues,
      createParams,
      updateParams,
      target: targetCollection,
      fieldPath,
      can,
      parseOptions,
    });
    v[fieldName] = r;
  }

  return v;
}

function normalizeAssociationValue(
  value: any,
  recordKey: string,
): Record<string, any> | Record<string, any>[] | undefined {
  if (!value) {
    return value;
  }
  if (Array.isArray(value)) {
    const result = value
      .map((v) => (typeof v === 'number' || typeof v === 'string' ? v : v[recordKey]))
      .filter((v) => v !== null && v !== undefined);
    return result.length > 0 ? result : undefined;
  }
  return typeof value === 'number' || typeof value === 'string' ? value : value[recordKey];
}

async function collectAllowedRecordKeys(
  items: any[],
  recordKey: string,
  filter: any,
  collection: Collection,
  parseOptions?: ParseJsonTemplateOptions,
): Promise<AllowedRecordKeysResult | undefined> {
  if (!collection) {
    return;
  }

  const { repository } = collection;

  const keys = items
    .map((item) => (lodash.isPlainObject(item) ? item[recordKey] : undefined))
    .filter((key) => key !== undefined && key !== null);

  if (!keys.length) {
    return;
  }

  try {
    checkFilterParams(collection, filter);

    const scopedFilter = filter ? await parseJsonTemplate(filter, parseOptions) : {};
    const records = await repository.find({
      filter: {
        ...scopedFilter,
        [`${recordKey}.$in`]: keys,
      },
    });

    const allowedKeys = new Set<any>();
    for (const record of records) {
      const key = typeof record.get === 'function' ? record.get(recordKey) : record[recordKey];
      if (key !== undefined && key !== null) {
        allowedKeys.add(key);
      }
    }

    const missingKeys = new Set(keys.filter((key) => !allowedKeys.has(key)));
    return { allowedKeys, missingKeys };
  } catch (e) {
    if (e instanceof NoPermissionError) {
      return {
        allowedKeys: new Set(),
        missingKeys: new Set(keys),
      };
    }
    throw e;
  }
}

async function collectExistingRecordKeys(
  recordKey: string,
  collection: Collection,
  keys: Iterable<any>,
): Promise<Set<any>> {
  const { repository } = collection;
  if (!repository) {
    return new Set();
  }

  const keyList = Array.from(keys);
  if (!keyList.length) {
    return new Set();
  }

  const records = await repository.find({
    filter: {
      [`${recordKey}.$in`]: keyList,
    },
  });

  const existingKeys = new Set<any>();
  for (const record of records) {
    const key = typeof record.get === 'function' ? record.get(recordKey) : record[recordKey];
    if (key !== undefined && key !== null) {
      existingKeys.add(key);
    }
  }
  return existingKeys;
}

async function recordExistsWithoutScope(collection: Collection, recordKey: string, keyValue: any): Promise<boolean> {
  const { repository } = collection;
  if (!repository) {
    return false;
  }
  const record = await repository.findOne({
    filter: {
      [recordKey]: keyValue,
    },
  });
  return Boolean(record);
}

type ProcessAssociationChildOptions = {
  value: Record<string, any>;
  recordKey: string;
  updateAssociationValues: string[];
  createParams: any;
  updateParams: any;
  target: Collection;
  fieldPath: string;
  allowedRecordKeys?: Set<any>;
  existingRecordKeys?: Set<any>;
  can?: (options: Omit<CanArgs, 'role'>) => CanResult | null;
  parseOptions?: ParseJsonTemplateOptions;
};

async function processAssociationChild(options: ProcessAssociationChildOptions) {
  const {
    value,
    recordKey,
    updateAssociationValues,
    createParams,
    updateParams,
    target,
    fieldPath,
    allowedRecordKeys,
    existingRecordKeys,
    can,
    parseOptions,
  } = options;
  const keyValue = value?.[recordKey];

  const fallbackToCreate = async () => {
    if (!createParams) {
      return keyValue;
    }
    // runtime.log?.debug?.(`Association record missing, fallback to create`, {
    //   fieldPath,
    //   value,
    //   target,
    // });
    return await processValues({
      values: value,
      updateAssociationValues,
      aclParams: createParams.params,
      collection: target,
      lastFieldPath: fieldPath,
      protectedKeys: [],
      can,
    });
  };

  const tryFallbackToCreate = async (
    reason: string,
    knownExists?: boolean,
  ): Promise<Record<string, any> | string | number | null | undefined> => {
    if (!createParams) {
      return undefined;
    }
    const recordExists =
      typeof knownExists === 'boolean' ? knownExists : await recordExistsWithoutScope(target, recordKey, keyValue);
    if (!recordExists) {
      // runtime.log?.debug?.(reason, {
      //   fieldPath,
      //   value,
      //   createParams,
      //   updateParams,
      // });
      return await fallbackToCreate();
    }
    return undefined;
  };

  if (keyValue !== undefined && keyValue !== null) {
    if (!updateParams) {
      const created = await tryFallbackToCreate(`No permission to update association, try create not exist record`);
      if (created !== undefined) {
        return created;
      }
      // runtime.log?.debug?.(`No permission to update association`, { fieldPath, value, updateParams });
      return keyValue;
    }
    const { repository } = target;
    if (!repository) {
      // runtime.log?.debug?.(`Repository not found for association target`, { fieldPath, target });
      return keyValue;
    }
    try {
      if (allowedRecordKeys) {
        if (!allowedRecordKeys.has(keyValue)) {
          const created = await tryFallbackToCreate(
            `No permission to update association due to scope, try create not exist record`,
            existingRecordKeys ? existingRecordKeys.has(keyValue) : undefined,
          );
          if (created !== undefined) {
            return created;
          }
          // runtime.log?.debug?.(`No permission to update association due to scope`, { fieldPath, value, updateParams });
          return keyValue;
        }
      } else {
        checkFilterParams(target, updateParams.params?.filter);
        const filter = await parseJsonTemplate(updateParams.params?.filter, parseOptions);
        const record = await repository.findOne({
          filter: {
            ...filter,
            [recordKey]: keyValue,
          },
        });
        if (!record) {
          const created = await tryFallbackToCreate(
            `No permission to update association due to scope, try create not exist record`,
          );
          if (created !== undefined) {
            return created;
          }
          // runtime.log?.debug?.(`No permission to update association due to scope`, { fieldPath, value, updateParams });
          return keyValue;
        }
      }
      return await processValues({
        values: value,
        updateAssociationValues,
        aclParams: updateParams.params,
        collection: target,
        lastFieldPath: fieldPath,
        protectedKeys: [],
        can,
      });
    } catch (e) {
      if (e instanceof NoPermissionError) {
        return keyValue;
      }
      throw e;
    }
  }

  if (createParams) {
    return await processValues({
      values: value,
      updateAssociationValues,
      aclParams: createParams.params,
      collection: target,
      lastFieldPath: fieldPath,
      protectedKeys: [],
      can,
    });
  }

  // runtime.log?.debug?.(`No permission to create association`, { fieldPath, value, createParams });
  return null;
}

/**
 * @internal
 */
export async function parseJsonTemplate(filter: any, options: ParseJsonTemplateOptions) {
  if (!filter) {
    return filter;
  }

  const timezone = options?.timezone;
  const state = JSON.parse(JSON.stringify(options?.state || {}));
  const parsedFilter = await parseFilter(filter, {
    timezone,
    now: new Date().toISOString(),
    vars: {
      ctx: {
        state,
      },
      $user: options?.userProvider || (async () => undefined),
      $nRole: () => state.currentRole,
    },
  });
  return parsedFilter;
}

/**
 * @internal
 */
export function checkFilterParams(collection: Collection, filter: any) {
  if (!filter) {
    return;
  }

  if (!containsCreatedByIdFilter(filter)) {
    return;
  }

  if (!collection || !collection.getField('createdById')) {
    throw new NoPermissionError('createdById field not found');
  }
}
