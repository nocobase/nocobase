import React,{useContext} from 'react';
import {
  ActionContext,
  useBlockRequestContext,
  useBlockResource,
  useActionContext,
  useTableBlockContext,
  useDesignable,
  useCollectionManager,
  CollectionFieldContext
} from '@nocobase/client';
import { ActionInitializer } from './ActionInitializer';
import { ISchema, useForm, useField, Schema, useFieldSchema } from '@formily/react';

import { uid } from '@formily/shared';
import { useCollection } from '@nocobase/client';
// import {useAssociationNames} from '../../block-provider/TableBlockProvider'

const useCloseAction = () => {
  const { setVisible } = useActionContext();
  const form = useForm();
  return {
    async run() {
      setVisible(false);
      form.submit((values) => {
        console.log(values);
      });
    },
  };
};

const recursiveParent = (schema: Schema, component) => {
  return schema['x-component'] === component
    ? schema
    : schema.parent
    ? recursiveParent(schema.parent, component)
    : null;
};

const useAssociationNames = (collection) => {
  const { getCollectionFields } = useCollectionManager();
  const names = getCollectionFields(collection)
    ?.filter((field) => field.target)
    .map((field) => field.name);
  return names;
};

export const AttachActionInitializer = (props) => {
  const { name } = useCollection();
  const { dn } = useDesignable();
  const ctx = useTableBlockContext();
  const ctx1 = useContext(CollectionFieldContext);
  const ctx2=useBlockResource()
  const { resource, service } = useBlockRequestContext();
  const { getCollectionJoinField, getCollectionFields } = useCollectionManager();
  const fields = getCollectionFields(name);
  console.log(fields, resource);

  const schema: ISchema = {
    type: 'void',
    title: '{{ t("Attach") }}',
    'x-action': 'attach',
    'x-designer': 'Action.Designer',
    'x-component': 'Action',
    'x-decorator': 'ACLActionProvider',
    'x-component-props': {
      icon: 'LinkOutlined',
      openMode: 'drawer',
      useProps: '{{ useTableBlockProps }}',
    },
    'x-acl-action-props': {
      skipScopeCheck: true,
    },
    properties: {
      drawer: {
        type: 'void',
        title: '{{ t("Select record") }}',
        version: '2.0',
        'x-component': 'Action.Drawer',
        properties: {
          block: {
            type: 'void',
            'x-decorator': 'TableSelectorProvider',
            'x-designer': 'TableSelectorDesigner',
            'x-component': 'BlockItem',
            'x-acl-action': `${name}:list`,
            'x-decorator-props': {
              action: 'list',
              params: { pageSize: 20,filter:{orderGid:{$is: null,}} },
              rowKey: 'id',
              dragSort: false,
              resource: name,
              showIndex: true,
              collection: name,
            },
            properties: {
              actions: {
                type: 'void',
                'x-initializer': 'TableActionInitializers',
                'x-component': 'ActionBar',
                'x-component-props': {
                  style: {
                    marginBottom: 16,
                  },
                },
                properties: {},
              },
              table: {
                type: 'array',
                'x-initializer': 'TableColumnInitializers',
                'x-component': 'TableV2',
                'x-component-props': {
                  rowKey: 'id',
                  rowSelection: {
                    type: 'checkbox',
                  },
                  useProps: '{{ useTableFieldProps }}',
                },
                'x-decorator': 'TableBlockProvider',
                'x-async': false,
                properties: {
                  actions: {
                    type: 'void',
                    title: '{{ t("Actions") }}',
                    'x-action-column': 'actions',
                    'x-decorator': 'TableV2.Column.ActionBar',
                    'x-component': 'TableV2.Column',
                    'x-designer': 'TableV2.ActionColumnDesigner',
                    'x-initializer': 'TableActionColumnInitializers',
                    properties: {
                      actions: {
                        type: 'void',
                        'x-decorator': 'DndContext',
                        'x-component': 'Space',
                        'x-component-props': {
                          split: '|',
                        },
                        properties: {},
                      },
                    },
                  },
                },
              },
            },
          },
          footer: {
            type: 'void',
            'x-component': 'Action.Drawer.Footer',
            properties: {
              cancel: {
                title: '{{t("Cancel")}}',
                'x-component': 'Action',
                'x-component-props': {
                  useAction() {
                    const form = useForm();
                    const ctx = useActionContext();
                    return {
                      async run() {
                        ctx.setVisible(false);
                        console.log('form.values', JSON.stringify(form.values, null, 2));
                      },
                    };
                  },
                },
              },
              submit: {
                title: '{{t("Submit")}}',
                'x-component': 'Action',
                'x-component-props': {
                  type: 'primary',
                  useAction() {
                    const form = useForm();
                    const ctx = useActionContext();
                    const field = useField();
                    return {
                      async run() {
                        const { title } = form.values;

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
      },
    },
  };

  return <ActionInitializer {...props} schema={schema} scope={{ useCloseAction }} />;
};
