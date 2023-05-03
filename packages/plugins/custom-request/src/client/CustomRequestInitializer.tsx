import { TableOutlined } from '@ant-design/icons';
import { DataBlockInitializer, SchemaComponent, SchemaComponentOptions, useCollectionManager } from '@nocobase/client';
import { SchemaOptionsContext } from '@formily/react';
import { FormDialog, FormLayout } from '@formily/antd';
import React, { useContext } from 'react';
import { useCustomRequestTranslation } from './locale';
import { createCustomRequestSchema } from './utils';

export const CustomRequestInitializer = (props) => {
  const { insert } = props;
  const options = useContext(SchemaOptionsContext);
  const { getCollectionFieldsOptions } = useCollectionManager();
  const { t } = useCustomRequestTranslation();

  return (
    <DataBlockInitializer
      {...props}
      componentType={'CustomRequest'}
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
                        default: mapFieldOptions[0]?.value,
                      },
                      marker: {
                        title: t('Marker field'),
                        enum: markerFieldOptions,
                        'x-component': 'Select',
                        'x-decorator': 'FormItem',
                        'x-reactions': (field) => {
                          const value = field.form.values.field;
                          console.log('🚀 ~ file: CustomRequestInitializer.tsx:45 ~ values ~ value:', value);
                          console.log(
                            '🚀 ~ file: CustomRequestInitializer.tsx:50 ~ values ~ mapFieldOptions:',
                            mapFieldOptions,
                          );

                          if (!value) {
                            return;
                          }
                          const item = mapFieldOptions.find((item) => item.value === value).type;
                          field.hidden = item !== 'point';
                        },
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
          createCustomRequestSchema({
            collection: item.name,
            fieldNames: {
              ...values,
            },
          }),
        );
      }}
      title={t('Custom request')}
    />
  );
};
