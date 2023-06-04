import { css, cx } from '@emotion/css';
import { ArrayCollapse, ArrayItems, FormLayout, FormItem as Item } from '@formily/antd';
import { Field } from '@formily/core';
import { ISchema, Schema, observer, useField, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import { Select } from 'antd';
import _ from 'lodash';
import moment from 'moment';
import React, { useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ACLCollectionFieldProvider } from '../../../acl/ACLProvider';
import { BlockRequestContext, useFormBlockContext } from '../../../block-provider';
import {
  Collection,
  CollectionFieldOptions,
  useCollection,
  useCollectionFilterOptions,
  useCollectionManager,
  useSortFields,
} from '../../../collection-manager';
import { isTitleField } from '../../../collection-manager/Configuration/CollectionFields';
import { GeneralSchemaItems } from '../../../schema-items/GeneralSchemaItems';
import { GeneralSchemaDesigner, SchemaSettings, isPatternDisabled, isShowDefaultValue } from '../../../schema-settings';
import { VariableInput } from '../../../schema-settings/VariableInput/VariableInput';
import { useIsShowMultipleSwitch } from '../../../schema-settings/hooks/useIsShowMultipleSwitch';
import { isVariable, parseVariables, useVariablesCtx } from '../../common/utils/uitls';
import { SchemaComponent } from '../../core';
import { useCompile, useDesignable, useFieldModeOptions } from '../../hooks';
import { BlockItem } from '../block-item';
import { removeNullCondition } from '../filter';
import { HTMLEncode } from '../input/shared';
import { FilterDynamicComponent } from '../table-v2/FilterDynamicComponent';
import { isInvariable } from '../variable';
import { FilterFormDesigner } from './FormItem.FilterFormDesigner';
import { useEnsureOperatorsValid } from './SchemaSettingOptions';

const defaultInputStyle = css`
  & > .nb-form-item {
    flex: 1;
  }
`;

const divWrap = (schema: ISchema) => {
  return {
    type: 'void',
    'x-component': 'div',
    'x-component-props': {
      className: 'nb-block-wrap',
    },
    properties: {
      [schema.name || uid()]: schema,
    },
  };
};

export const FormItem: any = observer((props: any) => {
  useEnsureOperatorsValid();

  const field = useField<Field>();
  const ctx = useContext(BlockRequestContext);
  const schema = useFieldSchema();
  const variablesCtx = useVariablesCtx();

  useEffect(() => {
    if (ctx?.block === 'form') {
      ctx.field.data = ctx.field.data || {};
      ctx.field.data.activeFields = ctx.field.data.activeFields || new Set();
      ctx.field.data.activeFields.add(schema.name);
      // 如果默认值是一个变量，则需要解析之后再显示出来
      if (isVariable(schema?.default)) {
        field.setInitialValue?.(parseVariables(schema.default, variablesCtx));
      }
    }
  }, []);
  const showTitle = schema['x-decorator-props']?.showTitle ?? true;
  return (
    <ACLCollectionFieldProvider>
      <BlockItem className={'nb-form-item'}>
        <Item
          className={cx(
            css`
              & .ant-space {
                flex-wrap: wrap;
              }
            `,
            {
              [css`
                > .ant-formily-item-label {
                  display: none;
                }
              `]: showTitle === false,
            },
          )}
          {...props}
          extra={
            typeof field.description === 'string' ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: HTMLEncode(field.description).split('\n').join('<br/>'),
                }}
              />
            ) : (
              field.description
            )
          }
        />
      </BlockItem>
    </ACLCollectionFieldProvider>
  );
});

