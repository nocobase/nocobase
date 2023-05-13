import { ISchema, Schema } from '@formily/react';
import { uid } from '@formily/shared';
export const gridItemWrap = (schema: ISchema) => {
  return {
    type: 'void',
    'x-component': 'MGrid.Item',
    properties: {
      [schema.name || uid()]: schema,
    },
  };
};

export const findSchema = (schema: Schema, component: string) => {
  const gridSchema = schema.reduceProperties(
    (schema, next) => schema || (next['x-component'] === component && next),
  ) as Schema;
  return gridSchema;
};
export const findGridSchema = (schema: Schema) => {
  return findSchema(schema, 'Grid');
};
