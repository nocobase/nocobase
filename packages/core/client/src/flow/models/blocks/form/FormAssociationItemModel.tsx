/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  Collection,
  DisplayItemModel,
  tExpr,
  FieldModelRenderer,
  FlowModelContext,
  FormItem,
} from '@nocobase/flow-engine';
import { get, castArray } from 'lodash';
import React from 'react';
import { uid } from '@formily/shared';
import { FieldModel } from '../../base';
import { rebuildFieldSubModel } from '../../../internal/utils/rebuildFieldSubModel';
import { useJsonTemplateResolver } from '../../../utils/useJsonTemplateResolver';

const AssociationItem = (props) => {
  console.log(props);
  const prefix = props.underSubForm ? 'ctx.currentObject' : 'ctx.formValues';
  const path = `{{${prefix}.${props.fieldPath}}}`;
  const { data, loading, error } = useJsonTemplateResolver(path, [props.refreshId]);
  console.log(path, data);
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  return <FieldModelRenderer {...props.mergedProps} model={props.modelForRender} value={data || props.value} />;
};

export class FormAssociationItemModel extends DisplayItemModel {
  static defineChildren(ctx: FlowModelContext) {
    const collection = ctx.collection as Collection;

    return collection
      .getFields()
      .map((field) => {
        const binding = this.getDefaultBindingByField(ctx, field, { fallbackToTargetTitleField: true });
        if (!binding) return null;
        const fieldModel = binding.modelName;
        const fullName = ctx.prefixFieldPath ? `${ctx.prefixFieldPath}.${field.name}` : field.name;
        return {
          key: fullName,
          label: field.title,
          refreshTargets: ['DetailsCustomItemModel/DetailsJSFieldItemModel'],
          toggleable: (subModel) => {
            const fieldPath = subModel.getStepParams('fieldSettings', 'init')?.fieldPath;
            return fieldPath === fullName;
          },
          useModel: 'FormAssociationItemModel',
          createModelOptions: () => ({
            use: 'FormAssociationItemModel',
            stepParams: {
              fieldSettings: {
                init: {
                  dataSourceKey: collection.dataSourceKey,
                  collectionName: ctx.model.context.blockModel.collection.name,
                  fieldPath: fullName,
                },
              },
            },
            subModels: {
              field: {
                use: fieldModel,
                props:
                  typeof binding.defaultProps === 'function' ? binding.defaultProps(ctx, field) : binding.defaultProps,
              },
            },
          }),
        };
      })
      .filter(Boolean);
  }

  onInit(options: any) {
    super.onInit(options);
    this.context.defineProperty('actionName', {
      get: () => {
        return 'view';
      },
      cache: false,
    });
  }

  renderItem() {
    const fieldModel = this.subModels.field as FieldModel;
    const idx = this.context.fieldIndex;
    const record = this.context.record;
    const currentObject = this.context.currentObject;
    // 嵌套场景下继续传透，为字段子模型创建 fork
    const modelForRender =
      idx != null
        ? (() => {
            const fork = fieldModel.createFork({}, `${idx}`);
            fork.context.defineProperty('fieldIndex', {
              get: () => idx,
            });
            fork.context.defineProperty('record', {
              get: () => record,
              cache: false,
            });
            fork.context.defineProperty('currentObject', {
              get: () => currentObject,
              cache: false,
            });
            if (this.context.pattern) {
              fork.context.defineProperty('pattern', {
                get: () => this.context.pattern,
              });
            }
            return fork;
          })()
        : fieldModel;
    const name = this.collectionField.name;
    const path = this.fieldPath.replace(new RegExp(`\\.${name}$`), '');
    const dependenciesPath = castArray(path.split('.'));
    const prefix = this.context.prefixFieldPath;
    return (
      <FormItem
        {...this.props}
        shouldUpdate={(prevValues, curValues) => {
          return (
            JSON.stringify(get(prevValues, [...dependenciesPath])) !==
            JSON.stringify(get(curValues, [...dependenciesPath]))
          );
        }}
      >
        {() => {
          const refreshId = uid();
          return (
            <AssociationItem
              modelForRender={modelForRender}
              fieldPath={this.fieldPath.replace(new RegExp(`^${prefix}\\.`), '')}
              refreshId={refreshId}
              mergedProps={this.props}
              underSubForm={!!prefix}
            />
          );
        }}
      </FormItem>
    );
  }
}

FormAssociationItemModel.define({
  label: tExpr('Display fields'),
  sort: 100,
});

FormAssociationItemModel.registerFlow({
  key: 'detailItemSettings',
  sort: 300,
  title: tExpr('Detail item settings'),
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
          title: ctx.collectionField?.title,
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
        const { collectionField } = ctx.model;
        if (collectionField) {
          ctx.model.setProps(collectionField.getComponentProps());
        }
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
        },
      },
      handler(ctx, params) {
        ctx.model.setProps({ extra: params.description });
      },
    },
    model: {
      title: tExpr('Field component'),
      use: 'displayFieldComponent',
    },
    fieldNames: {
      use: 'titleField',
      title: tExpr('Title field'),
      beforeParamsSave: async (ctx, params, previousParams) => {
        if (!ctx.collectionField || !ctx.collectionField.isAssociationField()) {
          return null;
        }
        if (params.label !== previousParams.label) {
          ctx.model.setProps({
            titleField: params.label,
            ...ctx.collectionField.targetCollection?.getField(params.label)?.getComponentProps(),
          });

          const targetCollection = ctx.collectionField.targetCollection;
          const targetCollectionField = targetCollection.getField(params.label);
          const binding = DisplayItemModel.getDefaultBindingByField(ctx, targetCollectionField);
          const use = binding.modelName;
          await rebuildFieldSubModel({
            parentModel: ctx.model,
            targetUse: use,
            defaultProps:
              typeof binding?.defaultProps === 'function'
                ? binding.defaultProps(ctx, ctx.collectionField)
                : binding?.defaultProps,
            pattern: ctx.model.getProps().pattern,
          });
        }
      },
      async handler(ctx: any, params) {
        if (!ctx.collectionField || ctx.model.subModels.field.disableTitleField) {
          return;
        }
        ctx.model.setProps({
          titleField: params.label,
          ...ctx.collectionField.targetCollection?.getField(params.label)?.getComponentProps(),
        });
        const targetCollection = ctx.collectionField.targetCollection;
        if (targetCollection) {
          const targetCollectionField = targetCollection.getField(params.label);
          const binding = DisplayItemModel.getDefaultBindingByField(ctx, targetCollectionField);
          const use = binding.modelName;
          const bindingUse = ctx.model.subModels.field.use;
          if (use !== bindingUse) {
            ctx.model.setStepParams(ctx.flowKey, 'model', { use: use });
          }
        }
      },
      hideInSettings: async (ctx: FlowModelContext) => {
        return (
          !ctx.collectionField ||
          !ctx.collectionField.isAssociationField() ||
          (ctx.model.subModels.field as any).disableTitleField
        );
      },
    },
  },
});

FormAssociationItemModel.registerFlow({
  key: 'paginationChange',
  on: 'paginationChange',
  steps: {
    aclCheckRefresh: {
      use: 'aclCheckRefresh',
    },
  },
});
