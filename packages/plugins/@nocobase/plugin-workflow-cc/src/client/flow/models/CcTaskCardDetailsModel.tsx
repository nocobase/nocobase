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
import { DetailsBlockModel, FormComponent } from '@nocobase/client';

/**
 * CC task card detail model: lightweight, read-only detail block for task cards.
 */
export class CcTaskCardDetailsModel extends DetailsBlockModel {
  // always visible in builder/runtime
  // @ts-ignore
  get hidden() {
    return false;
  }

  set hidden(value) {}

  onInit(options: any): void {
    super.onInit(options);
    this.setDecoratorProps({ size: 'small' });
    this.context.defineMethod('aclCheck', () => true);
  }

  createResource(ctx, params) {
    const resource = this.context.createResource(SingleRecordResource);
    resource.isNewRecord = false;
    // @ts-ignore
    resource.refresh = _.noop;
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

CcTaskCardDetailsModel.define({
  hide: true,
});

CcTaskCardDetailsModel.registerFlow({
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
        ctx.model.setDecoratorProps({ title, description });
      },
    },
  },
});

CcTaskCardDetailsModel.registerFlow({
  key: 'detailsSettings',
  title: tExpr('Details settings'),
  sort: 150,
  steps: {
    refresh: {
      async handler(ctx) {
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
