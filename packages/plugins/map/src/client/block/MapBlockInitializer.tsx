import { TableOutlined } from '@ant-design/icons';
import { DataBlockInitializer, SchemaComponent, SchemaComponentOptions, useCollectionManager } from '@nocobase/client';
import { SchemaOptionsContext } from '@formily/react';
import { FormDialog, FormLayout } from '@formily/antd';
import React, { useContext } from 'react';
import { useMapTranslation } from '../locale';
import { createMapBlockSchema } from './utils';

export const MapBlockInitializer = (props) => {
  const { insert } = props;
  const options = useContext(SchemaOptionsContext);
  const { getCollectionFieldsOptions } = useCollectionManager();
  const { t } = useMapTranslation();

  return (
    <DataBlockInitializer
      {...props}
      componentType={'Map'}
      icon={<TableOutlined />}
      onCreateBlockSchema={async ({ item }) => {
        const mapFieldOptions = getCollectionFieldsOptions(item.name, ['point', 'lineString', 'polygon']);
        const markerFieldOptions = getCollectionFieldsOptions(item.name, 'string');
        const values = await FormDialog(t('Create map block'), () => {
          return (
            <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
              <FormLayout layout={'vertical'}>
                <SchemaComponent
                  schema={{
                    properties: {
                      field: {
                        title: t('Map field'),
                        enum: mapFieldOptions,
                        required: true,
                        'x-component': 'Select',
                        'x-decorator': 'FormItem',
                      },
                      marker: {
                        title: t('Marker field'),
                        enum: markerFieldOptions,
                        'x-component': 'Select',
                        'x-decorator': 'FormItem',
                      },
                      // scale: {
                      //   title: t('Scale level'),
                      //   default: 16,
                      //   'x-component': 'InputNumber',
                      //   'x-decorator': 'FormItem',
                      //   'x-component-props': {
                      //     precision: 0,
                      //   },
                      // },
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
          createMapBlockSchema({
            collection: item.name,
            fieldNames: {
              ...values,
            },
          }),
        );
      }}
      title={t('Map block')}
    />
  );
};
