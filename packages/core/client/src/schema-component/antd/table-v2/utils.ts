import { ISchema, Schema } from '@formily/react';

export const isCollectionFieldComponent = (schema: ISchema) => {
  return schema['x-component'] === 'CollectionField' || schema['x-component'] === 'SnapshotField';
};

export const isColumnComponent = (schema: Schema) => {
  return schema['x-component']?.endsWith('.Column') > -1;
};
