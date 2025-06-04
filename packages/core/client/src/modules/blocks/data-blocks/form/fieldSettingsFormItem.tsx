/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { FormLayout } from '@formily/antd-v5';
import { Field } from '@formily/core';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useApp, useSchemaToolbar } from '../../../../application';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { useFormBlockContext } from '../../../../block-provider/FormBlockProvider';
import { useCollectionManager_deprecated, useCollection_deprecated } from '../../../../collection-manager';
import { useFieldComponentName } from '../../../../common/useFieldComponentName';
import { useCollection } from '../../../../data-source';
import { fieldComponentSettingsItem } from '../../../../data-source/commonsSettingsItem';
import { useCompile, useDesignable, useValidateSchema } from '../../../../schema-component';
import {
  useIsFieldReadPretty,
  useIsFormReadPretty,
} from '../../../../schema-component/antd/form-item/FormItem.Settings';
import { SchemaSettingsLinkageRules, isPatternDisabled } from '../../../../schema-settings';
import { useIsAllowToSetDefaultValue } from '../../../../schema-settings/hooks/useIsAllowToSetDefaultValue';
import { getTempFieldState } from '../../../../schema-settings/LinkageRules/bindLinkageRulesToFiled';
import { ActionType } from '../../../../schema-settings/LinkageRules/type';
import { SchemaSettingsDefaultValue } from '../../../../schema-settings/SchemaSettingsDefaultValue';
import { ArrayCollapse } from '../../../../schema-settings/LinkageRules/components/LinkageHeader';
export const fieldSettingsFormItem = new SchemaSettings({
  name: 'fieldSettings:FormItem',
  items: [
    {
      name: 'decoratorOptions',
      type: 'itemGroup',
      hideIfNoChildren: true,
      useComponentProps() {
        const { t } = useTranslation();
        return {
          title: t('Generic properties'),
        };
      },

      useChildren(): any {
        return [
          {
            name: 'editFieldTitle',
            type: 'modal',
            useComponentProps() {
              const { t } = useTranslation();
              const { dn } = useDesignable();
              const field = useField<Field>();
              const fieldSchema = useFieldSchema();
              const compile = useCompile();
              const { getCollectionJoinField } = useCollectionManager_deprecated();
              const { getField } = useCollection_deprecated();
              const collectionField =
                getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);

              return {
                title: t('Edit field title'),
                schema: {
                  type: 'object',
                  title: t('Edit field title'),
                  properties: {
                    title: {
                      title: t('Field title'),
                      default: field?.title,
                      description: `${t('Original field title: ')}${collectionField?.uiSchema?.title}`,
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                      'x-component-props': {},
                    },
                  },
                } as ISchema,
                onSubmit({ title }) {
                  const result = title.trim() === '' ? collectionField?.uiSchema?.title : title;
                  field.title = compile(result);
                  fieldSchema.title = result;
                  dn.emit('patch', {
                    schema: {
                      'x-uid': fieldSchema['x-uid'],
                      title: fieldSchema.title,
                    },
                  });
                  dn.refresh();
                },
              };
            },
          },
          {
            name: 'displayTitle',
            type: 'switch',
            useComponentProps() {
              const { t } = useTranslation();
              const { dn } = useDesignable();
              const field = useField<Field>();
              const fieldSchema = useFieldSchema();

              return {
                title: t('Display title'),
                checked: field.decoratorProps.showTitle ?? true,
                onChange(checked) {
                  fieldSchema['x-decorator-props'] = fieldSchema['x-decorator-props'] || {};
                  fieldSchema['x-decorator-props']['showTitle'] = checked;
                  field.decoratorProps.showTitle = checked;
                  dn.emit('patch', {
                    schema: {
                      'x-uid': fieldSchema['x-uid'],
                      'x-decorator-props': {
                        ...fieldSchema['x-decorator-props'],
                        showTitle: checked,
                      },
                    },
                  });
                  dn.refresh();
                },
              };
            },
          },
          {
            name: 'editDescription',
            type: 'modal',
            useComponentProps() {
              const { t } = useTranslation();
              const { dn } = useDesignable();
              const field = useField<Field>();
              const fieldSchema = useFieldSchema();

              return {
                title: t('Edit description'),
                schema: {
                  type: 'object',
                  title: t('Edit description'),
                  properties: {
                    description: {
                      // title: t('Description'),
                      default: field?.description,
                      'x-decorator': 'FormItem',
                      'x-component': 'Input.TextArea',
                      'x-component-props': {},
                    },
                  },
                } as ISchema,
                onSubmit({ description }) {
                  field.description = description;
                  fieldSchema.description = description;
                  dn.emit('patch', {
                    schema: {
                      'x-uid': fieldSchema['x-uid'],
                      description: fieldSchema.description,
                    },
                  });
                },
              };
            },
          },
          {
            name: 'editTooltip',
            type: 'modal',
            useComponentProps() {
              const { t } = useTranslation();
              const { dn } = useDesignable();
              const field = useField<Field>();
              const fieldSchema = useFieldSchema();

              return {
                title: t('Edit tooltip'),
                schema: {
                  type: 'object',
                  title: t('Edit tooltip'),
                  properties: {
                    tooltip: {
                      default: fieldSchema?.['x-decorator-props']?.tooltip,
                      'x-decorator': 'FormItem',
                      'x-component': 'Input.TextArea',
                      'x-component-props': {},
                    },
                  },
                } as ISchema,
                onSubmit({ tooltip }) {
                  field.decoratorProps.tooltip = tooltip;
                  fieldSchema['x-decorator-props'] = fieldSchema['x-decorator-props'] || {};
                  fieldSchema['x-decorator-props']['tooltip'] = tooltip;
                  dn.emit('patch', {
                    schema: {
                      'x-uid': fieldSchema['x-uid'],
                      'x-decorator-props': fieldSchema['x-decorator-props'],
                    },
                  });
                  dn.refresh();
                },
              };
            },
          },
          {
            name: 'required',
            type: 'switch',
            useVisible() {
              const field = useField<Field>();
              const fieldSchema = useFieldSchema();
              const { required = true } = useSchemaToolbar();
              return !field.readPretty && fieldSchema['x-component'] !== 'FormField' && required;
            },
            useComponentProps() {
              const { t } = useTranslation();
              const field = useField<Field>();
              const fieldSchema = useFieldSchema();
              const { dn, refresh } = useDesignable();

              return {
                title: t('Required'),
                checked: field.required as boolean,
                onChange(required) {
                  const schema = {
                    ['x-uid']: fieldSchema['x-uid'],
                  };
                  field.required = required;
                  fieldSchema['required'] = required;
                  schema['required'] = required;
                  dn.emit('patch', {
                    schema,
                  });
                  refresh();
                },
              };
            },
          },
          {
            name: 'setDefaultValue',
            useVisible() {
              const { isAllowToSetDefaultValue } = useIsAllowToSetDefaultValue();
              return isAllowToSetDefaultValue();
            },
            Component: SchemaSettingsDefaultValue,
          },
          {
            name: 'pattern',
            type: 'select',
            useVisible() {
              const { form } = useFormBlockContext();
              const fieldSchema = useFieldSchema();
              return form && !form?.readPretty && !isPatternDisabled(fieldSchema);
            },
            useComponentProps() {
              const { t } = useTranslation();
              const field = useField<Field>();
              const fieldSchema = useFieldSchema();
              const { dn } = useDesignable();
              let readOnlyMode = 'editable';
              if (fieldSchema['x-disabled'] === true) {
                readOnlyMode = 'readonly';
              }
              if (fieldSchema['x-read-pretty'] === true) {
                readOnlyMode = 'read-pretty';
              }
              return {
                title: t('Pattern'),
                options: [
                  { label: t('Editable'), value: 'editable' },
                  { label: t('Readonly'), value: 'readonly' },
                  { label: t('Easy-reading'), value: 'read-pretty' },
                ],
                value: readOnlyMode,
                onChange(v) {
                  const schema: ISchema = {
                    ['x-uid']: fieldSchema['x-uid'],
                  };

                  switch (v) {
                    case 'readonly': {
                      fieldSchema['x-read-pretty'] = false;
                      fieldSchema['x-disabled'] = true;
                      schema['x-read-pretty'] = false;
                      schema['x-disabled'] = true;
                      field.readPretty = false;
                      field.disabled = true;
                      _.set(field, 'initStateOfLinkageRules.pattern', getTempFieldState(true, ActionType.ReadOnly));
                      break;
                    }
                    case 'read-pretty': {
                      fieldSchema['x-read-pretty'] = true;
                      fieldSchema['x-disabled'] = false;
                      schema['x-read-pretty'] = true;
                      schema['x-disabled'] = false;
                      field.readPretty = true;
                      _.set(field, 'initStateOfLinkageRules.pattern', getTempFieldState(true, ActionType.ReadPretty));
                      break;
                    }
                    default: {
                      fieldSchema['x-read-pretty'] = false;
                      fieldSchema['x-disabled'] = false;
                      schema['x-read-pretty'] = false;
                      schema['x-disabled'] = false;
                      field.readPretty = false;
                      field.disabled = false;
                      _.set(field, 'initStateOfLinkageRules.pattern', getTempFieldState(true, ActionType.Editable));
                      break;
                    }
                  }

                  dn.emit('patch', {
                    schema,
                  });
                  dn.refresh();
                },
              };
            },
          },
          {
            name: 'setValidationRules',
            type: 'modal',
            useComponentProps() {
              const { t } = useTranslation();
              const field = useField<Field>();
              const fieldSchema = useFieldSchema();
              const { dn, refresh } = useDesignable();
              const validateSchema = useValidateSchema();
              const { getCollectionJoinField } = useCollectionManager_deprecated();
              const { getField } = useCollection_deprecated();
              const collectionField =
                getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
              const customPredicate = (value) => value !== null && value !== undefined && !Number.isNaN(value);
              return {
                title: t('Set validation rules'),
                components: { ArrayCollapse, FormLayout },
                schema: {
                  type: 'object',
                  title: t('Set validation rules'),
                  properties: {
                    rules: {
                      type: 'array',
                      default: fieldSchema?.['x-validator'],
                      'x-component': 'ArrayCollapse',
                      'x-decorator': 'FormItem',
                      'x-component-props': {
                        accordion: true,
                      },
                      maxItems: 3,
                      items: {
                        type: 'object',
                        'x-component': 'ArrayCollapse.CollapsePanel',
                        'x-component-props': {
                          header: t('Validation rule'),
                        },
                        properties: {
                          index: {
                            type: 'void',
                            'x-component': 'ArrayCollapse.Index',
                            'x-component-props': {
                              style: {
                                lineHeight: '28px',
                              },
                            },
                          },
                          layout: {
                            type: 'void',
                            'x-component': 'FormLayout',
                            'x-component-props': {
                              labelStyle: {
                                marginTop: '6px',
                              },
                              labelCol: 8,
                              wrapperCol: 16,
                            },
                            properties: {
                              ...validateSchema,
                              message: {
                                type: 'string',
                                title: '{{ t("Error message") }}',
                                'x-decorator': 'FormItem',
                                'x-component': 'Input.TextArea',
                                'x-component-props': {
                                  autoSize: {
                                    minRows: 2,
                                    maxRows: 2,
                                  },
                                },
                              },
                            },
                          },
                          remove: {
                            type: 'void',
                            'x-component': 'ArrayCollapse.Remove',
                          },
                          moveUp: {
                            type: 'void',
                            'x-component': 'ArrayCollapse.MoveUp',
                          },
                          moveDown: {
                            type: 'void',
                            'x-component': 'ArrayCollapse.MoveDown',
                          },
                        },
                      },
                      properties: {
                        add: {
                          type: 'void',
                          title: '{{ t("Add validation rule") }}',
                          'x-component': 'ArrayCollapse.Addition',
                          'x-reactions': {
                            dependencies: ['rules'],
                            fulfill: {
                              state: {
                                disabled: '{{$deps[0].length >= 3}}',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                } as ISchema,
                onSubmit(v) {
                  const rules = [];
                  for (const rule of v.rules) {
                    rules.push(_.pickBy(rule, customPredicate));
                  }
                  const schema = {
                    ['x-uid']: fieldSchema['x-uid'],
                  };
                  if (['percent'].includes(collectionField?.interface)) {
                    for (const rule of rules) {
                      if (!!rule.maxValue || !!rule.minValue) {
                        rule['percentMode'] = true;
                      }

                      if (rule.percentFormat) {
                        rule['percentFormats'] = true;
                      }
                    }
                  }
                  const concatValidator = _.concat([], collectionField?.uiSchema?.['x-validator'] || [], rules);
                  field.validator = concatValidator;
                  field.required = fieldSchema.required as any;
                  fieldSchema['x-validator'] = rules;
                  schema['x-validator'] = rules;
                  dn.emit('patch', {
                    schema,
                  });
                  refresh();
                },
              };
            },
            useVisible() {
              const { form } = useFormBlockContext();
              const isFormReadPretty = useIsFormReadPretty();
              const validateSchema = useValidateSchema();
              return form && !isFormReadPretty && validateSchema;
            },
          },
          {
            name: 'style',
            Component: (props) => {
              const localProps = { ...props, category: 'style' };
              return <SchemaSettingsLinkageRules {...localProps} />;
            },
            useVisible() {
              const isFieldReadPretty = useIsFieldReadPretty();
              return isFieldReadPretty;
            },
            useComponentProps() {
              const { name } = useCollection();
              const { linkageRulesProps } = useSchemaToolbar();
              return {
                ...linkageRulesProps,
                collectionName: name,
              };
            },
          },
          fieldComponentSettingsItem,
        ];
      },
    },
    {
      name: 'componentOptions',
      type: 'itemGroup',
      hideIfNoChildren: true,
      useComponentProps() {
        const { t } = useTranslation();
        return {
          title: t('Specific properties'),
        };
      },
      useChildren() {
        const app = useApp();
        const fieldComponentName = useFieldComponentName();
        const componentSettings = app.schemaSettingsManager.get(`fieldSettings:component:${fieldComponentName}`);
        return componentSettings?.items || [];
      },
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'delete',
      type: 'remove',
      sort: 100,
      useComponentProps() {
        const { t } = useTranslation();

        return {
          removeParentsIfNoChildren: true,
          confirm: {
            title: t('Delete field'),
          },
          breakRemoveOn: {
            'x-component': 'Grid',
          },
        };
      },
    },
  ],
});
