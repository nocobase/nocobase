/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowContext } from '../flowContext';
import { createRunJSDeprecationProxy } from '../flowContext';
import { JSRunner } from '../JSRunner';
import type { JSRunnerOptions } from '../JSRunner';
import { setRunJSRuntimeReporting } from '../runjsRuntimeReporter';
import { RunJSContextRegistry, getModelClassName, type RunJSVersion } from './registry';

function getLocale(ctx: any): string | undefined {
  return ctx?.api?.auth?.locale || ctx?.i18n?.language || ctx?.locale;
}

export function getRunJSDocFor(ctx: FlowContext, { version = 'v1' as RunJSVersion } = {}) {
  const modelClass = getModelClassName(ctx);
  const ctor = RunJSContextRegistry.resolve(version, modelClass) || RunJSContextRegistry.resolve(version, '*');
  const locale = getLocale(ctx);
  if ((ctor as any)?.getDoc?.length) {
    // prefer getDoc(locale)
    return (ctor as any).getDoc(locale) || {};
  }
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
  setRunJSRuntimeReporting(runCtx, options?.runtimeReporting);
  let doc: any = {};
  try {
    const locale = getLocale(this);
    if ((Ctor as any)?.getDoc?.length) doc = (Ctor as any).getDoc(locale) || {};
    else doc = (Ctor as any)?.getDoc?.() || {};
  } catch (_) {
    doc = {};
  }
  const deprecatedCtx = createRunJSDeprecationProxy(runCtx, { doc });
  const browserGlobals: Record<string, any> = {};
  if (typeof window !== 'undefined') {
    browserGlobals.window = window;
    if (typeof navigator !== 'undefined') {
      browserGlobals.navigator = navigator;
    }
  }
  if (typeof document !== 'undefined') {
    browserGlobals.document = document;
  }
  const globals: Record<string, any> = { ctx: deprecatedCtx, ...browserGlobals, ...(options?.globals || {}) };
  // 透传 JSRunnerOptions 其余配置（如 timeoutMs）
  const { timeoutMs, runtimeReporting } = options || {};
  return new JSRunner({ globals, timeoutMs, runtimeReporting });
}

export function getRunJSScenesForModel(modelClass: string, version: RunJSVersion = 'v1'): string[] {
  const meta = RunJSContextRegistry.getMeta(version, modelClass);
  const scenes = meta?.scenes;
  return Array.isArray(scenes) ? [...scenes] : [];
}

export function getRunJSScenesForContext(ctx: FlowContext, { version = 'v1' as RunJSVersion } = {}): string[] {
  const modelClass = getModelClassName(ctx);
  return getRunJSScenesForModel(modelClass, version);
}
