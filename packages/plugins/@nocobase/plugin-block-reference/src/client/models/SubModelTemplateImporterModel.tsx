/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import debounce from 'lodash/debounce';
import _ from 'lodash';
import { Button, Space, Tooltip } from 'antd';
import {
  FlowModel,
  FlowContext,
  createBlockScopedEngine,
  FlowExitException,
  isInheritedFrom,
  type ModelConstructor,
  tExpr,
} from '@nocobase/flow-engine';
import { NAMESPACE, tStr } from '../locale';
import { duplicateModelTreeLocally } from '../utils/flowModelClone';

type ImporterProps = {
  /** 默认从模板根取片段的路径 */
  defaultSourcePath?: string;
  /** 模板根 use 过滤（可选），支持多个候选 */
  expectedRootUse?: string | string[];
  /** 期望的数据源 key（可选，用于禁用不匹配的模板） */
  expectedDataSourceKey?: string;
  /** 期望的 collectionName（可选，用于禁用不匹配的模板） */
  expectedCollectionName?: string;
  /** 默认挂载到当前模型的 subModels 键（可选），否则使用 importer.subKey */
  defaultMountSubKey?: string;
  /**
   * 引入片段时挂载到第几层父级：
   * - 0：挂载到 importer.parent（默认）
   * - 1：挂载到 importer.parent.parent
   * - 2：以此类推
   */
  mountToParentLevel?: number;
};

const FLOW_KEY = 'subModelTemplateImportSettings';
const REF_HOST_CTX_KEY = '__subModelReferenceHost';
const GRID_REF_FLOW_KEY = 'referenceFormGridSettings';
const GRID_REF_STEP_KEY = 'target';

export class SubModelTemplateImporterModel extends FlowModel {
  declare props: ImporterProps;

  private resolveTargetResourceByAssociation(
    ctx: FlowContext | undefined,
    init: { dataSourceKey?: unknown; collectionName?: unknown; associationName?: unknown },
  ): { dataSourceKey: string; collectionName: string } | undefined {
    const dataSourceKey = typeof init?.dataSourceKey === 'string' ? init.dataSourceKey.trim() : '';
    const collectionName = typeof init?.collectionName === 'string' ? init.collectionName.trim() : '';
    const associationName = typeof init?.associationName === 'string' ? init.associationName.trim() : '';
    if (!dataSourceKey || !associationName) return undefined;

    const parts = associationName.split('.').filter(Boolean);
    const inferredBaseCollectionName = parts.length > 1 ? parts[0] : '';
    const baseCollectionName = inferredBaseCollectionName || collectionName;
    const fieldPath = parts.length > 1 ? parts.slice(1).join('.') : associationName;
    if (!baseCollectionName || !fieldPath) return undefined;

    const dsManager = ctx?.dataSourceManager || this.context.dataSourceManager;
    const baseCollection = dsManager?.getCollection?.(dataSourceKey, baseCollectionName);
    const field = baseCollection?.getFieldByPath?.(fieldPath) || baseCollection?.getField?.(fieldPath);
    const targetCollection = field?.targetCollection;
    const targetDataSourceKey =
      typeof targetCollection?.dataSourceKey === 'string' ? targetCollection.dataSourceKey.trim() : '';
    const targetCollectionName = typeof targetCollection?.name === 'string' ? targetCollection.name.trim() : '';
    if (!targetDataSourceKey || !targetCollectionName) return undefined;
    return { dataSourceKey: targetDataSourceKey, collectionName: targetCollectionName };
  }

