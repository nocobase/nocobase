/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormItemModel, FieldModelRenderer, FormItem, FieldModel } from '@nocobase/client';
import { tExpr } from '@nocobase/flow-engine';
import _ from 'lodash';
import { bulkEditTitleField } from './bulkEditTitleField';

export class BulkEditFormItemModel extends FormItemModel {
  static defineChildren(ctx: any) {
    const fileds = ctx.collection.getFields();
    const children = FormItemModel.defineChildren(ctx) || [];
    return children
      .filter((child: any) => {
        const field = fileds.find((f) => f.name === child.key);
        const canEdit =
          field?.interface &&
          !field?.uiSchema?.['x-read-pretty'] &&
          field.interface !== 'snapshot' &&
          field.type !== 'sequence';

        return canEdit;
      })
      .map((child: any) => ({
        ...child,
        // useModel: 'BulkEditFormItemModel',
        createModelOptions: () => {
          const options = child.createModelOptions();
          const field = options?.subModels?.field;
          const fieldWarp = {
            use: 'BulkEditFieldModel',
            subModels: {
              field,
            },
          };
          return {
            ...options,
            subModels: {
              field: fieldWarp,
            },
            use: 'BulkEditFormItemModel',
          };
        },
      }));
  }
}

BulkEditFormItemModel.define({
  label: tExpr('Display fields'),
});

const baseEditItemSettingsFlow = (FormItemModel as any).globalFlowRegistry?.getFlow?.('editItemSettings');
if (baseEditItemSettingsFlow) {
  const data = baseEditItemSettingsFlow.serialize();
  const { key, steps, ...rest } = data as any;
  // 过滤掉不需要的配置项，但保留 titleField 以便我们可以替换它
  const { initialValue, required, validation, pattern, model, ...filteredSteps } = (steps || {}) as Record<string, any>;
  // 替换 titleField 为我们的 bulkEditTitleField
  if (filteredSteps?.titleField) {
    filteredSteps.titleField = {
      // ...filteredSteps.titleField,
      // ...bulkEditTitleField,
      use: 'bulkEditTitleField',
    };
  }

  BulkEditFormItemModel.registerFlow({
    key: 'editItemSettings',
    ...rest,
    steps: filteredSteps,
  });
}

/**
BulkEditFormItemModel.registerFlow({
  key: 'editItemSettings',
  sort: 300,
  title: tExpr('Form item settings'),
  steps: {
    showLabel: {
      title: tExpr('Show label'),
      uiMode: { type: 'switch', key: 'showLabel' },
      defaultParams: {
        showLabel: true,
      },
      handler(ctx, params) {
        ctx.model.setProps({ showLabel: params.showLabel });
      },
    },
    label: {
      title: tExpr('Label'),
      uiSchema: (ctx) => {
        return {
          label: {
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
          label: ctx.collectionField?.title,
        };
      },
      handler(ctx, params) {
        ctx.model.setProps({ label: params.label || ctx.collectionField?.title });
      },
    },
    aclCheck: {
      use: 'aclCheck',
      async handler(ctx, params) {
        if (!ctx.collectionField || !ctx.blockModel) {
          return;
        }
        const blockActionName = 'update';
        const result = await ctx.aclCheck({
          dataSourceKey: ctx.dataSource?.key,
          resourceName: ctx.collectionField?.collectionName,
          fields: [ctx.collectionField?.name],
          actionName: blockActionName,
        });
        // 编辑表单
        const resultView = await ctx.aclCheck({
          dataSourceKey: ctx.dataSource?.key,
          resourceName: ctx.collectionField?.collectionName,
          fields: [ctx.collectionField.name],
          actionName: 'view',
        });
        if (ctx.prefixFieldPath && ctx.currentObject) {
          //子表单下的新增
          const createFieldAclResult = await ctx.aclCheck({
            dataSourceKey: ctx.dataSource?.key,
            resourceName: ctx.collectionField?.collectionName,
            fields: [ctx.collectionField.name],
            actionName: 'create',
          });

          if (!createFieldAclResult) {
            ctx.model.setProps({
              aclCreateDisabled: true,
            });
          }
        }

        if (!resultView && !ctx.currentObject?.__is_new__) {
          ctx.model.hidden = true;
          ctx.model.forbidden = {
            actionName: 'view',
          };
          ctx.exitAll();
        }

        if (!result) {
          ctx.model.setProps({
            aclDisabled: true,
          });
        }
      },
    },
    init: {
      async handler(ctx) {
        const fieldPath = ctx.model.fieldPath;
        const fullName = fieldPath.includes('.') ? fieldPath.split('.') : fieldPath;
        ctx.model.setProps({
          name: fullName,
        });
      },
    },
    tooltip: {
      title: tExpr('Tooltip'),
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
      title: tExpr('Description'),
      uiSchema: {
        description: {
          'x-component': 'Input.TextArea',
          'x-decorator': 'FormItem',
          'x-component-props': {
            autoSize: true,
          },
        },
      },
      handler(ctx, params) {
        ctx.model.setProps({ extra: params.description });
      },
    },
  },
});
 */
