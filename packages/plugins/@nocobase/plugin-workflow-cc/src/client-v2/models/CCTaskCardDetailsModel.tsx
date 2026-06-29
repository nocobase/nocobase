/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DetailsBlockModel, FormComponent } from '@nocobase/client-v2';
import { FlowModelRenderer, SingleRecordResource, type FlowModelContext } from '@nocobase/flow-engine';
import React from 'react';

import { tExpr } from '../locale';

type DecoratorPropsModel = {
  setDecoratorProps: (props: { description?: string; title?: string }) => void;
};

export class CCTaskCardDetailsModel extends DetailsBlockModel {
  onInit(options: Parameters<DetailsBlockModel['onInit']>[0]): void {
    super.onInit(options);
    this.setDecoratorProps({
      size: 'small',
    });
    this.context.defineMethod('aclCheck', () => true);
    this.context.defineProperty('disableFieldClickToOpen', {
      get: () => true,
    });
  }

  createResource(ctx: FlowModelContext) {
    const resource = ctx.createResource(SingleRecordResource);
    resource.isNewRecord = false;
    resource.refresh = async () => {};
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
      defaultParams(ctx: FlowModelContext) {
        return {
          title: ctx.model.context.workflow?.title,
        };
      },
      handler(ctx: FlowModelContext, params: { description?: string; title?: string }) {
        (ctx.model as unknown as DecoratorPropsModel).setDecoratorProps({
          description: ctx.t(params.description),
          title: ctx.t(params.title),
        });
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
      async handler(ctx: FlowModelContext) {
        if (!ctx.resource) {
          throw new Error('Resource is not initialized');
        }
        await ctx.model.applySubModelsBeforeRenderFlows('grid');
      },
    },
    layout: {
      use: 'layout',
      title: tExpr('Layout'),
    },
  },
});

export default CCTaskCardDetailsModel;
