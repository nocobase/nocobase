import { FormItem as Item } from '@formily/antd';
import { Field } from '@formily/core';
import { ISchema, useField, useFieldSchema, useForm } from '@formily/react';
import React from 'react';
import { useActionContext } from '..';
import { useCompile, useDesignable } from '../..';
import { useCollection, useCollectionManager } from '../../../collection-manager';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';
import { BlockItem } from '../block-item';

export const FormItem: any = (props) => {
  return (
    <BlockItem className={'nb-form-item'}>
      <Item {...props} />
    </BlockItem>
  );
};

FormItem.Designer = () => {
  const { getCollectionFields } = useCollectionManager();
  const { getField } = useCollection();
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { dn, reset, refresh } = useDesignable();
  const compile = useCompile();
  const collectionField = getField(fieldSchema['name']);
  const originalTitle = collectionField?.uiSchema?.title;
  const targetFields = collectionField?.target ? getCollectionFields(collectionField.target) : [];
  const initialValue = {
    title: field.title === originalTitle ? undefined : field.title,
  };
  if (!field.readPretty) {
    initialValue['required'] = field.required;
  }
  const options = targetFields
    .filter((field) => !field?.target && field.type !== 'boolean')
    .map((field) => ({
      value: field?.name,
      label: compile(field?.uiSchema?.title) || field?.name,
    }));
  return (
    <GeneralSchemaDesigner>
      {collectionField && (
        <SchemaSettings.PopupItem
          title={'编辑'}
          schema={
            {
              title: '编辑字段',
              'x-component': 'Action.Modal',
              'x-decorator': 'Form',
              'x-decorator-props': {
                initialValue,
              },
              type: 'void',
              properties: {
                title: {
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                  title: '字段标题',
                  'x-component-props': {},
                  description: `原字段标题：${collectionField?.uiSchema?.title}`,
                },
                required: {
                  'x-decorator': 'FormItem',
                  'x-component': 'Checkbox',
                  'x-content': '必填',
                  'x-hidden': field.readPretty,
                },
                footer: {
                  type: 'void',
                  'x-component': 'Action.Modal.Footer',
                  properties: {
                    cancel: {
                      type: 'void',
                      title: '{{t("Cancel")}}',
                      'x-component': 'Action',
                      'x-component-props': {
                        useAction() {
                          const ctx = useActionContext();
                          return {
                            async run() {
                              ctx.setVisible(false);
                            },
                          };
                        },
                      },
                    },
                    submit: {
                      type: 'void',
                      title: 'Submit',
                      'x-component': 'Action',
                      'x-component-props': {
                        type: 'primary',
                        useAction() {
                          const form = useForm();
                          const ctx = useActionContext();
                          return {
                            async run() {
                              const { title, required, label } = form.values;

                              const schema = {
                                ['x-uid']: fieldSchema['x-uid'],
                              };

                              if (title) {
                                field.title = title;
                                fieldSchema['title'] = title;
                                schema['title'] = title;
                              }

                              field.required = required;
                              fieldSchema['required'] = required;
                              schema['required'] = required;

                              ctx.setVisible(false);
                              dn.emit('patch', {
                                schema,
                              });
                              refresh();
                            },
                          };
                        },
                      },
                    },
                  },
                },
              },
            } as ISchema
          }
        />
      )}
      {collectionField?.target && (
        <SchemaSettings.SelectItem
          title={'标题字段'}
          options={options}
          value={field?.componentProps?.fieldNames?.label}
          onChange={(label) => {
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            const fieldNames = {
              ...field.componentProps.fieldNames,
              label,
            };
            fieldSchema['x-component-props']['fieldNames'] = fieldNames;
            field.componentProps.fieldNames = fieldNames;
            schema['x-component-props'] = {
              fieldNames,
            };
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          }}
        />
      )}
      {collectionField && <SchemaSettings.Divider />}
      <SchemaSettings.Remove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
