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
import { DrawerProps, ModalProps, PopoverProps } from 'antd';
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
import { APIResource, BaseRecordResource, MultiRecordResource, SingleRecordResource } from './resources';
import { FlowExitException, resolveDefaultParams, resolveExpressions } from './utils';

type Getter<T = any> = (ctx: FlowContext) => T | Promise<T>;

interface OpenDialogProps extends ModalProps {
  mode: 'dialog';
  content?: React.ReactNode | ((dialog: any) => React.ReactNode);
  [key: string]: any;
}

type OpenDrawerProps = {
  mode: 'drawer';
  [key: string]: any;
};

type OpenInlineProps = {
  mode: 'inline';
  target: any;
  [key: string]: any;
};

type OpenPopoverProps = {
  mode: 'popover';
  target: any;
  content?: React.ReactNode | ((popover: any) => React.ReactNode);
  [key: string]: any;
};

type OpenProps = OpenDialogProps | OpenDrawerProps | OpenPopoverProps | OpenInlineProps;

interface ViewOpener {
  open: (props: OpenProps) => Promise<any>;
}

export interface MetaTreeNode {
  name: string;
  title: string;
  type: string;
  interface?: string;
  uiSchema?: any;
  display?: 'default' | 'flatten' | 'none'; // 显示模式：默认、平铺子菜单、完全隐藏
  children?: MetaTreeNode[] | (() => Promise<MetaTreeNode[]>);
}

export interface PropertyMeta {
  type: string;
  title: string;
  interface?: string;
  uiSchema?: any;
  display?: 'default' | 'flatten' | 'none'; // 显示模式：默认、平铺子菜单、完全隐藏
  properties?: Record<string, PropertyMeta> | (() => Promise<Record<string, PropertyMeta>>);
}

export interface PropertyOptions {
  value?: any;
  once?: boolean; // 是否只定义一次
  get?: Getter;
  cache?: boolean;
  observable?: boolean; // 是否为 observable 属性
  meta?: PropertyMeta;
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

  constructor() {
    return new Proxy(this, {
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
            return target._getOwnProperty(key);
          }

          // 3. 优先查找自身 _methods
          if (Object.prototype.hasOwnProperty.call(target._methods, key)) {
            return target._getOwnMethod(key);
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
      get: () => this._getOwnProperty(key),
    });
  }

