/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext, useEffect } from 'react';
import { ISchema, useField, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import {
  SchemaComponent,
  CollectionOptions,
  useRecord,
  ResourceActionProvider,
  ResourceActionContext,
  useRequest,
  useAPIClient,
} from '@nocobase/client';
import { useParams } from 'react-router-dom';
import { AddJSONDocField } from './AddJSONDocField';
import { FieldTitleInput } from './FieldTitleInput';
import { EditJSONDocField } from './EditJSONDocField';
import { ArrayField } from '@formily/core';
import { FieldInterfaceSelect } from './FieldInterfaceSelect';
import { useFieldInterfaceOptions } from '../field-interface-manager';
import { JSONDocFieldsContext, JSONDocFieldsProvider } from './JSONDocFieldsProvider';

const useDestroyJSONDocField = () => {
  const record = useRecord();
  const { del } = useContext(JSONDocFieldsContext);
  return {
    run() {
      del(record.key);
    },
  };
};

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
        create: {
          type: 'void',
          'x-align': 'left',
          title: '{{ t("Add new") }}',
          'x-component': 'AddJSONDocField',
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
        column4: {
          type: 'void',
          'x-decorator': 'Table.Column.Decorator',
          'x-component': 'Table.Column',
          title: `{{t("Field interface")}}`,
          properties: {
            interface: {
              'x-component': 'Select',
              'x-read-pretty': true,
              enum: '{{ interfaceOptions }}',
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
                  'x-component': 'EditJSONDocField',
                  'x-component-props': {
                    role: 'button',
                    'aria-label': '{{ "edit-button-" + $record.name }}',
                    type: 'primary',
                  },
                },
                delete: {
                  type: 'void',
                  title: '{{ t("Delete") }}',
                  'x-component': 'Action.Link',
                  'x-component-props': {
                    confirm: {
                      title: "{{t('Delete record')}}",
                      content: "{{t('Are you sure you want to delete it?')}}",
                    },
                    useAction: '{{ useDestroyJSONDocField}}',
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

const useDataSource = (options) => {
  const { field } = useContext(JSONDocFieldsContext);
  const record = useRecord();
  const { name: dataSourceKey } = useParams();
  const url = !dataSourceKey
    ? `collections/${record.target}/fields:list`
    : `dataSourcesCollections/${dataSourceKey}.${record.target}/fields:list`;
  const api = useAPIClient();
  const { run, data, loading } = useRequest(
    () =>
      api
        .request({
          url,
          params: {
            paginate: false,
            filter: {
              'interface.$not': null,
              'name.$not': record.targetKey || '__json_index',
            },
            sort: ['sort'],
          },
        })
        .then((res) => res?.data?.data || []),
    {
      manual: true,
    },
  );
  useEffect(() => {
    if (record.target) {
      run();
    }
  }, [record.target]);
  useEffect(() => {
    if (!loading) {
      field.value = (data as any) || [];
    }
  }, [loading, field, data]);
  useEffect(() => {
    options?.onSuccess({ data: [...field.value] });
  }, [field.value]);
};

export const JSONDocFields: React.FC = () => {
  const { name: dataSourceKey } = useParams();
  const record = useRecord();
  const form = useForm();
  const field = useField<ArrayField>();
  const interfaceOptions = useFieldInterfaceOptions();
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
    <JSONDocFieldsProvider field={field} form={form}>
      <ResourceActionProvider {...resourceActionProps}>
        <SchemaComponent
          schema={fieldsTableSchema}
          scope={{ useDataSource, interfaceOptions, useDestroyJSONDocField }}
          components={{ AddJSONDocField, FieldTitleInput, FieldInterfaceSelect, EditJSONDocField }}
        />
      </ResourceActionProvider>
    </JSONDocFieldsProvider>
  );
};
