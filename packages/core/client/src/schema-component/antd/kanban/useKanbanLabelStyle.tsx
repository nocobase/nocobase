import { Schema } from '@formily/react';

export const useKanbanLabelStyle = (schema: Schema) => {
  return schema['x-label-enabled']
    ? undefined
    : {
        display: 'none',
      };
};
