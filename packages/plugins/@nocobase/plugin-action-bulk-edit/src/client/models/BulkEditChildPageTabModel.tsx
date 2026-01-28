/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChildPageTabModel, BlockGridModel, SkeletonFallback } from '@nocobase/client';
import { PlusOutlined } from '@ant-design/icons';
import { AddSubModelButton, FlowSettingsButton, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import React from 'react';
import { BlockSceneEnum, DataBlockModel } from '@nocobase/client';

/**
 * 页面 Tab 子内容渲染器组件
 */
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

/**
 * 批量编辑专用的 BlockGrid 模型
 * 只显示 BulkEditFormModel 作为可添加的区块
 */
export class BulkEditBlockGridModel extends BlockGridModel {
  onInit(options: any): void {
    super.onInit(options);
    // 将 inputArgs 传递到 context.view.inputArgs
    if (options.inputArgs) {
      // 确保 context.view 存在
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
    // 返回基类，系统会根据 inputArgs.scene 自动过滤
    return ['DataBlockModel', 'BlockModel'];
  }
}

// 注册 BulkEditBlockGridModel
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

/**
 * 批量编辑页面的 Tab 模型
 * 使用自定义的 BulkEditBlockGridModel 来限制可添加的区块类型
 */
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
