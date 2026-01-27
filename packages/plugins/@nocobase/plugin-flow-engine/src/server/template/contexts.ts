/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { getDateVars, toUnit } from '@nocobase/utils';
import { ResourcerContext } from '@nocobase/resourcer';

type Getter<T = any> = (ctx: ServerBaseContext) => T | Promise<T>;

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
 * - 支持以 defineMethod 定义方法
 * - 支持 delegate 机制，属性与方法可回退到被委托的上游上下文
 * - 通过 Proxy 实现按需求值与 this 绑定
 */
export class ServerBaseContext {
  protected _props: Record<string, PropertyOptions> = {};
  protected _methods: Record<string, (...args: any[]) => any> = {};
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
  defineProperty(key: string, options: PropertyOptions) {
    if (this._props[key] && this._props[key]?.once) return;
    this._props[key] = options;
    delete this._cache[key];
    Object.defineProperty(this, key, {
      configurable: true,
      enumerable: true,
      get: () => this._getOwn(key, this.createProxy()),
    });
  }

  /** 定义一个方法（不可枚举、不可写），访问时会自动绑定到对应实例 */
  defineMethod(name: string, fn: (...args: any[]) => any) {
    this._methods[name] = fn;
    Object.defineProperty(this, name, {
      configurable: true,
      enumerable: false,
      writable: false,
      value: fn, // bind at proxy access to keep delegate binding consistent
    });
  }

  /**
   * 委托到另一个 ServerBaseContext：
   * - 访问属性/方法找不到时，会回退到被委托者进行解析
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

  /** 创建并返回代理对象（同一实例下保持稳定引用） */
  createProxy() {
    if (this._proxy) return this._proxy as any;
    this._proxy = new Proxy(this, {
      get: (target, key: string, receiver) => {
        if (typeof key !== 'string') return Reflect.get(target, key, receiver);
        if (Reflect.has(target, key)) {
          const v = Reflect.get(target, key, receiver);
          return typeof v === 'function' ? v.bind(target) : v;
        }
        if (Object.prototype.hasOwnProperty.call(target._props, key)) {
          return target._getOwn(key, this.createProxy());
        }
        if (Object.prototype.hasOwnProperty.call(target._methods, key)) {
          const fn = target._methods[key];
          return typeof fn === 'function' ? fn.bind(target) : fn;
        }
        for (const d of target._delegates) {
          const candidate = (d as any)._getOwn?.(key, this.createProxy());
          if (typeof candidate !== 'undefined') return candidate;
          if (Object.prototype.hasOwnProperty.call((d as any)._methods || {}, key)) {
            const fn = (d as any)._methods[key];
            return typeof fn === 'function' ? fn.bind(d) : fn;
          }
        }
        return undefined;
      },
      has: (target, key: string) => {
        if (typeof key !== 'string') return Reflect.has(target, key);
        if (Reflect.has(target, key)) return true;
        if (Object.prototype.hasOwnProperty.call(target._props, key)) return true;
        if (Object.prototype.hasOwnProperty.call(target._methods, key)) return true;
        return target._delegates.some(
          (d) =>
            Object.prototype.hasOwnProperty.call(d._props, key) ||
            Object.prototype.hasOwnProperty.call(d._methods, key),
        );
      },
    });
    return this._proxy as any;
  }
}

/**
 * 全局上下文：
 * - now/timestamp：时间值（不缓存）
 * - env：环境变量（仅暴露白名单前缀）
 * - date：日期快捷变量集合（包含前天等）
 */
export class GlobalContext extends ServerBaseContext {
  constructor(env?: Record<string, any>) {
    super();
    this.defineProperty('now', { get: () => new Date().toISOString(), cache: false });
    this.defineProperty('timestamp', { get: () => Date.now(), cache: false });
    // 仅暴露经过白名单过滤的环境变量，避免泄露敏感信息
    if (env) this.defineProperty('env', { value: filterEnv(env) });

    // 日期变量集合：与历史 $nDate/$date 变量保持一致（并补充 dayBeforeYesterday）
    this.defineProperty('date', {
      get: (_ctx) => buildDateVariables(),
      cache: false,
    });
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
    this.defineProperty('user', { get: async () => this.koaCtx?.auth?.user, cache: true });
    this.defineProperty('roleName', { value: this.koaCtx?.auth?.role });
    this.defineProperty('locale', { value: this.koaCtx?.getCurrentLocale?.() });
    this.defineProperty('ip', { value: this.koaCtx?.state?.clientIp || this.koaCtx?.request?.ip });
    this.defineProperty('headers', { value: this.koaCtx?.headers });
    this.defineProperty('query', { value: this.koaCtx?.request?.query });
    this.defineProperty('params', { value: _.get(this.koaCtx, 'action.params') });
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

/**
 * 构建日期快捷变量集合（依据服务端时区）。
 */
function buildDateVariables() {
  // 使用服务端时区
  const timezone = getServerTimezone();
  const now = new Date().toISOString();

  // 基于现有工具获取日期变量集合
  const base = getDateVars() as Record<string, any>;
  // 补充 "前天"
  base.dayBeforeYesterday = toUnit('day', -2);

  const out: Record<string, any> = {};
  for (const [key, val] of Object.entries(base)) {
    try {
      out[key] = typeof val === 'function' ? val({ timezone, now }) : val;
    } catch (_) {
      // 出错时跳过该变量，避免影响整体解析
    }
  }
  return out;
}

/**
 * 获取服务端时区：优先读取 DB_TIMEZONE/TZ，回退到本地时区偏移。
 */
function getServerTimezone(): string {
  // 优先使用环境变量 DB_TIMEZONE 或 TZ
  const tzEnv = process?.env?.DB_TIMEZONE || process?.env?.TZ;
  if (tzEnv) {
    // 支持 +08:00/-05:00 或 IANA 时区名（如 Asia/Shanghai）
    const m = tzEnv.match(/^([+-])(\d{1,2}):(\d{2})$/);
    if (m) {
      const sign = m[1];
      const hh = m[2].padStart(2, '0');
      const mm = m[3];
      return `${sign}${hh}:${mm}`;
    }
    return tzEnv; // 作为 IANA 时区名传递
  }
  // 回退：根据服务器本地偏移生成 +HH:MM
  const offsetMinutes = -new Date().getTimezoneOffset(); // 东八区为 +480
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${sign}${hh}:${mm}`;
}
