import { ArrayCollapse, FormLayout } from '@formily/antd-v5';
import { Field } from '@formily/core';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import { isValid } from '@formily/shared';
import _ from 'lodash';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useApp, useSchemaToolbar } from '../../application';
import { SchemaSettings } from '../../application/schema-settings/SchemaSettings';
import { useFormBlockContext } from '../../block-provider';
import { useCollection, useCollectionManager } from '../../collection-manager';
import { useOptions } from '../../collection-manager/hooks/useOptions';
import { useRecord } from '../../record-provider';
import {
  removeNullCondition,
  useCollectionField,
  useDesignable,
  useFieldModeOptions,
  useIsAddNewForm,
  useValidateSchema,
} from '../../schema-component';
import {
  AfterSuccess,
  AssignedFieldValues,
  ButtonEditor,
  RemoveButton,
  SecondConFirm,
  SkipValidation,
  WorkflowConfig,
} from '../../schema-component/antd/action/Action.Designer';
import { useAssociationFieldContext } from '../../schema-component/antd/association-field/hooks';
import { isSubMode } from '../../schema-component/antd/association-field/util';
import { DynamicComponentProps } from '../../schema-component/antd/filter/DynamicComponent';
import {
  useFieldMode,
  useIsAssociationField,
  useIsFieldReadPretty,
  useIsFileField,
  useIsFormReadPretty,
  useIsSelectFieldMode,
} from '../../schema-component/antd/form-item/FormItem.Settings';
import { getTempFieldState } from '../../schema-component/antd/form-v2/utils';
import { useColumnSchema } from '../../schema-component/antd/table-v2/Table.Column.Decorator';
import { useColorFields } from '../../schema-component/antd/table-v2/Table.Column.Designer';
import {
  SchemaSettingsBlockTitleItem,
  SchemaSettingsDataScope,
  SchemaSettingsDataTemplates,
  SchemaSettingsDateFormat,
  SchemaSettingsDefaultValue,
  SchemaSettingsFormItemTemplate,
  SchemaSettingsLinkageRules,
  SchemaSettingsSortingRule,
  VariableInput,
  getShouldChange,
} from '../../schema-settings';
import { ActionType } from '../../schema-settings/LinkageRules/type';
import { useIsShowMultipleSwitch } from '../../schema-settings/hooks/useIsShowMultipleSwitch';
import { useLocalVariables, useVariables } from '../../variables';

export const creationFormBlockSettings = new SchemaSettings({
  name: 'creationFormBlockSettings',
  items: [
    {
      name: 'title',
      Component: SchemaSettingsBlockTitleItem,
    },
    {
      name: 'linkageRules',
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { name } = useCollection();
        return {
          collectionName: name,
        };
      },
    },
    {
      name: 'dataTemplates',
      Component: SchemaSettingsDataTemplates,
      useVisible() {
        const { action } = useFormBlockContext();
        return !action;
      },
      useComponentProps() {
        const { name } = useCollection();
        return {
          collectionName: name,
        };
      },
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'formItemTemplate',
      Component: SchemaSettingsFormItemTemplate,
      useComponentProps() {
        const { name } = useCollection();
        const fieldSchema = useFieldSchema();
        const defaultResource = fieldSchema?.['x-decorator-props']?.resource;
        return {
          componentName: 'FormItem',
          collectionName: name,
          resourceName: defaultResource,
        };
      },
    },
    {
      name: 'divider2',
      type: 'divider',
    },
    {
      name: 'remove',
      type: 'remove',
      componentProps: {
        removeParentsIfNoChildren: true,
        breakRemoveOn: {
          'x-component': 'Grid',
        },
      },
    },
  ],
});

export const submitActionSettings = new SchemaSettings({
  name: 'actionSettings:submit',
  items: [
    {
      name: 'editButton',
      Component: ButtonEditor,
      useComponentProps() {
        const { buttonEditorProps } = useSchemaToolbar();
        return buttonEditorProps;
      },
    },
    {
      name: 'secondConfirmation',
      Component: SecondConFirm,
    },
    {
      name: 'workflowConfig',
      Component: WorkflowConfig,
      useVisible() {
        const fieldSchema = useFieldSchema();
        return isValid(fieldSchema?.['x-action-settings']?.triggerWorkflows);
      },
    },
    {
      name: 'remove',
      sort: 100,
      Component: RemoveButton as any,
      useComponentProps() {
        const { removeButtonProps } = useSchemaToolbar();
        return removeButtonProps;
      },
    },
  ],
});

