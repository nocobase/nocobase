import { css, cx } from '@emotion/css';
import { ArrayCollapse, FormLayout, FormItem as Item } from '@formily/antd-v5';
import { Field } from '@formily/core';
import { ISchema, observer, useField, useFieldSchema } from '@formily/react';
import { Select } from 'antd';
import dayjs from 'dayjs';
import _ from 'lodash';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ACLCollectionFieldProvider } from '../../../acl/ACLProvider';
import { useBlockRequestContext } from '../../../block-provider/BlockProvider';
import { useFormBlockContext } from '../../../block-provider/FormBlockProvider';
import {
  Collection,
  CollectionFieldOptions,
  useCollection,
  useCollectionFilterOptions,
  useCollectionManager,
} from '../../../collection-manager';
import { GeneralSchemaItems } from '../../../schema-items/GeneralSchemaItems';
import { GeneralSchemaDesigner, SchemaSettings, isPatternDisabled, isShowDefaultValue } from '../../../schema-settings';
import { useIsShowMultipleSwitch } from '../../../schema-settings/hooks/useIsShowMultipleSwitch';
import { isVariable, parseVariables, useVariablesCtx } from '../../common/utils/uitls';
import { useCompile, useDesignable, useFieldModeOptions } from '../../hooks';
import { BlockItem } from '../block-item';
import { removeNullCondition } from '../filter';
import { HTMLEncode } from '../input/shared';
import { FilterDynamicComponent } from '../table-v2/FilterDynamicComponent';
import { useColorFields } from '../table-v2/Table.Column.Designer';
import { FilterFormDesigner } from './FormItem.FilterFormDesigner';
import { useEnsureOperatorsValid } from './SchemaSettingOptions';

