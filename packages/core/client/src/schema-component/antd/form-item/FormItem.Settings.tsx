import { ArrayCollapse, FormLayout, FormItem } from '@formily/antd-v5';
import { Field } from '@formily/core';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import { Select } from 'antd';
import _ from 'lodash';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaSettings } from '../../../application/schema-settings';
import { useFormBlockContext } from '../../../block-provider/FormBlockProvider';
import { Collection, useCollection, useCollectionManager } from '../../../collection-manager';
import { useRecord } from '../../../record-provider';
import { generalSettingsItems } from '../../../schema-items/GeneralSettings';
import {
  SchemaSettingsDataFormat,
  SchemaSettingsDataScope,
  SchemaSettingsDefaultValue,
  SchemaSettingsSortingRule,
  isPatternDisabled,
} from '../../../schema-settings';
import { ActionType } from '../../../schema-settings/LinkageRules/type';
import { VariableInput, getShouldChange } from '../../../schema-settings/VariableInput/VariableInput';
import useIsAllowToSetDefaultValue from '../../../schema-settings/hooks/useIsAllowToSetDefaultValue';
import { useIsShowMultipleSwitch } from '../../../schema-settings/hooks/useIsShowMultipleSwitch';
import { useLocalVariables, useVariables } from '../../../variables';
import { useCompile, useDesignable, useFieldModeOptions } from '../../hooks';
import { isSubMode } from '../association-field/util';
import { removeNullCondition } from '../filter';
import { DynamicComponentProps } from '../filter/DynamicComponent';
import { getTempFieldState } from '../form-v2/utils';
import { useColorFields } from '../table-v2/Table.Column.Designer';
import { FormDialog } from '..';
import { SchemaComponent } from '../../..';
import { Variable } from '@nocobase/client';
export const CUSTOM = 'CUSTOM';
export const formItemSettings = new SchemaSettings({
  name: 'FormItemSettings',
  items: [
    ...(generalSettingsItems as any),
    {
      name: 'quickUpload',
      type: 'switch',
      useVisible() {
        const isFileField = useIsFileField();
        const isFormReadPretty = useIsFormReadPretty();
        return !isFormReadPretty && isFileField;
      },
      useComponentProps() {
        const { t } = useTranslation();
        const field = useField<Field>();
        const fieldSchema = useFieldSchema();
        const { dn, refresh } = useDesignable();
        return {
          title: t('Quick upload'),
          checked: fieldSchema['x-component-props']?.quickUpload !== (false as boolean),
          onChange(value) {
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
          },
        };
      },
    },
    {
      name: 'selectFile',
      type: 'switch',
      useVisible() {
        const isFileField = useIsFileField();
        const isFormReadPretty = useIsFormReadPretty();
        return !isFormReadPretty && isFileField;
      },
      useComponentProps() {
        const { t } = useTranslation();
        const field = useField<Field>();
        const fieldSchema = useFieldSchema();
        const { dn, refresh } = useDesignable();
        return {
          title: t('Select file'),
          checked: fieldSchema['x-component-props']?.selectFile !== (false as boolean),
          onChange(value) {
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
          },
        };
      },
    },
    {
      name: 'validationRules',
      type: 'modal',
      useComponentProps() {
        const { t } = useTranslation();
        const field = useField<Field>();
        const fieldSchema = useFieldSchema();
        const { dn, refresh } = useDesignable();
        const validateSchema = useValidateSchema();
        const { getCollectionJoinField } = useCollectionManager();
        const { getField } = useCollection();
        const collectionField =
          getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
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
      name: 'defaultValue',
      Component: SchemaSettingsDefaultValue,
      useVisible() {
        const { isAllowToSetDefaultValue } = useIsAllowToSetDefaultValue();
        return isAllowToSetDefaultValue();
      },
    },
    {
      name: 'dataScope',
      Component: SchemaSettingsDataScope,
      useVisible() {
        const isSelectFieldMode = useIsSelectFieldMode();
        const isFormReadPretty = useIsFormReadPretty();
        return isSelectFieldMode && !isFormReadPretty;
      },
      useComponentProps() {
        const { getCollectionJoinField, getAllCollectionsInheritChain } = useCollectionManager();
        const { getField } = useCollection();
        const { form } = useFormBlockContext();
        const record = useRecord();
        const field = useField();
        const fieldSchema = useFieldSchema();
        const collectionField =
          getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
        const variables = useVariables();
        const localVariables = useLocalVariables();
        const { dn } = useDesignable();
        return {
          collectionName: collectionField?.target,
          defaultFilter: fieldSchema?.['x-component-props']?.service?.params?.filter || {},
          form,
          dynamicComponent: (props: DynamicComponentProps) => {
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
          },
          onSubmit: ({ filter }) => {
            filter = removeNullCondition(filter);
            _.set(field.componentProps, 'service.params.filter', filter);
            fieldSchema['x-component-props'] = field.componentProps;
            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                'x-component-props': field.componentProps,
              },
            });
          },
        };
      },
    },
    {
      name: 'sortingRule',
      Component: SchemaSettingsSortingRule,
      useVisible() {
        const isSelectFieldMode = useIsSelectFieldMode();
        const isFormReadPretty = useIsFormReadPretty();
        return isSelectFieldMode && !isFormReadPretty;
      },
    },
    {
      name: 'fieldMode',
      type: 'select',
      useComponentProps() {
        const { t } = useTranslation();
        const field = useField<Field>();
        const fieldSchema = useFieldSchema();
        const { dn } = useDesignable();
        const fieldModeOptions = useFieldModeOptions();
        const isAddNewForm = useIsAddNewForm();
        const fieldMode = useFieldMode();

        return {
          title: t('Field component'),
          options: fieldModeOptions,
          value: fieldMode,
          onChange(mode) {
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
          },
        };
      },
      useVisible: useShowFieldMode,
    },
    {
      name: 'popupSize',
      type: 'item',
      useComponentProps() {
        const { t } = useTranslation();
        const field = useField<Field>();
        const fieldSchema = useFieldSchema();
        const { dn } = useDesignable();
        return {
          title: t('Popup size'),
          children: (
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
          ),
        };
      },
      useVisible() {
        const showFieldMode = useShowFieldMode();
        const fieldSchema = useFieldSchema();
        const isPickerMode = fieldSchema['x-component-props']?.mode === 'Picker';
        const showModeSelect = showFieldMode && isPickerMode;
        return showModeSelect;
      },
    },
    {
      name: 'allowAddNew',
      type: 'switch',
      useVisible() {
        const readPretty = useIsFieldReadPretty();
        const isAssociationField = useIsAssociationField();
        const fieldMode = useFieldMode();
        return !readPretty && isAssociationField && ['Picker'].includes(fieldMode);
      },
      useComponentProps() {
        const { t } = useTranslation();
        const field = useField<Field>();
        const fieldSchema = useFieldSchema();
        const { dn, refresh, insertAdjacent } = useDesignable();
        return {
          title: t('Allow add new data'),
          checked: fieldSchema['x-add-new'] as boolean,
          onChange(allowAddNew) {
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
          },
        };
      },
    },
    {
      name: 'addMode',
      type: 'select',
      useVisible() {
        const readPretty = useIsFieldReadPretty();
        const isAssociationField = useIsAssociationField();
        const fieldMode = useFieldMode();
        return !readPretty && isAssociationField && ['Select'].includes(fieldMode);
      },
      useComponentProps() {
        const { t } = useTranslation();
        const field = useField<Field>();
        const fieldSchema = useFieldSchema();
        const { dn, insertAdjacent } = useDesignable();
        return {
          title: t('Quick create'),
          options: [
            { label: t('None'), value: 'none' },
            { label: t('Dropdown'), value: 'quickAdd' },
            { label: t('Pop-up'), value: 'modalAdd' },
          ],
          value: field.componentProps?.addMode || 'none',
          onChange(mode) {
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
          },
        };
      },
    },
    {
      name: 'multiple',
      type: 'switch',
      useVisible() {
        const isAssociationField = useIsAssociationField();
        const IsShowMultipleSwitch = useIsShowMultipleSwitch();
        return isAssociationField && IsShowMultipleSwitch();
      },
      useComponentProps() {
        const { t } = useTranslation();
        const field = useField<Field>();
        const fieldSchema = useFieldSchema();
        const { dn, refresh } = useDesignable();
        return {
          title: t('Allow multiple'),
          checked:
            fieldSchema['x-component-props']?.multiple === undefined ? true : fieldSchema['x-component-props'].multiple,
          onChange(value) {
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
          },
        };
      },
    },
    {
      name: 'allowDissociate',
      type: 'switch',
      useVisible() {
        const IsShowMultipleSwitch = useIsShowMultipleSwitch();
        const fieldSchema = useFieldSchema();
        const isSubFormMode = fieldSchema['x-component-props']?.mode === 'Nester';
        return isSubFormMode && IsShowMultipleSwitch();
      },
      useComponentProps() {
        const { t } = useTranslation();
        const field = useField<Field>();
        const fieldSchema = useFieldSchema();
        const { dn, refresh } = useDesignable();
        return {
          title: t('Allow dissociate'),
          checked: fieldSchema['x-component-props']?.allowDissociate !== false,
          onChange(value) {
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
          },
        };
      },
    },
    {
      name: 'enableLink',
      type: 'switch',
      useVisible() {
        const options = useOptions();
        const readPretty = useIsFieldReadPretty();
        const isFileField = useIsFileField();

        const fieldSchema = useFieldSchema();
        return readPretty && options.length > 0 && !isFileField && fieldSchema['x-component'] === 'CollectionField';
      },
      useComponentProps() {
        const { t } = useTranslation();
        const field = useField<Field>();
        const fieldSchema = useFieldSchema();
        const { dn } = useDesignable();
        return {
          title: t('Enable link'),
          checked: fieldSchema['x-component-props']?.enableLink !== false,
          onChange(flag) {
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
          },
        };
      },
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
      name: 'titleField',
      type: 'select',
      useVisible() {
        const fieldMode = useFieldMode();
        const options = useOptions();
        const collectionField = useCollectionField();
        return fieldMode !== 'SubTable' && collectionField.uiSchema['x-component'] === 'Select';
      },
      useComponentProps() {
        const { t } = useTranslation();
        const field = useField<Field>();
        const fieldSchema = useFieldSchema();
        const { dn } = useDesignable();
        let options = useOptions();
        const collectionField = useCollectionField();
        const isAssociationField = useIsAssociationField();

        if (!isAssociationField) {
          options = options.concat([
            {
              label: t('Name'),
              value: 'label',
            },
            {
              label: t('Value'),
              value: 'value',
            },
          ]);
        }
        const value = field?.componentProps?.fieldNames?.label || 'label';

        const handlLabel = (valueLabel: string) => {
          if (valueLabel === CUSTOM && !value.includes('{{')) {
            return `{{${value}}}`;
          }
          return value;
        };
        const openModal = async (label: string) => {
          let formValue = label;
          const schema = {
            ['x-uid']: fieldSchema['x-uid'],
          };

          if (label == CUSTOM) {
            formValue = await FormDialog({ title: t('Custom title field') }, () => {
              return (
                <FormLayout layout={'vertical'}>
                  <SchemaComponent
                    components={{ Variable, FormItem }}
                    schema={{
                      type: 'object',
                      properties: {
                        name: {
                          title: t('Custom field name'),
                          required: true,
                          default: handlLabel(label),
                          'x-decorator': 'FormItem',
                          'x-component': 'Variable.RawTextArea',
                          'x-component-props': {
                            scope: options.map((o) => {
                              return {
                                ...o,
                                label: o.value,
                              };
                            }),
                          },
                        },
                      },
                    }}
                  />
                </FormLayout>
              );
            })
              .open()
              .then((values) => {
                return values.name;
              });
          }
          const fieldNames = {
            ...collectionField?.uiSchema?.['x-component-props']?.['fieldNames'],
            ...field.componentProps.fieldNames,
            label: formValue,
          };
          fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
          fieldSchema['x-component-props']['fieldNames'] = fieldNames;
          schema['x-component-props'] = fieldSchema['x-component-props'];
          field.componentProps.fieldNames = fieldSchema['x-component-props'].fieldNames;
          dn.emit('patch', {
            schema,
          });
          dn.refresh();
        };
        return {
          title: t('Title field1'),
          options: [
            ...options,
            {
              label: t('Customize'),
              value: CUSTOM,
            },
          ],
          value: value !== CUSTOM && options.map((o) => o.value).includes(value) ? value : CUSTOM,
          onChange: openModal,
          onClick: (label) => {
            if (label === CUSTOM && options.every((op) => op.value !== value)) {
              openModal(label);
            }
          },
        };
      },
    },
    {
      name: 'dateFormat',
      Component: SchemaSettingsDataFormat,
      useVisible() {
        const collectionField = useCollectionField();
        const isDateField = ['datetime', 'createdAt', 'updatedAt'].includes(collectionField?.interface);
        return isDateField;
      },
      useComponentProps() {
        const fieldSchema = useFieldSchema();
        return {
          fieldSchema,
        };
      },
    },
    {
      name: 'size',
      type: 'select',
      useVisible() {
        const readPretty = useIsFieldReadPretty();
        const collectionField = useCollectionField();
        const { getCollection } = useCollectionManager();
        const targetCollection = getCollection(collectionField?.target);
        const isAttachmentField =
          ['attachment'].includes(collectionField?.interface) || targetCollection?.template === 'file';
        return readPretty && isAttachmentField;
      },
      useComponentProps() {
        const { t } = useTranslation();
        const field = useField<Field>();
        const fieldSchema = useFieldSchema();
        const { dn } = useDesignable();
        return {
          title: t('Size'),
          options: [
            { label: t('Large'), value: 'large' },
            { label: t('Default'), value: 'default' },
            { label: t('Small'), value: 'small' },
          ],
          value: field?.componentProps?.size || 'default',
          onChange(size) {
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
          },
        };
      },
    },
    {
      name: 'tagColor',
      type: 'select',
      useVisible() {
        const isAssociationField = useIsAssociationField();
        const fieldMode = useFieldMode();
        return isAssociationField && ['Tag'].includes(fieldMode);
      },
      useComponentProps() {
        const { t } = useTranslation();
        const field = useField<Field>();
        const fieldSchema = useFieldSchema();
        const { dn } = useDesignable();
        const collectionField = useCollectionField();
        const colorFieldOptions = useColorFields(collectionField?.target ?? collectionField?.targetCollection);
        return {
          title: t('Tag color field'),
          options: colorFieldOptions,
          value: field?.componentProps?.tagColorField,
          onChange(tagColorField) {
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
          },
        };
      },
    },
    {
      name: 'divider',
      type: 'divider',
      useVisible() {
        const collectionField = useCollectionField();
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

function useIsAddNewForm() {
  const record = useRecord();
  const isAddNewForm = _.isEmpty(_.omit(record, ['__parent', '__collectionName']));

  return isAddNewForm;
}

function isFileCollection(collection: Collection) {
  return collection?.template === 'file';
}

function useIsFormReadPretty() {
  const { form } = useFormBlockContext();
  return !!form?.readPretty;
}

function useIsFieldReadPretty() {
  const field = useField<Field>();
  return field.readPretty;
}

function useCollectionField() {
  const { getCollectionJoinField } = useCollectionManager();
  const { getField } = useCollection();
  const fieldSchema = useFieldSchema();
  const collectionField = getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
  return collectionField;
}

export const useIsAssociationField = () => {
  const collectionField = useCollectionField();
  const isAssociationField = ['obo', 'oho', 'o2o', 'o2m', 'm2m', 'm2o'].includes(collectionField?.interface);
  return isAssociationField;
};

function useIsFileField() {
  const { getCollection } = useCollectionManager();
  const collectionField = useCollectionField();
  const targetCollection = getCollection(collectionField?.target);
  const isFileField = isFileCollection(targetCollection as any);
  return isFileField;
}

function useFieldMode() {
  const field = useField<Field>();
  const isFileField = useIsFileField();
  const fieldMode = field?.componentProps?.['mode'] || (isFileField ? 'FileManager' : 'Select');
  return fieldMode;
}

function useIsSelectFieldMode() {
  const fieldMode = useFieldMode();
  const isAssociationField = useIsAssociationField();
  const isSelectFieldMode = isAssociationField && fieldMode === 'Select';
  return isSelectFieldMode;
}

function useValidateSchema() {
  const { getInterface } = useCollectionManager();
  const fieldSchema = useFieldSchema();
  const collectionField = useCollectionField();
  const interfaceConfig = getInterface(collectionField?.interface);
  const validateSchema = interfaceConfig?.['validateSchema']?.(fieldSchema);
  return validateSchema;
}

function useShowFieldMode() {
  const fieldSchema = useFieldSchema();
  const fieldModeOptions = useFieldModeOptions();
  const isTableField = fieldSchema['x-component'] === 'TableField';
  const isAssociationField = useIsAssociationField();
  const showFieldMode = isAssociationField && fieldModeOptions && !isTableField;
  return showFieldMode;
}

export const useOptions = () => {
  const { getCollectionFields, isTitleField } = useCollectionManager();
  const compile = useCompile();
  const collectionField = useCollectionField();
  const targetFields = collectionField?.target
    ? getCollectionFields(collectionField?.target)
    : getCollectionFields(collectionField?.targetCollection) ?? [];
  const options = targetFields
    .filter((field) => {
      return isTitleField(field);
    })
    .map((field) => ({
      value: field?.name,
      label: compile(field?.uiSchema?.title) || field?.name,
    }));
  return options;
};
