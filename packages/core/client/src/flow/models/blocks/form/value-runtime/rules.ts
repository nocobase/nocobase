/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isObservable, reaction, toJS } from '@formily/reactive';
import {
  createSafeDocument,
  createSafeNavigator,
  createSafeWindow,
  FlowContext,
  FlowModel,
  isRunJSValue,
  normalizeRunJSValue,
} from '@nocobase/flow-engine';
import _ from 'lodash';
import { evaluateCondition } from './conditions';
import { collectStaticDepsFromRunJSValue, collectStaticDepsFromTemplateValue, DepCollector, recordDep } from './deps';
import { namePathToPathKey, parsePathString, pathKeyToNamePath } from './path';
import type { FormAssignRuleItem, NamePath, Patch, SetOptions, ValueSource } from './types';
import { createTxId, isEmptyValue } from './utils';

/** Symbol to indicate rule value resolution should be skipped */
const SKIP_RULE_VALUE = Symbol('SKIP_RULE_VALUE');

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

type ObservableBinding = {
  source: ValueSource;
  dispose: () => void;
};

type AssignMode = 'default' | 'assign';

export type RuleEngineOptions = {
  getBlockModelUid: () => string;
  getActionName: () => string | undefined;
  getBlockContext: () => any;
  getEngineModel: (uid: string) => FlowModel | null;
  isDisposed: () => boolean;
  valuesMirror: any;
  changeTick: { value: number };
  txWriteCounts: Map<string, Map<string, number>>;
  createTrackingFormValues: (collector: DepCollector) => any;
  tryResolveNamePath: (callerCtx: any, path: string | NamePath) => NamePath | null;
  getFormValueAtPath: (namePath: NamePath) => any;
  setFormValues: (callerCtx: any, patch: Patch, options?: SetOptions) => Promise<void>;
  findExplicitHit: (pathKey: string) => string | null;
  lastDefaultValueByPathKey: Map<string, any>;
  observableBindings: Map<string, ObservableBinding>;
};

export class RuleEngine {
  private readonly options: RuleEngineOptions;

  private readonly rules = new Map<string, { rule: RuntimeRule; state: RuleState }>();
  private readonly assignRuleIdsByFieldUid = new Map<string, Set<string>>();
  private readonly pendingRuleIds = new Set<string>();
  private readonly ruleDebounceUntilById = new Map<string, number>();
  private readonly ruleDebounceTimersById = new Map<string, ReturnType<typeof setTimeout>>();

  private readonly defaultRuleIdsByMasterUid = new Map<string, Set<string>>();
  private readonly defaultRuleMasterDisposers = new Map<string, () => void>();

  private runningRules = false;
  private rulesEnabled = false;
  private currentRuleTxId: string | null = null;

  constructor(options: RuleEngineOptions) {
    this.options = options;
  }

  dispose() {
    for (const { state } of this.rules.values()) {
      state.depDisposers.forEach((d) => d());
    }
    this.rules.clear();
    this.pendingRuleIds.clear();
    this.assignRuleIdsByFieldUid.clear();

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
  }

  enable() {
    this.rulesEnabled = true;
    if (this.pendingRuleIds.size && !this.runningRules) {
      void this.flushRules();
    }
  }

