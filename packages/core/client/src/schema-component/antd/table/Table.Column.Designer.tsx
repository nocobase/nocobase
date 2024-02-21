import { ISchema, useField, useFieldSchema, useForm } from '@formily/react';
import React from 'react';
import { useCollectionManager_deprecated } from '../../../collection-manager';
import {
  GeneralSchemaDesigner,
  SchemaSettingsDivider,
  SchemaSettingsPopupItem,
  SchemaSettingsRemove,
  SchemaSettingsSelectItem,
} from '../../../schema-settings';
import { useCompile, useDesignable } from '../../hooks';
import { useActionContext } from '../action';

const useLabelFields = (collectionName?: any) => {
  const compile = useCompile();
  const { getCollectionFields } = useCollectionManager_deprecated();
  if (!collectionName) {
    return [];
  }
  const targetFields = getCollectionFields(collectionName);
  return targetFields
    ?.filter?.((field) => !field?.target && field.type !== 'boolean')
    ?.map?.((field) => {
      return {
        value: field.name,
        label: compile(field?.uiSchema?.title || field.name),
      };
    });
};

export const TableColumnDesigner = (props) => {
  const { uiSchema, fieldSchema, collectionField } = props;
  const field = useField();
  const columnSchema = useFieldSchema();
  const { dn } = useDesignable();
  const initialValue = {
    title: columnSchema?.title,
  };
  const options = useLabelFields(collectionField?.target);
  return (
    <GeneralSchemaDesigner>
      <SchemaSettingsPopupItem
        title={'编辑'}
        schema={
          {
            title: '编辑字段',
            'x-component': 'Action.Modal',
            'x-component-props': {
              width: 520,
            },
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
                            const { title } = form.values;
                            if (title) {
                              field.title = title;
                              columnSchema.title = title;
                              dn.emit('patch', {
                                schema: {
                                  'x-uid': columnSchema['x-uid'],
                                  title: columnSchema.title,
                                },
                              });
                            }
                            ctx.setVisible(false);
                            dn.refresh();
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
      {collectionField?.target && (
        <SchemaSettingsSelectItem
          title={'标题字段'}
          options={options}
          value={fieldSchema?.['x-component-props']?.['fieldNames']?.['label']}
          onChange={(label) => {
            const fieldNames = {
              ...fieldSchema['x-component-props']['fieldNames'],
              label,
            };
            fieldSchema['x-component-props']['fieldNames'] = fieldNames;
            field.query(`.*.${fieldSchema.name}`).take((f) => {
              f.componentProps.fieldNames = fieldNames;
            });
            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                'x-component-props': {
                  fieldNames,
                },
              },
            });
            dn.refresh();
          }}
        />
      )}
      <SchemaSettingsDivider />
      <SchemaSettingsRemove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