export const customizeSaveRecordActionSettings = new SchemaSettings({
  name: 'actionSettings:saveRecord',
  items: [
    {
      name: 'title',
      type: 'itemGroup',
      componentProps: {
        title: 'Customize > Save record',
      },
      children: [
        {
          name: 'editButton',
          Component: ButtonEditor,
          useComponentProps() {
            const { buttonEditorProps } = useSchemaToolbar();
            return buttonEditorProps;
          },
        },
        {
          name: 'secondConfirmation',
          Component: SecondConFirm,
        },
        {
          name: 'assignFieldValues',
          Component: AssignedFieldValues,
        },
        {
          name: 'skipRequiredValidation',
          Component: SkipValidation,
        },
        {
          name: 'afterSuccessfulSubmission',
          Component: AfterSuccess,
          useVisible() {
            const fieldSchema = useFieldSchema();
            return isValid(fieldSchema?.['x-action-settings']?.onSuccess);
          },
        },
        {
          name: 'bindWorkflow',
          Component: WorkflowConfig,
        },
        {
          name: 'delete',
          sort: 100,
          Component: RemoveButton as any,
          useComponentProps() {
            const { removeButtonProps } = useSchemaToolbar();
            return removeButtonProps;
          },
        },
      ],
    },
  ],
});

export const customizeSubmitToWorkflowActionSettings = new SchemaSettings({
  name: 'actionSettings:submitToWorkflow',
  items: [
    {
      name: 'title',
      type: 'itemGroup',
      componentProps: {
        title: 'Customize > Submit to workflow',
      },
      children: [
        {
          name: 'editButton',
          Component: ButtonEditor,
          useComponentProps() {
            const { buttonEditorProps } = useSchemaToolbar();
            return buttonEditorProps;
          },
        },
        {
          name: 'secondConfirmation',
          Component: SecondConFirm,
        },
        {
          name: 'assignFieldValues',
          Component: AssignedFieldValues,
        },
        {
          name: 'skipRequiredValidation',
          Component: SkipValidation,
        },
        {
          name: 'afterSuccessfulSubmission',
          Component: AfterSuccess,
          useVisible() {
            const fieldSchema = useFieldSchema();
            return isValid(fieldSchema?.['x-action-settings']?.onSuccess);
          },
        },
        {
          name: 'bindWorkflow',
          Component: WorkflowConfig,
        },
        {
          name: 'delete',
          sort: 100,
          Component: RemoveButton as any,
          useComponentProps() {
            const { removeButtonProps } = useSchemaToolbar();
            return removeButtonProps;
          },
        },
      ],
    },
  ],
});

