import { GeneralField } from '@formily/core';
import { useFieldSchema } from '@formily/react';
import cloneDeep from 'lodash/cloneDeep';
import { useCallback, useContext } from 'react';
import { useDesignable } from '../../hooks';
import { AssociationFieldContext } from './context';

export const useInsertSchema = (component) => {
  const fieldSchema = useFieldSchema();
  const { insertAfterBegin } = useDesignable();
  const insert = useCallback(
    (ss) => {
      const schema = fieldSchema.reduceProperties((buf, s) => {
        if (s['x-component'] === 'AssociationField.' + component) {
          return s;
        }
        return buf;
      }, null);
      if (!schema) {
        insertAfterBegin(cloneDeep(ss));
      }
    },
    [component],
  );
  return insert;
};

export function useAssociationFieldContext<F extends GeneralField>() {
  return useContext(AssociationFieldContext) as { options: any; field: F };
}