import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import React from 'react';
import {
  SchemaComponent,
  AddCollection,
  AddCollectionAction,
  AddCollectionField,
  AddFieldAction,
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
  CollectionCategroriesProvider,
} from '@nocobase/client';
import {
  AddCategory,
  AddCategoryAction,
  ConfigurationTable,
  ConfigurationTabs,
  EditCategory,
  EditCategoryAction,
} from './Configuration';

const schema2: ISchema = {
  type: 'object',
  properties: {
    [uid()]: {
      'x-component': 'ConfigurationTable',
    },
  },
};

export const MainDataSourceManager = () => {
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
