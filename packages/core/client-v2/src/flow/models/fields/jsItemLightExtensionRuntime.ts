/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ElementProxy,
  FlowCancelSaveException,
  type FlowModel,
  type FlowRuntimeContext,
  type RunJSValue,
  type FlowSettingsContext,
  type StepDefinition,
} from '@nocobase/flow-engine';
import React from 'react';

import {
  resolveRuntimeRunJS,
  createRunJSSourceCascadeMenuUIMode,
  getRunJSModelUse,
  type ResolvedRuntimeRunJS,
  type RunJSSourceBinding,
  type RunJSSourceSettings,
} from '../../components/runjs-source';
import {
  cloneJsonValue,
  cloneRecord,
  createLightExtensionRunJsUISchema,
  createLightExtensionSettingSteps,
  createLightExtensionSourceBindingStep,
  createLightExtensionSourceModeStep,
  createRuntimeRunTracker,
  getLightExtensionFallbackBindingTitle,
  getLightExtensionSettingsDescriptor as getSharedLightExtensionSettingsDescriptor,
  getLightExtensionStoredBindingTitle,
  getModelTranslator,
  getRecordProperty,
  getStringProperty,
  INLINE_SOURCE_MODE,
  isRecord,
  LIGHT_EXTENSION_SOURCE_MODE,
  normalizeLightExtensionRuntimeError,
  normalizeLightExtensionSourceSettingsForBinding,
  normalizeLightExtensionSourceMode,
  rememberLightExtensionBindingSettings,
  resolveLightExtensionBindingTitle as resolveSharedLightExtensionBindingTitle,
  setCanonicalLightExtensionSetting,
  setCanonicalLightExtensionSource,
  showPendingLightExtensionRequiredSettings,
  stableSerialize,
  stableSerializeWithCircular,
  toNonEmptyString,
  type LightExtensionSourceMode,
  type LightExtensionSourceModeParams,
  type RuntimeErrorInfo,
} from '../utils/runjsSourceRuntimeCommon';
import {
  JS_ITEM_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_ITEM_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
} from './JSItemSourceModeField';

export { INLINE_SOURCE_MODE, LIGHT_EXTENSION_SOURCE_MODE };
export const JS_ITEM_OWNER_KIND = 'flowModel.itemSettings';

export type JSItemSourceMode = LightExtensionSourceMode;

type JSItemRunJSValue = RunJSValue;

type JSItemSourceModeParams = LightExtensionSourceModeParams;

type JSItemRuntimeError = RuntimeErrorInfo;

type RunJSExecutionResult = {
  success?: boolean;
  error?: unknown;
};

type RunJSRootEntry = {
  root?: {
    unmount?: () => void;
  };
  disposeTheme?: () => void;
  unmount?: () => void;
};

const jsItemRuntimeRunTracker = createRuntimeRunTracker();

type JSItemRuntimeModel = FlowModel & {
  uid: string;
  use?: string;
  getStepParams(flowKey: string, stepKey: string): unknown;
  getStepParams(flowKey: string): Record<string, unknown> | undefined;
  setStepParams(flowKey: string, stepParams: Record<string, unknown>): void;
  setStepParams(flowKey: string, stepKey: string, params?: unknown): void;
  invalidateFlowCache(flowKey: string, deep?: boolean): void;
  rerender(): Promise<unknown>;
};

type JSItemRuntimeContext = FlowRuntimeContext<JSItemRuntimeModel> & {
  defineProperty: (key: string, options: Record<string, unknown>) => void;
  defineMethod?: (key: string, method: (...args: unknown[]) => unknown) => void;
  ref?: React.RefObject<HTMLElement>;
  runjs: (code: string, globals?: Record<string, unknown>, options?: { version: string }) => Promise<unknown>;
};

type JSItemEventHandler = (...args: unknown[]) => unknown;

type JSItemRuntimeErrorState = {
  capture?: (error: unknown) => void;
  cleanups: Set<() => void>;
  disposed: boolean;
  handleError: (error: unknown) => void;
  reactEventHandlers: WeakMap<JSItemEventHandler, JSItemEventHandler>;
  domEventHandlers: WeakMap<EventListenerOrEventListenerObject, EventListenerOrEventListenerObject>;
  eventArgs: WeakMap<object, unknown>;
  scopeRoot?: Node | DocumentFragment | null;
};

type ReactCreateElementLike = (...args: unknown[]) => React.ReactElement | null;
type JSItemDomProtectionOptions = {
  protectAppendChild?: boolean;
};

const wrappedJSItemEventHandlers = new WeakSet<JSItemEventHandler>();
const protectedJSItemElementStates = new WeakMap<EventTarget, JSItemRuntimeErrorState>();
const jsItemRuntimeElementStates = new WeakMap<HTMLElement, JSItemRuntimeErrorState>();

export function normalizeJSItemSourceMode(value: unknown): JSItemSourceMode {
  return normalizeLightExtensionSourceMode(value);
}

export function getJSItemRunJsStepParams(model: JSItemRuntimeModel): Record<string, unknown> {
  const params = model.getStepParams('jsSettings', 'runJs');
  return isRecord(params) ? { ...params } : {};
}

export function getJSItemSourceSignature(model: JSItemRuntimeModel, inlineCode?: string): string {
  const runJs = getJSItemRunJsStepParams(model);
  const sourceMode = normalizeJSItemSourceMode(runJs.sourceMode);

  return stableSerialize({
    sourceMode,
    sourceBinding: runJs.sourceBinding,
    settings: runJs.settings,
    code: typeof inlineCode === 'string' ? inlineCode : runJs.code,
    version: runJs.version,
  });
}

export function getJSItemContextSignature(model: JSItemRuntimeModel): string {
  return stableSerializeWithCircular({
    record: getRecordProperty(model.context, 'record'),
    item: getRecordProperty(model.context, 'item'),
  });
}

export function hasRunnableJSItemSource(model: JSItemRuntimeModel, inlineCode?: string): boolean {
  const runJs = getJSItemRunJsStepParams(model);
  if (normalizeJSItemSourceMode(runJs.sourceMode) === LIGHT_EXTENSION_SOURCE_MODE) {
    return isRecord(runJs.sourceBinding);
  }
  const code = typeof inlineCode === 'string' ? inlineCode : runJs.code;
  return typeof code === 'string' && code.trim().length > 0;
}

