/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext, useEffect } from 'react';
import { ISchema, useField } from '@formily/react';
import { uid } from '@formily/shared';
import {
  SchemaComponent,
  CollectionOptions,
  useRecord,
  ResourceActionProvider,
  ResourceActionContext,
  DataSourceContext,
} from '@nocobase/client';
import { useParams } from 'react-router-dom';

const collection: CollectionOptions = {
  name: 'fields',
  fields: [
    {
      type: 'string',
      name: 'interface',
      interface: 'input',
      uiSchema: {
        title: `{{t("Field interface")}}`,
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
  ],
};

const fieldsTableSchema: ISchema = {
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
                handleFieldChange: '{{enqueueChange}}',
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
        column4: {
          type: 'void',
          'x-decorator': 'Table.Column.Decorator',
          'x-component': 'Table.Column',
          title: `{{t("Field interface")}}`,
          properties: {
            interface: {
              'x-component': 'CollectionFieldInterfaceSelect',
              'x-component-props': {
                handleFieldChange: '{{enqueueChange}}',
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
              'x-use-component-props': 'useTitleFieldProps',
              'x-read-pretty': false,
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
                },
              },
            },
          },
        },
      },
    },
  },
};

export const JSONDocFields: React.FC = () => {
  const { name: dataSourceKey } = useParams();
  const record = useRecord();
  const useDataSource = (options) => {
    const service = useContext(ResourceActionContext);
    const field = useField();
    useEffect(() => {
      if (!service.loading) {
        options?.onSuccess(service.data);
        field.componentProps.dragSort = !!service.dragSort;
      }
    }, [service.loading]);
    return service;
  };
  const url = !dataSourceKey
    ? `collections/${record.target}/fields:list`
    : `dataSourcesCollections/${dataSourceKey}.${record.target}/fields:list`;
  const resourceActionProps = {
    association: {
      sourceKey: 'name',
      targetKey: 'name',
    },
    dragSort: false,
    collection,
    request: {
      url,
      params: {
        paginate: false,
        filter: {
          'interface.$not': null,
          'name.$not': record.targetKey || '__json_index',
        },
        sort: ['sort'],
      },
    },
  };
  return (
    <ResourceActionProvider {...resourceActionProps}>
      <SchemaComponent schema={fieldsTableSchema} scope={{ useDataSource }} />
    </ResourceActionProvider>
  );
};
