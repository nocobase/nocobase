/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { QuestionCircleOutlined } from '@ant-design/icons';
import { ISchema } from '@formily/json-schema';
import { useField, useFieldSchema, useForm } from '@formily/react';
import { Tooltip } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useApp, useSchemaToolbar } from '../../../../application';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { useCollectionManager_deprecated, useCollection_deprecated } from '../../../../collection-manager';
import { useFieldComponentName } from '../../../../common/useFieldComponentName';
import { useCollection } from '../../../../data-source';
import { fieldComponentSettingsItem } from '../../../../data-source/commonsSettingsItem';
import { useFlag } from '../../../../flag-provider/hooks/useFlag';
import { useDesignable } from '../../../../schema-component';
import { useAssociationFieldContext } from '../../../../schema-component/antd/association-field/hooks';
import { useColumnSchema } from '../../../../schema-component/antd/table-v2/Table.Column.Decorator';
import { SchemaSettingsLinkageRules } from '../../../../schema-settings';
import { SchemaSettingsDefaultValue } from '../../../../schema-settings/SchemaSettingsDefaultValue';
import { isPatternDisabled } from '../../../../schema-settings/isPatternDisabled';
import { ArrayCollapse, FormLayout } from '@formily/antd-v5';
import _ from 'lodash';

