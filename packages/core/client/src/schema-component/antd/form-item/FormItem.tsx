import { css, cx } from '@emotion/css';
import { ArrayCollapse, FormLayout, FormItem as Item } from '@formily/antd-v5';
import { Field } from '@formily/core';
import { ISchema, observer, useField, useFieldSchema } from '@formily/react';
import { Select } from 'antd';
import _ from 'lodash';
import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ACLCollectionFieldProvider } from '../../../acl/ACLProvider';
import { useFormActiveFields } from '../../../block-provider';
import { useFormBlockContext } from '../../../block-provider/FormBlockProvider';
import { Collection, useCollection, useCollectionManager } from '../../../collection-manager';
import { useRecord } from '../../../record-provider';
import { GeneralSchemaItems } from '../../../schema-items/GeneralSchemaItems';
import { GeneralSchemaDesigner, SchemaSettings, isPatternDisabled } from '../../../schema-settings';
import { ActionType } from '../../../schema-settings/LinkageRules/type';
import { VariableInput, getShouldChange } from '../../../schema-settings/VariableInput/VariableInput';
import useIsAllowToSetDefaultValue from '../../../schema-settings/hooks/useIsAllowToSetDefaultValue';
import { useIsShowMultipleSwitch } from '../../../schema-settings/hooks/useIsShowMultipleSwitch';
import { useLocalVariables, useVariables } from '../../../variables';
import useContextVariable from '../../../variables/hooks/useContextVariable';
import { useCompile, useDesignable, useFieldModeOptions } from '../../hooks';
import { isSubMode } from '../association-field/util';
import { BlockItem } from '../block-item';
import { removeNullCondition } from '../filter';
import { DynamicComponentProps } from '../filter/DynamicComponent';
import { getTempFieldState } from '../form-v2/utils';
import { HTMLEncode } from '../input/shared';
import { useColorFields } from '../table-v2/Table.Column.Designer';
import { FilterFormDesigner } from './FormItem.FilterFormDesigner';
import { useEnsureOperatorsValid } from './SchemaSettingOptions';
import useLazyLoadAssociationFieldOfForm from './hooks/useLazyLoadAssociationFieldOfForm';
import useLazyLoadDisplayAssociationFieldsOfForm from './hooks/useLazyLoadDisplayAssociationFieldsOfForm';
import useParseDefaultValue from './hooks/useParseDefaultValue';

export const FormItem: any = observer(
  (props: any) => {
    useEnsureOperatorsValid();
    const field = useField<Field>();
    const schema = useFieldSchema();
    const contextVariable = useContextVariable();
    const variables = useVariables();
    const { addActiveFieldName } = useFormActiveFields() || {};

    useEffect(() => {
      variables?.registerVariable(contextVariable);
    }, [contextVariable]);

    // 需要放在注冊完变量之后
    useParseDefaultValue();
    useLazyLoadDisplayAssociationFieldsOfForm();
    useLazyLoadAssociationFieldOfForm();

    useEffect(() => {
      addActiveFieldName?.(schema.name as string);
    }, [addActiveFieldName, schema.name]);

    const showTitle = schema['x-decorator-props']?.showTitle ?? true;
    const extra = useMemo(() => {
      return typeof field.description === 'string' ? (
        <div
          dangerouslySetInnerHTML={{
            __html: HTMLEncode(field.description).split('\n').join('<br/>'),
          }}
        />
      ) : (
        field.description
      );
    }, [field.description]);
    const className = useMemo(() => {
      return cx(
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
      );
    }, [showTitle]);

    return (
      <ACLCollectionFieldProvider>
        <BlockItem className={'nb-form-item'}>
          <Item className={className} {...props} extra={extra} />
        </BlockItem>
      </ACLCollectionFieldProvider>
    );
  },
  { displayName: 'FormItem' },
);

FormItem.Designer = function Designer() {
  const {
    getCollectionFields,
    getInterface,
    getCollectionJoinField,
    getCollection,
    isTitleField,
    getAllCollectionsInheritChain,
  } = useCollectionManager();
  const { getField } = useCollection();
  const { form } = useFormBlockContext();
  const record = useRecord();
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const { dn, refresh, insertAdjacent } = useDesignable();
  const compile = useCompile();
  const IsShowMultipleSwitch = useIsShowMultipleSwitch();
  const collectionField = getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
  const variables = useVariables();
  const localVariables = useLocalVariables();
  const { isAllowToSetDefaultValue } = useIsAllowToSetDefaultValue();
  const isAddNewForm = useIsAddNewForm();

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
  const isFileField = isFileCollection(targetCollection as any);
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
      {isAllowToSetDefaultValue() && <SchemaSettings.DefaultValue />}
      {isSelectFieldMode && !field.readPretty && (
        <SchemaSettings.DataScope
          collectionName={collectionField?.target}
          defaultFilter={fieldSchema?.['x-component-props']?.service?.params?.filter || {}}
          form={form}
          dynamicComponent={(props: DynamicComponentProps) => {
            return (
              <VariableInput
                {...props}
                form={form}
                collectionField={props.collectionField}
                record={record}
                shouldChange={getShouldChange({
                  collectionField: props.collectionField,
                  variables,
                  localVariables,
                  getAllCollectionsInheritChain,
                })}
              />
            );
          }}
          onSubmit={({ filter }) => {
            filter = removeNullCondition(filter);
            _.set(field.componentProps, 'service.params.filter', filter);
            fieldSchema['x-component-props'] = field.componentProps;
            void dn.emit('patch', {
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

            // 子表单状态不允许设置默认值
            if (isSubMode(fieldSchema) && isAddNewForm) {
              // @ts-ignore
              schema.default = null;
              fieldSchema.default = null;
              field.setInitialValue(null);
              field.setValue(null);
            }

            void dn.emit('patch', {
              schema,
            });
            dn.refresh();
          }}
        />
      )}
      {showModeSelect && (
        <SchemaSettings.Item title="Popup size">
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
                'x-acl-action': 'create',
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
                  'x-acl-action': 'create',
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
      {form && !form?.readPretty && !isPatternDisabled(fieldSchema) && (
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

function useIsAddNewForm() {
  const record = useRecord();
  const isAddNewForm = _.isEmpty(_.omit(record, ['__parent', '__collectionName']));

  return isAddNewForm;
}