  private resolveExpectedResourceInfo(
    ctx?: FlowContext,
    start?: FlowModel,
  ): { dataSourceKey?: string; collectionName?: string } {
    const fromPropsDataSourceKey = String(this.props?.expectedDataSourceKey || '').trim();
    const fromPropsCollectionName = String(this.props?.expectedCollectionName || '').trim();
    if (fromPropsDataSourceKey && fromPropsCollectionName) {
      return { dataSourceKey: fromPropsDataSourceKey, collectionName: fromPropsCollectionName };
    }

    let cur: FlowModel | undefined = start || this.parent;
    let depth = 0;
    while (cur && depth < 8) {
      const init = cur?.getStepParams?.('resourceSettings', 'init') || {};
      // 若存在 associationName，优先解析其目标集合（collectionName 可能缺失/不准）
      const assocResolved = this.resolveTargetResourceByAssociation(ctx, init);
      if (assocResolved) return assocResolved;

      // 次优先：读取模型运行时 collection（部分模型会直接暴露）
      try {
        const c = cur?.collection;
        const dataSourceKey = typeof c?.dataSourceKey === 'string' ? c.dataSourceKey.trim() : '';
        const collectionName = typeof c?.name === 'string' ? c.name.trim() : '';
        if (dataSourceKey && collectionName) {
          return { dataSourceKey, collectionName };
        }
      } catch {
        // ignore
      }

      const dataSourceKey = typeof init?.dataSourceKey === 'string' ? init.dataSourceKey.trim() : '';
      const collectionName = typeof init?.collectionName === 'string' ? init.collectionName.trim() : '';
      if (dataSourceKey && collectionName) {
        return { dataSourceKey, collectionName };
      }
      cur = cur?.parent;
      depth++;
    }

    return {
      dataSourceKey: fromPropsDataSourceKey || undefined,
      collectionName: fromPropsCollectionName || undefined,
    };
  }

