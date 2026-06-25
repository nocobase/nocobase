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
    parentId,
    subKey: 'grid',
    async: true,
    subType: 'object',
    use: 'CCBlockGridModel',
  };
}

function PageTabChildrenRenderer({ ctx, options }: { ctx: FlowModelContext; options: CreateModelOptions }) {
  const flowEngine = useFlowEngine();
  const { data: model, loading } = useRequest(
    async () => {
      registerWorkflowCcModelLoaders(flowEngine);
      await flowEngine.getModelClassAsync?.('CCBlockGridModel');
      const nextModel = (await flowEngine.loadOrCreateModel(options, {
        skipSave: false,
      })) as FlowModel | null;
      if (nextModel?.parent?.uid !== ctx.model.uid) {
        nextModel?.context.addDelegate(ctx);
      }
      return nextModel;
    },
    {
      refreshDeps: [ctx.model.uid, flowEngine],
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
