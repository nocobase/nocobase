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
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';

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
import { createGanttBlockUISchema } from './createGanttBlockUISchema';

export const GanttBlockInitializer = ({
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
  const { createGanttBlock } = useCreateGanttBlock();

  return (
    <DataBlockInitializer
      {...itemConfig}
      componentType={`Gantt`}
      icon={<FormOutlined />}
      onCreateBlockSchema={async (options) => {
        if (createBlockSchema) {
          return createBlockSchema(options);
        }
        createGanttBlock(options);
      }}
      onlyCurrentDataSource={onlyCurrentDataSource}
      hideSearch={hideSearch}
      filter={filterCollections}
      showAssociationFields={showAssociationFields}
    />
  );
};

export const useCreateGanttBlock = () => {
  const { insert } = useSchemaInitializer();
  const { t } = useTranslation();
  const { getCollectionFields } = useCollectionManager_deprecated();
  const options = useContext(SchemaOptionsContext);
  const { theme } = useGlobalTheme();

  const createGanttBlock = async ({ item }) => {
    const collectionFields = getCollectionFields(item.name, item.dataSource);
    const stringFields = collectionFields
      ?.filter((field) => field.type === 'string')
      ?.map((field) => {
        return {
          label: field?.uiSchema?.title,
          value: field.name,
        };
      });
    const dateFields = collectionFields
      ?.filter((field) => ['date', 'datetime', 'dateOnly', 'datetimeNoTz'].includes(field.type))
      ?.map((field) => {
        return {
          label: field?.uiSchema?.title,
          value: field.name,
        };
      });
    const numberFields = collectionFields
      ?.filter((field) => field.type === 'float')
      ?.map((field) => {
        return {
          label: field?.uiSchema?.title,
          value: field.name,
        };
      });
    const values = await FormDialog(
      t('Create gantt block'),
      () => {
        return (
          <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
            <FormLayout layout={'vertical'}>
              <SchemaComponent
                schema={{
                  properties: {
                    title: {
                      title: t('Title field'),
                      enum: stringFields,
                      required: true,
                      'x-component': 'Select',
                      'x-decorator': 'FormItem',
                    },
                    start: {
                      title: t('Start date field'),
                      enum: dateFields,
                      required: true,
                      default: 'createdAt',
                      'x-component': 'Select',
                      'x-decorator': 'FormItem',
                    },
                    end: {
                      title: t('End date field'),
                      enum: dateFields,
                      required: true,
                      'x-component': 'Select',
                      'x-decorator': 'FormItem',
                    },
                    progress: {
                      title: t('Progress field'),
                      enum: numberFields,
                      'x-component': 'Select',
                      'x-decorator': 'FormItem',
                    },
                    range: {
                      title: t('Time scale'),
                      enum: [
                        { label: '{{t("Hour")}}', value: 'hour', color: 'orange' },
                        { label: '{{t("Quarter of day")}}', value: 'quarterDay', color: 'default' },
                        { label: '{{t("Half of day")}}', value: 'halfDay', color: 'blue' },
                        { label: '{{t("Day")}}', value: 'day', color: 'yellow' },
                        { label: '{{t("Week")}}', value: 'week', color: 'pule' },
                        { label: '{{t("Month")}}', value: 'month', color: 'green' },
                        { label: '{{t("Year")}}', value: 'year', color: 'green' },
                        { label: '{{t("QuarterYear")}}', value: 'quarterYear', color: 'red' },
                      ],
                      default: 'day',
                      'x-component': 'Select',
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
      createGanttBlockUISchema({
        collectionName: item.name,
        dataSource: item.dataSource,
        fieldNames: {
          ...values,
        },
      }),
    );
  };

  return { createGanttBlock };
};

export function useCreateAssociationGanttBlock() {
  const { insert } = useSchemaInitializer();
  const { t } = useTranslation();
  const options = useContext(SchemaOptionsContext);
  const { theme } = useGlobalTheme();
  const { getCollectionFields } = useCollectionManager_deprecated();

  const createAssociationGanttBlock = async ({ item }) => {
    const field = item.associationField;

    const collectionFields = getCollectionFields(item.name, item.dataSource);
    const stringFields = collectionFields
      ?.filter((field) => field.type === 'string')
      ?.map((field) => {
        return {
          label: field?.uiSchema?.title,
          value: field.name,
        };
      });
    const dateFields = collectionFields
      ?.filter((field) => field.type === 'date')
      ?.map((field) => {
        return {
          label: field?.uiSchema?.title,
          value: field.name,
        };
      });
    const numberFields = collectionFields
      ?.filter((field) => field.type === 'float')
      ?.map((field) => {
        return {
          label: field?.uiSchema?.title,
          value: field.name,
        };
      });
    const values = await FormDialog(
      t('Create gantt block'),
      () => {
        return (
          <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
            <FormLayout layout={'vertical'}>
              <SchemaComponent
                schema={{
                  properties: {
                    title: {
                      title: t('Title field'),
                      enum: stringFields,
                      required: true,
                      'x-component': 'Select',
                      'x-decorator': 'FormItem',
                    },
                    start: {
                      title: t('Start date field'),
                      enum: dateFields,
                      required: true,
                      default: 'createdAt',
                      'x-component': 'Select',
                      'x-decorator': 'FormItem',
                    },
                    end: {
                      title: t('End date field'),
                      enum: dateFields,
                      required: true,
                      'x-component': 'Select',
                      'x-decorator': 'FormItem',
                    },
                    progress: {
                      title: t('Progress field'),
                      enum: numberFields,
                      'x-component': 'Select',
                      'x-decorator': 'FormItem',
                    },
                    range: {
                      title: t('Time scale'),
                      enum: [
                        { label: '{{t("Hour")}}', value: 'hour', color: 'orange' },
                        { label: '{{t("Quarter of day")}}', value: 'quarterDay', color: 'default' },
                        { label: '{{t("Half of day")}}', value: 'halfDay', color: 'blue' },
                        { label: '{{t("Day")}}', value: 'day', color: 'yellow' },
                        { label: '{{t("Week")}}', value: 'week', color: 'pule' },
                        { label: '{{t("Month")}}', value: 'month', color: 'green' },
                        { label: '{{t("Year")}}', value: 'year', color: 'green' },
                        { label: '{{t("QuarterYear")}}', value: 'quarterYear', color: 'red' },
                      ],
                      default: 'day',
                      'x-component': 'Select',
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
      createGanttBlockUISchema({
        association: `${field.collectionName}.${field.name}`,
        dataSource: item.dataSource,
        fieldNames: {
          ...values,
        },
      }),
    );
  };

  return { createAssociationGanttBlock };
}
