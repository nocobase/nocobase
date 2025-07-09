/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseItem } from '@formily/antd-v5';
import { observable } from '@formily/reactive';
import { escapeT, reactive } from '@nocobase/flow-engine';
import { castArray } from 'lodash';
import React from 'react';
import { FieldModel } from '../../base/FieldModel';
import { DetailsFieldGridModel } from './DetailsFieldGridModel';

export class DetailItemModel extends FieldModel<{
  parent: DetailsFieldGridModel;
  subModels: { field: FieldModel };
}> {
  decoratorProps = observable({} as any);
  setDecoratorProps(props) {
    Object.assign(this.decoratorProps, props);
  }

  showTitle(showTitle: boolean) {
    this.setDecoratorProps({
      labelStyle: { display: showTitle ? 'flex' : 'none' },
    });
  }

  @reactive
  render() {
    const resource = this.parent.parent.resource;
    const fieldModel = this.subModels.field as any;
    const values = castArray(resource.getData()).filter(Boolean);
    const value = values[0] ? values[0][this.fieldPath] : null;
    fieldModel.setSharedContext({
      ...this.ctx.shared,
      value,
    });
    return (
      <BaseItem {...this.decoratorProps} extra={this.decoratorProps?.description} label={this.decoratorProps.title}>
        {fieldModel.render()}
      </BaseItem>
    );
  }
}

DetailItemModel.define({
  icon: 'DetailFormItem',
  defaultOptions: {
    use: 'DetailItemModel',
  },
  sort: 100,
});

DetailItemModel.registerFlow({
  key: 'detailItemSettings',
  auto: true,
  sort: 300,
  title: escapeT('Detail item settings'),
  steps: {
    init: {
      async handler(ctx) {
        await ctx.model.applySubModelsAutoFlows('field');
      },
    },
    title: {
      title: escapeT('Title'),
      uiSchema: {
        title: {
          'x-component': 'Input',
          'x-decorator': 'FormItem',
        },
      },
      handler(ctx, params) {
        ctx.model.setDecoratorProps({ title: params.title });
      },
      defaultParams: (ctx) => {
        return {
          title: ctx.model.collectionField?.title,
        };
      },
    },
    showTitle: {
      title: escapeT('Show title'),
      uiSchema: {
        showTitle: {
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
          'x-component-props': {
            checkedChildren: escapeT('Yes'),
            unCheckedChildren: escapeT('No'),
          },
        },
      },
      defaultParams: {
        showTitle: true,
      },
      handler(ctx, params) {
        ctx.model.showTitle(params.showTitle);
      },
    },
    description: {
      title: escapeT('Description'),
      uiSchema: {
        description: {
          'x-component': 'Input.TextArea',
          'x-decorator': 'FormItem',
        },
      },
      handler(ctx, params) {
        ctx.model.setDecoratorProps({ description: params.description });
      },
    },
    tooltip: {
      title: escapeT('Tooltip'),
      uiSchema: {
        tooltip: {
          'x-component': 'Input.TextArea',
          'x-decorator': 'FormItem',
        },
      },
      handler(ctx, params) {
        ctx.model.setDecoratorProps({ tooltip: params.tooltip });
      },
    },
  },
});
