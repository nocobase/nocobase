/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { buildWrapperFieldChildren, Collection, escapeT, FlowModelContext } from '@nocobase/flow-engine';
import { get } from 'lodash';
import React from 'react';
import { FieldModelRenderer } from '../../../common/FieldModelRenderer';
import { CollectionFieldItemModel } from '../../base/CollectionFieldItemModel';
import { FieldModel } from '../../base/FieldModel';
import { FormItem } from '../form/FormItem/FormItem';
import { FieldNotAllow } from '../form/FormItem/FormItemModel';
import { DetailsFieldGridModel } from './DetailsFieldGridModel';

export class DetailItemModel extends CollectionFieldItemModel<{
  parent: DetailsFieldGridModel;
  subModels: { field: FieldModel };
}> {
  static defineChildren(ctx: FlowModelContext) {
    const collection = ctx.collection as Collection;
    return collection.getFields().map((field) => {
      const fieldModel = field.getFirstSubclassNameOf('ReadPrettyFieldModel') || 'ReadPrettyFieldModel';
      const fieldPath = field.name;
      return {
        key: field.name,
        label: field.title,
        toggleable: (subModel) => subModel.getStepParams('fieldSettings', 'init')?.fieldPath === field.name,
        createModelOptions: () => ({
          use: 'DetailItemModel',
          stepParams: {
            fieldSettings: {
              init: {
                dataSourceKey: collection.dataSourceKey,
                collectionName: collection.name,
                fieldPath,
              },
            },
          },
          subModels: {
            field: {
              use: fieldModel,
            },
          },
        }),
      };
    });
  }

  onInit(options: any) {
    super.onInit(options);
  }

  render() {
    const fieldModel = this.subModels.field as FieldModel;
    const value = get(this.context.record, this.fieldPath);
    return (
      <FormItem {...this.props} value={value}>
        <FieldModelRenderer model={fieldModel} />
      </FormItem>
    );
  }

  renderHiddenInConfig(): React.ReactNode | undefined {
    return (
      <FormItem {...this.props}>
        <FieldNotAllow actionName={this.context.actionName} FieldTitle={this.props.label} />
      </FormItem>
    );
  }
}

DetailItemModel.define({
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
    aclCheck: {
      use: 'aclCheck',
    },
    init: {
      async handler(ctx) {
        await ctx.model.applySubModelsAutoFlows('field');
        const { collectionField } = ctx.model;
        if (collectionField) {
          ctx.model.setProps(collectionField.getComponentProps());
        }
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
