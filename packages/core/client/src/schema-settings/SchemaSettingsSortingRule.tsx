import { ISchema, useField, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCollectionManager_deprecated, useCollection_deprecated, useDesignable, useSortFields } from '..';
import { SchemaSettingsModalItem } from './SchemaSettings';
import { ArrayItems } from '@formily/antd-v5';

export const SchemaSettingsSortingRule = function SortRuleConfigure(props) {
  const field = useField();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const currentSchema = useFieldSchema();
  const { getField } = useCollection_deprecated();
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  const fieldSchema = props?.fieldSchema ?? currentSchema;
  const collectionField = getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
  const sortFields = useSortFields(collectionField?.target);
  const defaultSort = fieldSchema['x-component-props']?.service?.params?.sort || [];
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
  return (
    <SchemaSettingsModalItem
      title={t('Set default sorting rules')}
      components={{ ArrayItems }}
      schema={
        {
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
        } as ISchema
      }
      onSubmit={({ sort }) => {
        const sortArr = sort.map((item) => {
          return item.direction === 'desc' ? `-${item.field}` : item.field;
        });

        // 把列中的所有 field 实例找出来，进行更新
        field.query(new RegExp(`[0-9]+\\.${fieldSchema.name}$`)).forEach((item) => {
          _.set(item, 'componentProps.service.params.sort', sortArr);
        });
        _.set(fieldSchema, 'x-component-props.service.params.sort', sortArr);
        props?.onSubmitCallBack?.(sortArr);
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-component-props': fieldSchema['x-component-props'],
          },
        });
      }}
    />
  );
};
