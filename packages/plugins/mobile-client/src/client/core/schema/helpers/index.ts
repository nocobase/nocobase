import { ISchema } from '@formily/react';
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