export function beginJSItemRuntimeRun(model: JSItemRuntimeModel): number {
  return jsItemRuntimeRunTracker.begin(model);
}

export function isCurrentJSItemRuntimeRun(model: JSItemRuntimeModel, runId: number): boolean {
  return jsItemRuntimeRunTracker.isCurrent(model, runId);
}

export function createJSItemSourceModeStep(): StepDefinition {
  return createLightExtensionSourceModeStep({
    kind: 'js-item',
    component: JS_ITEM_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
    createMenuUIMode: createRunJSSourceCascadeMenuUIMode,
    hooks: {
      defaultParams: getJSItemSourceDefaultParams,
      beforeParamsSave: syncJSItemSourceToRunJs,
      afterParamsSave: refreshJSItemAfterSourceSave,
    },
  });
}

export function createJSItemSourceBindingStep(): StepDefinition {
  return createLightExtensionSourceBindingStep({
    kind: 'js-item',
    component: JS_ITEM_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
    hooks: {
      defaultParams: getJSItemSourceDefaultParams,
      beforeParamsSave: syncJSItemSourceToRunJs,
      afterParamsSave: refreshJSItemAfterSourceSave,
    },
  });
}

export function createJSItemRunJsUISchema(options: { scene: string; minHeight?: string } = { scene: 'block' }) {
  return createLightExtensionRunJsUISchema({
    kind: 'js-item',
    scene: options.scene,
    surfaceStyle: 'render',
    minHeight: options.minHeight,
  });
}

export async function getJSItemRunJsEditorTitle(ctx: { model: JSItemRuntimeModel }): Promise<string> {
  const translate = getModelTranslator(ctx.model);
  const params = getJSItemRunJsStepParams(ctx.model);
  const baseTitle = translate('Write JavaScript');
  if (normalizeJSItemSourceMode(params.sourceMode) !== LIGHT_EXTENSION_SOURCE_MODE) {
    return baseTitle;
  }

  const sourceTitle =
    getLightExtensionStoredBindingTitle(params.sourceBinding) ||
    (await resolveLightExtensionBindingTitle(ctx, params)) ||
    getLightExtensionFallbackBindingTitle(params.sourceBinding);
  return sourceTitle
    ? `${baseTitle} (${translate('Light extension')}: ${sourceTitle})`
    : `${baseTitle} (${translate('Light extension')})`;
}

export async function getJSItemRuntimeFlowSettingSteps(
  model: JSItemRuntimeModel,
): Promise<Record<string, StepDefinition> | undefined> {
  const params = getJSItemRunJsStepParams(model);
  const descriptor = await getLightExtensionSettingsDescriptor(model, params);
  if (!descriptor) {
    return undefined;
  }
  return createLightExtensionSettingSteps<JSItemRuntimeModel>({
    descriptor,
    settings: isRecord(params.settings) ? params.settings : {},
    component: JS_ITEM_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
    syncValue: syncLightExtensionSettingToRunJs,
    afterParamsSave: refreshJSItemAfterSettingsSave,
  });
}

export async function resolveJSItemRuntimeRunJS(input: {
  model: JSItemRuntimeModel;
  params: Record<string, unknown>;
  runJs: JSItemRunJSValue;
}): Promise<ResolvedRuntimeRunJS> {
  const { model, params, runJs } = input;
  const runtimeSettings = getJSItemRuntimeSettings(params);
  return resolveRuntimeRunJS({
    runJs,
    sourceMode: params.sourceMode as string | undefined,
    sourceBinding: isRecord(params.sourceBinding) ? (params.sourceBinding as RunJSSourceBinding) : undefined,
    settings: runtimeSettings,
    context: {
      modelUid: model.uid,
      ownerKind: JS_ITEM_OWNER_KIND,
      ownerLocator: buildJSItemOwnerLocator(model),
    },
  });
}

export async function runResolvedJSItemCode(input: {
  ctx: JSItemRuntimeContext;
  resolved: ResolvedRuntimeRunJS;
  element?: HTMLElement;
  runtimeErrorTestId?: string;
}): Promise<void> {
  const { ctx, resolved, element, runtimeErrorTestId = 'js-item-runtime-error' } = input;
  ctx.defineProperty('settings', {
    value: resolved.settings,
  });
  ctx.defineProperty('runJsSource', {
    value: {
      sourceMode: resolved.sourceMode,
      sourceBinding: resolved.sourceBinding,
      sourceMap: resolved.sourceMap,
      context: resolved.context,
    },
  });
  ctx.defineProperty('item', {
    get: () => getRecordProperty(ctx.model.context, 'item'),
    cache: false,
  });
  ctx.defineProperty('record', {
    get: () => getRecordProperty(ctx.model.context, 'record'),
    cache: false,
  });
  const elementTarget = (ctx.ref?.current as HTMLElement | null) || element;
  const errorState = createJSItemRuntimeErrorState(elementTarget);
  if (elementTarget) {
    jsItemRuntimeElementStates.set(elementTarget, errorState);
  }
  errorState.capture = (error: unknown) => {
    renderJSItemRuntimeError(elementTarget, error, runtimeErrorTestId);
  };
  ctx.defineMethod?.('wrapRunJSReact', (react: unknown) =>
    isReactNamespace(react) ? wrapJSItemRuntimeReact(react, errorState) : react,
  );
  ctx.defineMethod?.('wrapRunJSVNode', (vnode: unknown) =>
    wrapJSItemRuntimeVNode({
      vnode,
      testId: runtimeErrorTestId,
      errorState,
    }),
  );
  ctx.defineProperty('element', {
    get: () => createProtectedJSItemElementProxy(elementTarget, errorState),
    cache: false,
  });

  const queryRoot = elementTarget || globalThis.document.createDocumentFragment();
  const browserGlobals = createJSItemRuntimeBrowserGlobals(queryRoot, errorState);
  const result = (await ctx.runjs(resolved.code, browserGlobals, {
    version: resolved.version,
  })) as RunJSExecutionResult;

  if (result?.success === false) {
    throw result.error || new Error('RunJS execution failed');
  }

  if (element && !globalThis.document.body.contains(element) && element.isConnected === false) {
    resetJSItemRuntimeElement(element);
  }
}

