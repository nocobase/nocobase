/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useForm } from '@formily/react';
import { action } from '@formily/reactive';
import React from 'react';
import { useCollectionManager_deprecated } from '../../collection-manager';
import { withDynamicSchemaProps } from '../../hoc/withDynamicSchemaProps';
import { SchemaComponent, useCompile, useProps } from '../../schema-component';

export const EnableChildCollections = withDynamicSchemaProps(
  observer((props: any) => {
    // 新版 UISchema（1.0 之后）中已经废弃了 useProps，这里之所以继续保留是为了兼容旧版的 UISchema
    const { defaultValues, collectionName } = useProps(props);

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
  }),
  { displayName: 'EnableChildCollections' },
);
