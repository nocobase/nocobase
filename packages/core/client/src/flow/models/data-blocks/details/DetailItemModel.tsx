/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT } from '@nocobase/flow-engine';
import React from 'react';
import { FieldModel } from '../../base/FieldModel';
import { DetailsFieldGridModel } from './DetailsFieldGridModel';
import { FormItem } from '../form/FormItem/FormItem';
import { FieldModelRenderer } from '../../fields';

export class DetailItemModel extends FieldModel<{
  parent: DetailsFieldGridModel;
  subModels: { field: FieldModel };
}> {
  onInit(options: any): void {
    super.onInit(options);
  }

  render() {
    const fieldModel = this.subModels.field as FieldModel;
    const value = this.context.record?.[this.fieldPath];
    return (
      <FormItem {...this.props} value={value}>
        <FieldModelRenderer model={fieldModel} />
      </FormItem>
    );
  }
}

DetailItemModel.define({
  icon: 'DetailFormItem',
  createModelOptions: {
    use: 'DetailItemModel',
  },
  sort: 100,
});

DetailItemModel.registerFlow({
  key: 'detailItemSettings',
  sort: 300,
  title: escapeT('Detail item settings'),
  steps: {
    init: {
      async handler(ctx) {
        await ctx.model.applySubModelsAutoFlows('field');
        const { collectionField } = ctx.model;
        ctx.model.setProps(collectionField.getComponentProps());
        if (collectionField.enum.length) {
          ctx.model.setProps({ options: collectionField.enum });
        }
      },
    },
    label: {
      title: escapeT('Label'),
      uiSchema: (ctx) => {
        return {
          title: {
            'x-component': 'Input',
            'x-decorator': 'FormItem',
            'x-reactions': (field) => {
              const model = ctx.model;
              const originTitle = model.collectionField?.title;
              field.decoratorProps = {
                ...field.decoratorProps,
                extra: model.context.t('Original field title: ') + (model.context.t(originTitle) ?? ''),
              };
            },
          },
        };
      },
      defaultParams: (ctx) => {
        return {
          title: ctx.collectionField.title,
        };
      },
      handler(ctx, params) {
        ctx.model.setProps({ label: params.title });
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
        ctx.model.setProps({ showLabel: params.showLabel });
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
        ctx.model.setProps({ tooltip: params.tooltip });
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
        ctx.model.setProps({ extra: params.description });
      },
    },
    model: {
      title: escapeT('Field component'),
      use: 'fieldComponent',
    },
  },
});