export async function runJSItemRuntime(input: {
  ctx: JSItemRuntimeContext;
  params: Record<string, unknown>;
  runJs: JSItemRunJSValue;
  element: HTMLElement;
  runtimeErrorTestId?: string;
}): Promise<void> {
  const { ctx, params, runJs, element, runtimeErrorTestId = 'js-item-runtime-error' } = input;
  const runId = beginJSItemRuntimeRun(ctx.model);
  try {
    resetJSItemRuntimeElement(element);
    const resolved = await resolveJSItemRuntimeRunJS({
      model: ctx.model,
      params,
      runJs,
    });
    if (!isCurrentJSItemRuntimeRun(ctx.model, runId)) {
      return;
    }
    await runResolvedJSItemCode({
      ctx,
      resolved,
      element,
      runtimeErrorTestId,
    });
  } catch (error) {
    if (!isCurrentJSItemRuntimeRun(ctx.model, runId)) {
      return;
    }
    renderJSItemRuntimeError(element, error, runtimeErrorTestId);
  }
}

export function renderJSItemRuntimeError(element: HTMLElement, error: unknown, testId: string): void {
  resetJSItemRuntimeElement(element);
  element.appendChild(createJSItemRuntimeErrorDom(error, testId));
}

export function resetJSItemRuntimeElement(element: HTMLElement): void {
  disposeJSItemRuntimeElementState(element);
  const globalWithRunJsRoots = globalThis as typeof globalThis & {
    __nbRunjsRoots?: WeakMap<object, RunJSRootEntry>;
  };
  const rootMap = globalWithRunJsRoots.__nbRunjsRoots;
  const existingEntry = rootMap?.get(element);
  if (existingEntry) {
    disposeRunJSRootEntry(existingEntry);
    rootMap?.delete(element);
  }
  if (element.isConnected || element.ownerDocument?.contains(element)) {
    element.innerHTML = '';
  }
}

export function buildJSItemOwnerLocator(model: JSItemRuntimeModel): Record<string, unknown> {
  return {
    kind: JS_ITEM_OWNER_KIND,
    modelUid: model.uid,
    use: getRunJSModelUse(model),
  };
}

function getJSItemSourceDefaultParams(ctx: FlowSettingsContext<JSItemRuntimeModel>): JSItemSourceModeParams {
  const runJs = getJSItemRunJsStepParams(ctx.model);
  return {
    sourceMode: normalizeJSItemSourceMode(runJs.sourceMode),
    sourceBinding: isRecord(runJs.sourceBinding) ? cloneJsonValue(runJs.sourceBinding) : undefined,
    settings: isRecord(runJs.settings) ? cloneJsonValue(runJs.settings) : {},
  };
}

async function syncJSItemSourceToRunJs(ctx: FlowSettingsContext<JSItemRuntimeModel>, params: JSItemSourceModeParams) {
  const sourceMode = normalizeJSItemSourceMode(params?.sourceMode);
  const sourceBinding = isRecord(params.sourceBinding) ? cloneJsonValue(params.sourceBinding) : undefined;
  if (sourceMode === LIGHT_EXTENSION_SOURCE_MODE && !sourceBinding) {
    ctx.model.context?.message?.error?.(ctx.model.context.t('Select a light extension entry'));
    throw new FlowCancelSaveException('Light extension source binding is required.');
  }
  const currentRunJs = getJSItemRunJsStepParams(ctx.model);
  const descriptor =
    sourceMode === LIGHT_EXTENSION_SOURCE_MODE
      ? await getLightExtensionSettingsDescriptor(ctx.model, { ...params, sourceMode, sourceBinding })
      : null;
  const normalized = normalizeLightExtensionSourceSettingsForBinding({
    currentRunJs,
    nextSourceMode: sourceMode,
    nextSourceBinding: sourceBinding,
    nextSettings: params.settings,
    descriptor,
  });
  setCanonicalLightExtensionSource(ctx.model, 'jsSettings', {
    sourceMode,
    sourceBinding,
    settings: normalized.settings,
  });
  rememberLightExtensionBindingSettings(ctx.model, descriptor, normalized.missingRequiredPaths);
}

async function refreshJSItemAfterSettingsSave(ctx: FlowSettingsContext<JSItemRuntimeModel>) {
  ctx.model.invalidateFlowCache('jsSettings', true);
  await ctx.model.rerender();
}

async function refreshJSItemAfterSourceSave(ctx: FlowSettingsContext<JSItemRuntimeModel>) {
  await refreshJSItemAfterSettingsSave(ctx);
  await showPendingLightExtensionRequiredSettings(ctx.model, 'jsSettings');
}

async function getLightExtensionSettingsDescriptor(model: JSItemRuntimeModel, params: Record<string, unknown>) {
  return getSharedLightExtensionSettingsDescriptor({
    modelUid: model.uid,
    ownerKind: JS_ITEM_OWNER_KIND,
    ownerLocator: buildJSItemOwnerLocator(model),
    params,
  });
}

function syncLightExtensionSettingToRunJs(
  ctx: FlowSettingsContext<JSItemRuntimeModel>,
  fieldName: string,
  value: unknown,
) {
  setCanonicalLightExtensionSetting(ctx.model, 'jsSettings', fieldName, value);
}

function getJSItemRuntimeSettings(params: Record<string, unknown>): RunJSSourceSettings {
  return cloneRecord(params.settings);
}

async function resolveLightExtensionBindingTitle(ctx: { model: JSItemRuntimeModel }, params: Record<string, unknown>) {
  return resolveSharedLightExtensionBindingTitle({
    modelUid: ctx.model.uid,
    ownerKind: JS_ITEM_OWNER_KIND,
    ownerLocator: buildJSItemOwnerLocator(ctx.model),
    params,
  });
}

