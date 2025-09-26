/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/json-schema';
import { observable } from '@formily/reactive';
import { APIClient } from '@nocobase/sdk';
import type { Router } from '@remix-run/router';
import * as antd from 'antd';
import { MessageInstance } from 'antd/es/message/interface';
import type { HookAPI } from 'antd/es/modal/useModal';
import { NotificationInstance } from 'antd/es/notification/interface';
import _ from 'lodash';
import pino from 'pino';
import qs from 'qs';
import React, { createRef } from 'react';
import type { Location } from 'react-router-dom';
import { ACL } from './acl/Acl';
import { ContextPathProxy } from './ContextPathProxy';
import { DataSource, DataSourceManager } from './data-source';
import { FlowEngine } from './flowEngine';
import { FlowI18n } from './flowI18n';
import { JSRunner, JSRunnerOptions } from './JSRunner';
import { FlowModel, ForkFlowModel } from './models';
import {
  APIResource,
  BaseRecordResource,
  FlowResource,
  FlowSQLRepository,
  MultiRecordResource,
  SingleRecordResource,
  SQLResource,
} from './resources';
import type { ActionDefinition, EventDefinition, ResourceType } from './types';
import {
  createSafeDocument,
  createSafeWindow,
  escapeT,
  extractPropertyPath,
  extractUsedVariablePaths,
  FlowExitException,
  resolveDefaultParams,
  resolveExpressions,
} from './utils';
import { FlowExitAllException } from './utils/exceptions';
import { enqueueVariablesResolve, JSONValue } from './utils/params-resolvers';
import type { RecordRef } from './utils/serverContextParams';
import { buildServerContextParams as _buildServerContextParams } from './utils/serverContextParams';
import { FlowView, FlowViewer } from './views/FlowView';

// Helper: detect a RecordRef-like object
function isRecordRefLike(val: any): boolean {
  return !!(val && typeof val === 'object' && 'collection' in val && 'filterByTk' in val);
}

// Helper: Filter builder output by subpaths that need server resolution
// - built can be RecordRef (top-level var) or an object mapping subKey -> RecordRef (e.g., { record: ref })
function filterBuilderOutputByPaths(built: any, neededPaths: string[]): any {
  if (!neededPaths || neededPaths.length === 0) return undefined;
  if (isRecordRefLike(built)) return built;
  if (built && typeof built === 'object' && !Array.isArray(built)) {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(built)) {
      const hit = neededPaths.some((p) => p === k || p.startsWith(`${k}.`) || p.startsWith(`${k}[`));
      if (hit) out[k] = v;
    }
    return out;
  }
  return undefined;
}

type Getter<T = any> = (ctx: FlowContext) => T | Promise<T>;

export interface MetaTreeNode {
  name: string;
  title: string;
  type: string;
  interface?: string;
  uiSchema?: ISchema;
  render?: (props: any) => JSX.Element;
  // display?: 'default' | 'flatten' | 'none'; // 显示模式：默认、平铺子菜单、完全隐藏, 用于简化meta树显示层级
  paths: string[];
  parentTitles?: string[]; // 父级标题数组，不包含自身title，第一层可省略
  // 变量禁用状态与原因（用于变量选择器 UI 展示）
  disabled?: boolean | (() => boolean);
  disabledReason?: string | (() => string | undefined);
  children?: MetaTreeNode[] | (() => Promise<MetaTreeNode[]>);
}

export interface PropertyMeta {
  type: string;
  title: string;
  interface?: string;
  uiSchema?: ISchema; // TODO: 这个是不是压根没必要啊？
  render?: (props: any) => JSX.Element; // 自定义渲染函数
  // 用于 VariableInput 的排序：数值越大，显示越靠前；相同值保持稳定顺序
  sort?: number;
  // display?: 'default' | 'flatten' | 'none'; // 显示模式：默认、平铺子菜单、完全隐藏, 用于简化meta树显示层级
  properties?: Record<string, PropertyMeta> | (() => Promise<Record<string, PropertyMeta>>);
  // 变量禁用控制：若 disabled 为真（或函数返回真）则禁用
  disabled?: boolean | (() => boolean);
  // 禁用原因（用于 UI 小问号提示），可为函数
  disabledReason?: string | (() => string | undefined);
  // 变量解析参数构造器（用于 variables:resolve 的 contextParams，按属性名归位）。
  // 支持返回 RecordRef 或任意嵌套对象（将被 buildServerContextParams 扁平化，例如 { record: RecordRef } -> 'view.record'）。
  buildVariablesParams?: (
    ctx: FlowContext,
  ) => RecordRef | Record<string, any> | Promise<RecordRef | Record<string, any> | undefined> | undefined;
}

// A factory function that lazily produces PropertyMeta, and may carry
// hint fields like `title` and `sort` for UI building before resolution.
export type PropertyMetaFactory = {
  (): PropertyMeta | Promise<PropertyMeta | null> | null;
  /**
   * 仅作为“是否可能存在子节点”的提示，不影响 meta 工厂本身的惰性特性。
   * - true（默认）：视为可能有 children，节点会提供 children 懒加载器（用于级联展开加载子级）。
   * - false：视为没有 children，不渲染展开箭头，且不提供 children 懒加载器；
   *          但节点本身的 meta 工厂仍保持惰性（在需要时仍可解析出 title/type 等信息）。
   */
  hasChildren?: boolean;
  title?: string;
  sort?: number;
};

export type PropertyMetaOrFactory = PropertyMeta | PropertyMetaFactory;

