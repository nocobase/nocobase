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

export const findGridSchema = (schema: Schema) => {
  const gridSchema = schema.reduceProperties(
    (schema, next) => schema || (next['x-component'] === 'Grid' && next),
  ) as Schema;
  return gridSchema;
};
