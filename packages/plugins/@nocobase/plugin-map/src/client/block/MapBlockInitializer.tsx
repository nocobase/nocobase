import { TableOutlined } from '@ant-design/icons';
import { FormLayout } from '@formily/antd-v5';
import { SchemaOptionsContext } from '@formily/react';
import {
  DataBlockInitializer,
  FormDialog,
  SchemaComponent,
  SchemaComponentOptions,
  useCollectionManager,
  useGlobalTheme,
  useSchemaInitializer,
  useSchemaInitializerItem,
} from '@nocobase/client';
import React, { useContext } from 'react';
import { useMapTranslation } from '../locale';
import { createMapBlockSchema, findNestedOption } from './utils';

export const MapBlockInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { insert } = useSchemaInitializer();
  const options = useContext(SchemaOptionsContext);
  const { getCollectionFieldsOptions } = useCollectionManager();
  const { t } = useMapTranslation();
  const { theme } = useGlobalTheme();
  return (
    <DataBlockInitializer
      componentType={'Map'}
      icon={<TableOutlined />}
      onCreateBlockSchema={async ({ item }) => {
        const mapFieldOptions = getCollectionFieldsOptions(item.name, ['point', 'lineString', 'polygon'], {
          association: ['o2o', 'obo', 'oho', 'o2m', 'm2o', 'm2m'],
        });
        const markerFieldOptions = getCollectionFieldsOptions(item.name, 'string');
        const values = await FormDialog(
          t('Create map block'),
          () => {
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
                          'x-component': 'Cascader',
                          'x-decorator': 'FormItem',
                          default: mapFieldOptions.length
                            ? [mapFieldOptions[0].value, mapFieldOptions[0].children?.[0].value].filter(
                                (v) => v !== undefined && v !== null,
                              )
                            : [],
                        },
                        marker: {
                          title: t('Marker field'),
                          enum: markerFieldOptions,
                          'x-component': 'Select',
                          'x-decorator': 'FormItem',
                          'x-reactions': (field) => {
                            const value = field.form.values.field;
                            if (!value?.length) {
                              return;
                            }
                            const item = findNestedOption(value, mapFieldOptions);

                            if (item) {
                              field.hidden = item.type !== 'point';
                            }
                          },
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
          createMapBlockSchema({
            collection: item.name,
            fieldNames: {
              ...values,
            },
            settings: 'blockSettings:map',
          }),
        );
      }}
      title={t('Map block')}
      {...itemConfig}
    />
  );
};
