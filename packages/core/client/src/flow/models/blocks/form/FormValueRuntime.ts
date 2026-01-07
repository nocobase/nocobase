/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isObservable, observable, observe, reaction, toJS } from '@formily/reactive';
import type { FormInstance } from 'antd';
import { evaluateConditions, removeInvalidFilterItems } from '@nocobase/utils/client';
import {
  createSafeDocument,
  createSafeNavigator,
  createSafeWindow,
  extractUsedVariablePaths,
  extractUsedVariablePathsFromRunJS,
  FlowContext,
  isRunJSValue,
  normalizeRunJSValue,
} from '@nocobase/flow-engine';
import _ from 'lodash';

export type NamePath = Array<string | number>;

export type ValueSource = 'default' | 'linkage' | 'user' | 'system';

export type Patch =
  | Record<string, any>
  | Array<{
      path: string | NamePath;
      value: any;
      condition?: any;
    }>;

export interface SetOptions {
  source?: ValueSource;
  triggerEvent?: boolean;
  markExplicit?: boolean;
  txId?: string;
}

export interface FormValuesChangePayload {
  source: ValueSource;
  txId: string;
  changedPaths: NamePath[];
  changedValues?: any;
  allValues?: any;
  allValuesSnapshot?: any;
}

type DepCollector = {
  deps: Set<string>;
  wildcard: boolean;
};

type RuleDeps = Set<string>;

type RuleState = {
  deps: RuleDeps;
  depDisposers: Array<() => void>;
  runSeq: number;
};

type RuntimeRule = {
  id: string;
  source: ValueSource;
  priority: number;
  debounceMs: number;
  getEnabled: () => boolean;
  getTarget: () => string | NamePath;
  getValue: () => any;
  getCondition?: () => any;
  getContext: () => any;
};

type AssignMode = 'default' | 'assign';

export type FormAssignRuleItem = {
  key?: string;
  enable?: boolean;
  field?: string;
  mode?: AssignMode;
  condition?: any;
  value?: any;
};

function isPlainObjectValue(v: any) {
  return _.isPlainObject(v);
}

export function isEmptyValue(v: any): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.length === 0;
  if (Array.isArray(v)) return v.length === 0;
  if (isPlainObjectValue(v)) return Object.keys(v).length === 0;
  return false;
}

function getIn(obj: any, path: NamePath) {
  let cur = obj;
  for (const seg of path) {
    if (cur == null) return undefined;
    cur = cur[seg as any];
  }
  return cur;
}

function setIn(obj: any, path: NamePath, value: any) {
  if (!path.length) return;
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const seg = path[i];
    const next = path[i + 1];
    if (cur[seg as any] == null || typeof cur[seg as any] !== 'object') {
      cur[seg as any] = typeof next === 'number' ? [] : {};
    }
    cur = cur[seg as any];
  }
  cur[path[path.length - 1] as any] = value;
}

type PlaceholderSeg = { placeholder: string };

function parsePathString(path: string): Array<string | number | PlaceholderSeg> {
  const segs: Array<string | number | PlaceholderSeg> = [];
  let i = 0;
  const len = path.length;
  const readIdent = () => {
    const start = i;
    while (i < len && path[i] !== '.' && path[i] !== '[') i++;
    const raw = path.slice(start, i);
    if (raw) segs.push(raw);
  };
  while (i < len) {
    const ch = path[i];
    if (ch === '.') {
      i++;
      continue;
    }
    if (ch === '[') {
      i++;
      const start = i;
      while (i < len && path[i] !== ']') i++;
      const raw = path.slice(start, i);
      i++;
      if (/^\d+$/.test(raw)) {
        segs.push(Number(raw));
      } else if (raw) {
        segs.push({ placeholder: raw });
      }
      continue;
    }
    readIdent();
  }
  return segs;
}

function namePathToPathKey(namePath: Array<string | number>): string {
  let out = '';
  for (const seg of namePath) {
    if (typeof seg === 'number') {
      out += `[${seg}]`;
      continue;
    }
    if (!out) {
      out = seg;
    } else {
      out += `.${seg}`;
    }
  }
  return out;
}

function pathKeyToNamePath(pathKey: string): NamePath {
  return parsePathString(pathKey).filter((seg) => typeof seg !== 'object') as NamePath;
}

function buildAncestorKeys(namePath: NamePath): string[] {
  const out: string[] = [];
  const cur: Array<string | number> = [];
  for (const seg of namePath) {
    cur.push(seg);
    out.push(namePathToPathKey(cur));
  }
  return out;
}

function createTxId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

type ObservableBinding = {
  source: ValueSource;
  dispose: () => void;
};

export class FormValueRuntime {
  private readonly model: any;
  private readonly getForm: () => FormInstance;

  private readonly valuesMirror = observable({});
  private readonly explicitSet = new Set<string>();
  private readonly lastDefaultValueByPathKey = new Map<string, any>();
  private readonly rules = new Map<string, { rule: RuntimeRule; state: RuleState }>();
  private readonly assignRuleIdsByFieldUid = new Map<string, Set<string>>();
  private readonly pendingRuleIds = new Set<string>();
  private readonly ruleDebounceUntilById = new Map<string, number>();
  private readonly ruleDebounceTimersById = new Map<string, any>();
  private readonly observableBindings = new Map<string, ObservableBinding>();
  private readonly changeTick = observable.ref(0);
  private readonly txWriteCounts = new Map<string, Map<string, number>>();

  private disposed = false;
  private runningRules = false;
  private suppressFormCallbackDepth = 0;
  private rulesEnabled = false;
  private currentRuleTxId: string | null = null;

  private lastObservedChangedPaths: NamePath[] | null = null;
  private lastObservedSource: ValueSource | null = null;
  private lastObservedToken = 0;

  private readonly formValuesProxy: any;

  private readonly defaultRuleIdsByMasterUid = new Map<string, Set<string>>();
  private readonly defaultRuleMasterDisposers = new Map<string, () => void>();

  private mountedListener?: (payload: any) => void;
  private unmountedListener?: (payload: any) => void;

  private patchedForm?: FormInstance;
  private originalFormSetFieldValue?: (namePath: any, value: any) => void;
  private originalFormSetFieldsValue?: (values: any) => void;

