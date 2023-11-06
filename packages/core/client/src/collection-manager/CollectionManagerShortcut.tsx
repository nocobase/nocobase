import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import React from 'react';
import { SchemaComponent } from '../schema-component';
import {
  AddCategory,
  AddCategoryAction,
  AddCollection,
  AddCollectionAction,
  AddCollectionField,
  AddFieldAction,
  ConfigurationTable,
  ConfigurationTabs,
  EditCategory,
  EditCategoryAction,
  EditCollection,
  EditCollectionAction,
  EditCollectionField,
  EditFieldAction,
  OverridingCollectionField,
  OverridingFieldAction,
  SyncFieldsAction,
  SyncFieldsActionCom,
  ViewCollectionField,
  ViewFieldAction,
  SyncSQLFieldsAction,
  DeleteCollection,
  DeleteCollectionAction,
} from './Configuration';

import { CollectionCategroriesProvider } from './CollectionManagerProvider';

const schema: ISchema = {
  type: 'object',
  properties: {
    [uid()]: {
      'x-component': 'Action.Drawer',
      type: 'void',
      title: '{{t("Collections & Fields")}}',
      properties: {
        configuration: {
          'x-component': 'ConfigurationTable',
        },
      },
    },
  },
};

const schema2: ISchema = {
  type: 'object',
  properties: {
    [uid()]: {
      // 'x-decorator': 'CollectionCategroriesProvider',
      'x-component': 'ConfigurationTable',
    },
  },
};

export const CollectionManagerPane = () => {
  return (
    // <Card bordered={false}>
    <SchemaComponent
      schema={schema2}
      components={{
        CollectionCategroriesProvider,
        ConfigurationTable,
        ConfigurationTabs,
        AddFieldAction,
        AddCollectionField,
        AddCollection,
        AddCollectionAction,
        AddCategoryAction,
        AddCategory,
        EditCollection,
        EditCollectionAction,
        DeleteCollection,
        DeleteCollectionAction,
        EditFieldAction,
        EditCollectionField,
        OverridingCollectionField,
        OverridingFieldAction,
        ViewCollectionField,
        ViewFieldAction,
        EditCategory,
        EditCategoryAction,
        SyncFieldsAction,
        SyncFieldsActionCom,
        SyncSQLFieldsAction,
      }}
    />
    // </Card>
  );
};
