import { FormOutlined } from '@ant-design/icons';
import { FormLayout } from '@formily/antd-v5';
import { SchemaOptionsContext } from '@formily/react';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { useGlobalTheme } from '../../global-theme';
import { FormDialog, SchemaComponent, SchemaComponentOptions, useCompile } from '../../schema-component';
import { createCalendarBlockSchema } from '../utils';
import { DataBlockInitializer } from './DataBlockInitializer';
import {
  getCollectionFieldsOptions,
  useCollectionManagerV2,
  useSchemaInitializer,
  useSchemaInitializerItem,
} from '../../application';

export const CalendarBlockInitializer = () => {
  const { insert } = useSchemaInitializer();
  const { t } = useTranslation();
  const cm = useCollectionManagerV2();
  const options = useContext(SchemaOptionsContext);
  const { theme } = useGlobalTheme();
  const itemConfig = useSchemaInitializerItem();
  const compile = useCompile();

  return (
    <DataBlockInitializer
      {...itemConfig}
      componentType={'Calendar'}
      icon={<FormOutlined />}
      onCreateBlockSchema={async ({ item }) => {
        const stringFieldsOptions = getCollectionFieldsOptions(item.name, 'string', {
          collectionManager: cm,
          compile,
        });
        const dateFieldsOptions = getCollectionFieldsOptions(item.name, 'date', {
          association: ['o2o', 'obo', 'oho', 'm2o'],
          collectionManager: cm,
          compile,
        });

        const values = await FormDialog(
          t('Create calendar block'),
          () => {
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
                          default: cm.getCollectionField(`${item.name}.createdAt`) ? 'createdAt' : null,
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
          },
          theme,
        ).open({
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