  constructor(options: { model: any; getForm: () => FormInstance }) {
    this.model = options.model;
    this.getForm = options.getForm;
    this.formValuesProxy = this.createFormValuesProxy([], undefined);
  }

  /**
   * 同步“表单赋值”配置到运行时规则引擎。
   *
   * - mode=default → source=default（遵循 explicit/空值覆盖语义）
   * - mode=assign  → source=system（不受 explicit 影响，依赖变化时持续生效）
   */
  syncAssignRules(items: FormAssignRuleItem[]) {
    if (this.disposed) return;
    const raw = Array.isArray(items) ? items : [];
    const next = raw.map((it, index) => ({
      ...it,
      key: it?.key ? String(it.key) : `idx:${index}`,
    }));
    const prefix = 'form-assign:';

    this.assignRuleIdsByFieldUid.clear();

    const nextIds = new Set<string>();
    for (const it of next) {
      nextIds.add(`${prefix}${String(it.key)}`);
    }

    // 移除已不存在的规则
    for (const id of Array.from(this.rules.keys())) {
      if (!id.startsWith(prefix)) continue;
      if (nextIds.has(id)) continue;
      this.removeRule(id);
    }

    // 重新注册（保持实现简单：配置变化时直接替换）
    let order = 0;
    for (const it of next) {
      const id = `${prefix}${String(it.key)}`;
      const mode: AssignMode = it?.mode === 'default' ? 'default' : 'assign';
      const source: ValueSource = mode === 'default' ? 'default' : 'system';
      const enabled = it?.enable !== false;
      const fieldUid = it?.field ? String(it.field) : '';

      if (fieldUid) {
        const set = this.assignRuleIdsByFieldUid.get(fieldUid) || new Set<string>();
        set.add(id);
        this.assignRuleIdsByFieldUid.set(fieldUid, set);
      }

      // 若已存在则替换，避免残留旧 deps/binding
      if (this.rules.has(id)) {
        this.removeRule(id);
      }

      order += 1;
      const rule: RuntimeRule = {
        id,
        source,
        priority: 10 + order,
        debounceMs: 0,
        getEnabled: () => {
          if (!enabled) return false;
          if (!fieldUid) return false;
          const fieldModel = this.model?.context?.engine?.getModel?.(fieldUid);
          return !!fieldModel && !!this.getModelTargetNamePath(fieldModel);
        },
        getTarget: () => {
          const fieldModel = this.model?.context?.engine?.getModel?.(fieldUid);
          return this.getModelTargetNamePath(fieldModel) || [];
        },
        getValue: () => it?.value,
        getCondition: () => it?.condition,
        getContext: () => this.model?.context,
      };

      this.rules.set(id, {
        rule,
        state: { deps: new Set(), depDisposers: [], runSeq: 0 },
      });

      this.scheduleRule(id);
    }
  }

  get formValues() {
    if (!this.disposed) {
      const form = this.getForm?.();
      if (form) {
        this.patchFormMethods(form);
      }
    }
    return this.formValuesProxy;
  }

  getFormValuesSnapshot() {
    if (!this.disposed) {
      const formForPatch = this.getForm?.();
      if (formForPatch) {
        this.patchFormMethods(formForPatch);
      }
    }
    const form = this.getForm?.();
    if (form?.getFieldsValue) {
      try {
        return form.getFieldsValue(true);
      } catch {
        return toJS(this.valuesMirror);
      }
    }
    return toJS(this.valuesMirror);
  }

  private getFormValueAtPath(namePath: NamePath) {
    const form = this.getForm?.();
    if (form?.getFieldValue) {
      try {
        return form.getFieldValue(namePath as any);
      } catch {
        // ignore
      }
    }
    const snapshot = this.getFormValuesSnapshot();
    return getIn(snapshot, namePath);
  }

  mount(options?: { sync?: boolean }) {
    if (this.disposed) return;

    const form = this.getForm?.();
    if (form) {
      this.patchFormMethods(form);
    }

    const engineEmitter = this.model?.flowEngine?.emitter;
    if (!engineEmitter) return;

    if (!this.mountedListener && !this.unmountedListener) {
      this.mountedListener = ({ model }: any) => {
        this.tryRegisterDefaultRuleInstance(model);
        this.tryScheduleAssignRulesOnModelChange(model);
      };
      this.unmountedListener = ({ model }: any) => {
        this.tryUnregisterDefaultRuleInstance(model);
        this.tryScheduleAssignRulesOnModelChange(model);
      };

      engineEmitter.on('model:mounted', this.mountedListener);
      engineEmitter.on('model:unmounted', this.unmountedListener);
    }

    if (options?.sync) {
      const snapshot = this.getFormValuesSnapshot();
      if (snapshot && typeof snapshot === 'object') {
        _.merge(this.valuesMirror, snapshot);
        this.bumpChangeTick();
      }
      this.rulesEnabled = true;
      if (this.pendingRuleIds.size && !this.runningRules) {
        void this.flushRules();
      }
    }
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;

    this.restoreFormMethods();

    const engineEmitter = this.model?.flowEngine?.emitter;
    if (engineEmitter && this.mountedListener && this.unmountedListener) {
      engineEmitter.off('model:mounted', this.mountedListener);
      engineEmitter.off('model:unmounted', this.unmountedListener);
    }

    for (const { state } of this.rules.values()) {
      state.depDisposers.forEach((d) => d());
    }
    this.rules.clear();
    this.pendingRuleIds.clear();
    this.assignRuleIdsByFieldUid.clear();

    for (const binding of this.observableBindings.values()) {
      binding.dispose();
    }
    this.observableBindings.clear();

    for (const disposer of this.defaultRuleMasterDisposers.values()) {
      disposer();
    }
    this.defaultRuleMasterDisposers.clear();
    this.defaultRuleIdsByMasterUid.clear();

    for (const timer of this.ruleDebounceTimersById.values()) {
      clearTimeout(timer);
    }
    this.ruleDebounceTimersById.clear();
    this.ruleDebounceUntilById.clear();
    this.txWriteCounts.clear();
  }

  isSuppressed() {
    return this.suppressFormCallbackDepth > 0;
  }

