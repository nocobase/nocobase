/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import _, { omit } from 'lodash';
import { FlowEngine } from '../flowEngine';
import type { FlowContext } from '../flowContext';

interface CheckOptions {
  dataSourceKey?: string;
  resourceName?: string;
  actionName: string;
  fields?: string[];
  recordPkValue?: string | number;
  allowedActions?: Record<string, unknown>;
  ignoreScope?: boolean;
}

type ACLBooleanExpression =
  | {
      any: ACLCanInput[];
    }
  | {
      all: ACLCanInput[];
    }
  | {
      not: ACLCanInput;
    };

type ACLCanOptions = {
  dataSourceKey?: string;
  resource?: string;
  resourceName?: string;
  action?: string;
  actionName?: string;
  fields?: string[] | string;
  filterByTk?: string | number | Record<string, string | number>;
  recordPkValue?: string | number | Record<string, string | number>;
  record?: unknown;
  allowedActions?: Record<string, unknown>;
  ignoreScope?: boolean;
  snippet?: string;
};

type ACLCanInput = string | ACLCanOptions | ACLBooleanExpression;

type ACLState = {
  data: Record<string, any>;
  meta: Record<string, any>;
  loaded: boolean;
  loadingPromise: Promise<void> | null;
  lastToken: string | null;
};

const aclStates = new WeakMap<FlowEngine, ACLState>();

function createACLState(): ACLState {
  return {
    data: {},
    meta: {},
    loaded: false,
    loadingPromise: null,
    lastToken: null,
  };
}

function getACLState(flowEngine: FlowEngine): ACLState {
  const state = aclStates.get(flowEngine);
  if (state) {
    return state;
  }
  const nextState = createACLState();
  aclStates.set(flowEngine, nextState);
  return nextState;
}

const friendlyActionAlias: Record<string, string> = {
  read: 'view',
  list: 'view',
  get: 'view',
  query: 'view',
  add: 'create',
  write: 'update',
  edit: 'update',
  save: 'update',
  delete: 'destroy',
  remove: 'destroy',
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function normalizePkValue(value: unknown): string | number | undefined {
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }
  if (isPlainObject(value)) {
    const first = Object.values(value)[0];
    if (typeof first === 'string' || typeof first === 'number') {
      return first;
    }
  }
  return undefined;
}

function normalizeFields(fields?: string[] | string) {
  if (!fields) return undefined;
  return Array.isArray(fields) ? fields : [fields];
}

function wildcardMatch(value: string, pattern: string) {
  if (pattern === '*') return true;
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(value);
}

export class ACL {
  constructor(
    private flowEngine: FlowEngine,
    private context?: FlowContext,
    private state: ACLState = getACLState(flowEngine),
  ) {}

  get data() {
    return this.state.data;
  }

  get meta() {
    return this.state.meta;
  }

  withContext(context: FlowContext) {
    return new ACL(this.flowEngine, context, this.state);
  }

  setData(data: Record<string, any>) {
    this.state.data = _.cloneDeep(data || {});
    this.state.loaded = true;
    this.state.lastToken = this.flowEngine?.context?.api?.auth?.token || '';
  }

  setMeta(data: Record<string, any>) {
    this.state.meta = _.cloneDeep(data || {});
  }

  async load() {
    // 基于 token 识别登录态是否发生变化
    const currentToken = this.flowEngine?.context?.api?.auth?.token || '';

    // 已加载但登录态变更：强制重载
    if (this.state.loaded && this.state.lastToken !== currentToken) {
      this.state.loaded = false;
      this.state.loadingPromise = null;
      this.state.data = {};
      this.state.meta = {};
    }

    if (this.state.loaded) {
      return;
    }

    if (!this.state.loadingPromise) {
      this.state.loadingPromise = this.flowEngine.context.api
        .request({
          url: 'roles:check',
          skipNotify: true,
          skipAuth: true,
        })
        .then(({ data }) => {
          this.state.data = data?.data || {};
          this.state.meta = data?.meta || {};
          this.state.loaded = true;
          this.state.lastToken = currentToken;
        })
        .finally(() => {
          this.state.loadingPromise = null;
        });
    }

    await this.state.loadingPromise;
  }

