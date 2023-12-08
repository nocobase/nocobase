import { useField } from '@formily/react';
import { useMemo } from 'react';
import { useFilterVariable } from './filter';
import { useDateVariable, useUserVariable } from '@nocobase/client';

export const useVariableOptions = () => {
  const field = useField<any>();
  const { operator, schema } = field.data || {};
  const userVariable = useUserVariable({
    collectionField: { uiSchema: schema },
    uiSchema: schema,
  });
  const dateVariable = useDateVariable({ operator, schema });
  const filterVariable = useFilterVariable();

  const result = useMemo(
    () => [userVariable, dateVariable, filterVariable].filter(Boolean),
    [dateVariable, userVariable, filterVariable],
  );

  if (!operator || !schema) return [];

  return result;
};
