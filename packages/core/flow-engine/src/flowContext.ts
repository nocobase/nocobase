/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ContextPathProxy } from './ContextPathProxy';
import { DataSource, DataSourceManager } from './data-source';
import { FlowEngine } from './flowEngine';
import { FlowI18n } from './flowI18n';
import { FlowModel } from './models';
import { FlowExitException } from './utils';

type Getter<T = any> = (ctx: FlowContext) => T | Promise<T>;

interface MetaTreeNode {
  name: string;
  title: string;
  type: string;
  interface?: string;
  uiSchema?: any;
  children?: MetaTreeNode[];
}

interface PropertyMeta {
  type: string;
  title: string;
  interface?: string;
  uiSchema?: any;
  properties?: Record<string, PropertyMeta>;
}

interface PropertyOptions {
  value?: any;
  get?: Getter;
  cache?: boolean;
  meta?: PropertyMeta;
}

export class FlowContext {
  _props: Record<string, PropertyOptions> = {};
  _methods: Record<string, (...args: any[]) => any> = {};
  protected _cache: Record<string, any> = {};
  protected _delegates: FlowContext[] = [];
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
    this._props[key] = options;
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
    // 递归转换为 MetaTreeNode 结构
    function toTreeNode(name: string, meta: PropertyMeta): MetaTreeNode {
      return {
        name,
        title: meta.title,
        type: meta.type,
        interface: meta.interface,
        uiSchema: meta.uiSchema,
        children: meta.properties
          ? Object.entries(meta.properties).map(([childName, childMeta]) => toTreeNode(childName, childMeta))
          : undefined,
      };
    }

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
      if (!(key in this._cache)) {
        const result = options.get(this);
        this._cache[key] = result;
      }
      return this._cache[key];
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

export class FlowEngineContext extends FlowContext {
  declare dataSourceManager: DataSourceManager;
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
  }
}

export class FlowModelContext extends FlowContext {
  declare dataSourceManager: DataSourceManager;
  declare model: FlowModel;
  declare engine: FlowEngine;
  constructor(model: FlowModel) {
    if (!(model instanceof FlowModel)) {
      throw new Error('Invalid FlowModel instance');
    }
    super();
    this.addDelegate(model.flowEngine.context);
    this.defineProperty('model', {
      value: model,
    });
  }
}

export class FlowForkModelContext extends FlowContext {
  declare dataSourceManager: DataSourceManager;
  // declare model: FlowModel;
  declare engine: FlowEngine;
  constructor(public model: FlowModel) {
    if (!(model instanceof FlowModel)) {
      throw new Error('Invalid FlowModel instance');
    }
    super();
    this.addDelegate(this.model.context);
  }
}

export class FlowRuntimeContext<TModel extends FlowModel> extends FlowContext {
  stepResults: Record<string, any> = {};

  constructor(
    public model: TModel,
    public flowKey: string,
    protected mode: 'runtime' | 'settings' = 'runtime',
  ) {
    super();
    this.addDelegate(this.model.context);
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
      if (!(key in this._cache)) {
        this._cache[key] = ContextPathProxy.create()[key];
      }
      return this._cache[key];
    }

    return undefined;
  }

  exit() {
    throw new FlowExitException(this.flowKey, this.model.uid);
  }
}
