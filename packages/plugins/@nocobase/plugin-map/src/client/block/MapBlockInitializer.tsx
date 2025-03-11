/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { TableOutlined } from '@ant-design/icons';
import { FormLayout } from '@formily/antd-v5';
import { SchemaOptionsContext } from '@formily/react';
import {
  DataBlockInitializer,
  FormDialog,
  SchemaComponent,
  SchemaComponentOptions,
  useCollectionManager_deprecated,
  useGlobalTheme,
  useSchemaInitializer,
  useSchemaInitializerItem,
} from '@nocobase/client';
import React, { useContext } from 'react';
import { useMapTranslation } from '../locale';
import { createMapBlockUISchema } from './createMapBlockUISchema';
import { findNestedOption } from './utils';

export const MapBlockInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { insert } = useSchemaInitializer();
  const options = useContext(SchemaOptionsContext);
  const { getCollectionFieldsOptions } = useCollectionManager_deprecated();
  const { t } = useMapTranslation();
  const { theme } = useGlobalTheme();

  return (
    <DataBlockInitializer
      componentType={`Map`}
      icon={<TableOutlined />}
      onCreateBlockSchema={async ({ item }) => {
        const mapFieldOptions = getCollectionFieldsOptions(item.name, ['point', 'lineString', 'polygon'], null, {
          association: ['o2o', 'obo', 'oho', 'o2m', 'm2o', 'm2m'],
          dataSource: item.dataSource,
        });
        const markerFieldOptions = getCollectionFieldsOptions(item.name, 'string', null, {
          dataSource: item.dataSource,
        });
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
          createMapBlockUISchema({
            collectionName: item.name,
            dataSource: item.dataSource,
            fieldNames: {
              ...values,
            },
          }),
        );
      }}
      title={t('Map block')}
      {...itemConfig}
    />
  );
};
