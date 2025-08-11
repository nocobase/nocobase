/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import { APIClient } from '@nocobase/sdk';
import type { Router } from '@remix-run/router';
import { MessageInstance } from 'antd/es/message/interface';
import type { HookAPI } from 'antd/es/modal/useModal';
import { NotificationInstance } from 'antd/es/notification/interface';
import { createRef } from 'react';
import type { Location } from 'react-router-dom';
import { ContextPathProxy } from './ContextPathProxy';
import { DataSource, DataSourceManager } from './data-source';
import { FlowEngine } from './flowEngine';
import { FlowI18n } from './flowI18n';
import { JSRunner, JSRunnerOptions } from './JSRunner';
import { FlowModel, ForkFlowModel } from './models';
import {
  APIResource,
  BaseRecordResource,
  FlowSQLRepository,
  MultiRecordResource,
  SingleRecordResource,
  SQLResource,
} from './resources';
import { FlowExitException, resolveExpressions } from './utils';
import { JSONValue } from './utils/params-resolvers';
import { FlowView, FlowViewer } from './views/FlowView';
import { ISchema } from '@nocobase/client';

type Getter<T = any> = (ctx: FlowContext) => T | Promise<T>;

export interface MetaTreeNode {
  name: string;
  title: string;
  type: string;
  interface?: string;
  uiSchema?: ISchema;
  render?: (props: any) => JSX.Element;
  // display?: 'default' | 'flatten' | 'none'; // 显示模式：默认、平铺子菜单、完全隐藏, 用于简化meta树显示层级
  children?: MetaTreeNode[] | (() => Promise<MetaTreeNode[]>);
}

export interface PropertyMeta {
  type: string;
  title: string;
  interface?: string;
  uiSchema?: ISchema; // TODO: 这个是不是压根没必要啊？
  render?: (props: any) => JSX.Element; // 自定义渲染函数
  // display?: 'default' | 'flatten' | 'none'; // 显示模式：默认、平铺子菜单、完全隐藏, 用于简化meta树显示层级
  properties?: Record<string, PropertyMeta> | (() => Promise<Record<string, PropertyMeta>>);
}

export interface PropertyOptions {
  value?: any;
  once?: boolean; // 是否只定义一次
  get?: Getter;
  cache?: boolean;
  observable?: boolean; // 是否为 observable 属性
  meta?: PropertyMeta | (() => PropertyMeta | Promise<PropertyMeta>); // 支持静态、函数和异步函数
}

type RouteOptions = {
  name?: string; // 路由唯一标识
  path?: string; // 路由模板
  params?: Record<string, any>; // 路由参数
  pathname?: string; // 路由的完整路径
};

export class FlowContext {
  _props: Record<string, PropertyOptions> = {};
  _methods: Record<string, (...args: any[]) => any> = {};
  protected _cache: Record<string, any> = {};
  protected _observableCache: Record<string, any> = observable.shallow({});
  protected _delegates: FlowContext[] = [];
  protected _pending: Record<string, Promise<any>> = {};
  [key: string]: any;
  #proxy: FlowContext | null = null;