  defineMethod(name: string, fn: (...args: any[]) => any) {
    this._methods[name] = fn;
    Object.defineProperty(this, name, {
      configurable: true,
      enumerable: false,
      writable: false,
      value: fn.bind(this),
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

  getPropertyMetaTree(): MetaTreeNode[] {
    const metaMap = this._getPropertiesMeta();

    const toTreeNode = (name: string, meta: PropertyMeta): MetaTreeNode => ({
      name,
      title: meta.title,
      type: meta.type,
      interface: meta.interface,
      uiSchema: meta.uiSchema,
      display: meta.display,
      children: meta.properties
        ? typeof meta.properties === 'function'
          ? async () => {
              const resolvedProperties = await (meta.properties as () => Promise<Record<string, PropertyMeta>>)();
              return Object.entries(resolvedProperties).map(([childName, childMeta]) =>
                toTreeNode(childName, childMeta),
              );
            }
          : Object.entries(meta.properties as Record<string, PropertyMeta>).map(([childName, childMeta]) =>
              toTreeNode(childName, childMeta),
            )
        : undefined,
    });

    return Object.entries(metaMap).map(([key, meta]) => toTreeNode(key, meta));
  }

  _getPropertiesMeta() {
    // 合并自身和委托链上的所有 meta 属性
    const metaMap: Record<string, PropertyMeta> = {};
    // 先加委托链（不覆盖自身）
    for (const delegate of this._delegates) {
      const delegateMeta = delegate._getPropertiesMeta();
      Object.assign(metaMap, delegateMeta); // 合并，后面的覆盖前面的
    }
    // 先加自身
    for (const [key, options] of Object.entries(this._props)) {
      if (options.meta) {
        metaMap[key] = options.meta;
      }
    }
    return metaMap;
  }

  // 只查找自身 _props
  protected _getOwnProperty(key: string): any {
    const options = this._props[key];
    if (!options) return undefined;

    // 静态值
    if ('value' in options) {
      return options.value;
    }

    // get 方法
    if (options.get) {
      if (options.cache === false) {
        return options.get(this);
      }

      const cacheKey = options.observable ? '_observableCache' : '_cache';

      if (key in this[cacheKey]) {
        return this[cacheKey][key];
      }

      if (this._pending[key]) return this._pending[key];

      // 支持 async getter 并发排队
      const result = options.get(this);

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
  protected _getOwnMethod(key: string): any {
    const fn = this._methods[key];
    if (typeof fn === 'function') {
      return fn.bind(this);
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
          result: delegate._getOwnProperty(key),
        };
      }
      // 2. 查找委托的 _methods
      if (Object.prototype.hasOwnProperty.call(delegate._methods, key)) {
        return {
          result: delegate._getOwnMethod(key),
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

type RunSQLOptions = {
  uid: string; // 必填，SQL 唯一标识，非调试模式时，后端会根据 `uid` 查找对应 SQL。
  sql: string; // 调试模式时，以 upsert 方式创建或更新 SQL。
  params?: Record<string, any>; // 可选，SQL 参数
  type?: 'selectRows' | 'selectRow' | 'selectVar'; // 可选，默认 selectRows
  debug?: boolean;
};

export class FlowEngineContext extends FlowContext {
  declare router: Router;
  declare dataSourceManager: DataSourceManager;
  declare requireAsync: (url: string) => Promise<any>;
  declare createJSRunner: (options?: JSRunnerOptions) => JSRunner;
  declare renderJson: (template: any) => Promise<any>;
  declare api: APIClient;
  declare viewOpener: ViewOpener;
  declare modal: HookAPI;
  declare route: RouteOptions;
  declare location: Location;
  declare runsql: (options: RunSQLOptions) => Promise<any>;

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
    this.defineProperty('dataSourceManager', {
      value: dataSourceManager,
    });
    const i18n = new FlowI18n(this);
    this.defineMethod('t', (keyOrTemplate: string, options?: any) => {
      return i18n.translate(keyOrTemplate, options);
    });
    this.defineMethod('renderJson', (template: any) => {
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
  }
}

export class FlowModelContext extends FlowContext {
  declare router: Router;
  declare dataSourceManager: DataSourceManager;
  declare model: FlowModel;
  declare engine: FlowEngine;
  declare ref: React.RefObject<HTMLDivElement>;
  declare renderJson: (template: any) => Promise<any>;
  declare requireAsync: (url: string) => Promise<any>;
  declare runjs: (code?: string, variables?: Record<string, any>) => Promise<any>;
  declare runsql: (options: RunSQLOptions) => Promise<any>;
  declare viewOpener: ViewOpener;
  declare modal: HookAPI;
  declare message: MessageInstance;
  declare notification: NotificationInstance;
  declare route: RouteOptions;
  declare location: Location;

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
    this.defineMethod('renderJson', (template: any) => {
      return resolveExpressions(template, this);
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

export class FlowForkModelContext extends FlowContext {
  declare router: Router;
  declare dataSourceManager: DataSourceManager;
  // declare model: FlowModel;
  declare engine: FlowEngine;
  declare ref: React.RefObject<HTMLDivElement>;
  declare renderJson: (template: any) => Promise<any>;
  declare requireAsync: (url: string) => Promise<any>;
  declare runsql: (options: RunSQLOptions) => Promise<any>;
  declare runjs: (code?: string, variables?: Record<string, any>) => Promise<any>;
  declare modal: HookAPI;
  declare message: MessageInstance;
  declare notification: NotificationInstance;
  declare route: RouteOptions;
  declare location: Location;

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
    this.defineMethod('renderJson', (template: any) => {
      return resolveExpressions(template, this);
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
> extends FlowContext {
  stepResults: Record<string, any> = {};
  declare router: Router;
  declare engine: FlowEngine;
  declare onRefReady: <T extends HTMLElement>(ref: React.RefObject<T>, cb: (el: T) => void, timeout?: number) => void;
  declare dataSourceManager: DataSourceManager;
  declare ref: React.RefObject<HTMLDivElement>;
  declare renderJson: (template: any) => Promise<any>;
  declare requireAsync: (url: string) => Promise<any>;
  declare runsql: (options: RunSQLOptions) => Promise<any>;
  declare runjs: (code?: string, variables?: Record<string, any>) => Promise<any>;
  declare useResource: (className: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource') => void;
  declare viewOpener: ViewOpener;
  declare modal: HookAPI;
  declare message: MessageInstance;
  declare notification: NotificationInstance;
  declare route: RouteOptions;
  declare location: Location;

  constructor(
    public model: TModel,
    public flowKey: string,
    protected _mode: TMode = 'runtime' as TMode,
  ) {
    super();
    this.addDelegate(this.model.context);
    const ResourceMap = { APIResource, BaseRecordResource, SingleRecordResource, MultiRecordResource };
    this.defineMethod('useResource', (className: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource') => {
      if (model['resource']) {
        return;
      }
      const R = ResourceMap[className];
      if (!R) {
        throw new Error(`Resource class ${className} not found in ResourceMap`);
      }
      const resource = new R() as APIResource;
      resource.setAPIClient(this.api);
      model['resource'] = resource;
    });
    this.defineProperty('resource', {
      get: () => model['resource'] || model.context['resource'],
      cache: false,
    });
    this.defineMethod('onRefReady', (ref, cb, timeout) => {
      this.engine.reactView.onRefReady(ref, cb, timeout);
    });
    this.defineMethod('renderJson', (template: any) => {
      return resolveExpressions(template, this);
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
      return super._getOwnProperty(key);
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