export const tableColumnSettings = new SchemaSettings({
  name: 'fieldSettings:TableColumn',
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
      children: [
        {
          name: 'customColumnTitle',
          type: 'modal',
          useComponentProps() {
            const { fieldSchema, collectionField } = useColumnSchema();
            const field: any = useField();
            const { t } = useTranslation();
            const columnSchema = useFieldSchema();
            const { dn } = useDesignable();
            return {
              title: t('Custom column title'),
              schema: {
                type: 'object',
                title: t('Custom column title'),
                properties: {
                  title: {
                    title: t('Column title'),
                    default: columnSchema?.title,
                    description: `${t('Original field title: ')}${
                      collectionField?.uiSchema?.title || fieldSchema?.title
                    }`,
                    'x-decorator': 'FormItem',
                    'x-component': 'Input',
                    'x-component-props': {},
                  },
                },
              } as ISchema,
              onSubmit: ({ title }) => {
                field.title = title;
                columnSchema.title = title;
                dn.emit('patch', {
                  schema: {
                    'x-uid': columnSchema['x-uid'],
                    title: columnSchema.title,
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
            const field = useField();
            const columnSchema = useFieldSchema();

            return {
              title: t('Edit tooltip'),
              schema: {
                type: 'object',
                title: t('Edit tooltip'),
                properties: {
                  tooltip: {
                    default: columnSchema?.['x-component-props']?.tooltip || '',
                    'x-decorator': 'FormItem',
                    'x-component': 'Input.TextArea',
                    'x-component-props': {},
                  },
                },
              } as ISchema,
              onSubmit({ tooltip }) {
                field.componentProps.tooltip = tooltip;
                columnSchema['x-component-props'] = columnSchema['x-component-props'] || {};
                columnSchema['x-component-props']['tooltip'] = tooltip;
                dn.emit('patch', {
                  schema: {
                    'x-uid': columnSchema['x-uid'],
                    'x-component-props': columnSchema['x-component-props'],
                  },
                });
              },
            };
          },
        },
        {
          name: 'style',
          Component: (props) => {
            const localProps = { ...props, category: 'style' };
            return <SchemaSettingsLinkageRules {...localProps} />;
          },
          useVisible() {
            const { fieldSchema } = useColumnSchema();
            const { isInSubTable } = useFlag();
            const field: any = useField();

            if (!isInSubTable) {
              return true;
            }

            const path = field.path?.splice(field.path?.length - 1, 1);
            if (fieldSchema) {
              const isReadPretty = field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).get('readPretty');
              return isReadPretty;
            } else return false;
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
        {
          name: 'columnWidth',
          type: 'modal',
          useComponentProps() {
            const field: any = useField();
            const { t } = useTranslation();
            const columnSchema = useFieldSchema();
            const { dn } = useDesignable();

            return {
              title: t('Column width'),
              schema: {
                type: 'object',
                title: t('Column width'),
                properties: {
                  width: {
                    default: columnSchema?.['x-component-props']?.['width'] || 100,
                    'x-decorator': 'FormItem',
                    'x-component': 'InputNumber',
                    'x-component-props': {},
                  },
                },
              } as ISchema,
              onSubmit: ({ width }) => {
                const props = columnSchema['x-component-props'] || {};
                props['width'] = width;
                const schema: ISchema = {
                  ['x-uid']: columnSchema['x-uid'],
                };
                schema['x-component-props'] = props;
                columnSchema['x-component-props'] = props;
                field.componentProps.width = width;
                dn.emit('patch', {
                  schema,
                });
                dn.refresh();
              },
            };
          },
        },
        {
          name: 'sortable',
          type: 'switch',
          useVisible() {
            const collection = useCollection();
            const { collectionField } = useColumnSchema();
            const { getInterface } = useCollectionManager_deprecated();
            const interfaceCfg = getInterface(collectionField?.interface);
            const { currentMode } = useAssociationFieldContext();
            return (
              interfaceCfg?.sortable === true &&
              !currentMode &&
              (collection?.name === collectionField?.collectionName ||
                !collectionField?.collectionName ||
                collectionField?.inherit)
            );
          },
          useComponentProps() {
            const field: any = useField();
            const { t } = useTranslation();
            const columnSchema = useFieldSchema();
            const { dn } = useDesignable();

            return {
              title: t('Sortable'),
              checked: field.componentProps.sorter,
              onChange: (v) => {
                const schema: ISchema = {
                  ['x-uid']: columnSchema['x-uid'],
                };
                columnSchema['x-component-props'] = {
                  ...columnSchema['x-component-props'],
                  sorter: v,
                };
                schema['x-component-props'] = columnSchema['x-component-props'];
                field.componentProps.sorter = v;
                dn.emit('patch', {
                  schema,
                });
                dn.refresh();
              },
            };
          },
        },
        {
          name: 'setDefaultValue',
          useVisible() {
            const { fieldSchema } = useColumnSchema();

            if (!fieldSchema) {
              return false;
            }

            return !fieldSchema?.['x-read-pretty'];
          },
          Component: SchemaSettingsDefaultValue as any,
          useComponentProps() {
            const { fieldSchema } = useColumnSchema();
            return {
              fieldSchema,
            };
          },
        },
        {
          name: 'required',
          type: 'switch',
          useVisible() {
            const { uiSchema, fieldSchema } = useColumnSchema();
            const field: any = useField();

            if (!fieldSchema) {
              return false;
            }

            const isSubTableColumn = ['QuickEdit', 'FormItem'].includes(fieldSchema['x-decorator']);
            return isSubTableColumn && !field.readPretty && !uiSchema?.['x-read-pretty'];
          },
          useComponentProps() {
            const { fieldSchema } = useColumnSchema();
            const field: any = useField();
            const { t } = useTranslation();
            const { dn } = useDesignable();

            return {
              key: 'required',
              title: t('Required'),
              checked: fieldSchema?.required as boolean,
              onChange: (required) => {
                if (!fieldSchema) {
                  return console.error('fieldSchema is required');
                }

                const schema = {
                  ['x-uid']: fieldSchema['x-uid'],
                };
                fieldSchema['required'] = required;
                schema['required'] = required;
                const path = field.path?.splice(field.path?.length - 1, 1);
                field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
                  f.required = required;
                });
                dn.emit('patch', {
                  schema,
                });
                dn.refresh();
              },
            };
          },
        },
        {
          name: 'validationRules',
          type: 'modal',
          useVisible() {
            const { fieldSchema } = useColumnSchema();
            const field: any = useField();

            const { getInterface } = useCollectionManager_deprecated();
            const { getField } = useCollection_deprecated();

            if (!fieldSchema) {
              return false;
            }

            const isSubTableColumn = ['QuickEdit', 'FormItem'].includes(fieldSchema['x-decorator']);
            const collectionField = getField(fieldSchema['name']);
            const interfaceConfig = getInterface(collectionField?.interface);

            const validateSchema = interfaceConfig?.['validateSchema']?.(fieldSchema);

            return isSubTableColumn && !field?.readPretty && !!validateSchema;
          },
          useComponentProps() {
            const { t } = useTranslation();
            const field: any = useField();
            const { fieldSchema } = useColumnSchema();
            const { dn, refresh } = useDesignable();
            const { getInterface } = useCollectionManager_deprecated();
            const { getField } = useCollection_deprecated();
            const collectionField = getField(fieldSchema?.['name']);
            const interfaceConfig = getInterface(collectionField?.interface);
            const validateSchema = interfaceConfig?.['validateSchema']?.(fieldSchema);

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
                        header: '{{ t("Validation rule") }}',
                      },
                      properties: {
                        index: {
                          type: 'void',
                          'x-component': 'ArrayCollapse.Index',
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
                const customPredicate = (value) => value !== null && value !== undefined && !Number.isNaN(value);
                for (const rule of v.rules) {
                  rules.push(_.pickBy(rule, customPredicate));
                }
                const schema = {
                  ['x-uid']: fieldSchema?.['x-uid'],
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
                fieldSchema['x-validator'] = rules;
                schema['x-validator'] = rules;
                const path = field.path?.splice(field.path?.length - 1, 1);
                field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
                  f.validator = concatValidator;
                });

                dn.emit('patch', {
                  schema,
                });
                refresh();
              },
            };
          },
        },
        {
          name: 'pattern',
          type: 'select',
          useVisible() {
            const { fieldSchema, collectionField } = useColumnSchema();
            const field: any = useField();

            if (!fieldSchema) {
              return false;
            }

            const isSubTableColumn = ['QuickEdit', 'FormItem'].includes(fieldSchema['x-decorator']);
            return (
              isSubTableColumn &&
              !field?.readPretty &&
              collectionField?.interface !== 'o2m' &&
              !isPatternDisabled(fieldSchema)
            );
          },
          useComponentProps() {
            const { fieldSchema } = useColumnSchema();
            const field: any = useField();
            const { t } = useTranslation();
            const { dn } = useDesignable();
            let readOnlyMode = 'editable';

            if (!fieldSchema) {
              return console.error('fieldSchema is required') as any;
            }

            if (fieldSchema['x-disabled'] === true) {
              readOnlyMode = 'readonly';
            }
            if (fieldSchema['x-read-pretty'] === true) {
              readOnlyMode = 'read-pretty';
            }

            return {
              key: 'pattern',
              title: t('Pattern'),
              options: [
                { label: t('Editable'), value: 'editable' },
                { label: t('Readonly'), value: 'readonly' },
                { label: t('Easy-reading'), value: 'read-pretty' },
              ],
              value: readOnlyMode,
              onChange: (v) => {
                const schema: ISchema = {
                  ['x-uid']: fieldSchema['x-uid'],
                };
                const path = field.path?.splice(field.path?.length - 1, 1);
                switch (v) {
                  case 'readonly': {
                    fieldSchema['x-read-pretty'] = false;
                    fieldSchema['x-disabled'] = true;
                    schema['x-read-pretty'] = false;
                    schema['x-disabled'] = true;
                    field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
                      f.readonly = true;
                      f.disabled = true;
                    });
                    break;
                  }
                  case 'read-pretty': {
                    fieldSchema['x-read-pretty'] = true;
                    fieldSchema['x-disabled'] = false;
                    schema['x-read-pretty'] = true;
                    schema['x-disabled'] = false;
                    field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
                      f.readPretty = true;
                    });
                    break;
                  }
                  default: {
                    fieldSchema['x-read-pretty'] = false;
                    fieldSchema['x-disabled'] = false;
                    schema['x-read-pretty'] = false;
                    schema['x-disabled'] = false;
                    field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
                      f.readPretty = false;
                      f.disabled + false;
                    });
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
          name: 'fixed',
          type: 'select',
          useComponentProps() {
            const { t } = useTranslation();
            const field = useField();
            const fieldSchema = useFieldSchema();
            const { dn } = useDesignable();
            return {
              title: t('Fixed'),
              options: [
                { label: t('Not fixed'), value: 'none' },
                { label: t('Left fixed'), value: 'left' },
                { label: t('Right fixed'), value: 'right' },
              ],
              value: field.componentProps?.fixed || 'none',
              onChange(fixed) {
                const schema = {
                  ['x-uid']: fieldSchema['x-uid'],
                };
                fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
                fieldSchema['x-component-props']['fixed'] = fixed;
                schema['x-component-props'] = fieldSchema['x-component-props'];
                field.componentProps = field.componentProps || {};
                field.componentProps.fixed = fixed;
                void dn.emit('patch', {
                  schema,
                });
                dn.refresh();
              },
            };
          },
        },
        {
          name: 'hidden',
          type: 'switch',
          useComponentProps() {
            const field: any = useField();
            const { t } = useTranslation();
            const columnSchema = useFieldSchema();
            const { dn } = useDesignable();

            return {
              title: (
                <span>
                  {t('Hide column')}
                  <Tooltip
                    title={t(
                      'In configuration mode, the entire column becomes transparent. In non-configuration mode, the entire column will be hidden. Even if the entire column is hidden, its configured default values and other settings will still take effect.',
                    )}
                  >
                    <QuestionCircleOutlined style={{ marginLeft: 4, opacity: 0.65 }} />
                  </Tooltip>
                </span>
              ),
              checked: field.componentProps.columnHidden,
              onChange: (v) => {
                const schema: ISchema = {
                  ['x-uid']: columnSchema['x-uid'],
                };
                columnSchema['x-component-props'] = {
                  ...columnSchema['x-component-props'],
                  columnHidden: v,
                };
                schema['x-component-props'] = columnSchema['x-component-props'];
                field.componentProps.columnHidden = v;
                dn.emit('patch', {
                  schema,
                });
                dn.refresh();
              },
            };
          },
        },

        fieldComponentSettingsItem,
      ],
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
        const map = {
          Select: 'Select',
          DatePicker: 'DatePicker',
          Nester: 'Nester',
          SubTable: 'SubTable',
          Picker: 'Picker',
          PopoverNester: 'PopoverNester',
          Tag: 'Tag',
        };
        const componentSettings = app.schemaSettingsManager.get(
          `fieldSettings:component:${map[fieldComponentName] || fieldComponentName}`,
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
          removeParentsIfNoChildren: false,
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
