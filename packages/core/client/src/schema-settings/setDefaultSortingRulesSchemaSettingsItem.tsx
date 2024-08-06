/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrayItems } from '@formily/antd-v5';
import { ISchema } from '@formily/json-schema';
import { useField, useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { useTableBlockContext } from '../block-provider';
import { useCollection_deprecated, useSortFields } from '../collection-manager';
import { useDesignable } from '../schema-component';
import { SchemaSettingsItemType } from '../application';
import { useCollection } from '../data-source';

export const setDefaultSortingRulesSchemaSettingsItem: SchemaSettingsItemType = {
  name: 'SetDefaultSortingRules',
  type: 'modal',
  useComponentProps() {
    const { name } = useCollection_deprecated();
    const field = useField();
    const fieldSchema = useFieldSchema();
    const sortFields = useSortFields(name);
    const { service } = useTableBlockContext();
    const { t } = useTranslation();
    const { dn } = useDesignable();
    const defaultSort = fieldSchema?.['x-decorator-props']?.params?.sort || [];
    const sort = defaultSort?.map((item: string) => {
      return item?.startsWith('-')
        ? {
            field: item.substring(1),
            direction: 'desc',
          }
        : {
            field: item,
            direction: 'asc',
          };
    });

    return {
      title: t('Set default sorting rules'),
      components: { ArrayItems },
      schema: {
        type: 'object',
        title: t('Set default sorting rules'),
        properties: {
          sort: {
            type: 'array',
            default: sort,
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
                    field: {
                      type: 'string',
                      enum: sortFields,
                      required: true,
                      'x-decorator': 'FormItem',
                      'x-component': 'Select',
                      'x-component-props': {
                        style: {
                          width: 260,
                        },
                      },
                    },
                    direction: {
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-component': 'Radio.Group',
                      'x-component-props': {
                        optionType: 'button',
                      },
                      enum: [
                        {
                          label: t('ASC'),
                          value: 'asc',
                        },
                        {
                          label: t('DESC'),
                          value: 'desc',
                        },
                      ],
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
                title: t('Add sort field'),
                'x-component': 'ArrayItems.Addition',
              },
            },
          },
        },
      } as ISchema,
      onSubmit: ({ sort }) => {
        const sortArr = sort.map((item) => {
          return item.direction === 'desc' ? `-${item.field}` : item.field;
        });
        const params = field.decoratorProps.params || {};
        params.sort = sortArr;
        field.decoratorProps.params = params;
        fieldSchema['x-decorator-props']['params'] = params;
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-decorator-props': fieldSchema['x-decorator-props'],
          },
        });
        service.run({ ...service.params?.[0], sort: sortArr });
      },
    };
  },
  useVisible() {
    const field = useField();
    const { dragSort } = field.decoratorProps;
    return !dragSort;
  },
};
