import { useMemo } from 'react';
import { useValues } from '../../../schema-component/antd/filter/useValues';
import { useDateVariable } from './useDateVariable';
import { useFormVariable } from './useFormVariable';
import { useIterationVariable } from './useIterationVariable';
import { useUserVariable } from './useUserVariable';

export const useVariableOptions = ({ form, collectionField, rootCollection }: any) => {
  const { operator, schema } = useValues();
  const userVariable = useUserVariable({ maxDepth: 3, schema });
  const dateVariable = useDateVariable({ operator, schema });
  const formVariabele = useFormVariable({ blockForm: form, schema, rootCollection });
  const iterationVariabele = useIterationVariable({
    blockForm: form,
    currentCollection: collectionField?.collectionName,
    schema,
    rootCollection,
  });

  const result = useMemo(
    () => [userVariable, dateVariable, formVariabele, iterationVariabele].filter(Boolean),
    [dateVariable, userVariable, formVariabele, iterationVariabele],
  );

  if (!operator || !schema) return [];

  return result;
};
