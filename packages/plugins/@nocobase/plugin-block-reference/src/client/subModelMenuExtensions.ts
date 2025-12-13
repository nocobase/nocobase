/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowEngine, FlowModel, FlowModelContext } from '@nocobase/flow-engine';
import { NAMESPACE } from './locale';

const REF_HOST_CTX_KEY = '__subModelReferenceHost';

function findFormModel(model: FlowModel): FlowModel | undefined {
  let cur: FlowModel | undefined = model;
  let depth = 0;
  while (cur && depth < 6) {
    const use = cur?.use;
    if (use === 'CreateFormModel' || use === 'EditFormModel') return cur;
    cur = cur?.parent as FlowModel | undefined;
    depth++;
  }
  return undefined;
}

function findHostInfoFromAncestors(model: FlowModel) {
  let cur: FlowModel | undefined = model;
  let depth = 0;
  while (cur && depth < 8) {
    const c = cur?.context;
    // 优先直接读取（FlowContext Proxy 会自动沿 delegate 链查找），避免依赖 has() 的“仅自身 _props”语义
    try {
      const v = c && (c as any)?.[REF_HOST_CTX_KEY];
      if (v) return v;
    } catch {
      // ignore
    }
    cur = cur?.parent as FlowModel | undefined;
    depth++;
  }
  return undefined;
}

export function registerSubModelMenuExtensions(engine: FlowEngine) {
  type ModelClass = typeof FlowModel & {
    __subModelTemplateMenuPatched?: boolean;
    defineChildren?: (ctx: FlowModelContext) => any;
  };
  const FormCustomItemModel = engine.getModelClass?.('FormCustomItemModel') as ModelClass | undefined;
  if (!FormCustomItemModel || FormCustomItemModel.__subModelTemplateMenuPatched) return;
  FormCustomItemModel.__subModelTemplateMenuPatched = true;

  const originalDefineChildren = FormCustomItemModel.defineChildren;

  FormCustomItemModel.defineChildren = async function patchedDefineChildren(ctx: FlowModelContext) {
    const raw = originalDefineChildren ? await originalDefineChildren.call(this, ctx) : [];
    const children = Array.isArray(raw) ? raw : [];

    const label = ctx.t?.('From template', { ns: [NAMESPACE, 'client'], nsMode: 'fallback' }) || 'From template';
    const formModel = findFormModel(ctx.model);
    const parentUse = (formModel as any)?.use || (ctx.model as any)?.parent?.use;
    const expectedRootUse =
      parentUse === 'CreateFormModel' || parentUse === 'EditFormModel'
        ? ['CreateFormModel', 'EditFormModel']
        : parentUse;
    const resourceInit = formModel?.getStepParams?.('resourceSettings', 'init') || {};
    const expectedDataSourceKey =
      typeof resourceInit?.dataSourceKey === 'string' ? resourceInit.dataSourceKey : undefined;
    const expectedCollectionName =
      typeof resourceInit?.collectionName === 'string' ? resourceInit.collectionName : undefined;

    const fromTemplateItem = {
      key: '__fromTemplate__',
      label,
      sort: -999,
      hide: async (innerCtx: FlowModelContext) => {
        // 1) 若处于“字段模板引用”内部（当前正在渲染模板 grid），直接隐藏，避免误清空模板侧字段
        const hostInfo = findHostInfoFromAncestors(innerCtx.model);
        const hostRef = hostInfo?.ref;
        if (hostRef && hostRef.mountSubKey === 'grid' && hostRef.mode !== 'copy') {
          return true;
        }

        // 2) 常规：当前表单区块已经使用引用 grid（字段模板），隐藏 “From template”
        const fm = findFormModel(innerCtx.model);
        const mountTarget = fm || (innerCtx.model as any)?.parent;
        if (!mountTarget) return false;
        const grid = (mountTarget?.subModels as any)?.grid;
        const isReferenceGrid = !!grid && String(grid?.use || '') === 'ReferenceFormGridModel';
        return isReferenceGrid;
      },
      createModelOptions: () => ({
        use: 'SubModelTemplateImporterModel',
        props: {
          // 表单字段的复用以 grid 为单位引入，保留模板里的布局
          defaultSourcePath: 'subModels.grid',
          defaultMountSubKey: 'grid',
          mountToParentLevel: 1,
          expectedRootUse,
          expectedDataSourceKey,
          expectedCollectionName,
        },
      }),
    };

    return [fromTemplateItem, ...children].filter(Boolean);
  };
}
