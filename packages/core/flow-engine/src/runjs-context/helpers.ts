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
  const modelClass = getModelClassName(ctx);
  const ctor =
    RunJSContextRegistry.resolve(version, modelClass) ||
    RunJSContextRegistry.resolve('latest' as RunJSVersion, modelClass) ||
    FlowRunJSContext;
  return (ctor as any).getDoc?.() || {};
}

export function createJSRunnerWithVersion(this: FlowContext, options?: JSRunnerOptions) {
  const version = (options?.version as RunJSVersion) || ('v1' as RunJSVersion);
  const modelClass = getModelClassName(this);
  const Ctor =
    RunJSContextRegistry.resolve(version, modelClass) ||
    RunJSContextRegistry.resolve('latest' as RunJSVersion, modelClass) ||
    FlowRunJSContext;
  const runCtx = new Ctor((this as any).createProxy ? (this as any).createProxy() : (this as any));
  const globals = { ctx: runCtx, ...(options?.globals || {}) };
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
