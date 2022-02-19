import React from 'react';
import { SchemaComponentOptions } from '../';
import {
  CollectionField,
  CollectionFieldProvider,
  CollectionProvider,
  ResourceActionProvider,
  useDataSourceFromRAC
} from './';
import * as hooks from './action-hooks';

export const CollectionManagerSchemaComponentProvider: React.FC = (props) => {
  return (
    <SchemaComponentOptions
      scope={{ cm: { ...hooks, useDataSourceFromRAC } }}
      components={{ CollectionField, CollectionFieldProvider, CollectionProvider, ResourceActionProvider }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
};