function normalizeRuntimeError(error: unknown): JSItemRuntimeError {
  return normalizeLightExtensionRuntimeError(error, {
    defaultTitle: 'JavaScript item runtime error',
    defaultHint: 'Check the JavaScript item configuration and retry.',
    defaultMessage: 'Failed to run JavaScript item',
    outdatedHint: 'Refresh the item settings and choose the current entry.',
    invalidSettingsHint: 'Open the item settings and fix the light extension settings.',
  });
}

function disposeRunJSRootEntry(entry: RunJSRootEntry): void {
  if (typeof entry.disposeTheme === 'function') {
    try {
      entry.disposeTheme();
    } catch {
      // ignore cleanup failures
    }
  }
  const root = entry.root || entry;
  if (typeof root.unmount === 'function') {
    try {
      root.unmount();
    } catch {
      // ignore cleanup failures
    }
  }
}

function createJSItemRuntimeErrorDom(error: unknown, testId: string): HTMLElement {
  const normalized = normalizeRuntimeError(error);
  const errorElement = document.createElement('span');
  errorElement.setAttribute('role', 'alert');
  errorElement.setAttribute('data-testid', testId);
  errorElement.style.color = '#ff4d4f';
  errorElement.style.display = 'inline-block';
  errorElement.style.maxWidth = '100%';
  errorElement.style.whiteSpace = 'normal';
  errorElement.textContent = [normalized.title, normalized.message, normalized.code].filter(Boolean).join(' | ');
  return errorElement;
}

function createJSItemRuntimeErrorNode(error: unknown, testId: string): React.ReactElement {
  const normalized = normalizeRuntimeError(error);
  return React.createElement(
    'span',
    {
      role: 'alert',
      'data-testid': testId,
      style: {
        color: '#ff4d4f',
        display: 'inline-block',
        maxWidth: '100%',
        whiteSpace: 'normal',
      },
    },
    [normalized.title, normalized.message, normalized.code].filter(Boolean).join(' | '),
  );
}

function wrapJSItemRuntimeVNode(input: {
  vnode: unknown;
  testId: string;
  errorState: JSItemRuntimeErrorState;
}): unknown {
  const { vnode, testId, errorState } = input;
  if (!React.isValidElement(vnode)) {
    return vnode;
  }

  const wrappedVNode = wrapJSItemEventHandlers(vnode, errorState);

  class JSItemRuntimeBoundary extends React.Component<{ children?: React.ReactNode }, { error?: unknown }> {
    state: { error?: unknown } = {};

    static getDerivedStateFromError(error: unknown) {
      return { error };
    }

    capture(error: unknown) {
      this.setState({ error });
    }

    componentDidCatch(error: unknown) {
      errorState.handleError(error);
    }

    render() {
      if (this.state.error) {
        return createJSItemRuntimeErrorNode(this.state.error, testId);
      }
      return this.props.children;
    }
  }

  const boundaryRef = React.createRef<JSItemRuntimeBoundary>();
  errorState.capture = (error: unknown) => {
    boundaryRef.current?.capture(error);
  };

  return React.createElement(JSItemRuntimeBoundary, { ref: boundaryRef }, wrappedVNode);
}

function createJSItemRuntimeErrorState(scopeRoot?: Node | DocumentFragment | null): JSItemRuntimeErrorState {
  const errorState: JSItemRuntimeErrorState = {
    cleanups: new Set<() => void>(),
    disposed: false,
    reactEventHandlers: new WeakMap<JSItemEventHandler, JSItemEventHandler>(),
    domEventHandlers: new WeakMap<EventListenerOrEventListenerObject, EventListenerOrEventListenerObject>(),
    eventArgs: new WeakMap<object, unknown>(),
    scopeRoot,
    handleError(error: unknown) {
      errorState.capture?.(error);
    },
  };
  return errorState;
}

function disposeJSItemRuntimeElementState(element: HTMLElement): void {
  const state = jsItemRuntimeElementStates.get(element);
  if (!state) {
    return;
  }
  jsItemRuntimeElementStates.delete(element);
  disposeJSItemRuntimeErrorState(state);
}

function disposeJSItemRuntimeErrorState(state: JSItemRuntimeErrorState): void {
  if (state.disposed) {
    return;
  }
  state.disposed = true;
  for (const cleanup of Array.from(state.cleanups).reverse()) {
    try {
      cleanup();
    } catch {
      // Ignore cleanup failures; stale JS Item effects must not break host rendering.
    }
  }
  state.cleanups.clear();
}

function registerJSItemRuntimeCleanup(state: JSItemRuntimeErrorState, cleanup: () => void): () => void {
  let active = true;
  const wrapped = () => {
    if (!active) {
      return;
    }
    active = false;
    state.cleanups.delete(wrapped);
    cleanup();
  };
  state.cleanups.add(wrapped);
  return wrapped;
}

function createProtectedJSItemElementProxy(element: HTMLElement, errorState: JSItemRuntimeErrorState): ElementProxy {
  const elementProxy = new ElementProxy(element);
  return new Proxy(elementProxy, {
    get(target, prop, receiver) {
      if (prop === 'addEventListener') {
        return (
          type: string,
          listener: EventListenerOrEventListenerObject | null,
          options?: AddEventListenerOptions | boolean,
        ) => {
          const wrapped = wrapJSItemDomEventListener(listener, errorState);
          element.addEventListener(type, wrapped, options);
          if (wrapped) {
            registerJSItemRuntimeCleanup(errorState, () => element.removeEventListener(type, wrapped, options));
          }
        };
      }
      if (prop === 'removeEventListener') {
        return (
          type: string,
          listener: EventListenerOrEventListenerObject | null,
          options?: EventListenerOptions | boolean,
        ) => {
          const wrapped = listener ? errorState.domEventHandlers.get(listener) : undefined;
          element.removeEventListener(type, wrapped || listener, options);
        };
      }
      if (prop === 'appendChild') {
        return (child: Node | string) => {
          const nextChild =
            typeof child === 'string'
              ? globalThis.document.createTextNode(child)
              : child instanceof EventTarget
                ? protectJSItemDomEventTarget(child, errorState)
                : child;
          return element.appendChild(nextChild as Node);
        };
      }
      if (prop === '__el') {
        return element;
      }
      if (prop === 'ownerDocument') {
        return createJSItemScopedDocument(element, errorState);
      }
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === 'function') {
        return (...args: unknown[]) => protectJSItemDomValue(value(...args), element, errorState);
      }
      return protectJSItemDomValue(value, element, errorState);
    },
  });
}

