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
import { getSubTableRowIdentity } from '../../../fields/AssociationFieldModel/SubTableFieldModel/rowIdentity';
import type {
  FormAssignRuleItem,
  FormValueWriteMeta,
  FormValuesChangePayload,
  NamePath,
  Patch,
  SetOptions,
  ValueSource,
} from './types';
import { createTxId, isEmptyValue, MAX_WRITES_PER_PATH_PER_TX } from './utils';

type ObservableBinding = {
  source: ValueSource;
  pathKey: string;
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
  private readonly lastWriteMetaByPathKey = new Map<string, FormValueWriteMeta>();
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

  canApplyDefaultValuePatch(namePath: NamePath, resolved: any) {
    if (!namePath?.length) return false;
    if (typeof resolved === 'undefined') return false;

    const pathKey = namePathToPathKey(namePath);
    const current = this.getFormValueAtPath(namePath);
    const last = this.lastDefaultValueByPathKey.get(pathKey);
    const nextSnapshot = isObservable(resolved) ? toJS(resolved) : resolved;
    const currentSnapshot = isObservable(current) ? toJS(current) : current;
    const currentEqualsLastDefault = typeof last !== 'undefined' && _.isEqual(currentSnapshot, last);
    const explicitHit = this.findExplicitHit(pathKey);

    if (explicitHit && !currentEqualsLastDefault) return false;

    const canOverwrite = isEmptyValue(current) || currentEqualsLastDefault;
    if (!canOverwrite && _.isEqual(current, nextSnapshot)) {
      this.lastDefaultValueByPathKey.set(pathKey, nextSnapshot);
      return false;
    }

    return canOverwrite;
  }

  recordDefaultValuePatch(namePath: NamePath, value?: any) {
    if (!namePath?.length) return;
    const pathKey = namePathToPathKey(namePath);
    const snapshot =
      arguments.length >= 2 ? (isObservable(value) ? toJS(value) : value) : this.getFormValueAtPath(namePath);
    this.lastDefaultValueByPathKey.set(pathKey, snapshot);
    const current = this.getFormValueAtPath(namePath);
    const currentSnapshot = isObservable(current) ? toJS(current) : current;
    if (_.isEqual(currentSnapshot, snapshot)) {
      this.clearExplicitForDefaultPatch(pathKey);
    }
  }

  private getFormValueAtPath(namePath: NamePath) {
    const form: any = this.getForm?.();
    if (form && typeof form.getFieldValue === 'function') {
      return form.getFieldValue(namePath as any);
    }
    if (form && typeof form.getFieldsValue === 'function') {
      const snapshot = form.getFieldsValue(true);
      return _.get(snapshot, namePath as any);
    }
    return undefined;
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

  resetAfterFormReset() {
    if (this.disposed) return;

    this.explicitSet.clear();
    this.lastDefaultValueByPathKey.clear();
    this.lastWriteMetaByPathKey.clear();
    this.txWriteCounts.clear();
    this.lastObservedChangedPaths = null;
    this.lastObservedSource = null;
    this.lastObservedToken += 1;

    for (const binding of this.observableBindings.values()) {
      binding.dispose();
    }
    this.observableBindings.clear();

    const snapshot = this.getFormValuesSnapshot();
    for (const key of Object.keys(this.valuesMirror)) {
      delete (this.valuesMirror as Record<string, any>)[key];
    }
    if (snapshot && typeof snapshot === 'object') {
      _.merge(this.valuesMirror, snapshot);
    }

    this.writeSeq += 1;
    this.bumpChangeTick();
    this.ruleEngine.rescheduleAllRules();
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
    const touchedChangedPathKeys = new Set<string>();
    let hasMeaningfulTouchedChange = false;
    let bumpedWriteSeq = false;
    for (const field of changedFields || []) {
      const name = field?.name;
      const namePath = this.normalizeObservedNamePath(name);
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
      const isMeaningfulTouched =
        field?.touched === true && !this.shouldIgnoreSyntheticTouchedInit(namePath, prevValue, nextValue);
      if (isMeaningfulTouched) {
        const pathKey = namePathToPathKey(namePath);
        if (!this.shouldKeepDefaultPathValueEnabled(namePath, nextValue)) {
          touchedChangedPathKeys.add(pathKey);
          hasMeaningfulTouchedChange = true;
        }
      }
    }

    if (!changedPaths.length) return;

    const suppressed = this.isSuppressed();
    if (!suppressed && touchedChangedPathKeys.size) {
      for (const key of touchedChangedPathKeys) {
        this.markExplicit(key);
      }
    }

    this.bumpChangeTick();

    if (suppressed) {
      return;
    }

    const isUser = hasMeaningfulTouchedChange;
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

  private shouldIgnoreSyntheticTouchedInit(namePath: NamePath, prevValue: any, nextValue: any) {
    if (!namePath?.length) return false;
    if (typeof prevValue !== 'undefined') return false;
    if (!isEmptyValue(nextValue)) return false;

    for (let i = namePath.length - 1; i >= 0; i--) {
      if (typeof namePath[i] !== 'number') continue;
      const rowPath = namePath.slice(0, i + 1);
      const rowValue = this.getFormValueAtPath(rowPath);
      return !!rowValue?.__is_new__;
    }

    return false;
  }

  private isDeletedArrayItemPath(path: NamePath | string, snapshot: any) {
    const namePath = Array.isArray(path) ? path : pathKeyToNamePath(path);
    if (!namePath?.length) return false;

    for (let i = namePath.length - 1; i >= 0; i--) {
      if (typeof namePath[i] !== 'number') continue;
      const rowPath = namePath.slice(0, i + 1);
      return typeof _.get(snapshot, rowPath as any) === 'undefined';
    }

    return false;
  }

  private pruneDeletedArrayItemState(snapshot: any) {
    for (const key of Array.from(this.explicitSet)) {
      if (!this.isDeletedArrayItemPath(key, snapshot)) continue;
      this.explicitSet.delete(key);
    }

    for (const key of Array.from(this.lastDefaultValueByPathKey.keys())) {
      if (!this.isDeletedArrayItemPath(key, snapshot)) continue;
      this.lastDefaultValueByPathKey.delete(key);
    }

    for (const key of Array.from(this.lastWriteMetaByPathKey.keys())) {
      if (!this.isDeletedArrayItemPath(key, snapshot)) continue;
      this.lastWriteMetaByPathKey.delete(key);
    }

    for (const [key, binding] of Array.from(this.observableBindings.entries())) {
      if (!this.isDeletedArrayItemPath(key, snapshot)) continue;
      binding.dispose();
      this.observableBindings.delete(key);
    }
  }

  private getArrayItemTargetKey(arrayPath?: NamePath): string | string[] {
    let collection = this.model?.context?.collection;
    let field: any;
    let lastAssociationField: any;
    for (const seg of arrayPath || []) {
      if (typeof seg === 'number') continue;
      if (typeof seg !== 'string' || !collection?.getField) break;

      field = collection?.getField?.(seg);
      if (!field?.isAssociationField?.()) break;
      lastAssociationField = field;
      collection = field?.targetCollection;
    }

    const raw =
      lastAssociationField?.targetCollection?.filterTargetKey ??
      lastAssociationField?.targetCollection?.filterByTk ??
      lastAssociationField?.targetKey;
    if (Array.isArray(raw)) {
      const keys = raw.filter((key): key is string => typeof key === 'string' && !!key);
      return keys.length ? keys : 'id';
    }
    return typeof raw === 'string' && raw ? raw : 'id';
  }

  private getArrayItemIdentity(item: any, arrayPath?: NamePath) {
    return getSubTableRowIdentity(item, this.getArrayItemTargetKey(arrayPath));
  }

  private reconcileArrayItemState(rawChangedPaths: NamePath[], changedValues: any, snapshot: any) {
    const seenPathKeys = new Set<string>();

    for (const path of rawChangedPaths || []) {
      if (!path?.length) continue;
      const pathKey = namePathToPathKey(path);
      if (seenPathKeys.has(pathKey)) continue;
      seenPathKeys.add(pathKey);

      const prevValue = _.get(this.valuesMirror, path as any);
      const nextValue = this.getObservedChangedValue(path, changedValues, snapshot);
      if (!Array.isArray(prevValue) || !Array.isArray(nextValue)) continue;

      const nextIndexByIdentity = new Map<string, number>();
      nextValue.forEach((item, index) => {
        const identity = this.getArrayItemIdentity(item, path);
        if (identity) {
          nextIndexByIdentity.set(identity, index);
        }
      });

      if (!nextIndexByIdentity.size) continue;

      this.reconcileArrayItemSet(this.explicitSet, path, prevValue, nextIndexByIdentity);
      this.reconcileArrayItemMap(this.lastDefaultValueByPathKey, path, prevValue, nextIndexByIdentity);
      this.reconcileArrayItemMap(this.lastWriteMetaByPathKey, path, prevValue, nextIndexByIdentity);
      this.reconcileObservableBindings(path, prevValue, nextIndexByIdentity);
    }
  }

  private getReconciledArrayItemPath(
    pathKey: string,
    arrayPath: NamePath,
    prevItems: any[],
    nextIndexByIdentity: Map<string, number>,
  ) {
    const namePath = pathKeyToNamePath(pathKey);
    if (namePath.length <= arrayPath.length) return { action: 'keep' as const };

    for (let i = 0; i < arrayPath.length; i++) {
      if (namePath[i] !== arrayPath[i]) return { action: 'keep' as const };
    }

    const oldIndex = namePath[arrayPath.length];
    if (typeof oldIndex !== 'number') return { action: 'keep' as const };

    const identity = this.getArrayItemIdentity(prevItems[oldIndex], arrayPath);
    if (!identity) return { action: 'keep' as const };

    const nextIndex = nextIndexByIdentity.get(identity);
    if (nextIndex == null) return { action: 'delete' as const };
    if (nextIndex === oldIndex) return { action: 'keep' as const };

    const nextPath = [...namePath];
    nextPath[arrayPath.length] = nextIndex;
    return { action: 'move' as const, key: namePathToPathKey(nextPath) };
  }

  private reconcileArrayItemSet(
    target: Set<string>,
    arrayPath: NamePath,
    prevItems: any[],
    nextIndexByIdentity: Map<string, number>,
  ) {
    const nextEntries = new Set<string>();
    let changed = false;

    for (const key of target) {
      const result = this.getReconciledArrayItemPath(key, arrayPath, prevItems, nextIndexByIdentity);
      if (result.action === 'delete') {
        changed = true;
        continue;
      }
      if (result.action === 'move') {
        changed = true;
        nextEntries.add(result.key);
        continue;
      }
      nextEntries.add(key);
    }

    if (!changed) return;
    target.clear();
    for (const key of nextEntries) {
      target.add(key);
    }
  }

  private reconcileArrayItemMap<T>(
    target: Map<string, T>,
    arrayPath: NamePath,
    prevItems: any[],
    nextIndexByIdentity: Map<string, number>,
  ) {
    const nextEntries = new Map<string, T>();
    let changed = false;

    for (const [key, value] of target) {
      const result = this.getReconciledArrayItemPath(key, arrayPath, prevItems, nextIndexByIdentity);
      if (result.action === 'delete') {
        changed = true;
        continue;
      }
      if (result.action === 'move') {
        changed = true;
        nextEntries.set(result.key, value);
        continue;
      }
      nextEntries.set(key, value);
    }

    if (!changed) return;
    target.clear();
    for (const [key, value] of nextEntries) {
      target.set(key, value);
    }
  }

  private reconcileObservableBindings(arrayPath: NamePath, prevItems: any[], nextIndexByIdentity: Map<string, number>) {
    const nextEntries = new Map<string, ObservableBinding>();
    let changed = false;

    for (const [key, binding] of this.observableBindings) {
      const result = this.getReconciledArrayItemPath(key, arrayPath, prevItems, nextIndexByIdentity);
      if (result.action === 'delete') {
        changed = true;
        binding.dispose();
        continue;
      }
      if (result.action === 'move') {
        changed = true;
        binding.pathKey = result.key;
        nextEntries.set(result.key, binding);
        continue;
      }
      nextEntries.set(key, binding);
    }

    if (!changed) return;
    this.observableBindings.clear();
    for (const [key, binding] of nextEntries) {
      this.observableBindings.set(key, binding);
    }
  }

  private getObservedChangedValue(path: NamePath, changedValues: any, snapshot: any) {
    if (_.has(snapshot, path as any)) {
      return _.get(snapshot, path as any);
    }

    if (path?.length === 1) {
      const key = path[0];
      if (
        (typeof key === 'string' || typeof key === 'number') &&
        changedValues &&
        Object.prototype.hasOwnProperty.call(changedValues, key)
      ) {
        return changedValues[key];
      }
    }

    return _.get(snapshot, path as any);
  }

  private getObservedSnapshot(changedValues: any, snapshot: any) {
    if (!changedValues || typeof changedValues !== 'object') return snapshot;
    if (!snapshot || typeof snapshot !== 'object') return changedValues;

    let observed = snapshot;
    for (const key of Object.keys(changedValues)) {
      if (_.has(observed, [key])) continue;
      if (observed === snapshot) {
        observed = Array.isArray(snapshot) ? [...snapshot] : { ...snapshot };
      }
      _.set(observed, [key], changedValues[key]);
    }

    return observed;
  }

  handleFormValuesChange(changedValues: any, allValues: any) {
    if (this.disposed) return;
    if (this.isSuppressed()) {
      return;
    }

    const changedValuePaths: NamePath[] = Object.keys(changedValues || {}).map((k) => [k]);
    const rawChangedPaths: NamePath[] =
      this.lastObservedChangedPaths && this.lastObservedChangedPaths.length
        ? this.lastObservedChangedPaths
        : changedValuePaths;

    const source: ValueSource = this.lastObservedSource ?? 'user';

    // clear observed paths to avoid leaking into next events
    this.lastObservedChangedPaths = null;
    this.lastObservedSource = null;

    // 子表格的 changedValues 可能只包含局部行对象，diff 必须以 form 当前完整快照为准，
    // 否则缺失的 sibling 字段会被误判为用户清空。
    const formSnapshot = this.getFormValuesSnapshot();
    const rawSnapshot =
      formSnapshot && typeof formSnapshot === 'object'
        ? formSnapshot
        : allValues && typeof allValues === 'object'
          ? allValues
          : changedValues;
    const snapshot = this.getObservedSnapshot(changedValues, rawSnapshot);
    this.reconcileArrayItemState([...rawChangedPaths, ...changedValuePaths], changedValues, snapshot);
    this.pruneDeletedArrayItemState(snapshot);

    const explicitPaths = this.deriveExplicitPaths(rawChangedPaths, changedValues, snapshot, this.valuesMirror).filter(
      (path) => !this.isDeletedArrayItemPath(path, snapshot),
    );

    let hasMirrorChange = false;
    let bumpedWriteSeq = false;
    const actuallyChangedPaths: NamePath[] = [];
    for (const p of rawChangedPaths) {
      if (!p?.length) continue;
      const nextValue = this.getObservedChangedValue(p, changedValues, snapshot);
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

    const explicitPathsToMark: NamePath[] = [];
    for (const p of explicitPaths) {
      if (this.shouldKeepDefaultPathEnabled(p, snapshot)) {
        continue;
      }
      explicitPathsToMark.push(p);
    }

    // 非 default 来源写入：需要使默认值永久失效（explicit）
    for (const p of explicitPathsToMark) {
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
      changedPaths: rawChangedPaths,
      changedValues,
      allValues: snapshot,
      allValuesSnapshot: snapshot,
    });
  }

  private deriveExplicitPaths(rawChangedPaths: NamePath[], changedValues: any, snapshot: any, valuesMirrorBefore: any) {
    const explicitPaths: NamePath[] = [];
    const seen = new Set<string>();

    for (const path of rawChangedPaths || []) {
      if (!path?.length) continue;
      const prevValue = _.get(valuesMirrorBefore, path as any);
      const nextValue = this.getObservedChangedValue(path, changedValues, snapshot);
      this.collectExplicitDiffPaths(prevValue, nextValue, path, explicitPaths, seen);
    }

    return explicitPaths;
  }

  private collectExplicitDiffPaths(
    prevValue: any,
    nextValue: any,
    basePath: NamePath,
    explicitPaths: NamePath[],
    seen: Set<string>,
  ): number {
    if (_.isEqual(prevValue, nextValue)) return 0;

    const prevIsArray = Array.isArray(prevValue);
    const nextIsArray = Array.isArray(nextValue);

    if (prevIsArray || nextIsArray) {
      if (prevIsArray && nextIsArray) {
        const sharedLength = Math.min(prevValue.length, nextValue.length);
        let nestedCount = 0;
        for (let index = 0; index < sharedLength; index++) {
          nestedCount += this.collectExplicitDiffPaths(
            prevValue[index],
            nextValue[index],
            [...basePath, index],
            explicitPaths,
            seen,
          );
        }
        return nestedCount;
      }

      return this.pushExplicitPath(basePath, explicitPaths, seen) ? 1 : 0;
    }

    const prevIsObject = this.isPlainObjectValue(prevValue);
    const nextIsObject = this.isPlainObjectValue(nextValue);

    if (prevIsObject || nextIsObject) {
      if (prevIsObject && nextIsObject) {
        const keys = new Set([...Object.keys(prevValue), ...Object.keys(nextValue)]);
        let nestedCount = 0;
        for (const key of keys) {
          nestedCount += this.collectExplicitDiffPaths(
            prevValue[key],
            nextValue[key],
            [...basePath, key],
            explicitPaths,
            seen,
          );
        }

        if (nestedCount === 0 && this.isObjectCleared(prevValue, nextValue)) {
          return this.pushExplicitPath(basePath, explicitPaths, seen) ? 1 : 0;
        }

        return nestedCount;
      }

      if (this.isObjectCleared(prevValue, nextValue)) {
        return this.pushExplicitPath(basePath, explicitPaths, seen) ? 1 : 0;
      }

      return this.pushExplicitPath(basePath, explicitPaths, seen) ? 1 : 0;
    }

    return this.pushExplicitPath(basePath, explicitPaths, seen) ? 1 : 0;
  }

  private pushExplicitPath(path: NamePath, explicitPaths: NamePath[], seen: Set<string>): boolean {
    if (!path?.length) return false;
    const key = namePathToPathKey(path);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    explicitPaths.push([...path]);
    return true;
  }

  private isPlainObjectValue(value: any): value is Record<string, any> {
    return _.isPlainObject(value);
  }

  private isObjectCleared(prevValue: any, nextValue: any): boolean {
    if (!this.isPlainObjectValue(prevValue)) return false;
    if (nextValue == null) return true;
    if (this.isPlainObjectValue(nextValue) && Object.keys(nextValue).length === 0) return true;
    return false;
  }

  async setFormValues(callerCtx: any, patch: Patch, options?: SetOptions) {
    if (this.disposed) return;
    const form = this.getForm?.();
    if (!form) return;

    const source: ValueSource = options?.source ?? 'system';
    const triggerEvent = options?.triggerEvent !== false;
    const txId = options?.txId ?? createTxId();
    const markExplicit = options?.markExplicit ?? (source !== 'default' && source !== 'linkage');
    const ownsTxId = typeof options?.txId === 'undefined';

    const linkageScopeDepth =
      source === 'linkage' && Number.isFinite(Number(options?.linkageScopeDepth))
        ? Number(options?.linkageScopeDepth)
        : 0;
    const linkageTxId =
      source === 'linkage' && typeof options?.linkageTxId === 'string' && options.linkageTxId
        ? String(options.linkageTxId)
        : undefined;

    const shouldSkipByLinkageScope = (pathKey: string): boolean => {
      if (source !== 'linkage') return false;
      if (!linkageTxId) return false;
      const lastWrite = this.lastWriteMetaByPathKey.get(pathKey);
      if (!lastWrite) return false;
      if (lastWrite.source !== 'linkage') return false;
      if (!lastWrite.linkageTxId || lastWrite.linkageTxId !== linkageTxId) return false;
      const lastDepth = Number.isFinite(Number(lastWrite.linkageScopeDepth)) ? Number(lastWrite.linkageScopeDepth) : 0;
      return lastDepth > linkageScopeDepth;
    };

    const buildWriteMeta = (writeSeq: number): FormValueWriteMeta => {
      if (source === 'linkage') {
        return {
          source,
          writeSeq,
          linkageScopeDepth,
          linkageTxId,
        };
      }
      return {
        source,
        writeSeq,
      };
    };

    const buildChangePayload = (payload: FormValuesChangePayload): FormValuesChangePayload => {
      if (source === 'linkage' && linkageTxId) {
        return {
          ...payload,
          linkageTxId,
        };
      }
      return payload;
    };

    try {
      const changedPaths: NamePath[] = [];

      if (!Array.isArray(patch)) {
        const patchEntries = Object.entries(patch || {}).filter(([pathKey]) => !shouldSkipByLinkageScope(pathKey));
        const patchToApply = Object.fromEntries(patchEntries);
        const patchKeys = patchEntries.map(([pathKey]) => pathKey);
        if (!patchKeys.length) {
          return;
        }
        if (patchKeys.length) {
          this.writeSeq += 1;
        }
        this.suppressFormCallbackDepth++;
        try {
          for (const [pathKey, rawValue] of patchEntries) {
            const value = isObservable(rawValue) ? toJS(rawValue) : rawValue;
            if (typeof form.setFieldValue === 'function') {
              form.setFieldValue(pathKey, value);
            } else if (typeof (form as any).setFields === 'function') {
              (form as any).setFields([{ name: pathKey, value }]);
            } else {
              form.setFieldsValue?.({ [pathKey]: value });
            }
            _.set(this.valuesMirror, [pathKey], value);
          }
          this.bumpChangeTick();
        } finally {
          this.suppressFormCallbackDepth--;
        }

        const writeSeq = this.writeSeq;
        for (const k of patchKeys) {
          this.lastWriteMetaByPathKey.set(k, buildWriteMeta(writeSeq));
        }

        if (markExplicit) {
          for (const k of patchKeys) {
            this.markExplicit(k);
          }
        }

        if (triggerEvent) {
          const allValues = this.getFormValuesSnapshot();
          this.emitFormValuesChange(
            buildChangePayload({
              source,
              txId,
              changedPaths: patchKeys.map((k) => [k]),
              changedValues: patchToApply,
              allValues,
              allValuesSnapshot: allValues,
            }),
          );
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

        if (shouldSkipByLinkageScope(pathKey)) continue;

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
        this.lastWriteMetaByPathKey.set(pathKey, buildWriteMeta(writeSeq));
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

      for (const { rawValue, pathKey } of filteredToWrite) {
        if (!isObservable(rawValue)) continue;
        const obs = rawValue;

        const binding: ObservableBinding = { source, pathKey, dispose: () => {} };
        const disposer = observe(obs, () => {
          const currentPathKey = binding.pathKey;
          this.applyBoundValue(
            callerCtx,
            pathKeyToNamePath(currentPathKey),
            currentPathKey,
            toJS(obs),
            source,
            linkageScopeDepth,
            linkageTxId,
          );
        });
        binding.dispose = disposer;

        const existing = this.observableBindings.get(pathKey);
        if (existing) {
          existing.dispose();
        }
        this.observableBindings.set(pathKey, binding);
      }

      if (triggerEvent) {
        const allValues = this.getFormValuesSnapshot();
        this.emitFormValuesChange(
          buildChangePayload({
            source,
            txId,
            changedPaths,
            changedValues: {},
            allValues,
            allValuesSnapshot: allValues,
          }),
        );
      }
    } finally {
      if (ownsTxId) {
        this.txWriteCounts.delete(txId);
      }
    }
  }

  private applyBoundValue(
    callerCtx: any,
    namePath: NamePath,
    pathKey: string,
    nextValue: any,
    source: ValueSource,
    linkageScopeDepth?: number,
    linkageTxId?: string,
  ) {
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

    const writeMeta: FormValueWriteMeta =
      source === 'linkage'
        ? {
            source,
            writeSeq,
            linkageScopeDepth: Number.isFinite(Number(linkageScopeDepth)) ? Number(linkageScopeDepth) : 0,
            linkageTxId: typeof linkageTxId === 'string' && linkageTxId ? linkageTxId : undefined,
          }
        : {
            source,
            writeSeq,
          };

    this.lastWriteMetaByPathKey.set(pathKey, writeMeta);

    const txId = createTxId();
    const allValues = this.getFormValuesSnapshot();
    const payload: FormValuesChangePayload = {
      source,
      txId,
      changedPaths: [namePath],
      changedValues: {},
      allValues,
      allValuesSnapshot: allValues,
    };
    if (source === 'linkage' && linkageTxId) {
      payload.linkageTxId = linkageTxId;
    }
    this.emitFormValuesChange(payload);

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
    const preserveDescendantDefaults = this.shouldPreserveDescendantDefaultsOnExplicit(pathKey);

    // explicit 后默认值永远失效：清理该路径及其子路径的 lastDefault 记录，避免误判“仍是默认值”
    for (const k of Array.from(this.lastDefaultValueByPathKey.keys())) {
      const isDescendant = k.startsWith(`${pathKey}.`) || k.startsWith(`${pathKey}[`);
      if (k === pathKey || (!preserveDescendantDefaults && isDescendant)) {
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

  private normalizeObservedNamePath(name: NamePath | string | number | undefined): NamePath | null {
    if (Array.isArray(name)) return name as NamePath;
    if (typeof name === 'number') return [name];
    if (typeof name !== 'string' || !name) return null;
    const parsed = pathKeyToNamePath(name);
    return parsed.length ? parsed : [name];
  }

  private clearExplicitForDefaultPatch(pathKey: string) {
    for (const key of Array.from(this.explicitSet)) {
      if (key === pathKey || key.startsWith(`${pathKey}.`) || key.startsWith(`${pathKey}[`)) {
        this.explicitSet.delete(key);
      }
    }
  }

  private shouldPreserveDescendantDefaultsOnExplicit(pathKey: string) {
    const value = this.getFormValueAtPath(pathKeyToNamePath(pathKey));
    return Array.isArray(value);
  }

  private shouldKeepDefaultPathEnabled(namePath: NamePath, snapshot: any) {
    return this.shouldKeepDefaultPathValueEnabled(namePath, _.get(snapshot, namePath as any));
  }

  private shouldKeepDefaultPathValueEnabled(namePath: NamePath, value: any) {
    const pathKey = namePathToPathKey(namePath);
    const last = this.lastDefaultValueByPathKey.get(pathKey);
    if (typeof last === 'undefined') return false;

    const nextSnapshot = isObservable(value) ? toJS(value) : value;
    return _.isEqual(nextSnapshot, last);
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
