/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormOutlined } from '@ant-design/icons';
import { FormLayout } from '@formily/antd-v5';
import { SchemaOptionsContext } from '@formily/react';
import {
  Collection,
  CollectionFieldOptions,
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
import { useTranslation } from '../../../locale';
import { createCalendarBlockUISchema } from '../createCalendarBlockUISchema';

export const CalendarBlockInitializer = ({
  filterCollections,
  onlyCurrentDataSource,
  hideSearch,
  createBlockSchema,
  showAssociationFields,
}: {
  filterCollections: (options: { collection?: Collection; associationField?: CollectionFieldOptions }) => boolean;
  onlyCurrentDataSource: boolean;
  hideSearch?: boolean;
  createBlockSchema?: (options: any) => any;
  showAssociationFields?: boolean;
}) => {
  const itemConfig = useSchemaInitializerItem();
  const { createCalendarBlock } = useCreateCalendarBlock();

  return (
    <DataBlockInitializer
      {...itemConfig}
      componentType={`Calendar`}
      icon={<FormOutlined />}
      onCreateBlockSchema={async (options) => {
        if (createBlockSchema) {
          return createBlockSchema(options);
        }
        createCalendarBlock(options);
      }}
      onlyCurrentDataSource={onlyCurrentDataSource}
      hideSearch={hideSearch}
      filter={filterCollections}
      showAssociationFields={showAssociationFields}
    />
  );
};

export const useCreateCalendarBlock = () => {
  const { insert } = useSchemaInitializer();
  const { t } = useTranslation();
  const { getCollectionField, getCollectionFieldsOptions } = useCollectionManager_deprecated();
  const options = useContext(SchemaOptionsContext);
  const { theme } = useGlobalTheme();

  const createCalendarBlock = async ({ item }) => {
    const stringFieldsOptions = getCollectionFieldsOptions(item.name, 'string', { dataSource: item.dataSource });
    const dateFieldsOptions = getCollectionFieldsOptions(
      item.name,
      ['date', 'datetime', 'dateOnly', 'datetimeNoTz', 'unixTimestamp'],
      {
        association: ['o2o', 'obo', 'oho', 'm2o'],
        dataSource: item.dataSource,
      },
    );

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
      },
      theme,
    ).open({
      initialValues: {},
    });
    insert(
      createCalendarBlockUISchema({
        collectionName: item.name,
        dataSource: item.dataSource,
        fieldNames: {
          ...values,
        },
      }),
    );
  };

  return { createCalendarBlock };
};