function protectJSItemDomEventTarget<T extends EventTarget>(
  target: T,
  errorState: JSItemRuntimeErrorState,
  options: JSItemDomProtectionOptions = {},
): T {
  const { protectAppendChild = true } = options;
  protectedJSItemElementStates.set(target, errorState);
  if (targetHasOwnJSItemProtection(target)) {
    return target;
  }

  const originalAddEventListener = target.addEventListener.bind(target);
  const originalRemoveEventListener = target.removeEventListener.bind(target);
  Object.defineProperty(target, 'addEventListener', {
    configurable: true,
    value(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: AddEventListenerOptions | boolean,
    ) {
      const currentState = protectedJSItemElementStates.get(target) || errorState;
      const wrapped = wrapJSItemDomEventListener(listener, currentState);
      originalAddEventListener(type, wrapped, options);
      if (wrapped) {
        registerJSItemRuntimeCleanup(currentState, () => originalRemoveEventListener(type, wrapped, options));
      }
    },
  });
  Object.defineProperty(target, 'removeEventListener', {
    configurable: true,
    value(type: string, listener: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean) {
      const currentState = protectedJSItemElementStates.get(target) || errorState;
      const wrapped = listener ? currentState.domEventHandlers.get(listener) : undefined;
      originalRemoveEventListener(type, wrapped || listener, options);
    },
  });

  if (protectAppendChild && isNodeWithAppendChild(target)) {
    const originalAppendChild = target.appendChild.bind(target);
    Object.defineProperty(target, 'appendChild', {
      configurable: true,
      value(child: Node | string) {
        const currentState = protectedJSItemElementStates.get(target) || errorState;
        const nextChild =
          typeof child === 'string'
            ? globalThis.document.createTextNode(child)
            : child instanceof EventTarget
              ? protectJSItemDomEventTarget(child, currentState)
              : child;
        return originalAppendChild(nextChild as Node);
      },
    });
  }

  protectJSItemDomQuerySurface(target, errorState);
  if (target !== (errorState.scopeRoot as EventTarget | null | undefined)) {
    defineProtectedJSItemOwnerDocumentGetter(target, errorState);
  }
  defineProtectedJSItemDomGetter(target, 'parentNode', errorState);
  defineProtectedJSItemDomGetter(target, 'parentElement', errorState);
  defineProtectedJSItemDomGetter(target, 'offsetParent', errorState);

  Object.defineProperty(target, '__nbJSItemRuntimeProtected', {
    configurable: true,
    value: true,
  });
  return target;
}

function protectJSItemDomQuerySurface(target: EventTarget, errorState: JSItemRuntimeErrorState): void {
  if (!isJSItemQueryableNode(target)) {
    return;
  }

  const originalQuerySelector = target.querySelector.bind(target);
  Object.defineProperty(target, 'querySelector', {
    configurable: true,
    value(selectors: string) {
      const currentState = protectedJSItemElementStates.get(target) || errorState;
      return protectJSItemDomValue(originalQuerySelector(selectors), target, currentState);
    },
  });

  const originalQuerySelectorAll = target.querySelectorAll.bind(target);
  Object.defineProperty(target, 'querySelectorAll', {
    configurable: true,
    value(selectors: string) {
      const currentState = protectedJSItemElementStates.get(target) || errorState;
      return protectJSItemDomCollection(originalQuerySelectorAll(selectors), target, currentState);
    },
  });
  if (typeof (target as { closest?: unknown }).closest === 'function') {
    const originalClosest = (target as Element).closest.bind(target as Element);
    Object.defineProperty(target, 'closest', {
      configurable: true,
      value(selectors: string) {
        const currentState = protectedJSItemElementStates.get(target) || errorState;
        return protectJSItemDomValue(originalClosest(selectors), currentState.scopeRoot, currentState);
      },
    });
  }

  defineProtectedJSItemDomGetter(target, 'children', errorState);
  defineProtectedJSItemDomGetter(target, 'childNodes', errorState);
  defineProtectedJSItemDomGetter(target, 'firstChild', errorState);
  defineProtectedJSItemDomGetter(target, 'firstElementChild', errorState);
  defineProtectedJSItemDomGetter(target, 'lastChild', errorState);
  defineProtectedJSItemDomGetter(target, 'lastElementChild', errorState);
}

function createJSItemScopedDocument(
  root: Node | DocumentFragment | null | undefined,
  errorState: JSItemRuntimeErrorState,
): Document {
  return createJSItemRuntimeBrowserGlobals(root, errorState).document;
}

function createJSItemScopedDocumentFacade(
  root: Node | DocumentFragment | null | undefined,
  errorState: JSItemRuntimeErrorState,
  defaultView: Window,
): Document {
  const rootCandidate = root || errorState.scopeRoot || globalThis.document.createDocumentFragment();
  const queryRoot = isJSItemQueryableNode(rootCandidate) ? rootCandidate : globalThis.document.createDocumentFragment();
  const allowedProperties: Record<string, unknown> = {
    defaultView,
    createElement: (tagName: string, options?: ElementCreationOptions) =>
      protectJSItemDomEventTarget(globalThis.document.createElement(tagName, options), errorState),
    querySelector: (selectors: string) =>
      protectJSItemDomValue(queryRoot.querySelector(selectors), queryRoot, errorState),
    querySelectorAll: (selectors: string) =>
      protectJSItemDomCollection(queryRoot.querySelectorAll(selectors), queryRoot, errorState),
  };
  const localProperties: Record<string, unknown> = Object.create(null);
  return new Proxy(localProperties, {
    get(target, prop) {
      if (typeof prop !== 'string') {
        return Reflect.get(target, prop);
      }
      if (Object.prototype.hasOwnProperty.call(allowedProperties, prop)) {
        return allowedProperties[prop];
      }
      if (Object.prototype.hasOwnProperty.call(target, prop)) {
        return target[prop];
      }
      throw new Error(`Access to document property "${prop}" is not allowed in a JS Item runtime`);
    },
    set(target, prop, value) {
      if (typeof prop !== 'string') {
        return Reflect.set(target, prop, value);
      }
      if (Object.prototype.hasOwnProperty.call(allowedProperties, prop)) {
        throw new Error(`Mutation of document property "${prop}" is not allowed in a JS Item runtime`);
      }
      target[prop] = value;
      return true;
    },
    has(target, prop) {
      return (
        (typeof prop === 'string' && Object.prototype.hasOwnProperty.call(allowedProperties, prop)) ||
        Reflect.has(target, prop)
      );
    },
  }) as unknown as Document;
}

