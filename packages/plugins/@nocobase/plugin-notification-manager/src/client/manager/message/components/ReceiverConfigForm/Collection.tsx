/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import {
  FormItem,
  Input,
  Space,
  useDataSourceManager,
  useDataSourceKey,
  useCollectionDataSourceItems,
  SchemaComponent,
  ISchema,
} from '@nocobase/client';
import { Radio } from 'antd';
import { ObjectField as ObjectField } from '@formily/core';
import { ArrayField, Field, useField, observer } from '@formily/react';
import { useNotificationTranslation } from '../../../../locale';

const InnerCollectionForm = observer(() => {
  const { t } = useNotificationTranslation();
  const dm = useDataSourceManager();
  const dataSourceKey = useDataSourceKey();
  const field = useField<ObjectField>();
  const allDatasources = dm.getAllCollections({
    filterCollection: (collection) => collection.dataSource === dataSourceKey,
  });
  const currDatasource = allDatasources[0];
  const getSchema = () => {
    const getMenuOptions = (collections) => {
      return collections.map((collection) => ({ label: collection.options.title, value: collection.options.name }));
    };

    const getFieldOptions = (collection) => {
      if (Array.isArray(collection?.fields)) {
        return collection.fields.map((field) => ({ label: field.uiSchema.title, value: field.name }));
      } else return [];
    };

    const collectionOptions = getMenuOptions(currDatasource.collections);
    const fieldOptions =
      getFieldOptions(
        currDatasource.collections.filter((collection) => collection.options.name === field?.value?.collection),
      ) || [];
    const schema: ISchema = {
      type: 'object',
      name: '',
      properties: {
        collection: {
          type: 'string',
          title: 'Collection',
          enum: collectionOptions,
          default: null,
          'x-decorator': 'FormItem',
          'x-component': 'Select',
        },
        address: {
          type: 'string',
          title: 'address',
          enum: fieldOptions,
          default: null,
          'x-decorator': 'FormItem',
          'x-component': 'Select',
        },
      },
    };
    return schema;
    // return <SchemaComponent schema={schema} />;
  };
  const schema = getSchema();
  return <SchemaComponent schema={schema} />;
});
InnerCollectionForm.displayName = 'CollectionForm';

export const CollectionForm = InnerCollectionForm;
