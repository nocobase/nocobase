import { useFieldSchema } from '@formily/react';
import { useCallback, useMemo } from 'react';
import { useCollection, useCollectionManager } from '../../../collection-manager';
import { useRecord } from '../../../record-provider';

export default function useServiceOptions(props) {
  const { action = 'list', service, fieldNames } = props;
  const params = service?.params || {};
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection();
  const { getCollectionFields } = useCollectionManager();
  const record = useRecord();
  const recordValue = record[fieldSchema.name];

  const normalizeValues = useCallback(
    (obj) => {
      if (obj && typeof obj === 'object') {
        return obj[fieldNames.value];
      }
      return obj;
    },
    [fieldNames.value],
  );

  const value = useMemo(() => {
    if (recordValue === undefined || recordValue === null) {
      return;
    }
    if (Array.isArray(recordValue)) {
      return recordValue.map(normalizeValues);
    } else {
      return normalizeValues(recordValue);
    }
  }, [recordValue, normalizeValues]);

  const collectionField = useMemo(() => {
    return getField(fieldSchema.name);
  }, [fieldSchema.name]);

  const sourceValue = record?.[collectionField?.sourceKey];
  const filter = useMemo(() => {
    const isOToAny = ['oho', 'o2m'].includes(collectionField?.interface);
    return {
      $or: [
        {
          $and: [
            isOToAny
              ? {
                  [collectionField.foreignKey]: {
                    $is: null,
                  },
                }
              : null,
            params?.filter,
          ],
        },
        isOToAny && sourceValue !== undefined && sourceValue !== null
          ? {
              [collectionField.foreignKey]: {
                $eq: sourceValue,
              },
            }
          : null,
        value
          ? {
              [fieldNames.value]: {
                [Array.isArray(value) ? '$in' : '$eq']: value,
              },
            }
          : null,
      ],
    };
  }, [params?.filter, getCollectionFields, collectionField, sourceValue, value, fieldNames.value]);

  return useMemo(() => {
    return {
      resource: collectionField?.target,
      action,
      ...service,
      params: { ...service?.params, filter },
    };
  }, [collectionField?.target, action, filter, service]);
}
