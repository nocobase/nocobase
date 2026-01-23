/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isObservable, observable, observe, toJS } from '@formily/reactive';
import type { FormInstance } from 'antd';
import type { FlowModel } from '@nocobase/flow-engine';
import _ from 'lodash';
import { evaluateCondition } from './conditions';
import { createFormValuesProxy } from './deps';
import { createFormPatcher } from './form-patch';
import { namePathToPathKey, pathKeyToNamePath, resolveDynamicNamePath } from './path';
import { RuleEngine } from './rules';
import type { FormAssignRuleItem, FormValuesChangePayload, NamePath, Patch, SetOptions, ValueSource } from './types';
import { createTxId, MAX_WRITES_PER_PATH_PER_TX } from './utils';

type ObservableBinding = {
  source: ValueSource;
  dispose: () => void;
};

type FormBlockModel = FlowModel & {
  getAclActionName?: () => string;
};

export class FormValueRuntime {
  private readonly model: FormBlockModel;
  private readonly getForm: () => FormInstance;

  private readonly valuesMirror = observable({});
  private readonly explicitSet = new Set<string>();
  private readonly lastDefaultValueByPathKey = new Map<string, any>();
  private readonly lastWriteMetaByPathKey = new Map<string, { source: ValueSource; writeSeq: number }>();
  private readonly observableBindings = new Map<string, ObservableBinding>();
  private readonly changeTick = observable.ref(0);
  private readonly txWriteCounts = new Map<string, Map<string, number>>();
  private writeSeq = 0;

  private disposed = false;
  private suppressFormCallbackDepth = 0;

  private lastObservedChangedPaths: NamePath[] | null = null;
  private lastObservedSource: ValueSource | null = null;
  private lastObservedToken = 0;

  private readonly formValuesProxy: any;

  private mountedListener?: (payload: { model: FlowModel }) => void;
  private unmountedListener?: (payload: { model: FlowModel }) => void;

  private readonly formPatcher: ReturnType<typeof createFormPatcher>;
  private readonly ruleEngine: RuleEngine;

  constructor(options: { model: FormBlockModel; getForm: () => FormInstance }) {
    this.model = options.model;
    this.getForm = options.getForm;

    this.formPatcher = createFormPatcher({
      isSuppressed: () => this.isSuppressed(),
      getCallerContext: () => this.model?.context,
      setFormValues: this.setFormValues.bind(this),
    });

    this.ruleEngine = new RuleEngine({
      getBlockModelUid: () => String(this.model?.uid),
      getActionName: () => this.model?.getAclActionName?.() ?? this.model?.context?.actionName,
      getBlockContext: () => this.model?.context,
      getEngine: () => this.model?.context?.engine,
      getEngineModel: (uid) => this.model?.context?.engine?.getModel?.(uid) ?? null,
      isDisposed: () => this.disposed,
      valuesMirror: this.valuesMirror,
      changeTick: this.changeTick,
      getWriteSeq: () => this.writeSeq,
      txWriteCounts: this.txWriteCounts,
      createTrackingFormValues: (collector) =>
        createFormValuesProxy({
          valuesMirror: this.valuesMirror,
          basePath: [],
          collector,
          getFormValuesSnapshot: () => this.getFormValuesSnapshot(),
          getFormValueAtPath: (namePath) => this.getFormValueAtPath(namePath),
        }),
      tryResolveNamePath: (callerCtx, path) => this.tryResolveNamePath(callerCtx, path),
      getFormValueAtPath: (namePath) => this.getFormValueAtPath(namePath),
      setFormValues: (callerCtx, patch, ruleOptions) => this.setFormValues(callerCtx, patch, ruleOptions),
      findExplicitHit: (pathKey) => this.findExplicitHit(pathKey),
      lastDefaultValueByPathKey: this.lastDefaultValueByPathKey,
      lastWriteMetaByPathKey: this.lastWriteMetaByPathKey,
      observableBindings: this.observableBindings,
    });

    this.formValuesProxy = createFormValuesProxy({
      valuesMirror: this.valuesMirror,
      basePath: [],
      getFormValuesSnapshot: () => this.getFormValuesSnapshot(),
      getFormValueAtPath: (namePath) => this.getFormValueAtPath(namePath),
    });
  }

