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
import { FlowModelRenderer, SingleRecordResource, tExpr } from '@nocobase/flow-engine';
import { FormComponent, DetailsBlockModel } from '@nocobase/client';

/**
 * 抄送任务卡片详情：隐藏顶部按钮，保留详情卡片的字段/标题配置，不支持卡片级操作按钮。
 */
export class CCTaskCardDetailsModel extends DetailsBlockModel {
  // @ts-ignore
  get hidden() {
    return false;
  }

  set hidden(value) {}

  onInit(options: any): void {
    super.onInit(options);

    // 设置卡片的样式
    this.setDecoratorProps({
      size: 'small',
    });

    this.context.defineMethod('aclCheck', () => {
      return true;
    });

    this.context.defineProperty('disableFieldClickToOpen', {
      get: () => true,
    });
  }

  createResource(ctx, params) {
    const resource = this.context.createResource(SingleRecordResource);
    resource.isNewRecord = false;
    // @ts-ignore
    resource.refresh = () => Promise.resolve();
    return resource;
  }

  async refresh() {}

  renderComponent() {
    const { colon, labelAlign, labelWidth, labelWrap, layout } = this.props;

    return (
      <FormComponent model={this} layoutProps={{ colon, labelAlign, labelWidth, labelWrap, layout }}>
        <FlowModelRenderer model={this.subModels.grid} showFlowSettings={false} />
      </FormComponent>
    );
  }
}

CCTaskCardDetailsModel.define({
  hide: true,
});

CCTaskCardDetailsModel.registerFlow({
  key: 'cardSettings',
  title: tExpr('Card settings'),
  steps: {
    titleDescription: {
      title: tExpr('Title & description'),
      uiSchema: {
        title: {
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          title: tExpr('Title'),
        },
        description: {
          'x-component': 'Input.TextArea',
          'x-decorator': 'FormItem',
          title: tExpr('Description'),
        },
      },
      defaultParams(ctx) {
        return {
          title: ctx.model.context.workflow?.title,
        };
      },
      handler(ctx, params) {
        const title = ctx.t(params.title);
        const description = ctx.t(params.description);
        ctx.model.setDecoratorProps({ title: title, description: description });
      },
    },
  },
});

CCTaskCardDetailsModel.registerFlow({
  key: 'detailsSettings',
  title: tExpr('Details settings'),
  sort: 150,
  steps: {
    refresh: {
      async handler(ctx) {
        if (!ctx.resource) {
          throw new Error('Resource is not initialized');
        }
        // 先初始化字段网格，确保所有字段都创建完成
        await ctx.model.applySubModelsBeforeRenderFlows('grid');
      },
    },
    layout: {
      use: 'layout',
      title: tExpr('Layout'),
    },
  },
});
