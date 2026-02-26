/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChildPageTabModel, BlockGridModel, SkeletonFallback } from '@nocobase/client';

import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import React from 'react';
import { BlockSceneEnum } from '@nocobase/client';

function PageTabChildrenRenderer({ ctx, options }) {
  const { data, loading } = useRequest(
    async () => {
      const model: FlowModel = await ctx.engine.loadOrCreateModel(options);
      model.context.addDelegate(ctx);
      return model;
    },
    {
      refreshDeps: [ctx.model.uid],
    },
  );
  const margin = ctx?.isMobileLayout ? 8 : ctx?.themeToken.marginBlock;
  if (loading || !data?.uid) {
    return <SkeletonFallback style={{ margin }} />;
  }
  return <FlowModelRenderer model={data} fallback={<SkeletonFallback style={{ margin }} />} />;
}

export class BulkEditBlockGridModel extends BlockGridModel {
  onInit(options: any): void {
    super.onInit(options);
    if (options.inputArgs) {
      const currentView = this.context.view || {};
      const currentInputArgs = this.context.view?.inputArgs || {};
      this.context.defineProperty('view', {
        value: {
          ...currentView,
          inputArgs: {
            ...currentInputArgs,
            scene: BlockSceneEnum.bulkEditForm,
          },
        },
      });
    }
  }

  get subModelBaseClasses() {
    return ['BulkEditDataBlockModel', 'BulkEditBlockModel'];
  }
}

BulkEditBlockGridModel.registerFlow({
  key: 'blockGridSettings',
  steps: {
    grid: {
      handler(ctx, params) {
        ctx.model.setProps('rowGap', ctx.isMobileLayout ? 12 : ctx.themeToken.marginBlock);
        ctx.model.setProps('colGap', ctx.themeToken.marginBlock);
      },
    },
  },
});

export class BulkEditChildPageTabModel extends ChildPageTabModel {
  renderChildren() {
    return (
      <PageTabChildrenRenderer
        ctx={this.context}
        options={{
          parentId: this.uid,
          subKey: 'grid',
          async: true,
          subType: 'object',
          use: 'BulkEditBlockGridModel',
        }}
      />
    );
  }
}
