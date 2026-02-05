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
  DefaultStructure,
  EditableItemModel,
  tExpr,
  FieldModelRenderer,
  FlowModelContext,
  FormItem,
} from '@nocobase/flow-engine';
import { customAlphabet as Alphabet } from 'nanoid';
import React from 'react';
import { FieldModel } from '../../base';
import { DetailsItemModel } from '../details/DetailsItemModel';
import { EditFormModel } from './EditFormModel';
import _ from 'lodash';
import { coerceForToOneField } from '../../../internal/utils/associationValueCoercion';

const interfacesOfUnsupportedDefaultValue = [
  'o2o',
  'oho',
  'obo',
  'o2m',
  'attachment',
  'expression',
  'point',
  'lineString',
  'circle',
  'polygon',
  'sequence',
  'formula',
];

function buildDynamicName(nameParts: string[], fieldIndex: string[]) {
  if (!fieldIndex?.length) {
    return nameParts;
  }

  // 取最后一个索引
  const [lastField, indexStr] = fieldIndex[fieldIndex.length - 1].split(':');
  const idx = Number(indexStr);

  // 找到 lastField 在 nameParts 的位置
  const lastIndex = nameParts.indexOf(lastField);

  if (lastIndex === -1) {
    // 找不到对应字段，直接返回原始 nameParts
    return nameParts;
  }

  // 结果 = [索引, ...lastField 后面的字段]
  return [idx, ...nameParts.slice(lastIndex + 1)];
}

