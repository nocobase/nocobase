/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { SchemaComponent } from '@nocobase/client';
import { Alert } from 'antd';
import { ArrayItems } from '@formily/antd-v5';
import { useT } from '../../locale';

const Description = () => {
  const t = useT();

  return (
    <Alert
      style={{
        marginBottom: 16,
      }}
      message={t('Data source settings description')}
      type="info"
    />
  );
};

export const DataSourceSettings: React.FC = () => {
  const t = useT();
  return (
    <SchemaComponent
      components={{ Description, ArrayItems }}
      schema={{
        type: 'void',
        properties: {
          desc: {
            type: 'void',
            'x-component': 'Description',
          },
          dataSourceSettings: {
            type: 'object',
            properties: {
              collections: {
                type: 'array',
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
                          'x-component': 'DataSourceCollectionCascader',
                          'x-component-props': {
                            style: {
                              width: '200px',
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
                    title: t('Add collection'),
                    'x-component': 'ArrayItems.Addition',
                  },
                },
              },
            },
          },
        },
      }}
    />
  );
};
