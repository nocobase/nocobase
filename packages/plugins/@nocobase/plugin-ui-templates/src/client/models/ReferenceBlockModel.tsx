/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import _ from 'lodash';
import { escapeT, type FlowEngine, type FlowModel } from '@nocobase/flow-engine';
import { tStr, NAMESPACE } from '../locale';
import { BlockModel } from '@nocobase/client';
import { renderTemplateSelectLabel, renderTemplateSelectOption } from '../components/TemplateSelectOption';
import {
  TEMPLATE_LIST_PAGE_SIZE,
  calcHasMore,
  getTemplateAvailabilityDisabledReason,
  normalizeStr,
  parseResourceListResponse,
} from '../utils/templateCompatibility';
import { bindInfiniteScrollToFormilySelect, defaultSelectOptionComparator } from '../utils/infiniteSelect';
import {
  ensureBlockScopedEngine,
  ReferenceScopedRenderer,
  renderReferenceTargetPlaceholder,
  ensureScopedEngineView,
  unlinkScopedEngine,
} from './referenceShared';

/**
 * ReferenceBlockModel（插件版）
 * - 通过配置 targetUid（实例 model.uid）引用并渲染另一个区块；
 * - 在 BlockScoped 引擎中实例化目标区块，隔离模型实例与事件缓存；
 * - 与目标区块建立父子关系（目标仅作为 Reference 的子模型用于设置菜单聚合，不做持久化）；
 * - 当目标缺失/非法/循环时，渲染占位提示；
 * - title 仅展示目标标题；模板信息通过 extraTitle 展示（配置态双标签）。
 */
export class ReferenceBlockModel extends BlockModel {
  constructor(options: any) {
    super(options);
    // 通过 Proxy 将未知属性/方法转发到目标模型：
    // - 若属性/方法在本实例（含原型链）已存在，则不代理；
    // - 若不存在且已解析出 _targetModel，则从目标模型读取；函数按目标模型上下文绑定；
    // - 支持写入：未知属性写入目标模型（若存在对应键）；否则写回自身。
    const proxy = new Proxy(this as any, {
      get(target, prop: string | symbol, receiver) {
        if (prop in target) {
          // 自身已有（含原型链）则直接返回；若为函数需绑定到 target，避免 private field 访问报错
          const val = Reflect.get(target, prop, target);
          if (typeof val === 'function' && prop !== 'constructor') {
            return val.bind(target);
          }
          return val;
        }
        const t = target._targetModel as any;
        if (t) {
          const val = Reflect.get(t, prop, t);
          if (typeof val === 'function' && prop !== 'constructor') {
            return val.bind(t);
          }
          if (val !== undefined) return val;
        }
        return undefined;
      },
      set(target, prop: string | symbol, value, receiver) {
        if (prop in target) {
          return Reflect.set(target, prop, value, target);
        }
        const t = target._targetModel as any;
        if (t && prop in t) {
          return Reflect.set(t, prop, value, t);
        }
        return Reflect.set(target, prop, value, target);
      },
      has(target, prop: string | symbol) {
        if (prop in target) return true;
        const t = target._targetModel as any;
        return !!t && prop in t;
      },
      ownKeys(target) {
        const keys = new Set(Reflect.ownKeys(target));
        const t = target._targetModel as any;
        if (t) {
          for (const k of Reflect.ownKeys(t)) keys.add(k);
        }
        return Array.from(keys);
      },
      getOwnPropertyDescriptor(target, prop: string | symbol) {
        const desc = Reflect.getOwnPropertyDescriptor(target, prop);
        if (desc) return desc;
        const t = target._targetModel as any;
        if (!t) return undefined;
        return Object.getOwnPropertyDescriptor(t, prop) || undefined;
      },
    });
    return proxy as any;
  }
  public settingsMenuLevel = 2;
  private _scopedEngine?: FlowEngine;
  private _targetModel?: FlowModel;
  private _resolvedTargetUid?: string;
  private _invalidTargetUid?: string;

  get title() {
    return this._targetModel?.title || super.title;
  }