  handleFormFieldsChange(changedFields: Array<{ name?: any }>) {
    if (this.disposed) return;
    const form = this.getForm?.();
    if (!form?.getFieldValue) {
      return;
    }

    const changedPaths: NamePath[] = [];
    for (const field of changedFields || []) {
      const name = field?.name;
      const namePath: NamePath | null = Array.isArray(name)
        ? (name as NamePath)
        : typeof name === 'string' || typeof name === 'number'
          ? ([name] as NamePath)
          : null;
      if (!namePath?.length) continue;
      const nextValue = form.getFieldValue(namePath as any);
      const prevValue = getIn(this.valuesMirror, namePath);
      if (_.isEqual(nextValue, prevValue)) continue;
      setIn(this.valuesMirror, namePath, nextValue);
      changedPaths.push(namePath);
    }

    if (!changedPaths.length) return;
    this.bumpChangeTick();

    if (this.isSuppressed()) {
      return;
    }

    const isUser =
      Array.isArray(changedFields) &&
      changedFields.some((f: any) => f && typeof f === 'object' && 'touched' in f && f.touched === true);
    const source: ValueSource = isUser ? 'user' : 'system';

    // 用于给 onValuesChange 提供更精确的 changedPaths/source（避免仅靠 changedValues 的 top-level key）
    this.lastObservedChangedPaths = changedPaths;
    this.lastObservedSource = source;
    const token = ++this.lastObservedToken;
    queueMicrotask(() => {
      if (this.disposed) return;
      if (this.lastObservedToken !== token) return;
      this.lastObservedChangedPaths = null;
      this.lastObservedSource = null;
    });
  }

  handleFormValuesChange(changedValues: any, allValues: any) {
    if (this.disposed) return;
    if (this.isSuppressed()) {
      return;
    }

    const changedPaths: NamePath[] =
      this.lastObservedChangedPaths && this.lastObservedChangedPaths.length
        ? this.lastObservedChangedPaths
        : Object.keys(changedValues || {}).map((k) => [k]);

    const source: ValueSource = this.lastObservedSource ?? 'user';

    // clear observed paths to avoid leaking into next events
    this.lastObservedChangedPaths = null;
    this.lastObservedSource = null;

    const snapshot = allValues && typeof allValues === 'object' ? allValues : this.getFormValuesSnapshot();

    let hasMirrorChange = false;
    for (const p of changedPaths) {
      if (!p?.length) continue;
      const nextValue = getIn(snapshot, p);
      const prevValue = getIn(this.valuesMirror, p);
      if (_.isEqual(prevValue, nextValue)) continue;
      setIn(this.valuesMirror, p, nextValue);
      hasMirrorChange = true;
    }
    if (hasMirrorChange) {
      this.bumpChangeTick();
    }

    // 非 default 来源写入：需要使默认值永久失效（explicit）
    for (const p of changedPaths) {
      this.markExplicit(namePathToPathKey(p));
    }

    const txId = createTxId();
    this.emitFormValuesChange({
      source,
      txId,
      changedPaths,
      changedValues,
      allValues: snapshot,
      allValuesSnapshot: snapshot,
    });
  }

  async setFormValues(callerCtx: any, patch: Patch, options?: SetOptions) {
    if (this.disposed) return;
    const form = this.getForm?.();
    if (!form) return;

    const source: ValueSource = options?.source ?? 'system';
    const triggerEvent = options?.triggerEvent !== false;
    const txId = options?.txId ?? createTxId();
    const markExplicit = options?.markExplicit ?? source !== 'default';
    const ownsTxId = typeof options?.txId === 'undefined';

    try {
      const changedPaths: NamePath[] = [];

      if (!Array.isArray(patch)) {
        this.suppressFormCallbackDepth++;
        try {
          form.setFieldsValue?.(patch);
          _.merge(this.valuesMirror, patch);
          this.bumpChangeTick();
        } finally {
          this.suppressFormCallbackDepth--;
        }

        if (markExplicit) {
          for (const k of Object.keys(patch || {})) {
            this.markExplicit(k);
          }
        }

        if (triggerEvent) {
          const allValues = this.getFormValuesSnapshot();
          this.emitFormValuesChange({
            source,
            txId,
            changedPaths: Object.keys(patch || {}).map((k) => [k]),
            changedValues: patch,
            allValues,
            allValuesSnapshot: allValues,
          });
        }
        return;
      }

      const writeByPathKey = new Map<
        string,
        { order: number; namePath: NamePath; value: any; rawValue: any; pathKey: string }
      >();
      let order = 0;

      for (const item of patch) {
        const cond = item?.condition;
        if (cond) {
          if (!this.evaluateCondition(callerCtx, cond)) continue;
        }

        const namePath = this.resolveNamePath(callerCtx, item.path);
        const pathKey = namePathToPathKey(namePath);
        const rawValue = item.value;
        const value = isObservable(rawValue) ? toJS(rawValue) : rawValue;

        const prevFormValue = this.getFormValueAtPath(namePath);
        if (_.isEqual(prevFormValue, value)) continue;

        order += 1;
        writeByPathKey.set(pathKey, { order, namePath, value, rawValue, pathKey });
      }

      const toWrite = Array.from(writeByPathKey.values())
        .sort((a, b) => a.order - b.order)
        .map((e) => ({ namePath: e.namePath, value: e.value, rawValue: e.rawValue, pathKey: e.pathKey }));

      if (!toWrite.length) {
        return;
      }

      // 同一 txId 下限制同一路径的写入次数，避免规则振荡导致的无限循环
      const txCounts = this.txWriteCounts.get(txId) || new Map<string, number>();
      this.txWriteCounts.set(txId, txCounts);
      const MAX_WRITES_PER_PATH_PER_TX = 20;
      const filteredToWrite: typeof toWrite = [];
      for (const w of toWrite) {
        const prev = txCounts.get(w.pathKey) || 0;
        const next = prev + 1;
        txCounts.set(w.pathKey, next);
        if (next > MAX_WRITES_PER_PATH_PER_TX) continue;
        filteredToWrite.push(w);
      }

      if (!filteredToWrite.length) {
        return;
      }

      for (const { pathKey, rawValue } of filteredToWrite) {
        if (!isObservable(rawValue)) {
          const existing = this.observableBindings.get(pathKey);
          if (existing) {
            existing.dispose();
            this.observableBindings.delete(pathKey);
          }
        }
      }

      this.suppressFormCallbackDepth++;
      try {
        for (const { namePath, value } of filteredToWrite) {
          form.setFieldValue?.(namePath, value);
          setIn(this.valuesMirror, namePath, value);
          changedPaths.push(namePath);
        }
        this.bumpChangeTick();
      } finally {
        this.suppressFormCallbackDepth--;
      }

      if (markExplicit) {
        for (const { pathKey } of filteredToWrite) {
          this.markExplicit(pathKey);
        }
      }

      if (source === 'default') {
        for (const { namePath, pathKey } of filteredToWrite) {
          const current = this.getFormValueAtPath(namePath);
          this.lastDefaultValueByPathKey.set(pathKey, current);
        }
      }

      for (const { namePath, rawValue, pathKey } of filteredToWrite) {
        if (!isObservable(rawValue)) continue;
        const obs = rawValue;

        const disposer = observe(obs, () => {
          this.applyBoundValue(callerCtx, namePath, pathKey, toJS(obs), source);
        });

        const existing = this.observableBindings.get(pathKey);
        if (existing) {
          existing.dispose();
        }
        this.observableBindings.set(pathKey, { source, dispose: disposer });
      }

      if (triggerEvent) {
        const allValues = this.getFormValuesSnapshot();
        this.emitFormValuesChange({
          source,
          txId,
          changedPaths,
          changedValues: {},
          allValues,
          allValuesSnapshot: allValues,
        });
      }
    } finally {
      if (ownsTxId) {
        this.txWriteCounts.delete(txId);
      }
    }
  }

