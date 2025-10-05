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
import type { RunJSVersion } from './registry';
import { RunJSContextRegistry, getModelClassName } from './registry';

export function getRunJSDocFor(ctx: FlowContext, { version = 'v1' as RunJSVersion } = {}) {
  const modelClass = getModelClassName(ctx);
  const ctor = RunJSContextRegistry.resolve(version, modelClass) || RunJSContextRegistry.resolve(version, '*');
  return (ctor as any)?.getDoc?.() || {};
}

export function createJSRunnerWithVersion(this: FlowContext, options?: JSRunnerOptions) {
  const version = (options?.version as RunJSVersion) || ('v1' as RunJSVersion);
  const modelClass = getModelClassName(this);
  const ensureFlowContext = (obj: any): FlowContext => obj as FlowContext;
  const Ctor = RunJSContextRegistry.resolve(version, modelClass) || RunJSContextRegistry.resolve(version, '*');
  if (!Ctor) {
    throw new Error('[RunJS] No RunJSContext registered for version/model.');
  }
  const runCtx = new (Ctor as any)(ensureFlowContext(this));
  const globals: Record<string, any> = { ctx: runCtx, ...(options?.globals || {}) };
  // 对字段/区块类上下文，默认注入 window/document 以支持在沙箱中访问 DOM API
  if (modelClass === 'JSFieldModel' || modelClass === 'JSBlockModel') {
    if (typeof window !== 'undefined') globals.window = window as any;
    if (typeof document !== 'undefined') globals.document = document as any;
  }
  // 透传 JSRunnerOptions 其余配置（如 timeoutMs）
  const { timeoutMs } = options || {};
  return new JSRunner({ globals, timeoutMs });
}
