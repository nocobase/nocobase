import { useField } from '@formily/react';
import { useCurrentUserVariable, useDateVariable } from '@nocobase/client';
import { useMemo } from 'react';
import { useFilterVariable } from './filter';

export const useVariableOptions = () => {
  const field = useField<any>();
  const { operator, schema } = field.data || {};
  const { currentUserSettings } = useCurrentUserVariable({
    collectionField: { uiSchema: schema },
    uiSchema: schema,
  });
  const dateVariable = useDateVariable({ operator, schema });
  const filterVariable = useFilterVariable();

  const result = useMemo(
    () => [currentUserSettings, dateVariable, filterVariable].filter(Boolean),
    [dateVariable, currentUserSettings, filterVariable],
  );

  if (!operator || !schema) return [];

  return result;
};
