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
  escapeT,
  FieldModelRenderer,
  FlowModelContext,
  FormItem,
} from '@nocobase/flow-engine';
import { debounce } from 'lodash';
import { customAlphabet as Alphabet } from 'nanoid';
import React from 'react';
import { DEBOUNCE_WAIT } from '../../../../variables';
import { SelectOptions } from '../../../actions/titleField';
import { FieldModel } from '../../base';
import { DetailsItemModel } from '../details/DetailsItemModel';
import { EditFormModel } from './EditFormModel';

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
          refreshTargets: ['FormCustomItemModel/FormJSFieldItemModel'],
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
        subModel.setProps(this.collectionField.getComponentProps());
      }
    });
  }

  render() {
    const fieldModel = this.subModels.field as FieldModel;
    // 行索引（来自数组子表单）
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
    const namePath = buildDynamicName(this.props.name, idx);
    return (
      <FormItem
        {...this.props}
        name={namePath}
        onChange={(event) => {
          this.dispatchEvent('formItemChange', { value: event?.target?.value }, { debounce: true });
        }}
      >
        <FieldModelRenderer model={modelForRender} name={namePath} />
      </FormItem>
    );
  }
}

FormItemModel.define({
  label: escapeT('Display collection fields'),
  sort: 100,
});

FormItemModel.registerFlow({
  key: 'editItemSettings',
  sort: 300,
  title: escapeT('Form item settings'),
  steps: {
    label: {
      title: escapeT('Label'),
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
          label: ctx.collectionField.title,
        };
      },
      handler(ctx, params) {
        ctx.model.setProps({ label: params.label || ctx.collectionField.title });
      },
    },
    aclCheck: {
      use: 'aclCheck',
    },
    init: {
      async handler(ctx) {
        // const collectionField = ctx.model.collectionField;
        // if (collectionField) {
        //   ctx.model.setProps(collectionField.getComponentProps());
        // }
        const fieldPath = ctx.model.fieldPath;
        const fullName = fieldPath.includes('.') ? fieldPath.split('.') : fieldPath;
        ctx.model.setProps({
          name: fullName,
        });
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
    initialValue: {
      title: escapeT('Default value'),
      uiSchema: (ctx) => {
        if (ctx.model.parent.parent instanceof EditFormModel) {
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

        if (collectionField.interface === 'nanoid') {
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
        ctx.model.setProps({ initialValue: params.defaultValue });
      },
    },
    required: {
      title: escapeT('Required'),
      use: 'required',
    },

    model: {
      use: 'fieldComponent',
      title: escapeT('Field component'),
    },
    pattern: {
      title: escapeT('Display mode'),
      use: 'pattern',
    },

    validation: {
      title: escapeT('Validation'),
      use: 'validation',
    },
    fieldNames: {
      use: 'titleField',
      uiSchema: async (ctx) => {
        const isAssociationReadPretty = ctx.collectionField.isAssociationField() && ctx.model.getProps().titleField;
        if (!isAssociationReadPretty) {
          return null;
        }
        return {
          label: {
            'x-component': SelectOptions,
            'x-decorator': 'FormItem',
          },
        };
      },
      beforeParamsSave: async (ctx, params, previousParams) => {
        const isAssociationReadPretty = ctx.collectionField.isAssociationField() && ctx.model.props.titleField;
        if (!isAssociationReadPretty) {
          return null;
        }
        if (params.label !== previousParams.label) {
          const targetCollection = ctx.collectionField.targetCollection;
          const targetCollectionField = targetCollection.getField(params.label);
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
      async handler(ctx, params) {
        if (ctx.model.props.pattern === 'readPretty') {
          ctx.model.setProps({ titleField: params?.label });
        }
      },
    },
  },
});

FormItemModel.registerEvents({
  formItemChange: { label: escapeT('Filed value change'), name: 'formItemChange' },
});
