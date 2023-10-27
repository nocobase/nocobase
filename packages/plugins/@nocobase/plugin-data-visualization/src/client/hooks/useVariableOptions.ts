import { useField } from '@formily/react';
import { useMemo } from 'react';
import { useDateVariable } from './useDateVariable';
import { useUserVariable } from './useUserVariable';
import { useFilterVariable } from './filter';

export const useVariableOptions = () => {
  const field = useField<any>();
  const { operator, schema } = field.data || {};
  const userVariable = useUserVariable({ schema });
  const dateVariable = useDateVariable({ schema });
  const filterVariable = useFilterVariable();

  const result = useMemo(
    () => [userVariable, dateVariable, filterVariable].filter(Boolean),
    [dateVariable, userVariable, filterVariable],
  );

  if (!operator || !schema) return [];

  return result;
};
