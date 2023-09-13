import { useField } from '@formily/react';
import { useMemo } from 'react';
import { useDateVariable } from './useDateVariable';
import { useUserVariable } from './useUserVariable';

export const useVariableOptions = () => {
  const field = useField<any>();
  const { operator, schema } = field.data || {};
  const userVariable = useUserVariable({ schema });
  const dateVariable = useDateVariable({ operator, schema });

  const result = useMemo(() => [userVariable, dateVariable].filter(Boolean), [dateVariable, userVariable]);

  if (!operator || !schema) return [];

  return result;
};
