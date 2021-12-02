import { Schema } from '@formily/react';
import { uid } from '@formily/shared';
import { interfaces } from '../database-field/interfaces';
import { ISchema } from '..';

export const fieldsToSortColumns = (fields: any[]) => {
  const dataSource = [];

  fields.forEach((field) => {
    const fieldOption = interfaces.get(field.interface);
    if (!fieldOption?.sortable) {
      return;
    }
    dataSource.push({
      value: field.name,
      label: field?.uiSchema?.title,
    });
  });

  return dataSource;
};

export const fieldsToFilterColumns = (fields: any[], options: any = {}) => {
  const { fieldNames = [] } = options;
  const properties = {};
  fields.forEach((field, index) => {
    if (fieldNames?.length && !fieldNames.includes(field.name)) {
      return;
    }
    const fieldOption = interfaces.get(field.interface);
    if (!fieldOption?.operations) {
      return;
    }
    properties[`column${index}`] = {
      type: 'void',
      title: field?.uiSchema?.title,
      'x-component': 'Filter.Column',
      'x-component-props': {
        operations: fieldOption.operations,
      },
      properties: {
        [field.name]: {
          ...field.uiSchema,
          'x-decorator': 'FormilyFormItem',
          title: null,
        },
      },
    };
  });
  return properties;
};

export const generateActionSchema = (type) => {
  const actions: { [key: string]: ISchema } = {
    filter: {
      key: uid(),
      name: uid(),
      type: 'void',
      title: "{{ t('Filter') }}",
      'x-align': 'left',
      'x-decorator': 'AddNew.Displayed',
      'x-decorator-props': {
        displayName: 'filter',
      },
      'x-component': 'Table.Filter',
      'x-designable-bar': 'Table.Filter.DesignableBar',
      'x-component-props': {
        fieldNames: [],
      },
    },
    export: {
      key: uid(),
      type: 'void',
      name: uid(),
      title: "{{ t('Export') }}",
      'x-align': 'right',
      'x-decorator': 'AddNew.Displayed',
      'x-decorator-props': {
        displayName: 'export',
      },
      'x-action-type': 'export',
      'x-component': 'Action',
      'x-designable-bar': 'Table.ExportActionDesignableBar',
      'x-component-props': {
        fieldNames: [],
        icon: 'ExportOutlined',
        useAction: '{{ Table.useTableExportAction }}',
      },
    },
    create: {
      key: uid(),
      type: 'void',
      name: uid(),
      title: "{{ t('Add new') }}",
      'x-align': 'right',
      'x-decorator': 'AddNew.Displayed',
      'x-decorator-props': {
        displayName: 'create',
      },
      'x-component': 'Action',
      'x-component-props': {
        type: 'primary',
        icon: 'PlusOutlined',
      },
      'x-designable-bar': 'Table.Action.DesignableBar',
      properties: {
        modal: {
          type: 'void',
          title: "{{ t('Add record') }}",
          'x-decorator': 'Form',
          'x-component': 'Action.Drawer',
          'x-component-props': {
            useOkAction: '{{ Table.useTableCreateAction }}',
          },
          properties: {
            [uid()]: {
              type: 'void',
              'x-component': 'Grid',
              'x-component-props': {
                addNewComponent: 'AddNew.FormItem',
              },
            },
          },
        },
      },
    },
    destroy: {
      key: uid(),
      type: 'void',
      name: uid(),
      title: "{{ t('Delete') }}",
      'x-align': 'right',
      'x-decorator': 'AddNew.Displayed',
      'x-decorator-props': {
        displayName: 'destroy',
      },
      'x-action-type': 'destroy',
      'x-component': 'Action',
      'x-designable-bar': 'Table.Action.DesignableBar',
      'x-component-props': {
        confirm: {
          title: "{{ t('Delete record') }}",
          content: "{{ t('Are you sure you want to delete it?') }}",
        },
        useAction: '{{ Table.useTableDestroyAction }}',
      },
    },
    view: {},
    update: {},
  };
  return actions[type];
};

export function isColumn(schema: Schema) {
  return ['Table.Column'].includes(schema['x-component']);
}

export function isColumnComponent(component: string) {
  return ['Table.Operation', 'Table.Column'].includes(component);
}

export function isOperationColumn(schema: Schema) {
  return ['Table.Operation'].includes(schema['x-component']);
}
