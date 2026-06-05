/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Button, Space } from 'antd';
import { BlockModel, CommonItemModel, FilterFormBlockModel, FormBlockModel } from '@nocobase/client';
import {
  FlowModel,
  FlowContext,
  type FlowModelContext,
  createBlockScopedEngine,
  FlowExitException,
  isInheritedFrom,
  type ModelConstructor,
  tExpr,
} from '@nocobase/flow-engine';
import { NAMESPACE, tStr } from '../locale';
import { renderTemplateSelectLabel, renderTemplateSelectOption } from '../components/TemplateSelectOption';
import {
  TEMPLATE_LIST_PAGE_SIZE,
  calcHasMore,
  getTemplateAvailabilityDisabledReason,
  parseResourceListResponse,
  resolveExpectedResourceInfoByModelChain,
} from '../utils/templateCompatibility';
import { bindInfiniteScrollToFormilySelect, defaultSelectOptionComparator } from '../utils/infiniteSelect';
import { patchGridOptionsFromTemplateRoot } from '../utils/templateCopy';
import { REF_HOST_CTX_KEY } from '../constants';

type ImporterProps = {
  expectedRootUse?: string | string[];
  expectedDataSourceKey?: string;
  expectedCollectionName?: string;
};

const FLOW_KEY = 'subModelTemplateImportSettings';
const GRID_REF_FLOW_KEY = 'referenceSettings';
const GRID_REF_STEP_KEY = 'useTemplate';

/** 最大递归深度，防止循环引用或过深嵌套 */
const MAX_NORMALIZE_DEPTH = 20;

type NormalizeSubModelTemplateImportNode = (
  node: Record<string, unknown>,
  ctx: { mountTarget: FlowModel; engine: FlowModel['flowEngine'] },
) => Record<string, unknown> | undefined;

interface ModelWithGetModelClassName {
  getModelClassName?: (name: string) => string | undefined;
}

function resolveMappedFormItemUse(mountTarget: FlowModel): string | undefined {
  const sources: Array<ModelWithGetModelClassName | undefined> = [
    mountTarget as FlowModel & ModelWithGetModelClassName,
    mountTarget.context as ModelWithGetModelClassName | undefined,
  ];
  for (const source of sources) {
    if (typeof source?.getModelClassName === 'function') {
      const mapped = source.getModelClassName('FormItemModel');
      if (mapped) return mapped;
    }
  }
  return undefined;
}

interface NormalizeOptions {
  normalizeMappedItem?: NormalizeSubModelTemplateImportNode;
  mountTarget?: FlowModel;
}

function normalizeGridModelOptionsForMappedFormItemUse(
  input: unknown,
  mappedFormItemUse: string,
  options?: NormalizeOptions,
  depth = 0,
) {
  if (depth > MAX_NORMALIZE_DEPTH) {
    return;
  }

  if (Array.isArray(input)) {
    return input.map((n) => normalizeGridModelOptionsForMappedFormItemUse(n, mappedFormItemUse, options, depth + 1));
  }
  if (!input || typeof input !== 'object') {
    return input;
  }

  const source = input as Record<string, unknown>;
  const next: Record<string, unknown> = { ...source };

  if (next.use === 'FormItemModel') {
    next.use = mappedFormItemUse;
  }

  if (next.subModels) {
    const subModels = next.subModels;
    next.subModels = Object.fromEntries(
      Object.entries(subModels).map(([k, v]) => [
        k,
        normalizeGridModelOptionsForMappedFormItemUse(v, mappedFormItemUse, options, depth + 1),
      ]),
    );
  }

  const { mountTarget, normalizeMappedItem } = options || {};
  if (mountTarget && typeof normalizeMappedItem === 'function' && next.use === mappedFormItemUse) {
    const normalized = normalizeMappedItem(next, { mountTarget, engine: mountTarget.flowEngine });
    if (normalized && typeof normalized === 'object') {
      return normalized;
    }
  }

  return next;
}

function findBlockModel(model: FlowModel): BlockModel | undefined {
  if (!model) return;
  if (model instanceof BlockModel) {
    return model;
  }
  return findBlockModel(model.parent);
}

function isModelInsideReferenceBlock(model: FlowModel | undefined): boolean {
  if (!model) return false;
  return model.parent?.use === 'ReferenceBlockModel';
}

