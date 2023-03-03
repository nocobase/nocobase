import { css } from '@emotion/css';
import { observer, useFieldSchema } from '@formily/react';
import React from 'react';
import { useChildrenCollections } from '../../collection-manager/action-hooks';
import { SchemaComponent } from '../../schema-component';

export const EnableChildCollections = observer((props: any) => {
  const { useProps } = props;
  const { defaultValues, collectionName } = useProps();
  const totalChildCollections = useChildrenCollections(collectionName);

  return (
    <SchemaComponent
      schema={{
        type: 'object',
        properties: {
          childrenCollections: {
            type: 'array',
            default: defaultValues,
            'x-component': 'ArrayItems',
            'x-decorator': 'FormItem',
            items: {
              type: 'object',
              properties: {
                space: {
                  type: 'void',
                  'x-component': 'Space',
                  properties: {
                    sort: {
                      type: 'void',
                      'x-decorator': 'FormItem',
                      'x-component': 'ArrayItems.SortHandle',
                    },
                    collection: {
                      type: 'string',
                      enum: totalChildCollections,
                      'x-decorator': 'FormItem',
                      required: true,
                      'x-component': 'Select',
                      'x-component-props': {
                        style: {
                          width: 250,
                        },
                      },
                    },
                    title: {
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                      'x-component-props': {
                        style: {
                          width: 230,
                        },
                      },
                    },
                    remove: {
                      type: 'void',
                      'x-decorator': 'FormItem',
                      'x-component': 'ArrayItems.Remove',
                    },
                  },
                },
              },
            },
            properties: {
              add: {
                type: 'void',
                title: '{{ t("Add collection") }}',
                'x-component': 'ArrayItems.Addition',
              },
            },
          },
        },
      }}
    />
  );
});
