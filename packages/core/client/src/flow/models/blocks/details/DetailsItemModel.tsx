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
import { FieldModel } from '../../base';
import { DetailsGridModel } from './DetailsGridModel';
import { rebuildFieldSubModel } from '../../../internal/utils/rebuildFieldSubModel';

/**
 * 从 record 中取值
 * @param record 当前行数据
 * @param fieldPath 字段路径 (如 "o2m_aa.oho_bb.name")
 * @param idx Form.List 的索引
 */
export function getValueWithIndex(record: any, fieldPath: string, idx?: string[]) {
  const fieldIndex = castArray(idx).filter((v) => typeof v === 'string');
  const path = fieldPath.split('.');

  if (fieldIndex?.length) {
    const fullPath: (string | number)[] = [];
    let pathPtr = 0;
    let idxPtr = 0;

    while (pathPtr < path.length) {
      const current = path[pathPtr];
      fullPath.push(current);

      // 检查当前集合是否有索引
      if (idxPtr < fieldIndex.length) {
        const [listName, indexStr] = fieldIndex[idxPtr].split(':');
        if (listName === current) {
          fullPath.push(Number(indexStr));
          idxPtr++;
        }
      }

      pathPtr++;
    }

    return get(record, fullPath);
  }

  return get(record, path);
}

export class DetailsItemModel extends DisplayItemModel<{
  parent: DetailsGridModel;
  subModels: { field: FieldModel };
}> {
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
          useModel: 'DetailsItemModel',
          createModelOptions: () => ({
            use: 'DetailsItemModel',
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
    const mergedProps = this.context.pattern
      ? {
          ...this.context.blockModel.props,
          ...this.props,
          pattern: this.context.pattern,
          disabled: this.context.pattern === 'readPretty',
        }
      : { ...this.context.blockModel.props, ...this.props };
    const value = getValueWithIndex(record, this.fieldPath, idx);
    return (
      <FormItem {...mergedProps} value={value}>
        <FieldModelRenderer model={modelForRender} />
      </FormItem>
    );
  }
}

DetailsItemModel.define({
  label: tExpr('Display fields'),
  sort: 100,
});

DetailsItemModel.registerFlow({
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

DetailsItemModel.registerFlow({
  key: 'paginationChange',
  on: 'paginationChange',
  steps: {
    aclCheckRefresh: {
      use: 'aclCheckRefresh',
    },
  },
});