  onInit(option) {
    super.onInit(option);
    this.context.defineProperty('refModel', {
      get: () => this._targetModel,
      cache: false,
    });

    // 事件流/过滤器等配置 UI（如 setTargetDataScope 的 VariableFilterItem）依赖 model.context.collection/resource 等
    // 来构建可选字段列表。但 ReferenceBlockModel 只是一个壳：真正的 collection/resource 在目标区块模型上。
    // 这里桥接相关上下文属性到目标模型，避免“能找到模型实例但字段下拉为空”。
    const contextKeys = ['collection', 'dataSource', 'resource', 'association', 'resourceName'] as const;
    type ContextKey = (typeof contextKeys)[number];
    const getTargetContext = () => this._targetModel?.context;
    contextKeys.forEach((key: ContextKey) => {
      this.context.defineProperty(key, {
        cache: false,
        get: () => getTargetContext()?.[key],
      });
    });
  }

  private _getTargetUidFromParams(): string | undefined {
    const p = this.getStepParams('referenceSettings', 'target') || {};
    return (p?.targetUid || '').trim() || undefined;
  }

  private _syncExtraTitle(configured: boolean) {
    if (!configured) {
      this.setExtraTitle('');
      return;
    }

    const label = this.context.t('Reference template', { ns: [NAMESPACE, 'client'], nsMode: 'fallback' });
    const step = this.getStepParams('referenceSettings', 'useTemplate') || {};
    const tplName = step?.templateName || step?.templateUid;
    this.setExtraTitle(tplName ? `${label}: ${tplName}` : label);
  }

  private _ensureScopedEngine(): FlowEngine {
    this._scopedEngine = ensureBlockScopedEngine(this.flowEngine, this._scopedEngine);
    // 引用区块会在 scoped engine 中 loadModel，目标模型的 onInit 可能会读取 ctx.view。
    // 部分场景（如审批配置）view 仅存在于宿主模型上下文而非 engine.context，需要显式桥接。
    ensureScopedEngineView(this._scopedEngine, this.context as any);
    return this._scopedEngine;
  }

  /**
   * 解析最终目标模型：
   * - 支持 reference-of-reference 扁平化（直到非 ReferenceBlockModel）；
   * - 简单循环检测（A→B→A 等）；
   * - 目标缺失或非法时返回 null。
   */
  private async _resolveFinalTarget(uid: string): Promise<FlowModel | null> {
    const engine = this._ensureScopedEngine();
    const visited = new Set<string>();
    let currentUid = uid;
    for (let i = 0; i < 20; i++) {
      if (!currentUid) return null;
      if (visited.has(currentUid) || currentUid === this.uid) {
        return null;
      }
      visited.add(currentUid);

      const model = await engine.loadModel<FlowModel>({ uid: currentUid });
      if (!model) return null;

      const isReference = model.constructor.name === 'ReferenceBlockModel';
      if (!isReference) {
        return model;
      }

      const next = model.getStepParams('referenceSettings', 'target')?.targetUid;
      if (!next || typeof next !== 'string' || !next.trim()) {
        return null;
      }
      currentUid = String(next).trim();
    }
    return null;
  }