  private applyBoundValue(callerCtx: any, namePath: NamePath, pathKey: string, nextValue: any, source: ValueSource) {
    if (this.disposed) return;
    const form = this.getForm?.();
    if (!form) return;

    const prevValue = getIn(this.valuesMirror, namePath);
    if (_.isEqual(prevValue, nextValue)) return;

    this.suppressFormCallbackDepth++;
    try {
      form.setFieldValue?.(namePath, nextValue);
      setIn(this.valuesMirror, namePath, nextValue);
      this.bumpChangeTick();
    } finally {
      this.suppressFormCallbackDepth--;
    }

    const txId = createTxId();
    const allValues = this.getFormValuesSnapshot();
    this.emitFormValuesChange({
      source,
      txId,
      changedPaths: [namePath],
      changedValues: {},
      allValues,
      allValuesSnapshot: allValues,
    });

    if (source === 'default' && this.isExplicit(pathKey)) {
      const existing = this.observableBindings.get(pathKey);
      if (existing) {
        existing.dispose();
        this.observableBindings.delete(pathKey);
      }
    }

    if (source === 'default') {
      this.lastDefaultValueByPathKey.set(pathKey, this.getFormValueAtPath(namePath));
    }
  }

  private createFormValuesProxy(basePath: NamePath, collector?: DepCollector): any {
    const runtime = this;
    const getTarget = () => (basePath.length ? getIn(runtime.valuesMirror, basePath) : runtime.valuesMirror);
    const target = getTarget();
    const proxyTarget =
      target && (typeof target === 'object' || typeof target === 'function') ? target : Array.isArray(target) ? [] : {};

    const asProxy = (nextBasePath: NamePath) => runtime.createFormValuesProxy(nextBasePath, collector);

    return new Proxy(proxyTarget as any, {
      get(_t, key: PropertyKey) {
        if (key === 'toJSON') {
          if (collector) collector.wildcard = true;
          if (basePath.length === 0) {
            return () => runtime.getFormValuesSnapshot();
          }
          return () => toJS(getTarget());
        }
        if (typeof key === 'symbol') {
          if (collector) collector.wildcard = true;
          const actual = getTarget();
          return actual?.[key as any];
        }
        const actual = getTarget();
        if (actual == null) return undefined;
        if (key === '__raw') return actual;

        // 防止原型链污染类 key 被当成路径读取/写入
        if (key === '__proto__' || key === 'prototype' || key === 'constructor') {
          if (collector) collector.wildcard = true;
          return undefined;
        }

        const isArray = Array.isArray(actual);
        const isNumericIndex =
          isArray &&
          ((typeof key === 'number' && Number.isInteger(key)) || (typeof key === 'string' && /^\d+$/.test(key)));

        // Array 的非 index 属性（length/map/forEach/...）不视为 NamePath
        if (isArray && !isNumericIndex) {
          if (collector) collector.wildcard = true;
          const v = actual[key as any];
          return typeof v === 'function' ? v.bind(actual) : v;
        }

        const nextSeg = isNumericIndex ? Number(key) : (key as unknown as string | number);
        const nextPath = [...basePath, nextSeg];
        runtime.recordDep(nextPath, collector);

        const val = actual[key as any];
        let finalVal = val;

        // 仅在 mirror 缺失时尝试从 form 读取同步，避免误写入 Array 的内置属性（length/map/...）
        if (typeof finalVal === 'undefined') {
          const fetched = runtime.getFormValueAtPath(nextPath);
          if (!_.isEqual(fetched, finalVal)) {
            setIn(runtime.valuesMirror, nextPath, fetched);
            finalVal = fetched;
          }
        }

        if (finalVal == null || typeof finalVal !== 'object') return finalVal;
        return asProxy(nextPath);
      },
      ownKeys() {
        if (collector) collector.wildcard = true;
        const actual = getTarget();
        return actual ? Reflect.ownKeys(actual) : [];
      },
      getOwnPropertyDescriptor(_t, prop: PropertyKey) {
        const actual = getTarget();
        if (!actual) return undefined;
        return Object.getOwnPropertyDescriptor(actual, prop);
      },
      has(_t, prop: PropertyKey) {
        const actual = getTarget();
        if (!actual) return false;
        return prop in actual;
      },
    });
  }

  private recordDep(namePath: NamePath, collector: DepCollector | undefined) {
    if (!collector) return;
    for (const k of buildAncestorKeys(namePath)) {
      collector.deps.add(`fv:${k}`);
    }
  }

