import React, { useContext } from 'react';
import { FormDialog, FormLayout } from '@formily/antd';
import { FormOutlined } from '@ant-design/icons';
import { SchemaOptionsContext } from '@formily/react';
import { useTranslation } from 'react-i18next';

import { useCollection, useCollectionManager } from '../../collection-manager';
import { SchemaComponent, SchemaComponentOptions, useCompile } from '../../schema-component';
import { createCalendarBlockSchema } from '../utils';
import { DataBlockInitializer } from './DataBlockInitializer';
import { CascaderProps } from 'antd';

export const CalendarBlockInitializer = (props) => {
  const { insert } = props;
  const { t } = useTranslation();
  const { getCollectionField, getCollectionFieldsOptions } = useCollectionManager();
  useCollectionManager;
  const options = useContext(SchemaOptionsContext);
  return (
    <DataBlockInitializer
      {...props}
      componentType={'Calendar'}
      icon={<FormOutlined />}
      onCreateBlockSchema={async ({ item }) => {
        const stringFieldsOptions = getCollectionFieldsOptions(item.name, 'string');
        const dateFieldsOptions = getCollectionFieldsOptions(item.name, 'date', true);

        const values = await FormDialog(t('Create calendar block'), () => {
          return (
            <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
              <FormLayout layout={'vertical'}>
                <SchemaComponent
                  schema={{
                    properties: {
                      title: {
                        title: t('Title field'),
                        enum: stringFieldsOptions,
                        required: true,
                        'x-component': 'Select',
                        'x-decorator': 'FormItem',
                      },
                      start: {
                        title: t('Start date field'),
                        enum: dateFieldsOptions,
                        required: true,
                        default: getCollectionField(`${item.name}.createdAt`) ? 'createdAt' : null,
                        'x-component': 'Cascader',
                        'x-decorator': 'FormItem',
                      },
                      end: {
                        title: t('End date field'),
                        enum: dateFieldsOptions,
                        'x-component': 'Cascader',
                        'x-decorator': 'FormItem',
                      },
                    },
                  }}
                />
              </FormLayout>
            </SchemaComponentOptions>
          );
        }).open({
          initialValues: {},
        });
        insert(
          createCalendarBlockSchema({
            collection: item.name,
            fieldNames: {
              ...values,
            },
          }),
        );
      }}
    />
  );
};
