import { observer, useForm } from '@formily/react';
import { action } from '@formily/reactive';
import React from 'react';
import { useCollectionManager_deprecated } from '../../collection-manager';
import { SchemaComponent, useCompile } from '../../schema-component';

export const EnableChildCollections = observer(
  (props: any) => {
    const { useProps } = props;
    const { defaultValues, collectionName } = useProps();
    const form = useForm();
    const compile = useCompile();
    const { getChildrenCollections } = useCollectionManager_deprecated();
    const childrenCollections = getChildrenCollections(collectionName);

    const useAsyncDataSource = (service: any) => {
      return (field: any, options?: any) => {
        field.loading = true;
        // eslint-disable-next-line promise/catch-or-return
        service(field, options).then(
          action.bound((data: any) => {
            field.dataSource = data;
            field.loading = false;
            if (field.initialValue) {
              field.disabled = true;
            }
          }),
        );
      };
    };
    const loadData = async (field) => {
      const { childrenCollections: childCollections } = form.values?.enableChildren || {};
      return childrenCollections
        .filter((v) => {
          return !childCollections.find((k) => k.collection === v.name) || field.initialValue || v.name === field.value;
        })
        ?.map((collection: any) => ({
          label: compile(collection.title),
          value: collection.name,
        }));
    };
    return (
      <SchemaComponent
        schema={{
          type: 'object',
          properties: {
            childrenCollections: {
              type: 'array',
              default: defaultValues?.filter((v) => childrenCollections.find((k) => k.name === v.collection)),
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
                        'x-decorator': 'FormItem',
                        required: true,
                        'x-component': 'Select',
                        'x-component-props': {
                          style: {
                            width: 260,
                          },
                        },
                        'x-reactions': ['{{useAsyncDataSource(loadData)}}'],
                      },
                      title: {
                        type: 'string',
                        'x-decorator': 'FormItem',
                        'x-component': 'Input',
                        'x-component-props': {
                          style: {
                            width: 235,
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
        scope={{ useAsyncDataSource, loadData }}
      />
    );
  },
  { displayName: 'EnableChildCollections' },
);
