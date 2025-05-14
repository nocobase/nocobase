/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { useMemo } from 'react';
import { Cascader, css, useCollection_deprecated } from '@nocobase/client';
import { useFields } from './useFields';

export const useShared = () => {
  const { name } = useCollection_deprecated();
  const fields = useFields(name);
  const options = useMemo(() => {
    return fields.map((v) => {
      return {
        name: v.name,
        title: v.title,
        children: v.children,
      };
    });
  }, []);
  console.log(fields);
  console.log(options);
  return {
    schema: {
      type: 'void',
      'x-component': 'Grid',
      properties: {
        exportSettings: {
          type: 'array',
          'x-component': 'ArrayItems',
          'x-decorator': 'FormItem',
          items: {
            type: 'object',
            properties: {
              space: {
                type: 'void',
                'x-component': 'Space',
                'x-component-props': {
                  className: css`
                    width: 100%;
                    & .ant-space-item:nth-child(2),
                    & .ant-space-item:nth-child(3) {
                      flex: 1;
                    }
                  `,
                },
                properties: {
                  sort: {
                    type: 'void',
                    'x-decorator': 'FormItem',
                    'x-component': 'ArrayItems.SortHandle',
                  },
                  dataIndex: {
                    type: 'array',
                    'x-decorator': 'FormItem',
                    'x-component': 'Cascader',
                    required: true,
                    'x-component-props': {
                      fieldNames: {
                        label: 'title',
                        value: 'name',
                        children: 'children',
                      },
                      // labelInValue: true,
                      changeOnSelect: false,
                    },
                    'x-use-component-props': () => {
                      return {
                        options,
                      };
                    },
                  },
                  title: {
                    type: 'string',
                    'x-decorator': 'FormItem',
                    'x-component': 'Input',
                    'x-component-props': {
                      placeholder: '{{ t("Custom column title") }}',
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
              title: '{{ t("Add exportable field") }}',
              'x-component': 'ArrayItems.Addition',
              'x-component-props': {
                className: css`
                  border-color: var(--colorSettings);
                  color: var(--colorSettings);
                  &.ant-btn-dashed:hover {
                    border-color: var(--colorSettings);
                    color: var(--colorSettings);
                  }
                `,
              },
            },
          },
        },
      },
    },
  };
};
