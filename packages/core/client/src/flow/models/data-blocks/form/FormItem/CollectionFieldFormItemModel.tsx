/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT } from '@nocobase/flow-engine';
import { omitBy, isUndefined } from 'lodash';
import { customAlphabet as Alphabet } from 'nanoid';
import { FormItemModel } from './FormItemModel';
import { EditFormModel } from '../EditFormModel';

export class CollectionFieldFormItemModel extends FormItemModel {}

CollectionFieldFormItemModel.define({
  icon: 'CollectionFieldFormItemModel',
  defaultOptions: {
    use: 'CollectionFieldFormItemModel',
  },
  sort: 100,
});

CollectionFieldFormItemModel.registerFlow({
  key: 'editItemSettings',
  sort: 300,
  title: escapeT('Form item settings'),
  steps: {
    init: {
      async handler(ctx) {
        await ctx.model.applySubModelsAutoFlows('field');
        const collectionField = ctx.model.collectionField;
        const props = ctx.model.getProps();
        const rules = [...(props.rules || [])];
        const fieldInterface = collectionField.interface;
        if (collectionField) {
          const { type, target } = collectionField;
          ctx.model.setProps(
            omitBy(
              {
                options: collectionField.enum.length ? collectionField.enum : props.options,
                ...collectionField?.getComponentProps?.(),
                mode: collectionField.type === 'array' ? 'multiple' : props.mode,
                multiple: target ? ['belongsToMany', 'hasMany'].includes(type) : props.multiple,
                maxCount: target && !['belongsToMany', 'hasMany'].includes(type) ? 1 : undefined,
              },
              isUndefined,
            ),
          );
        }
        //TODO 最终用 jio 替换验证
        if (fieldInterface === 'email') {
          if (!rules.some((rule) => rule.type === 'email')) {
            rules.push({
              type: 'email',
              message: ctx.t('The field value is not a email format'),
            });
          }
        } else if (fieldInterface === 'json') {
          // 检查是否已经有 JSON 校验规则
          if (!rules.some((rule) => rule.validator && rule.name === 'jsonValidator')) {
            rules.push({
              name: 'jsonValidator',
              validator: (_, value) => {
                if (!value || value.trim() === '') {
                  return Promise.resolve();
                }
                try {
                  JSON.parse(value);
                  return Promise.resolve();
                } catch (err: any) {
                  return Promise.reject(new Error(err.message));
                }
              },
            });
          }
        } else if (fieldInterface === 'nanoid') {
          const { size = 21, customAlphabet } = collectionField.options || {};
          // 绑定校验器
          if (!rules.some((rule) => rule.validator && rule.name === 'nanoidValidator')) {
            rules.push({
              name: 'nanoidValidator',
              validator: (_, value) => {
                if (!value) return Promise.resolve(); // 空值不校验
                if (value.length !== size) {
                  return Promise.reject(new Error(ctx.t('Field value size is') + ` ${size}`));
                }
                if (customAlphabet) {
                  for (let i = 0; i < value.length; i++) {
                    if (!customAlphabet.includes(value[i])) {
                      return Promise.reject(new Error(ctx.t('Field value does not meet the requirements')));
                    }
                  }
                }
                return Promise.resolve();
              },
            });
          }

          // 如果字段值为空且有自定义字母表，生成默认值
          // const value = ctx.model.form.getFieldValue(fieldPath);
          // if (!value && customAlphabet) {
          //   form.setFieldValue(fieldPath, Alphabet(customAlphabet, size)());
          // }
        }
        ctx.model.setProps({
          rules,
          name: ctx.model.fieldPath,
          valuePropName: fieldInterface === 'checkbox' ? 'checked' : 'value',
        });
      },
    },
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
      title: escapeT('Field component'),
      uiSchema: (ctx) => {
        const classes = [...ctx.model.collectionField.getSubclassesOf('FormFieldModel').keys()];
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
      beforeParamsSave: async (ctx, params, previousParams) => {
        if (params.use !== previousParams.use) {
          const model = ctx.model.setSubModel('field', {
            use: params.use,
            stepParams: {
              fieldSettings: {
                init: ctx.model.getFieldSettingsInitParams(),
              },
            },
          });
          await model.applyAutoFlows();
        }
      },
      defaultParams: (ctx) => {
        return {
          use: ctx.model.subModels.field.use,
        };
      },
      async handler(ctx, params) {
        console.log('Sub model step1 handler');
        if (!params.use) {
          throw new Error('model use is a required parameter');
        }
        ctx.model.setProps({ subModel: params.use });
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
      async handler(ctx, params) {
        if (params.pattern === 'readPretty') {
          const use =
            ctx.model.collectionField.getFirstSubclassNameOf('ReadPrettyFieldModel') || 'ReadPrettyFieldModel';
          const model = ctx.model.setSubModel('field', {
            use: use,
            stepParams: {
              fieldSettings: {
                init: ctx.model.getFieldSettingsInitParams(),
              },
            },
          });
          await model.applyAutoFlows();
        } else {
          const { subModel } = ctx.model.getProps();
          if (subModel !== ctx.model.subModels.field.use) {
            const model = ctx.model.setSubModel('field', {
              use: subModel,
              stepParams: {
                fieldSettings: {
                  init: ctx.model.getFieldSettingsInitParams(),
                },
              },
            });
            await model.applyAutoFlows();
          }
          ctx.model.setProps({
            disabled: params.pattern === 'disabled',
          });
        }
      },
    },
  },
});