  private collectStaticDepsFromTemplateValue(value: any, collector: DepCollector) {
    try {
      const usage = extractUsedVariablePaths(value as any) || {};
      for (const [varName, rawPaths] of Object.entries(usage)) {
        const paths = Array.isArray(rawPaths) ? rawPaths : [];
        // NOTE: extractUsedVariablePaths 在 `{{ ctx.foo }}` 场景下会生成空数组，表示顶层变量被使用
        const normalized = paths.length ? paths : [''];

        for (const subPath of normalized) {
          if (varName === 'formValues') {
            if (!subPath) {
              collector.wildcard = true;
              continue;
            }
            const segs = parsePathString(String(subPath)).filter((seg) => typeof seg !== 'object') as NamePath;
            this.recordDep(segs, collector);
            continue;
          }

          const key = subPath ? `ctx:${varName}:${String(subPath)}` : `ctx:${varName}`;
          collector.deps.add(key);
        }
      }
    } catch {
      // ignore
    }
  }

  private collectStaticDepsFromRunJSValue(value: any, collector: DepCollector) {
    if (!isRunJSValue(value)) return;
    try {
      const usage = extractUsedVariablePathsFromRunJS(value.code) || {};
      for (const [varName, rawPaths] of Object.entries(usage)) {
        const paths = Array.isArray(rawPaths) ? rawPaths : [];
        const normalized = paths.length ? paths : [''];

        for (const subPath of normalized) {
          if (varName === 'formValues') {
            if (!subPath) {
              collector.wildcard = true;
              continue;
            }
            const segs = parsePathString(String(subPath)).filter((seg) => typeof seg !== 'object') as NamePath;
            this.recordDep(segs, collector);
            continue;
          }

          const key = subPath ? `ctx:${varName}:${String(subPath)}` : `ctx:${varName}`;
          collector.deps.add(key);
        }
      }
    } catch {
      // ignore
    }
  }

  private resolveNamePath(callerCtx: any, path: string | NamePath): NamePath {
    const resolved = this.tryResolveNamePath(callerCtx, path);
    if (!resolved) {
      throw new Error(`Failed to resolve path '${String(path)}'`);
    }
    return resolved;
  }

