/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowContext } from '../../flowContext';
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

export class FlowRunJSContext extends FlowContext {
  constructor(delegate: FlowContext) {
    super();
    this.addDelegate(delegate);
    // 常用依赖直接注入到运行环境
    this.defineProperty('React', { value: React });
    this.defineProperty('antd', { value: antd });
    this.defineProperty('ReactDOM', { value: ReactDOMClient });
  }

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
    openView: '打开视图：`await ctx.openView(viewId, { ... })`',
  },
});
