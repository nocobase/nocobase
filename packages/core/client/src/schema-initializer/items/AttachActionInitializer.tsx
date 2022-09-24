import React from 'react';
import {
  useBlockAssociationContext,
  useTableBlockContext,
  useCollection,
} from '@nocobase/client';
import { ISchema } from '@formily/react';
import { ActionInitializer } from './ActionInitializer';

export const AttachActionInitializer = (props) => {
  const { name } = useCollection();
  const association = useBlockAssociationContext();
  const { rowKey } = useTableBlockContext();

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
    },
    'x-acl-action-props': {
      skipScopeCheck: true,
    },
    properties: {
      drawer: {
        type: 'void',
        title: '{{ t("Select record") }}',
        version: '2.0',
        'x-component': 'Action.Container',
        'x-decorator': 'AssociateTableProvider',
        'x-decorator-props': {
          collection: name,
          resource: name,
          action: 'list',
          params: {
            pageSize: 20,
          },
          rowKey,
        },
        'x-component-props': {
          className: 'nb-record-picker-selector',
        },
        properties: {
          grid: {
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'AssociateTableInitializers',
          },
          footer: {
            'x-component': 'Action.Container.Footer',
            properties: {
              actions: {
                type: 'void',
                'x-component': 'ActionBar',
                'x-component-props': {},
                properties: {
                  submit: {
                    title: '{{ t("Submit") }}',
                    'x-action': 'submit',
                    'x-component': 'Action',
                    'x-designer': 'Action.Designer',
                    'x-decorator-props': {
                      association,
                    },
                    'x-component-props': {
                      type: 'primary',
                      htmlType: 'submit',
                      useProps: '{{ useBulkAetachActionProps }}',
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

  return <ActionInitializer {...props} schema={schema} />;
};