  createProxy() {
    if (this.#proxy) {
      return this.#proxy;
    }
    this.#proxy = new Proxy(this, {
      get: (target, key, receiver) => {
        if (typeof key === 'string') {
          // 1. 检查是否为直接属性或方法，如果是则跳过委托链查找
          if (Reflect.has(target, key)) {
            const val = Reflect.get(target, key, receiver);
            if (typeof val === 'function') return val.bind(target);
            return val;
          }

          // 2. 优先查找自身 _props
          if (Object.prototype.hasOwnProperty.call(target._props, key)) {
            return target._getOwnProperty(key, this.createProxy());
          }

          // 3. 优先查找自身 _methods
          if (Object.prototype.hasOwnProperty.call(target._methods, key)) {
            return target._getOwnMethod(key, this.createProxy());
          }

          // 4. 只有在自身没有该属性时才查找委托链
          const found = this._findInDelegates(target._delegates, key);
          if (found !== undefined) return found.result;

          return undefined;
        }
        return Reflect.get(target, key, receiver);
      },
      has: (target, key) => {
        if (typeof key === 'string') {
          // 1. 检查直接属性
          if (Reflect.has(target, key)) return true;

          // 2. 检查 _props 和 _methods
          if (Object.prototype.hasOwnProperty.call(target._props, key)) return true;
          if (Object.prototype.hasOwnProperty.call(target._methods, key)) return true;

          // 3. 检查委托链
          if (this._hasInDelegates(target._delegates, key)) return true;
        }
        return Reflect.has(target, key);
      },
    });
    return this.#proxy;
  }

  constructor() {
    return this.createProxy();
  }

  defineProperty(key: string, options: PropertyOptions) {
    if (this._props[key] && this._props[key]?.once) {
      return;
    }
    this._props[key] = options;
    delete this._observableCache[key]; // 清除旧的 observable 缓存
    delete this._cache[key];
    // 用 Object.defineProperty 挂载到实例上，便于 ctx.foo 直接访问
    Object.defineProperty(this, key, {
      configurable: true,
      enumerable: true,
      get: () => this._getOwnProperty(key, this.createProxy()),
    });
  }

  defineMethod(name: string, fn: (...args: any[]) => any) {
    this._methods[name] = fn;
    Object.defineProperty(this, name, {
      configurable: true,
      enumerable: false,
      writable: false,
      value: fn.bind(this.createProxy()),
    });
  }

  removeCache(key: string) {
    if (key in this._observableCache) {
      delete this._observableCache[key];
      return true;
    }
    if (key in this._cache) {
      delete this._cache[key];
      return true;
    }
    if (key in this._pending) {
      delete this._pending[key];
      return true;
    }
    // 递归清理委托链
    for (const delegate of this._delegates) {
      if (delegate.removeCache(key)) {
        return true;
      }
    }
  }

  delegate(ctx: FlowContext) {
    if (!(ctx instanceof FlowContext)) {
      throw new Error('Delegate must be an instance of FlowContext');
    }

    // 防止重复委托同一个 context
    if (this._delegates.includes(ctx)) {
      console.warn(`[FlowContext] delegate - skip duplicate delegate: ${this._delegates.length}`);
      return;
    }

    this._delegates.unshift(ctx);
  }

  addDelegate(ctx: FlowContext) {
    if (!(ctx instanceof FlowContext)) {
      throw new Error('Delegate must be an instance of FlowContext');
    }
    if (!this._delegates.includes(ctx)) {
      this._delegates.unshift(ctx);
    }
  }

  removeDelegate(ctx: FlowContext) {
    if (!(ctx instanceof FlowContext)) {
      throw new Error('Delegate must be an instance of FlowContext');
    }
    const index = this._delegates.indexOf(ctx);
    if (index !== -1) {
      this._delegates.splice(index, 1);
    }
  }

  has(key: string) {
    return !!this._props[key];
  }

  /**
   * 获取属性元数据树
   * 返回的 MetaTreeNode 中可能包含异步的延迟加载逻辑
   * @returns MetaTreeNode[]
   *
   * @example
   * // 同步调用，获取 meta tree（现有代码无需修改）
   * const metaTree = flowContext.getPropertyMetaTree();
   *
   * // 某些节点可能包含异步的 children 加载逻辑
   */
  getPropertyMetaTree(): MetaTreeNode[] {
    const metaMap = this._getPropertiesMeta();

    const createChildNodes = (
      properties: Record<string, PropertyMeta> | (() => Promise<Record<string, PropertyMeta>>),
    ) => {
      return typeof properties === 'function'
        ? async () => {
            const resolved = await properties();
            return Object.entries(resolved).map(([name, meta]) => toTreeNode(name, meta));
          }
        : Object.entries(properties).map(([name, meta]) => toTreeNode(name, meta));
    };

    const toTreeNode = (name: string, metaOrFactory: PropertyMeta | (() => Promise<PropertyMeta>)): MetaTreeNode => {
      if (typeof metaOrFactory === 'function') {
        // 异步 meta：延迟加载节点
        return {
          name,
          title: name,
          type: 'object',
          interface: undefined,
          uiSchema: undefined,
          // display: 'default',
          children: async () => {
            try {
              const meta = await metaOrFactory();
              if (!meta?.properties) return [];
              const childNodes = createChildNodes(meta.properties);
              return Array.isArray(childNodes) ? childNodes : await childNodes();
            } catch (error) {
              console.warn(`Failed to load meta for ${name}:`, error);
              return [];
            }
          },
        };
      }

      // 同步 meta：直接创建节点
      return {
        name,
        title: metaOrFactory.title,
        type: metaOrFactory.type,
        interface: metaOrFactory.interface,
        uiSchema: metaOrFactory.uiSchema,
        children: metaOrFactory.properties ? createChildNodes(metaOrFactory.properties) : undefined,
      };
    };

    return Object.entries(metaMap).map(([key, metaOrFactory]) => toTreeNode(key, metaOrFactory));
  }

  _getPropertiesMeta(): Record<string, PropertyMeta | (() => Promise<PropertyMeta>)> {
    const metaMap: Record<string, PropertyMeta | (() => Promise<PropertyMeta>)> = {};

    // 先处理委托链（委托链的 meta 优先级较低）
    for (const delegate of this._delegates) {
      Object.assign(metaMap, delegate._getPropertiesMeta());
    }

    // 处理自身属性（自身属性优先级较高）
    for (const [key, options] of Object.entries(this._props)) {
      if (options.meta) {
        metaMap[key] =
          typeof options.meta === 'function' ? (options.meta as () => Promise<PropertyMeta>) : options.meta;
      }
    }

    return metaMap;
  }

  // 只查找自身 _props
  protected _getOwnProperty(key: string, currentContext): any {
    const options = this._props[key];
    if (!options) return undefined;

    // 静态值
    if ('value' in options) {
      return options.value;
    }

    // get 方法
    if (options.get) {
      if (options.cache === false) {
        return options.get(currentContext);
      }

      const cacheKey = options.observable ? '_observableCache' : '_cache';

      if (key in this[cacheKey]) {
        return this[cacheKey][key];
      }

      if (this._pending[key]) return this._pending[key];

      // 支持 async getter 并发排队
      const result = options.get(this.createProxy());

      // 判断是否为 Promise/thenable
      const isPromise =
        (typeof result === 'object' && result !== null && typeof (result as any).then === 'function') ||
        (typeof result === 'function' && typeof (result as any).then === 'function');

      if (isPromise) {
        this._pending[key] = (result as Promise<any>).then(
          (v) => {
            this[cacheKey][key] = v;
            delete this._pending[key];
            return v;
          },
          (err) => {
            delete this._pending[key];
            throw err;
          },
        );
        return this._pending[key];
      }

      // sync 直接缓存
      this[cacheKey][key] = result;
      return result;
    }

    return undefined;
  }

  // 只查找自身 _methods
  protected _getOwnMethod(key: string, flowContext?: FlowContext): any {
    const fn = this._methods[key];
    if (typeof fn === 'function') {
      return fn.bind(flowContext);
    }
    return fn;
  }

  _findPropertyInDelegates(delegates: FlowContext[], key: string): PropertyOptions | undefined {
    for (const delegate of delegates) {
      // 1. 查找委托的 _props
      if (Object.prototype.hasOwnProperty.call(delegate._props, key)) {
        return delegate._props[key];
      }
      // 2. 递归查找更深层的委托链
      const found = this._findPropertyInDelegates(delegate._delegates, key);
      if (found !== undefined) return found;
    }
    return undefined;
  }

  _findInDelegates(delegates: FlowContext[], key: string): any {
    for (const delegate of delegates) {
      // 1. 查找委托的 _props
      if (Object.prototype.hasOwnProperty.call(delegate._props, key)) {
        return {
          result: delegate._getOwnProperty(key, this.createProxy()),
        };
      }
      // 2. 查找委托的 _methods
      if (Object.prototype.hasOwnProperty.call(delegate._methods, key)) {
        return {
          result: delegate._getOwnMethod(key, this.createProxy()),
        };
      }
      // 3. 递归查找更深层的委托链
      const found = this._findInDelegates(delegate._delegates, key);
      if (found !== undefined) return found;
    }
    return undefined;
  }

  // 递归查找委托链
  _hasInDelegates(delegates: FlowContext[], key: string): boolean {
    for (const delegate of delegates) {
      if (Object.prototype.hasOwnProperty.call(delegate._props, key)) return true;
      if (Object.prototype.hasOwnProperty.call(delegate._methods, key)) return true;
      if (this._hasInDelegates(delegate._delegates, key)) return true;
    }
    return false;
  }
}