export interface PropertyOptions {
  value?: any;
  once?: boolean; // 是否只定义一次
  get?: Getter;
  cache?: boolean;
  observable?: boolean; // 是否为 observable 属性
  meta?: PropertyMetaOrFactory; // 支持静态、函数和异步函数（工厂函数可带 title/sort）
  // 标记该属性是否在服务端解析：
  // - boolean: true 表示整个顶层变量交给服务端；false 表示仅前端解析
  // - function: 根据子路径决定是否交给服务端（子路径示例：'record.roles[0].name'、'id'、''）
  resolveOnServer?: boolean | ((subPath: string) => boolean);
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
  private _metaNodeCache: WeakMap<PropertyMetaOrFactory, MetaTreeNode> = new WeakMap();

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

    // 清除旧属性对应的缓存
    const oldOptions = this._props[key];
    if (oldOptions?.meta) {
      this._clearMetaNodeCacheFor(oldOptions.meta);
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

  defineMethod(name: string, fn: (...args: any[]) => any, des?: string) {
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

  clearDelegates() {
    this._delegates = [];
    this._metaNodeCache = new WeakMap(); // 清除缓存
  }

  removeDelegate(ctx: FlowContext) {
    if (!(ctx instanceof FlowContext)) {
      throw new Error('Delegate must be an instance of FlowContext');
    }
    const index = this._delegates.indexOf(ctx);
    if (index !== -1) {
      this._delegates.splice(index, 1);
      // 不需要清除缓存：委托链变化不影响基于 meta 内容的缓存
    }
  }

  /**
   * 清除特定 meta 对象的缓存
   */
  private _clearMetaNodeCacheFor(meta: PropertyMetaOrFactory): void {
    this._metaNodeCache.delete(meta);
  }

  has(key: string) {
    return !!this._props[key];
  }

  /**
   * 获取属性元数据树
   * 返回的 MetaTreeNode 中可能包含异步的延迟加载逻辑
   * @param value 可选参数，指定要获取的属性路径，格式: "{{ ctx.propertyName }}"
   * @returns MetaTreeNode[] 根级属性的元数据树，或指定路径的子树
   *
   * @example
   * // 同步调用，获取完整 meta tree
   * const metaTree = flowContext.getPropertyMetaTree();
   *
   * // 获取指定属性的子树
   * const subTree = flowContext.getPropertyMetaTree("{{ ctx.user }}");
   *
   * // 获取多层级属性的子树
   * const profileTree = flowContext.getPropertyMetaTree("{{ ctx.user.profile }}");
   */
  getPropertyMetaTree(value?: string, options?: { flatten?: boolean }): MetaTreeNode[] {
    const metaMap = this._getPropertiesMeta();

    // 如果有 value 参数，尝试返回对应属性的子树
    if (value) {
      const propertyPath = extractPropertyPath(value);
      if (propertyPath && propertyPath.length > 0) {
        const loadChildrenFrom = async (
          metaOrFactory: PropertyMeta | (() => PropertyMeta | Promise<PropertyMeta>),
          fullPath: string[],
          finalKey: string,
        ): Promise<MetaTreeNode[]> => {
          try {
            const meta: PropertyMeta =
              typeof metaOrFactory === 'function' ? await (metaOrFactory as any)() : (metaOrFactory as PropertyMeta);
            if (!meta?.properties) return [];
            let props = meta.properties;
            if (typeof props === 'function') {
              const resolved = await props();
              meta.properties = resolved;
              props = resolved;
            }
            const childNodes = this.#createChildNodes(props as Record<string, PropertyMeta>, fullPath, [], meta);
            return Array.isArray(childNodes) ? childNodes : await childNodes();
          } catch (error) {
            console.warn(`Failed to load meta for ${finalKey}:`, error);
            return [];
          }
        };
        const targetMeta = this.#findMetaByPath(propertyPath);
        if (targetMeta) {
          const [finalKey, metaOrFactory, fullPath] = targetMeta;
          const depth = propertyPath.length;

          if (depth === 1) {
            if (typeof metaOrFactory === 'function') {
              return (() => loadChildrenFrom(metaOrFactory, fullPath, finalKey)) as unknown as MetaTreeNode[];
            }
            if (metaOrFactory.properties) {
              if (typeof metaOrFactory.properties === 'function') {
                return (() => loadChildrenFrom(metaOrFactory, fullPath, finalKey)) as unknown as MetaTreeNode[];
              }
              const childNodes = this.#createChildNodes(metaOrFactory.properties, fullPath, [], metaOrFactory);
              return Array.isArray(childNodes) ? childNodes : [];
            }
            return [];
          }

          if (typeof metaOrFactory === 'function') {
            if (options?.flatten) {
              // 统一语义：当请求子层路径且 flatten=true 时，直接返回其 children 列表
              return (() => loadChildrenFrom(metaOrFactory, fullPath, finalKey)) as unknown as MetaTreeNode[];
            }
            const parentTitles = this.#buildParentTitles(fullPath);
            return [this.#toTreeNode(finalKey, metaOrFactory, fullPath, parentTitles)];
          }
          if (metaOrFactory.properties) {
            const parentTitles = [...this.#buildParentTitles(fullPath), metaOrFactory.title];
            const childNodes = this.#createChildNodes(metaOrFactory.properties, fullPath, parentTitles, metaOrFactory);
            return Array.isArray(childNodes) ? childNodes : [];
          }
          return [];
        }
        // 未找到目标路径，返回空数组
        return [];
      } else if (propertyPath === null) {
        console.warn(
          `[FlowContext] getPropertyMetaTree - unsupported value format: "${value}". Only "{{ ctx.propertyName }}" format is supported. Returning empty meta tree.`,
        );
        return [];
      }
    }

    // 根级节点按 meta.sort 降序排列（未设置默认为 0）
    const sorted = (Object.entries(metaMap) as [string, PropertyMetaOrFactory][]).sort(([, a], [, b]) => {
      const sa = (typeof a === 'function' ? a.sort : a?.sort) ?? 0;
      const sb = (typeof b === 'function' ? b.sort : b?.sort) ?? 0;
      return sb - sa;
    });
    return sorted.map(([key, metaOrFactory]) => this.#toTreeNode(key, metaOrFactory, [key], []));
  }

  #createChildNodes(
    properties: Record<string, PropertyMeta> | (() => Promise<Record<string, PropertyMeta>>),
    parentPaths: string[] = [],
    parentTitles: string[] = [],
    parentMeta?: PropertyMeta, // 传入父级 meta 以便缓存结果
  ): MetaTreeNode[] | (() => Promise<MetaTreeNode[]>) {
    return typeof properties === 'function'
      ? async () => {
          const resolved = await properties();
          // 缓存解析结果，避免下次重复调用
          if (parentMeta) {
            parentMeta.properties = resolved;
          }
          const entries = Object.entries(resolved) as [string, PropertyMeta][];
          entries.sort(([, a], [, b]) => (b?.sort ?? 0) - (a?.sort ?? 0));
          return entries.map(([name, meta]) => this.#toTreeNode(name, meta, [...parentPaths, name], parentTitles));
        }
      : (Object.entries(properties) as [string, PropertyMeta][])
          .sort(([, a], [, b]) => (b?.sort ?? 0) - (a?.sort ?? 0))
          .map(([name, meta]) => this.#toTreeNode(name, meta, [...parentPaths, name], parentTitles));
  }

  /**
   * 根据属性路径查找对应的 meta
   * @param propertyPath 属性路径数组，例如 ["aaa", "bbb"]
   * @returns [finalKey, metaOrFactory, fullPath] 或 null
   */
  #findMetaByPath(propertyPath: string[]): [string, PropertyMetaOrFactory, string[]] | null {
    if (propertyPath.length === 0) return null;

    const [firstKey, ...remainingPath] = propertyPath;

    // 首先查找第一个属性，这里利用委托链机制
    // 1. 查找自身的属性
    const ownProperty = this._props[firstKey];
    if (ownProperty?.meta) {
      return this.#findMetaInProperty(firstKey, ownProperty.meta, remainingPath, [firstKey]);
    }

    // 2 进一步递归查找更深层委托链（_getPropertiesMeta 会递归收集，但此处原来仅检查了一层，导致不一致）
    const deepMeta = this.#findMetaInDelegatesDeep(this._delegates, firstKey);
    if (deepMeta) {
      return this.#findMetaInProperty(firstKey, deepMeta, remainingPath, [firstKey]);
    }

    return null;
  }

  /**
   * 递归在委托链中查找指定 key 的 meta（只返回 metaOrFactory，不解析路径）。
   */
  #findMetaInDelegatesDeep(delegates: FlowContext[], key: string): PropertyMetaOrFactory | null {
    for (const delegate of delegates) {
      const prop = delegate._props[key];
      if (prop?.meta) return prop.meta;
      const deeper = this.#findMetaInDelegatesDeep(delegate._delegates, key);
      if (deeper) return deeper;
    }
    return null;
  }

  /**
   * 在给定属性的 meta 中查找剩余路径
   */
  #findMetaInProperty(
    currentKey: string,
    metaOrFactory: PropertyMetaOrFactory,
    remainingPath: string[],
    currentPath: string[],
  ): [string, PropertyMetaOrFactory, string[]] | null {
    // 如果已经到了最后一层，直接返回当前的 meta
    if (remainingPath.length === 0) {
      return [currentKey, metaOrFactory as any, currentPath];
    }

    // 如果还有剩余路径，但当前是函数类型，构建一个新的异步函数继续解析剩余路径
    if (typeof metaOrFactory === 'function') {
      const finalKey = remainingPath[remainingPath.length - 1];
      const finalPath = [...currentPath, ...remainingPath];

      const wrappedFactory = async (): Promise<PropertyMeta> => {
        const resolvedMeta = await metaOrFactory();
        const result = await this.#resolvePathInMetaAsync(resolvedMeta, remainingPath);
        return result;
      };

      return [finalKey, wrappedFactory, finalPath];
    }

    // 如果还有剩余路径，且是同步 meta，尝试继续查找下一层
    if (metaOrFactory.properties) {
      const [nextKey, ...restPath] = remainingPath;
      const nextPath = [...currentPath, nextKey];

      // properties 是异步的，构建新的异步函数继续解析
      if (typeof metaOrFactory.properties === 'function') {
        const finalKey = remainingPath[remainingPath.length - 1];
        const finalPath = [...currentPath, ...remainingPath];

        const wrappedFactory = async (): Promise<PropertyMeta> => {
          const propertiesFactory = metaOrFactory.properties as () => Promise<Record<string, PropertyMeta>>;
          const resolvedProperties = await propertiesFactory();
          // 缓存解析结果，避免下次重复调用
          metaOrFactory.properties = resolvedProperties;
          const startMeta = resolvedProperties[nextKey];
          if (!startMeta) {
            throw new Error(`Property ${nextKey} not found in resolved properties`);
          }
          const result = await this.#resolvePathInMetaAsync(startMeta, restPath);
          return result;
        };

        return [finalKey, wrappedFactory, finalPath];
      }

      // properties 是同步的，继续查找
      const nextMeta = metaOrFactory.properties[nextKey];
      if (nextMeta) {
        return this.#findMetaInProperty(nextKey, nextMeta, restPath, nextPath);
      }
    }

    return null;
  }

  /**
   * 在给定的 meta 中递归解析路径
   */
  #resolvePathInMeta(meta: PropertyMeta, path: string[]): PropertyMeta | null {
    if (path.length === 0) {
      return meta;
    }

    let current = meta;
    for (const key of path) {
      const properties = _.get(current, 'properties');
      if (!properties || typeof properties === 'function') {
        return null; // 无法同步解析异步 properties
      }
      current = _.get(properties, key);
      if (!current) {
        return null;
      }
    }

    return current;
  }

  /**
   * 支持异步 properties 的路径解析：
   * - 遇到 properties 为函数时会 await 并缓存其结果
   * - 持续向下解析直到到达最终的 meta
   * 若解析失败则抛出异常，由调用方自行处理
   */
  async #resolvePathInMetaAsync(meta: PropertyMeta, path: string[]): Promise<PropertyMeta> {
    if (path.length === 0) return meta;

    let current: PropertyMeta = meta;
    for (const key of path) {
      let properties = _.get(current, 'properties');

      if (!properties) {
        throw new Error(`Property path not found: ${path.join('.')}`);
      }

      if (typeof properties === 'function') {
        const resolved = await properties();
        current.properties = resolved;
        properties = resolved;
      }

      const next = (properties as Record<string, PropertyMeta>)[key];
      if (!next) {
        throw new Error(`Property ${key} not found while resolving path: ${path.join('.')}`);
      }
      current = next;
    }

    return current;
  }

  /**
   * 构建 parentTitles 数组，通过递归查找每个路径层级对应的 meta title
   * @param propertyPath 属性路径数组，例如 ['aaa', 'bbb', 'ccc']
   * @param excludeLastLevel 是否排除最后一层，默认为 true（parentTitles 不包含当前节点）
   * @returns string[] 父级标题数组
   */
  #buildParentTitles(propertyPath: string[], excludeLastLevel = true): string[] {
    if (propertyPath.length === 0) return [];

    const pathToProcess = excludeLastLevel ? propertyPath.slice(0, -1) : propertyPath;
    if (pathToProcess.length === 0) return [];

    const parentTitles: string[] = [];

    // 从根级开始逐层查找 meta title
    let currentMetas = this._getPropertiesMeta();

    for (let i = 0; i < pathToProcess.length; i++) {
      const currentKey = pathToProcess[i];
      const currentMeta = currentMetas[currentKey];

      if (!currentMeta || typeof currentMeta === 'function') {
        parentTitles.push(currentKey);
        break;
      }
      // 同步 meta，使用 title
      parentTitles.push(currentMeta.title || currentKey);

      // 为下一层级准备 meta 映射
      if (i < pathToProcess.length - 1 && currentMeta.properties && typeof currentMeta.properties !== 'function') {
        currentMetas = currentMeta.properties as Record<string, PropertyMeta>;
      } else if (i < pathToProcess.length - 1) {
        // 如果下一层是异步的或者不存在，无法继续，使用路径名填充剩余部分
        for (let j = i + 1; j < pathToProcess.length; j++) {
          parentTitles.push(pathToProcess[j]);
        }
        break;
      }
    }

    return parentTitles;
  }

