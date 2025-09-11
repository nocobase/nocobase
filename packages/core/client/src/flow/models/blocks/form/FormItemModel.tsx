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
  jioToJoiSchema,
} from '@nocobase/flow-engine';
import { Alert } from 'antd';
import { capitalize } from 'lodash';
import { customAlphabet as Alphabet } from 'nanoid';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FieldValidation } from '../../../../collection-manager';
import { FieldModel } from '../../base/FieldModel';
import { EditFormModel } from './EditFormModel';

export const FieldNotAllow = ({ actionName, FieldTitle }) => {
  const { t } = useTranslation();
  const messageValue = useMemo(() => {
    return t(
      `The current user only has the UI configuration permission, but don't have "{{actionName}}" permission for field "{{name}}"`,
      {
        actionName: t(capitalize(actionName)),
        name: FieldTitle,
      },
    ).replaceAll('&gt;', '>');
  }, [FieldTitle, actionName, t]);
  return <Alert type="warning" message={messageValue} showIcon />;
};

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
      <FormItem {...this.props} name={namePath}>
        <FieldModelRenderer model={modelForRender} name={namePath} />
      </FormItem>
    );
  }
  // 设置态隐藏时的占位渲染
  renderHiddenInConfig(): React.ReactNode | undefined {
    return (
      <FormItem {...this.props}>
        <FieldNotAllow actionName={this.context.actionName} FieldTitle={this.props.label} />
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
        ctx.model.setProps({ label: params.label });
      },
    },
    aclCheck: {
      use: 'aclCheck',
    },
    init: {
      async handler(ctx) {
        await ctx.model.applySubModelsAutoFlows('field');
        const collectionField = ctx.model.collectionField;
        if (collectionField) {
          ctx.model.setProps(collectionField.getComponentProps());
        }
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
      uiSchema: (ctx) => {
        const targetInterface = ctx.app.dataSourceManager.collectionFieldInterfaceManager.getFieldInterface(
          ctx.model.collectionField.interface,
        );
        return {
          validation: {
            'x-decorator': 'FormItem',
            'x-component': FieldValidation,
            'x-component-props': {
              type: targetInterface.validationType,
              availableValidationOptions: [...new Set(targetInterface.availableValidationOptions)],
              excludeValidationOptions: [...new Set(targetInterface.excludeValidationOptions)],
              isAssociation: targetInterface.isAssociation,
            },
          },
        };
      },
      handler(ctx, params) {
        if (params.validation) {
          const rules = ctx.model.getProps().rules || [];
          const schema = jioToJoiSchema(params.validation);
          const label = ctx.model.props.label;
          rules.push({
            validator: (_, value) => {
              const { error } = schema.validate(value, {
                context: { label },
                abortEarly: false,
              });

              if (error) {
                const message = error.details.map((d: any) => d.message.replace(/"value"/g, `"${label}"`)).join(', ');
                return Promise.reject(message);
              }

              return Promise.resolve();
            },
          });
          ctx.model.setProps({
            rules,
          });
        }
      },
    },
  },
});
