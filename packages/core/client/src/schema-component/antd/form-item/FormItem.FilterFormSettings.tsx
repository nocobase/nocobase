import { SchemaSetting } from '../../../application';
import { ArrayCollapse, FormLayout } from '@formily/antd-v5';
import { Field } from '@formily/core';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useFormBlockContext } from '../../../block-provider';
import { useCollection, useCollectionManager } from '../../../collection-manager';
import { useCompile, useDesignable, useFieldModeOptions } from '../../hooks';
import { useOperatorList } from '../filter/useOperators';
import { isFileCollection } from './FormItem';
import { findFilterOperators } from './SchemaSettingOptions';

export const filterFormItemSettings = new SchemaSetting({
  name: 'FilterFormItemSettings',
  items: [
    {
      name: 'editFieldTitle',
      type: 'modal',
      useVisible() {
        const { getCollectionJoinField } = useCollectionManager();
        const { getField } = useCollection();
        const fieldSchema = useFieldSchema();
        const collectionField =
          getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
        return !!collectionField;
      },
      useComponentProps() {
        const { getCollectionJoinField } = useCollectionManager();
        const { getField } = useCollection();
        const field = useField<Field>();
        const fieldSchema = useFieldSchema();
        const { t } = useTranslation();
        const { dn } = useDesignable();
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
            if (title) {
              field.title = title;
              fieldSchema.title = title;
              dn.emit('patch', {
                schema: {
                  'x-uid': fieldSchema['x-uid'],
                  title: fieldSchema.title,
                },
              });
            }
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'editDescription',
      type: 'modal',
      useVisible() {
        const field = useField<Field>();
        return !field.readPretty;
      },
      useComponentProps() {
        const field = useField<Field>();
        const fieldSchema = useFieldSchema();
        const { t } = useTranslation();
        const { dn } = useDesignable();
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
      useVisible() {
        const field = useField<Field>();
        return field.readPretty;
      },
      useComponentProps() {
        const field = useField<Field>();
        const fieldSchema = useFieldSchema();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        return {
          title: t('Edit description'),
          schema: {
            type: 'object',
            title: t('Edit description'),
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
      name: 'validationRules',
      type: 'modal',
      useVisible() {
        const { getInterface, getCollectionJoinField } = useCollectionManager();
        const { getField } = useCollection();
        const { form } = useFormBlockContext();
        const fieldSchema = useFieldSchema();
        const collectionField =
          getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
        const interfaceConfig = getInterface(collectionField?.interface);
        const validateSchema = interfaceConfig?.['validateSchema']?.(fieldSchema);
        return form && !form?.readPretty && validateSchema;
      },
      useComponentProps() {
        const { getInterface, getCollectionJoinField } = useCollectionManager();
        const { getField } = useCollection();
        const field = useField<Field>();
        const fieldSchema = useFieldSchema();
        const { t } = useTranslation();
        const { dn, refresh } = useDesignable();
        const collectionField =
          getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
        const interfaceConfig = getInterface(collectionField?.interface);
        const validateSchema = interfaceConfig?.['validateSchema']?.(fieldSchema);
        return {
          title: t('Set validation rules'),
          components: {
            ArrayCollapse,
            FormLayout,
          },
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
            for (const rule of v.rules) {
              rules.push(_.pickBy(rule, _.identity));
            }
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            // return;
            // if (['number'].includes(collectionField?.interface) && collectionField?.uiSchema?.['x-component-props']?.['stringMode'] === true) {
            //   rules['numberStringMode'] = true;
            // }
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
            fieldSchema['x-validator'] = rules;
            schema['x-validator'] = rules;
            dn.emit('patch', {
              schema,
            });
            refresh();
          },
        };
      },
    },
    {
      name: 'fieldMode',
      type: 'select',
      useVisible() {
        const { getCollectionJoinField } = useCollectionManager();
        const { getField } = useCollection();
        const fieldSchema = useFieldSchema();
        const collectionField =
          getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
        const fieldModeOptions = useFieldModeOptions();
        const isAssociationField = ['belongsTo', 'hasOne', 'hasMany', 'belongsToMany'].includes(collectionField?.type);
        return isAssociationField && !!fieldModeOptions;
      },
      useComponentProps() {
        const { getCollectionJoinField, getCollection } = useCollectionManager();
        const { getField } = useCollection();
        const field = useField<Field>();
        const fieldSchema = useFieldSchema();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        const collectionField =
          getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
        const fieldModeOptions = useFieldModeOptions();
        const targetCollection = getCollection(collectionField?.target);
        const isFileField = isFileCollection(targetCollection as any);
        return {
          title: t('Field component'),
          options: fieldModeOptions,
          value: field?.componentProps?.['mode'] || (isFileField ? 'FileManager' : 'Select'),
          onChange(mode) {
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props']['mode'] = mode;
            schema['x-component-props'] = fieldSchema['x-component-props'];
            field.componentProps = field.componentProps || {};
            field.componentProps.mode = mode;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'operator',
      type: 'select',
      useVisible() {
        const operatorList = useOperatorList();
        return operatorList.length > 0;
      },
      useComponentProps() {
        const compile = useCompile();
        const fieldSchema = useFieldSchema();
        const field = useField<Field>();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        const operatorList = useOperatorList();
        const { operators: storedOperators = {}, uid } = findFilterOperators(fieldSchema);

        if (operatorList.length && !storedOperators[fieldSchema.name]) {
          storedOperators[fieldSchema.name] = operatorList[0].value;
        }
        return {
          title: t('Operator'),
          value: storedOperators[fieldSchema.name],
          options: compile(operatorList),
          onChange(v) {
            storedOperators[fieldSchema.name] = v;
            const operator = operatorList.find((item) => item.value === v);
            const schema: ISchema = {
              ['x-uid']: uid,
              ['x-filter-operators']: storedOperators,
            };

            // 根据操作符的配置，设置组件的属性
            if (operator?.schema?.['x-component']) {
              _.set(fieldSchema, 'x-component-props.component', operator.schema['x-component']);
              _.set(field, 'componentProps.component', operator.schema['x-component']);
              field.reset();
              dn.emit('patch', {
                schema: {
                  ['x-uid']: fieldSchema['x-uid'],
                  ['x-component-props']: {
                    component: operator.schema['x-component'],
                  },
                },
              });
            } else if (fieldSchema['x-component-props']?.component) {
              _.set(fieldSchema, 'x-component-props.component', null);
              _.set(field, 'componentProps.component', null);
              field.reset();
              dn.emit('patch', {
                schema: {
                  ['x-uid']: fieldSchema['x-uid'],
                  ['x-component-props']: {
                    component: null,
                  },
                },
              });
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
      name: 'titleField',
      type: 'select',
      useVisible() {
        const { getCollectionFields, getCollectionJoinField } = useCollectionManager();
        const { getField } = useCollection();
        const fieldSchema = useFieldSchema();
        const compile = useCompile();
        const collectionField =
          getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
        const targetFields = collectionField?.target
          ? getCollectionFields(collectionField?.target)
          : getCollectionFields(collectionField?.targetCollection) ?? [];
        const options = targetFields
          .filter((field) => !field?.target && field.type !== 'boolean')
          .map((field) => ({
            value: field?.name,
            label: compile(field?.uiSchema?.title) || field?.name,
          }));
        return options.length > 0 && fieldSchema['x-component'] === 'CollectionField';
      },
      useComponentProps() {
        const { getCollectionFields, getCollectionJoinField } = useCollectionManager();
        const { getField } = useCollection();
        const field = useField<Field>();
        const fieldSchema = useFieldSchema();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        const compile = useCompile();
        const collectionField =
          getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
        const targetFields = collectionField?.target
          ? getCollectionFields(collectionField?.target)
          : getCollectionFields(collectionField?.targetCollection) ?? [];
        const options = targetFields
          .filter((field) => !field?.target && field.type !== 'boolean')
          .map((field) => ({
            value: field?.name,
            label: compile(field?.uiSchema?.title) || field?.name,
          }));

        return {
          title: t('Title field'),
          options,
          value: field?.componentProps?.fieldNames?.label,
          onChange(label) {
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            const fieldNames = {
              ...collectionField?.uiSchema?.['x-component-props']?.['fieldNames'],
              ...field.componentProps.fieldNames,
              label,
            };
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props']['fieldNames'] = fieldNames;
            schema['x-component-props'] = fieldSchema['x-component-props'];
            field.componentProps.fieldNames = fieldSchema['x-component-props'].fieldNames;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'divider',
      type: 'divider',
      useVisible() {
        const { getCollectionJoinField } = useCollectionManager();
        const { getField } = useCollection();
        const fieldSchema = useFieldSchema();
        const collectionField =
          getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
        return !!collectionField;
      },
    },
    {
      name: 'remove',
      type: 'remove',
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
