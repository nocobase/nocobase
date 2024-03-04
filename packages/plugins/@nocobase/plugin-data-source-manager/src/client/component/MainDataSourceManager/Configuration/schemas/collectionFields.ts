import { ISchema } from '@formily/react';
import { CollectionFieldInterfaceTag, CollectionOptions } from '@nocobase/client';

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
        title: '{{ t("Field interface") }}',
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

export const collectionFieldSchema: ISchema = {
  type: 'void',
  'x-collection-field': 'collections.fields',
  'x-decorator': 'ResourceActionProvider',
  'x-decorator-props': {
    association: {
      sourceKey: 'name',
      targetKey: 'name',
    },
    collection,
    request: {
      resource: 'collections.fields',
      action: 'list',
      params: {
        paginate: false,
        filter: {
          $or: [{ 'interface.$not': null }, { 'options.source.$notEmpty': true }],
        },
        sort: ['sort'],
        // appends: ['uiSchema'],
      },
    },
  },
  properties: {
    summary: {
      type: 'void',
      'x-component': 'FieldSummary',
    },
    actions: {
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
          'x-component-props': {
            useAction: '{{ cm.useBulkDestroyActionAndRefreshCM }}',
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
    table: {
      type: 'void',
      'x-uid': 'input',
      'x-component': 'CollectionFieldsTable',
      'x-component-props': {
        rowKey: 'name',
        rowSelection: {
          type: 'checkbox',
        },
        useDataSource: '{{ cm.useDataSourceFromRAC }}',
      },
      properties: {
        column1: {
          type: 'void',
          title: '{{ t("Field display name") }}',
          'x-component': 'Table.Column',
          properties: {
            'uiSchema.title': {
              type: 'number',
              'x-component': 'Input',
              'x-read-pretty': true,
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
          title: '{{t("Field interface")}}',
          properties: {
            interface: {
              'x-component': CollectionFieldInterfaceTag,
              'x-read-pretty': true,
            },
          },
        },
        column4: {
          type: 'void',
          'x-decorator': 'Table.Column.Decorator',
          'x-component': 'Table.Column',
          title: '{{ t("Description") }}',
          properties: {
            interface: {
              'x-component': 'CollectionField',
              'x-read-pretty': true,
            },
          },
        },
        column5: {
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
                    useAction: '{{ cm.useDestroyActionAndRefreshCM }}',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export const overridingSchema: ISchema = {
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
        overriding: {
          type: 'void',
          title: '{{ t("Overriding") }}',
          'x-component': 'OverridingCollectionField',
          'x-component-props': {
            type: 'primary',
            currentCollection: '{{ currentCollection }}',
          },
        },
        view: {
          type: 'void',
          title: '{{ t("View") }}',
          'x-component': 'ViewCollectionField',
          'x-component-props': {
            type: 'primary',
          },
        },
      },
    },
  },
};
