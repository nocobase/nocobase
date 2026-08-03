/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { ResourcerContext } from '@nocobase/resourcer';
import {
  GLOBAL_CONTEXT_KEYS,
  HTTP_REQUEST_CONTEXT_KEYS,
  SERVER_CONTEXT_INTERNAL_KEYS,
  SERVER_CONTEXT_PROTOTYPE_KEYS,
} from './context-keys';

type Getter<T = any> = (ctx: ServerBaseContext) => T | Promise<T>;

export const SERVER_CONTEXT_PROVIDER_TOKEN = Symbol('server-context-provider');
const PROVIDER_KEYS = new Set<string>([...GLOBAL_CONTEXT_KEYS, ...HTTP_REQUEST_CONTEXT_KEYS]);
const INTERNAL_KEYS = new Set<string>(SERVER_CONTEXT_INTERNAL_KEYS);
const BLOCKED_SANDBOX_KEYS = new Set<string>([...SERVER_CONTEXT_PROTOTYPE_KEYS, ...SERVER_CONTEXT_INTERNAL_KEYS]);

function isBlockedSandboxKey(key: string) {
  return BLOCKED_SANDBOX_KEYS.has(key);
}

export interface PropertyOptions {
  /** 固定值，优先级高于 get */
  value?: any;
  /** 惰性求值 getter，返回值可为 Promise；默认会被缓存 */
  get?: Getter;
  /** 是否禁用缓存，true 表示每次访问都重新计算 */
  cache?: boolean;
  /** 仅允许首次定义，后续重复定义将被忽略 */
  once?: boolean;
}

/**
 * 服务器端上下文基础类。
 * - 支持以 defineProperty 定义惰性/常量属性，并可选择缓存
 * - 支持 delegate 机制，属性可回退到被委托的上游上下文
 * - 通过 Proxy 实现按需求值
 */
export class ServerBaseContext {
  protected _props: Record<string, PropertyOptions> = {};
  protected _cache: Record<string, any> = {};
  protected _delegates: ServerBaseContext[] = [];
  protected _proxy?: ServerBaseContext;
  [key: string]: any;

  constructor() {
    return this.createProxy();
  }

  protected _getOwn(key: string, current: ServerBaseContext): any {
    const opt = this._props[key];
    if (!opt) return undefined;
    if (Object.prototype.hasOwnProperty.call(opt, 'value')) return opt.value;
    if (opt.get) {
      if (opt.cache === false) return opt.get(current);
      if (key in this._cache) return this._cache[key];
      const p = opt.get(current);
      this._cache[key] = p;
      return p;
    }
    return undefined;
  }

  /**
   * 定义一个可枚举属性。
   * - value：固定值
   * - get：惰性 getter（默认带缓存）
   * - once：已存在时忽略重复定义
   */
  defineProperty(key: string, options: PropertyOptions, providerToken?: typeof SERVER_CONTEXT_PROVIDER_TOKEN) {
    if (BLOCKED_SANDBOX_KEYS.has(key)) return;
    if (
      PROVIDER_KEYS.has(key) &&
      (this instanceof HttpRequestContext || this instanceof GlobalContext) &&
      providerToken !== SERVER_CONTEXT_PROVIDER_TOKEN
    ) {
      return;
    }
    if (this._props[key]?.once && providerToken !== SERVER_CONTEXT_PROVIDER_TOKEN) return;
    this._props[key] = providerToken === SERVER_CONTEXT_PROVIDER_TOKEN ? { ...options, once: true } : options;
    delete this._cache[key];
    Object.defineProperty(this, key, {
      configurable: true,
      enumerable: true,
      get: () => this._getOwn(key, this.createProxy()),
    });
  }

  /**
   * 委托到另一个 ServerBaseContext：
   * - 访问属性找不到时，会回退到被委托者进行解析
   */
  delegate(ctx: ServerBaseContext) {
    if (!(ctx instanceof ServerBaseContext)) {
      throw new Error('Delegate must be a ServerBaseContext');
    }
    if (!this._delegates.includes(ctx)) this._delegates.unshift(ctx);
  }

  /** 清空所有委托 */
  clearDelegates() {
    this._delegates = [];
  }

  getSandboxKeys(): string[] {
    const keys = new Set<string>();
    for (const key of Object.keys(this._props)) {
      if (!isBlockedSandboxKey(key)) keys.add(key);
    }
    for (const d of this._delegates) {
      for (const key of d.getSandboxKeys()) {
        if (!isBlockedSandboxKey(key)) keys.add(key);
      }
    }
    return Array.from(keys);
  }

