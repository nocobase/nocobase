/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowContext } from '../../flowContext';
import * as antd from 'antd';
import React from 'react';
import * as ReactDOMClient from 'react-dom/client';

export type RunJSVersion = 'v1' | (string & {});
export type RunJSContextCtor = new (delegate: FlowContext) => FlowRunJSContext;

export type RunJSDocMeta = {
  label?: string;
  properties?: Record<string, any>;
  methods?: Record<string, any>;
  snipastes?: Record<string, any>;
};

const classMeta = new WeakMap<Function, RunJSDocMeta>();
const classDocCache = new WeakMap<Function, RunJSDocMeta>();

function deepMerge(base: any, patch: any) {
  if (patch === null) return undefined;
  if (Array.isArray(base) || Array.isArray(patch) || typeof base !== 'object' || typeof patch !== 'object') {
    return patch ?? base;
  }
  const out: any = { ...base };
  for (const k of Object.keys(patch)) {
    const v = deepMerge(base?.[k], patch[k]);
    if (typeof v === 'undefined') delete out[k];
    else out[k] = v;
  }
  return out;
}

export class FlowRunJSContext {
  protected _delegate: FlowContext;
  [key: string]: any;
  static allow?: { keys?: ReadonlyArray<string>; facades?: Record<string, ReadonlyArray<string>> };

  constructor(delegate: FlowContext) {
    this._delegate = delegate;
    const self = this as any;
    // 常用前端依赖直接注入
    self.React = React;
    self.react = React;
    self.antd = antd;
    self.ReactDOM = ReactDOMClient;
    // 公共方法：分发模型事件
    self.dispatchModelEvent = async (modelOrUid: any, eventName: string, inputArgs?: Record<string, any>) => {
      let model: any = null;
      const engine = (this._delegate as any).engine;
      if (typeof modelOrUid === 'string') {
        model = await engine?.loadModel?.({ uid: modelOrUid });
      } else if (modelOrUid && typeof modelOrUid === 'object' && typeof modelOrUid.dispatchEvent === 'function') {
        model = modelOrUid;
      }
      if (model) {
        model.context?.addDelegate?.(self);
        model.dispatchEvent(eventName, {
          navigation: false,
          ...(self.model?.['getInputArgs']?.() || {}),
          ...(inputArgs || {}),
        });
      } else {
        self.message?.error?.(
          self.t?.('Model with ID {{uid}} not found', { uid: String(modelOrUid) }) || 'Model not found',
        );
      }
    };

    // 显式暴露：基础属性（只读 getter 映射到委托）
    this.#exposeProps([
      'message',
      'notification',
      'logger',
      'resource',
      'urlSearchParams',
      'token',
      'role',
      'auth',
      'api',
      'ref',
      'model',
    ]);
    // 显式暴露：基础方法（绑定到委托）
    this.#exposeMethods(['t', 'requireAsync', 'copyToClipboard', 'resolveJsonTemplate', 'runAction', 'onRefReady']);
  }

  // 供子类/外部一致使用的定义 API（与 FlowContext 的接口保持一致风格）
  defineProperty(key: string, options: { get?: (ctx: any) => any; value?: any }) {
    if (options && typeof options.get === 'function') {
      Object.defineProperty(this, key, {
        configurable: true,
        enumerable: true,
        get: () => options.get?.(this),
      });
      return;
    }
    Object.defineProperty(this, key, {
      configurable: true,
      enumerable: true,
      writable: false,
      value: options?.value,
    });
  }
  defineMethod(name: string, fn: (...args: any[]) => any) {
    Object.defineProperty(this, name, {
      configurable: true,
      enumerable: false,
      writable: false,
      value: fn.bind(this),
    });
  }

  // 工具：将委托上的属性以 getter 暴露
  #exposeProps(names: string[]) {
    for (const k of names) {
      if (Object.prototype.hasOwnProperty.call(this, k)) continue;
      this.defineProperty(k, { get: () => (this._delegate as any)[k] });
    }
  }
  // 工具：将委托上的同名方法绑定暴露
  #exposeMethods(names: string[]) {
    for (const k of names) {
      if (Object.prototype.hasOwnProperty.call(this, k)) continue;
      const src = (this._delegate as any)[k];
      if (typeof src === 'function') {
        this.defineMethod(k, src.bind(this._delegate));
      }
    }
  }

  static injectDefaultGlobals?(): { window?: any; document?: any } | void;

  static define(meta: RunJSDocMeta) {
    const prev = classMeta.get(this) || {};
    classMeta.set(this, deepMerge(prev, meta));
    classDocCache.delete(this);
  }

  static getDoc(): RunJSDocMeta {
    const self = this as any;
    if (classDocCache.has(self)) return classDocCache.get(self)!;
    const chain: Function[] = [];
    let cur: any = self;
    while (cur && cur.prototype) {
      chain.unshift(cur);
      cur = Object.getPrototypeOf(cur);
    }
    let merged: RunJSDocMeta = {};
    for (const cls of chain) merged = deepMerge(merged, classMeta.get(cls) || {});
    classDocCache.set(self, merged);
    return merged;
  }
}

// Define base doc on FlowRunJSContext itself
FlowRunJSContext.define({
  label: 'RunJS base',
  properties: {
    t: "国际化函数。示例：`ctx.t('Hello {name}', { name: 'World' })`",
    logger: "Pino logger 子实例。`ctx.logger.info({ foo: 1 }, 'msg')`",
    message: "AntD 全局消息。`ctx.message.success('done')`",
    notification: "AntD 通知。`ctx.notification.open({ message: 'Hi' })`",
    requireAsync: '异步加载外部库。`const x = await ctx.requireAsync(url)`',
    copyToClipboard: '复制文本到剪贴板。`await ctx.copyToClipboard(text)`',
    resolveJsonTemplate: '解析含 {{ }} 的模板/表达式',
    runAction: '运行当前模型动作。`await ctx.runAction(name, params)`',
    resource: '数据资源（按委托可见）',
    urlSearchParams: 'URL 查询参数对象',
    token: 'API Token',
    role: '当前角色',
    auth: '认证信息（locale/role/user/token）',
    api: 'APIClient 实例',
    React: 'React 命名空间（RunJS 环境可用）',
    react: 'React 别名（小写）',
    ReactDOM: 'ReactDOM 客户端（含 createRoot）',
    antd: 'AntD 组件库（RunJS 环境可用）',
  },
  methods: {
    dispatchModelEvent: "触发模型事件：`await ctx.dispatchModelEvent(modelUid, 'click', { ... })`",
  },
});
