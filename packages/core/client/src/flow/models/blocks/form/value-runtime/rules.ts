/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isObservable, reaction, toJS } from '@formily/reactive';
import { FlowContext, FlowModel, isRunJSValue, normalizeRunJSValue, runjsWithSafeGlobals } from '@nocobase/flow-engine';
import _ from 'lodash';
import { dayjs } from '@nocobase/utils/client';
import { evaluateCondition } from './conditions';
import { collectStaticDepsFromRunJSValue, collectStaticDepsFromTemplateValue, DepCollector, recordDep } from './deps';
import { namePathToPathKey, parsePathString, pathKeyToNamePath } from './path';
import type { FormAssignRuleItem, FormValueWriteMeta, NamePath, Patch, SetOptions, ValueSource } from './types';
import { createTxId, isEmptyValue } from './utils';
import { isToManyAssociationField } from '../../../../internal/utils/modelUtils';

/** Symbol to indicate rule value resolution should be skipped */
const SKIP_RULE_VALUE = Symbol('SKIP_RULE_VALUE');
const UNRESOLVED_ASSOCIATION_IDENTITY = Symbol('UNRESOLVED_ASSOCIATION_IDENTITY');

// default 规则的优先级：
// - step 初始值（editItemSettings/formItemSettings.initialValue）：priority=0（低于表单赋值）
// - props.initialValue（通常为联动规则临时写入）：需要覆盖表单赋值，因此提升优先级
const LINKAGE_DEFAULT_RULE_PRIORITY = 1000;

type RuleDeps = Set<string>;

type RuleState = {
  deps: RuleDeps;
  depDisposers: Array<() => void>;
  runSeq: number;
  /** Write sequence when this rule was last scheduled */
  scheduledAtWriteSeq: number;
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
  getWriteSeq: () => number;
  txWriteCounts: Map<string, Map<string, number>>;
  createTrackingFormValues: (collector: DepCollector) => any;
  tryResolveNamePath: (callerCtx: any, path: string | NamePath) => NamePath | null;
  getFormValueAtPath: (namePath: NamePath) => any;
  setFormValues: (callerCtx: any, patch: Patch, options?: SetOptions) => Promise<void>;
  findExplicitHit: (pathKey: string) => string | null;
  lastDefaultValueByPathKey: Map<string, any>;
  lastWriteMetaByPathKey: Map<string, FormValueWriteMeta>;
  observableBindings: Map<string, ObservableBinding>;
};

export class RuleEngine {
  private readonly options: RuleEngineOptions;

  private readonly rules = new Map<string, { rule: RuntimeRule; state: RuleState }>();
  // 仅用于 rule 引擎内部的“同源 default 规则”优先级仲裁；避免低优先级 default 在高优先级 default 写入后再次回写覆盖。
  private readonly lastRuleWriteByTargetKey = new Map<
    string,
    { source: ValueSource; priority: number; writeSeq: number }
  >();
  private readonly assignTemplatesByTargetPath = new Map<
    string,
    Array<FormAssignRuleItem & { __key: string; __order: number }>
  >();
  /** 当前表单中“已配置到 UI 的字段（FormItemModel）”的 targetPath 集合，用于避免对 row grid 重复注册规则 */
  private readonly formItemTargetPaths = new Set<string>();
  /** targetPath -> updateAssociation（SubForm/SubTable 等） */
  private readonly updateAssociationByTargetPath = new Map<string, boolean>();
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

  private getAssignRuleBlockId(templateKey: string) {
    return `form-assign:${templateKey}:block`;
  }

  private removeAssignRuleBlockInstance(templateKey: string) {
    const blockId = this.getAssignRuleBlockId(templateKey);
    if (this.rules.has(blockId)) {
      this.removeRule(blockId);
    }
  }