function defineProtectedJSItemOwnerDocumentGetter(target: EventTarget, errorState: JSItemRuntimeErrorState): void {
  const descriptor = findPropertyDescriptor(target, 'ownerDocument');
  if (!descriptor?.get) {
    return;
  }

  Object.defineProperty(target, 'ownerDocument', {
    configurable: true,
    get() {
      const currentState = protectedJSItemElementStates.get(target) || errorState;
      return createJSItemScopedDocument(currentState.scopeRoot, currentState);
    },
  });
}

function createJSItemRuntimeBrowserGlobals(
  root: Node | DocumentFragment | null | undefined,
  errorState: JSItemRuntimeErrorState,
): Record<string, unknown> & { document: Document; navigator: Navigator; window: Window } {
  const scopedDocumentHolder: { current?: Document } = {};
  const runtimeWindow = createJSItemRuntimeWindow(globalThis.navigator, errorState, () => {
    if (!scopedDocumentHolder.current) {
      throw new Error('JS Item scoped document is not initialized');
    }
    return scopedDocumentHolder.current;
  });
  const scopedDocument = createJSItemScopedDocumentFacade(root, errorState, runtimeWindow);
  scopedDocumentHolder.current = scopedDocument;
  return {
    window: runtimeWindow,
    document: scopedDocument,
    navigator: globalThis.navigator,
    setTimeout: runtimeWindow.setTimeout,
    clearTimeout: runtimeWindow.clearTimeout,
    setInterval: runtimeWindow.setInterval,
    clearInterval: runtimeWindow.clearInterval,
  };
}

function createJSItemRuntimeWindow(
  navigator: Navigator,
  errorState: JSItemRuntimeErrorState,
  getDocument: () => Document,
): Window {
  const timeoutCleanups = new Map<unknown, () => void>();
  const intervalCleanups = new Map<unknown, () => void>();
  const overrides: Record<string, unknown> = {
    navigator,
    ...createJSItemSafeWindowDomTypes(),
    setTimeout(handler: TimerHandler, timeout?: number, ...args: unknown[]) {
      const wrappedHandler =
        typeof handler === 'function'
          ? (...callbackArgs: unknown[]) => {
              timeoutCleanups.delete(timerId);
              try {
                return handler(...callbackArgs);
              } catch (error) {
                errorState.handleError(error);
                return undefined;
              }
            }
          : handler;
      const timerId = globalThis.setTimeout(wrappedHandler as TimerHandler, timeout, ...args);
      const cleanup = registerJSItemRuntimeCleanup(errorState, () => {
        timeoutCleanups.delete(timerId);
        globalThis.clearTimeout(timerId);
      });
      timeoutCleanups.set(timerId, cleanup);
      return timerId;
    },
    clearTimeout(timerId: ReturnType<typeof globalThis.setTimeout>) {
      const cleanup = timeoutCleanups.get(timerId);
      if (cleanup) {
        cleanup();
        return;
      }
      globalThis.clearTimeout(timerId);
    },
    setInterval(handler: TimerHandler, timeout?: number, ...args: unknown[]) {
      const intervalId = globalThis.setInterval(
        typeof handler === 'function'
          ? (...callbackArgs: unknown[]) => {
              try {
                return handler(...callbackArgs);
              } catch (error) {
                errorState.handleError(error);
                return undefined;
              }
            }
          : handler,
        timeout,
        ...args,
      );
      const cleanup = registerJSItemRuntimeCleanup(errorState, () => {
        intervalCleanups.delete(intervalId);
        globalThis.clearInterval(intervalId);
      });
      intervalCleanups.set(intervalId, cleanup);
      return intervalId;
    },
    clearInterval(intervalId: ReturnType<typeof globalThis.setInterval>) {
      const cleanup = intervalCleanups.get(intervalId);
      if (cleanup) {
        cleanup();
        return;
      }
      globalThis.clearInterval(intervalId);
    },
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: AddEventListenerOptions | boolean,
    ) {
      const wrapped = wrapJSItemDomEventListener(listener, errorState);
      globalThis.addEventListener(type, wrapped, options);
      if (wrapped) {
        registerJSItemRuntimeCleanup(errorState, () => globalThis.removeEventListener(type, wrapped, options));
      }
    },
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: EventListenerOptions | boolean,
    ) {
      const wrapped = listener ? errorState.domEventHandlers.get(listener) : undefined;
      globalThis.removeEventListener(type, wrapped || listener, options);
    },
  };
  const runtimeWindowTarget: Record<PropertyKey, unknown> = Object.create(null);
  const runtimeWindow = new Proxy(runtimeWindowTarget, {
    get(_target, prop) {
      if (prop === 'window' || prop === 'self' || prop === 'globalThis') {
        return runtimeWindow;
      }
      if (prop === 'document') {
        return getDocument();
      }
      if (typeof prop === 'string' && Object.prototype.hasOwnProperty.call(overrides, prop)) {
        return overrides[prop];
      }
      const value = Reflect.get(globalThis.window, prop, globalThis.window);
      return typeof value === 'function' ? value.bind(globalThis.window) : value;
    },
    set(_target, prop, value) {
      if (
        prop === 'window' ||
        prop === 'self' ||
        prop === 'globalThis' ||
        prop === 'document' ||
        (typeof prop === 'string' && Object.prototype.hasOwnProperty.call(overrides, prop))
      ) {
        throw new Error(`Mutation of window property "${String(prop)}" is not allowed in a JS Item runtime`);
      }
      return Reflect.set(globalThis.window, prop, value, globalThis.window);
    },
    has(_target, prop) {
      return (
        prop === 'window' ||
        prop === 'self' ||
        prop === 'globalThis' ||
        prop === 'document' ||
        (typeof prop === 'string' && Object.prototype.hasOwnProperty.call(overrides, prop)) ||
        Reflect.has(globalThis.window, prop)
      );
    },
  }) as unknown as Window;
  return runtimeWindow;
}