  syncAssignRules(items: FormAssignRuleItem[]) {
    if (this.options.isDisposed()) return;
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
          const fieldModel = this.options.getEngineModel(fieldUid);
          return !!fieldModel && !!this.getModelTargetNamePath(fieldModel);
        },
        getTarget: () => {
          const fieldModel = this.options.getEngineModel(fieldUid);
          return this.getModelTargetNamePath(fieldModel) || [];
        },
        getValue: () => it?.value,
        getCondition: () => it?.condition,
        getContext: () => this.options.getBlockContext(),
      };

      this.rules.set(id, {
        rule,
        state: { deps: new Set(), depDisposers: [], runSeq: 0 },
      });

      this.scheduleRule(id);
    }
  }

  onModelMounted(model: FlowModel) {
    this.tryRegisterDefaultRuleInstance(model);
    this.tryScheduleAssignRulesOnModelChange(model);
  }

  onModelUnmounted(model: FlowModel) {
    this.tryUnregisterDefaultRuleInstance(model);
    this.tryScheduleAssignRulesOnModelChange(model);
  }

  private isModelInThisForm(model: FlowModel) {
    const block = model?.context?.blockModel;
    if (!block) return false;
    return String(block.uid) === String(this.options.getBlockModelUid());
  }

  private getDefaultRuleId(model: FlowModel) {
    const forkId = model?.['isFork'] ? String(model?.['forkId'] ?? 'fork') : 'master';
    const uid = model?.uid ? String(model.uid) : String(model);
    return `default:${uid}:${forkId}`;
  }

  private getModelTargetNamePath(model: FlowModel): NamePath | null {
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

  private isEditMode() {
    try {
      const actionName = this.options.getActionName();
      return actionName && actionName !== 'create';
    } catch {
      return false;
    }
  }

  private tryRegisterDefaultRuleInstance(model: FlowModel) {
    if (this.options.isDisposed()) return;
    if (!this.isModelInThisForm(model)) return;
    if (!model || typeof model !== 'object') return;

    const props = typeof model.getProps === 'function' ? model.getProps() : (model as any).props;
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

  private tryScheduleAssignRulesOnModelChange(model: FlowModel) {
    if (this.options.isDisposed()) return;
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

  private tryUnregisterDefaultRuleInstance(model: FlowModel) {
    if (this.options.isDisposed()) return;
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
      const targetNamePath = this.options.tryResolveNamePath(baseCtx, rawTarget as any);
      if (targetNamePath) {
        const targetKey = namePathToPathKey(targetNamePath);
        const existing = this.options.observableBindings.get(targetKey);
        if (existing && existing.source === entry.rule.source) {
          existing.dispose();
          this.options.observableBindings.delete(targetKey);
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
    if (this.options.isDisposed()) return;
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
      this.options.txWriteCounts.delete(txId);
    }
  }

  private async runRule(id: string) {
    const entry = this.rules.get(id);
    if (!entry) return;

    const { rule, state } = entry;
    state.runSeq += 1;
    const seq = state.runSeq;

    const ruleContext = this.prepareRuleContext(rule);
    const { targetNamePath, targetKey, clearDeps, disposeBinding } = ruleContext;

    // Check if rule should be skipped
    if (!this.shouldRunRule(rule, targetNamePath, targetKey)) {
      clearDeps(state);
      disposeBinding();
      return;
    }

    const { collector, evalCtx } = this.createRuleCollectorAndContext(rule, ruleContext);

    // Evaluate condition if present
    if (rule.getCondition) {
      const shouldContinue = await this.evaluateRuleCondition(rule, state, seq, evalCtx, collector);
      if (!shouldContinue) return;
    }

    // Resolve rule value
    const resolved = await this.resolveRuleValue(rule, state, seq, evalCtx, collector);
    if (resolved === SKIP_RULE_VALUE) return;
    if (seq !== state.runSeq) return;

    // Update dependencies
    this.commitRuleDeps(rule, state, collector);

    // Apply default rule specific logic
    if (rule.source === 'default') {
      const shouldApply = this.checkDefaultRuleCanApply(
        resolved,
        targetNamePath!,
        targetKey!,
        clearDeps,
        disposeBinding,
        state,
      );
      if (!shouldApply) return;
    }

    await this.options.setFormValues(evalCtx, [{ path: targetNamePath, value: resolved }], {
      source: rule.source,
      txId: this.currentRuleTxId || undefined,
    });
  }

  private prepareRuleContext(rule: RuntimeRule) {
    const baseCtx = rule.getContext();
    const rawTarget = rule.getTarget();
    const targetNamePath = this.options.tryResolveNamePath(baseCtx, rawTarget as any);
    const targetKey = targetNamePath ? namePathToPathKey(targetNamePath) : null;

    const clearDeps = (state: RuleState) => {
      state.depDisposers.forEach((d) => d());
      state.depDisposers = [];
      state.deps = new Set();
    };

    const disposeBinding = () => {
      if (!targetKey) return;
      const existing = this.options.observableBindings.get(targetKey);
      if (!existing) return;
      if (existing.source !== rule.source) return;
      existing.dispose();
      this.options.observableBindings.delete(targetKey);
    };

    return { baseCtx, targetNamePath, targetKey, clearDeps, disposeBinding };
  }

  private shouldRunRule(rule: RuntimeRule, targetNamePath: NamePath | null, targetKey: string | null): boolean {
    if (!rule.getEnabled()) return false;
    if (rule.source === 'default' && this.isEditMode()) return false;
    if (!targetNamePath || !targetKey) return false;
    if (rule.source === 'default' && this.options.findExplicitHit(targetKey)) return false;
    return true;
  }

  private createRuleCollectorAndContext(rule: RuntimeRule, ruleContext: ReturnType<typeof this.prepareRuleContext>) {
    const { baseCtx, targetNamePath } = ruleContext;
    const rawValue = rule.getValue();
    const isRunJS = isRunJSValue(rawValue);

    const collector: DepCollector = { deps: new Set(), wildcard: false };

    // 静态路径提取：覆盖"服务端解析但前端不触达 formValues 子路径"的场景
    if (rule.getCondition) {
      collectStaticDepsFromTemplateValue(rule.getCondition(), collector);
    }
    if (isRunJS) {
      collectStaticDepsFromRunJSValue(rawValue, collector);
    } else {
      collectStaticDepsFromTemplateValue(rawValue, collector);
    }
    // 规则可用性依赖 target 当前值（空/等于上次默认值）
    if (targetNamePath) {
      recordDep(targetNamePath, collector);
    }

    const evalCtx = this.createRuleEvaluationContext(baseCtx, collector);
    return { collector, evalCtx, rawValue, isRunJS };
  }

  private async evaluateRuleCondition(
    rule: RuntimeRule,
    state: RuleState,
    seq: number,
    evalCtx: any,
    collector: DepCollector,
  ): Promise<boolean> {
    const cond = rule.getCondition!();
    let resolvedCond = cond;
    if (cond) {
      try {
        resolvedCond = await evalCtx?.resolveJsonTemplate?.(cond);
      } catch {
        resolvedCond = cond;
      }
    }
    if (seq !== state.runSeq) return false;
    if (cond && !evaluateCondition(evalCtx, resolvedCond)) {
      this.commitRuleDeps(rule, state, collector);
      return false;
    }
    return true;
  }

  private async resolveRuleValue(
    rule: RuntimeRule,
    state: RuleState,
    seq: number,
    evalCtx: any,
    collector: DepCollector,
  ): Promise<any> {
    const rawValue = rule.getValue();
    const isRunJS = isRunJSValue(rawValue);

    if (isRunJS) {
      return this.resolveRunJSValue(rawValue, state, seq, evalCtx, collector, rule);
    }
    return this.resolveTemplateValue(rawValue, state, seq, evalCtx, collector, rule);
  }

  private async resolveRunJSValue(
    rawValue: any,
    state: RuleState,
    seq: number,
    evalCtx: any,
    collector: DepCollector,
    rule: RuntimeRule,
  ): Promise<any> {
    try {
      const { code, version } = normalizeRunJSValue(rawValue);
      const globals = this.createSafeGlobals();

      const ret = await evalCtx?.runjs?.(code, globals, { version });
      if (!ret?.success) {
        if (seq !== state.runSeq) return SKIP_RULE_VALUE;
        this.commitRuleDeps(rule, state, collector);
        return SKIP_RULE_VALUE;
      }
      return ret.value;
    } catch {
      if (seq !== state.runSeq) return SKIP_RULE_VALUE;
      this.commitRuleDeps(rule, state, collector);
      return SKIP_RULE_VALUE;
    }
  }

  private async resolveTemplateValue(
    rawValue: any,
    state: RuleState,
    seq: number,
    evalCtx: any,
    collector: DepCollector,
    rule: RuntimeRule,
  ): Promise<any> {
    try {
      return await evalCtx?.resolveJsonTemplate?.(rawValue);
    } catch {
      if (seq !== state.runSeq) return SKIP_RULE_VALUE;
      this.commitRuleDeps(rule, state, collector);
      return SKIP_RULE_VALUE;
    }
  }

  private createSafeGlobals(): Record<string, any> {
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
    return globals;
  }

  private commitRuleDeps(rule: RuntimeRule, state: RuleState, collector: DepCollector) {
    const nextDeps: RuleDeps = new Set(collector.deps);
    if (collector.wildcard) {
      nextDeps.add('fv:*');
    }
    this.updateRuleDeps(rule, state, nextDeps);
  }

  /**
   * Check if default rule value can be applied.
   * Default value can overwrite when:
   * 1. Current value is empty
   * 2. Current value equals the last default value (user hasn't modified it)
   */
  private checkDefaultRuleCanApply(
    resolved: any,
    targetNamePath: NamePath,
    targetKey: string,
    clearDeps: (state: RuleState) => void,
    disposeBinding: () => void,
    state: RuleState,
  ): boolean {
    if (typeof resolved === 'undefined') return false;

    const explicitHitAfterResolve = this.options.findExplicitHit(targetKey);
    if (explicitHitAfterResolve) {
      clearDeps(state);
      disposeBinding();
      return false;
    }

    const current = this.options.getFormValueAtPath(targetNamePath);
    const last = this.options.lastDefaultValueByPathKey.get(targetKey);
    const canOverwrite = isEmptyValue(current) || (typeof last !== 'undefined' && _.isEqual(current, last));

    // 若外部已把当前值更新为"解析后的默认值"，同步 lastDefault，避免后续默认值变更无法覆盖
    const nextSnapshot = isObservable(resolved) ? toJS(resolved) : resolved;
    if (!canOverwrite && _.isEqual(current, nextSnapshot)) {
      this.options.lastDefaultValueByPathKey.set(targetKey, nextSnapshot);
      return false;
    }

    return canOverwrite;
  }

  private createRuleEvaluationContext(baseCtx: any, collector: DepCollector) {
    const trackingFormValues = this.options.createTrackingFormValues(collector);
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
        () => this.options.changeTick.value,
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
          () => _.get(this.options.valuesMirror, depPath),
          () => this.scheduleRule(rule.id),
        );
        state.depDisposers.push(disposer);
        continue;
      }

      if (depKey.startsWith('fv:')) {
        const inner = depKey.slice('fv:'.length);
        const depPath = pathKeyToNamePath(inner);
        const disposer = reaction(
          () => _.get(this.options.valuesMirror, depPath),
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
          return depPath.length ? _.get(root, depPath) : root;
        },
        () => this.scheduleRule(rule.id),
      );
      state.depDisposers.push(disposer);
    }
  }
}
