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
import { ConfigurationTable } from './ConfigurationTable';
import { ConfigurationTabs } from './ConfigurationTabs';

const schema2: ISchema = {
  type: 'object',
  properties: {
    [uid()]: {
      'x-component': 'ConfigurationTable',
    },
  },
};

export const CollectionManagerPage = () => {
  return (
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
        SyncFieldsAction,
        SyncFieldsActionCom,
        SyncSQLFieldsAction,
      }}
    />
  );
};