function createJSItemSafeWindowDomTypes(): Record<string, unknown> {
  return {
    Event: globalThis.Event,
    CustomEvent: globalThis.CustomEvent,
    Element: globalThis.Element,
    HTMLElement: globalThis.HTMLElement,
    KeyboardEvent: globalThis.KeyboardEvent,
    MouseEvent: globalThis.MouseEvent,
    Node: globalThis.Node,
    SVGElement: globalThis.SVGElement,
  };
}

function defineProtectedJSItemDomGetter(target: EventTarget, prop: string, errorState: JSItemRuntimeErrorState): void {
  const descriptor = findPropertyDescriptor(target, prop);
  if (!descriptor?.get) {
    return;
  }

  Object.defineProperty(target, prop, {
    configurable: true,
    get() {
      const currentState = protectedJSItemElementStates.get(target) || errorState;
      return protectJSItemDomValue(
        descriptor.get?.call(target),
        currentState.scopeRoot || (target as Node),
        currentState,
      );
    },
  });
}

function findPropertyDescriptor(target: EventTarget, prop: string): PropertyDescriptor | undefined {
  let current: object | null = target;
  while (current) {
    const descriptor = Object.getOwnPropertyDescriptor(current, prop);
    if (descriptor) {
      return descriptor;
    }
    current = Object.getPrototypeOf(current);
  }
  return undefined;
}

function protectJSItemDomValue(
  value: unknown,
  root: Node | DocumentFragment | null | undefined,
  errorState: JSItemRuntimeErrorState,
): unknown {
  if (isJSItemDomCollection(value)) {
    return protectJSItemDomCollection(value, root, errorState);
  }
  if (!isNodeInsideJSItemRoot(value, root)) {
    return value instanceof Node ? null : value;
  }
  return value instanceof EventTarget ? protectJSItemDomEventTarget(value, errorState) : value;
}

function protectJSItemDomCollection<T extends ArrayLike<unknown>>(
  collection: T,
  root: Node | DocumentFragment | null | undefined,
  errorState: JSItemRuntimeErrorState,
): T {
  const protectItem = (item: unknown) => protectJSItemDomValue(item, root, errorState);
  const protectedCollection = new Proxy(collection as object, {
    get(target, prop) {
      if (prop === Symbol.iterator || prop === 'values') {
        return function* () {
          for (const item of Array.from(collection)) {
            yield protectItem(item);
          }
        };
      }
      if (prop === 'entries') {
        return function* () {
          let index = 0;
          for (const item of Array.from(collection)) {
            yield [index, protectItem(item)];
            index += 1;
          }
        };
      }
      if (prop === 'keys') {
        return function* () {
          for (let index = 0; index < collection.length; index += 1) {
            yield index;
          }
        };
      }
      if (typeof prop === 'string' && isJSItemArrayIndex(prop)) {
        return protectItem((target as Record<string, unknown>)[prop]);
      }

      const value = Reflect.get(target, prop);
      if (typeof value !== 'function') {
        return value;
      }
      if (prop === 'item' || prop === 'namedItem') {
        return (...args: unknown[]) => protectItem(value.apply(target, args));
      }
      if (prop === 'at') {
        return (...args: unknown[]) => protectItem(value.apply(target, args));
      }
      if (prop === 'forEach') {
        return (callback: (item: unknown, index: number, collection: T) => void, thisArg?: unknown) => {
          Array.from(collection).forEach((item, index) => {
            callback.call(thisArg, protectItem(item), index, protectedCollection);
          });
        };
      }
      return (...args: unknown[]) => protectJSItemDomValue(value.apply(target, args), root, errorState);
    },
  }) as T;
  return protectedCollection;
}

function isJSItemArrayIndex(prop: string): boolean {
  if (!/^(0|[1-9]\d*)$/.test(prop)) {
    return false;
  }
  const index = Number(prop);
  return Number.isSafeInteger(index);
}