  async refresh() {
    this.state.loaded = false;
    this.state.loadingPromise = null;
    await this.load();
  }

  getActionAlias(actionName: string) {
    return this.data.actionAlias?.[actionName] || friendlyActionAlias[actionName] || actionName;
  }

  private getDataForSource(dataSourceName = 'main') {
    const { dataSources: dataSourcesAcl } = this.meta || {};
    return { ...this.data, ...omit(dataSourcesAcl?.[dataSourceName], 'snippets') };
  }

  inResources(resourceName?: string, dataSourceName = 'main') {
    if (!resourceName) {
      return false;
    }
    const data = this.getDataForSource(dataSourceName);
    return data.resources?.includes?.(resourceName);
  }

  getResourceActionParams(resourceName: string, actionName: string, dataSourceName = 'main') {
    const actionAlias = this.getActionAlias(actionName);
    const data = this.getDataForSource(dataSourceName);
    return (
      data.actions?.[`${resourceName}:${actionAlias}`] ||
      data.actions?.[`${resourceName}:${actionName}`] ||
      data.actions?.[actionAlias] ||
      data.actions?.[actionName]
    );
  }

  getStrategyActionParams(actionName: string, dataSourceName = 'main') {
    const actionAlias = this.getActionAlias(actionName);
    const data = this.getDataForSource(dataSourceName);
    const strategyAction = data?.strategy?.actions?.find((action) => {
      const [value] = action.split(':');
      return value === actionAlias;
    });
    return strategyAction ? {} : null;
  }

  canSnippet(snippet?: string) {
    if (!snippet || snippet === '*') {
      return true;
    }
    if (this.data?.allowAll) {
      return true;
    }

    let allowed = false;
    const snippets: string[] = Array.isArray(this.data?.snippets) ? this.data.snippets : [];
    for (const raw of snippets) {
      const negated = raw.startsWith('!');
      const pattern = negated ? raw.slice(1) : raw;
      if (wildcardMatch(snippet, pattern)) {
        allowed = !negated;
      }
    }
    return allowed;
  }

  private normalizeActionName(actionName?: string) {
    if (!actionName) return undefined;
    const friendly = friendlyActionAlias[actionName] || actionName;
    return this.getActionAlias(friendly);
  }

  private parseStringInput(input: string): ACLCanOptions {
    const [resource, action] = input.includes(':') ? input.split(':') : [undefined, input];
    return { resource, action };
  }

  private getContext() {
    return this.context || this.flowEngine.context;
  }

  private inferResourceName(options: ACLCanOptions) {
    const ctx = this.getContext() as Record<string, any>;
    return (
      options.resource ||
      options.resourceName ||
      ctx.resourceName ||
      ctx.resource?.getResourceName?.() ||
      ctx.collection?.name
    );
  }

  private inferDataSourceKey(options: ACLCanOptions) {
    const ctx = this.getContext() as Record<string, any>;
    return (
      options.dataSourceKey ||
      ctx.dataSource?.key ||
      ctx.collection?.dataSourceKey ||
      ctx.resource?.getDataSourceKey?.() ||
      'main'
    );
  }

  private inferRecordPkValue(options: ACLCanOptions) {
    const ctx = this.getContext() as Record<string, any>;
    const explicitValue = normalizePkValue(options.recordPkValue ?? options.filterByTk);
    if (typeof explicitValue !== 'undefined') {
      return explicitValue;
    }

    const record = typeof options.record === 'undefined' ? ctx.record : options.record;
    const collection = ctx.collection;
    const collectionValue = record ? normalizePkValue(collection?.getFilterByTK?.(record)) : undefined;
    if (typeof collectionValue !== 'undefined') {
      return collectionValue;
    }

    if (isPlainObject(record)) {
      return normalizePkValue(record.id);
    }

    return normalizePkValue(ctx.resource?.getMeta?.('currentFilterByTk'));
  }