export function resolveExpectedRootUse(blockModel: FlowModel | undefined): string | string[] {
  // Create/Edit：允许互通
  if (blockModel?.use === 'CreateFormModel' || blockModel?.use === 'EditFormModel') {
    return ['CreateFormModel', 'EditFormModel'];
  }
  // 审批发起/处理表单：允许互通（最小改动方案）
  if (blockModel?.use === 'ApplyFormModel' || blockModel?.use === 'ProcessFormModel') {
    return ['ApplyFormModel', 'ProcessFormModel'];
  }
  return blockModel?.use || '';
}

export class SubModelTemplateImporterModel extends CommonItemModel {
  declare props: ImporterProps;

  public resolveExpectedResourceInfo(
    ctx?: FlowContext,
    start?: FlowModel,
  ): { dataSourceKey?: string; collectionName?: string } {
    const fromPropsDataSourceKey = String(this.props?.expectedDataSourceKey || '').trim();
    const fromPropsCollectionName = String(this.props?.expectedCollectionName || '').trim();
    if (fromPropsDataSourceKey && fromPropsCollectionName) {
      return { dataSourceKey: fromPropsDataSourceKey, collectionName: fromPropsCollectionName };
    }
    const resolved = resolveExpectedResourceInfoByModelChain(ctx, start || this.parent, {
      dataSourceManager: this.context.dataSourceManager,
    });
    return {
      dataSourceKey: String(resolved?.dataSourceKey || fromPropsDataSourceKey || '').trim() || undefined,
      collectionName: String(resolved?.collectionName || fromPropsCollectionName || '').trim() || undefined,
    };
  }

  async afterAddAsSubModel() {
    // 作为临时"动作模型"，添加后执行导入逻辑并自清理
    const parentGrid = this.parent as FlowModel | undefined;
    const mountTarget = parentGrid?.parent;

    // 先自清理：避免被保存为真实字段
    this.remove();

    // 注意：GridModel 会在 onSubModelRemoved 中触发 saveStepParams（异步且不 await），
    // 若我们紧接着替换/保存 grid，会与该 save 竞争导致最终落库被覆盖。
    // 这里显式等待一次同 uid 的保存完成，确保后续 replaceModel/save 不被"旧 grid saveStepParams"覆盖。
    await parentGrid.saveStepParams();
    const step = (this.getStepParams(FLOW_KEY, 'selectTemplate') || {}) as Record<string, any>;
    const templateUid = String(step.templateUid || '').trim();
    const targetUid = String(step.targetUid || '').trim();
    const templateName = String(step.templateName || '').trim() || undefined;
    const templateDescription = String(step.templateDescription || '').trim() || undefined;
    const mode = String(step.mode || 'reference');

    const existingGrid = mountTarget.subModels?.grid as FlowModel;

    if (mode === 'copy') {
      const scoped = createBlockScopedEngine(mountTarget.flowEngine);
      const root = await scoped.loadModel<FlowModel>({ uid: targetUid });
      const gridModel = root.subModels?.grid as FlowModel;

      const duplicated = await mountTarget.flowEngine.duplicateModel(gridModel.uid);
      const duplicatedUid = duplicated.uid;

      // 自定义表单区块可能会对 FormItemModel 做映射：这里按 block 提供的映射将模板字段入口改为目标入口
      const rawMappedUse = resolveMappedFormItemUse(mountTarget);
      const mappedUse =
        rawMappedUse && rawMappedUse !== 'FormItemModel' && mountTarget.flowEngine.getModelClass(rawMappedUse)
          ? rawMappedUse
          : undefined;

      type ModelClassWithNormalize = { normalizeSubModelTemplateImportNode?: NormalizeSubModelTemplateImportNode };
      const mappedClass = mappedUse
        ? (mountTarget.flowEngine.getModelClass(mappedUse) as ModelClassWithNormalize | undefined)
        : undefined;
      const normalizeFn =
        mappedClass && typeof mappedClass.normalizeSubModelTemplateImportNode === 'function'
          ? mappedClass.normalizeSubModelTemplateImportNode
          : undefined;

      const normalized = mappedUse
        ? normalizeGridModelOptionsForMappedFormItemUse(duplicated, mappedUse, {
            mountTarget,
            normalizeMappedItem: normalizeFn,
          })
        : duplicated;

      const merged = patchGridOptionsFromTemplateRoot(root, normalized);

      // 将复制出的 grid（默认脱离父级）移动到当前表单 grid 位置，避免再走 replaceModel/save 重建整棵树
      await mountTarget.flowEngine.modelRepository.move(duplicatedUid, existingGrid.uid, 'after');

      const newGrid = mountTarget.flowEngine.createModel<FlowModel>({
        ...merged.options,
        parentId: mountTarget.uid,
        subKey: 'grid',
        subType: 'object',
      });
      mountTarget.setSubModel('grid', newGrid);
      await newGrid.afterAddAsSubModel();
      await mountTarget.flowEngine.destroyModel(existingGrid.uid);
      if (merged.patched) {
        await newGrid.saveStepParams();
      }

      await mountTarget.rerender();
      return;
    }

    const nextSettings = { templateUid, templateName, templateDescription, targetUid, mode };
    const isReferenceGrid = typeof existingGrid.use === 'string' && existingGrid.use === 'ReferenceFormGridModel';
    if (isReferenceGrid) {
      existingGrid.setStepParams(GRID_REF_FLOW_KEY, GRID_REF_STEP_KEY, nextSettings);
      await existingGrid.saveStepParams();
      await mountTarget.rerender();
      return;
    }

    const uidToReplace = existingGrid.uid;
    const oldStepParams: Record<string, any> =
      existingGrid.stepParams && typeof existingGrid.stepParams === 'object'
        ? (existingGrid.stepParams as Record<string, any>)
        : {};
    const prevRefSettings =
      oldStepParams[GRID_REF_FLOW_KEY] && typeof oldStepParams[GRID_REF_FLOW_KEY] === 'object'
        ? (oldStepParams[GRID_REF_FLOW_KEY] as Record<string, any>)
        : {};
    const nextStepParams = {
      [GRID_REF_FLOW_KEY]: {
        ...prevRefSettings,
        [GRID_REF_STEP_KEY]: nextSettings,
      },
    };

    // 需要清理旧 grid 子树（否则旧字段会残留并被 serialize 落库）
    await mountTarget.flowEngine.destroyModel(uidToReplace);

    const newGrid = mountTarget.flowEngine.createModel<FlowModel>({
      uid: uidToReplace,
      use: 'ReferenceFormGridModel',
      props: existingGrid.props,
      sortIndex: existingGrid.sortIndex,
      parentId: mountTarget.uid,
      subKey: 'grid',
      subType: 'object',
      stepParams: nextStepParams,
    });
    mountTarget.setSubModel('grid', newGrid);
    await newGrid.afterAddAsSubModel();
    await newGrid.save();

    await mountTarget.rerender();
  }

