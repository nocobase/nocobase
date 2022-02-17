import React from 'react';
import { SchemaComponent } from '../../schema-component';
import { collectionSchema } from './schemas/collections';

export const ConfigurationTable = () => {
  return (
    <div>
      <SchemaComponent schema={collectionSchema} />
    </div>
  );
};