export const formItemFieldSettings = new SchemaSettings({
  name: 'fieldSettings:FormItem',
  items: [
    {
      name: 'builtInOptions',
      type: 'itemGroup',
      componentProps: {
        title: 'Built-in options',
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
              const fieldSchema = useFieldSchema();
              const { getCollectionJoinField } = useCollectionManager();
              const { getField } = useCollection();
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
            name: 'required',
            type: 'switch',
            useComponentProps() {
              const { t } = useTranslation();
              const field = useField<Field>();
              const fieldSchema = useFieldSchema();
              const { dn, refresh } = useDesignable();

              return {
                title: t('Required'),
                checked: fieldSchema.required as boolean,
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
              const collectionField = useCollectionField();
              return !['o2m', 'obo', 'oho', 'o2o'].includes(collectionField?.interface);
            },
            Component: SchemaSettingsDefaultValue,
          },
          {
            name: 'pattern',
            type: 'select',
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
              const validateSchema = useValidateSchema();
              return !!validateSchema;
            },
          },
        ];
      },
    },
    {
      name: 'decoratorOptions',
      type: 'itemGroup',
      componentProps: {
        title: 'Decorator options',
      },
      useChildren() {
        return [];
      },
    },
    {
      name: 'componentOptions',
      type: 'itemGroup',
      componentProps: {
        title: 'Component options',
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

const fieldComponent: any = {
  name: 'fieldComponent',
  type: 'select',
  useComponentProps() {
    const { t } = useTranslation();
    const field = useField<Field>();
    const fieldSchema = useFieldSchema();
    const { dn } = useDesignable();
    const fieldModeOptions = useFieldModeOptions();
    const isAddNewForm = useIsAddNewForm();
    const fieldComponentName = useFieldComponentName();

    return {
      title: t('Field component'),
      options: fieldModeOptions,
      value: fieldComponentName,
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
};

const setTheDataScope: any = {
  name: 'setTheDataScope',
  Component: SchemaSettingsDataScope,
  useComponentProps() {
    const { getCollectionJoinField, getAllCollectionsInheritChain } = useCollectionManager();
    const { getField } = useCollection();
    const { form } = useFormBlockContext();
    const record = useRecord();
    const field = useField();
    const fieldSchema = useFieldSchema();
    const collectionField = getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
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
};

const setDefaultSortingRules = {
  name: 'setDefaultSortingRules',
  Component: SchemaSettingsSortingRule,
};

const quickCreate: any = {
  name: 'quickCreate',
  type: 'select',
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
};

const allowMultiple: any = {
  name: 'allowMultiple',
  type: 'switch',
  useVisible() {
    const collectionField = useCollectionField();
    return ['hasMany', 'belongsToMany'].includes(collectionField?.type);
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
};

const titleField: any = {
  name: 'titleField',
  type: 'select',
  useComponentProps() {
    const { t } = useTranslation();
    const field = useField<Field>();
    const fieldSchema = useFieldSchema();
    const { dn } = useDesignable();
    const options = useOptions();
    const collectionField = useCollectionField();

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
};

const enableLink = {
  name: 'enableLink',
  type: 'switch',
  useVisible() {
    const field = useField();
    return field.readPretty;
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
};

export const selectComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:Select',
  items: [
    {
      ...fieldComponent,
      useVisible: useIsAssociationField,
    },
    {
      ...setTheDataScope,
      useVisible() {
        const isSelectFieldMode = useIsSelectFieldMode();
        const isFormReadPretty = useIsFormReadPretty();
        return isSelectFieldMode && !isFormReadPretty;
      },
    },
    {
      ...setDefaultSortingRules,
      useVisible() {
        const isSelectFieldMode = useIsSelectFieldMode();
        const isFormReadPretty = useIsFormReadPretty();
        return isSelectFieldMode && !isFormReadPretty;
      },
    },
    {
      ...quickCreate,
      useVisible() {
        const readPretty = useIsFieldReadPretty();
        const isAssociationField = useIsAssociationField();
        const fieldMode = useFieldMode();
        return !readPretty && isAssociationField && ['Select'].includes(fieldMode);
      },
    },
    {
      ...allowMultiple,
      useVisible() {
        const isAssociationField = useIsAssociationField();
        const IsShowMultipleSwitch = useIsShowMultipleSwitch();
        return isAssociationField && IsShowMultipleSwitch();
      },
    },
    {
      ...titleField,
      useVisible: useIsAssociationField,
    },
    {
      ...enableLink,
      useVisible() {
        const readPretty = useIsFieldReadPretty();
        return useIsAssociationField() && readPretty;
      },
    },
  ],
});

export const recordPickerComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:Picker',
  items: [
    fieldComponent,
    {
      name: 'popupSize',
      type: 'select',
      useComponentProps() {
        const { t } = useTranslation();
        const field = useField<Field>();
        const fieldSchema = useFieldSchema();
        const { dn } = useDesignable();
        return {
          title: t('Popup size'),
          options: [
            { label: t('Small'), value: 'small' },
            { label: t('Middle'), value: 'middle' },
            { label: t('Large'), value: 'large' },
          ],
          value:
            fieldSchema?.['x-component-props']?.['openSize'] ??
            (fieldSchema?.['x-component-props']?.['openMode'] == 'modal' ? 'large' : 'middle'),
          onChange: (value) => {
            field.componentProps.openSize = value;
            fieldSchema['x-component-props'] = field.componentProps;
            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                'x-component-props': fieldSchema['x-component-props'],
              },
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'allowAddNewData',
      type: 'switch',
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
              const addNewActionSchema = {
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
              insertAdjacent('afterBegin', addNewActionSchema);
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
    allowMultiple,
    titleField,
  ],
});

export const subformComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:Nester',
  items: [
    fieldComponent,
    allowMultiple,
    {
      name: 'allowDissociate',
      type: 'switch',
      useVisible() {
        return !useIsFormReadPretty();
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
  ],
});

export const subformPopoverComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:PopoverNester',
  items: [fieldComponent, allowMultiple],
});

export const subtablePopoverComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:SubTable',
  items: [fieldComponent],
});

export const datePickerComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:DatePicker',
  items: [
    {
      name: 'dateDisplayFormat',
      Component: SchemaSettingsDateFormat as any,
      useComponentProps() {
        const fieldSchema = useFieldSchema();
        return {
          fieldSchema,
        };
      },
    },
  ],
});

export const fileManagerComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:FileManager',
  items: [
    fieldComponent,
    {
      name: 'quickUpload',
      type: 'switch',
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
    titleField,
  ],
});

export const tagComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:Tag',
  items: [
    fieldComponent,
    {
      name: 'tagColorField',
      type: 'select',
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
    titleField,
    enableLink,
  ],
});

export const cascadeSelectComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:CascadeSelect',
  items: [fieldComponent, titleField],
});