export const findColumnFieldSchema = (fieldSchema, getCollectionJoinField) => {
  const childsSchema = new Set();
  const getAssociationAppends = (schema) => {
    schema.reduceProperties((_, s) => {
      const collectionfield = s['x-collection-field'] && getCollectionJoinField(s['x-collection-field']);
      const isAssociationField = collectionfield && ['belongsTo'].includes(collectionfield.type);
      if (collectionfield && isAssociationField && s.default?.includes?.('$context')) {
        childsSchema.add(JSON.stringify({ name: s.name, default: s.default }));
      } else {
        getAssociationAppends(s);
      }
    }, []);
  };

  getAssociationAppends(fieldSchema);
  return [...childsSchema];
};
function transformData(inputData) {
  const transformedData = [];
  const keys = Object.keys(inputData) || [];
  const values: any[] = Object.values(inputData) || [];
  for (let i = 0; i < values[0]?.length; i++) {
    const newObj = {};
    keys.forEach((key, index) => {
      newObj[key] = values[index][i];
    });
    transformedData.push(newObj);
  }

  return transformedData;
}
export const FormItem: any = observer(
  (props: any) => {
    useEnsureOperatorsValid();
    const field = useField<Field>();
    const ctx = useBlockRequestContext();
    const schema = useFieldSchema();
    const variablesCtx = useVariablesCtx();
    const { getCollectionJoinField } = useCollectionManager();
    const collectionField = getCollectionJoinField(schema['x-collection-field']);

    useEffect(() => {
      if (ctx?.block === 'form') {
        ctx.field.data = ctx.field.data || {};
        ctx.field.data.activeFields = ctx.field.data.activeFields || new Set();
        ctx.field.data.activeFields.add(schema.name);
        // 如果默认值是一个变量，则需要解析之后再显示出来
        if (isVariable(schema?.default) && !schema?.default.includes('$context')) {
          field.setInitialValue?.(parseVariables(schema.default, variablesCtx));
        } else if (
          isVariable(schema?.default) &&
          schema?.default?.includes('$context') &&
          collectionField?.interface === 'm2m'
        ) {
          // 直接对多
          const contextData = parseVariables('{{$context}}', variablesCtx);
          let iniValues = [];
          contextData?.map((v) => {
            const data = parseVariables(schema.default, { $context: v });
            iniValues = iniValues.concat(data).map((v) => {
              delete v[collectionField.through];
              return v;
            });
          });
          const data = _.uniqBy(iniValues, 'id');
          field.setInitialValue?.(data.length > 0 ? data : [{}]);
        } else if (
          collectionField?.interface === 'o2m' &&
          ['SubTable', 'Nester'].includes(schema?.['x-component-props']?.['mode']) // 间接对多
        ) {
          const childrenFieldWithDefault = findColumnFieldSchema(schema, getCollectionJoinField);
          // 子表格/子表单中找出所有belongsTo字段的上下文默认值
          if (childrenFieldWithDefault.length > 0) {
            const tableData = parseVariables('{{$context}}', variablesCtx);
            const contextData = {};
            // 将数据拍平
            childrenFieldWithDefault?.forEach((s: any) => {
              const child = JSON.parse(s);
              tableData?.map((v) => {
                contextData[child.name] = _.uniqBy(
                  (contextData[child.name] || []).concat(parseVariables(child.default, { $context: v })),
                  'id',
                );
              });
            });
            const initValues = transformData(contextData);
            field.setInitialValue?.(initValues);
          }
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
  },
  { displayName: 'FormItem' },
);

FormItem.Designer = function Designer() {
  let targetField;
  const { getCollectionFields, getInterface, getCollectionJoinField, getCollection, isTitleField } =
    useCollectionManager();
  const { getField } = useCollection();
  const { form } = useFormBlockContext();
  const ctx = useBlockRequestContext();
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const { dn, refresh, insertAdjacent } = useDesignable();
  const compile = useCompile();
  const IsShowMultipleSwitch = useIsShowMultipleSwitch();
  const collectionField = getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
  if (collectionField?.target) {
    targetField = getCollectionJoinField(
      `${collectionField.target}.${fieldSchema['x-component-props']?.fieldNames?.label || 'id'}`,
    );
  }

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
  const colorFieldOptions = useColorFields(collectionField?.target ?? collectionField?.targetCollection);

  let readOnlyMode = 'editable';
  if (fieldSchema['x-disabled'] === true) {
    readOnlyMode = 'readonly';
  }
  if (fieldSchema['x-read-pretty'] === true) {
    readOnlyMode = 'read-pretty';
  }
  const dataSource = useCollectionFilterOptions(collectionField?.target);
  const defaultFilter = fieldSchema?.['x-component-props']?.service?.params?.filter || {};
  const fieldMode = field?.componentProps?.['mode'] || (isFileField ? 'FileManager' : 'Select');
  const isSelectFieldMode = isAssociationField && fieldMode === 'Select';
  const isSubFormMode = fieldSchema['x-component-props']?.mode === 'Nester';
  const isPickerMode = fieldSchema['x-component-props']?.mode === 'Picker';
  const showFieldMode = isAssociationField && fieldModeOptions && !isTableField;
  const showModeSelect = showFieldMode && isPickerMode;
  const isDateField = ['datetime', 'createdAt', 'updatedAt'].includes(collectionField?.interface);
  const isAttachmentField =
    ['attachment'].includes(collectionField?.interface) || targetCollection?.template === 'file';

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
        !isPatternDisabled(fieldSchema) && <SchemaSettings.DefaultValue />}
      {isSelectFieldMode && !field.readPretty && (
        <SchemaSettings.ModalItem
          title={t('Set the data scope')}
          schema={
            {
              type: 'object',
              title: t('Set the data scope'),
              properties: {
                filter: {
                  defaultValue: defaultFilter,
                  enum: dataSource,
                  'x-component': 'Filter',
                  'x-component-props': {
                    collectionName: collectionField?.target,
                    dynamicComponent: (props) =>
                      FilterDynamicComponent({
                        ...props,
                        form,
                        collectionField,
                        rootCollection: ctx.props.collection || ctx.props.resource,
                      }),
                  },
                },
              },
            } as ISchema
          }
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
      )}
      {isSelectFieldMode && !field.readPretty && <SchemaSettings.SortingRule />}
      {showFieldMode && (
        <SchemaSettings.SelectItem
          key="field-mode"
          title={t('Field component')}
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
              data-testid="antd-select"
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
      {!field.readPretty && isAssociationField && ['Picker'].includes(fieldMode) && (
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
      {!field.readPretty && isAssociationField && ['Select'].includes(fieldMode) && (
        <SchemaSettings.SelectItem
          key="add-mode"
          title={t('Quick create')}
          options={[
            { label: t('None'), value: 'none' },
            { label: t('Dropdown'), value: 'quickAdd' },
            { label: t('Pop-up'), value: 'modalAdd' },
          ]}
          value={field.componentProps?.addMode || 'none'}
          onChange={(mode) => {
            if (mode === 'modalAdd') {
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
            }
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props']['addMode'] = mode;
            schema['x-component-props'] = fieldSchema['x-component-props'];
            field.componentProps = field.componentProps || {};
            field.componentProps.addMode = mode;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
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
      {options.length > 0 && isAssociationField && fieldMode !== 'SubTable' && (
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
      {isDateField && <SchemaSettings.DataFormat fieldSchema={fieldSchema} />}

      {isAttachmentField && field.readPretty && (
        <SchemaSettings.SelectItem
          key="size"
          title={t('Size')}
          options={[
            { label: t('Large'), value: 'large' },
            { label: t('Default'), value: 'default' },
            { label: t('Small'), value: 'small' },
          ]}
          value={field?.componentProps?.size || 'default'}
          onChange={(size) => {
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props']['size'] = size;
            schema['x-component-props'] = fieldSchema['x-component-props'];
            field.componentProps = field.componentProps || {};
            field.componentProps.size = size;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          }}
        />
      )}

      {isAssociationField && ['Tag'].includes(fieldMode) && (
        <SchemaSettings.SelectItem
          key="title-field"
          title={t('Tag color field')}
          options={colorFieldOptions}
          value={field?.componentProps?.tagColorField}
          onChange={(tagColorField) => {
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };

            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props']['tagColorField'] = tagColorField;
            schema['x-component-props'] = fieldSchema['x-component-props'];
            field.componentProps.tagColorField = tagColorField;
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
  const result = fieldSchema?.default ?? collectionField?.defaultValue;
  if (collectionField?.uiSchema?.['x-component'] === 'DatePicker' && result) {
    return dayjs(result);
  }
  return result;
}