  private removeRowGridAssignRuleInstances(templateKey: string) {
    const prefix = `form-assign:${templateKey}:`;
    const blockId = this.getAssignRuleBlockId(templateKey);
    const toRemove: string[] = [];

    for (const [id, entry] of this.rules.entries()) {
      if (!id.startsWith(prefix)) continue;
      if (id === blockId) continue;
      const ctx = entry?.rule?.getContext?.();
      const ctxModel = ctx?.model;
      if (ctxModel && this.isRowGridModel(ctxModel as any)) {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.removeRule(id);
    }
  }

  private hasAnyNonBlockAssignRuleInstance(templateKey: string) {
    const prefix = `form-assign:${templateKey}:`;
    const blockId = this.getAssignRuleBlockId(templateKey);
    for (const id of this.rules.keys()) {
      if (!id.startsWith(prefix)) continue;
      if (id === blockId) continue;
      return true;
    }
    return false;
  }

  private ensureBlockAssignRuleInstancesForTargetPath(targetPath: string) {
    if (this.options.isDisposed()) return;
    if (!targetPath) return;
    if (!this.shouldCreateBlockLevelAssignRule(targetPath)) return;

    const templates = this.assignTemplatesByTargetPath.get(targetPath) || [];
    if (!templates.length) return;

    for (const template of templates) {
      const templateKey = template?.__key ? String(template.__key) : '';
      if (!templateKey) continue;
      if (this.hasAnyNonBlockAssignRuleInstance(templateKey)) continue;

      const mode: AssignMode = template?.mode === 'default' ? 'default' : 'assign';
      const source: ValueSource = mode === 'default' ? 'default' : 'system';
      const enabled = template?.enable !== false;
      const id = this.getAssignRuleBlockId(templateKey);
      if (this.rules.has(id)) continue;

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

      this.rules.set(id, { rule, state: { deps: new Set(), depDisposers: [], runSeq: 0, scheduledAtWriteSeq: 0 } });
      this.scheduleRule(id);
    }
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
      if (v == null) {
        // updateAssociation（子表单/子表格）场景下允许隐式创建关联对象/行，
        // 以便嵌套字段的默认值/复制模式在首次渲染时即可生效。
        const targetPath = p.filter((seg) => typeof seg === 'string').join('.');
        if (targetPath && this.getUpdateAssociationForTargetPath(targetPath)) {
          continue;
        }
        // 特殊：当目标为“关联记录主键/targetKey”（如 user.id）时，允许在关联对象为空时写入，
        // 以支持通过主键为关联字段设置默认值/赋值（常见于 RecordSelect/RecordPicker）。
        if (this.isAssociationTargetKeyWrite(baseCtx, targetNamePath, p)) {
          continue;
        }
        return true;
      }
      if (typeof v !== 'object') return true;
    }

    return false;
  }

  private getAssociationTargetKeyFields(associationField: any): string[] {
    const raw =
      associationField?.targetKey ??
      associationField?.targetCollection?.filterTargetKey ??
      associationField?.targetCollection?.filterByTk ??
      'id';
    if (Array.isArray(raw)) {
      return raw.filter((v): v is string => typeof v === 'string' && !!v);
    }
    if (typeof raw === 'string' && raw) return [raw];
    return ['id'];
  }

  private resolveAssociationFieldByPrefixPath(baseCtx: any, prefixPath: NamePath): any | null {
    let collection = this.getRootCollection() || this.getCollectionFromContext(baseCtx);
    if (!collection?.getField) return null;

    let lastAssociationField: any | null = null;
    for (const seg of prefixPath) {
      if (typeof seg === 'number') {
        // index segment for to-many association
        continue;
      }
      if (typeof seg !== 'string' || !seg) break;
      const field: any = collection?.getField?.(seg);
      if (!field?.isAssociationField?.()) break;
      lastAssociationField = field;
      collection = field?.targetCollection;
      if (!collection?.getField) break;
    }
    return lastAssociationField;
  }