  /**
   * 同步“表单赋值”配置到运行时规则引擎。
   *
   * - mode=default → source=default（遵循 explicit/空值覆盖语义）
   * - mode=assign  → source=system（不受 explicit 影响，依赖变化时持续生效）
   */
  syncAssignRules(items: FormAssignRuleItem[]) {
    this.ruleEngine.syncAssignRules(items);
  }

  get formValues() {
    if (!this.disposed) {
      this.formPatcher.patch(this.getForm());
    }
    return this.formValuesProxy;
  }

  getFormValuesSnapshot() {
    if (!this.disposed) {
      const form = this.getForm();
      this.formPatcher.patch(form);
    }
    return this.getForm().getFieldsValue(true);
  }

  private getFormValueAtPath(namePath: NamePath) {
    return this.getForm().getFieldValue(namePath);
  }

  mount(options?: { sync?: boolean }) {
    if (this.disposed) return;

    this.formPatcher.patch(this.getForm());

    const engineEmitter = this.model?.flowEngine?.emitter;
    if (!engineEmitter) return;

    if (!this.mountedListener && !this.unmountedListener) {
      this.mountedListener = ({ model }: { model: FlowModel }) => {
        this.ruleEngine.onModelMounted(model);
      };
      this.unmountedListener = ({ model }: { model: FlowModel }) => {
        this.ruleEngine.onModelUnmounted(model);
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
      this.ruleEngine.enable();
    }
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;

    this.formPatcher.restore();

    const engineEmitter = this.model?.flowEngine?.emitter;
    if (engineEmitter && this.mountedListener && this.unmountedListener) {
      engineEmitter.off('model:mounted', this.mountedListener);
      engineEmitter.off('model:unmounted', this.unmountedListener);
    }

    this.ruleEngine.dispose();

    for (const binding of this.observableBindings.values()) {
      binding.dispose();
    }
    this.observableBindings.clear();

    this.txWriteCounts.clear();
  }

  isSuppressed() {
    return this.suppressFormCallbackDepth > 0;
  }

  handleFormFieldsChange(changedFields: Array<{ name?: NamePath | string | number; touched?: boolean }>) {
    if (this.disposed) return;
    const form = this.getForm();
    if (!form.getFieldValue) {
      return;
    }

    const changedPaths: NamePath[] = [];
    let bumpedWriteSeq = false;
    for (const field of changedFields || []) {
      const name = field?.name;
      const namePath: NamePath | null = Array.isArray(name)
        ? (name as NamePath)
        : typeof name === 'string' || typeof name === 'number'
          ? ([name] as NamePath)
          : null;
      if (!namePath?.length) continue;
      const nextValue = form.getFieldValue(namePath as any);
      const prevValue = _.get(this.valuesMirror, namePath);
      if (_.isEqual(nextValue, prevValue)) continue;
      if (!bumpedWriteSeq) {
        this.writeSeq += 1;
        bumpedWriteSeq = true;
      }
      _.set(this.valuesMirror, namePath, nextValue);
      changedPaths.push(namePath);
    }

    if (!changedPaths.length) return;
    this.bumpChangeTick();

    if (this.isSuppressed()) {
      return;
    }

    const isUser = changedFields.some((f) => f?.touched === true);
    const source: ValueSource = isUser ? 'user' : 'system';

    const writeSeq = this.writeSeq;
    for (const p of changedPaths) {
      this.lastWriteMetaByPathKey.set(namePathToPathKey(p), { source, writeSeq });
    }

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
    let bumpedWriteSeq = false;
    const actuallyChangedPaths: NamePath[] = [];
    for (const p of changedPaths) {
      if (!p?.length) continue;
      const nextValue = _.get(snapshot, p);
      const prevValue = _.get(this.valuesMirror, p);
      if (_.isEqual(prevValue, nextValue)) continue;
      if (!bumpedWriteSeq) {
        this.writeSeq += 1;
        bumpedWriteSeq = true;
      }
      _.set(this.valuesMirror, p, nextValue);
      hasMirrorChange = true;
      actuallyChangedPaths.push(p);
    }
    if (hasMirrorChange) {
      this.bumpChangeTick();
    }

    // 非 default 来源写入：需要使默认值永久失效（explicit）
    for (const p of changedPaths) {
      this.markExplicit(namePathToPathKey(p));
    }

    if (hasMirrorChange) {
      const writeSeq = this.writeSeq;
      for (const p of actuallyChangedPaths) {
        if (!p?.length) continue;
        this.lastWriteMetaByPathKey.set(namePathToPathKey(p), { source, writeSeq });
      }
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
        const patchKeys = Object.keys(patch || {});
        if (patchKeys.length) {
          this.writeSeq += 1;
        }
        this.suppressFormCallbackDepth++;
        try {
          form.setFieldsValue?.(patch);
          _.merge(this.valuesMirror, patch);
          this.bumpChangeTick();
        } finally {
          this.suppressFormCallbackDepth--;
        }

        const writeSeq = this.writeSeq;
        for (const k of patchKeys) {
          this.lastWriteMetaByPathKey.set(k, { source, writeSeq });
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
          if (!evaluateCondition(callerCtx, cond)) continue;
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

      this.writeSeq += 1;
      const writeSeq = this.writeSeq;

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
          _.set(this.valuesMirror, namePath, value);
          changedPaths.push(namePath);
        }
        this.bumpChangeTick();
      } finally {
        this.suppressFormCallbackDepth--;
      }

      for (const { pathKey } of filteredToWrite) {
        this.lastWriteMetaByPathKey.set(pathKey, { source, writeSeq });
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

    const prevValue = _.get(this.valuesMirror, namePath);
    if (_.isEqual(prevValue, nextValue)) return;

    this.writeSeq += 1;
    const writeSeq = this.writeSeq;

    this.suppressFormCallbackDepth++;
    try {
      form.setFieldValue?.(namePath, nextValue);
      _.set(this.valuesMirror, namePath, nextValue);
      this.bumpChangeTick();
    } finally {
      this.suppressFormCallbackDepth--;
    }

    this.lastWriteMetaByPathKey.set(pathKey, { source, writeSeq });

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

  private resolveNamePath(callerCtx: any, path: string | NamePath): NamePath {
    const resolved = this.tryResolveNamePath(callerCtx, path);
    if (!resolved) {
      throw new Error(`Failed to resolve path '${String(path)}'`);
    }
    return resolved;
  }

  private tryResolveNamePath(callerCtx: any, path: string | NamePath): NamePath | null {
    const fieldIndex = callerCtx?.model?.context?.fieldIndex ?? callerCtx?.fieldIndex;
    return resolveDynamicNamePath(path, fieldIndex);
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
    const namePath = pathKeyToNamePath(pathKey);
    const prefix: NamePath = [];

    // 规则：默认值（source=default）仅应被“同一路径”或“对象父级”显式写入所阻止。
    // 对于数组型父级（如 `users`），在用户“添加行/增删项”等操作时经常会被标记为 explicit，
    // 但这不应导致行内字段（如 `users[0].name`）的默认值永久失效。
    //
    // 因此：当某个前缀在完整路径上紧跟的是数字索引（数组容器），则忽略该前缀的 explicit 命中。
    for (let i = 0; i < namePath.length; i++) {
      prefix.push(namePath[i]);
      const key = namePathToPathKey(prefix as any);
      if (!this.explicitSet.has(key)) continue;

      const nextSeg = namePath[i + 1];
      if (typeof nextSeg === 'number') {
        // ignore array container explicit hit (e.g. explicit `users` shouldn't block `users[0].name` defaults)
        continue;
      }
      return key;
    }
    return null;
  }
}