export const uploadAttachmentComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:Upload.Attachment',
  items: [
    {
      name: 'size',
      type: 'select',
      useVisible() {
        const readPretty = useIsFieldReadPretty();
        return readPretty;
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
  ],
});

export function useFieldComponentName(): string {
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const collectionField = useCollectionField();
  const isFileField = useIsFileField();
  const map = {
    // AssociationField 的 mode 默认值是 Select
    AssociationField: 'Select',
  };
  const fieldComponentName =
    field?.componentProps?.['mode'] ||
    (isFileField ? 'FileManager' : '') ||
    collectionField?.uiSchema?.['x-component'] ||
    fieldSchema?.['x-component'];
  return map[fieldComponentName] || fieldComponentName;
}
export const percentComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:Percent',
  items: [
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
                default: columnSchema?.['x-component-props']?.['width'] || 200,
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
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
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
  ],
});
export const iconPickerComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:IconPicker',
  items: [
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
                default: columnSchema?.['x-component-props']?.['width'] || 200,
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
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
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
  ],
});
export const colorPickerComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:ColorPicker',
  items: [
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
                default: columnSchema?.['x-component-props']?.['width'] || 200,
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
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
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
  ],
});
export const passwordComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:Password',
  items: [
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
                default: columnSchema?.['x-component-props']?.['width'] || 200,
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
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
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
  ],
});
export const inputNumberComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:InputNumber',
  items: [
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
                default: columnSchema?.['x-component-props']?.['width'] || 200,
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
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
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
  ],
});
export const inputURLComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:Input.URL',
  items: [
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
                default: columnSchema?.['x-component-props']?.['width'] || 200,
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
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
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
  ],
});
export const inputComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:Input',
  items: [
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
                default: columnSchema?.['x-component-props']?.['width'] || 200,
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
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
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
  ],
});
export const collectionSelectComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:CollectionSelect',
  items: [
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
                default: columnSchema?.['x-component-props']?.['width'] || 200,
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
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
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
  ],
});
export const inputJSONComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:Input.JSON',
  items: [
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
                default: columnSchema?.['x-component-props']?.['width'] || 200,
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
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
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
  ],
});
export const formulaResultComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:Formula.Result',
  items: [
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
                default: columnSchema?.['x-component-props']?.['width'] || 200,
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
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
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
  ],
});
export const inputTextAreaComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:Input.TextArea',
  items: [
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
                default: columnSchema?.['x-component-props']?.['width'] || 200,
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
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
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
  ],
});
export const timePickerComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:TimePicker',
  items: [
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
                default: columnSchema?.['x-component-props']?.['width'] || 200,
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
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
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
  ],
});
export const richTextComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:RichText',
  items: [
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
                default: columnSchema?.['x-component-props']?.['width'] || 200,
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
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
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
  ],
});
export const markdownComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:Markdown',
  items: [
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
                default: columnSchema?.['x-component-props']?.['width'] || 200,
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
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
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
  ],
});
export const radioGroupComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:Radio.Group',
  items: [
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
                default: columnSchema?.['x-component-props']?.['width'] || 200,
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
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
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
  ],
});
export const cascaderComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:Cascader',
  items: [
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
                default: columnSchema?.['x-component-props']?.['width'] || 200,
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
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
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
  ],
});
export const checkboxGroupComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:Checkbox.Group',
  items: [
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
                default: columnSchema?.['x-component-props']?.['width'] || 200,
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
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
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
  ],
});
export const checkboxComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:Checkbox',
  items: [
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
                default: columnSchema?.['x-component-props']?.['width'] || 200,
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
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
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
  ],
});
