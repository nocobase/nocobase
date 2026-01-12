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
import { isToManyAssociationField } from '../../../../internal/utils/modelUtils';

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
  getEngine: () => any;
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
  private readonly assignTemplatesByTargetPath = new Map<
    string,
    Array<FormAssignRuleItem & { __key: string; __order: number }>
  >();
  /** 当前表单中“已配置到 UI 的字段（FormItemModel）”的 targetPath 集合，用于避免对 row grid 重复注册规则 */
  private readonly formItemTargetPaths = new Set<string>();
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

  private getCollectionFromContext(baseCtx: any): any | undefined {
    return baseCtx?.collection ?? baseCtx?.model?.context?.collection;
  }

  private getRootCollection(): any | undefined {
    const blockCtx = this.options.getBlockContext();
    return this.getCollectionFromContext(blockCtx);
  }

  private shouldCreateBlockLevelAssignRule(targetPath: string): boolean {
    const blockCtx = this.options.getBlockContext();
    let collection = this.getCollectionFromContext(blockCtx);
    if (!collection?.getField) return true;

    const segs = parsePathString(targetPath).filter((seg) => typeof seg !== 'object') as NamePath;
    if (segs.length <= 1) return true;

    for (let i = 0; i < segs.length - 1; i++) {
      const seg = segs[i];
      if (typeof seg !== 'string') continue;

      const field = collection?.getField?.(seg);
      if (!field?.isAssociationField?.()) break;

      // 对多关联：若后续没有显式 index，则 block 级无法确定要写入哪一行，必须等 row fork 上下文
      if (isToManyAssociationField(field)) {
        const next = segs[i + 1];
        if (typeof next !== 'number') {
          return false;
        }
        // 已显式指定 index（如 users[0].nickname）：跳过 index 段继续解析
        i += 1;
      }

      collection = field?.targetCollection;
      if (!collection?.getField) break;
    }

    return true;
  }

  /**
   * 对关联字段嵌套属性（如 user.name / user.profile.name）：
   * - 依赖应包含关联对象本身（user / user.profile），否则当关联对象从 null -> {id} 时，user.name 仍为 undefined，无法触发 rule re-run。
   * - 写入前需校验关联对象已存在，避免隐式创建关联对象。
   */
  private collectAssociationPrefixPaths(baseCtx: any, targetNamePath: NamePath): NamePath[] {
    const out: NamePath[] = [];
    let collection = this.getRootCollection() || this.getCollectionFromContext(baseCtx);
    if (!collection?.getField) return out;

    const prefix: NamePath = [];
    for (let i = 0; i < targetNamePath.length - 1; i++) {
      const seg = targetNamePath[i];
      if (typeof seg !== 'string') break;

      const field = collection?.getField?.(seg);
      if (!field?.isAssociationField?.()) break;

      prefix.push(seg);

      // 对多关联：需要将 index 一并纳入 prefix（如 users[0]），否则无法检查/追踪行内的关联对象
      if (isToManyAssociationField(field)) {
        const next = targetNamePath[i + 1];
        if (typeof next !== 'number') break;
        prefix.push(next);
        i += 1;
      }

      out.push([...prefix]);
      collection = (field as any)?.targetCollection;
      if (!collection?.getField) break;
    }

    return out;
  }

  private shouldSkipToManyAssociationWriteWithoutIndex(baseCtx: any, targetNamePath: NamePath): boolean {
    let collection = this.getRootCollection() || this.getCollectionFromContext(baseCtx);
    if (!collection?.getField) return false;

    for (let i = 0; i < targetNamePath.length - 1; i++) {
      const seg = targetNamePath[i];
      if (typeof seg !== 'string') continue;

      const field = collection?.getField?.(seg);
      if (!field?.isAssociationField?.()) break;

      if (isToManyAssociationField(field)) {
        const next = targetNamePath[i + 1];
        if (typeof next !== 'number') {
          return true;
        }
        i += 1;
      }

      collection = field?.targetCollection;
      if (!collection?.getField) break;
    }

    return false;
  }

  private shouldSkipAssociationNestedWrite(baseCtx: any, targetNamePath: NamePath): boolean {
    const prefixes = this.collectAssociationPrefixPaths(baseCtx, targetNamePath);
    if (!prefixes.length) return false;

    for (const p of prefixes) {
      const v = this.options.getFormValueAtPath(p);
      if (v == null) return true;
      if (typeof v !== 'object') return true;
    }

    return false;
  }

  dispose() {
    for (const { state } of this.rules.values()) {
      state.depDisposers.forEach((d) => d());
    }
    this.rules.clear();
    this.pendingRuleIds.clear();
    this.assignTemplatesByTargetPath.clear();

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
    const next = raw.map((item, index) => ({
      ...item,
      key: item?.key ? String(item.key) : `idx:${index}`,
    }));
    const prefix = 'form-assign:';

    // 1) 清理旧的 assign 规则实例（含 block 级与 fork 级）
    for (const id of Array.from(this.rules.keys())) {
      if (!id.startsWith(prefix)) continue;
      this.removeRule(id);
    }
    this.assignTemplatesByTargetPath.clear();
    this.formItemTargetPaths.clear();

    // 2) 归一化模板：按 targetPath 分组，后续在 model:mounted 时按实例注册
    let order = 0;
    for (const item of next) {
      const targetPath = item?.targetPath ? String(item.targetPath) : '';
      if (!targetPath) continue;
      const arr = this.assignTemplatesByTargetPath.get(targetPath) || [];
      order += 1;
      arr.push({ ...(item as any), __key: String(item.key), __order: order });
      this.assignTemplatesByTargetPath.set(targetPath, arr);
    }

    // 3) 为当前已存在的模型实例创建 rule（含 fork）；对“无对应字段模型”的模板创建 block 级 rule
    const engine = this.options.getEngine();
    const matchedTargetPaths = new Set<string>();
    if (engine?.forEachModel) {
      // 3.1) 记录当前表单中已配置字段（FormItemModel）的 targetPath，避免在 row grid 上重复注册
      engine.forEachModel((model: FlowModel) => {
        if (!this.isModelInThisForm(model)) return;
        if (!(model as any)?.subModels?.field) return;
        const p = this.getModelTargetPath(model);
        if (p) this.formItemTargetPaths.add(p);
      });

      const visit = (model: FlowModel) => {
        this.tryRegisterAssignRuleInstancesForModel(model, matchedTargetPaths);

        // fork models（例如子表单行内 item fork / 字段 fork）不会被注册到 FlowEngine.modelInstances，
        // 因此不会出现在 engine.forEachModel 中；需要从 master.forks 中补齐，确保保存后 syncAssignRules 也能覆盖已挂载的子表单行。
        const forks: any = (model as any)?.forks;
        if (forks && typeof forks.forEach === 'function') {
          forks.forEach((fork: any) => {
            if (!fork || (fork as any)?.disposed) return;
            this.tryRegisterAssignRuleInstancesForModel(fork as any, matchedTargetPaths);
          });
        }
      };
      engine.forEachModel((model: FlowModel) => {
        visit(model);
      });
    }

    // block 级（嵌套属性等）：当当前 form 内没有任何模型命中该 targetPath 时，使用 blockContext 运行
    for (const [targetPath, templates] of this.assignTemplatesByTargetPath.entries()) {
      if (matchedTargetPaths.has(targetPath)) continue;
      if (!this.shouldCreateBlockLevelAssignRule(targetPath)) continue;
      for (const template of templates) {
        const mode: AssignMode = template?.mode === 'default' ? 'default' : 'assign';
        const source: ValueSource = mode === 'default' ? 'default' : 'system';
        const enabled = template?.enable !== false;
        const id = `${prefix}${template.__key}:block`;
        if (this.rules.has(id)) this.removeRule(id);

        const rule: RuntimeRule = {
          id,
          source,
          priority: 10 + (template.__order || 0),
          debounceMs: 0,
          getEnabled: () => enabled && !!targetPath,
          getTarget: () => targetPath,
          getValue: () => template?.value,
          getCondition: () => template?.condition,
          getContext: () => this.options.getBlockContext(),
        };

        this.rules.set(id, { rule, state: { deps: new Set(), depDisposers: [], runSeq: 0 } });
        this.scheduleRule(id);
      }
    }
  }

  onModelMounted(model: FlowModel) {
    this.tryRegisterDefaultRuleInstance(model);
    this.tryRegisterAssignRuleInstancesForModel(model);
  }

  onModelUnmounted(model: FlowModel) {
    this.tryUnregisterDefaultRuleInstance(model);
    this.tryUnregisterAssignRuleInstancesForModel(model);
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

  private getModelTargetPath(model: FlowModel): string | null {
    try {
      const init = (model as any)?.getStepParams?.('fieldSettings', 'init');
      const fp = init?.fieldPath;
      if (fp) return String(fp);
    } catch {
      // ignore
    }
    const fp2 = (model as any)?.fieldPath;
    if (fp2) return String(fp2);

    const np = this.getModelTargetNamePath(model);
    if (np?.length) {
      const normalized = np.filter((seg) => typeof seg === 'string').join('.');
      return normalized || null;
    }
    return null;
  }

  private getAssignRuleInstanceId(templateKey: string, model: FlowModel) {
    const forkId = model?.['isFork'] ? String(model?.['forkId'] ?? 'fork') : 'master';
    const uid = model?.uid ? String(model.uid) : String(model);
    return `form-assign:${templateKey}:${uid}:${forkId}`;
  }

  private getDeepestFieldIndexKey(baseCtx: any): string | null {
    const fieldIndex = baseCtx?.model?.context?.fieldIndex ?? baseCtx?.fieldIndex;
    const arr = Array.isArray(fieldIndex) ? fieldIndex : [];
    if (!arr.length) return null;
    const last = arr[arr.length - 1];
    if (typeof last !== 'string') return null;
    const [k, v] = last.split(':');
    if (!k) return null;
    const n = Number(v);
    if (Number.isNaN(n)) return null;
    return k;
  }

  private getDeepestToManyAssociationKey(targetPath: string): string | null {
    const rootCollection = this.getRootCollection();
    if (!rootCollection?.getField) return null;

    const segs = parsePathString(String(targetPath || '')).filter((seg) => typeof seg !== 'object') as NamePath;
    if (segs.length < 2) return null;

    let collection = rootCollection;
    let deepest: string | null = null;

    for (let i = 0; i < segs.length - 1; i++) {
      const seg = segs[i];
      if (typeof seg !== 'string') continue;
      const field = collection?.getField?.(seg);
      if (!field?.isAssociationField?.()) break;

      const toMany = isToManyAssociationField(field);
      if (toMany) deepest = seg;

      // 对多关联：若包含显式 index（如 users[0]），跳过 index 段；否则按字段名继续
      if (toMany) {
        const next = segs[i + 1];
        if (typeof next === 'number') {
          i += 1;
        }
      }

      collection = field?.targetCollection;
      if (!collection?.getField) break;
    }

    return deepest;
  }

  private isRowGridModel(model: FlowModel): boolean {
    // grid fork（SubFormList 内每行一个 grid fork）：有 subModels.items，但没有 subModels.field
    if (!model || typeof model !== 'object') return false;
    if ((model as any)?.subModels?.field) return false;
    if (!(model as any)?.subModels?.items) return false;

    const baseCtx: any = (model as any)?.context;
    const rowKey = this.getDeepestFieldIndexKey(baseCtx);
    return !!rowKey;
  }

  private tryRegisterAssignRuleInstancesForModel(model: FlowModel, matchedTargetPaths?: Set<string>) {
    if (this.options.isDisposed()) return;
    if (!this.isModelInThisForm(model)) return;

    const register = (
      targetPathForRule: string,
      ruleTemplates: Array<FormAssignRuleItem & { __key: string; __order: number }>,
    ) => {
      if (!ruleTemplates || ruleTemplates.length === 0) return;
      matchedTargetPaths?.add(targetPathForRule);

      for (const template of ruleTemplates) {
        const mode: AssignMode = template?.mode === 'default' ? 'default' : 'assign';
        const source: ValueSource = mode === 'default' ? 'default' : 'system';
        const enabled = template?.enable !== false;
        const id = this.getAssignRuleInstanceId(template.__key, model);

        // 若已存在则替换，避免残留旧 deps/binding
        if (this.rules.has(id)) {
          this.removeRule(id);
        }

        const rule: RuntimeRule = {
          id,
          source,
          priority: 10 + (template.__order || 0),
          debounceMs: 0,
          getEnabled: () => enabled && !!targetPathForRule,
          getTarget: () => targetPathForRule,
          getValue: () => template?.value,
          getCondition: () => template?.condition,
          getContext: () => model?.context,
        };

        this.rules.set(id, { rule, state: { deps: new Set(), depDisposers: [], runSeq: 0 } });
        this.scheduleRule(id);
      }
    };

    // A) row grid：支持对子表单/子表单列表中“未配置到 UI 的属性字段”赋值。
    //    当 targetPath 穿过对多关联（例如 users.age / users.user.name）且不存在对应 FormItemModel 时，
    //    将规则挂载到 row grid 的上下文上运行，以便自动插入数组 index 并按行评估条件。
    if (this.isRowGridModel(model)) {
      const baseCtx: any = (model as any)?.context;
      const rowKey = this.getDeepestFieldIndexKey(baseCtx);
      if (rowKey) {
        for (const [templateTargetPath, templates] of this.assignTemplatesByTargetPath.entries()) {
          // 已配置到 UI 的字段（存在 FormItemModel）仍由字段实例处理，避免重复运行
          if (this.formItemTargetPaths.has(templateTargetPath)) continue;

          const anchor = this.getDeepestToManyAssociationKey(templateTargetPath);
          if (!anchor || anchor !== rowKey) continue;

          register(templateTargetPath, templates);
        }
      }
      return;
    }

    // B) FormItemModel（及其 fork）：常规字段赋值
    if (!(model as any)?.subModels?.field) return;

    const targetPath = this.getModelTargetPath(model);
    if (!targetPath) return;

    // 1) 精确命中：表单上存在对应字段模型
    const exactTemplates = this.assignTemplatesByTargetPath.get(targetPath) || [];
    if (exactTemplates.length) {
      register(targetPath, exactTemplates);
    }

    // 2) 嵌套属性：当当前字段为对一关联（record picker 等）时，将其子属性赋值规则挂载到该字段实例上运行（包括对多子表单行内的对一关联）
    const fieldModel: any = (model as any)?.subModels?.field;
    const collectionField: any = fieldModel?.context?.collectionField;
    const isAssoc = !!collectionField?.isAssociationField?.();
    const isToMany = isToManyAssociationField(collectionField);
    if (isAssoc && !isToMany) {
      const prefix = `${targetPath}.`;
      for (const [templateTargetPath, templates] of this.assignTemplatesByTargetPath.entries()) {
        if (!templateTargetPath || typeof templateTargetPath !== 'string') continue;
        if (!templateTargetPath.startsWith(prefix)) continue;
        register(templateTargetPath, templates);
      }
    }
  }

  private tryUnregisterAssignRuleInstancesForModel(model: FlowModel) {
    if (this.options.isDisposed()) return;
    if (!this.isModelInThisForm(model)) return;

    const unregister = (templates: Array<FormAssignRuleItem & { __key: string }>) => {
      for (const template of templates || []) {
        const id = this.getAssignRuleInstanceId(template.__key, model);
        if (!this.rules.has(id)) continue;
        this.removeRule(id);
      }
    };

    // A) row grid：清理挂载到 row grid 上的“未配置字段”规则
    if (this.isRowGridModel(model)) {
      const baseCtx: any = (model as any)?.context;
      const rowKey = this.getDeepestFieldIndexKey(baseCtx);
      if (!rowKey) return;

      for (const [templateTargetPath, templates] of this.assignTemplatesByTargetPath.entries()) {
        if (this.formItemTargetPaths.has(templateTargetPath)) continue;
        const anchor = this.getDeepestToManyAssociationKey(templateTargetPath);
        if (!anchor || anchor !== rowKey) continue;
        unregister(templates);
      }
      return;
    }

    // B) FormItemModel（及其 fork）：常规字段赋值
    if (!(model as any)?.subModels?.field) return;

    const targetPath = this.getModelTargetPath(model);
    if (!targetPath) return;

    // 1) 精确命中：按当前字段 targetPath 清理
    const exactTemplates = this.assignTemplatesByTargetPath.get(targetPath) || [];
    if (exactTemplates.length) {
      unregister(exactTemplates);
    }

    // 2) 嵌套属性：对一关联字段会挂载子属性规则到自身实例，卸载时需要一并清理
    const fieldModel: any = (model as any)?.subModels?.field;
    const collectionField: any = fieldModel?.context?.collectionField;
    const isAssoc = !!collectionField?.isAssociationField?.();
    const isToMany = isToManyAssociationField(collectionField);
    if (isAssoc && !isToMany) {
      const prefix = `${targetPath}.`;
      for (const [templateTargetPath, templates] of this.assignTemplatesByTargetPath.entries()) {
        if (!templateTargetPath || typeof templateTargetPath !== 'string') continue;
        if (!templateTargetPath.startsWith(prefix)) continue;
        unregister(templates);
      }
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
    const { baseCtx, targetNamePath, targetKey, clearDeps, disposeBinding } = ruleContext;

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

    // 关联字段嵌套属性：关联对象为空/非对象时跳过，避免隐式创建
    if (this.shouldSkipAssociationNestedWrite(baseCtx, targetNamePath!)) {
      return;
    }

    // 对多关联的子属性：缺少 index 时跳过，避免把数组字段写成对象，导致 Form.List add 报错
    if (this.shouldSkipToManyAssociationWriteWithoutIndex(baseCtx, targetNamePath!)) {
      return;
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
      // 关联字段嵌套属性：额外依赖关联对象本身，确保从 null -> {id} 时可触发重新计算
      for (const p of this.collectAssociationPrefixPaths(baseCtx, targetNamePath)) {
        recordDep(p, collector);
      }
    }

    const evalCtx = this.createRuleEvaluationContext(baseCtx, collector, targetNamePath);
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

  private createRuleEvaluationContext(baseCtx: any, collector: DepCollector, targetNamePath: NamePath | null) {
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

    // “当前对象”链：用于多层级关系字段条件
    // 语义：ctx.current -> { index?, attributes, parent? }，其中：
    // - index：仅当当前对象位于对多关联行内时存在（0-based）
    // - attributes：当前对象的属性（来自 formValues 的对应切片，支持无限嵌套属性访问）
    // - parent：上级对象（同结构，可链式 parent.parent...）
    let currentCached: any;
    let currentCachedReady = false;
    ctx.defineProperty('current', {
      get: () => {
        if (!currentCachedReady) {
          currentCached = this.buildCurrentObjectChainValue(baseCtx, trackingFormValues, targetNamePath);
          currentCachedReady = true;
        }
        return currentCached;
      },
      cache: false,
    });
    return ctx;
  }

  private buildCurrentObjectChainValue(baseCtx: any, trackingFormValues: any, targetNamePath: NamePath | null) {
    const rootCollection = this.getRootCollection() || this.getCollectionFromContext(baseCtx);
    const defaultRoot = {
      index: undefined as number | undefined,
      attributes: trackingFormValues,
      parent: undefined as any,
    };
    if (!targetNamePath || !Array.isArray(targetNamePath) || !targetNamePath.length) {
      return defaultRoot;
    }

    if (!rootCollection?.getField) {
      return defaultRoot;
    }

    const assocEntries: Array<{ path: NamePath; toMany: boolean }> = [];
    const prefix: NamePath = [];
    let collection = rootCollection;

    for (let i = 0; i < targetNamePath.length - 1; i++) {
      const seg = targetNamePath[i];
      if (typeof seg !== 'string') break;

      const field = collection?.getField?.(seg);
      if (!field?.isAssociationField?.()) break;

      const toMany = isToManyAssociationField(field);
      prefix.push(seg);

      if (toMany) {
        const next = targetNamePath[i + 1];
        if (typeof next !== 'number') break;
        prefix.push(next);
        i += 1;
      }

      const targetCollection = field?.targetCollection;
      if (!targetCollection) break;

      assocEntries.push({ path: [...prefix], toMany });
      collection = targetCollection;
    }

    const build = (idx: number): any => {
      if (idx < 0) return defaultRoot;
      const assocEntry = assocEntries[idx];
      const attributes = _.get(trackingFormValues, assocEntry.path);
      const lastSeg = assocEntry.path[assocEntry.path.length - 1];
      const index = assocEntry.toMany && typeof lastSeg === 'number' ? lastSeg : undefined;
      return { index, attributes, parent: build(idx - 1) };
    };

    return assocEntries.length ? build(assocEntries.length - 1) : defaultRoot;
  }

  private getFieldIndexSignature(baseCtx: any): string {
    const fieldIndex = baseCtx?.model?.context?.fieldIndex ?? baseCtx?.fieldIndex;
    const arr = Array.isArray(fieldIndex) ? fieldIndex : [];
    return arr.filter((it) => typeof it === 'string').join('|');
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

      // 特殊变量：current 为 RuleEngine 注入的计算属性（不直接存在于 baseCtx 上），其 parent/index 链依赖 fieldIndex。
      if (varName === 'current') {
        const disposer = reaction(
          () => this.getFieldIndexSignature(baseCtx),
          () => this.scheduleRule(rule.id),
        );
        state.depDisposers.push(disposer);
        continue;
      }

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
