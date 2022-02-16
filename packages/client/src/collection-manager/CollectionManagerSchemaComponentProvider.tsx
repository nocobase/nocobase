import React from 'react';
import { SchemaComponentOptions } from '../';
import {
  CollectionField,
  CollectionFieldProvider,
  CollectionProvider,
  ResourceActionProvider,
  useDataSourceFromRAC
} from './';

export const CollectionManagerSchemaComponentProvider: React.FC = (props) => {
  return (
    <SchemaComponentOptions
      scope={{ useDataSourceFromRAC }}
      components={{ CollectionField, CollectionFieldProvider, CollectionProvider, ResourceActionProvider }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
};
