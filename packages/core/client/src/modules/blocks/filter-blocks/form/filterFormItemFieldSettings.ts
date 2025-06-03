/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Field } from '@formily/core';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../../../application';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { useCollectionManager_deprecated, useCollection_deprecated } from '../../../../collection-manager';
import { useFieldComponentName } from '../../../../common/useFieldComponentName';
import { fieldComponentSettingsItem } from '../../../../data-source/commonsSettingsItem';
import { EditOperator, useCompile, useDesignable } from '../../../../schema-component';
import { SchemaSettingsDefaultValue } from '../../../../schema-settings/SchemaSettingsDefaultValue';

const fieldComponentNameMap = (name: string) => {
  if (name === 'Select') {
    return 'FilterSelect';
  }
  if (name === 'Picker') {
    return 'FilterPicker';
  }
  return name;
};

export const filterFormItemFieldSettings = new SchemaSettings({
  name: 'fieldSettings:FilterFormItem',
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
      useChildren() {
        return [
          {
            name: 'editFieldTitle',
            type: 'modal',
            useComponentProps() {
              const { t } = useTranslation();
              const { dn } = useDesignable();
              const field = useField<Field>();
              const compile = useCompile();
              const fieldSchema = useFieldSchema();
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
                checked: fieldSchema['x-decorator-props']?.['showTitle'] ?? true,
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
                  dn.refresh();
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
            name: 'setDefaultValue',
            Component: SchemaSettingsDefaultValue,
          } as any,
          // Filter form fields should not support validation rules, as they would cause the filter button to be ineffective
          // {
          //   name: 'setValidationRules',
          //   type: 'modal',
          //   useComponentProps() {
          //     const { t } = useTranslation();
          //     const field = useField<Field>();
          //     const fieldSchema = useFieldSchema();
          //     const { dn, refresh } = useDesignable();
          //     const validateSchema = useValidateSchema();
          //     const { getCollectionJoinField } = useCollectionManager_deprecated();
          //     const { getField } = useCollection_deprecated();
          //     const collectionField =
          //       getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
          //     const customPredicate = (value) => value !== null && value !== undefined && !Number.isNaN(value);

          //     return {
          //       title: t('Set validation rules'),
          //       components: { ArrayCollapse, FormLayout },
          //       schema: {
          //         type: 'object',
          //         title: t('Set validation rules'),
          //         properties: {
          //           rules: {
          //             type: 'array',
          //             default: fieldSchema?.['x-validator'],
          //             'x-component': 'ArrayCollapse',
          //             'x-decorator': 'FormItem',
          //             'x-component-props': {
          //               accordion: true,
          //             },
          //             maxItems: 3,
          //             items: {
          //               type: 'object',
          //               'x-component': 'ArrayCollapse.CollapsePanel',
          //               'x-component-props': {
          //                 header: '{{ t("Validation rule") }}',
          //               },
          //               properties: {
          //                 index: {
          //                   type: 'void',
          //                   'x-component': 'ArrayCollapse.Index',
          //                 },
          //                 layout: {
          //                   type: 'void',
          //                   'x-component': 'FormLayout',
          //                   'x-component-props': {
          //                     labelStyle: {
          //                       marginTop: '6px',
          //                     },
          //                     labelCol: 8,
          //                     wrapperCol: 16,
          //                   },
          //                   properties: {
          //                     ...validateSchema,
          //                     message: {
          //                       type: 'string',
          //                       title: '{{ t("Error message") }}',
          //                       'x-decorator': 'FormItem',
          //                       'x-component': 'Input.TextArea',
          //                       'x-component-props': {
          //                         autoSize: {
          //                           minRows: 2,
          //                           maxRows: 2,
          //                         },
          //                       },
          //                     },
          //                   },
          //                 },
          //                 remove: {
          //                   type: 'void',
          //                   'x-component': 'ArrayCollapse.Remove',
          //                 },
          //                 moveUp: {
          //                   type: 'void',
          //                   'x-component': 'ArrayCollapse.MoveUp',
          //                 },
          //                 moveDown: {
          //                   type: 'void',
          //                   'x-component': 'ArrayCollapse.MoveDown',
          //                 },
          //               },
          //             },
          //             properties: {
          //               add: {
          //                 type: 'void',
          //                 title: '{{ t("Add validation rule") }}',
          //                 'x-component': 'ArrayCollapse.Addition',
          //                 'x-reactions': {
          //                   dependencies: ['rules'],
          //                   fulfill: {
          //                     state: {
          //                       disabled: '{{$deps[0].length >= 3}}',
          //                     },
          //                   },
          //                 },
          //               },
          //             },
          //           },
          //         },
          //       } as ISchema,
          //       onSubmit(v) {
          //         const rules = [];
          //         for (const rule of v.rules) {
          //           rules.push(_.pickBy(rule, customPredicate));
          //         }
          //         const schema = {
          //           ['x-uid']: fieldSchema['x-uid'],
          //         };
          //         if (['percent'].includes(collectionField?.interface)) {
          //           for (const rule of rules) {
          //             if (!!rule.maxValue || !!rule.minValue) {
          //               rule['percentMode'] = true;
          //             }

          //             if (rule.percentFormat) {
          //               rule['percentFormats'] = true;
          //             }
          //           }
          //         }
          //         const concatValidator = _.concat([], collectionField?.uiSchema?.['x-validator'] || [], rules);
          //         field.validator = concatValidator;
          //         field.required = fieldSchema.required as any;
          //         fieldSchema['x-validator'] = rules;
          //         schema['x-validator'] = rules;
          //         dn.emit('patch', {
          //           schema,
          //         });
          //         refresh();
          //       },
          //     };
          //   },
          //   useVisible() {
          //     const validateSchema = useValidateSchema();
          //     return !!validateSchema;
          //   },
          // },
          {
            name: 'operator',
            Component: EditOperator,
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
        const componentSettings = app.schemaSettingsManager.get(
          `fieldSettings:component:${fieldComponentNameMap(fieldComponentName)}`,
        );
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