  getSandboxValue(key: string, current: ServerBaseContext = this.createProxy()): any {
    if (isBlockedSandboxKey(key)) return undefined;
    if (Object.prototype.hasOwnProperty.call(this._props, key)) {
      return this._getOwn(key, current);
    }
    for (const d of this._delegates) {
      if (!d.getSandboxKeys().includes(key)) continue;
      return d.getSandboxValue(key, current);
    }
    return undefined;
  }

  /** 创建并返回代理对象（同一实例下保持稳定引用） */
  createProxy() {
    if (this._proxy) return this._proxy as any;
    this._proxy = new Proxy(this, {
      get: (target, key: string, receiver) => {
        if (typeof key !== 'string') return Reflect.get(target, key, receiver);
        if (SERVER_CONTEXT_PROTOTYPE_KEYS.includes(key as (typeof SERVER_CONTEXT_PROTOTYPE_KEYS)[number])) {
          return undefined;
        }
        if (INTERNAL_KEYS.has(key) && key.startsWith('_')) return undefined;
        if (Reflect.has(target, key)) {
          const v = Reflect.get(target, key, receiver);
          return typeof v === 'function' ? v.bind(target) : v;
        }
        if (Object.prototype.hasOwnProperty.call(target._props, key)) {
          return target._getOwn(key, this.createProxy());
        }
        for (const d of target._delegates) {
          const candidate = d.getSandboxValue(key, this.createProxy());
          if (typeof candidate !== 'undefined') return candidate;
        }
        return undefined;
      },
      has: (target, key: string) => {
        if (typeof key !== 'string') return Reflect.has(target, key);
        if (isBlockedSandboxKey(key)) return false;
        if (Reflect.has(target, key)) return true;
        if (Object.prototype.hasOwnProperty.call(target._props, key)) return true;
        return target._delegates.some((d) => d.getSandboxKeys().includes(key));
      },
    });
    return this._proxy as any;
  }
}

/**
 * 全局上下文：
 * - now/timestamp：时间值（不缓存）
 * - env：环境变量（仅暴露白名单前缀）
 */
export class GlobalContext extends ServerBaseContext {
  constructor(env?: Record<string, any>) {
    super();
    this.defineProperty('now', { get: () => new Date().toISOString(), cache: false }, SERVER_CONTEXT_PROVIDER_TOKEN);
    this.defineProperty('timestamp', { get: () => Date.now(), cache: false }, SERVER_CONTEXT_PROVIDER_TOKEN);
    // 仅暴露经过白名单过滤的环境变量，避免泄露敏感信息
    if (env) this.defineProperty('env', { value: filterEnv(env) }, SERVER_CONTEXT_PROVIDER_TOKEN);
  }
}

/**
 * 请求级上下文：从 Koa-like 上下文中映射基础信息。
 * - user（缓存）、roleName、locale、ip、headers、query、params
 */
export class HttpRequestContext extends ServerBaseContext {
  constructor(private koaCtx: ResourcerContext) {
    super();

    // TODO: user 也是一种 record，因此可以考虑复用 record 变量的注册方式，不过不需要传参
    this.defineProperty(
      'user',
      { get: async () => this.koaCtx?.auth?.user, cache: true },
      SERVER_CONTEXT_PROVIDER_TOKEN,
    );
    this.defineProperty('roleName', { value: this.koaCtx?.auth?.role }, SERVER_CONTEXT_PROVIDER_TOKEN);
    this.defineProperty('locale', { value: this.koaCtx?.getCurrentLocale?.() }, SERVER_CONTEXT_PROVIDER_TOKEN);
    this.defineProperty(
      'ip',
      { value: this.koaCtx?.state?.clientIp || this.koaCtx?.request?.ip },
      SERVER_CONTEXT_PROVIDER_TOKEN,
    );
    this.defineProperty('headers', { value: this.koaCtx?.headers }, SERVER_CONTEXT_PROVIDER_TOKEN);
    this.defineProperty('query', { value: this.koaCtx?.request?.query }, SERVER_CONTEXT_PROVIDER_TOKEN);
    this.defineProperty('params', { value: _.get(this.koaCtx, 'action.params') }, SERVER_CONTEXT_PROVIDER_TOKEN);
  }
}

// 默认只允许公开前缀的环境变量透出到模板上下文
const DEFAULT_ENV_PREFIXES = ['PUBLIC_', 'NEXT_PUBLIC_', 'NCB_PUBLIC_'];

/**
 * 过滤环境变量，仅保留指定前缀的键。
 * @param env 环境变量对象
 * @param allowedPrefixes 允许的前缀列表
 */
function filterEnv(env: Record<string, any>, allowedPrefixes: string[] = DEFAULT_ENV_PREFIXES) {
  try {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(env || {})) {
      if (allowedPrefixes.some((p) => k.startsWith(p))) {
        out[k] = v;
      }
    }
    return out;
  } catch (_) {
    return {};
  }
}
