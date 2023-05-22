import { useValues } from '../../../schema-component/antd/filter/useValues';
import { useDateVariable } from './useDateVariable';
import { useFormVariable } from './useFormVariable';
import { useUserVariable } from './useUserVariable';

export const useVariableOptions = ({ blockForm, collectionField }) => {
  const { operator, schema } = useValues();
  const userVariable = useUserVariable({ operator, schema });
  const dateVariable = useDateVariable({ operator, schema });
  const formVariable = useFormVariable({ blockForm, collectionField, operator, schema });

  if (!operator || !schema) return [];

  return [userVariable, dateVariable, formVariable];
};
