import React from 'react';
import { SchemaComponentOptions } from '..';
import { ResourceActionProvider, useDataSourceFromRAC } from '.';
import * as hooks from './action-hooks';
import { DataSourceProvider, ds, SubFieldDataSourceProvider } from './sub-table';

export const CollectionManagerSchemaComponentProvider: React.FC = (props) => {
  return (
    <SchemaComponentOptions
      scope={{ cm: { ...hooks, useDataSourceFromRAC }, ds }}
      components={{
        SubFieldDataSourceProvider,
        DataSourceProvider,
        ResourceActionProvider,
      }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
};
