import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { CollectionOptions } from '@nocobase/client';
import { NAMESPACE } from '../../../locale';

export const collection: CollectionOptions = {
  name: 'fields',
  fields: [
    {
      type: 'string',
      name: 'type',
      interface: 'input',
      uiSchema: {
        title: '{{ t("Storage type") }}',
        type: 'string',
        'x-component': 'Select',
        enum: [
          {
            label: 'String',
            value: 'string',
          },
        ],
        required: true,
      },
    },
    {
      type: 'string',
      name: 'interface',
      interface: 'input',
      uiSchema: {
        title: `{{t("Field interface", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-component': 'Select',
        enum: '{{interfaces}}',
      },
    },
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        title: '{{ t("Field display name") }}',
        type: 'string',
        'x-component': 'Input',
        required: true,
      },
    },
    {
      type: 'string',
      name: 'name',
      interface: 'input',
      uiSchema: {
        title: '{{ t("Field name") }}',
        type: 'string',
        'x-component': 'Input',
      },
    },
    {
      type: 'string',
      name: 'description',
      interface: 'input',
      uiSchema: {
        title: '{{ t("Description") }}',
        type: 'string',
        'x-component': 'Input.TextArea',
      },
    },
  ],
};

export const fieldsTableSchema: ISchema = {
  type: 'object',
  properties: {
    [uid()]: {
      type: 'void',
      'x-component': 'ActionBar',
      'x-component-props': {
        style: {
          marginBottom: 16,
        },
      },
      properties: {
        delete: {
          type: 'void',
          title: '{{ t("Delete") }}',
          'x-component': 'Action',
          'x-visible': false,
          'x-component-props': {
            useAction: '{{ useBulkDestroyActionAndRefreshCM }}',
            confirm: {
              title: "{{t('Delete record')}}",
              content: "{{t('Are you sure you want to delete it?')}}",
            },
          },
        },
        syncfromDatabase: {
          type: 'void',
          title: '{{ t("Sync from database") }}',
          'x-component': 'SyncFieldsAction',
          'x-component-props': {
            type: 'primary',
          },
        },
        syncSQL: {
          type: 'void',
          title: '{{ t("Sync from database") }}',
          'x-component': 'SyncSQLFieldsAction',
          'x-component-props': {
            type: 'primary',
          },
        },
        create: {
          type: 'void',
          title: '{{ t("Add new") }}',
          'x-component': 'AddCollectionField',
          'x-component-props': {
            type: 'primary',
          },
        },
      },
    },
    [uid()]: {
      type: 'void',
      'x-uid': 'input',
      'x-component': 'Table.Void',
      'x-component-props': {
        pagination: false,
        rowKey: 'name',
        rowSelection: {
          type: 'checkbox',
        },
        dragSort: false,
        useDataSource: '{{ useDataSource }}',
      },
      properties: {
        column1: {
          type: 'void',
          title: '{{ t("Field display name") }}',
          'x-component': 'Table.Column',
          properties: {
            'uiSchema.title': {
              type: 'string',
              'x-component': 'FieldTitleInput',
              'x-component-props': {
                handleFieldChange: '{{handleFieldChange}}',
              },
            },
          },
        },
        column2: {
          type: 'void',
          'x-decorator': 'Table.Column.Decorator',
          'x-component': 'Table.Column',
          properties: {
            name: {
              'x-component': 'CollectionField',
              'x-read-pretty': true,
            },
          },
        },
        column3: {
          type: 'void',
          'x-decorator': 'Table.Column.Decorator',
          'x-component': 'Table.Column',
          title: '{{t("Field type")}}',
          properties: {
            type: {
              'x-component': 'FieldType',
              'x-component-props': {
                handleFieldChange: '{{handleFieldChange}}',
              },
            },
          },
        },
        column4: {
          type: 'void',
          'x-decorator': 'Table.Column.Decorator',
          'x-component': 'Table.Column',
          title: `{{t("Field interface", { ns: "${NAMESPACE}" })}}`,
          properties: {
            interface: {
              'x-component': 'CollectionFieldInterfaceSelect',
              'x-component-props': {
                handleFieldChange: '{{handleFieldChange}}',
              },
            },
          },
        },
        column5: {
          type: 'void',
          'x-decorator': 'Table.Column.Decorator',
          'x-component': 'Table.Column',
          title: '{{t("Title field")}}',
          properties: {
            titleField: {
              'x-component': 'TitleField',
              'x-read-pretty': false,
              'x-component-props': {
                useProps: '{{useTitleFieldProps}}',
              },
            },
          },
        },
        column6: {
          type: 'void',
          'x-decorator': 'Table.Column.Decorator',
          'x-component': 'Table.Column',
          title: '{{ t("Description") }}',
          properties: {
            description: {
              'x-component': 'CollectionField',
              'x-read-pretty': true,
              'x-component-props': {
                ellipsis: true,
                style: {
                  width: 100,
                },
              },
            },
          },
        },
        column7: {
          type: 'void',
          title: '{{ t("Actions") }}',
          'x-component': 'Table.Column',
          properties: {
            actions: {
              type: 'void',
              'x-component': 'Space',
              'x-component-props': {
                split: '|',
              },
              properties: {
                update: {
                  type: 'void',
                  title: '{{ t("Edit") }}',
                  'x-component': 'EditCollectionField',
                  'x-component-props': {
                    role: 'button',
                    'aria-label': '{{ "edit-button-" + $record.name }}',
                    type: 'primary',
                  },
                },
                delete: {
                  type: 'void',
                  title: '{{ t("Delete") }}',
                  'x-disabled': '{{cm.useDeleteButtonDisabled()}}',
                  'x-component': 'Action.Link',
                  'x-component-props': {
                    confirm: {
                      title: "{{t('Delete record')}}",
                      content: "{{t('Are you sure you want to delete it?')}}",
                    },
                    useAction: '{{ useDestroyActionAndRefreshCM }}',
                  },
                  'x-reactions': [
                    {
                      dependencies: ['.interface'],
                      fulfill: {
                        state: {
                          visible: "{{ ['obo','oho','m2m','o2m','m2o'].includes($deps[0]) }}",
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
  },
};