  async save() {
    // 禁止持久化
    return { uid: this.uid };
  }

  async saveStepParams() {
    // 禁止持久化（FlowSettingsDialog 会调用 saveStepParams）
    return { uid: this.uid };
  }

  render() {
    // 临时模型不渲染任何内容
    return null;
  }

  public getTemplateDisabledReason(
    ctx: FlowContext,
    tpl: Record<string, any>,
    expected?: { dataSourceKey?: string; collectionName?: string },
  ): string | undefined {
    const expectedDataSourceKey = String(expected?.dataSourceKey || this.props?.expectedDataSourceKey || '').trim();
    const expectedCollectionName = String(expected?.collectionName || this.props?.expectedCollectionName || '').trim();
    if (!expectedDataSourceKey || !expectedCollectionName) return undefined;
    return getTemplateAvailabilityDisabledReason(
      ctx,
      tpl,
      { dataSourceKey: expectedDataSourceKey, collectionName: expectedCollectionName },
      { dataSourceManager: this.context.dataSourceManager },
    );
  }

  public async fetchTemplateOptions(
    ctx: FlowContext,
    keyword?: string,
    pagination?: { page?: number; pageSize?: number },
  ): Promise<{ options: any[]; hasMore: boolean }> {
    const api = ctx.api;
    if (!api?.resource) return { options: [], hasMore: false };
    const page = Math.max(1, Number(pagination?.page || 1));
    const pageSize = Math.max(1, Number(pagination?.pageSize || TEMPLATE_LIST_PAGE_SIZE));
    try {
      const expectedRootUse = this.props?.expectedRootUse;
      const expects = expectedRootUse
        ? Array.isArray(expectedRootUse)
          ? expectedRootUse.map((u) => String(u))
          : [String(expectedRootUse)]
        : [];
      // useModel 不匹配直接不显示
      const useModelFilter =
        expects.length > 0
          ? {
              $or: [{ useModel: { $in: expects } }, { useModel: null }, { useModel: '' }],
            }
          : undefined;
      // 排除弹窗模板（popup templates），避免污染区块/字段模板列表
      const nonPopupFilter = {
        $and: [{ $or: [{ type: { $notIn: ['popup'] } }, { type: null }, { type: '' }] }],
      };
      const mergedFilter = useModelFilter ? { $and: [useModelFilter, ...nonPopupFilter.$and] } : nonPopupFilter;
      const res = await api.resource('flowModelTemplates').list({
        page,
        pageSize,
        search: keyword || undefined,
        filter: mergedFilter,
      });
      const { rows: rawRows, count } = parseResourceListResponse<any>(res);
      const rawLength = rawRows.length;

      const expectedResource = this.resolveExpectedResourceInfo(ctx);
      const withIndex = rawRows.flatMap((r, idx) => {
        const useModel = r?.useModel;
        if (expects.length > 0) {
          if (!useModel) return [];
          if (!expects.includes(String(useModel))) return [];
        }
        const name = r?.name || r?.uid || '';
        const desc = r?.description;
        const disabledReason = this.getTemplateDisabledReason(ctx, r, expectedResource);
        return [
          {
            __idx: (page - 1) * pageSize + idx,
            label: renderTemplateSelectLabel(name),
            value: r?.uid,
            description: desc,
            rawName: name,
            targetUid: r?.targetUid,
            disabled: !!disabledReason,
            disabledReason,
            dataSourceKey: r?.dataSourceKey,
            collectionName: r?.collectionName,
            useModel,
          },
        ];
      });
      // enabled 模板放在最前面，其余保持原有顺序（稳定排序）
      withIndex.sort(defaultSelectOptionComparator);
      return {
        options: withIndex,
        hasMore: calcHasMore({ page, pageSize, rowsLength: rawLength, count }),
      };
    } catch (e) {
      console.error('fetch template options failed', e);
      return { options: [], hasMore: false };
    }
  }
}

