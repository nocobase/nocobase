import { useFieldSchema } from '@formily/react';
import { useMemo } from 'react';
import { useCollection, useCollectionManager } from '../../../collection-manager';
import { useRecord } from '../../../record-provider';

export default function useServiceOptions(props) {
  const { action = 'list', service, value } = props;
  const params = service?.params || {};
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection();
  const { getCollectionFields } = useCollectionManager();
  const record = useRecord();

  const collectionField = useMemo(() => {
    return getField(fieldSchema.name);
  }, [fieldSchema.name]);

  const filter = useMemo(() => {
    let extraFilter = params?.filter;
    if (collectionField && ['oho', 'o2m'].includes(collectionField.interface)) {
      const eqValue = record?.[collectionField.sourceKey];
      extraFilter = {
        $or: [
          {
            $and: [
              {
                [collectionField.foreignKey]: {
                  $is: null,
                },
              },
              params?.filter,
            ].filter(Boolean),
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
    return extraFilter;
  }, [params?.filter, getCollectionFields, collectionField, record]);

  return useMemo(() => {
    return {
      resource: collectionField?.target,
      action,
      ...service,
      params: { ...service?.params, filter },
    };
  }, [collectionField?.target, action, filter, service]);
}
