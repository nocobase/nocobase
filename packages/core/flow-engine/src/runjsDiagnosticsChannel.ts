/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface RunJSRenderDiagnostic {
  kind: 'render-error';
  key: string;
  message: string;
  error: unknown;
  stack?: string;
  componentStack?: string;
}

export type RunJSRenderDiagnosticTarget =
  | { kind: 'context'; context: object }
  | { kind: 'flow-model'; flowEngine: object; modelUid: string };

export type RunJSRenderDiagnosticListener = (diagnostic: RunJSRenderDiagnostic) => void;

const contextListeners = new WeakMap<object, Set<RunJSRenderDiagnosticListener>>();
const modelListeners = new WeakMap<object, Map<string, Set<RunJSRenderDiagnosticListener>>>();
const RUNJS_DIAGNOSTICS_CONTEXT_ID = Symbol('nocobase.runjs.diagnostics-context-id');

export function subscribeRunJSRenderDiagnostics(
  target: RunJSRenderDiagnosticTarget,
  listener: RunJSRenderDiagnosticListener,
): () => void {
  if (typeof listener !== 'function') {
    return () => {};
  }

  if (target.kind === 'context') {
    const contextKey = getContextKey(target.context, true);
    if (!contextKey) {
      return () => {};
    }
    let listeners = contextListeners.get(contextKey);
    if (!listeners) {
      listeners = new Set();
      contextListeners.set(contextKey, listeners);
    }
    listeners.add(listener);
    return () => {
      const current = contextListeners.get(contextKey);
      current?.delete(listener);
      if (current?.size === 0) {
        contextListeners.delete(contextKey);
      }
    };
  }

  if (!target.flowEngine || typeof target.flowEngine !== 'object' || !target.modelUid) {
    return () => {};
  }
  let listenersByUid = modelListeners.get(target.flowEngine);
  if (!listenersByUid) {
    listenersByUid = new Map();
    modelListeners.set(target.flowEngine, listenersByUid);
  }
  let listeners = listenersByUid.get(target.modelUid);
  if (!listeners) {
    listeners = new Set();
    listenersByUid.set(target.modelUid, listeners);
  }
  listeners.add(listener);

  return () => {
    const currentByUid = modelListeners.get(target.flowEngine);
    const current = currentByUid?.get(target.modelUid);
    current?.delete(listener);
    if (current?.size === 0) {
      currentByUid?.delete(target.modelUid);
    }
    if (currentByUid?.size === 0) {
      modelListeners.delete(target.flowEngine);
    }
  };
}

export function reportRunJSRenderDiagnostic(context: unknown, error: unknown, info?: unknown): boolean {
  if (!context || typeof context !== 'object') {
    return false;
  }
  const diagnostic = createRunJSRenderDiagnostic(error, info);
  const contextKey = getContextKey(context, false);
  let reported = notifyListeners(contextKey ? contextListeners.get(contextKey) : undefined, diagnostic);
  const model = (context as { model?: unknown }).model;
  if (model && typeof model === 'object') {
    const flowEngine = (model as { flowEngine?: unknown }).flowEngine;
    const modelUid = (model as { uid?: unknown }).uid;
    if (flowEngine && typeof flowEngine === 'object' && typeof modelUid === 'string' && modelUid) {
      reported = notifyListeners(modelListeners.get(flowEngine)?.get(modelUid), diagnostic) || reported;
    }
  }
  return reported;
}

function getContextKey(context: object, create: boolean): object | undefined {
  const existing = (context as Record<PropertyKey, unknown>)[RUNJS_DIAGNOSTICS_CONTEXT_ID];
  if (existing && typeof existing === 'object') {
    return existing;
  }
  if (!create) {
    return undefined;
  }
  const key = {};
  try {
    Object.defineProperty(context, RUNJS_DIAGNOSTICS_CONTEXT_ID, {
      configurable: false,
      enumerable: false,
      value: key,
    });
    return key;
  } catch (_) {
    return context;
  }
}

function createRunJSRenderDiagnostic(error: unknown, info?: unknown): RunJSRenderDiagnostic {
  const rawMessage = error && typeof error === 'object' ? (error as { message?: unknown }).message : error;
  const message = String(rawMessage || error || '').trim() || 'Unknown render error';
  const stack =
    error && typeof error === 'object' && typeof (error as { stack?: unknown }).stack === 'string'
      ? String((error as { stack: string }).stack)
      : undefined;
  const componentStack =
    info && typeof info === 'object' && typeof (info as { componentStack?: unknown }).componentStack === 'string'
      ? String((info as { componentStack: string }).componentStack)
      : undefined;
  return {
    kind: 'render-error',
    key: `${message}\n${stack || ''}\n${componentStack || ''}`,
    message,
    error,
    stack,
    componentStack,
  };
}

function notifyListeners(
  listeners: Set<RunJSRenderDiagnosticListener> | undefined,
  diagnostic: RunJSRenderDiagnostic,
): boolean {
  if (!listeners?.size) {
    return false;
  }
  let reported = false;
  for (const listener of Array.from(listeners)) {
    try {
      listener(diagnostic);
      reported = true;
    } catch (_) {
      // Keep notifying the remaining listeners; the normal logger remains the final fallback.
    }
  }
  return reported;
}