  #toTreeNode(
    name: string,
    metaOrFactory: PropertyMetaOrFactory,
    paths: string[] = [name],
    parentTitles: string[] = [],
  ): MetaTreeNode {
    // 检查缓存
    const cached = this._metaNodeCache.get(metaOrFactory);
    if (cached) {
      // 更新路径信息（因为同一个 meta 可能在不同路径下使用）
      cached.paths = paths;
      cached.parentTitles = parentTitles.length > 0 ? parentTitles : undefined;
      return cached;
    }

    let node: MetaTreeNode;

    // 计算禁用状态与原因的帮助函数
    const computeDisabledFromMeta = (m: PropertyMeta): { disabled: boolean; reason?: string } => {
      if (!m) return { disabled: false };
      const disabledVal = typeof m.disabled === 'function' ? m.disabled() : m.disabled;
      const reason = typeof m.disabledReason === 'function' ? m.disabledReason() : m.disabledReason;
      return { disabled: !!disabledVal, reason };
    };

    if (typeof metaOrFactory === 'function') {
      const initialTitle = name;
      const hasChildrenHint = (metaOrFactory as PropertyMetaFactory).hasChildren;
      node = {
        name,
        title: metaOrFactory.title || initialTitle, // 初始使用 name 作为 title
        type: 'object', // 初始类型
        interface: undefined,
        uiSchema: undefined,
        paths,
        parentTitles: parentTitles.length > 0 ? parentTitles : undefined,
        disabled: () => {
          const maybe = metaOrFactory();
          if (maybe && typeof maybe['then'] === 'function') return false;
          return computeDisabledFromMeta(maybe as PropertyMeta).disabled;
        },
        disabledReason: () => {
          const maybe = metaOrFactory();
          if (maybe && typeof maybe['then'] === 'function') return undefined;
          return computeDisabledFromMeta(maybe as PropertyMeta).reason;
        },
        // 注意：即便 hasChildren === false，也只是“没有子节点”的 UI 提示；
        // 节点自身依然通过 meta 工厂保持惰性特性（需要时可解析出 title/type 等）。
        // 这里仅在 hasChildren !== false 时，提供子节点的懒加载逻辑。
        children:
          hasChildrenHint === false
            ? undefined
            : async () => {
                try {
                  const meta = await metaOrFactory();
                  const finalTitle = meta?.title || name;
                  node.title = finalTitle;
                  node.type = meta?.type;
                  node.interface = meta?.interface;
                  node.uiSchema = meta?.uiSchema;
                  // parentTitles 保持不变，因为它不包含自身 title

                  if (!meta?.properties) return [];

                  const childNodes = this.#createChildNodes(
                    meta.properties,
                    paths,
                    [...parentTitles, finalTitle],
                    meta,
                  );
                  const resolvedChildren = Array.isArray(childNodes) ? childNodes : await childNodes();

                  // 更新 children 为解析后的结果
                  node.children = resolvedChildren;

                  return resolvedChildren;
                } catch (error) {
                  console.warn(`Failed to load meta for ${name}:`, error);
                  return [];
                }
              },
      };
    } else {
      // 同步 meta：直接创建节点
      const nodeTitle = metaOrFactory.title;
      const { disabled, reason } = computeDisabledFromMeta(metaOrFactory);
      node = {
        name,
        title: nodeTitle,
        type: metaOrFactory.type,
        interface: metaOrFactory.interface,
        uiSchema: metaOrFactory.uiSchema,
        paths,
        parentTitles: parentTitles.length > 0 ? parentTitles : undefined,
        disabled,
        disabledReason: reason,
        children: metaOrFactory.properties
          ? this.#createChildNodes(metaOrFactory.properties, paths, [...parentTitles, nodeTitle], metaOrFactory)
          : undefined,
      };
    }

    // 缓存节点
    this._metaNodeCache.set(metaOrFactory, node);

    return node;
  }

  _getPropertiesMeta(): Record<string, PropertyMetaOrFactory> {
    const metaMap: Record<string, PropertyMetaOrFactory> = {};

    // 先处理委托链（委托链的 meta 优先级较低）
    for (const delegate of this._delegates) {
      Object.assign(metaMap, delegate._getPropertiesMeta());
    }

    // 处理自身属性（自身属性优先级较高）
    for (const [key, options] of Object.entries(this._props)) {
      if (options.meta) {
        metaMap[key] = typeof options.meta === 'function' ? (options.meta as PropertyMetaFactory) : options.meta;
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

  /**
   * 获取属性定义选项（包含代理链）。
   *
   * - 优先查找当前上下文自身通过 defineProperty 注册的属性定义
   * - 若自身不存在，则沿委托链（delegates）向上查找第一个命中的定义
   *
   * @param key 顶层属性名（例如 'user'、'view'）
   * @returns 属性定义选项，或 undefined（未定义）
   */
  getPropertyOptions(key: string): PropertyOptions | undefined {
    if (Object.prototype.hasOwnProperty.call(this._props, key)) {
      return this._props[key];
    }
    return this._findPropertyInDelegates(this._delegates, key);
  }
}

export class FlowRunjsContext extends FlowContext {
  constructor(delegate: FlowContext) {
    super();
    this.addDelegate(delegate);
    // Expose React and antd only within runjs context
    // This keeps the scope minimal while enabling React/AntD rendering in scripts
    this.defineProperty('React', { value: React });
    this.defineProperty('antd', { value: antd });
    this.defineMethod(
      'dispatchModelEvent',
      async (modelOrUid: FlowModel | string, eventName: string, inputArgs?: Record<string, any>) => {
        let model: FlowModel | null = null;
        if (typeof modelOrUid === 'string') {
          model = await this.engine.loadModel({ uid: modelOrUid });
        } else if (modelOrUid instanceof FlowModel) {
          model = modelOrUid;
        }
        if (model) {
          model.context.addDelegate(this);
          model.dispatchEvent(eventName, { navigation: false, ...this.model?.['getInputArgs']?.(), ...inputArgs });
        } else {
          this.message.error(this.t('Model with ID {{uid}} not found', { uid: modelOrUid }));
        }
      },
    );
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
  declare renderJson: (template: JSONValue) => Promise<any>;
  declare resolveJsonTemplate: (template: JSONValue) => Promise<any>;
  declare runjs: (code: string, variables?: Record<string, any>) => Promise<any>;
  declare copyToClipboard: (text: string) => Promise<void>;
  declare getAction: <TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext>(
    name: string,
  ) => ActionDefinition<TModel, TCtx> | undefined;
  declare getActions: <TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext>() => Map<
    string,
    ActionDefinition<TModel, TCtx>
  >;
  declare getEvents: <TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext>() => Map<
    string,
    EventDefinition<TModel, TCtx>
  >;
  declare runAction: (actionName: string, params?: Record<string, any>) => Promise<any> | any;
  declare engine: FlowEngine;
  declare api: APIClient;
  declare viewer: FlowViewer;
  declare view: FlowView;
  declare modal: HookAPI;
  declare message: MessageInstance;
  declare notification: NotificationInstance;
  declare route: RouteOptions;
  declare location: Location;
  declare sql: FlowSQLRepository;
  declare logger: pino.Logger;
}

class BaseFlowModelContext extends BaseFlowEngineContext {
  declare model: FlowModel;
  declare ref: React.RefObject<HTMLDivElement>;
  declare getAction: <TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext>(
    name: string,
  ) => ActionDefinition<TModel, TCtx> | undefined;
  declare getActions: <TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext>() => Map<
    string,
    ActionDefinition<TModel, TCtx>
  >;
  declare getEvents: <TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext>() => Map<
    string,
    EventDefinition<TModel, TCtx>
  >;
  declare runAction: (actionName: string, params?: Record<string, any>) => Promise<any> | any;
  declare createResource: <T extends FlowResource = FlowResource>(resourceType: ResourceType<T>) => T;
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
    this.defineMethod('runjs', async (code, variables) => {
      const runner = this.createJSRunner({
        globals: variables,
      });
      return runner.run(code);
    });
    this.defineMethod('renderJson', function (template: any) {
      return this.resolveJsonTemplate(template);
    });
    this.defineMethod('resolveJsonTemplate', async function (this: BaseFlowEngineContext, template: any) {
      // 提取模板使用到的变量及其子路径
      const used = extractUsedVariablePaths(template);
      const usedVarNames = Object.keys(used || {});
      if (!usedVarNames.length) {
        // 模板未包含任何 ctx.* 变量，直接前端解析
        return resolveExpressions(template, this);
      }

      // 分流：根据 resolveOnServer 标记与子路径判断哪些交给后端
      const serverVarPaths: Record<string, string[]> = {};
      for (const varName of usedVarNames) {
        const paths = used[varName] || [];
        const opt = this.getPropertyOptions(varName);
        const mark = opt?.resolveOnServer;
        if (mark === true) {
          serverVarPaths[varName] = paths;
        } else if (typeof mark === 'function') {
          const filtered = paths.filter((p) => {
            try {
              return !!mark(p);
            } catch (_) {
              return false;
            }
          });
          if (filtered.length) serverVarPaths[varName] = filtered;
        }
      }

      const needServer = Object.keys(serverVarPaths).length > 0;
      let serverResolved = template;
      if (needServer) {
        const collectFromMeta = async (): Promise<Record<string, any>> => {
          const out: Record<string, any> = {};
          try {
            const metas = this._getPropertiesMeta?.() as Record<
              string,
              PropertyMeta | (() => Promise<PropertyMeta | null> | PropertyMeta | null)
            >;
            if (!metas || typeof metas !== 'object') return out;
            for (const [key, metaOrFactory] of Object.entries(metas)) {
              if (!serverVarPaths[key]) continue; // 仅处理需要后端解析的变量
              try {
                let meta: PropertyMeta | null;
                if (typeof metaOrFactory === 'function') {
                  const fn = metaOrFactory as () => Promise<PropertyMeta | null>;
                  meta = await fn();
                } else {
                  meta = metaOrFactory as PropertyMeta;
                }
                if (!meta || typeof meta !== 'object') continue;
                const builder = meta.buildVariablesParams;
                if (typeof builder !== 'function') continue;
                const built = await builder(this);
                if (!built) continue;
                const neededPaths = serverVarPaths[key] || [];
                const filtered = filterBuilderOutputByPaths(built, neededPaths);
                if (filtered && (typeof filtered !== 'object' || Object.keys(filtered).length)) {
                  out[key] = filtered;
                }
              } catch (_) {
                // 忽略单个属性的错误
              }
            }
          } catch (_) {
            // ignore
          }
          return out;
        };

        const inputFromMeta = await collectFromMeta();
        const autoInput = { ...inputFromMeta };
        const autoContextParams = Object.keys(autoInput).length
          ? _buildServerContextParams(this, autoInput)
          : undefined;

        if (this.api) {
          try {
            serverResolved = await enqueueVariablesResolve(this as FlowRuntimeContext<FlowModel>, {
              template,
              contextParams: autoContextParams || {},
            });
          } catch (e) {
            this.logger?.warn?.({ err: e }, 'variables:resolve failed, fallback to client-only');
            serverResolved = template;
          }
        }
      }

      return resolveExpressions(serverResolved, this);
    });
    this.defineProperty('requirejs', {
      get: () => this.app?.requirejs?.requirejs,
    });
    // Expose API token and current role as top-level variables for VariableInput.
    // Front-end only: no resolveOnServer flag. Mark cache: false to reflect runtime changes.
    this.defineProperty('token', {
      get: () => this.api?.auth?.token,
      cache: false,
      // 注意：使用惰性 meta 工厂，避免在 i18n 尚未注入时提前求值导致无法翻译
      meta: Object.assign(() => ({ type: 'string', title: this.t('API Token'), sort: 980 }), {
        title: 'API Token',
        sort: 980,
        hasChildren: false,
      }),
    });
    this.defineProperty('role', {
      get: () => this.api?.auth?.role,
      cache: false,
      // 注意：使用惰性 meta 工厂，避免在 i18n 尚未注入时提前求值导致无法翻译
      meta: Object.assign(() => ({ type: 'string', title: this.t('Current role'), sort: 990 }), {
        title: escapeT('Current role'),
        sort: 990,
        hasChildren: false,
      }),
    });
    // URL 查询参数（等价于 1.0 的 `$nURLSearchParams`）
    this.defineProperty('urlSearchParams', {
      // 不缓存，确保随 URL 变化实时生效
      cache: false,
      get: () => {
        const search = this.location?.search || '';
        const str = search.startsWith('?') ? search.slice(1) : search;
        return (qs.parse(str) as Record<string, any>) || {};
      },
      // 变量选择器中的元信息与动态子项
      meta: Object.assign(
        () => ({
          type: 'object',
          title: this.t('URL search params'),
          sort: 970,
          disabled: () => {
            const search = this.location?.search || '';
            const str = search.startsWith('?') ? search.slice(1) : search;
            const params = (qs.parse(str) as Record<string, any>) || {};
            return Object.keys(params).length === 0;
          },
          disabledReason: () =>
            this.t(
              'The value of this variable is derived from the query string of the page URL. This variable can only be used normally when the page has a query string.',
            ),
          properties: async () => {
            const search = this.location?.search || '';
            const str = search.startsWith('?') ? search.slice(1) : search;
            const params = (qs.parse(str) as Record<string, any>) || {};
            const props: Record<string, any> = {};
            for (const key of Object.keys(params)) {
              props[key] = { type: 'string', title: key };
            }
            return props;
          },
        }),
        {
          title: escapeT('URL search params'),
          sort: 970,
          hasChildren: true,
        },
      ),
    });
    this.defineProperty('logger', {
      get: () => {
        return this.engine.logger.child({ module: 'flow-engine' });
      },
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
    this.defineMethod('createJSRunner', function (options) {
      const runCtx = new FlowRunjsContext(this.createProxy());
      return new JSRunner({
        ...options,
        globals: {
          ctx: runCtx,
          window: createSafeWindow(),
          document: createSafeDocument(),
          ...options?.globals,
        },
      });
    });
    // 复制文本到剪贴板（优先使用 Clipboard API，降级到 execCommand）
    this.defineMethod('copyToClipboard', async (text: string) => {
      const content = String(text ?? '');
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(content);
          return;
        }
      } catch (e) {
        // 忽略，尝试降级方案
      }

      // 降级方案：创建临时 textarea + execCommand('copy')
      return new Promise<void>((resolve, reject) => {
        try {
          const ta = document.createElement('textarea');
          ta.value = content;
          ta.setAttribute('readonly', '');
          ta.style.position = 'fixed';
          ta.style.top = '-9999px';
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          const ok = document.execCommand('copy');
          document.body.removeChild(ta);
          if (ok) resolve();
          else reject(new Error('execCommand copy failed'));
        } catch (err) {
          reject(err);
        }
      });
    });
    // Helper: build server contextParams for variables:resolve
    this.defineMethod('buildServerContextParams', function (this: BaseFlowEngineContext, input?: any) {
      return _buildServerContextParams(this, input);
    });
    this.defineMethod('getAction', function (this: BaseFlowEngineContext, name: string) {
      return this.engine.getAction(name);
    });
    this.defineMethod('getActions', function (this: BaseFlowEngineContext) {
      return this.engine.getActions();
    });
    this.defineMethod('getEvents', function (this: BaseFlowEngineContext) {
      return this.engine.getEvents();
    });

    // // Date variables (for variable selector meta tree)
    // this.defineProperty('date', {
    //   get: () => {
    //     const vars = getDateVars() as Record<string, any>;
    //     // align with client options: add dayBeforeYesterday
    //     vars.dayBeforeYesterday = toUnit('day', -2);
    //     const now = new Date().toISOString();
    //     const out: Record<string, any> = {};
    //     for (const [k, v] of Object.entries(vars)) {
    //       try {
    //         out[k] = typeof v === 'function' ? v({ now }) : v;
    //       } catch (e) {
    //         // ignore
    //       }
    //     }
    //     return out;
    //   },
    //   meta: () => {
    //     const title = this.t('Date variables');
    //     const mk = (t: string) => ({ type: 'any', title: this.t(t) });
    //     return {
    //       type: 'object',
    //       title,
    //       properties: {
    //         now: mk('Current time'),
    //         dayBeforeYesterday: mk('Day before yesterday'),
    //         yesterday: mk('Yesterday'),
    //         today: mk('Today'),
    //         tomorrow: mk('Tomorrow'),
    //         lastIsoWeek: mk('Last week'),
    //         thisIsoWeek: mk('This week'),
    //         nextIsoWeek: mk('Next week'),
    //         lastMonth: mk('Last month'),
    //         thisMonth: mk('This month'),
    //         nextMonth: mk('Next month'),
    //         lastQuarter: mk('Last quarter'),
    //         thisQuarter: mk('This quarter'),
    //         nextQuarter: mk('Next quarter'),
    //         lastYear: mk('Last year'),
    //         thisYear: mk('This year'),
    //         nextYear: mk('Next year'),
    //         last7Days: mk('Last 7 days'),
    //         next7Days: mk('Next 7 days'),
    //         last30Days: mk('Last 30 days'),
    //         next30Days: mk('Next 30 days'),
    //         last90Days: mk('Last 90 days'),
    //         next90Days: mk('Next 90 days'),
    //       },
    //     } as PropertyMeta;
    //   },
    // });
    this.defineMethod(
      'runAction',
      async function (this: BaseFlowEngineContext, actionName: string, params?: Record<string, any>) {
        const def = this.engine.getAction<FlowModel, FlowEngineContext>(actionName);
        const ctx = this.createProxy() as unknown as FlowEngineContext;
        if (!def) {
          throw new Error(`Action '${actionName}' not found.`);
        }

        const defaultParams = await resolveDefaultParams(def.defaultParams, ctx);
        let combinedParams: Record<string, any> = { ...(defaultParams || {}), ...(params || {}) };

        let useRawParams = def.useRawParams;
        if (typeof useRawParams === 'function') {
          useRawParams = await useRawParams(ctx);
        }
        if (!useRawParams) {
          // 先服务端解析，再前端补齐
          combinedParams = await (ctx as any).resolveJsonTemplate(combinedParams);
        }

        if (!def.handler) {
          throw new Error(`Action '${actionName}' has no handler.`);
        }
        return def.handler(ctx, combinedParams);
      },
    );
    this.defineProperty('acl', {
      get: () => {
        const acl = new ACL(this.engine);
        return acl;
      },
    });
    this.defineMethod('aclCheck', function (params) {
      return this.acl.aclCheck(params);
    });
    this.defineMethod('createResource', function (this: BaseFlowEngineContext, resourceType) {
      return this.engine.createResource(resourceType, {
        context: this.createProxy(),
      });
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
    this.defineMethod('runjs', async (code, variables) => {
      const runner = this.createJSRunner({
        globals: variables,
      });
      return runner.run(code);
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
    this.defineMethod('openView', async function (uid: string, options) {
      let model: FlowModel | null = null;
      model = await this.engine.loadModel({ uid });
      if (!model) {
        model = this.engine.createModel({
          uid, // 注意： 新建的 model 应该使用 ${parentModel.uid}-xxx 形式的 uid
          use: 'PopupActionModel',
          parentId: this.model.uid,
          subType: 'object',
          subKey: uid,
          stepParams: {
            popupSettings: {
              openView: {
                ..._.pick(options, ['dataSourceKey', 'collectionName', 'associationName']),
              },
            },
          },
        });
        await model.save();
      }
      if (model.getStepParams('popupSettings')?.openView?.dataSourceKey) {
        model.setStepParams('popupSettings', {
          openView: {
            ...model.getStepParams('popupSettings')?.openView,
            ..._.pick(options, ['dataSourceKey', 'collectionName', 'associationName']),
          },
        });
        await model.save();
      }

      model.context.defineProperty('inputArgs', { value: { ...(options || {}), viewUid: this.model.uid } });
      const parentView = this.view;
      if (parentView) {
        model.context.defineProperty('view', { get: () => parentView });
      }
      await model.dispatchEvent('click', {
        // navigation: false, // TODO: 路由模式有bug，不支持多层同样viewId的弹窗，因此这里默认先用false
        // ...this.model?.['getInputArgs']?.(), // 避免部分关系字段信息丢失, 仿照 ClickableCollectionField 做法
        ...options,
      });
    });
    this.defineMethod('getEvents', function (this: BaseFlowModelContext) {
      return this.model.getEvents();
    });
    this.defineMethod('getAction', function (this: BaseFlowModelContext, name: string) {
      return this.model.getAction(name);
    });
    this.defineMethod('getActions', function (this: BaseFlowModelContext) {
      return this.model.getActions();
    });
    this.defineMethod(
      'runAction',
      async function (this: BaseFlowModelContext, actionName: string, params?: Record<string, any>) {
        const def = this.model.getAction<FlowModel, FlowModelContext>(actionName);
        const ctx = this.createProxy() as unknown as FlowModelContext;
        if (!def) {
          throw new Error(`Action '${actionName}' not found.`);
        }

        const defaultParams = await resolveDefaultParams(def.defaultParams, ctx);
        let combinedParams: Record<string, any> = { ...(defaultParams || {}), ...(params || {}) };

        let useRawParams = def.useRawParams;
        if (typeof useRawParams === 'function') {
          useRawParams = await useRawParams(ctx);
        }
        if (!useRawParams) {
          combinedParams = await (ctx as any).resolveJsonTemplate(combinedParams);
        }

        if (!def.handler) {
          throw new Error(`Action '${actionName}' has no handler.`);
        }
        return def.handler(ctx, combinedParams);
      },
    );
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
    this.addDelegate((this.master as any).context);
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
      const runner = this.createJSRunner({
        globals: variables,
      });
      return runner.run(code);
    });
  }
}

export class FlowRuntimeContext<
  TModel extends FlowModel = FlowModel,
  TMode extends 'runtime' | 'settings' = any,
> extends BaseFlowModelContext {
  declare steps: Record<string, { params: Record<string, any>; uiSchema?: any; result?: any }>;
  stepResults: Record<string, any> = {};
  declare useResource: (className: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource') => void;
  declare getStepParams: (stepKey: string) => Record<string, any>;
  declare setStepParams: (stepKey: string, params?: any) => void;
  declare getStepResults: (stepKey: string) => any;
  declare runAction: (actionName: string, params?: Record<string, any>) => Promise<any> | any;
  constructor(
    public model: TModel,
    public flowKey: string,
    protected _mode: TMode = 'runtime' as TMode,
  ) {
    super();
    this.addDelegate(this.model.context);
    this.defineMethod('getStepParams', (stepKey: string) => {
      return model.getStepParams(flowKey, stepKey) || {};
    });
    this.defineMethod('setStepParams', (stepKey: string, params) => {
      return model.setStepParams(flowKey, stepKey, params);
    });
    this.defineMethod('getStepResults', (stepKey: string) => {
      return _.get(this.steps, [stepKey, 'result']);
    });
    this.defineMethod(
      'useResource',
      (className: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource') => {
        if (model.context.has('resource')) {
          console.warn(`[FlowRuntimeContext] useResource - resource already defined in context: ${className}`);
          return;
        }
        model.context.defineProperty('resource', {
          get: () => {
            return this.createResource(className);
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
      const runner = this.createJSRunner({
        globals: variables,
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

  exitAll() {
    throw new FlowExitAllException(this.flowKey, this.model.uid);
  }

  get mode() {
    return this._mode;
  }
}

// 类型别名，方便使用
export type FlowSettingsContext<TModel extends FlowModel = FlowModel> = FlowRuntimeContext<TModel, 'settings'>;