  private isAssociationTargetKeyWrite(baseCtx: any, targetNamePath: NamePath, prefixPath: NamePath): boolean {
    // Only allow direct `assoc.<targetKey>` writes (e.g. `user.id`).
    if (!Array.isArray(targetNamePath) || !Array.isArray(prefixPath)) return false;
    if (targetNamePath.length !== prefixPath.length + 1) return false;
    const keySeg = targetNamePath[prefixPath.length];
    if (typeof keySeg !== 'string' || !keySeg) return false;

    const assocField = this.resolveAssociationFieldByPrefixPath(baseCtx, prefixPath);
    if (!assocField?.isAssociationField?.()) return false;
    if (isToManyAssociationField(assocField)) return false;

    const keys = this.getAssociationTargetKeyFields(assocField);
    return keys.includes(keySeg);
  }

  private collectUpdateAssociationInitPatches(
    baseCtx: any,
    targetNamePath: NamePath,
  ): Array<{ path: NamePath; value: any }> | null {
    const prefixes = this.collectAssociationPrefixPaths(baseCtx, targetNamePath);
    if (!prefixes.length) return [];

    const patches: Array<{ path: NamePath; value: any }> = [];

    for (const p of prefixes) {
      const v = this.options.getFormValueAtPath(p);
      if (v == null) {
        const targetPath = p.filter((seg) => typeof seg === 'string').join('.');
        if (!targetPath) return null;
        if (this.getUpdateAssociationForTargetPath(targetPath)) {
          // 标记为“新增记录”，与子表单的 add({ __is_new__: true }) 行为一致。
          patches.push({ path: [...p, '__is_new__'], value: true });
          continue;
        }

        // 特殊：当目标为“关联记录主键/targetKey”（如 user.id）时，
        // 允许在关联对象为空时写入，并初始化为空对象以确保后续 setFieldValue 能正确落值。
        if (this.isAssociationTargetKeyWrite(baseCtx, targetNamePath, p)) {
          patches.push({ path: [...p], value: {} });
          continue;
        }

        return null;
      }
      if (typeof v !== 'object') return null;
    }

    const byKey = new Map<string, { path: NamePath; value: any }>();
    for (const it of patches) {
      const k = namePathToPathKey(it.path as any);
      if (!byKey.has(k)) {
        byKey.set(k, it);
      }
    }

    return Array.from(byKey.values());
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
    this.updateAssociationByTargetPath.clear();

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
        this.cacheUpdateAssociationForModel(model);
      });

      const visit = (model: FlowModel) => {
        this.cacheUpdateAssociationForModel(model);
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

        this.rules.set(id, { rule, state: { deps: new Set(), depDisposers: [], runSeq: 0, scheduledAtWriteSeq: 0 } });
        this.scheduleRule(id);
      }
    }
  }

  onModelMounted(model: FlowModel) {
    // 维护“已配置到 UI 的字段 targetPath”集合：仅 master 参与（fork 不代表配置项存在/删除）
    if (this.isModelInThisForm(model) && !(model as any)?.isFork && (model as any)?.subModels?.field) {
      const p = this.getModelTargetPath(model);
      if (p) this.formItemTargetPaths.add(p);
      this.cacheUpdateAssociationForModel(model);
    }
    this.tryRegisterDefaultRuleInstance(model);
    this.tryRegisterAssignRuleInstancesForModel(model);
  }

  onModelUnmounted(model: FlowModel) {
    this.tryUnregisterDefaultRuleInstance(model);
    this.tryUnregisterAssignRuleInstancesForModel(model);

    // 字段模型卸载后：为其对应的 targetPath（以及潜在的嵌套 targetPath）恢复 block-level 兜底实例，
    // 以保证“先配置规则→后添加字段→再移除字段”行为稳定。
    if (this.isModelInThisForm(model) && (model as any)?.subModels?.field) {
      const p = this.getModelTargetPath(model);
      if (p) {
        this.ensureBlockAssignRuleInstancesForTargetPath(p);

        if (!(model as any)?.isFork) {
          this.updateAssociationByTargetPath.delete(p);
          this.formItemTargetPaths.delete(p);

          // 对一关联字段可能承载其子属性规则实例；卸载时这些子属性规则也需要回退到 block-level。
          const prefix = `${p}.`;
          for (const targetPath of this.assignTemplatesByTargetPath.keys()) {
            if (!targetPath.startsWith(prefix)) continue;
            this.ensureBlockAssignRuleInstancesForTargetPath(targetPath);
          }

          // 对多子表单场景：若该字段是 users.age 这类路径，row grid 模型仍在时需要重刷一次以便重新注册 row-grid 规则。
          // 这里避免做全量 sync，仅触发一次按当前模型树的重新注册。
          const engine = this.options.getEngine();
          if (engine?.forEachModel) {
            const visit = (m: FlowModel) => {
              this.tryRegisterAssignRuleInstancesForModel(m);
              const forks: any = (m as any)?.forks;
              if (forks && typeof forks.forEach === 'function') {
                forks.forEach((fork: any) => {
                  if (!fork || (fork as any)?.disposed) return;
                  this.tryRegisterAssignRuleInstancesForModel(fork as any);
                });
              }
            };
            engine.forEachModel((m: FlowModel) => visit(m));
          }
        }
      }
    }
  }

  private isModelInThisForm(model: FlowModel) {
    const block = model?.context?.blockModel;
    if (!block) return false;
    return String(block.uid) === String(this.options.getBlockModelUid());
  }

  private cacheUpdateAssociationForModel(model: FlowModel) {
    if (this.options.isDisposed()) return;
    if (!this.isModelInThisForm(model)) return;
    if (!model || typeof model !== 'object') return;
    if ((model as any)?.isFork) return;
    if (!(model as any)?.subModels?.field) return;

    const p = this.getModelTargetPath(model);
    if (!p) return;

    const fieldModel: any = (model as any)?.subModels?.field;
    const next = !!fieldModel?.updateAssociation;
    const prev = this.updateAssociationByTargetPath.get(p);

    // once true, keep true (avoid being overwritten by another model instance)
    if (prev === true) return;
    this.updateAssociationByTargetPath.set(p, next);
  }

  private getUpdateAssociationForTargetPath(targetPath: string): boolean {
    const key = String(targetPath || '');
    if (!key) return false;

    if (this.updateAssociationByTargetPath.has(key)) {
      return !!this.updateAssociationByTargetPath.get(key);
    }

    // Fallback: scan existing models once (e.g. called before syncAssignRules finishes scanning).
    const engine = this.options.getEngine();
    if (engine?.forEachModel) {
      engine.forEachModel((m: FlowModel) => {
        this.cacheUpdateAssociationForModel(m);
      });
    }

    if (this.updateAssociationByTargetPath.has(key)) {
      return !!this.updateAssociationByTargetPath.get(key);
    }

    // Cache negative result; model:mounted will override when applicable.
    this.updateAssociationByTargetPath.set(key, false);
    return false;
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

    const getPropsInitialValue = () => {
      const p = (master as any)?.getProps?.() ?? (master as any)?.props;
      return p?.initialValue;
    };

    const getDefaultRulePriority = () => {
      return typeof getPropsInitialValue() !== 'undefined' ? LINKAGE_DEFAULT_RULE_PRIORITY : 0;
    };

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
      priority: getDefaultRulePriority(),
      debounceMs: 0,
      getEnabled: () => {
        const fromProps = getPropsInitialValue();
        if (typeof fromProps !== 'undefined') return true;
        const fromStep = getStepDefaultValue();
        return typeof fromStep !== 'undefined';
      },
      getTarget: () => {
        return this.getModelTargetNamePath(model) || target;
      },
      getValue: () => {
        const fromProps = getPropsInitialValue();
        if (typeof fromProps !== 'undefined') return fromProps;
        return getStepDefaultValue();
      },
      getContext: () => model?.context,
    };

    this.rules.set(id, {
      rule,
      state: { deps: new Set(), depDisposers: [], runSeq: 0, scheduledAtWriteSeq: 0 },
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
        // 若之前在无字段模型时创建了 block-level/row-grid 兜底实例，这里在字段模型可用时迁移到字段实例，避免双挂载。
        this.removeAssignRuleBlockInstance(template.__key);
        if ((model as any)?.subModels?.field) {
          this.removeRowGridAssignRuleInstances(template.__key);
        }

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

        this.rules.set(id, { rule, state: { deps: new Set(), depDisposers: [], runSeq: 0, scheduledAtWriteSeq: 0 } });
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
        const p = (master as any)?.getProps?.() ?? (master as any)?.props;
        const nextPriority = typeof p?.initialValue !== 'undefined' ? LINKAGE_DEFAULT_RULE_PRIORITY : 0;
        for (const id of ids) {
          const entry = this.rules.get(id);
          if (entry) {
            entry.rule.priority = nextPriority;
          }
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
    const entry = this.rules.get(id);
    if (!entry) return;
    const { rule, state } = entry;

    // Used to detect "a higher priority source has already written the target after we were scheduled".
    state.scheduledAtWriteSeq = this.options.getWriteSeq();

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
    const scheduledAtWriteSeq = state.scheduledAtWriteSeq;

    const ruleContext = this.prepareRuleContext(rule);
    const { baseCtx, targetNamePath, targetKey, clearDeps, disposeBinding } = ruleContext;

    if (!this.shouldRunRule(rule, targetNamePath, targetKey, baseCtx)) {
      clearDeps(state);
      disposeBinding();
      return;
    }
    if (!targetNamePath || !targetKey) {
      clearDeps(state);
      disposeBinding();
      return;
    }
    const ensuredTargetNamePath = targetNamePath;
    const ensuredTargetKey = targetKey;

    const { collector, evalCtx } = this.createRuleCollectorAndContext(rule, ruleContext);

    if (rule.getCondition) {
      const shouldContinue = await this.evaluateRuleCondition(rule, state, seq, evalCtx, collector);
      if (!shouldContinue) return;
    }

    const resolved = await this.resolveRuleValue(rule, state, seq, evalCtx, collector);
    if (resolved === SKIP_RULE_VALUE) return;
    if (seq !== state.runSeq) return;

    this.commitRuleDeps(rule, state, collector);

    const normalizedResolved = this.normalizeResolvedValueForTarget(baseCtx, resolved);
    const normalizedResolvedForTarget = this.normalizeResolvedValueForAssociationTarget(
      baseCtx,
      ensuredTargetNamePath,
      normalizedResolved,
    );

    if (rule.source === 'default') {
      const shouldApply = this.checkDefaultRuleCanApply(
        normalizedResolvedForTarget,
        ensuredTargetNamePath,
        ensuredTargetKey,
        clearDeps,
        disposeBinding,
        state,
      );
      if (!shouldApply) return;
    }

    if (rule.source === 'default') {
      const lastWrite = this.lastRuleWriteByTargetKey.get(ensuredTargetKey);
      if (
        lastWrite?.source === 'default' &&
        lastWrite.priority > rule.priority &&
        lastWrite.writeSeq >= scheduledAtWriteSeq
      ) {
        disposeBinding();
        return;
      }
    }

    if (rule.source === 'system') {
      const lastWrite = this.options.lastWriteMetaByPathKey.get(ensuredTargetKey);
      if (lastWrite?.source === 'linkage' && lastWrite.writeSeq >= scheduledAtWriteSeq) {
        disposeBinding();
        return;
      }
    }

    if (this.shouldSkipAssociationNestedWrite(baseCtx, ensuredTargetNamePath)) return;

    if (this.shouldSkipToManyAssociationWriteWithoutIndex(baseCtx, ensuredTargetNamePath)) return;

    const nextSnapshot = normalizedResolvedForTarget;
    const currentValue = this.options.getFormValueAtPath(ensuredTargetNamePath);
    const semanticallyEqual = this.isAssociationTargetSemanticallyEqual(
      baseCtx,
      ensuredTargetNamePath,
      currentValue,
      nextSnapshot,
    );
    if (semanticallyEqual) return;

    const initPatches = this.collectUpdateAssociationInitPatches(baseCtx, ensuredTargetNamePath);
    if (initPatches == null) return;

    if (rule.source === 'system') {
      const modelForUi = baseCtx?.model;
      if (modelForUi?.subModels?.field) {
        const modelTarget = this.getModelTargetNamePath(modelForUi);
        if (modelTarget && namePathToPathKey(modelTarget) === ensuredTargetKey) {
          modelForUi.setProps({ value: normalizedResolvedForTarget });
        }
      }
    }

    const beforeWriteSeq = this.options.getWriteSeq();
    const patches = [...initPatches, { path: ensuredTargetNamePath, value: normalizedResolvedForTarget }];
    await this.options.setFormValues(evalCtx, patches, {
      source: rule.source,
      txId: this.currentRuleTxId || undefined,
    });
    const afterWriteSeq = this.options.getWriteSeq();
    if (afterWriteSeq !== beforeWriteSeq) {
      this.lastRuleWriteByTargetKey.set(ensuredTargetKey, {
        source: rule.source,
        priority: rule.priority,
        writeSeq: afterWriteSeq,
      });
    }
  }

  private isTzAwareTargetInterface(targetInterface: unknown): boolean {
    if (typeof targetInterface !== 'string') {
      return false;
    }

    return ['datetime', 'createdAt', 'updatedAt', 'unixTimestamp'].includes(targetInterface);
  }

  private normalizeDateOnlyToStartOfDayIso(value: string): string {
    const raw = String(value || '').trim();
    if (!raw) return value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return value;

    const parsed = dayjs(raw, 'YYYY-MM-DD', true);
    if (!parsed.isValid()) return value;
    return parsed.startOf('day').toISOString();
  }

  private normalizeResolvedValueForTarget(baseCtx: any, resolved: any): any {
    const targetInterface = baseCtx?.model?.context?.collectionField?.interface;
    if (!this.isTzAwareTargetInterface(targetInterface)) {
      return resolved;
    }

    if (typeof resolved === 'string') {
      return this.normalizeDateOnlyToStartOfDayIso(resolved);
    }

    if (Array.isArray(resolved)) {
      return resolved.map((item) => (typeof item === 'string' ? this.normalizeDateOnlyToStartOfDayIso(item) : item));
    }

    return resolved;
  }

  private isPrimitiveAssociationTargetValue(value: unknown): value is string | number | boolean {
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
  }

  private extractAssociationIdentity(associationField: any, value: any): any | typeof UNRESOLVED_ASSOCIATION_IDENTITY {
    const targetKeys = this.getAssociationTargetKeyFields(associationField);
    const singleTargetKey = targetKeys.length === 1 ? targetKeys[0] : null;

    const toIdentity = (item: any): any | typeof UNRESOLVED_ASSOCIATION_IDENTITY => {
      if (item == null) return item;

      if (this.isPrimitiveAssociationTargetValue(item)) {
        if (!singleTargetKey) return UNRESOLVED_ASSOCIATION_IDENTITY;
        return item;
      }

      if (!item || typeof item !== 'object') {
        return UNRESOLVED_ASSOCIATION_IDENTITY;
      }

      if (singleTargetKey) {
        if (typeof item[singleTargetKey] === 'undefined') {
          return UNRESOLVED_ASSOCIATION_IDENTITY;
        }
        return item[singleTargetKey];
      }

      const compositeIdentity: Record<string, any> = {};
      for (const key of targetKeys) {
        if (typeof item[key] === 'undefined') {
          return UNRESOLVED_ASSOCIATION_IDENTITY;
        }
        compositeIdentity[key] = item[key];
      }
      return compositeIdentity;
    };

    if (isToManyAssociationField(associationField)) {
      const arr = Array.isArray(value) ? value : [value];
      const identities: any[] = [];
      for (const item of arr) {
        if (item == null) continue;
        const identity = toIdentity(item);
        if (identity === UNRESOLVED_ASSOCIATION_IDENTITY) {
          return UNRESOLVED_ASSOCIATION_IDENTITY;
        }
        identities.push(identity);
      }
      return identities;
    }

    const toOneValue = Array.isArray(value) ? value.find((item) => item != null) : value;
    if (toOneValue == null) return toOneValue;
    return toIdentity(toOneValue);
  }

  private isAssociationTargetSemanticallyEqual(
    baseCtx: any,
    targetNamePath: NamePath,
    currentValue: any,
    nextValue: any,
  ): boolean {
    const targetField = this.resolveCollectionFieldByNamePath(baseCtx, targetNamePath);
    if (!targetField?.isAssociationField?.()) {
      return _.isEqual(currentValue, nextValue);
    }

    const currentIdentity = this.extractAssociationIdentity(targetField, currentValue);
    const nextIdentity = this.extractAssociationIdentity(targetField, nextValue);
    if (currentIdentity === UNRESOLVED_ASSOCIATION_IDENTITY || nextIdentity === UNRESOLVED_ASSOCIATION_IDENTITY) {
      return _.isEqual(currentValue, nextValue);
    }

    return _.isEqual(currentIdentity, nextIdentity);
  }

  private resolveCollectionFieldByNamePath(baseCtx: any, targetNamePath: NamePath): any | null {
    if (!Array.isArray(targetNamePath) || !targetNamePath.length) return null;

    let collection = this.getRootCollection() || this.getCollectionFromContext(baseCtx);
    if (!collection?.getField) return null;

    for (let i = 0; i < targetNamePath.length; i++) {
      const seg = targetNamePath[i];
      if (typeof seg !== 'string' || !seg) return null;

      const field = collection?.getField?.(seg);
      if (!field) return null;

      const isLast = i === targetNamePath.length - 1;
      if (isLast) return field;

      if (!field?.isAssociationField?.() || !field?.targetCollection) {
        return null;
      }

      if (isToManyAssociationField(field)) {
        const nextSeg = targetNamePath[i + 1];
        if (typeof nextSeg !== 'number') {
          return null;
        }
        i += 1;
      }

      collection = field.targetCollection;
      if (!collection?.getField) return null;
    }

    return null;
  }

  private normalizeResolvedValueForAssociationTarget(baseCtx: any, targetNamePath: NamePath, resolved: any): any {
    const targetField = this.resolveCollectionFieldByNamePath(baseCtx, targetNamePath);
    if (!targetField?.isAssociationField?.()) return resolved;

    const targetKeys = this.getAssociationTargetKeyFields(targetField);
    const singleTargetKey = targetKeys.length === 1 ? targetKeys[0] : null;
    const normalizeItem = (item: any) => {
      if (item == null) return undefined;
      if (singleTargetKey && this.isPrimitiveAssociationTargetValue(item)) {
        return { [singleTargetKey]: item };
      }
      return item;
    };

    if (isToManyAssociationField(targetField)) {
      const rawItems = Array.isArray(resolved) ? resolved : [resolved];
      return rawItems.map((item) => normalizeItem(item)).filter((item) => typeof item !== 'undefined' && item !== null);
    }

    const toOneValue = Array.isArray(resolved) ? resolved.find((item) => item != null) : resolved;
    if (toOneValue == null) return toOneValue;

    const normalizedOne = normalizeItem(toOneValue);
    return normalizedOne;
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

  private shouldApplyDefaultRuleInCurrentState(baseCtx: any): boolean {
    const actionName = this.options.getActionName?.();
    if (actionName !== 'update') {
      return true;
    }

    // 编辑态默认值规则：
    // - 顶层编辑表单：不应用默认值
    // - 子表单：仅对“新增行/新增对象”（__is_new__ = true）应用默认值
    let item: any;
    try {
      item = baseCtx?.item;
    } catch {
      item = undefined;
    }

    if (!item || typeof item !== 'object') {
      return false;
    }

    return item.__is_new__ === true;
  }

  private shouldRunRule(
    rule: RuntimeRule,
    targetNamePath: NamePath | null,
    targetKey: string | null,
    baseCtx: any,
  ): boolean {
    if (!rule.getEnabled()) return false;
    if (!targetNamePath || !targetKey) return false;
    if (rule.source === 'default') {
      if (!this.shouldApplyDefaultRuleInCurrentState(baseCtx)) return false;
      if (this.options.findExplicitHit(targetKey)) return false;
    }
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
    const getCondition = rule.getCondition;
    if (!getCondition) return true;
    const cond = getCondition();
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
      const ret = await runjsWithSafeGlobals(evalCtx, code, { version });
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
    const ctx: any = new FlowContext();
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

    // “当前项”链：用于多层级关系字段条件
    // 语义：ctx.item -> { index?, length?, __is_new__?, __is_stored__?, value, parentItem? }，其中：
    // - index：仅当当前对象位于对多关联行内时存在（0-based）
    // - length：仅当当前对象位于对多关联行内时存在，表示当前层数组总数
    // - value：当前对象的值（来自 formValues 的对应切片，支持无限嵌套属性访问）
    // - parentItem：上级项（同结构，可链式 parentItem.parentItem...）
    // 计算顺序：
    // 1) 优先按 targetNamePath 从 formValues 构建“关联链 item”
    // 2) 若无法构建（例如目标字段是顶层路径），回退到上游显式注入的 baseCtx.item
    //    （如 PopupSubTable 新增弹窗传入的 parentItem 链）
    let itemCached: any;
    let itemCachedReady = false;
    const getFallbackItem = () => {
      try {
        return baseCtx?.item;
      } catch {
        return undefined;
      }
    };
    const getItem = () => {
      if (!itemCachedReady) {
        const chainItem = this.buildItemChainValue(baseCtx, trackingFormValues, targetNamePath);
        itemCached = typeof chainItem === 'undefined' ? getFallbackItem() : chainItem;
        itemCachedReady = true;
      }
      return itemCached;
    };
    ctx.defineProperty('item', { get: getItem, cache: false });
    return ctx;
  }

  private buildItemChainValue(baseCtx: any, trackingFormValues: any, targetNamePath: NamePath | null) {
    const rootCollection = this.getRootCollection() || this.getCollectionFromContext(baseCtx);
    const buildNode = (value: any, index: number | undefined, length: number | undefined, parentItem: any) => {
      return {
        index,
        length,
        __is_new__: value?.__is_new__,
        __is_stored__: value?.__is_stored__,
        value,
        parentItem,
      };
    };
    const defaultRoot = buildNode(trackingFormValues, undefined, undefined, undefined);
    // item 仅用于“关系字段的子路径”场景；
    // 顶层字段/非关联嵌套对象字段应使用 formValues。
    if (!targetNamePath || !Array.isArray(targetNamePath) || !targetNamePath.length) return undefined;
    if (!rootCollection?.getField) return undefined;

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
      const value = _.get(trackingFormValues, assocEntry.path);
      const lastSeg = assocEntry.path[assocEntry.path.length - 1];
      const index = assocEntry.toMany && typeof lastSeg === 'number' ? lastSeg : undefined;
      const length = (() => {
        if (!assocEntry.toMany) return undefined;
        // assocEntry.path: [..., associationKey, rowIndex]
        const listPath = assocEntry.path.slice(0, -1);
        const list = _.get(trackingFormValues, listPath);
        return Array.isArray(list) ? list.length : undefined;
      })();
      return buildNode(value, index, length, build(idx - 1));
    };

    return assocEntries.length ? build(assocEntries.length - 1) : undefined;
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

      // 特殊变量：item 为 RuleEngine 注入的计算属性（不直接存在于 baseCtx 上），其 parentItem/index 链依赖 fieldIndex。
      if (varName === 'item') {
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