function wrapJSItemRuntimeReact(react: typeof React, errorState: JSItemRuntimeErrorState): typeof React {
  const createElement: ReactCreateElementLike = (...args: unknown[]) => {
    const [type, props, ...children] = args;
    return react.createElement(
      type as React.ElementType,
      wrapJSItemRuntimeReactProps(props, errorState) as Record<string, unknown> | null,
      ...(children as React.ReactNode[]),
    );
  };

  return new Proxy(react, {
    get(target, prop, receiver) {
      if (prop === 'createElement') {
        return createElement;
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

function wrapJSItemRuntimeReactProps(props: unknown, errorState: JSItemRuntimeErrorState): unknown {
  if (!isRecord(props)) {
    return props;
  }

  let changed = false;
  const nextProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (isReactEventHandlerName(key) && typeof value === 'function') {
      nextProps[key] = wrapJSItemEventHandler(value as JSItemEventHandler, errorState, errorState.reactEventHandlers);
      changed = true;
      continue;
    }
    nextProps[key] = value;
  }

  return changed ? nextProps : props;
}

function wrapJSItemDomEventListener(
  listener: EventListenerOrEventListenerObject | null,
  errorState: JSItemRuntimeErrorState,
): EventListenerOrEventListenerObject | null {
  if (!listener) {
    return listener;
  }
  const cached = errorState.domEventHandlers.get(listener);
  if (cached) {
    return cached;
  }

  const wrapped =
    typeof listener === 'function'
      ? function (this: EventTarget, event: Event) {
          try {
            return listener.call(
              protectJSItemDomValue(this, errorState.scopeRoot, errorState) as EventTarget,
              protectJSItemRuntimeEventArg(event, errorState) as Event,
            );
          } catch (error) {
            errorState.handleError(error);
            return undefined;
          }
        }
      : {
          handleEvent(event: Event) {
            try {
              return listener.handleEvent(protectJSItemRuntimeEventArg(event, errorState) as Event);
            } catch (error) {
              errorState.handleError(error);
              return undefined;
            }
          },
        };
  errorState.domEventHandlers.set(listener, wrapped);
  return wrapped;
}

function protectJSItemRuntimeEventArg(value: unknown, errorState: JSItemRuntimeErrorState): unknown {
  if (!isRecord(value)) {
    return value;
  }
  if (!isJSItemEventLike(value)) {
    return value;
  }

  const cached = errorState.eventArgs.get(value);
  if (cached) {
    return cached;
  }

  const protectedEvent = new Proxy(value, {
    get(target, prop, receiver) {
      if (prop === 'target' || prop === 'currentTarget' || prop === 'srcElement') {
        return protectJSItemDomValue(Reflect.get(target, prop, receiver), errorState.scopeRoot, errorState);
      }
      if (prop === 'nativeEvent') {
        return protectJSItemRuntimeEventValue(Reflect.get(target, prop, receiver), errorState);
      }
      const property = Reflect.get(target, prop, receiver);
      if (typeof property === 'function') {
        return (...args: unknown[]) => protectJSItemRuntimeEventValue(property.apply(target, args), errorState);
      }
      return protectJSItemRuntimeEventValue(property, errorState);
    },
  });
  errorState.eventArgs.set(value, protectedEvent);
  return protectedEvent;
}

function protectJSItemRuntimeEventValue(value: unknown, errorState: JSItemRuntimeErrorState): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => protectJSItemRuntimeEventValue(item, errorState));
  }
  if (isJSItemWindowLike(value)) {
    return createJSItemRuntimeBrowserGlobals(errorState.scopeRoot, errorState).window;
  }
  if (value instanceof Document) {
    return createJSItemScopedDocument(errorState.scopeRoot, errorState);
  }
  if (value instanceof Event) {
    return protectJSItemRuntimeEventArg(value, errorState);
  }
  if (value instanceof Node || isJSItemDomCollection(value)) {
    return protectJSItemDomValue(value, errorState.scopeRoot, errorState);
  }
  return value;
}

function targetHasOwnJSItemProtection(target: EventTarget): boolean {
  return Boolean((target as { __nbJSItemRuntimeProtected?: boolean }).__nbJSItemRuntimeProtected);
}

function isNodeWithAppendChild(target: EventTarget): target is EventTarget & { appendChild: (child: Node) => Node } {
  return typeof (target as { appendChild?: unknown }).appendChild === 'function';
}

function isJSItemQueryableNode(
  target: EventTarget,
): target is EventTarget & ParentNode & { querySelector: ParentNode['querySelector'] } {
  return (
    typeof (target as { querySelector?: unknown }).querySelector === 'function' &&
    typeof (target as { querySelectorAll?: unknown }).querySelectorAll === 'function'
  );
}

function isJSItemDomCollection(value: unknown): value is ArrayLike<unknown> {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as { length?: unknown }).length === 'number' &&
    (Object.prototype.toString.call(value) === '[object NodeList]' ||
      Object.prototype.toString.call(value) === '[object HTMLCollection]')
  );
}

function isJSItemWindowLike(value: unknown): value is Window {
  return (
    Boolean(value) && typeof value === 'object' && (value === globalThis.window || (value as Window).window === value)
  );
}

function isNodeInsideJSItemRoot(value: unknown, root: Node | DocumentFragment | null | undefined): value is Node {
  if (!(value instanceof Node) || !root) {
    return false;
  }
  if (value === root) {
    return true;
  }
  return typeof root.contains === 'function' ? root.contains(value) : false;
}

function wrapJSItemEventHandlers(element: React.ReactElement, errorState: JSItemRuntimeErrorState): React.ReactElement {
  const props = element.props as Record<string, unknown>;
  let changed = false;
  const nextProps: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    if (isReactEventHandlerName(key) && typeof value === 'function') {
      nextProps[key] = wrapJSItemEventHandler(value as JSItemEventHandler, errorState);
      changed = true;
      continue;
    }
    nextProps[key] = value;
  }

  const children = props.children;
  const nextChildren = React.Children.map(children as React.ReactNode, (child) => {
    if (React.isValidElement(child)) {
      changed = true;
      return wrapJSItemEventHandlers(child, errorState);
    }
    return child;
  });

  if (!changed) {
    return element;
  }

  return React.cloneElement(element, nextProps, nextChildren);
}

function wrapJSItemEventHandler(
  handler: JSItemEventHandler,
  errorState: JSItemRuntimeErrorState,
  cache?: WeakMap<JSItemEventHandler, JSItemEventHandler>,
): JSItemEventHandler {
  if (wrappedJSItemEventHandlers.has(handler)) {
    return handler;
  }
  const cached = cache?.get(handler);
  if (cached) {
    return cached;
  }
  const wrappedHandler: JSItemEventHandler = (...args: unknown[]) => {
    try {
      const result = handler(...args.map((arg) => protectJSItemRuntimeEventArg(arg, errorState)));
      if (isPromiseLike(result)) {
        return result.catch((error) => {
          errorState.handleError(error);
          return undefined;
        });
      }
      return result;
    } catch (error) {
      errorState.handleError(error);
      return undefined;
    }
  };
  wrappedJSItemEventHandlers.add(wrappedHandler);
  cache?.set(handler, wrappedHandler);
  return wrappedHandler;
}

function isReactEventHandlerName(key: string): boolean {
  return /^on[A-Z]/.test(key);
}

function isReactNamespace(value: unknown): value is typeof React {
  return isRecord(value) && typeof value.createElement === 'function';
}

function isJSItemEventLike(value: Record<string, unknown>): boolean {
  return value instanceof Event || 'target' in value || 'currentTarget' in value || 'nativeEvent' in value;
}

function isPromiseLike(value: unknown): value is Promise<unknown> {
  if (!isRecord(value)) {
    return false;
  }
  return typeof value.then === 'function' && typeof value.catch === 'function';
}