  public async onDispatchEventStart(eventName: string): Promise<void> {
    if (eventName !== 'beforeRender') return;
    const stepParams = (this.getStepParams as any)?.('referenceSettings', 'target') || {};
    const targetUid = (stepParams?.targetUid || '').trim() || undefined;
    if (!targetUid) {
      this._syncExtraTitle(false);
      const oldTarget: FlowModel | undefined = (this.subModels as any)['target'];
      if (oldTarget) {
        (this as any).emitter?.emit?.('onSubModelRemoved', oldTarget);
        this._scopedEngine?.removeModel(oldTarget.uid);
      }
      this._targetModel = undefined;
      this._resolvedTargetUid = undefined;
      this._invalidTargetUid = undefined;
      (this.subModels as any)['target'] = undefined;
      return;
    }

    this._syncExtraTitle(true);
    if (this._resolvedTargetUid === targetUid && this._targetModel) {
      this._invalidTargetUid = undefined;
      return;
    }
    // 进入解析流程：先清理 invalid 标记，避免渲染层误判为 invalid
    this._invalidTargetUid = undefined;
    let target = await this._resolveFinalTarget(targetUid);
    if (!target) {
      // 与 ReferenceFormGridModel 保持一致：中间态下可能首次解析失败，做一次轻量重试避免闪错
      await new Promise((resolve) => setTimeout(resolve, 50));
      const latestStepParams = (this.getStepParams as any)?.('referenceSettings', 'target') || {};
      const latestTargetUid = (latestStepParams?.targetUid || '').trim() || undefined;
      if (latestTargetUid !== targetUid) {
        return;
      }
      target = await this._resolveFinalTarget(targetUid);
    }
    if (!target) {
      const oldTarget: FlowModel | undefined = (this.subModels as any)['target'];
      if (oldTarget) {
        (this as any).emitter?.emit?.('onSubModelRemoved', oldTarget);
        this._scopedEngine?.removeModel(oldTarget.uid);
      }
      this._targetModel = undefined;
      this._resolvedTargetUid = undefined;
      this._invalidTargetUid = targetUid;
      (this.subModels as any)['target'] = undefined;
      this.rerender();
      return;
    }

    target.setParent(this);
    const oldTarget: FlowModel | undefined = (this.subModels as any)['target'];
    if (oldTarget?.uid !== target.uid) {
      this.setSubModel('target', target);
      if (oldTarget) {
        this._scopedEngine?.removeModel(oldTarget.uid);
      }
    } else {
      (this.subModels as any)['target'] = target;
      (this as any).emitter?.emit?.('onSubModelReplaced', { oldModel: oldTarget, newModel: target });
    }

    this._targetModel = target;
    this._resolvedTargetUid = targetUid;
    this._invalidTargetUid = undefined;
    this.rerender();
  }

  async destroy(): Promise<boolean> {
    try {
      unlinkScopedEngine(this._scopedEngine);
    } finally {
      this._scopedEngine = undefined;
    }
    return await super.destroy();
  }

  /**
   * 重写 serialize 方法，排除 target 子模型的序列化
   * 这样在保存引用区块时不会连带保存目标区块，避免破坏目标区块的父子关系
   */
  serialize(): Record<string, any> {
    const data = super.serialize();
    // 从序列化结果中移除 target 子模型
    if (data.subModels && 'target' in data.subModels) {
      delete data.subModels.target;
      // 如果 subModels 为空对象，也删除它
      if (Object.keys(data.subModels).length === 0) {
        delete data.subModels;
      }
    }
    return data;
  }

  renderComponent() {
    const target: FlowModel | undefined = (this.subModels as any)?.['target'];
    const configuredUid = this._getTargetUidFromParams();
    if (!target) {
      if (!configuredUid) {
        return renderReferenceTargetPlaceholder(this as any, 'unconfigured');
      }
      if (this._invalidTargetUid === configuredUid) {
        return renderReferenceTargetPlaceholder(this as any, 'invalid');
      }
      // 目标尚未解析完成：展示 resolving，占位避免闪现 invalid
      return renderReferenceTargetPlaceholder(this as any, 'resolving');
    }
    // 使用 BlockScoped 引擎包裹渲染，确保拖拽/移动等操作拿到正确的 engine
    const engine = this._ensureScopedEngine();
    return <ReferenceScopedRenderer engine={engine} model={target} />;
  }

  public render(): any {
    return <div ref={this.context.ref}>{this.renderComponent()}</div>;
  }
}

