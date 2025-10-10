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
  escapeT,
  FieldModelRenderer,
  FlowModelContext,
  FormItem,
} from '@nocobase/flow-engine';
import { get } from 'lodash';
import React from 'react';
import { FieldModel } from '../../base';
import { DetailsGridModel } from './DetailsGridModel';

/**
 * 从 record 中取值
 * @param record 当前行数据
 * @param fieldPath 字段路径 (如 "o2m_aa.oho_bb.name")
 * @param idx Form.List 的索引
 */
export function getValueWithIndex(record: any, fieldPath: string, fieldIndex?: string[]) {
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
  }

  render() {
    const fieldModel = this.subModels.field as FieldModel;
    const idx = this.context.fieldIndex;
    // 嵌套场景下继续传透，为字段子模型创建 fork
    const modelForRender =
      idx != null
        ? (() => {
            const fork = fieldModel.createFork({}, `${idx}`);
            fork.context.defineProperty('fieldIndex', {
              get: () => idx,
            });
            return fork;
          })()
        : fieldModel;
    const value = getValueWithIndex(this.context.record, this.fieldPath, idx);

    return (
      <FormItem {...this.props} value={value}>
        <FieldModelRenderer model={modelForRender} />
      </FormItem>
    );
  }
}

DetailsItemModel.define({
  label: escapeT('Display collection fields'),
  sort: 100,
});

DetailsItemModel.registerFlow({
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
      use: 'displayFieldComponent',
    },
    fieldNames: {
      use: 'titleField',
      title: escapeT('Label field'),

      beforeParamsSave: async (ctx, params, previousParams) => {
        if (!ctx.collectionField.isAssociationField()) {
          return null;
        }
        if (params.label !== previousParams.label) {
          const targetCollection = ctx.collectionField.targetCollection;
          const targetCollectionField = targetCollection.getField(params.label);
          const binding = (ctx.model.constructor as typeof DetailsItemModel).getDefaultBindingByField(
            ctx,
            targetCollectionField,
          );
          if (binding.modelName !== ctx.model.subModels.field.use) {
            const fieldUid = ctx.model.subModels['field']['uid'];
            await ctx.engine.destroyModel(fieldUid);
            const model = ctx.model.setSubModel('field', {
              use: binding.modelName,
              stepParams: {
                fieldSettings: {
                  init: {
                    dataSourceKey: ctx.model.collectionField.dataSourceKey,
                    collectionName: targetCollection.name,
                    fieldPath: params.label,
                  },
                },
              },
            });
            await model.save();
          }
          ctx.model.setProps(ctx.collectionField.targetCollection.getField(params.label).getComponentProps());
        }
      },
      handler(ctx, params) {
        ctx.model.setProps({
          titleField: params.label,
          ...ctx.collectionField.targetCollection?.getField(params.label)?.getComponentProps(),
        });
      },
    },
  },
});
