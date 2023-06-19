import { useMemo } from 'react';
import { useValues } from '../../../schema-component/antd/filter/useValues';
import { useDateVariable } from './useDateVariable';
import { useUserVariable } from './useUserVariable';

export const useVariableOptions = () => {
  const { operator, schema } = useValues();
  const userVariable = useUserVariable({ maxDepth: 3, schema });
  const dateVariable = useDateVariable({ operator, schema });

  const result = useMemo(() => [userVariable, dateVariable], [dateVariable, userVariable]);

  if (!operator || !schema) return [];

  return result;
};
