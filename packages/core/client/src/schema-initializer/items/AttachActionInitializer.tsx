import React, { useContext } from 'react';
import {
  ActionContext,
  useBlockAssociationContext,
  useBlockRequestContext,
  useBlockResource,
  useActionContext,
  useTableBlockContext,
  useDesignable,
  useCollectionManager,
  CollectionFieldContext,
} from '@nocobase/client';
import { uid } from '@formily/shared';
import { useCollection } from '@nocobase/client';
import { ISchema, useForm, useField, Schema, useFieldSchema } from '@formily/react';
import { ActionInitializer } from './ActionInitializer';

export const AttachActionInitializer = (props) => {
  const { name } = useCollection();
  const { dn } = useDesignable();
  const ctx = useTableBlockContext();
  const ctx1 = useContext(CollectionFieldContext);
  const ctx2 = useBlockResource();
  const association = useBlockAssociationContext();

  const { getCollectionJoinField, getCollectionFields } = useCollectionManager();
  const fields = getCollectionFields(name);

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
      useProps: '{{ useTableFieldProps }}',
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
          grid: {
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'AssociateTableInitializers',
            'x-initializer-props': {
              association,
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
                        // console.log('form.values', JSON.stringify(form.values, null, 2));
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
                  useProps: '{{ usePickActionProps }}',
                  useAction() {
                    const form = useForm();
                    const ctx = useActionContext();
                    const field = useField();
                    // console.log(ctx, form, field);
                    return {
                      async run() {
                        const { title } = form.values;
                        ctx.setVisible(false);
                        dn.refresh();
                      },
                    };
                  },
                },
                'x-action': 'submit',
                'x-designer': 'Action.Designer',
              },
            },
          },
        },
      },
    },
  };

  return <ActionInitializer {...props} schema={schema} />;
};