  private tryResolveNamePath(callerCtx: any, path: string | NamePath): NamePath | null {
    const segs = Array.isArray(path) ? [...path] : parsePathString(path);

    const indexByFieldName = this.buildIndexByFieldName(callerCtx);

    const resolved: NamePath = [];
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i] as any;
      if (typeof seg === 'object' && seg && 'placeholder' in seg) {
        const prev = resolved[resolved.length - 1];
        const owner = typeof prev === 'string' ? prev : undefined;
        const idx = owner ? indexByFieldName[owner] : undefined;
        if (typeof idx !== 'number') {
          return null;
        }
        resolved.push(idx);
        continue;
      }
      resolved.push(seg);
    }

    if (Object.keys(indexByFieldName).length) {
      const inserted: NamePath = [];
      for (let i = 0; i < resolved.length; i++) {
        const seg = resolved[i];
        inserted.push(seg);
        if (typeof seg !== 'string') continue;
        const idx = indexByFieldName[seg];
        if (typeof idx !== 'number') continue;
        const next = resolved[i + 1];
        if (typeof next === 'number') continue;
        inserted.push(idx);
      }
      return inserted;
    }

    return resolved;
  }

  private buildIndexByFieldName(callerCtx: any): Record<string, number> {
    const out: Record<string, number> = {};
    const fieldIndex = callerCtx?.model?.context?.fieldIndex ?? callerCtx?.fieldIndex;
    const arr = Array.isArray(fieldIndex) ? fieldIndex : [];
    for (const it of arr) {
      if (typeof it !== 'string') continue;
      const [k, v] = it.split(':');
      const n = Number(v);
      if (!k || Number.isNaN(n)) continue;
      out[k] = n;
    }
    return out;
  }

  private bumpChangeTick() {
    this.changeTick.value += 1;
  }

  private emitFormValuesChange(payload: FormValuesChangePayload) {
    this.model.dispatchEvent?.('formValuesChange', payload, { debounce: true });
    this.model.emitter?.emit?.('formValuesChange', payload);
  }

  private markExplicit(pathKey: string) {
    if (this.explicitSet.has(pathKey)) return;
    this.explicitSet.add(pathKey);

    // explicit 后默认值永远失效：清理该路径及其子路径的 lastDefault 记录，避免误判“仍是默认值”
    for (const k of Array.from(this.lastDefaultValueByPathKey.keys())) {
      if (k === pathKey || k.startsWith(`${pathKey}.`) || k.startsWith(`${pathKey}[`)) {
        this.lastDefaultValueByPathKey.delete(k);
      }
    }

    for (const [k, binding] of Array.from(this.observableBindings.entries())) {
      if (binding.source !== 'default') continue;
      if (!this.isExplicit(k)) continue;
      binding.dispose();
      this.observableBindings.delete(k);
    }
  }

  private isExplicit(pathKey: string) {
    return !!this.findExplicitHit(pathKey);
  }

  private findExplicitHit(pathKey: string): string | null {
    if (this.explicitSet.has(pathKey)) return pathKey;
    const keys = buildAncestorKeys(pathKeyToNamePath(pathKey));
    for (const k of keys) {
      if (this.explicitSet.has(k)) return k;
    }
    return null;
  }

  private patchFormMethods(form: FormInstance) {
    if (this.patchedForm === form) return;

    // 避免不同 form 实例之间残留补丁
    this.restoreFormMethods();

    const originalSetFieldValue =
      typeof (form as any)?.setFieldValue === 'function' ? (form as any).setFieldValue.bind(form) : undefined;
    const originalSetFieldsValue =
      typeof (form as any)?.setFieldsValue === 'function' ? (form as any).setFieldsValue.bind(form) : undefined;

    this.patchedForm = form;
    this.originalFormSetFieldValue = originalSetFieldValue;
    this.originalFormSetFieldsValue = originalSetFieldsValue;

    const runtime = this;

    if (originalSetFieldValue) {
      (form as any).setFieldValue = (namePath: any, value: any) => {
        // runtime 内部写入会抑制回调：此处需走原始写入避免递归
        if (runtime.isSuppressed()) {
          originalSetFieldValue(namePath, value);
          return;
        }
        void runtime
          .setFormValues(runtime.model?.context, [{ path: namePath, value }], { source: 'system' })
          .catch(() => undefined);
      };
    }

    if (originalSetFieldsValue) {
      (form as any).setFieldsValue = (values: any) => {
        if (runtime.isSuppressed()) {
          originalSetFieldsValue(values);
          return;
        }
        void runtime.setFormValues(runtime.model?.context, values, { source: 'system' }).catch(() => undefined);
      };
    }
  }

  private restoreFormMethods() {
    const form = this.patchedForm;
    if (!form) return;

    if (this.originalFormSetFieldValue) {
      (form as any).setFieldValue = this.originalFormSetFieldValue;
    }
    if (this.originalFormSetFieldsValue) {
      (form as any).setFieldsValue = this.originalFormSetFieldsValue;
    }

    this.patchedForm = undefined;
    this.originalFormSetFieldValue = undefined;
    this.originalFormSetFieldsValue = undefined;
  }

  private evaluateCondition(ctx: any, condition: any) {
    const evaluator = (path: string, operator: string, value: any) => {
      if (!operator) return true;
      return ctx?.app?.jsonLogic?.apply?.({ [operator]: [path, value] });
    };
    try {
      return evaluateConditions(removeInvalidFilterItems(condition), evaluator);
    } catch {
      return false;
    }
  }

  private tryRegisterDefaultRuleInstance(model: any) {
    if (this.disposed) return;
    if (!this.isModelInThisForm(model)) return;
    if (!model || typeof model !== 'object') return;

    const props = typeof model.getProps === 'function' ? model.getProps() : model.props;
    if (!props || typeof props !== 'object') return;

    const target = this.getModelTargetNamePath(model);
    if (!target) return;

    const id = this.getDefaultRuleId(model);
    if (this.rules.has(id)) return;

    const master = (model as any).master || model;
    this.bindMasterInitialValue(master, id);

    const getStepDefaultValue = () => {
      try {
        const fromEdit = master?.getStepParams?.('editItemSettings', 'initialValue')?.defaultValue;
        if (typeof fromEdit !== 'undefined') return fromEdit;
        const fromLegacy = master?.getStepParams?.('formItemSettings', 'initialValue')?.defaultValue;
        if (typeof fromLegacy !== 'undefined') return fromLegacy;
      } catch {
        // ignore
      }
      return undefined;
    };

    const rule: RuntimeRule = {
      id,
      source: 'default',
      priority: 0,
      debounceMs: 0,
      getEnabled: () => {
        const p = (master as any)?.getProps?.() ?? (master as any)?.props;
        const fromProps = p?.initialValue;
        if (typeof fromProps !== 'undefined') return true;
        const fromStep = getStepDefaultValue();
        return typeof fromStep !== 'undefined';
      },
      getTarget: () => {
        return this.getModelTargetNamePath(model) || target;
      },
      getValue: () => {
        const p = (master as any)?.getProps?.() ?? (master as any)?.props;
        const fromProps = p?.initialValue;
        if (typeof fromProps !== 'undefined') return fromProps;
        return getStepDefaultValue();
      },
      getContext: () => model?.context,
    };

    this.rules.set(id, {
      rule,
      state: { deps: new Set(), depDisposers: [], runSeq: 0 },
    });

    this.scheduleRule(id);
  }

  private tryScheduleAssignRulesOnModelChange(model: any) {
    if (this.disposed) return;
    if (!this.isModelInThisForm(model)) return;

    const uid = model?.uid ? String(model.uid) : '';
    if (!uid) return;

    const ids = this.assignRuleIdsByFieldUid.get(uid);
    if (!ids || ids.size === 0) return;

    // 当字段模型挂载/卸载时，重新触发一次规则计算：
    // - 解决同步 assignRules 时目标字段尚未 ready（fieldPathArray 未注入）导致永远不运行的问题
    for (const id of ids) {
      this.scheduleRule(id);
    }
  }

  private tryUnregisterDefaultRuleInstance(model: any) {
    if (this.disposed) return;
    if (!this.isModelInThisForm(model)) return;
    const id = this.getDefaultRuleId(model);
    if (!this.rules.has(id)) return;
    this.removeRule(id);
  }

  private bindMasterInitialValue(master: any, ruleId: string) {
    const uid = master?.uid ? String(master.uid) : ruleId;
    const set = this.defaultRuleIdsByMasterUid.get(uid) || new Set<string>();
    set.add(ruleId);
    this.defaultRuleIdsByMasterUid.set(uid, set);

    if (this.defaultRuleMasterDisposers.has(uid)) return;

    const disposer = reaction(
      () => {
        const p = (master as any)?.getProps?.() ?? (master as any)?.props;
        return p?.initialValue;
      },
      (next, prev) => {
        if (_.isEqual(next, prev)) return;
        const ids = this.defaultRuleIdsByMasterUid.get(uid);
        if (!ids) return;
        for (const id of ids) {
          this.scheduleRule(id);
        }
      },
    );
    this.defaultRuleMasterDisposers.set(uid, disposer);
  }

  private removeRule(id: string) {
    const entry = this.rules.get(id);
    if (!entry) return;

    try {
      const baseCtx = entry.rule.getContext();
      const rawTarget = entry.rule.getTarget();
      const targetNamePath = this.tryResolveNamePath(baseCtx, rawTarget as any);
      if (targetNamePath) {
        const targetKey = namePathToPathKey(targetNamePath);
        const existing = this.observableBindings.get(targetKey);
        if (existing && existing.source === entry.rule.source) {
          existing.dispose();
          this.observableBindings.delete(targetKey);
        }
      }
    } catch {
      // ignore
    }

    entry.state.depDisposers.forEach((d) => d());
    this.rules.delete(id);
    this.pendingRuleIds.delete(id);
    const timer = this.ruleDebounceTimersById.get(id);
    if (timer) clearTimeout(timer);
    this.ruleDebounceTimersById.delete(id);
    this.ruleDebounceUntilById.delete(id);

    for (const [masterUid, ids] of this.defaultRuleIdsByMasterUid.entries()) {
      if (!ids.has(id)) continue;
      ids.delete(id);
      if (ids.size > 0) continue;
      this.defaultRuleIdsByMasterUid.delete(masterUid);
      const disposer = this.defaultRuleMasterDisposers.get(masterUid);
      if (disposer) disposer();
      this.defaultRuleMasterDisposers.delete(masterUid);
    }
  }

  private scheduleRule(id: string) {
    if (this.disposed) return;
    if (!this.rules.has(id)) return;
    const rule = this.rules.get(id)?.rule;
    const debounceMs = rule?.debounceMs ?? 0;
    this.pendingRuleIds.add(id);

    // debounce：确保在 flush 时也能跳过未到期的 rule
    if (debounceMs > 0) {
      const until = Date.now() + debounceMs;
      const prevUntil = this.ruleDebounceUntilById.get(id) || 0;
      if (until > prevUntil) this.ruleDebounceUntilById.set(id, until);
      const existing = this.ruleDebounceTimersById.get(id);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => {
        this.ruleDebounceTimersById.delete(id);
        if (!this.rulesEnabled) return;
        if (this.runningRules) return;
        if (!this.pendingRuleIds.has(id)) return;
        void this.flushRules();
      }, debounceMs);
      this.ruleDebounceTimersById.set(id, timer);
    } else {
      const existing = this.ruleDebounceTimersById.get(id);
      if (existing) clearTimeout(existing);
      this.ruleDebounceTimersById.delete(id);
      this.ruleDebounceUntilById.delete(id);
    }

    if (!this.rulesEnabled) return;
    if (this.runningRules) return;
    void this.flushRules();
  }

  private async flushRules() {
    if (this.runningRules) return;
    this.runningRules = true;
    const txId = this.currentRuleTxId || createTxId();
    this.currentRuleTxId = txId;
    try {
      while (this.pendingRuleIds.size) {
        const now = Date.now();
        const ready: string[] = [];
        for (const id of this.pendingRuleIds) {
          const until = this.ruleDebounceUntilById.get(id) || 0;
          if (until > now) continue;
          ready.push(id);
        }
        if (!ready.length) break;
        for (const id of ready) {
          this.pendingRuleIds.delete(id);
          this.ruleDebounceUntilById.delete(id);
        }

        ready.sort((a, b) => {
          const ra = this.rules.get(a)?.rule;
          const rb = this.rules.get(b)?.rule;
          const pa = ra?.priority ?? 0;
          const pb = rb?.priority ?? 0;
          if (pa !== pb) return pa - pb;
          return a.localeCompare(b);
        });
        for (const id of ready) {
          await this.runRule(id);
        }
      }
    } finally {
      this.runningRules = false;
      this.currentRuleTxId = null;
      this.txWriteCounts.delete(txId);
    }
  }

  private isEditMode() {
    try {
      const actionName = this.model?.getAclActionName?.() ?? this.model?.context?.actionName;
      return actionName && actionName !== 'create';
    } catch {
      return false;
    }
  }

  private async runRule(id: string) {
    const entry = this.rules.get(id);
    if (!entry) return;

    const { rule, state } = entry;
    state.runSeq += 1;
    const seq = state.runSeq;

    const baseCtx = rule.getContext();
    const rawTarget = rule.getTarget();
    const targetNamePath = this.tryResolveNamePath(baseCtx, rawTarget as any);
    const targetKey = targetNamePath ? namePathToPathKey(targetNamePath) : null;
    const rawValue = rule.getValue();
    const isRunJS = isRunJSValue(rawValue);

    const clearDeps = () => {
      state.depDisposers.forEach((d) => d());
      state.depDisposers = [];
      state.deps = new Set();
    };

    const disposeBinding = () => {
      if (!targetKey) return;
      const existing = this.observableBindings.get(targetKey);
      if (!existing) return;
      if (existing.source !== rule.source) return;
      existing.dispose();
      this.observableBindings.delete(targetKey);
    };

    if (!rule.getEnabled()) {
      clearDeps();
      disposeBinding();
      return;
    }

    if (rule.source === 'default' && this.isEditMode()) {
      clearDeps();
      disposeBinding();
      return;
    }

    if (!targetNamePath || !targetKey) {
      clearDeps();
      disposeBinding();
      return;
    }

    const explicitHit = this.findExplicitHit(targetKey);
    if (rule.source === 'default' && explicitHit) {
      clearDeps();
      disposeBinding();
      return;
    }

    const collector: DepCollector = { deps: new Set(), wildcard: false };
    // 静态路径提取：覆盖“服务端解析但前端不触达 formValues 子路径”的场景
    if (rule.getCondition) {
      this.collectStaticDepsFromTemplateValue(rule.getCondition(), collector);
    }
    if (isRunJS) {
      this.collectStaticDepsFromRunJSValue(rawValue, collector);
    } else {
      this.collectStaticDepsFromTemplateValue(rawValue, collector);
    }
    // 规则可用性依赖 target 当前值（空/等于上次默认值）
    this.recordDep(targetNamePath, collector);

    const evalCtx: any = this.createRuleEvaluationContext(baseCtx, collector);

    if (rule.getCondition) {
      const cond = rule.getCondition();
      let resolvedCond = cond;
      if (cond) {
        try {
          resolvedCond = await evalCtx?.resolveJsonTemplate?.(cond);
        } catch {
          resolvedCond = cond;
        }
      }
      if (seq !== state.runSeq) return;
      if (cond && !this.evaluateCondition(evalCtx, resolvedCond)) {
        if (seq !== state.runSeq) return;
        const nextDeps: RuleDeps = new Set(collector.deps);
        if (collector.wildcard) {
          nextDeps.add('fv:*');
        }
        this.updateRuleDeps(rule, state, nextDeps);
        return;
      }
    }

    let resolved: any;
    if (isRunJS) {
      try {
        const { code, version } = normalizeRunJSValue(rawValue);
        const globals: Record<string, any> = {};
        try {
          const navigator = createSafeNavigator();
          globals.navigator = navigator;
          try {
            globals.window = createSafeWindow({ navigator });
          } catch {
            // ignore when window is not available
          }
          try {
            globals.document = createSafeDocument();
          } catch {
            // ignore when document is not available
          }
        } catch {
          // ignore
        }

        const ret = await evalCtx?.runjs?.(code, globals, { version });
        if (!ret?.success) {
          if (seq !== state.runSeq) return;
          const nextDeps: RuleDeps = new Set(collector.deps);
          if (collector.wildcard) {
            nextDeps.add('fv:*');
          }
          this.updateRuleDeps(rule, state, nextDeps);
          return;
        }
        resolved = ret.value;
      } catch (error) {
        if (seq !== state.runSeq) return;
        const nextDeps: RuleDeps = new Set(collector.deps);
        if (collector.wildcard) {
          nextDeps.add('fv:*');
        }
        this.updateRuleDeps(rule, state, nextDeps);
        return;
      }
    } else {
      try {
        resolved = await evalCtx?.resolveJsonTemplate?.(rawValue);
      } catch (error) {
        if (seq !== state.runSeq) return;
        const nextDeps: RuleDeps = new Set(collector.deps);
        if (collector.wildcard) {
          nextDeps.add('fv:*');
        }
        this.updateRuleDeps(rule, state, nextDeps);
        return;
      }
    }

    if (seq !== state.runSeq) return;

    const nextDeps: RuleDeps = new Set(collector.deps);
    if (collector.wildcard) {
      nextDeps.add('fv:*');
    }
    this.updateRuleDeps(rule, state, nextDeps);

    if (rule.source === 'default') {
      if (typeof resolved === 'undefined') return;
      const explicitHitAfterResolve = this.findExplicitHit(targetKey);
      if (explicitHitAfterResolve) {
        clearDeps();
        disposeBinding();
        return;
      }

      const current = this.getFormValueAtPath(targetNamePath);
      const last = this.lastDefaultValueByPathKey.get(targetKey);
      const canOverwrite = isEmptyValue(current) || (typeof last !== 'undefined' && _.isEqual(current, last));

      // 若外部已把当前值更新为“解析后的默认值”，同步 lastDefault，避免后续默认值变更无法覆盖
      const nextSnapshot = isObservable(resolved) ? toJS(resolved) : resolved;
      if (!canOverwrite && _.isEqual(current, nextSnapshot)) {
        this.lastDefaultValueByPathKey.set(targetKey, nextSnapshot);
        return;
      }

      if (!canOverwrite) return;
    }

    await this.setFormValues(evalCtx, [{ path: targetNamePath, value: resolved }], {
      source: rule.source,
      txId: this.currentRuleTxId || undefined,
    });
  }

  private createRuleEvaluationContext(baseCtx: any, collector: DepCollector) {
    const trackingFormValues = this.createFormValuesProxy([], collector);
    const ctx: any = new (FlowContext as any)();
    try {
      ctx.delegate(baseCtx);
    } catch {
      // ignore
    }
    const baseOptions =
      typeof baseCtx?.getPropertyOptions === 'function' ? baseCtx.getPropertyOptions('formValues') : null;
    if (baseOptions && typeof baseOptions === 'object') {
      ctx.defineProperty('formValues', {
        ...baseOptions,
        get: () => trackingFormValues,
        cache: false,
      });
    } else {
      ctx.defineProperty('formValues', { get: () => trackingFormValues, cache: false });
    }
    return ctx;
  }

  private updateRuleDeps(rule: RuntimeRule, state: RuleState, deps: RuleDeps) {
    state.depDisposers.forEach((d) => d());
    state.depDisposers = [];
    state.deps = deps;

    if (deps.has('fv:*')) {
      const disposer = reaction(
        () => this.changeTick.value,
        () => this.scheduleRule(rule.id),
      );
      state.depDisposers.push(disposer);
    }

    const baseCtx: any = (() => {
      try {
        return rule.getContext();
      } catch {
        return undefined;
      }
    })();

    for (const depKey of deps) {
      if (depKey === 'fv:*') {
        continue;
      }
      // backward compat: treat unknown keys as formValues deps
      if (!depKey.startsWith('fv:') && !depKey.startsWith('ctx:')) {
        const depPath = pathKeyToNamePath(depKey);
        const disposer = reaction(
          () => getIn(this.valuesMirror, depPath),
          () => this.scheduleRule(rule.id),
        );
        state.depDisposers.push(disposer);
        continue;
      }

      if (depKey.startsWith('fv:')) {
        const inner = depKey.slice('fv:'.length);
        const depPath = pathKeyToNamePath(inner);
        const disposer = reaction(
          () => getIn(this.valuesMirror, depPath),
          () => this.scheduleRule(rule.id),
        );
        state.depDisposers.push(disposer);
        continue;
      }

      // ctx deps: ctx:<varName>[:<subPath>]
      const rest = depKey.slice('ctx:'.length);
      const sep = rest.indexOf(':');
      const varName = sep >= 0 ? rest.slice(0, sep) : rest;
      const subPath = sep >= 0 ? rest.slice(sep + 1) : '';

      const depPath = subPath ? (parsePathString(subPath).filter((seg) => typeof seg !== 'object') as NamePath) : [];
      const disposer = reaction(
        () => {
          const root = baseCtx ? baseCtx[varName] : undefined;
          return depPath.length ? getIn(root, depPath) : root;
        },
        () => this.scheduleRule(rule.id),
      );
      state.depDisposers.push(disposer);
    }
  }

  private getDefaultRuleId(model: any) {
    const forkId = model?.isFork ? String(model?.forkId ?? 'fork') : 'master';
    const uid = model?.uid ? String(model.uid) : String(model);
    return `default:${uid}:${forkId}`;
  }

  private getModelTargetNamePath(model: any): NamePath | null {
    const fp = model?.context?.fieldPathArray;
    if (Array.isArray(fp) && fp.length) return fp as NamePath;

    const props = typeof model?.getProps === 'function' ? model.getProps() : model?.props;
    const name = props?.name;
    if (Array.isArray(name)) return name as any;
    if (typeof name === 'string') {
      return name.includes('.') ? (name.split('.') as any) : ([name] as any);
    }
    return null;
  }

  private isModelInThisForm(model: any) {
    const block = model?.context?.blockModel;
    if (!block) return false;
    return String(block.uid) === String(this.model.uid);
  }
}
