/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowContext } from '../flowContext';
import { JSRunner } from '../JSRunner';
import type { JSRunnerOptions } from '../JSRunner';
import { FlowRunJSContext, RunJSVersion } from './contexts/FlowRunJSContext';
import { RunJSContextRegistry, getModelClassName } from './registry';
import { JSBlockRunJSContext } from './contexts/JSBlockRunJSContext';
import { JSFieldRunJSContext } from './contexts/JSFieldRunJSContext';
import { JSItemRunJSContext } from './contexts/JSItemRunJSContext';
import { FormJSFieldItemRunJSContext } from './contexts/FormJSFieldItemRunJSContext';
import { JSRecordActionRunJSContext } from './contexts/JSRecordActionRunJSContext';
import { JSCollectionActionRunJSContext } from './contexts/JSCollectionActionRunJSContext';
import { LinkageRunJSContext } from './contexts/LinkageRunJSContext';

export function getRunJSDocFor(ctx: FlowContext, { version = 'v1' as RunJSVersion } = {}) {
  // 确保默认映射已注册（幂等）
  registerDefaultMappings();
  const modelClass = getModelClassName(ctx);
  const ctor =
    RunJSContextRegistry.resolve(version, modelClass) ||
    RunJSContextRegistry.resolve('latest' as RunJSVersion, modelClass) ||
    FlowRunJSContext;
  return (ctor as any).getDoc?.() || {};
}

export function createJSRunnerWithVersion(this: FlowContext, options?: JSRunnerOptions) {
  // 确保默认映射已注册（幂等）
  registerDefaultMappings();
  const version = (options?.version as RunJSVersion) || ('v1' as RunJSVersion);
  const modelClass = getModelClassName(this);
  const ensureFlowContext = (obj: any): FlowContext => {
    // 若调用者本身就是 FlowContext，直接使用
    // 不能直接 import FlowContext，避免在模块初始化期引入循环；
    // 通过 FlowRunJSContext 的原型链获取基类构造函数（即 FlowContext）。
    const baseCtor = Object.getPrototypeOf(FlowRunJSContext.prototype)?.constructor as new () => FlowContext;
    if (baseCtor && obj instanceof baseCtor) return obj as FlowContext;
    return new baseCtor();
  };
  const Ctor =
    RunJSContextRegistry.resolve(version, modelClass) ||
    RunJSContextRegistry.resolve('latest' as RunJSVersion, modelClass) ||
    FlowRunJSContext;
  const runCtx = new Ctor(ensureFlowContext(this));
  const globals: Record<string, any> = { ctx: runCtx, ...(options?.globals || {}) };
  // 对字段/区块类上下文，默认注入 window/document 以支持在沙箱中访问 DOM API
  if (modelClass === 'JSFieldModel' || modelClass === 'JSBlockModel') {
    if (typeof window !== 'undefined') globals.window = window;
    if (typeof document !== 'undefined') globals.document = document;
  }
  // 透传 JSRunnerOptions 其余配置（如 timeoutMs）
  const { timeoutMs } = options || {};
  return new JSRunner({ globals, timeoutMs });
}

export function registerDefaultMappings() {
  const v: RunJSVersion = 'v1';
  RunJSContextRegistry.register(v, 'JSBlockModel', JSBlockRunJSContext);
  RunJSContextRegistry.register(v, 'JSFieldModel', JSFieldRunJSContext);
  RunJSContextRegistry.register(v, 'JSItemModel', JSItemRunJSContext);
  RunJSContextRegistry.register(v, 'FormJSFieldItemModel', FormJSFieldItemRunJSContext);
  RunJSContextRegistry.register(v, 'JSRecordActionModel', JSRecordActionRunJSContext);
  RunJSContextRegistry.register(v, 'JSCollectionActionModel', JSCollectionActionRunJSContext);
  RunJSContextRegistry.register(v, '*', FlowRunJSContext);
}
