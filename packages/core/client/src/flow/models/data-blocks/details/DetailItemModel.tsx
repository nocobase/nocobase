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

  onInit(options: any): void {
    super.onInit(options);
    this.context.defineProperty('fieldValue', {
      get: () => this.context.record?.[this.fieldPath],
      cache: false,
    });
  }

  @reactive
  render() {
    const fieldModel = this.subModels.field as FieldModel;
    const value = this.context.record?.[this.fieldPath]; // values[0] ? values[0][this.fieldPath] : null;
    // fieldModel.defineContextProperties({
    //   value,
    // });
    fieldModel.context.defineProperty('value', {
      get: () => value,
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
    label: {
      title: escapeT('Label'),
      uiSchema: {
        title: {
          'x-component': 'Input',
          'x-decorator': 'FormItem',
        },
      },
      defaultParams: (ctx) => {
        return {
          title: ctx.collectionField.title,
        };
      },
      handler(ctx, params) {
        ctx.model.setDecoratorProps({ title: params.title });
      },
    },
    showLabel: {
      title: escapeT('Show label'),
      uiSchema: {
        showLabel: {
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
          'x-component-props': {
            checkedChildren: escapeT('Yes'),
            unCheckedChildren: escapeT('No'),
          },
        },
      },
      defaultParams: {
        showLabel: true,
      },
      handler(ctx, params) {
        ctx.model.showTitle(params.showLabel);
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
  },
});
