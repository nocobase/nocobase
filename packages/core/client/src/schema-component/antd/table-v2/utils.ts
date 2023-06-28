import { ISchema, Schema } from '@formily/react';

export const isCollectionFieldComponent = (schema: ISchema) => {
  return schema['x-component'] === 'CollectionField';
};

export const isColumnComponent = (schema: Schema) => {
  return schema['x-component']?.endsWith('.Column') > -1;
};

export function extractIndex(str) {
  const numbers = [];
  str?.split('.').forEach(function (element) {
    if (!isNaN(element)) {
      numbers.push(String(Number(element) + 1));
    }
  });
  return numbers.join('.');
}
