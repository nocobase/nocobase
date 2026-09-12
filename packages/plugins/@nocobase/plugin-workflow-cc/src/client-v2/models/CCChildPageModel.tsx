/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChildPageModel, ChildPageTabModel, SkeletonFallback } from '@nocobase/client-v2';
import {
  FlowModelRenderer,
  useFlowEngine,
  type CreateModelOptions,
  type FlowModel,
  type FlowModelContext,
} from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import React from 'react';

import { registerWorkflowCcModelLoaders } from './registerModelLoaders';

type CollectionContextParams = {
  collectionName: string;
  dataSourceKey: string;
};

function createCCGridRenderOptions(parentId: string): CreateModelOptions {
  return {
    async: true,
    parentId,
    subType: 'object',
    subKey: 'grid',
    use: 'CCBlockGridModel',
  };
}

type TabModelWithGrid = FlowModel & {
  setSubModel?: (subKey: string, model: FlowModel) => FlowModel;
  subModels?: {
    grid?: FlowModel;
  };
};

type WorkflowCcConfigDialogInputArgs = {
  workflowCcConfigDialog?: boolean;
};

function hasGridContent(model?: FlowModel | null) {
  const items = (model as { subModels?: { items?: unknown[] } } | null | undefined)?.subModels?.items;
  return Array.isArray(items) && items.length > 0;
}

function isWorkflowCcConfigDialog(ctx: FlowModelContext) {
  return Boolean((ctx.view?.inputArgs as WorkflowCcConfigDialogInputArgs | undefined)?.workflowCcConfigDialog);
}

function enableConfigDialogGridContext(ctx: FlowModelContext, model: FlowModel) {
  if (!isWorkflowCcConfigDialog(ctx)) {
    return;
  }
  model.context.defineProperty('disableBlockGridPadding', {
    get: () => true,
    cache: false,
  });
}

function attachGridToTab(ctx: FlowModelContext, model: FlowModel) {
  const tab = ctx.model as TabModelWithGrid;
  if (tab.subModels?.grid !== model) {
    tab.setSubModel?.('grid', model);
  }
  if (model.parent?.uid !== tab.uid) {
    model.context.addDelegate(ctx);
  }
  enableConfigDialogGridContext(ctx, model);
  return model;
}

function PageTabChildrenRenderer({ ctx, options }: { ctx: FlowModelContext; options: CreateModelOptions }) {
  const flowEngine = useFlowEngine();
  const { data: model, loading } = useRequest(
    async () => {
      const existingGrid = (ctx.model as TabModelWithGrid).subModels?.grid;
      if (hasGridContent(existingGrid)) {
        enableConfigDialogGridContext(ctx, existingGrid);
        return existingGrid;
      }
      registerWorkflowCcModelLoaders(flowEngine);
      await flowEngine.getModelClassAsync?.('CCBlockGridModel');
      const nextModel = (await flowEngine.loadModel?.({
        parentId: options.parentId,
        refresh: true,
        subKey: options.subKey,
      })) as FlowModel | null | undefined;
      if (nextModel?.uid) {
        return attachGridToTab(ctx, nextModel);
      }
      if (existingGrid?.uid) {
        enableConfigDialogGridContext(ctx, existingGrid);
        return existingGrid;
      }
      const fallbackModel = (await flowEngine.loadOrCreateModel?.(options, {
        skipSave: true,
      })) as FlowModel | null | undefined;
      return fallbackModel?.uid ? attachGridToTab(ctx, fallbackModel) : null;
    },
    {
      refreshDeps: [ctx.model.uid, (ctx.model as TabModelWithGrid).subModels?.grid?.uid, flowEngine],
    },
  );
  const margin = ctx?.isMobileLayout ? 8 : ctx?.themeToken?.marginBlock;
  if (loading || !model?.uid) {
    return <SkeletonFallback style={{ margin }} />;
  }
  return <FlowModelRenderer model={model} fallback={<SkeletonFallback style={{ margin }} />} />;
}

export class CCChildPageModel extends ChildPageModel {
  onInit(options: Parameters<ChildPageModel['onInit']>[0]): void {
    super.onInit(options);
    this.context.defineMethod('aclCheck', () => true);
    this.context.defineProperty('disableFieldClickToOpen', {
      get: () => true,
    });
  }

  setCollectionCtx({ dataSourceKey, collectionName }: CollectionContextParams) {
    this.context.defineProperty('collection', {
      get: () => this.context.dataSourceManager.getCollection(dataSourceKey, collectionName),
      cache: false,
    });
  }

  renderFirstTab() {
    const firstTab = this.getFirstTab();
    if (!firstTab?.uid) {
      return null;
    }
    return <PageTabChildrenRenderer ctx={firstTab.context} options={createCCGridRenderOptions(firstTab.uid)} />;
  }
}

CCChildPageModel.define({
  hide: true,
});

CCChildPageModel.registerFlow({
  key: 'CCChildPageSettings',
  steps: {
    init: {
      handler(ctx: FlowModelContext, params: CollectionContextParams) {
        (ctx.model as CCChildPageModel).setCollectionCtx(params);
      },
    },
  },
});

export class CCChildPageTabModel extends ChildPageTabModel {
  renderChildren() {
    return <PageTabChildrenRenderer ctx={this.context} options={createCCGridRenderOptions(this.uid)} />;
  }
}

export default CCChildPageModel;