ReferenceBlockModel.registerFlow({
  key: 'referenceSettings',
  sort: -999,
  title: tStr('Select block template'),
  steps: {
    useTemplate: {
      preset: true,
      hideInSettings: true,
      sort: -10,
      title: tStr('Select block template'),
      uiSchema: (ctx) => {
        const m = (ctx.model as any) || {};
        const step = m.getStepParams?.('referenceSettings', 'useTemplate') || {};
        const templateUid = (step?.templateUid || '').trim();
        const isNew = !!m.isNew;
        const disableSelect = !isNew && !!templateUid;
        const api = (ctx as any)?.api;
        const resolveExpectedAssociationName = (): string => {
          try {
            const init = m.getStepParams?.('resourceSettings', 'init') || {};
            const fromInit = normalizeStr(init?.associationName);
            if (fromInit) return fromInit;

            const assocName = normalizeStr((m as any)?.context?.association?.resourceName);
            if (assocName) return assocName;

            const resourceCtx = (m as any)?.context?.resource;
            if (resourceCtx) {
              const fromResourceAssoc =
                typeof resourceCtx.getAssociationName === 'function'
                  ? normalizeStr(resourceCtx.getAssociationName())
                  : '';
              if (fromResourceAssoc) return fromResourceAssoc;
              // resourceName 在关联资源场景通常形如 `users.profile`
              const fromResourceName =
                typeof resourceCtx.getResourceName === 'function' ? normalizeStr(resourceCtx.getResourceName()) : '';
              if (fromResourceName) return fromResourceName;
            }

            const viewArgs = (m as any)?.context?.view?.inputArgs || {};
            const fromView = normalizeStr(viewArgs?.associationName);
            if (fromView) return fromView;
          } catch (_) {
            // ignore
          }
          return '';
        };
        const expectedAssociationName = resolveExpectedAssociationName();
        const getTemplateDisabledReason = (tpl: Record<string, any>): string | undefined => {
          return getTemplateAvailabilityDisabledReason(
            ctx,
            tpl,
            { associationName: expectedAssociationName },
            { checkResource: false, associationMatch: 'associationResourceOnly' },
          );
        };

        const fetchOptions = async (
          keyword?: string,
          pagination?: { page?: number; pageSize?: number },
        ): Promise<{ options: any[]; hasMore: boolean }> => {
          const page = Math.max(1, Number(pagination?.page || 1));
          const pageSize = Math.max(1, Number(pagination?.pageSize || TEMPLATE_LIST_PAGE_SIZE));
          try {
            const res = await api?.resource?.('flowModelTemplates')?.list({
              page,
              pageSize,
              search: keyword || undefined,
              filter: {
                $and: [
                  {
                    $or: [{ type: { $notIn: ['popup'] } }, { type: null }, { type: '' }],
                  },
                ],
              },
            });
            const { rows, count } = parseResourceListResponse<any>(res);
            const rawLength = rows.length;
            const optsWithIndex = rows.map((r, idx) => {
              const name = r.name || r.uid || '';
              const desc = r.description;
              const disabledReason = getTemplateDisabledReason(r || {});
              return {
                __idx: (page - 1) * pageSize + idx,
                label: renderTemplateSelectLabel(name),
                value: r.uid,
                description: desc,
                disabled: !!disabledReason,
                disabledReason,
                rawName: name,
              };
            });
            return {
              options: optsWithIndex.slice().sort(defaultSelectOptionComparator),
              hasMore: calcHasMore({ page, pageSize, rowsLength: rawLength, count }),
            };
          } catch (e) {
            console.error('fetch template options failed', e);
            return { options: [], hasMore: false };
          }
        };
        return {
          templateUid: {
            title: tStr('Template'),
            'x-decorator': 'FormItem',
            'x-component': 'Select',
            'x-component-props': {
              showSearch: true,
              filterOption: false,
              allowClear: true,
              placeholder: tStr('Search templates'),
              disabled: disableSelect,
              optionLabelProp: 'label',
              dropdownMatchSelectWidth: true,
              dropdownStyle: { maxWidth: 560 },
              getPopupContainer: () => document.body,
              optionRender: renderTemplateSelectOption,
            },
            default: templateUid || undefined,
            'x-validator': [
              {
                required: true,
              },
            ],
            'x-reactions': [
              (field) => {
                bindInfiniteScrollToFormilySelect(
                  field,
                  async (keyword: string, page: number, pageSize: number) => {
                    return fetchOptions(keyword, { page, pageSize });
                  },
                  { pageSize: TEMPLATE_LIST_PAGE_SIZE, composingKey: '__templateComposing' },
                );
              },
            ],
          },
          templateName: {
            'x-hidden': true,
            'x-component': 'Input',
            default: step?.templateName,
          },
          templateDescription: {
            'x-hidden': true,
            'x-component': 'Input',
            default: step?.templateDescription,
          },
          mode: {
            title: tStr('Mode'),
            'x-decorator': 'FormItem',
            'x-component': 'Radio.Group',
            enum: [
              { label: tStr('Reference'), value: 'reference' },
              { label: tStr('Duplicate'), value: 'copy' },
            ],
            default: step?.mode || 'reference',
          },
          modeDescriptionReference: {
            type: 'void',
            'x-decorator': 'FormItem',
            'x-decorator-props': { colon: false },
            'x-component': 'Alert',
            'x-component-props': {
              type: 'info',
              showIcon: false,
              message: tStr('Reference mode description'),
              style: { marginTop: -8 },
            },
            'x-reactions': {
              dependencies: ['mode'],
              fulfill: { state: { hidden: '{{$deps[0] === "copy"}}' } },
            },
          },
          modeDescriptionDuplicate: {
            type: 'void',
            'x-decorator': 'FormItem',
            'x-decorator-props': { colon: false },
            'x-component': 'Alert',
            'x-component-props': {
              type: 'info',
              showIcon: false,
              message: tStr('Duplicate mode description'),
              style: { marginTop: -8 },
            },
            'x-reactions': {
              dependencies: ['mode'],
              fulfill: { state: { hidden: '{{$deps[0] !== "copy"}}' } },
            },
          },
        };
      },
      async beforeParamsSave(ctx, params) {
        const templateUid = (params?.templateUid || '').trim();
        if (!templateUid) return;

        const api = (ctx as any)?.api;
        let tpl: any = null;
        if (api?.resource) {
          try {
            const res = await api.resource('flowModelTemplates').get({
              filterByTk: templateUid,
            });
            tpl = res?.data?.data || res;
          } catch (e) {
            console.warn('fetch template failed', e);
          }
        }

        const targetUid = tpl?.targetUid;
        const mode = params?.mode || 'reference';

        // 复制模式：调用 target step 的 beforeParamsSave
        if (mode === 'copy' && targetUid) {
          const flow = (ctx.model.constructor as typeof FlowModel).globalFlowRegistry.getFlow('referenceSettings');
          const targetStepDef = flow?.steps?.target as any;
          if (targetStepDef?.beforeParamsSave) {
            await targetStepDef.beforeParamsSave(ctx, { targetUid, mode: 'copy' });
          }
          return;
        }

        // 引用模式：不需要特殊处理，handler 会处理
      },
      async handler(ctx, params) {
        const templateUid = (params?.templateUid || '').trim();
        if (!templateUid) return;

        const mode = params?.mode || 'reference';
        // 复制模式已在 beforeParamsSave 中处理完毕
        if (mode === 'copy') return;

        const api = (ctx as any)?.api;
        let tpl: any = null;
        if (api?.resource) {
          try {
            const res = await api.resource('flowModelTemplates').get({
              filterByTk: templateUid,
            });
            tpl = res?.data?.data || res;
          } catch (e) {
            console.warn('fetch template failed', e);
          }
        }

        const templateName = tpl?.name || params?.templateName;
        const templateDescription = tpl?.description || params?.templateDescription;
        const targetUid = tpl?.targetUid;

        // 引用模式：保存参数，ReferenceBlockModel 会在 beforeRender 中加载目标
        const useTemplateParams = (ctx.model as FlowModel).getStepParams('referenceSettings', 'useTemplate') || {};
        (ctx.model as FlowModel).setStepParams('referenceSettings', 'useTemplate', {
          ...useTemplateParams,
          templateUid,
          templateName,
          templateDescription,
          targetUid: targetUid || useTemplateParams?.targetUid,
          mode,
        });

        if (targetUid) {
          const targetParams = (ctx.model as FlowModel).getStepParams('referenceSettings', 'target') || {};
          (ctx.model as FlowModel).setStepParams('referenceSettings', 'target', {
            ...targetParams,
            targetUid,
            mode,
          });
        }

        const resourceInit = (ctx.model as FlowModel).getStepParams('resourceSettings', 'init') || {};
        const dataSourceKey = tpl?.dataSourceKey ?? resourceInit?.dataSourceKey;
        const collectionName = tpl?.collectionName ?? resourceInit?.collectionName;
        const associationName = tpl?.associationName ?? resourceInit?.associationName;
        const filterByTk = tpl?.filterByTk ?? resourceInit?.filterByTk;
        const sourceId = tpl?.sourceId ?? resourceInit?.sourceId;
        if (dataSourceKey || collectionName || associationName || filterByTk || sourceId) {
          (ctx.model as FlowModel).setStepParams('resourceSettings', 'init', {
            ...resourceInit,
            dataSourceKey,
            collectionName,
            associationName,
            filterByTk,
            sourceId,
          });
        }
      },
    },
    target: {
      preset: true,
      hideInSettings: true,
      title: tStr('Template settings'),
      uiSchema: (ctx) => {
        const m = (ctx.model as any) || {};
        const step = m.getStepParams?.('referenceSettings', 'target') || {};
        const uid = (step?.targetUid || '').trim();
        const isNew = !!m.isNew;
        const hasConfigured = !!uid;
        const templateStep = m.getStepParams?.('referenceSettings', 'useTemplate') || {};
        const hasTemplate = !!templateStep?.templateUid;
        // 更精准的有效性判断：要求已解析的 _targetModel 存在且与当前 uid 匹配
        const resolvedUid = m._resolvedTargetUid;
        const resolvedModel = m._targetModel;
        const hasValidTarget = !!resolvedModel && resolvedUid === uid;
        const disableUid = (!isNew && hasConfigured && hasValidTarget) || hasTemplate;
        return {
          targetUid: {
            title: tStr('Block UID'),
            'x-component': 'Input',
            'x-decorator': 'FormItem',
            'x-decorator-props': {
              tooltip: disableUid ? tStr('Block UID is already set and cannot be modified') : undefined,
            },
            'x-component-props': {
              disabled: disableUid,
            },
            'x-validator': [
              {
                format: 'string',
                required: true,
              },
            ],
          },
          mode: {
            title: tStr('Mode'),
            'x-component': 'Radio.Group',
            'x-decorator': 'FormItem',
            'x-component-props': {
              disabled: hasTemplate,
            },
            enum: [
              { label: tStr('Reference'), value: 'reference' },
              { label: tStr('Duplicate'), value: 'copy' },
            ],
          },
          copyNotice: {
            type: 'void',
            'x-decorator': 'FormItem',
            'x-component': 'Alert',
            'x-component-props': {
              type: 'warning',
              showIcon: true,
              message: tStr('Some configurations using uid may need to be reconfigured'),
            },
            'x-reactions': {
              dependencies: ['mode'],
              fulfill: {
                state: {
                  hidden: '{{$deps[0] !== "copy"}}',
                },
              },
            },
          },
        };
      },
      defaultParams() {
        return { mode: 'reference' };
      },
      async beforeParamsSave(ctx, params) {
        const v = (params?.targetUid || '').trim();
        const mode = params?.mode || 'reference';
        if (mode !== 'copy' || !v) return;
        const engine = ctx.engine;
        // 1) 先在服务端复制目标模型，得到新的根节点 JSON（含新 uid）
        const duplicated = await engine.duplicateModel(v);
        if (!duplicated) return;

        // 2) 计算父模型与原位置
        const oldModel = ctx.model as FlowModel;
        const parent = oldModel.parent as FlowModel | undefined;
        const subKey = oldModel.subKey as string;
        const subType = (oldModel as any).subType as 'array' | 'object';

        // 若没有父模型，直接退出（无处安放新实例）
        if (!parent || !subKey) {
          ctx.exit();
          return;
        }

        let insertIndex = -1;
        if (subType === 'array') {
          const arr = ((parent.subModels as any)[subKey] || []) as FlowModel[];
          insertIndex = Array.isArray(arr) ? arr.findIndex((m) => m?.uid === oldModel.uid) : -1;
          if (insertIndex < 0) insertIndex = arr.length;
        }

        // 3) 在本地创建新实例（挂到同一父与 subKey）
        const newOptions = {
          ...duplicated,
          parentId: parent.uid,
          subKey,
          subType,
          sortIndex: insertIndex >= 0 ? insertIndex : 0,
        } as any;
        const newModel = engine.createModel<FlowModel>(newOptions);
        newModel.setParent(parent);
        newModel.sortIndex = insertIndex >= 0 ? insertIndex : 0;

        const isPresetOrNew = !!(oldModel as any).isNew;
        // 4) 预设/新建 与 已持久化 分支分别处理
        if (isPresetOrNew) {
          // 新建场景：直接替换临时的 ReferenceBlockModel
          if (subType === 'array') {
            let arr = (parent.subModels as any)[subKey] as FlowModel[] | undefined;
            if (!Array.isArray(arr)) {
              (parent.subModels as any)[subKey] = [];
              arr = (parent.subModels as any)[subKey] as FlowModel[];
            }
            // 找到旧模型的位置并替换
            const oldIndex = arr.findIndex((m) => m?.uid === oldModel.uid);
            if (oldIndex >= 0) {
              arr.splice(oldIndex, 1, newModel);
            } else {
              arr.push(newModel);
            }
            arr.forEach((m, idx) => (m.sortIndex = idx));
          } else {
            parent.setSubModel(subKey, newModel);
          }

          engine.removeModel(oldModel.uid);

          (newModel as any).isNew = true;
          (parent as any).emitter?.emit?.('onSubModelAdded', newModel);
          await (newModel as any).afterAddAsSubModel?.();

          await engine.modelRepository.destroy(newModel.uid);
          await newModel.save();

          (newModel as any).isNew = false;
          await parent.saveStepParams();
          parent.rerender();
        } else {
          // replace：保持当前位置不变——手动插入到与旧实例相同的索引，并更新 rows 将旧 uid 替换为新 uid
          if (subType === 'array') {
            let arr = (parent.subModels as any)[subKey] as FlowModel[] | undefined;
            if (!Array.isArray(arr)) {
              (parent.subModels as any)[subKey] = [];
              arr = (parent.subModels as any)[subKey] as FlowModel[];
            }
            const finalIndex = Math.min(Math.max(insertIndex, 0), arr.length);
            arr.splice(finalIndex, 0, newModel);
            arr.forEach((m, idx) => (m.sortIndex = idx));

            // 替换 Grid rows 中的 uid，保持原位置
            const gridParams = parent.getStepParams('gridSettings', 'grid') || {};
            if (gridParams?.rows && typeof gridParams.rows === 'object') {
              const newRows = _.cloneDeep(gridParams.rows);
              for (const rowId of Object.keys(newRows)) {
                const columns = newRows[rowId];
                if (Array.isArray(columns)) {
                  for (let ci = 0; ci < columns.length; ci++) {
                    const col = columns[ci];
                    if (Array.isArray(col)) {
                      for (let ii = 0; ii < col.length; ii++) {
                        if (col[ii] === oldModel.uid) {
                          col[ii] = newModel.uid;
                        }
                      }
                    }
                  }
                }
              }
              parent.setStepParams('gridSettings', 'grid', { rows: newRows, sizes: gridParams.sizes || {} });
              parent.setProps('rows', newRows);
            }
            await (newModel as any).afterAddAsSubModel?.();
          } else {
            parent.setSubModel(subKey, newModel);
            await (newModel as any).afterAddAsSubModel?.();
          }

          // 5) 已持久化场景：先保存新实例、再相对移动并删除旧实例，最后只保存布局参数
          await newModel.save();
          (newModel as any).isNew = false;
          // 5b) 已持久化场景：若为数组子模型，则在服务端相对移动保持原位置；随后销毁旧实例
          if (subType === 'array' && engine.modelRepository) {
            const targetExists = await (engine.modelRepository as any).findOne({ uid: oldModel.uid });
            if (targetExists && typeof (engine.modelRepository as any).move === 'function') {
              await (engine.modelRepository as any).move(newModel.uid, oldModel.uid, 'before');
            }
          }
          await engine.destroyModel(oldModel.uid);
          // 持久化父模型的布局参数
          await parent.saveStepParams();
        }

        // 关闭设置视图
        ctx.exit();
      },
    },
  },
});

ReferenceBlockModel.registerFlow({
  key: 'cardSettings',
  steps: {}, // 隐藏自身的block配置
});

ReferenceBlockModel.define({
  label: tStr('Block template'),
  group: escapeT('Other blocks'),
  createModelOptions: {
    use: 'ReferenceBlockModel',
  },
  sort: 900,
});