FormItem.Designer = function Designer() {
  const { getCollectionFields, getInterface, getCollectionJoinField, getCollection } = useCollectionManager();
  const { getField } = useCollection();
  const { form } = useFormBlockContext();
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const { dn, refresh, insertAdjacent } = useDesignable();
  const compile = useCompile();
  const variablesCtx = useVariablesCtx();
  const IsShowMultipleSwitch = useIsShowMultipleSwitch();

  const collectionField = getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
  const targetCollection = getCollection(collectionField?.target);
  const interfaceConfig = getInterface(collectionField?.interface);
  const validateSchema = interfaceConfig?.['validateSchema']?.(fieldSchema);
  const originalTitle = collectionField?.uiSchema?.title;
  const targetFields = collectionField?.target
    ? getCollectionFields(collectionField?.target)
    : getCollectionFields(collectionField?.targetCollection) ?? [];
  const fieldModeOptions = useFieldModeOptions();
  const isAssociationField = ['obo', 'oho', 'o2o', 'o2m', 'm2m', 'm2o'].includes(collectionField?.interface);
  const isTableField = fieldSchema['x-component'] === 'TableField';
  const isFileField = isFileCollection(targetCollection);
  const initialValue = {
    title: field.title === originalTitle ? undefined : field.title,
  };
  if (!field.readPretty) {
    initialValue['required'] = field.required;
  }
  const options = targetFields
    .filter((field) => {
      return isTitleField(field);
    })
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
  const dataSource = useCollectionFilterOptions(collectionField?.target);
  const defaultFilter = field.componentProps?.service?.params?.filter || {};
  const sortFields = useSortFields(collectionField?.target);
  const defaultSort = field.componentProps?.service?.params?.sort || [];
  const fieldMode = field?.componentProps?.['mode'] || (isFileField ? 'FileManager' : 'Select');
  const isSelectFieldMode = isAssociationField && fieldMode === 'Select';
  const sort = defaultSort?.map((item: string) => {
    return item?.startsWith('-')
      ? {
          field: item.substring(1),
          direction: 'desc',
        }
      : {
          field: item,
          direction: 'asc',
        };
  });

  const fieldSchemaWithoutRequired = _.omit(fieldSchema, 'required');

  const isSubFormMode = fieldSchema['x-component-props']?.mode === 'Nester';
  const isPickerMode = fieldSchema['x-component-props']?.mode === 'Picker';
  const showFieldMode = isAssociationField && fieldModeOptions && !isTableField;
  const showModeSelect = showFieldMode && isPickerMode;
  return (
    <GeneralSchemaDesigner>
      <GeneralSchemaItems />
      {!form?.readPretty && isFileField ? (
        <SchemaSettings.SwitchItem
          key="quick-upload"
          title={t('Quick upload')}
          checked={fieldSchema['x-component-props']?.quickUpload !== (false as boolean)}
          onChange={(value) => {
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            field.componentProps.quickUpload = value;
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props'].quickUpload = value;
            schema['x-component-props'] = fieldSchema['x-component-props'];
            dn.emit('patch', {
              schema,
            });
            refresh();
          }}
        />
      ) : null}
      {!form?.readPretty && isFileField ? (
        <SchemaSettings.SwitchItem
          key="select-file"
          title={t('Select file')}
          checked={fieldSchema['x-component-props']?.selectFile !== (false as boolean)}
          onChange={(value) => {
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            field.componentProps.selectFile = value;
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props'].selectFile = value;
            schema['x-component-props'] = fieldSchema['x-component-props'];
            dn.emit('patch', {
              schema,
            });
            refresh();
          }}
        />
      ) : null}
      {form && !form?.readPretty && validateSchema && (
        <SchemaSettings.ModalItem
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
      {form &&
        !form?.readPretty &&
        isShowDefaultValue(collectionField, getInterface) &&
        !isPatternDisabled(fieldSchema) && (
          <SchemaSettings.ModalItem
            title={t('Set default value')}
            components={{ ArrayCollapse, FormLayout, VariableInput }}
            width={800}
            schema={
              {
                type: 'object',
                title: t('Set default value'),
                properties: {
                  default: isInvariable(interfaceConfig)
                    ? {
                        ...(fieldSchemaWithoutRequired || {}),
                        'x-decorator': 'FormItem',
                        'x-component-props': {
                          ...fieldSchema['x-component-props'],
                          component:
                            collectionField?.target && collectionField?.interface !== 'chinaRegion'
                              ? 'AssociationSelect'
                              : undefined,
                          service: {
                            resource: collectionField?.target,
                          },
                          style: {
                            width: '100%',
                            verticalAlign: 'top',
                          },
                        },
                        name: 'default',
                        title: t('Default value'),
                        default: getFieldDefaultValue(fieldSchema, collectionField),
                        'x-read-pretty': false,
                        'x-disabled': false,
                      }
                    : {
                        ...(fieldSchemaWithoutRequired || {}),
                        'x-decorator': 'FormItem',
                        'x-component': 'VariableInput',
                        'x-component-props': {
                          ...(fieldSchema?.['x-component-props'] || {}),
                          collectionName: collectionField?.collectionName,
                          schema: collectionField?.uiSchema,
                          className: defaultInputStyle,
                          renderSchemaComponent: function Com(props) {
                            const s = _.cloneDeep(fieldSchemaWithoutRequired) || ({} as Schema);
                            s.title = '';
                            s['x-read-pretty'] = false;
                            s['x-disabled'] = false;

                            return (
                              <SchemaComponent
                                schema={{
                                  ...(s || {}),
                                  'x-component-props': {
                                    ...s['x-component-props'],
                                    onChange: props.onChange,
                                    value: props.value,
                                    defaultValue: getFieldDefaultValue(s, collectionField),
                                    style: {
                                      width: '100%',
                                      verticalAlign: 'top',
                                    },
                                  },
                                }}
                              />
                            );
                          },
                        },
                        name: 'default',
                        title: t('Default value'),
                        default: getFieldDefaultValue(fieldSchema, collectionField),
                      },
                },
              } as ISchema
            }
            onSubmit={(v) => {
              const schema: ISchema = {
                ['x-uid']: fieldSchema['x-uid'],
              };
              if (field.value !== v.default) {
                field.value = parseVariables(v.default, variablesCtx);
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
      {isSelectFieldMode && !field.readPretty && (
        <SchemaSettings.ModalItem
          title={t('Set the data scope')}
          schema={
            {
              type: 'object',
              title: t('Set the data scope'),
              properties: {
                filter: {
                  default: defaultFilter,
                  // title: '数据范围',
                  enum: dataSource,
                  'x-component': 'Filter',
                  'x-component-props': {
                    dynamicComponent: (props) => FilterDynamicComponent({ ...props }),
                  },
                },
              },
            } as ISchema
          }
          onSubmit={({ filter }) => {
            filter = removeNullCondition(filter);
            _.set(field.componentProps, 'service.params.filter', filter);
            fieldSchema['x-component-props'] = field.componentProps;
            field.componentProps = field.componentProps;
            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                'x-component-props': field.componentProps,
              },
            });
          }}
        />
      )}
      {isSelectFieldMode && !field.readPretty && (
        <SchemaSettings.ModalItem
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
                            required: true,
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
      )}
      {showFieldMode && (
        <SchemaSettings.SelectItem
          key="field-mode"
          title={t('Field mode')}
          options={fieldModeOptions}
          value={fieldMode}
          onChange={(mode) => {
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props']['mode'] = mode;
            schema['x-component-props'] = fieldSchema['x-component-props'];
            field.componentProps = field.componentProps || {};
            field.componentProps.mode = mode;
            // if (mode === 'Nester') {
            //   const initValue = ['hasMany', 'belongsToMany'].includes(collectionField?.type) ? [{}] : {};
            //   field.value = field.value || initValue;
            // }
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          }}
        />
      )}
      {showModeSelect && (
        <SchemaSettings.Item>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
            {t('Popup size')}
            <Select
              bordered={false}
              options={[
                { label: t('Small'), value: 'small' },
                { label: t('Middle'), value: 'middle' },
                { label: t('Large'), value: 'large' },
              ]}
              value={
                fieldSchema?.['x-component-props']?.['openSize'] ??
                (fieldSchema?.['x-component-props']?.['openMode'] == 'modal' ? 'large' : 'middle')
              }
              onChange={(value) => {
                field.componentProps.openSize = value;
                fieldSchema['x-component-props'] = field.componentProps;
                dn.emit('patch', {
                  schema: {
                    'x-uid': fieldSchema['x-uid'],
                    'x-component-props': fieldSchema['x-component-props'],
                  },
                });
                dn.refresh();
              }}
              style={{ textAlign: 'right', minWidth: 100 }}
            />
          </div>
        </SchemaSettings.Item>
      )}
      {!field.readPretty && isAssociationField && ['Select', 'Picker'].includes(fieldMode) && (
        <SchemaSettings.SwitchItem
          key="allowAddNew"
          title={t('Allow add new data')}
          checked={fieldSchema['x-add-new'] as boolean}
          onChange={(allowAddNew) => {
            const hasAddNew = fieldSchema.reduceProperties((buf, schema) => {
              if (schema['x-component'] === 'Action') {
                return schema;
              }
              return buf;
            }, null);

            if (!hasAddNew) {
              const addNewActionschema = {
                'x-action': 'create',
                title: "{{t('Add new')}}",
                'x-designer': 'Action.Designer',
                'x-component': 'Action',
                'x-decorator': 'ACLActionProvider',
                'x-component-props': {
                  openMode: 'drawer',
                  type: 'default',
                  component: 'CreateRecordAction',
                },
              };
              insertAdjacent('afterBegin', addNewActionschema);
            }
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            field['x-add-new'] = allowAddNew;
            fieldSchema['x-add-new'] = allowAddNew;
            schema['x-add-new'] = allowAddNew;
            dn.emit('patch', {
              schema,
            });
            refresh();
          }}
        />
      )}
      {isAssociationField && IsShowMultipleSwitch() ? (
        <SchemaSettings.SwitchItem
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
      {IsShowMultipleSwitch() && isSubFormMode ? (
        <SchemaSettings.SwitchItem
          key="allowDissociate"
          title={t('Allow dissociate')}
          checked={fieldSchema['x-component-props']?.allowDissociate !== false}
          onChange={(value) => {
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            field.componentProps = field.componentProps || {};

            fieldSchema['x-component-props'].allowDissociate = value;
            field.componentProps.allowDissociate = value;

            schema['x-component-props'] = fieldSchema['x-component-props'];
            dn.emit('patch', {
              schema,
            });
            refresh();
          }}
        />
      ) : null}
      {field.readPretty && options.length > 0 && fieldSchema['x-component'] === 'CollectionField' && !isFileField && (
        <SchemaSettings.SwitchItem
          title={t('Enable link')}
          checked={fieldSchema['x-component-props']?.enableLink !== false}
          onChange={(flag) => {
            fieldSchema['x-component-props'] = {
              ...fieldSchema?.['x-component-props'],
              enableLink: flag,
            };
            field.componentProps['enableLink'] = flag;
            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                'x-component-props': {
                  ...fieldSchema?.['x-component-props'],
                },
              },
            });
            dn.refresh();
          }}
        />
      )}
      {form && !form?.readPretty && collectionField?.interface !== 'o2m' && !isPatternDisabled(fieldSchema) && (
        <SchemaSettings.SelectItem
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
      {options.length > 0 && isAssociationField && (
        <SchemaSettings.SelectItem
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
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props']['fieldNames'] = fieldNames;
            schema['x-component-props'] = fieldSchema['x-component-props'];
            field.componentProps.fieldNames = fieldSchema['x-component-props'].fieldNames;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          }}
        />
      )}
      {collectionField && <SchemaSettings.Divider />}
      <SchemaSettings.Remove
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

export function isFileCollection(collection: Collection) {
  return collection?.template === 'file';
}

FormItem.FilterFormDesigner = FilterFormDesigner;

export function getFieldDefaultValue(fieldSchema: ISchema, collectionField: CollectionFieldOptions) {
  const result = fieldSchema?.default || collectionField?.defaultValue;
  if (collectionField?.uiSchema?.['x-component'] === 'DatePicker' && result) {
    return moment(result);
  }
  return result;
}