export class FormItemModel<T extends DefaultStructure = DefaultStructure> extends EditableItemModel<T> {
  static defineChildren(ctx: FlowModelContext) {
    const collection = ctx.collection as Collection;
    return collection
      .getFields()
      .map((field) => {
        const binding = this.getDefaultBindingByField(ctx, field);
        if (!binding) {
          return;
        }
        const fieldModel = binding.modelName;
        const fullName = ctx.prefixFieldPath ? `${ctx.prefixFieldPath}.${field.name}` : field.name;
        return {
          key: fullName,
          label: field.title,
          // 同步刷新 JS 字段菜单的切换状态（兼容旧路径与新路径）
          refreshTargets: ['FormItemModel/FormJSFieldItemModel'],
          toggleable: (subModel) => {
            const fieldPath = subModel.getStepParams('fieldSettings', 'init')?.fieldPath;
            return fieldPath === fullName;
          },
          useModel: 'FormItemModel',
          createModelOptions: () => ({
            use: 'FormItemModel',
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
    this.emitter.on('onSubModelAdded', (subModel: FieldModel) => {
      if (this.collectionField) {
        const componentProps = this.collectionField.getComponentProps();
        subModel.setProps(componentProps);
        this.setProps({ ...(_.pick(componentProps, 'rules') || {}) });
      }
    });
  }

  renderItem() {
    const fieldModel = this.subModels.field as FieldModel;
    // 行索引（来自数组子表单）
    const idx = this.context.fieldIndex;
    const fieldKey = this.context.fieldKey;
    const parentFieldPathArray = this.parent?.context.fieldPathArray || [];

    // 嵌套场景下继续传透，为字段子模型创建 fork
    const modelForRender =
      idx != null
        ? (() => {
            const fork = fieldModel.createFork({}, `${fieldKey}`);
            fork.context.defineProperty('fieldIndex', {
              get: () => idx,
            });
            fork.context.defineProperty('fieldKey', {
              get: () => fieldKey,
            });
            if (this.context.currentObject) {
              fork.context.defineProperty('currentObject', {
                get: () => this.context.currentObject,
              });
            }
            if (this.context.pattern) {
              fork.context.defineProperty('pattern', {
                get: () => this.context.pattern,
              });
            }
            return fork;
          })()
        : fieldModel;
    const mergedProps = this.context.pattern ? { ...this.props, pattern: this.context.pattern } : this.props;
    const fieldPath = buildDynamicName(this.props.name, idx);
    this.context.defineProperty('fieldPathArray', {
      value: [...parentFieldPathArray, ..._.castArray(fieldPath)],
    });
    const record = this.context.currentObject || this.context.record;
    return (
      <FormItem
        {...mergedProps}
        name={fieldPath}
        validateFirst={true}
        disabled={
          this.props.disabled ||
          (!_.isEmpty(record) && !record.__is_new__ && this.props.aclDisabled) ||
          (!_.isEmpty(record) && record.__is_new__ && this.props.aclCreateDisabled)
        }
      >
        <FieldModelRenderer model={modelForRender} name={fieldPath} />
      </FormItem>
    );
  }
}

FormItemModel.define({
  label: tExpr('Display fields'),
  sort: 100,
});

FormItemModel.registerFlow({
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
        const blockActionName = ctx.blockModel.context.actionName;
        const result = await ctx.aclCheck({
          dataSourceKey: ctx.dataSource?.key,
          resourceName: ctx.collectionField?.collectionName,
          fields: [ctx.collectionField?.name],
          actionName: blockActionName,
        });

        if (blockActionName === 'update') {
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
        } else if (blockActionName === 'create') {
          // 新增表单
          const updateCollectionAclResult = await ctx.aclCheck({
            dataSourceKey: ctx.dataSource?.key,
            resourceName: ctx.collectionField?.collectionName,
            actionName: 'update',
          });

          const updateFieldAclResult = await ctx.aclCheck({
            dataSourceKey: ctx.dataSource?.key,
            resourceName: ctx.collectionField?.collectionName,
            fields: [ctx.collectionField.name],
            actionName: 'update',
          });
          if (!result && !ctx.currentObject?.__is_stored__) {
            // 子表单中选择的记录
            ctx.model.hidden = true;
            ctx.model.forbidden = {
              actionName: blockActionName,
            };
            ctx.exitAll();
          }
          if (!updateCollectionAclResult || !updateFieldAclResult) {
            ctx.model.setProps({
              aclDisabled: true,
            });
          }
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
    initialValue: {
      title: tExpr('Default value'),
      uiSchema: (ctx) => {
        if (ctx.model.parent.parent instanceof EditFormModel) {
          return;
        }
        // 当前字段组件本身为 SubForm/SubTable 时，也不提供默认值设置
        if ((ctx.model.subModels as any)?.field?.updateAssociation) {
          return;
        }
        const iface = ctx.model.collectionField?.interface;
        if (interfacesOfUnsupportedDefaultValue?.includes?.(iface)) {
          return;
        }
        return {
          defaultValue: {
            'x-component': 'DefaultValue',
            'x-decorator': 'FormItem',
          },
        };
      },
      defaultParams: (ctx) => {
        const collectionField = ctx.model.collectionField;

        if (collectionField.interface === 'nanoid' && collectionField.options.autoFill !== false) {
          const { size, customAlphabet } = collectionField.options || { size: 21 };
          return {
            defaultValue: Alphabet(customAlphabet, size)(),
          };
        }
        return {
          defaultValue: collectionField.defaultValue,
        };
      },
      handler(ctx, params) {
        const iface = ctx.model.collectionField?.interface;
        if (interfacesOfUnsupportedDefaultValue?.includes?.(iface)) {
          return;
        }
        const collectionField = ctx.model.collectionField;
        const finalDefault = coerceForToOneField(collectionField, params.defaultValue);
        ctx.model.setProps({ initialValue: finalDefault });
      },
    },
    validation: {
      title: tExpr('Validation'),
      use: 'validation',
    },
    required: {
      title: tExpr('Required'),
      use: 'required',
    },

    model: {
      use: 'fieldComponent',
      title: tExpr('Field component'),
    },
    pattern: {
      use: 'pattern',
    },

    titleField: {
      use: 'titleField',
      hideInSettings(ctx) {
        if (!ctx.collectionField || !ctx.collectionField.isAssociationField()) {
          return true;
        }
        const isAssociationReadPretty =
          ctx.collectionField.isAssociationField() && ctx.model.getProps().pattern === 'readPretty';
        if (!isAssociationReadPretty) {
          return true;
        }
        return false;
      },
      defaultParams: (ctx: any) => {
        const titleField =
          ctx.model.props.titleField || ctx.model.context.collectionField.targetCollectionTitleFieldName;
        return {
          titleField: titleField,
        };
      },
      beforeParamsSave: async (ctx, params, previousParams) => {
        const isAssociationReadPretty =
          ctx.collectionField.isAssociationField() && ctx.model.getProps().pattern === 'readPretty';
        if (!isAssociationReadPretty) {
          return null;
        }
        const label = params.titleField || params.label;
        if (label !== previousParams.titleField) {
          const targetCollection = ctx.collectionField.targetCollection;
          const targetCollectionField = targetCollection.getField(label);
          const binding = DetailsItemModel.getDefaultBindingByField(ctx, targetCollectionField);
          if (binding.modelName !== (ctx.model.subModels.field as any).use) {
            const fieldUid = ctx.model.subModels['field']['uid'];
            await ctx.engine.destroyModel(fieldUid);
            const model = ctx.model.setSubModel('field', {
              use: binding.modelName,
              stepParams: {
                fieldSettings: {
                  init: {
                    dataSourceKey: ctx.model.collectionField.dataSourceKey,
                    collectionName: targetCollection.name,
                    fieldPath: label,
                  },
                },
              },
            });
            await model.save();
          }
          ctx.model.setProps(ctx.collectionField.targetCollection.getField(label).getComponentProps());
        }
      },
      async handler(ctx, params) {
        if (ctx.model.props.pattern === 'readPretty') {
          ctx.model.setProps({ titleField: params?.label });
        } else {
          ctx.model.setProps({ titleField: params.titleField });
        }
      },
    },
  },
});

FormItemModel.registerFlow({
  key: 'paginationChange',
  on: 'paginationChange',
  steps: {
    aclCheckRefresh: {
      use: 'aclCheckRefresh',
      defaultParams: {
        strategy: 'formItem',
      },
    },
  },
});