class BaseFlowEngineContext extends FlowContext {
  declare router: Router;
  declare dataSourceManager: DataSourceManager;
  declare requireAsync: (url: string) => Promise<any>;
  declare createJSRunner: (options?: JSRunnerOptions) => JSRunner;
  /**
   * @deprecated use `resolveJsonTemplate` instead
   */
  declare renderJson: (template: JSONValue, options?: Record<string, any>) => Promise<any>;
  declare resolveJsonTemplate: (template: JSONValue, options?: Record<string, any>) => Promise<any>;
  declare runjs: (code: string, variables?: Record<string, any>) => Promise<any>;
  declare api: APIClient;
  declare viewer: FlowViewer;
  declare view: FlowView;
  declare modal: HookAPI;
  declare message: MessageInstance;
  declare notification: NotificationInstance;
  declare route: RouteOptions;
  declare location: Location;
  declare sql: FlowSQLRepository;
}

class BaseFlowModelContext extends BaseFlowEngineContext {
  declare model: FlowModel;
  declare ref: React.RefObject<HTMLDivElement>;
}

export class FlowEngineContext extends BaseFlowEngineContext {
  // public dataSourceManager: DataSourceManager;
  constructor(public engine: FlowEngine) {
    if (!(engine instanceof FlowEngine)) {
      throw new Error('Invalid FlowEngine instance');
    }
    super();
    this.engine = engine;
    const dataSourceManager = new DataSourceManager();
    dataSourceManager.setFlowEngine(this.engine);
    const mainDataSource = new DataSource({
      key: 'main',
      displayName: 'Main',
    });
    dataSourceManager.addDataSource(mainDataSource);
    this.defineProperty('engine', {
      value: this.engine,
    });
    this.defineProperty('sql', {
      get: () => new FlowSQLRepository(this),
    });
    this.defineProperty('dataSourceManager', {
      value: dataSourceManager,
    });
    const i18n = new FlowI18n(this);
    this.defineMethod('t', (keyOrTemplate: string, options?: any) => {
      return i18n.translate(keyOrTemplate, options);
    });
    this.defineMethod('renderJson', function (template: any) {
      return resolveExpressions(template, this);
    });
    this.defineMethod('resolveJsonTemplate', function (template: any) {
      return resolveExpressions(template, this);
    });
    this.defineProperty('requirejs', {
      get: () => this.app?.requirejs?.requirejs,
    });
    this.defineProperty('auth', {
      get: () => ({
        roleName: this.api.auth.role,
        locale: this.api.auth.locale,
        token: this.api.auth.token,
        user: this.user,
      }),
    });
    this.defineMethod('loadCSS', async (url: string) => {
      return new Promise((resolve, reject) => {
        // Check if CSS is already loaded
        const existingLink = document.querySelector(`link[href="${url}"]`);
        if (existingLink) {
          resolve(null);
          return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        link.onload = () => resolve(null);
        link.onerror = () => reject(new Error(`Failed to load CSS: ${url}`));
        document.head.appendChild(link);
      });
    });
    this.defineMethod('requireAsync', async (url: string) => {
      return new Promise((resolve, reject) => {
        if (!this.requirejs) {
          reject(new Error('requirejs is not available'));
          return;
        }
        this.requirejs(
          [url],
          (...args: any[]) => {
            resolve(args[0]);
          },
          reject,
        );
      });
    });
    this.defineMethod('createJSRunner', (options) => {
      return new JSRunner({
        ...options,
        globals: {
          ctx: this,
          ...options?.globals,
        },
      });
    });
    this.defineMethod('runjs', function (code, variables) {
      const runner = new JSRunner({
        globals: {
          ctx: this,
          ...variables,
        },
      });
      return runner.run(code);
    });
  }
}

export class FlowModelContext extends BaseFlowModelContext {
  constructor(model: FlowModel) {
    if (!(model instanceof FlowModel)) {
      throw new Error('Invalid FlowModel instance');
    }
    super();
    this.addDelegate(model.flowEngine.context);
    this.defineMethod('onRefReady', (ref, cb, timeout) => {
      this.engine.reactView.onRefReady(ref, cb, timeout);
    });
    this.defineProperty('model', {
      value: model,
    });
    this.defineProperty('ref', {
      get: () => {
        this.model['_refCreated'] = true;
        return createRef<HTMLDivElement>();
      },
    });
  }
}

export class FlowForkModelContext extends BaseFlowModelContext {
  constructor(
    public master: FlowModel,
    public fork: ForkFlowModel,
  ) {
    if (!(master instanceof FlowModel)) {
      throw new Error('Invalid FlowModel instance');
    }
    super();
    this.addDelegate(this.master.context);
    this.defineMethod('onRefReady', (ref, cb, timeout) => {
      this.engine.reactView.onRefReady(ref, cb, timeout);
    });
    this.defineProperty('model', {
      get: () => this.fork,
    });
    this.defineProperty('ref', {
      get: () => {
        this.fork['_refCreated'] = true;
        return createRef<HTMLDivElement>();
      },
    });
    this.defineMethod('runjs', async (code, variables) => {
      const runner = new JSRunner({
        globals: {
          ctx: this,
          ...variables,
        },
      });
      return runner.run(code);
    });
  }
}

export class FlowRuntimeContext<
  TModel extends FlowModel = FlowModel,
  TMode extends 'runtime' | 'settings' = any,
> extends BaseFlowModelContext {
  stepResults: Record<string, any> = {};
  declare useResource: (className: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource') => void;

  constructor(
    public model: TModel,
    public flowKey: string,
    protected _mode: TMode = 'runtime' as TMode,
  ) {
    super();
    this.addDelegate(this.model.context);
    const ResourceMap = { APIResource, BaseRecordResource, SingleRecordResource, MultiRecordResource, SQLResource };
    this.defineMethod(
      'useResource',
      (className: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource') => {
        if (model.context.has('resource')) {
          console.warn(`[FlowRuntimeContext] useResource - resource already defined in context: ${className}`);
          return;
        }
        model.context.defineProperty('resource', {
          get: () => {
            const R = ResourceMap[className];
            if (!R) {
              throw new Error(`Resource class ${className} not found in ResourceMap`);
            }
            const resource = new R() as APIResource;
            resource.setAPIClient(model.context.api);
            return resource;
          },
        });
        if (!model['resource']) {
          model['resource'] = model.context.resource;
        }
      },
    );
    this.defineProperty('resource', {
      get: () => model['resource'] || model.context['resource'],
      cache: false,
    });
    this.defineMethod('onRefReady', (ref, cb, timeout) => {
      this.engine.reactView.onRefReady(ref, cb, timeout);
    });
    this.defineMethod('runjs', async (code, variables) => {
      const runner = new JSRunner({
        globals: {
          ctx: this,
          ...variables,
        },
      });
      return runner.run(code);
    });
  }

  protected _getOwnProperty(key: string): any {
    if (this.mode === 'runtime') {
      return super._getOwnProperty(key, this.createProxy());
    }

    const options = this._props[key];
    if (!options) return undefined;

    // 静态值
    if ('value' in options) {
      return ContextPathProxy.create()[key];
    }

    // get 方法
    if (options.get) {
      if (options.cache === false) {
        return ContextPathProxy.create()[key];
      }

      const cacheKey = options.observable ? '_observableCache' : '_cache';

      if (!(key in this[cacheKey])) {
        this[cacheKey][key] = ContextPathProxy.create()[key];
      }
      return this[cacheKey][key];
    }

    return undefined;
  }

  exit() {
    throw new FlowExitException(this.flowKey, this.model.uid);
  }

  get mode() {
    return this._mode;
  }
}

// 类型别名，方便使用
export type FlowSettingsContext<TModel extends FlowModel = FlowModel> = FlowRuntimeContext<TModel, 'settings'>;
