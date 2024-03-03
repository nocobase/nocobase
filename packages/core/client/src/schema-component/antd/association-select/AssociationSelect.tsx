import { LoadingOutlined } from '@ant-design/icons';
import { ArrayCollapse, ArrayItems, FormLayout } from '@formily/antd-v5';
import { Field } from '@formily/core';
import { ISchema, connect, mapProps, mapReadPretty, useField, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import _ from 'lodash';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useFilterByTk, useFormBlockContext } from '../../../block-provider';
import { useCollection_deprecated, useCollectionManager_deprecated, useSortFields } from '../../../collection-manager';
import { GeneralSchemaItems } from '../../../schema-items';
import {
  SchemaSettingsDivider,
  SchemaSettingsModalItem,
  SchemaSettingsRemove,
  SchemaSettingsSelectItem,
  SchemaSettingsSwitchItem,
} from '../../../schema-settings/SchemaSettings';
import { isPatternDisabled } from '../../../schema-settings/isPatternDisabled';
import { SchemaSettingsDataScope } from '../../../schema-settings/SchemaSettingsDataScope';
import { useIsAllowToSetDefaultValue } from '../../../schema-settings/hooks/useIsAllowToSetDefaultValue';
import { useIsShowMultipleSwitch } from '../../../schema-settings/hooks/useIsShowMultipleSwitch';
import { useCompile, useDesignable, useFieldComponentOptions, useFieldTitle } from '../../hooks';
import { removeNullCondition } from '../filter';
import { RemoteSelect, RemoteSelectProps } from '../remote-select';
import { defaultFieldNames } from '../select';
import { ReadPretty } from './ReadPretty';
import useServiceOptions from './useServiceOptions';
import { GeneralSchemaDesigner } from '../../../schema-settings/GeneralSchemaDesigner';

export type AssociationSelectProps<P = any> = RemoteSelectProps<P> & {
  action?: string;
  multiple?: boolean;
};

const divWrap = (schema: ISchema) => {
  return {
    type: 'void',
    'x-component': 'div',
    properties: {
      [schema.name || uid()]: schema,
    },
  };
};

const InternalAssociationSelect = connect(
  (props: AssociationSelectProps) => {
    const { fieldNames, objectValue = true } = props;
    const service = useServiceOptions(props);
    useFieldTitle();

    const normalizeValues = useCallback(
      (obj) => {
        if (!objectValue && typeof obj === 'object') {
          return obj[fieldNames.value];
        }
        return obj;
      },
      [objectValue, fieldNames.value],
    );

    const value = useMemo(() => {
      if (props.value === undefined || props.value === null) {
        return;
      }

      if (Array.isArray(props.value)) {
        return props.value.map(normalizeValues);
      } else {
        return normalizeValues(props.value);
      }
    }, [props.value, normalizeValues]);

    return <RemoteSelect {...props} objectValue={objectValue} value={value} service={service}></RemoteSelect>;
  },
  mapProps(
    {
      dataSource: 'options',
      loading: true,
    },
    (props, field) => {
      return {
        ...props,
        fieldNames: { ...defaultFieldNames, ...props.fieldNames, ...field.componentProps.fieldNames },
        suffixIcon: field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffixIcon,
      };
    },
  ),
  mapReadPretty(ReadPretty),
);

interface AssociationSelectInterface {
  (props: any): React.ReactElement;
  Designer: React.FC;
  FilterDesigner: React.FC;
}

export const AssociationSelect = InternalAssociationSelect as unknown as AssociationSelectInterface;