SubModelTemplateImporterModel.define({
  label: tStr('Field template'),
  sort: -999,
  hide: (ctx: FlowModelContext) => {
    // FilterForm 里暂不支持字段模板入口（避免误创建临时模型）
    const blockModel = findBlockModel(ctx.model);
    if (!blockModel) {
      return true;
    }

    // ApplyTaskCardDetailsModel 不支持区块/字段模板相关入口
    if (blockModel.use === 'ApplyTaskCardDetailsModel' || blockModel.use === 'ApprovalTaskCardDetailsModel') {
      return true;
    }
    if (blockModel instanceof FilterFormBlockModel) {
      return true;
    }

    // 2) 若当前区块是 ReferenceBlockModel 渲染的 target，隐藏 "From template"
    // 因为在 ReferenceBlockModel 内部编辑字段会直接影响被引用的模板
    if (isModelInsideReferenceBlock(blockModel)) {
      return true;
    }

    return Object.prototype.hasOwnProperty.call(blockModel.context, REF_HOST_CTX_KEY);
  },
  createModelOptions: (ctx: FlowModelContext) => {
    const blockModel = findBlockModel(ctx.model);
    const expectedRootUse = resolveExpectedRootUse(blockModel);

    const resourceInit = blockModel?.getStepParams?.('resourceSettings', 'init') || {};
    const expectedDataSourceKey =
      typeof resourceInit?.dataSourceKey === 'string' ? resourceInit.dataSourceKey : undefined;
    const expectedCollectionName =
      typeof resourceInit?.collectionName === 'string' ? resourceInit.collectionName : undefined;

    return {
      use: 'SubModelTemplateImporterModel',
      props: {
        expectedRootUse,
        expectedDataSourceKey,
        expectedCollectionName,
      },
    };
  },
});

