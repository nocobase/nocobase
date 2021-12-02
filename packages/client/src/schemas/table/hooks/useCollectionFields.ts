import { Schema } from '@formily/react';
import { isColumn } from '../utils';

export const useCollectionFields = (schema: Schema) => {
  const columns = schema.reduceProperties((columns, current) => {
    if (isColumn(current)) {
      if (current['x-hidden']) {
        return columns;
      }
      if (current['x-display'] && current['x-display'] !== 'visible') {
        return columns;
      }
      return [...columns, current];
    }
    return [...columns];
  }, []);

  return columns
    .map((column) => {
      const columnProps = column['x-component-props'] || {};
      return columnProps.fieldName;
    })
    .filter(Boolean);
};
