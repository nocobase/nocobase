import { useFieldSchema } from '@formily/react';
import { useMemo } from 'react';
import { useCollection, useCollectionManager } from '../../../collection-manager';

export default function useServiceOptions(props) {
  const { action = 'list', service, params, value } = props;
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection();
  const { getCollectionFields } = useCollectionManager();

  const collectionField = useMemo(() => {
    return getField(fieldSchema.name);
  }, [fieldSchema.name]);

  const filter = useMemo(() => {
    if (!collectionField) return params?.filter;
    let extraFilter = {};
    if (['oho', 'o2m'].includes(collectionField.interface)) {
      const eqValue = typeof value === 'object' && value !== null ? value[props?.fieldNames?.value] : value;
      extraFilter = {
        $or: [
          {
            [collectionField.foreignKey]: {
              $is: null,
            },
          },
          eqValue !== undefined && eqValue !== null
            ? {
                [collectionField.foreignKey]: {
                  $eq: eqValue,
                },
              }
            : null,
        ].filter(Boolean),
      };
    }

    return params?.filter ? { $and: [extraFilter, params?.filter] } : extraFilter;
  }, [params?.filter, getCollectionFields, collectionField]);

  return useMemo(() => {
    return {
      resource: collectionField?.target,
      action,
      ...service,
      params: { ...service?.params, filter },
    };
  }, [collectionField?.target, action, filter, service]);
}