AssociationSelect.Designer = function Designer() {
  const { getCollectionFields, getInterface, getCollectionJoinField, getCollection, isTitleField } =
    useCollectionManager_deprecated();
  const { getField } = useCollection_deprecated();
  const { form } = useFormBlockContext();
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const tk = useFilterByTk();
  const { dn, refresh, insertAdjacent } = useDesignable();
  const compile = useCompile();
  const IsShowMultipleSwitch = useIsShowMultipleSwitch();
  const { isAllowToSetDefaultValue } = useIsAllowToSetDefaultValue();

  const collectionField = getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
  const fieldComponentOptions = useFieldComponentOptions();
  const isSubFormAssociationField = field.address.segments.includes('__form_grid');
  const interfaceConfig = getInterface(collectionField?.interface);
  const validateSchema = interfaceConfig?.['validateSchema']?.(fieldSchema);
  const originalTitle = collectionField?.uiSchema?.title;
  const targetFields = collectionField?.target ? getCollectionFields(collectionField?.target) : [];
  const initialValue = {
    title: field.title === originalTitle ? undefined : field.title,
  };
  const sortFields = useSortFields(collectionField?.target);

  const defaultSort = field.componentProps?.service?.params?.sort || [];

  // TODO: 这里 fieldSchema['x-read-pretty'] 的值为 true，但是 field.readPretty 的值却为 false，不知道什么原因
  useEffect(() => {
    // 没有这一步判断会出现禁用状态失效的情况
    if (field.readPretty !== fieldSchema['x-read-pretty']) {
      field.readPretty = !!fieldSchema['x-read-pretty'];
    }
  }, [fieldSchema['x-read-pretty']]);

  const sort = defaultSort?.map((item: string) => {
    return item.startsWith('-')
      ? {
          field: item.substring(1),
          direction: 'desc',
        }
      : {
          field: item,
          direction: 'asc',
        };
  });
  if (!field.readPretty) {
    initialValue['required'] = field.required;
  }

  const options = targetFields
    .filter((field) => isTitleField(field))
    .map((field) => ({
      value: field?.name,
      label: compile(field?.uiSchema?.title) || field?.name,
    }));

  let readOnlyMode = 'editable';
  if (fieldSchema['x-disabled'] === true) {
    readOnlyMode = 'readonly';
  }
  if (fieldSchema['x-read-pretty'] === true) {
    readOnlyMode = 'read-pretty';
  }

  const fieldSchemaWithoutRequired = _.omit(fieldSchema, 'required');

  return (
    <GeneralSchemaDesigner>
      <GeneralSchemaItems />
      {form && !form?.readPretty && validateSchema && (
        <SchemaSettingsModalItem
          title={t('Set validation rules')}
          components={{ ArrayCollapse, FormLayout }}
          schema={
            {
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
            } as ISchema
          }
          onSubmit={(v) => {
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
          }}
        />
      )}
      {isAllowToSetDefaultValue() && (
        <SchemaSettingsModalItem
          title={t('Set default value')}
          components={{ ArrayCollapse, FormLayout }}
          width={800}
          schema={
            {
              type: 'object',
              title: t('Set default value'),
              properties: {
                default: {
                  ...(fieldSchemaWithoutRequired || {}),
                  'x-decorator': 'FormItem',
                  'x-component-props': {
                    ...fieldSchemaWithoutRequired['x-component-props'],
                    component: collectionField?.target ? 'AssociationSelect' : undefined,
                    service: {
                      resource: collectionField?.target,
                    },
                  },
                  name: 'default',
                  title: t('Default value'),
                  default: fieldSchema.default || collectionField?.defaultValue,
                  'x-read-pretty': false,
                  'x-disabled': false,
                },
              },
            } as ISchema
          }
          onSubmit={(v) => {
            const schema: ISchema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            if (field.value !== v.default) {
              field.value = v.default;
            }
            fieldSchema.default = v.default;
            schema.default = v.default;
            dn.emit('patch', {
              schema,
            });
            refresh();
          }}
        />
      )}
      {form && !isSubFormAssociationField && fieldComponentOptions && (
        <SchemaSettingsSelectItem
          title={t('Field component')}
          options={fieldComponentOptions}
          value={fieldSchema['x-component']}
          onChange={(type) => {
            const schema: ISchema = {
              name: collectionField?.name,
              type: 'void',
              required: fieldSchema['required'],
              description: fieldSchema['description'],
              default: fieldSchema['default'],
              'x-decorator': 'FormItem',
              // 'x-designer': 'FormItem.Designer',
              'x-toolbar': 'FormItemSchemaToolbar',
              'x-settings': 'fieldSettings:FormItem',
              'x-component': type,
              'x-validator': fieldSchema['x-validator'],
              'x-collection-field': fieldSchema['x-collection-field'],
              'x-decorator-props': fieldSchema['x-decorator-props'],
              'x-component-props': {
                ...collectionField?.uiSchema?.['x-component-props'],
                ...fieldSchema['x-component-props'],
              },
            };

            interfaceConfig?.schemaInitialize?.(schema, {
              field: collectionField,
              block: 'Form',
              readPretty: field.readPretty,
              action: tk ? 'get' : null,
              targetCollection: getCollection(collectionField?.target),
            });

            if (type === 'CollectionField') {
              schema['type'] = 'string';
            }

            insertAdjacent('beforeBegin', divWrap(schema), {
              onSuccess: () => {
                dn.remove(null, {
                  removeParentsIfNoChildren: true,
                  breakRemoveOn: {
                    'x-component': 'Grid',
                  },
                });
              },
            });
          }}
        />
      )}
      {IsShowMultipleSwitch() ? (
        <SchemaSettingsSwitchItem
          key="multiple"
          title={t('Allow multiple')}
          checked={
            fieldSchema['x-component-props']?.multiple === undefined ? true : fieldSchema['x-component-props'].multiple
          }
          onChange={(value) => {
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            field.componentProps = field.componentProps || {};

            fieldSchema['x-component-props'].multiple = value;
            field.componentProps.multiple = value;

            schema['x-component-props'] = fieldSchema['x-component-props'];
            dn.emit('patch', {
              schema,
            });
            refresh();
          }}
        />
      ) : null}
      <SchemaSettingsDataScope
        collectionName={collectionField?.target}
        defaultFilter={field.componentProps?.service?.params?.filter || {}}
        form={form}
        onSubmit={({ filter }) => {
          filter = removeNullCondition(filter);
          _.set(field.componentProps, 'service.params.filter', filter);
          fieldSchema['x-component-props'] = field.componentProps;
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-component-props': field.componentProps,
            },
          });
        }}
      />
      <SchemaSettingsModalItem
        title={t('Set default sorting rules')}
        components={{ ArrayItems }}
        schema={
          {
            type: 'object',
            title: t('Set default sorting rules'),
            properties: {
              sort: {
                type: 'array',
                default: sort,
                'x-component': 'ArrayItems',
                'x-decorator': 'FormItem',
                items: {
                  type: 'object',
                  properties: {
                    space: {
                      type: 'void',
                      'x-component': 'Space',
                      properties: {
                        sort: {
                          type: 'void',
                          'x-decorator': 'FormItem',
                          'x-component': 'ArrayItems.SortHandle',
                        },
                        field: {
                          type: 'string',
                          enum: sortFields,
                          'x-decorator': 'FormItem',
                          'x-component': 'Select',
                          'x-component-props': {
                            style: {
                              width: 260,
                            },
                          },
                        },
                        direction: {
                          type: 'string',
                          'x-decorator': 'FormItem',
                          'x-component': 'Radio.Group',
                          'x-component-props': {
                            optionType: 'button',
                          },
                          enum: [
                            {
                              label: t('ASC'),
                              value: 'asc',
                            },
                            {
                              label: t('DESC'),
                              value: 'desc',
                            },
                          ],
                        },
                        remove: {
                          type: 'void',
                          'x-decorator': 'FormItem',
                          'x-component': 'ArrayItems.Remove',
                        },
                      },
                    },
                  },
                },
                properties: {
                  add: {
                    type: 'void',
                    title: t('Add sort field'),
                    'x-component': 'ArrayItems.Addition',
                  },
                },
              },
            },
          } as ISchema
        }
        onSubmit={({ sort }) => {
          const sortArr = sort.map((item) => {
            return item.direction === 'desc' ? `-${item.field}` : item.field;
          });

          _.set(field.componentProps, 'service.params.sort', sortArr);
          fieldSchema['x-component-props'] = field.componentProps;
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-component-props': field.componentProps,
            },
          });
        }}
      />
      {form && !form?.readPretty && !isPatternDisabled(fieldSchema) && (
        <SchemaSettingsSelectItem
          key="pattern"
          title={t('Pattern')}
          options={[
            { label: t('Editable'), value: 'editable' },
            { label: t('Readonly'), value: 'readonly' },
            { label: t('Easy-reading'), value: 'read-pretty' },
          ]}
          value={readOnlyMode}
          onChange={(v) => {
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
                break;
              }
              case 'read-pretty': {
                fieldSchema['x-read-pretty'] = true;
                fieldSchema['x-disabled'] = false;
                schema['x-read-pretty'] = true;
                schema['x-disabled'] = false;
                field.readPretty = true;
                break;
              }
              default: {
                fieldSchema['x-read-pretty'] = false;
                fieldSchema['x-disabled'] = false;
                schema['x-read-pretty'] = false;
                schema['x-disabled'] = false;
                field.readPretty = false;
                field.disabled = false;
                break;
              }
            }

            dn.emit('patch', {
              schema,
            });

            dn.refresh();
          }}
        />
      )}
      {collectionField?.target && ['CollectionField', 'AssociationSelect'].includes(fieldSchema['x-component']) && (
        <SchemaSettingsSelectItem
          key="title-field"
          title={t('Title field')}
          options={options}
          value={field?.componentProps?.fieldNames?.label}
          onChange={(label) => {
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            const fieldNames = {
              ...collectionField?.uiSchema?.['x-component-props']?.['fieldNames'],
              ...field.componentProps.fieldNames,
              label,
            };
            field.componentProps.fieldNames = fieldNames;
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props']['fieldNames'] = fieldNames;
            schema['x-component-props'] = fieldSchema['x-component-props'];
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          }}
        />
      )}
      {collectionField && <SchemaSettingsDivider />}
      <SchemaSettingsRemove
        key="remove"
        removeParentsIfNoChildren
        confirm={{
          title: t('Delete field'),
        }}
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};