SubModelTemplateImporterModel.registerFlow({
  key: FLOW_KEY,
  title: tExpr('Field template'),
  manual: true,
  sort: -999,
  steps: {
    selectTemplate: {
      preset: true,
      title: tStr('Field template'),
      uiSchema: (ctx) => {
        const m = ctx.model as SubModelTemplateImporterModel;
        const step = m.getStepParams(FLOW_KEY, 'selectTemplate') || {};
        const templateUid = (step?.templateUid || '').trim();
        const isNew = !!m.isNew;
        const disableSelect = !isNew && !!templateUid;

        // 固定挂载到 parent.parent（即 grid 的父级 block）
        const mountTarget = m.parent?.parent;

        // 若当前区块对 FormItemModel 做了映射（自定义入口），默认更安全的 copy 模式
        const rawMappedUse = mountTarget ? resolveMappedFormItemUse(mountTarget) : undefined;
        const hasMappedUse =
          rawMappedUse && rawMappedUse !== 'FormItemModel' && !!mountTarget?.flowEngine?.getModelClass?.(rawMappedUse);

        const fetchOptions = (keyword?: string, pagination?: { page?: number; pageSize?: number }) =>
          m.fetchTemplateOptions(ctx as FlowContext, keyword, pagination);
        return {
          templateUid: {
            title: tStr('Template'),
            description: tStr('Template field section description'),
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
            'x-validator': [{ required: true }],
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
          mode: {
            title: tStr('Mode'),
            'x-decorator': 'FormItem',
            'x-component': 'Radio.Group',
            enum: [
              { label: tStr('Reference'), value: 'reference' },
              { label: tStr('Duplicate'), value: 'copy' },
            ],
            // 若当前区块对 FormItemModel 做了映射（自定义入口），默认更安全的 copy 模式
            default: step?.mode || (hasMappedUse ? 'copy' : 'reference'),
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
        const importer = ctx.model as SubModelTemplateImporterModel;
        const parent = importer.parent as FlowModel | undefined;
        if (!parent) {
          throw new Error('[block-reference] Cannot resolve mount target: importer has no parent.');
        }

        // 固定挂载到 parent.parent（即 grid 的父级 block）
        const mountTarget = parent.parent;
        const api = (ctx as FlowContext).api;
        if (!mountTarget) {
          throw new Error(
            `[block-reference] Cannot resolve mount target from importer parent (uid='${parent.uid}', use='${parent.use}').`,
          );
        }

        const templateUid = String(params?.templateUid || '').trim();
        if (!templateUid) {
          throw new Error('[block-reference] templateUid is required.');
        }

        if (!api?.resource) {
          throw new Error('[block-reference] ctx.api.resource is required to fetch templates.');
        }
        const res = await api.resource('flowModelTemplates').get({ filterByTk: templateUid });
        const tpl = res?.data?.data || res?.data || res;

        const targetUid = (tpl?.targetUid || params?.targetUid || '').trim();
        if (!targetUid) {
          throw new Error(`[block-reference] Template '${templateUid}' has no targetUid.`);
        }
        const templateName = (tpl?.name || params?.templateName || '').trim();
        const templateDescription = (tpl?.description || params?.templateDescription || '').trim();
        const mode = String(params?.mode || 'reference');

        // 禁止跨数据源/数据表使用字段模板（在 UI 侧禁用的同时，这里做一次硬校验，避免绕过）
        const expectedResource = importer.resolveExpectedResourceInfo(ctx as FlowContext, mountTarget);
        const disabledReason = importer.getTemplateDisabledReason(ctx as FlowContext, tpl || {}, expectedResource);
        if (disabledReason) {
          throw new Error(disabledReason);
        }

        // 引用模式下，如果目标挂载点已有字段，需先提示确认
        if (mode !== 'copy') {
          const existingGrid = mountTarget.subModels?.grid;
          if (!(existingGrid instanceof FlowModel)) {
            throw new Error('[block-reference] Cannot mount: mountTarget has no grid subModel.');
          }

          const isReferenceGrid = typeof existingGrid.use === 'string' && existingGrid.use === 'ReferenceFormGridModel';

          // 已经是引用 grid 且引用未变化：直接退出，避免重复确认
          if (isReferenceGrid) {
            const existing = existingGrid.getStepParams(GRID_REF_FLOW_KEY, GRID_REF_STEP_KEY) || {};
            const norm = (v: any) => String(v || '').trim();
            const isSame =
              norm(existing.templateUid) === norm(templateUid) && norm(existing.targetUid) === norm(targetUid);
            if (isSame) {
              // 仍需写入当前 stepParams，避免 afterAddAsSubModel 无法读取 targetUid 等
              importer.setStepParams(FLOW_KEY, 'selectTemplate', {
                templateUid,
                targetUid,
                templateName,
                templateDescription,
                mode,
              });
              return;
            }
          }

          // 仅检测“当前区块”已持久化/在当前引擎内的字段，避免 reference grid 透传模板字段导致误提示
          const fieldItemBaseClasses = (
            ['FormItemModel', 'FormCustomItemModel', 'FormJSFieldItemModel']
              .map((name) => mountTarget.flowEngine.getModelClass(name))
              .filter(Boolean) as ModelConstructor[]
          ).filter(Boolean);
          // Details 区块的字段项类型与表单不同，采用"任意 items 都算已有字段"的策略进行确认提示
          const isDetailsBlock = typeof mountTarget.use === 'string' && mountTarget.use === 'DetailsBlockModel';
          const isDetailsGrid = typeof existingGrid.use === 'string' && existingGrid.use === 'DetailsGridModel';
          const shouldFallbackToAnyItem = isDetailsBlock || isDetailsGrid || fieldItemBaseClasses.length === 0;

          const isFieldItem = (m: FlowModel) => {
            if (shouldFallbackToAnyItem) return true;
            const ctor = m.constructor as ModelConstructor;
            return fieldItemBaseClasses.some((Base) => ctor === Base || isInheritedFrom(ctor, Base));
          };

          let hasExistingFields = false;

          // 非 reference grid：直接检查 subModels（避免全量扫描引擎）
          if (!isReferenceGrid) {
            const items = existingGrid.subModels?.items;
            const list = Array.isArray(items) ? items : [];
            for (const item of list) {
              if (!(item instanceof FlowModel)) continue;
              if (item.uid === importer.uid) continue;
              if (isFieldItem(item)) {
                hasExistingFields = true;
                break;
              }
            }
          } else {
            // reference grid：避免透传模板字段，按当前引擎内的 parent/subKey 关系识别“本地字段”
            mountTarget.flowEngine.forEachModel((m) => {
              if (hasExistingFields) return;
              if (!(m instanceof FlowModel)) return;
              if (m.uid === mountTarget.uid || m.uid === importer.uid) return;
              if (m.parent?.uid !== existingGrid.uid || m.subKey !== 'items') return;
              if (isFieldItem(m)) {
                hasExistingFields = true;
              }
            });
          }
          if (hasExistingFields) {
            const viewer = (ctx as FlowContext).viewer || mountTarget.context.viewer || importer.context.viewer;
            const message = ctx.t('Using reference fields will remove existing fields', {
              ns: [NAMESPACE, 'client'],
              nsMode: 'fallback',
            });
            ctx.view?.close(undefined, true);
            await new Promise<void>((resolve) => setTimeout(resolve, 0));

            const confirmed = await new Promise<boolean>((resolve) => {
              let resolved = false;
              const resolveOnce = (val: boolean) => {
                if (resolved) return;
                resolved = true;
                resolve(val);
              };
              viewer.dialog({
                title:
                  (ctx as FlowContext).t?.('Field template', { ns: [NAMESPACE, 'client'], nsMode: 'fallback' }) ||
                  'Field template',
                width: 520,
                destroyOnClose: true,
                content: (currentDialog: any) => (
                  <>
                    <div style={{ marginBottom: 16 }}>{message}</div>
                    <currentDialog.Footer>
                      <Space align="end">
                        <Button
                          onClick={() => {
                            resolveOnce(false);
                            currentDialog.close(undefined, true);
                          }}
                        >
                          {(ctx as FlowContext).t?.('Cancel') || 'Cancel'}
                        </Button>
                        <Button
                          type="primary"
                          onClick={() => {
                            resolveOnce(true);
                            currentDialog.close(undefined, true);
                          }}
                        >
                          {(ctx as FlowContext).t?.('Confirm') || 'Confirm'}
                        </Button>
                      </Space>
                    </currentDialog.Footer>
                  </>
                ),
                onClose: () => resolveOnce(false),
                zIndex: typeof viewer.getNextZIndex === 'function' ? viewer.getNextZIndex() + 1000 : undefined,
              });
            });
            if (!confirmed) {
              throw new FlowExitException(FLOW_KEY, importer.uid, 'User cancelled template import');
            }
          }
        }

        importer.setStepParams(FLOW_KEY, 'selectTemplate', {
          templateUid,
          targetUid,
          templateName,
          templateDescription,
          mode,
        });
      },
    },
  },
});