  private inferAllowedActions(options: ACLCanOptions) {
    const ctx = this.getContext() as Record<string, any>;
    return options.allowedActions || ctx.resource?.getMeta?.('allowedActions');
  }

  private canAction(options: ACLCanOptions) {
    if (options.snippet) {
      return this.canSnippet(options.snippet);
    }

    const actionName = this.normalizeActionName(options.actionName || options.action);
    const resourceName = this.inferResourceName(options);
    if (!actionName || !resourceName) {
      return false;
    }

    const result = this.aclCheckSync({
      dataSourceKey: this.inferDataSourceKey(options),
      resourceName,
      actionName,
      fields: normalizeFields(options.fields),
      allowedActions: this.inferAllowedActions(options),
      recordPkValue: this.inferRecordPkValue(options),
      ignoreScope: options.ignoreScope,
    });

    return !!result;
  }

  can(input: ACLCanInput, options: ACLCanOptions = {}) {
    if (typeof input === 'string') {
      return this.canAction({ ...this.parseStringInput(input), ...options });
    }

    if (!isPlainObject(input)) {
      return false;
    }

    if (Array.isArray(input.any)) {
      return input.any.some((item) => this.can(item, options));
    }
    if (Array.isArray(input.all)) {
      return input.all.every((item) => this.can(item, options));
    }
    if ('not' in input) {
      return !this.can(input.not, options);
    }

    return this.canAction({ ...(input as ACLCanOptions), ...options });
  }

  getIgnoreScope = (options: CheckOptions = {}) => {
    const { recordPkValue, allowedActions, actionName } = options;
    let ignoreScope = false;
    if (options.ignoreScope) {
      ignoreScope = true;
    }
    if (actionName === 'create') {
      ignoreScope = true;
    }
    if (!recordPkValue || !allowedActions) {
      ignoreScope = true;
    }
    return ignoreScope;
  };

  verifyScope = (actionName: string, recordPkValue: any, allowedActions?: Record<string, unknown>) => {
    const actionAlias = this.getActionAlias(actionName);
    const scopeValues = allowedActions?.[actionAlias] || allowedActions?.[actionName];

    if (!Array.isArray(scopeValues)) {
      return null;
    }

    return scopeValues.map((v) => String(v)).includes(String(recordPkValue));
  };

  parseAction(options: CheckOptions) {
    const { resourceName, actionName, dataSourceKey = 'main', recordPkValue, allowedActions } = options;
    if (!resourceName || !actionName) {
      return null;
    }
    const targetResource =
      resourceName?.includes('.') &&
      this.flowEngine.context.dataSourceManager
        .getDataSource(dataSourceKey)
        .collectionManager.getAssociation(resourceName)?.target;
    if (!this.getIgnoreScope(options)) {
      const r = this.verifyScope(actionName, recordPkValue, allowedActions);
      if (!r) {
        return null;
      }
    }

    if (this.data?.allowAll) {
      return {};
    }
    if (this.inResources(targetResource, dataSourceKey)) {
      return this.getResourceActionParams(targetResource, actionName, dataSourceKey);
    }
    if (this.inResources(resourceName, dataSourceKey)) {
      return this.getResourceActionParams(resourceName, actionName, dataSourceKey);
    }
    return this.getStrategyActionParams(actionName, dataSourceKey);
  }

  parseField(options: CheckOptions) {
    const { fields } = options;
    const params = this.parseAction(options);
    const whitelist = []
      .concat(params?.whitelist || [])
      .concat(params?.fields || [])
      .concat(params?.appends || []);
    if (params && !Object.keys(params).length) {
      return true;
    }
    const allowed = fields?.[0] ? whitelist.includes(fields[0]) : false;
    return allowed;
  }

  aclCheckSync(options: CheckOptions): boolean | Record<string, any> | null {
    const { allowAll } = this.data;
    if (allowAll) {
      return true;
    }
    if (options.fields) {
      return this.parseField(options);
    }
    return this.parseAction(options);
  }

  async aclCheck(options: CheckOptions): Promise<boolean | Record<string, any> | null> {
    await this.load();
    return this.aclCheckSync(options);
  }
}