/**
 * 用于筛选表单区块
 * @returns
 */
AssociationSelect.FilterDesigner = function FilterDesigner() {
  const { getCollectionFields, getInterface, getCollectionJoinField } = useCollectionManager_deprecated();
  const { getField } = useCollection_deprecated();
  const { form } = useFormBlockContext();
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const { dn, refresh } = useDesignable();
  const compile = useCompile();
  const collectionField = getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
  const interfaceConfig = getInterface(collectionField?.interface);
  const validateSchema = interfaceConfig?.['validateSchema']?.(fieldSchema);
  const originalTitle = collectionField?.uiSchema?.title;
  const targetFields = collectionField?.target ? getCollectionFields(collectionField?.target) : [];
  const initialValue = {
    title: field.title === originalTitle ? undefined : field.title,
  };
  const sortFields = useSortFields(collectionField?.target);

  const defaultSort = field.componentProps?.service?.params?.sort || [];

  const sort = defaultSort?.map((item: string) => {
    return item.startsWith('-')
      ? {
          field: item.substring(1),
          direction: 'desc',
        }
      : {
          field: item,
          direction: 'asc',
        };
  });
  if (!field.readPretty) {
    initialValue['required'] = field.required;
  }

  const options = targetFields
    .filter((field) => !field?.target && field.type !== 'boolean')
    .map((field) => ({
      value: field?.name,
      label: compile(field?.uiSchema?.title) || field?.name,
    }));

  let readOnlyMode = 'editable';
  if (fieldSchema['x-disabled'] === true) {
    readOnlyMode = 'readonly';
  }
  if (fieldSchema['x-read-pretty'] === true) {
    readOnlyMode = 'read-pretty';
  }

  return (
    <GeneralSchemaDesigner>
      <GeneralSchemaItems required={false} />
      {form && !form?.readPretty && validateSchema && (
        <SchemaSettingsModalItem
          title={t('Set validation rules')}
          components={{ ArrayCollapse, FormLayout }}
          schema={
            {
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
            } as ISchema
          }
          onSubmit={(v) => {
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
          }}
        />
      )}
      {form && !form?.readPretty && collectionField?.uiSchema?.type && (
        <SchemaSettingsModalItem
          title={t('Set default value')}
          components={{ ArrayCollapse, FormLayout }}
          schema={
            {
              type: 'object',
              title: t('Set default value'),
              properties: {
                default: {
                  ..._.omit(collectionField?.uiSchema, 'required'),
                  name: 'default',
                  title: t('Default value'),
                  'x-decorator': 'FormItem',
                  default: fieldSchema.default || collectionField?.defaultValue,
                },
              },
            } as ISchema
          }
          onSubmit={(v) => {
            const schema: ISchema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            if (field.value !== v.default) {
              field.value = v.default;
            }
            fieldSchema.default = v.default;
            schema.default = v.default;
            dn.emit('patch', {
              schema,
            });
            refresh();
          }}
        />
      )}
      <SchemaSettingsDataScope
        collectionName={collectionField?.target}
        defaultFilter={field.componentProps?.service?.params?.filter || {}}
        form={form}
        onSubmit={({ filter }) => {
          filter = removeNullCondition(filter);
          _.set(field.componentProps, 'service.params.filter', filter);
          fieldSchema['x-component-props'] = field.componentProps;
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-component-props': field.componentProps,
            },
          });
        }}
      />
      <SchemaSettingsModalItem
        title={t('Set default sorting rules')}
        components={{ ArrayItems }}
        schema={
          {
            type: 'object',
            title: t('Set default sorting rules'),
            properties: {
              sort: {
                type: 'array',
                default: sort,
                'x-component': 'ArrayItems',
                'x-decorator': 'FormItem',
                items: {
                  type: 'object',
                  properties: {
                    space: {
                      type: 'void',
                      'x-component': 'Space',
                      properties: {
                        sort: {
                          type: 'void',
                          'x-decorator': 'FormItem',
                          'x-component': 'ArrayItems.SortHandle',
                        },
                        field: {
                          type: 'string',
                          enum: sortFields,
                          'x-decorator': 'FormItem',
                          'x-component': 'Select',
                          'x-component-props': {
                            style: {
                              width: 260,
                            },
                          },
                        },
                        direction: {
                          type: 'string',
                          'x-decorator': 'FormItem',
                          'x-component': 'Radio.Group',
                          'x-component-props': {
                            optionType: 'button',
                          },
                          enum: [
                            {
                              label: t('ASC'),
                              value: 'asc',
                            },
                            {
                              label: t('DESC'),
                              value: 'desc',
                            },
                          ],
                        },
                        remove: {
                          type: 'void',
                          'x-decorator': 'FormItem',
                          'x-component': 'ArrayItems.Remove',
                        },
                      },
                    },
                  },
                },
                properties: {
                  add: {
                    type: 'void',
                    title: t('Add sort field'),
                    'x-component': 'ArrayItems.Addition',
                  },
                },
              },
            },
          } as ISchema
        }
        onSubmit={({ sort }) => {
          const sortArr = sort.map((item) => {
            return item.direction === 'desc' ? `-${item.field}` : item.field;
          });

          _.set(field.componentProps, 'service.params.sort', sortArr);
          fieldSchema['x-component-props'] = field.componentProps;
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-component-props': field.componentProps,
            },
          });
        }}
      />
      {collectionField?.target && ['CollectionField', 'AssociationSelect'].includes(fieldSchema['x-component']) && (
        <SchemaSettingsSelectItem
          key="title-field"
          title={t('Title field')}
          options={options}
          value={field?.componentProps?.fieldNames?.label}
          onChange={(label) => {
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            const fieldNames = {
              ...collectionField?.uiSchema?.['x-component-props']?.['fieldNames'],
              ...field.componentProps.fieldNames,
              label,
            };
            field.componentProps.fieldNames = fieldNames;
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props']['fieldNames'] = fieldNames;
            schema['x-component-props'] = fieldSchema['x-component-props'];
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          }}
        />
      )}
      {collectionField && <SchemaSettingsDivider />}
      <SchemaSettingsRemove
        key="remove"
        removeParentsIfNoChildren
        confirm={{
          title: t('Delete field'),
        }}
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};

export default AssociationSelect;
