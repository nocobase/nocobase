/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  buildWrapperFieldChildren,
  Collection,
  escapeT,
  FlowModelContext,
  jioToJoiSchema,
} from '@nocobase/flow-engine';
import { Alert } from 'antd';
import { capitalize } from 'lodash';
import { customAlphabet as Alphabet } from 'nanoid';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FieldValidation } from '../../../../../collection-manager';
import { FieldModelRenderer } from '../../../../common/FieldModelRenderer';
import { CollectionFieldItem } from '../../../base/CollectionFieldItem';
import { FieldModel } from '../../../base/FieldModel';
import { EditFormModel } from '../EditFormModel';
import { FormItem } from './FormItem';

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

export class FormItemModel extends CollectionFieldItem {
  static defineChildren(ctx: FlowModelContext) {
    const collection = ctx.collection as Collection;
    return collection.getFields().map((field) => {
      const fieldModel = field.getFirstSubclassNameOf('FormFieldModel') || 'FormFieldModel';
      const fieldPath = field.name;
      return {
        key: field.name,
        label: field.title,
        toggleable: (subModel) => subModel.getStepParams('fieldSettings', 'init')?.fieldPath === field.name,
        useModel: 'FormItemModel',
        createModelOptions: () => ({
          use: 'FormItemModel',
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
    return (
      <FormItem {...this.props}>
        <FieldModelRenderer model={fieldModel} />
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
  icon: 'CollectionFieldFormItemModel',
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
        ctx.model.setProps({
          name: ctx.model.fieldPath,
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
      uiSchema: (ctx) => {
        const className = ctx.model.getProps().pattern === 'readPretty' ? 'ReadPrettyFieldModel' : 'FormFieldModel';
        const classes = [...ctx.model.collectionField.getSubclassesOf(className).keys()];
        if (classes.length === 1) {
          return null;
        }
        return {
          use: {
            type: 'string',
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            enum: classes.map((model) => ({
              label: model,
              value: model,
            })),
          },
        };
      },
    },
    pattern: {
      title: escapeT('Display mode'),
      uiSchema: (ctx) => {
        return {
          pattern: {
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            enum: [
              {
                value: 'editable',
                label: escapeT('Editable'),
              },
              {
                value: 'disabled',
                label: escapeT('Disabled'),
              },

              {
                value: 'readPretty',
                label: escapeT('Display only'),
              },
            ],
          },
        };
      },
      defaultParams: (ctx) => ({
        pattern: ctx.model.collectionField.readonly ? 'disabled' : 'editable',
      }),
      beforeParamsSave: async (ctx, params, previousParams) => {
        if (params.pattern === 'readPretty') {
          const use =
            ctx.model.collectionField.getFirstSubclassNameOf('ReadPrettyFieldModel') || 'ReadPrettyFieldModel';
          await ctx.engine.replaceModel(ctx.model.subModels['field']['uid'], {
            use: use,
            stepParams: {
              fieldSettings: {
                init: ctx.model.getFieldSettingsInitParams(),
              },
            },
          });
        } else {
          const use = ctx.model.collectionField.getFirstSubclassNameOf('FormFieldModel') || 'FormFieldModel';
          if (previousParams.pattern === 'readPretty') {
            await ctx.engine.replaceModel(ctx.model.subModels['field']['uid'], {
              use: use,
              stepParams: {
                fieldSettings: {
                  init: ctx.model.getFieldSettingsInitParams(),
                },
              },
            });
          }
        }
      },
      async handler(ctx, params) {
        if (params.pattern === 'readPretty') {
          ctx.model.setProps({
            pattern: 'readPretty',
          });
        } else {
          ctx.model.setProps({
            disabled: params.pattern === 'disabled',
          });
        }
      },
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