  async afterAddAsSubModel() {
    // 作为临时“动作模型”，添加后执行导入逻辑并自清理
    const parentGrid = this.parent as FlowModel | undefined;

    const mountLevel = this.props?.mountToParentLevel ?? 0;
    let mountTarget: FlowModel | undefined = parentGrid;
    for (let i = 0; i < mountLevel; i++) {
      mountTarget = mountTarget?.parent as FlowModel | undefined;
    }
    // mountTarget 兜底：如果按层级拿不到 grid，则继续向上查找
    let probe: FlowModel | undefined = mountTarget;
    let hops = 0;
    while (probe && hops < 5) {
      if ((probe.subModels as any)?.grid) {
        mountTarget = probe;
        break;
      }
      probe = probe.parent as FlowModel | undefined;
      hops++;
    }

    // 先自清理：避免被保存为真实字段
    this.remove();

    // 注意：GridModel 会在 onSubModelRemoved 中触发 saveStepParams（异步且不 await），
    // 若我们紧接着替换/保存 grid，会与该 save 竞争导致最终落库被覆盖。
    // 这里显式等待一次同 uid 的保存完成，确保后续 replaceModel/save 不被“旧 grid saveStepParams”覆盖。
    if (parentGrid?.uid) {
      await parentGrid.saveStepParams();
    }

    if (!mountTarget) return;

    const step = (this.getStepParams(FLOW_KEY, 'selectTemplate') || {}) as Record<string, any>;
    const templateUid = String(step.templateUid || '').trim();
    const targetUid = String(step.targetUid || '').trim();
    const templateName = String(step.templateName || '').trim() || undefined;
    const mode = String(step.mode || 'reference');
    const sourcePath = String(step.sourcePath || 'subModels.grid').trim() || 'subModels.grid';
    const mountSubKey = String(step.mountSubKey || 'grid').trim() || 'grid';

    // 仅支持表单 fields（grid）引用
    if (mountSubKey !== 'grid') {
      throw new Error(`[block-reference] Only 'grid' mountSubKey is supported (got '${mountSubKey}').`);
    }
    if (sourcePath !== 'subModels.grid') {
      throw new Error(`[block-reference] Only 'subModels.grid' sourcePath is supported (got '${sourcePath}').`);
    }
    if (!templateUid) return;
    if (!targetUid) {
      throw new Error(
        `[block-reference] Missing targetUid for template import (templateUid='${templateUid}'). This is required for reference mode.`,
      );
    }

    const existingGrid = (mountTarget.subModels as any)?.grid as FlowModel | undefined;
    if (!existingGrid) {
      throw new Error(`[block-reference] Cannot mount to '${mountSubKey}': mountTarget has no grid subModel.`);
    }

    if (mode === 'copy') {
      const scoped = createBlockScopedEngine(mountTarget.flowEngine);
      const root = await scoped.loadModel<FlowModel>({ uid: targetUid, includeAsyncNode: true });
      if (!root) {
        throw new Error(
          this.translate?.('Target block is invalid', { ns: [NAMESPACE, 'client'], nsMode: 'fallback' }) ||
            'Target block is invalid',
        );
      }
      const fragment = _.get(root as any, sourcePath);
      const gridModel =
        fragment instanceof FlowModel ? fragment : _.castArray(fragment).find((m) => m instanceof FlowModel);
      if (!gridModel) {
        throw new Error(`[block-reference] Template fragment is invalid: ${sourcePath}`);
      }

      const { duplicated } = duplicateModelTreeLocally(gridModel);
      await mountTarget.flowEngine.replaceModel(existingGrid.uid, () => {
        return {
          use: duplicated.use,
          props: duplicated.props,
          stepParams: duplicated.stepParams,
          subModels: duplicated.subModels,
        };
      });

      await mountTarget.rerender();
      return;
    }

    const nextSettings = { templateUid, templateName, targetUid, sourcePath };
    const isReferenceGrid = existingGrid.use === 'ReferenceFormGridModel';
    if (isReferenceGrid) {
      existingGrid.setStepParams(GRID_REF_FLOW_KEY, GRID_REF_STEP_KEY, nextSettings);
      await existingGrid.saveStepParams();
      await mountTarget.rerender();
      return;
    }

    await mountTarget.flowEngine.replaceModel(existingGrid.uid, (old: FlowModel) => {
      const oldStepParams: Record<string, any> =
        old?.stepParams && typeof old.stepParams === 'object' ? (old.stepParams as Record<string, any>) : {};
      const prevRefSettings =
        oldStepParams[GRID_REF_FLOW_KEY] && typeof oldStepParams[GRID_REF_FLOW_KEY] === 'object'
          ? (oldStepParams[GRID_REF_FLOW_KEY] as Record<string, any>)
          : {};
      return {
        use: 'ReferenceFormGridModel',
        stepParams: {
          ...oldStepParams,
          [GRID_REF_FLOW_KEY]: {
            ...prevRefSettings,
            [GRID_REF_STEP_KEY]: nextSettings,
          },
        },
      };
    });

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

  private getTemplateDisabledReason(
    ctx: FlowContext,
    tpl: Record<string, any>,
    expected?: { dataSourceKey?: string; collectionName?: string },
  ): string | undefined {
    const expectedDataSourceKey = String(expected?.dataSourceKey || this.props?.expectedDataSourceKey || '').trim();
    const expectedCollectionName = String(expected?.collectionName || this.props?.expectedCollectionName || '').trim();
    if (!expectedDataSourceKey || !expectedCollectionName) return undefined;

    const baseTplDataSourceKey = String(tpl?.dataSourceKey || '').trim();
    const baseTplCollectionName = String(tpl?.collectionName || '').trim();
    const tplAssociationName = String(tpl?.associationName || '').trim();
    const tplResolved = tplAssociationName
      ? this.resolveTargetResourceByAssociation(ctx, {
          dataSourceKey: baseTplDataSourceKey,
          collectionName: baseTplCollectionName,
          associationName: tplAssociationName,
        })
      : undefined;
    const tplDataSourceKey = tplResolved?.dataSourceKey || baseTplDataSourceKey;
    const tplCollectionName = tplResolved?.collectionName || baseTplCollectionName;

    if (!tplDataSourceKey || !tplCollectionName) {
      return (
        ctx.t?.('Template missing data source/collection info', { ns: [NAMESPACE, 'client'], nsMode: 'fallback' }) ||
        'Template missing data source/collection info'
      );
    }

    if (tplDataSourceKey === expectedDataSourceKey && tplCollectionName === expectedCollectionName) {
      return undefined;
    }

    const title =
      ctx.t?.('Template data source/collection mismatch', { ns: [NAMESPACE, 'client'], nsMode: 'fallback' }) ||
      'Template data source/collection mismatch';
    return `${title}: ${expectedDataSourceKey}/${expectedCollectionName} ← ${tplDataSourceKey}/${tplCollectionName}`;
  }

  private async fetchTemplateOptions(ctx: FlowContext, keyword?: string) {
    const api = ctx.api;
    if (!api?.resource) return [];
    try {
      const expectedRootUse = this.props?.expectedRootUse;
      const expects = expectedRootUse
        ? Array.isArray(expectedRootUse)
          ? expectedRootUse.map((u) => String(u))
          : [String(expectedRootUse)]
        : [];
      // rootUse 不匹配直接不显示；兼容老数据：rootUse 为空时仍展示
      const rootUseFilter =
        expects.length > 0
          ? {
              $or: [{ rootUse: { $in: expects } }, { rootUse: null }, { rootUse: '' }],
            }
          : undefined;
      const res = await api.resource('flowModelTemplates').list({
        pageSize: 20,
        search: keyword || undefined,
        filter: rootUseFilter,
      });
      const body = res?.data || res;
      const unwrap = (val: any) => (val && val.data ? val.data : val);
      const candidate = unwrap(body);
      let rows = Array.isArray(candidate?.rows) ? candidate.rows : Array.isArray(candidate) ? candidate : [];
      if (expects.length > 0) {
        // 双保险：即使服务端未应用 filter，也保持严格过滤（兼容 rootUse 为空）
        rows = rows.filter((r) => !r.rootUse || expects.includes(String(r.rootUse)));
      }

      const expectedResource = this.resolveExpectedResourceInfo(ctx);
      const withIndex = rows.map((r, idx) => {
        const name = r.name || r.uid || '';
        const desc = r.description;
        const disabledReason = this.getTemplateDisabledReason(ctx, r, expectedResource);
        return {
          __idx: idx,
          label: (
            <span
              style={{
                display: 'inline-block',
                maxWidth: 480,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                verticalAlign: 'middle',
              }}
              title={name}
            >
              {name}
            </span>
          ),
          value: r.uid,
          description: desc,
          title: desc ? `${name} - ${desc}` : name,
          rawName: name,
          targetUid: r.targetUid,
          disabled: !!disabledReason,
          disabledReason,
          dataSourceKey: r.dataSourceKey,
          collectionName: r.collectionName,
          rootUse: r.rootUse,
        };
      });
      // enabled 模版放在最前面，其余保持原有顺序（稳定排序）
      withIndex.sort((a: any, b: any) => {
        const da = a.disabled ? 1 : 0;
        const db = b.disabled ? 1 : 0;
        if (da !== db) return da - db;
        return (a.__idx as number) - (b.__idx as number);
      });
      return withIndex.map(({ __idx, ...rest }) => rest);
    } catch (e) {
      console.error('fetch template options failed', e);
      return [];
    }
  }
}

SubModelTemplateImporterModel.define({
  hide: true,
});

SubModelTemplateImporterModel.registerFlow({
  key: FLOW_KEY,
  title: tExpr('From template'),
  manual: true,
  sort: -999,
  steps: {
    selectTemplate: {
      preset: true,
      title: tStr('From template'),
      uiSchema: (ctx) => {
        const m = ctx.model as SubModelTemplateImporterModel;
        const step = m.getStepParams(FLOW_KEY, 'selectTemplate') || {};
        const templateUid = (step?.templateUid || '').trim();
        const isNew = !!m.isNew;
        const disableSelect = !isNew && !!templateUid;
        const fetchOptions = (keyword?: string) => m.fetchTemplateOptions(ctx as FlowContext, keyword);
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
              optionRender: (option) => {
                const desc = option?.data?.description;
                const disabledReason = option?.data?.disabledReason;
                const content = (
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 500 }} title={option?.data?.rawName || ''}>
                      {option?.data?.rawName || option.label}
                    </span>
                    {desc ? <span style={{ color: '#999', fontSize: 12, whiteSpace: 'normal' }}>{desc}</span> : null}
                    {disabledReason ? (
                      <span style={{ color: '#999', fontSize: 12, whiteSpace: 'normal' }} title={disabledReason}>
                        {disabledReason}
                      </span>
                    ) : null}
                  </div>
                );
                if (disabledReason) {
                  return (
                    <Tooltip title={disabledReason} placement="right">
                      {/* disabled option 可能存在 hover 事件限制，这里提供双展示：tooltip + inline */}
                      <div>{content}</div>
                    </Tooltip>
                  );
                }
                return content;
              },
            },
            default: templateUid || undefined,
            'x-validator': [{ required: true }],
            'x-reactions': [
              (field) => {
                const composingKey = '__templateComposing';
                const setComposing = (v: boolean) => {
                  try {
                    field.data = { ...(field.data || {}), [composingKey]: v };
                  } catch {
                    // ignore
                  }
                };
                field.componentProps.onDropdownVisibleChange = async (open: boolean) => {
                  if (!open) return;
                  field.loading = true;
                  field.dataSource = await fetchOptions();
                  field.loading = false;
                };
                const debouncedSearch = debounce(async (value: string) => {
                  field.loading = true;
                  field.dataSource = await fetchOptions(value);
                  field.loading = false;
                }, 300);
                field.componentProps.onSearch = (value: string) => {
                  if (field.data?.[composingKey]) return;
                  debouncedSearch(typeof value === 'string' ? value.trim() : '');
                };
                field.componentProps.onCompositionStart = () => setComposing(true);
                field.componentProps.onCompositionEnd = (e: any) => {
                  setComposing(false);
                  const v = e?.target?.value || '';
                  debouncedSearch(typeof v === 'string' ? v.trim() : '');
                };
              },
            ],
          },
          mode: {
            title: tStr('Mode'),
            'x-decorator': 'FormItem',
            'x-component': 'Radio.Group',
            enum: [
              { label: tStr('Reference'), value: 'reference' },
              { label: tStr('Copy'), value: 'copy' },
            ],
            default: step?.mode || 'reference',
          },
        };
      },
      async beforeParamsSave(ctx, params) {
        const importer = ctx.model as SubModelTemplateImporterModel;
        const parent = importer.parent as FlowModel | undefined;
        if (!parent) return;

        const mountLevel = importer.props?.mountToParentLevel ?? 0;
        let mountTarget: FlowModel | undefined = parent;
        for (let i = 0; i < mountLevel; i++) {
          mountTarget = mountTarget?.parent as FlowModel | undefined;
        }
        const api = (ctx as FlowContext).api;
        const templateUid = (params?.templateUid || '').trim();
        if (!templateUid) return;

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
        const mode = params?.mode || 'reference';
        const sourcePath = (importer.props?.defaultSourcePath || 'subModels.grid').trim();
        const mountSubKey = (importer.props?.defaultMountSubKey || importer.subKey || 'grid').trim();

        // 当前仅支持表单 fields（grid）引用
        if (mountSubKey !== 'grid') {
          throw new Error(`[block-reference] Only 'grid' mountSubKey is supported (got '${mountSubKey}').`);
        }
        if (sourcePath !== 'subModels.grid') {
          throw new Error(`[block-reference] Only 'subModels.grid' sourcePath is supported (got '${sourcePath}').`);
        }

        // 若当前位于“引用片段”内部，则禁止再次 From template，避免误清空模板侧字段
        const findHostInfoFromAncestors = (m: any) => {
          let cur = m;
          let depth = 0;
          while (cur && depth < 8) {
            const c = cur?.context;
            try {
              const v = c && (c as any)?.[REF_HOST_CTX_KEY];
              if (v) return v;
            } catch {
              // ignore
            }
            cur = cur?.parent;
            depth++;
          }
          return undefined;
        };
        const hostInfo = findHostInfoFromAncestors(importer);
        const hostRef = hostInfo?.ref;
        if (hostRef && hostRef.mountSubKey === 'grid' && hostRef.mode !== 'copy') {
          const msg =
            (ctx as FlowContext).t?.(
              'This block already references field template, please convert fields to copy first',
              {
                ns: [NAMESPACE, 'client'],
                nsMode: 'fallback',
              },
            ) || '当前区块已引用字段模板，请先将引用字段转换为复制';
          const messageApi = (ctx as FlowContext).message || mountTarget.context.message || importer.context.message;
          messageApi?.warning?.(msg);
          throw new FlowExitException();
        }

        // mountTarget 兜底：如果按层级拿不到目标 subModel，则继续向上查找
        let probe: FlowModel | undefined = mountTarget;
        let hops = 0;
        while (probe && hops < 5) {
          const hasMount = !!(probe.subModels as any)?.[mountSubKey];
          if (hasMount) {
            mountTarget = probe;
            break;
          }
          probe = probe.parent as FlowModel | undefined;
          hops++;
        }
        if (!mountTarget) return;

        // 禁止跨数据源/数据表使用字段模板（在 UI 侧禁用的同时，这里做一次硬校验，避免绕过）
        const expectedResource = importer.resolveExpectedResourceInfo(ctx as FlowContext, mountTarget);
        const disabledReason = importer.getTemplateDisabledReason(ctx as FlowContext, tpl || {}, expectedResource);
        if (disabledReason) {
          throw new Error(disabledReason);
        }

        // 引用模式下，如果目标挂载点已有字段（尤其是 grid），需先提示确认
        if (mode !== 'copy' && mountSubKey === 'grid') {
          const existingGrid = (mountTarget.subModels as any)?.grid as FlowModel | undefined;
          if (!existingGrid) {
            throw new Error(`[block-reference] Cannot mount to '${mountSubKey}': mountTarget has no grid subModel.`);
          }

          const isReferenceGrid = String((existingGrid as any)?.use || '') === 'ReferenceFormGridModel';

          // 已经是引用 grid 且引用未变化：直接退出，避免重复确认
          if (isReferenceGrid) {
            const existing = existingGrid.getStepParams(GRID_REF_FLOW_KEY, GRID_REF_STEP_KEY) || {};
            const norm = (v: any) => String(v || '').trim();
            const isSame =
              norm(existing.templateUid) === norm(templateUid) && norm(existing.targetUid) === norm(targetUid);
            if (isSame) {
              // 仍需写入当前 stepParams，避免 afterAddAsSubModel 无法读取 targetUid 等
              importer.setStepParams(FLOW_KEY, 'selectTemplate', {
                targetUid,
                templateName,
                sourcePath,
                mountSubKey,
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
          const shouldFallbackToAnyItem = fieldItemBaseClasses.length === 0;

          const localItemUids: string[] = [];
          const localFieldItemUids: string[] = [];
          mountTarget.flowEngine.forEachModel((m: any) => {
            if (!m || m.uid === mountTarget.uid || m.uid === importer.uid) return;
            if (m?.parent?.uid !== existingGrid.uid || m.subKey !== 'items') return;

            localItemUids.push(String(m.uid));
            if (shouldFallbackToAnyItem) {
              localFieldItemUids.push(String(m.uid));
              return;
            }
            const ctor = (m as FlowModel).constructor as ModelConstructor;
            const isFieldItem = fieldItemBaseClasses.some((Base) => ctor === Base || isInheritedFrom(ctor, Base));
            if (isFieldItem) {
              localFieldItemUids.push(String(m.uid));
            }
          });
          const hasExistingFields = localFieldItemUids.length > 0;
          if (hasExistingFields) {
            const viewer = (ctx as FlowContext).viewer || mountTarget.context.viewer || importer.context.viewer;
            const message =
              (ctx as FlowContext).t?.('Using reference fields will remove existing fields', {
                ns: [NAMESPACE, 'client'],
                nsMode: 'fallback',
              }) || '使用引用字段会将当前已经添加的字段移除，是否继续？';

            // 先关闭 From template 弹窗，再弹二次确认，避免确认框被覆盖
            const currentView = (ctx as FlowContext).view;
            if (currentView && typeof currentView.close === 'function') {
              currentView.close(undefined, true);
            }
            // 等待一帧，确保上一个弹窗卸载完成
            await new Promise<void>((resolve) => setTimeout(resolve, 0));

            const confirmed =
              viewer && typeof viewer.dialog === 'function'
                ? await new Promise<boolean>((resolve) => {
                    let resolved = false;
                    const resolveOnce = (val: boolean) => {
                      if (resolved) return;
                      resolved = true;
                      resolve(val);
                    };
                    viewer.dialog({
                      title:
                        (ctx as FlowContext).t?.('From template', { ns: [NAMESPACE, 'client'], nsMode: 'fallback' }) ||
                        'From template',
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
                      // 保险：再抬高一些 zIndex
                      zIndex: typeof viewer.getNextZIndex === 'function' ? viewer.getNextZIndex() + 1000 : undefined,
                    });
                  })
                : window.confirm('使用引用字段会将当前已经添加的字段移除，是否继续？');
            if (!confirmed) {
              throw new FlowExitException();
            }
          }

          // 仅做确认与参数补全；真正的替换/复制在 afterAddAsSubModel 中执行
        }

        // 将解析后的信息写回 stepParams（afterAddAsSubModel 依赖这些值）
        // 注意：FlowModel.setStepParams 内部会 clone params，因此不能只改入参对象。
        importer.setStepParams(FLOW_KEY, 'selectTemplate', {
          targetUid,
          templateName,
          sourcePath,
          mountSubKey,
        });
      },
    },
  },
});
